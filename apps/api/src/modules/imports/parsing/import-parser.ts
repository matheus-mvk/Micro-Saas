import { BadRequestException, Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';

export interface ParsedImportFile {
  headers: string[];
  rows: ParsedImportRow[];
}

export interface ParsedImportRow {
  rowNumber: number;
  values: Record<string, string>;
}

@Injectable()
export class ImportParser {
  parse(input: { buffer: Buffer; filename: string; maxRows: number }): ParsedImportFile {
    const extension = extensionOf(input.filename);
    const parsed = extension === 'csv' ? parseCsv(input.buffer) : parseXlsx(input.buffer);
    validateParsedFile(parsed, input.maxRows);
    return parsed;
  }
}

function parseCsv(buffer: Buffer): ParsedImportFile {
  const content = stripBom(buffer.toString('utf8'));
  const rows = parseDelimited(content);
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = normalizeHeaders(rows[0] ?? []);
  return {
    headers,
    rows: rows.slice(1).flatMap((cells, index) => toParsedRow(headers, cells, index + 2)),
  };
}

function parseXlsx(buffer: Buffer): ParsedImportFile {
  let workbook: xlsx.WorkBook;
  try {
    workbook = xlsx.read(buffer, { cellFormula: false, cellText: false, cellDates: true, raw: false, type: 'buffer' });
  } catch {
    throw new BadRequestException('Arquivo XLSX invalido ou corrompido.');
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { headers: [], rows: [] };
  const rows = xlsx.utils.sheet_to_json<string[]>(sheet, { blankrows: false, defval: '', header: 1, raw: false });
  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = normalizeHeaders(rows[0] ?? []);
  return {
    headers,
    rows: rows.slice(1).flatMap((cells, index) => toParsedRow(headers, cells, index + 2)),
  };
}

function validateParsedFile(parsed: ParsedImportFile, maxRows: number): void {
  if (parsed.headers.length === 0) throw new BadRequestException('O arquivo precisa conter cabecalhos.');
  if (parsed.rows.length === 0) throw new BadRequestException('O arquivo nao contem linhas de dados.');
  if (parsed.rows.length > maxRows) throw new BadRequestException(`O arquivo excede o limite de ${maxRows} linhas.`);
  const duplicate = findDuplicate(parsed.headers);
  if (duplicate) throw new BadRequestException(`Cabecalho duplicado: ${duplicate}.`);
  for (const row of parsed.rows) {
    for (const value of Object.values(row.values)) {
      if (/^[=+\-@]/.test(value.trim())) {
        throw new BadRequestException(`Formula perigosa detectada na linha ${row.rowNumber}.`);
      }
    }
  }
}

function toParsedRow(headers: string[], cells: unknown[], rowNumber: number): ParsedImportRow[] {
  const values = Object.fromEntries(headers.map((header, index) => [header, normalizeCell(cells[index])]));
  const hasData = Object.values(values).some((value) => value.trim().length > 0);
  return hasData ? [{ rowNumber, values }] : [];
}

function normalizeHeaders(cells: unknown[]): string[] {
  return cells.map((cell) => normalizeHeader(normalizeCell(cell))).filter(Boolean);
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

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function extensionOf(filename: string): 'csv' | 'xlsx' {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'csv' || extension === 'xlsx') return extension;
  throw new BadRequestException('Formato nao suportado. Envie CSV ou XLSX.');
}

function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function parseDelimited(input: string): string[][] {
  const delimiter = detectDelimiter(input);
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && char === delimiter) {
      row.push(current);
      current = '';
      continue;
    }
    if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(current);
      rows.push(row);
      current = '';
      row = [];
      continue;
    }
    current += char ?? '';
  }

  row.push(current);
  rows.push(row);
  return rows.filter((cells) => cells.some((cell) => cell.trim().length > 0));
}

function detectDelimiter(input: string): ',' | ';' {
  const firstLine = input.split(/\r?\n/, 1)[0] ?? '';
  const commas = (firstLine.match(/,/g) ?? []).length;
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ';' : ',';
}

function findDuplicate(values: string[]): string | null {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}
