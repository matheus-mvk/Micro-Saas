import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

import { BadRequestException, Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';

export interface StoredImportFile {
  hash: string;
  key: string;
  size: number;
}

@Injectable()
export class ImportFileStorageService {
  constructor(private readonly config: AppConfigService) {}

  async save(input: { buffer: Buffer; filename: string; tenantId: string }): Promise<StoredImportFile> {
    const extension = safeExtension(input.filename);
    const hash = createHash('sha256').update(input.buffer).digest('hex');
    const tenantDir = this.tenantDir(input.tenantId);
    await mkdir(tenantDir, { recursive: true });
    const key = `${randomUUID()}${extension}`;
    const target = this.safePath(input.tenantId, key);
    await writeFile(target, input.buffer, { flag: 'wx' });
    return { hash, key, size: input.buffer.length };
  }

  async read(tenantId: string, key: string): Promise<Buffer> {
    return readFile(this.safePath(tenantId, key));
  }

  private tenantDir(tenantId: string): string {
    return join(this.config.importStorageDir, tenantId);
  }

  private safePath(tenantId: string, key: string): string {
    if (key.includes('/') || key.includes('\\') || key.includes('..')) {
      throw new BadRequestException('Storage key invalida.');
    }
    const base = this.tenantDir(tenantId);
    const fullPath = normalize(join(base, key));
    if (!fullPath.startsWith(normalize(base))) {
      throw new BadRequestException('Storage key invalida.');
    }
    return fullPath;
  }
}

function safeExtension(filename: string): '.csv' | '.xlsx' {
  const extension = extname(filename).toLowerCase();
  if (extension === '.csv' || extension === '.xlsx') return extension;
  throw new BadRequestException('Formato nao suportado. Envie CSV ou XLSX.');
}
