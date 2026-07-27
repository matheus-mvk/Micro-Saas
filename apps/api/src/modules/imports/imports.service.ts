import { createHash } from 'node:crypto';

import type {
  ImportJobDetailDto,
  ImportJobDto,
  ImportPreviewDto as SharedImportPreviewDto,
  ImportRowResultDto,
  ImportTemplateDto,
  ImportType as SharedImportType,
  PaginatedResult,
  UserRole,
} from '@logistics/shared';
import { ImportRowStatus as SharedImportRowStatus } from '@logistics/shared';
import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, ImportRowStatus, ImportStatus, ImportType as PrismaImportType, Prisma, type ImportJob, type User } from '@prisma/client';
import type { Queue } from 'bullmq';

import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IMPORT_QUEUE } from '../../infrastructure/queue/queue.module';
import { AuditService } from '../audit/audit.service';

import type { CreateImportDto, ImportRowsQueryDto, ListImportsDto, RetryImportDto } from './dto/import.dto';
import { ImportHandlerRegistry } from './handlers/import-handler-registry.service';
import { ImportParser } from './parsing/import-parser';
import { ImportFileStorageService } from './storage/import-file-storage.service';

export interface ImportQueuePayload {
  importJobId: string;
  tenantId: string;
  userId: string;
}

@Injectable()
export class ImportsService {
  constructor(
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
    private readonly handlers: ImportHandlerRegistry,
    private readonly parser: ImportParser,
    private readonly prisma: PrismaService,
    private readonly storage: ImportFileStorageService,
    @InjectQueue(IMPORT_QUEUE) private readonly queue: Queue<ImportQueuePayload>,
  ) {}

  async list(context: { role: UserRole; tenantId: string; userId: string }, query: ListImportsDto): Promise<PaginatedResult<ImportJobDto>> {
    const page = query.page;
    const perPage = query.perPage;
    const where = this.listWhere(context, query);
    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.importJob.findMany({
        where,
        include: { createdBy: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.importJob.count({ where }),
    ]);
    return { data: jobs.map(presentJob), meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  }

  preview(file: Express.Multer.File | undefined, dto: { type: SharedImportType }): SharedImportPreviewDto {
    const upload = this.validateUpload(file);
    const parsed = this.parser.parse({ buffer: upload.buffer, filename: upload.originalname, maxRows: this.config.importMaxRows });
    const mapping = this.handlers.autoMapping(dto.type, parsed.headers);
    const structuralErrors = missingRequiredFields(this.handlers.fields(dto.type), mapping);
    return {
      detectedHeaders: parsed.headers,
      duplicateHeaders: [],
      fields: this.handlers.fields(dto.type),
      mapping,
      previewRows: parsed.rows.slice(0, 10),
      structuralErrors,
      totalRows: parsed.rows.length,
      type: dto.type as unknown as SharedImportPreviewDto['type'],
    };
  }

  async create(context: { requestId?: string; tenantId: string; userId: string }, file: Express.Multer.File | undefined, dto: CreateImportDto): Promise<ImportJobDto> {
    const upload = this.validateUpload(file);
    const parsed = this.parser.parse({ buffer: upload.buffer, filename: upload.originalname, maxRows: this.config.importMaxRows });
    const mapping = normalizeMapping(dto.mapping);
    const structuralErrors = missingRequiredFields(this.handlers.fields(dto.type), mapping);
    if (structuralErrors.length > 0) throw new BadRequestException(structuralErrors.join(' '));
    const fileHash = createHash('sha256').update(upload.buffer).digest('hex');
    const duplicate = await this.prisma.importJob.findFirst({
      where: {
        fileHash,
        status: { in: [ImportStatus.PENDING, ImportStatus.PROCESSING, ImportStatus.COMPLETED] },
        tenantId: context.tenantId,
        type: dto.type as unknown as PrismaImportType,
      },
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' },
    });
    if (duplicate) return presentJob(duplicate);

    const stored = await this.storage.save({ buffer: upload.buffer, filename: upload.originalname, tenantId: context.tenantId });
    const job = await this.prisma.importJob.create({
      data: {
        createdById: context.userId,
        errorSummary: { structuralErrors: [] },
        fileHash,
        fileType: fileExtension(upload.originalname),
        filename: sanitizeFilename(upload.originalname),
        mapping,
        mimeType: upload.mimetype,
        options: { duplicateStrategy: dto.duplicateStrategy ?? 'UPDATE' },
        sizeBytes: stored.size,
        status: ImportStatus.PENDING,
        storedFilename: stored.key,
        tenantId: context.tenantId,
        totalRows: parsed.rows.length,
        type: dto.type as unknown as PrismaImportType,
      },
      include: { createdBy: true },
    });
    await this.queue.add('process-import', { importJobId: job.id, tenantId: context.tenantId, userId: context.userId }, { jobId: `import:${job.id}` });
    await this.audit.record({
      action: AuditAction.IMPORT_CREATED,
      actorId: context.userId,
      entityId: job.id,
      entityType: 'ImportJob',
      metadata: { filename: job.filename, rows: job.totalRows, type: job.type },
      requestId: context.requestId,
      tenantId: context.tenantId,
    });
    return presentJob(job);
  }

  async get(context: { role: UserRole; tenantId: string; userId: string }, importJobId: string, query: ImportRowsQueryDto): Promise<ImportJobDetailDto> {
    const job = await this.getAuthorizedJob(context, importJobId);
    const page = query.page;
    const perPage = query.perPage;
    const rowWhere: Prisma.ImportRowResultWhereInput = {
      importJobId,
      tenantId: context.tenantId,
      ...(query.status ? { status: query.status as ImportRowStatus } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.importRowResult.findMany({
        where: rowWhere,
        orderBy: { rowNumber: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.importRowResult.count({ where: rowWhere }),
    ]);
    return {
      ...presentJob(job),
      mapping: asStringRecord(job.mapping),
      options: asRecord(job.options),
      rows: { data: rows.map(presentRow), meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } },
    };
  }

  async cancel(context: { role: UserRole; tenantId: string; userId: string }, importJobId: string): Promise<ImportJobDto> {
    const job = await this.getAuthorizedJob(context, importJobId);
    if (!isCancelableStatus(job.status)) {
      throw new BadRequestException('Somente imports pendentes ou em processamento podem ser cancelados.');
    }
    try {
      await this.queue.remove(`import:${job.id}`);
    } catch {
      // Jobs already running are stopped cooperatively by the worker after it observes the CANCELED status.
    }
    const updated = await this.prisma.importJob.update({
      where: { id: job.id },
      data: { failureReason: 'Cancelado pelo usuario.', finishedAt: new Date(), status: ImportStatus.CANCELED },
      include: { createdBy: true },
    });
    await this.audit.record({ action: AuditAction.IMPORT_CANCELED, actorId: context.userId, entityId: job.id, entityType: 'ImportJob', tenantId: context.tenantId });
    return presentJob(updated);
  }

  async retry(context: { role: UserRole; tenantId: string; userId: string }, importJobId: string, dto: RetryImportDto): Promise<ImportJobDto> {
    const job = await this.getAuthorizedJob(context, importJobId);
    if (!isRetryableStatus(job.status)) throw new BadRequestException('Somente imports com falha ou cancelados podem ser repetidos.');
    await this.prisma.$transaction(async (tx) => {
      await tx.importRowResult.deleteMany({ where: { importJobId: job.id, tenantId: context.tenantId } });
      return tx.importJob.update({
        where: { id: job.id },
        data: {
          errorRows: 0,
          errorSummary: Prisma.JsonNull,
          failureReason: null,
          finishedAt: null,
          mapping: dto.mapping ? normalizeMapping(dto.mapping) : asStringRecord(job.mapping),
          options: { duplicateStrategy: dto.duplicateStrategy ?? String(asRecord(job.options).duplicateStrategy ?? 'UPDATE') },
          processedRows: 0,
          progress: 0,
          skippedRows: 0,
          startedAt: null,
          status: ImportStatus.PENDING,
          successRows: 0,
        },
        include: { createdBy: true },
      });
    });
    await this.queue.add('process-import', { importJobId: job.id, tenantId: context.tenantId, userId: context.userId }, { jobId: `import:${job.id}:retry:${Date.now()}` });
    await this.audit.record({ action: AuditAction.IMPORT_RETRIED, actorId: context.userId, entityId: job.id, entityType: 'ImportJob', tenantId: context.tenantId });
    return presentJob(await this.getAuthorizedJob(context, job.id));
  }

  async errorReport(context: { role: UserRole; tenantId: string; userId: string }, importJobId: string): Promise<{ content: string; filename: string }> {
    const job = await this.getAuthorizedJob(context, importJobId);
    const rows = await this.prisma.importRowResult.findMany({
      where: { importJobId: job.id, status: ImportRowStatus.ERROR, tenantId: context.tenantId },
      orderBy: { rowNumber: 'asc' },
      take: 5000,
    });
    await this.audit.record({ action: AuditAction.IMPORT_FILE_DOWNLOADED, actorId: context.userId, entityId: job.id, entityType: 'ImportJob', metadata: { report: 'errors' }, tenantId: context.tenantId });
    const csv = [['linha', 'referencia', 'codigo', 'erro'], ...rows.map((row) => [String(row.rowNumber), row.externalReference ?? '', row.errorCode ?? '', row.errorMessage ?? ''])]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\n');
    return { content: csv, filename: `import-${job.id}-erros.csv` };
  }

  template(type: SharedImportType): ImportTemplateDto {
    return this.handlers.template(type);
  }

  private validateUpload(file: Express.Multer.File | undefined): Express.Multer.File {
    if (!file) throw new BadRequestException('Arquivo obrigatorio.');
    if (file.size <= 0 || file.buffer.length <= 0) throw new BadRequestException('Arquivo vazio.');
    if (file.size > this.config.importMaxFileSizeBytes) throw new BadRequestException('Arquivo excede o tamanho maximo.');
    const extension = fileExtension(file.originalname);
    const allowedMime = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    if (!['csv', 'xlsx'].includes(extension) || !allowedMime.includes(file.mimetype)) {
      throw new BadRequestException('Formato de arquivo invalido. Envie CSV ou XLSX.');
    }
    createHash('sha256').update(file.buffer).digest('hex');
    return file;
  }

  private listWhere(context: { role: UserRole; tenantId: string; userId: string }, query: ListImportsDto): Prisma.ImportJobWhereInput {
    return {
      tenantId: context.tenantId,
      ...(context.role === 'OPERATOR' ? { createdById: context.userId } : {}),
      ...(query.status ? { status: query.status as ImportStatus } : {}),
      ...(query.type ? { type: query.type as unknown as PrismaImportType } : {}),
      ...(query.userId && context.role !== 'OPERATOR' ? { createdById: query.userId } : {}),
      ...(query.search?.trim() ? { filename: { contains: query.search.trim() } } : {}),
    };
  }

  private async getAuthorizedJob(context: { role: UserRole; tenantId: string; userId: string }, importJobId: string): Promise<ImportJob & { createdBy: User }> {
    const job = await this.prisma.importJob.findFirst({ where: { id: importJobId, tenantId: context.tenantId }, include: { createdBy: true } });
    if (!job) throw new NotFoundException('Importacao nao encontrada.');
    if (context.role === 'OPERATOR' && job.createdById !== context.userId) throw new ForbiddenException('Voce nao pode acessar esta importacao.');
    return job;
  }
}

function presentJob(job: ImportJob & { createdBy: User }): ImportJobDto {
  return {
    createdAt: job.createdAt.toISOString(),
    errorRows: job.errorRows,
    failureReason: job.failureReason,
    fileType: job.fileType,
    filename: job.filename,
    finishedAt: job.finishedAt?.toISOString() ?? null,
    id: job.id,
    mimeType: job.mimeType,
    processedRows: job.processedRows,
    progress: job.progress,
    sizeBytes: job.sizeBytes,
    skippedRows: job.skippedRows,
    startedAt: job.startedAt?.toISOString() ?? null,
    status: job.status as ImportJobDto['status'],
    successRows: job.successRows,
    totalRows: job.totalRows,
    type: job.type as ImportJobDto['type'],
    updatedAt: job.updatedAt.toISOString(),
    user: { email: job.createdBy.email, id: job.createdBy.id, name: job.createdBy.name },
  };
}

function presentRow(row: { createdResourceId: string | null; errorCode: string | null; errorMessage: string | null; externalReference: string | null; id: string; normalizedData: Prisma.JsonValue | null; rowNumber: number; status: ImportRowStatus }): ImportRowResultDto {
  return {
    createdResourceId: row.createdResourceId,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    externalReference: row.externalReference,
    id: row.id,
    normalizedData: asRecord(row.normalizedData),
    rowNumber: row.rowNumber,
    status: row.status as unknown as SharedImportRowStatus,
  };
}

function missingRequiredFields(fields: { key: string; label: string; required: boolean }[], mapping: Record<string, string>): string[] {
  return fields.filter((field) => field.required && !mapping[field.key]).map((field) => `Campo obrigatorio sem mapeamento: ${field.label}.`);
}

function normalizeMapping(mapping: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(mapping).filter(([, value]) => typeof value === 'string' && value.trim()).map(([key, value]) => [key, normalizeHeader(value)]));
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.\- ]+/g, '_').slice(0, 255) || 'import.csv';
}

function fileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asStringRecord(value: Prisma.JsonValue | null): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(asRecord(value))) {
    if (typeof item === 'string') result[key] = item;
  }
  return result;
}

function isCancelableStatus(status: ImportStatus): boolean {
  return status === ImportStatus.PENDING || status === ImportStatus.PROCESSING;
}

function isRetryableStatus(status: ImportStatus): boolean {
  return status === ImportStatus.FAILED || status === ImportStatus.CANCELED;
}

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
