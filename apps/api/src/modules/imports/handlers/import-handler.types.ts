import type { ImportFieldDefinitionDto, ImportRowStatus, ImportType } from '@logistics/shared';
import type { PrismaClient } from '@prisma/client';

import type { ParsedImportRow } from '../parsing/import-parser';

export interface ImportRowProcessInput {
  duplicateStrategy: 'SKIP' | 'UPDATE' | 'FAIL';
  mapping: Record<string, string>;
  prisma: PrismaClient;
  row: ParsedImportRow;
  seenReferences: Set<string>;
  tenantId: string;
}

export interface ImportRowProcessResult {
  createdResourceId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  externalReference?: string | null;
  normalizedData?: Record<string, unknown> | null;
  status: ImportRowStatus;
}

export interface ImportTypeHandler {
  fields: ImportFieldDefinitionDto[];
  sampleRows: string[][];
  type: ImportType;
  processRow(input: ImportRowProcessInput): Promise<ImportRowProcessResult>;
}
