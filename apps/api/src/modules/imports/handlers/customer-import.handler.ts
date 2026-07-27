import { ImportRowStatus, ImportType } from '@logistics/shared';
import { Injectable } from '@nestjs/common';

import type { ImportRowProcessInput, ImportRowProcessResult, ImportTypeHandler } from './import-handler.types';

@Injectable()
export class CustomerImportHandler implements ImportTypeHandler {
  readonly type = ImportType.CUSTOMERS;
  readonly fields = [
    { aliases: ['nome', 'name', 'cliente', 'razao_social'], key: 'name', label: 'Nome', required: true },
    { aliases: ['documento', 'cpf_cnpj', 'cpf', 'cnpj', 'document'], key: 'document', label: 'CPF/CNPJ', required: true },
    { aliases: ['email', 'e_mail'], key: 'email', label: 'E-mail', required: false },
    { aliases: ['telefone', 'phone', 'celular'], key: 'phone', label: 'Telefone', required: false },
    { aliases: ['cep', 'postal_code'], key: 'postalCode', label: 'CEP', required: false },
    { aliases: ['cidade', 'city'], key: 'city', label: 'Cidade', required: false },
    { aliases: ['estado', 'uf', 'state'], key: 'state', label: 'Estado', required: false },
  ];
  readonly sampleRows = [
    ['Mercado Alpha', '11222333000181', 'operacoes@mercadoalpha.dev', '11999990000', '20040002', 'Rio de Janeiro', 'RJ'],
    ['Loja Beta', '12345678909', 'contato@lojabeta.dev', '21988887777', '30140071', 'Belo Horizonte', 'MG'],
  ];

  async processRow(input: ImportRowProcessInput): Promise<ImportRowProcessResult> {
    const data = {
      city: value(input, 'city'),
      document: onlyDigits(value(input, 'document')),
      email: normalizeEmail(value(input, 'email')),
      name: value(input, 'name'),
      phone: onlyDigits(value(input, 'phone')),
      postalCode: onlyDigits(value(input, 'postalCode')),
      state: value(input, 'state').toUpperCase(),
    };

    const validationError = validateCustomer(data);
    if (validationError) return error(validationError.code, validationError.message, data.document, data);
    if (input.seenReferences.has(data.document)) return error('DUPLICATE_IN_FILE', 'Documento duplicado dentro do arquivo.', data.document, data);
    input.seenReferences.add(data.document);

    const existing = await input.prisma.customer.findUnique({
      where: { tenantId_document: { document: data.document, tenantId: input.tenantId } },
    });

    if (existing && input.duplicateStrategy === 'FAIL') {
      return error('DUPLICATE_IN_TENANT', 'Cliente ja existe neste tenant.', data.document, data);
    }
    if (existing && input.duplicateStrategy === 'SKIP') {
      return { createdResourceId: existing.id, externalReference: data.document, normalizedData: data, status: ImportRowStatus.SKIPPED };
    }

    const customer = existing
      ? await input.prisma.customer.update({
          where: { id: existing.id },
          data: {
            active: true,
            email: data.email || null,
            name: data.name,
            phone: data.phone || null,
          },
        })
      : await input.prisma.customer.create({
          data: {
            active: true,
            document: data.document,
            email: data.email || null,
            name: data.name,
            phone: data.phone || null,
            tenantId: input.tenantId,
          },
        });

    if ((data.postalCode || data.city || data.state) && !existing) {
      await input.prisma.customerAddress.create({
        data: {
          active: true,
          city: data.city || 'Nao informado',
          country: 'BR',
          customerId: customer.id,
          delivery: true,
          main: true,
          postalCode: data.postalCode || '00000000',
          state: data.state || 'SP',
          street: 'Endereco importado',
          tenantId: input.tenantId,
        },
      });
    }

    return { createdResourceId: customer.id, externalReference: data.document, normalizedData: data, status: ImportRowStatus.SUCCESS };
  }
}

function value(input: ImportRowProcessInput, field: string): string {
  const source = input.mapping[field];
  return source ? input.row.values[source]?.trim() ?? '' : '';
}

function validateCustomer(data: { document: string; email: string; name: string; phone: string; postalCode: string; state: string }) {
  if (data.name.length < 2) return { code: 'NAME_REQUIRED', message: 'Nome obrigatorio.' };
  if (!isValidDocument(data.document)) return { code: 'INVALID_DOCUMENT', message: 'CPF/CNPJ invalido.' };
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { code: 'INVALID_EMAIL', message: 'E-mail invalido.' };
  if (data.postalCode && data.postalCode.length !== 8) return { code: 'INVALID_POSTAL_CODE', message: 'CEP deve possuir 8 digitos.' };
  if (data.state && data.state.length !== 2) return { code: 'INVALID_STATE', message: 'Estado deve possuir UF com 2 letras.' };
  return null;
}

function error(code: string, message: string, externalReference: string | null, normalizedData: Record<string, unknown>): ImportRowProcessResult {
  return { errorCode: code, errorMessage: message, externalReference, normalizedData, status: ImportRowStatus.ERROR };
}

function normalizeEmail(valueToNormalize: string): string {
  return valueToNormalize.trim().toLowerCase();
}

function onlyDigits(valueToNormalize: string): string {
  return valueToNormalize.replace(/\D/g, '');
}

function isValidDocument(document: string): boolean {
  if (document.length === 11) return isValidCpf(document);
  if (document.length === 14) return isValidCnpj(document);
  return false;
}

function isValidCpf(cpf: string): boolean {
  if (/^(\d)\1+$/.test(cpf)) return false;
  const digits = cpf.split('').map(Number);
  const first = checksum(digits.slice(0, 9), 10);
  const second = checksum([...digits.slice(0, 9), first], 11);
  return digits[9] === first && digits[10] === second;
}

function isValidCnpj(cnpj: string): boolean {
  if (/^(\d)\1+$/.test(cnpj)) return false;
  const digits = cnpj.split('').map(Number);
  const first = cnpjChecksum(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = cnpjChecksum([...digits.slice(0, 12), first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits[12] === first && digits[13] === second;
}

function checksum(numbers: number[], factor: number): number {
  const sum = numbers.reduce((total, number, index) => total + number * (factor - index), 0);
  const result = (sum * 10) % 11;
  return result === 10 ? 0 : result;
}

function cnpjChecksum(numbers: number[], weights: number[]): number {
  const sum = numbers.reduce((total, number, index) => total + number * (weights[index] ?? 0), 0);
  const result = sum % 11;
  return result < 2 ? 0 : 11 - result;
}
