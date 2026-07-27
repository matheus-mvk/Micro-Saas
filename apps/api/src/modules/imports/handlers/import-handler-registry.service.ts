import { ImportType, type ImportFieldDefinitionDto, type ImportTemplateDto } from '@logistics/shared';
import { BadRequestException, Injectable } from '@nestjs/common';

import { CarrierImportHandler } from './carrier-import.handler';
import { CustomerImportHandler } from './customer-import.handler';
import type { ImportTypeHandler } from './import-handler.types';

@Injectable()
export class ImportHandlerRegistry {
  private readonly handlers: Map<ImportType, ImportTypeHandler>;

  constructor(
    customerHandler: CustomerImportHandler,
    carrierHandler: CarrierImportHandler,
  ) {
    this.handlers = new Map<ImportType, ImportTypeHandler>([
      [customerHandler.type, customerHandler],
      [carrierHandler.type, carrierHandler],
    ]);
  }

  get(type: ImportType): ImportTypeHandler {
    const handler = this.handlers.get(type);
    if (!handler) throw new BadRequestException('Tipo de importacao nao suportado.');
    return handler;
  }

  fields(type: ImportType): ImportFieldDefinitionDto[] {
    return this.get(type).fields;
  }

  autoMapping(type: ImportType, headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const headerSet = new Set(headers);
    for (const field of this.fields(type)) {
      const match = [field.key, ...field.aliases].find((alias) => headerSet.has(normalizeHeader(alias)));
      if (match) mapping[field.key] = normalizeHeader(match);
    }
    return mapping;
  }

  template(type: ImportType): ImportTemplateDto {
    const handler = this.get(type);
    const columns = handler.fields.map((field) => field.aliases[0] ?? field.key);
    const rows = [columns, ...handler.sampleRows];
    return {
      columns,
      csv: rows.map((row) => row.map(escapeCsv).join(',')).join('\n'),
      fields: handler.fields,
      type,
    };
  }
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

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
