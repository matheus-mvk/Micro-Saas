import { ImportRowStatus as SharedImportRowStatus, type ImportProgressEventDto, type ImportType as SharedImportType } from '@logistics/shared';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { AuditAction, ImportRowStatus, ImportStatus, Prisma } from '@prisma/client';
import type { Job } from 'bullmq';

import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IMPORT_QUEUE } from '../../infrastructure/queue/queue.module';
import { NotificationsGateway } from '../../infrastructure/realtime/notifications.gateway';
import { AuditService } from '../audit/audit.service';

import { ImportHandlerRegistry } from './handlers/import-handler-registry.service';
import type { ImportQueuePayload } from './imports.service';
import { ImportParser } from './parsing/import-parser';
import { ImportFileStorageService } from './storage/import-file-storage.service';

@Injectable()
@Processor(IMPORT_QUEUE, { concurrency: 2 })
export class ImportsProcessor extends WorkerHost {
  constructor(
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
    private readonly handlers: ImportHandlerRegistry,
    private readonly notifications: NotificationsGateway,
    private readonly parser: ImportParser,
    private readonly prisma: PrismaService,
    private readonly storage: ImportFileStorageService,
  ) {
    super();
  }

  async process(job: Job<ImportQueuePayload>): Promise<void> {
    const payload = job.data;
    const importJob = await this.prisma.importJob.findFirst({ where: { id: payload.importJobId, tenantId: payload.tenantId } });
    if (!importJob?.storedFilename) return;

    await this.prisma.importJob.update({
      where: { id: importJob.id },
      data: { startedAt: new Date(), status: ImportStatus.PROCESSING },
    });
    await this.audit.record({ action: AuditAction.IMPORT_STARTED, actorId: payload.userId, entityId: importJob.id, entityType: 'ImportJob', tenantId: payload.tenantId });
    this.emit(payload.tenantId, payload.userId, eventPayload(importJob.id, importJob.type, ImportStatus.PROCESSING, importJob.totalRows, 0, 0, 0, 0));

    try {
      const buffer = await this.storage.read(payload.tenantId, importJob.storedFilename);
      const parsed = this.parser.parse({ buffer, filename: importJob.filename, maxRows: this.config.importMaxRows });
      const handler = this.handlers.get(importJob.type as unknown as SharedImportType);
      const mapping = asStringRecord(importJob.mapping);
      const duplicateStrategy = readDuplicateStrategy(importJob.options);
      const seenReferences = new Set<string>();
      let processedRows = 0;
      let successRows = 0;
      let errorRows = 0;
      let skippedRows = 0;

      for (const row of parsed.rows) {
        const current = await this.prisma.importJob.findUnique({ where: { id: importJob.id }, select: { status: true } });
        if (current?.status === ImportStatus.CANCELED) {
          this.emit(payload.tenantId, payload.userId, eventPayload(importJob.id, importJob.type, ImportStatus.CANCELED, parsed.rows.length, processedRows, successRows, errorRows, skippedRows));
          return;
        }

        const result = await handler.processRow({
          duplicateStrategy,
          mapping,
          prisma: this.prisma,
          row,
          seenReferences,
          tenantId: payload.tenantId,
        });
        processedRows += 1;
        if (result.status === SharedImportRowStatus.SUCCESS) successRows += 1;
        if (result.status === SharedImportRowStatus.ERROR) errorRows += 1;
        if (result.status === SharedImportRowStatus.SKIPPED) skippedRows += 1;

        await this.prisma.importRowResult.create({
          data: {
            createdResourceId: result.createdResourceId ?? null,
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
            externalReference: result.externalReference ?? null,
            importJobId: importJob.id,
            normalizedData: result.normalizedData === undefined || result.normalizedData === null ? Prisma.JsonNull : result.normalizedData as Prisma.InputJsonObject,
            rowNumber: row.rowNumber,
            status: result.status as unknown as ImportRowStatus,
            tenantId: payload.tenantId,
          },
        });

        const progress = progressPercent(processedRows, parsed.rows.length);
        await this.prisma.importJob.update({
          where: { id: importJob.id },
          data: {
            errorRows,
            processedRows,
            progress,
            skippedRows,
            successRows,
            totalRows: parsed.rows.length,
          },
        });
        this.emit(payload.tenantId, payload.userId, eventPayload(importJob.id, importJob.type, ImportStatus.PROCESSING, parsed.rows.length, processedRows, successRows, errorRows, skippedRows));
      }

      const finalStatus = errorRows > 0 && successRows === 0 ? ImportStatus.FAILED : ImportStatus.COMPLETED;
      await this.prisma.importJob.update({
        where: { id: importJob.id },
        data: {
          errorRows,
          errorSummary: errorRows > 0 ? { message: `${errorRows} linha(s) com erro.` } : Prisma.JsonNull,
          failureReason: finalStatus === ImportStatus.FAILED ? 'Todas as linhas falharam.' : null,
          finishedAt: new Date(),
          processedRows,
          progress: 100,
          skippedRows,
          status: finalStatus,
          successRows,
          totalRows: parsed.rows.length,
        },
      });
      await this.audit.record({
        action: finalStatus === ImportStatus.COMPLETED ? AuditAction.IMPORT_COMPLETED : AuditAction.IMPORT_FAILED,
        actorId: payload.userId,
        entityId: importJob.id,
        entityType: 'ImportJob',
        metadata: { errorRows, processedRows, skippedRows, successRows },
        tenantId: payload.tenantId,
      });
      this.emit(payload.tenantId, payload.userId, eventPayload(importJob.id, importJob.type, finalStatus, parsed.rows.length, processedRows, successRows, errorRows, skippedRows));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida ao processar importacao.';
      await this.prisma.importJob.update({
        where: { id: importJob.id },
        data: { failureReason: message.slice(0, 500), finishedAt: new Date(), status: ImportStatus.FAILED },
      });
      await this.audit.record({ action: AuditAction.IMPORT_FAILED, actorId: payload.userId, entityId: importJob.id, entityType: 'ImportJob', metadata: { message: message.slice(0, 160) }, tenantId: payload.tenantId });
      this.emit(payload.tenantId, payload.userId, eventPayload(importJob.id, importJob.type, ImportStatus.FAILED, importJob.totalRows, importJob.processedRows, importJob.successRows, importJob.errorRows, importJob.skippedRows));
      throw error;
    }
  }

  private emit(tenantId: string, userId: string, payload: ImportProgressEventDto): void {
    const eventName = eventNameFor(payload.status);
    this.notifications.emitImportEvent(tenantId, eventName, payload as unknown as Record<string, unknown>, userId);
    if (isFinalImportStatus(payload.status)) {
      this.notifications.emitDashboardRefresh(tenantId, 'import');
    }
  }
}

function isFinalImportStatus(status: ImportProgressEventDto['status']): boolean {
  return status === ImportStatus.COMPLETED || status === ImportStatus.FAILED || status === ImportStatus.CANCELED;
}

function eventPayload(importJobId: string, type: string, status: ImportStatus, totalRows: number, processedRows: number, successRows: number, errorRows: number, skippedRows: number): ImportProgressEventDto {
  return {
    errorRows,
    importJobId,
    processedRows,
    progress: progressPercent(processedRows, totalRows),
    skippedRows,
    status: status as ImportProgressEventDto['status'],
    successRows,
    timestamp: new Date().toISOString(),
    totalRows,
    type: type as ImportProgressEventDto['type'],
  };
}

function progressPercent(processedRows: number, totalRows: number): number {
  return totalRows <= 0 ? 0 : Math.min(100, Math.round((processedRows / totalRows) * 100));
}

function eventNameFor(status: ImportStatus): string {
  if (status === ImportStatus.COMPLETED) return 'import.completed';
  if (status === ImportStatus.FAILED) return 'import.failed';
  if (status === ImportStatus.CANCELED) return 'import.cancelled';
  if (status === ImportStatus.PROCESSING) return 'import.progress';
  return 'import.started';
}

function asStringRecord(value: Prisma.JsonValue | null): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => typeof entry === 'string')) as Record<string, string>;
}

function readDuplicateStrategy(value: Prisma.JsonValue | null): 'SKIP' | 'UPDATE' | 'FAIL' {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'UPDATE';
  const strategy = (value as Record<string, unknown>).duplicateStrategy;
  return strategy === 'SKIP' || strategy === 'FAIL' || strategy === 'UPDATE' ? strategy : 'UPDATE';
}
