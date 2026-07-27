import { ImportRowStatus, ImportType } from '@logistics/shared';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { ImportRowProcessInput, ImportRowProcessResult, ImportTypeHandler } from './import-handler.types';

@Injectable()
export class CarrierImportHandler implements ImportTypeHandler {
  readonly type = ImportType.CARRIERS;
  readonly fields = [
    { aliases: ['nome', 'name', 'transportadora', 'carrier'], key: 'name', label: 'Nome', required: true },
    { aliases: ['codigo', 'code', 'cod'], key: 'code', label: 'Codigo', required: true },
    { aliases: ['cnpj', 'documento', 'document'], key: 'document', label: 'CNPJ', required: false },
    { aliases: ['razao_social', 'legal_name'], key: 'legalName', label: 'Razao social', required: false },
    { aliases: ['email', 'e_mail'], key: 'email', label: 'E-mail', required: false },
    { aliases: ['telefone', 'phone'], key: 'phone', label: 'Telefone', required: false },
    { aliases: ['contato', 'contact', 'contact_name'], key: 'contactName', label: 'Contato', required: false },
    { aliases: ['site', 'website'], key: 'site', label: 'Site', required: false },
  ];
  readonly sampleRows = [
    ['Rapida Transportes', 'RAPIDA', '22333444000191', 'Rapida Transportes SA', 'contato@rapida.dev', '1133334444', 'Comercial', 'https://rapida.dev'],
    ['Economica Cargo', 'ECONOMICA', '33444555000144', 'Economica Cargo LTDA', 'ops@economica.dev', '1133335555', 'Operacoes', 'https://economica.dev'],
  ];

  async processRow(input: ImportRowProcessInput): Promise<ImportRowProcessResult> {
    const data = {
      code: normalizeCode(value(input, 'code')),
      contactName: value(input, 'contactName'),
      document: onlyDigits(value(input, 'document')),
      email: normalizeEmail(value(input, 'email')),
      legalName: value(input, 'legalName'),
      name: value(input, 'name'),
      phone: onlyDigits(value(input, 'phone')),
      site: value(input, 'site'),
    };

    const validationError = validateCarrier(data);
    const reference = data.code || data.document;
    if (validationError) return error(validationError.code, validationError.message, reference, data);
    if (input.seenReferences.has(reference)) return error('DUPLICATE_IN_FILE', 'Transportadora duplicada dentro do arquivo.', reference, data);
    input.seenReferences.add(reference);

    const existing = await findExistingCarrier(input, data);
    if (existing && input.duplicateStrategy === 'FAIL') {
      return error('DUPLICATE_IN_TENANT', 'Transportadora ja existe neste tenant.', reference, data);
    }
    if (existing && input.duplicateStrategy === 'SKIP') {
      return { createdResourceId: existing.id, externalReference: reference, normalizedData: data, status: ImportRowStatus.SKIPPED };
    }

    const payload: Prisma.CarrierUncheckedCreateInput = {
      active: true,
      code: data.code,
      contactName: data.contactName || null,
      document: data.document || null,
      email: data.email || null,
      legalName: data.legalName || null,
      name: data.name,
      phone: data.phone || null,
      site: data.site || null,
      tenantId: input.tenantId,
    };
    const carrier = existing
      ? await input.prisma.carrier.update({ where: { id: existing.id }, data: payload })
      : await input.prisma.carrier.create({ data: payload });

    return { createdResourceId: carrier.id, externalReference: reference, normalizedData: data, status: ImportRowStatus.SUCCESS };
  }
}

async function findExistingCarrier(input: ImportRowProcessInput, data: { code: string; document: string }) {
  if (data.code) {
    const byCode = await input.prisma.carrier.findUnique({ where: { tenantId_code: { code: data.code, tenantId: input.tenantId } } });
    if (byCode) return byCode;
  }
  if (data.document) {
    return input.prisma.carrier.findUnique({ where: { tenantId_document: { document: data.document, tenantId: input.tenantId } } });
  }
  return null;
}

function value(input: ImportRowProcessInput, field: string): string {
  const source = input.mapping[field];
  return source ? input.row.values[source]?.trim() ?? '' : '';
}

function validateCarrier(data: { code: string; document: string; email: string; name: string; site: string }) {
  if (data.name.length < 2) return { code: 'NAME_REQUIRED', message: 'Nome obrigatorio.' };
  if (data.code.length < 2) return { code: 'CODE_REQUIRED', message: 'Codigo obrigatorio.' };
  if (data.document && data.document.length !== 14) return { code: 'INVALID_CNPJ', message: 'CNPJ deve possuir 14 digitos.' };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { code: 'INVALID_EMAIL', message: 'E-mail invalido.' };
  if (data.site && !/^https?:\/\//i.test(data.site)) return { code: 'INVALID_SITE', message: 'Site deve iniciar com http:// ou https://.' };
  return null;
}

function error(code: string, message: string, externalReference: string | null, normalizedData: Record<string, unknown>): ImportRowProcessResult {
  return { errorCode: code, errorMessage: message, externalReference, normalizedData, status: ImportRowStatus.ERROR };
}

function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

function onlyDigits(input: string): string {
  return input.replace(/\D/g, '');
}
