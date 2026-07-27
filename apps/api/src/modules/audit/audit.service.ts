import { Injectable } from '@nestjs/common';
import { AuditAction, type Prisma } from '@prisma/client';

import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface AuditRecordInput {
  action: AuditAction;
  actorId?: string | undefined;
  entityId?: string | undefined;
  entityType?: string | undefined;
  ipHash?: string | undefined;
  metadata?: Prisma.InputJsonObject | undefined;
  requestId?: string | undefined;
  tenantId?: string | undefined;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditRecordInput): Promise<void> {
    const data: Prisma.AuditLogUncheckedCreateInput = {
      action: input.action,
    };

    if (input.actorId) data.actorId = input.actorId;
    if (input.entityId) data.entityId = input.entityId;
    if (input.entityType) data.entityType = input.entityType;
    if (input.ipHash) data.ipHash = input.ipHash;
    if (input.metadata) data.metadata = input.metadata;
    if (input.requestId) data.requestId = input.requestId;
    if (input.tenantId) data.tenantId = input.tenantId;

    await this.prisma.auditLog.create({
      data,
    });
  }
}
