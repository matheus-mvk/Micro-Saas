import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

import { BadRequestException, Injectable } from '@nestjs/common';

import { AppConfigService } from '../../config/app-config.service';

export interface StoredCarrierImage {
  hash: string;
  key: string;
  size: number;
}

const mimeByExtension: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

@Injectable()
export class CarrierImageStorageService {
  constructor(private readonly config: AppConfigService) {}

  /** Stores a small carrier image in tenant-scoped local storage for synchronous uploads. */
  async save(input: { buffer: Buffer; carrierId: string; filename: string; tenantId: string }): Promise<StoredCarrierImage> {
    const extension = safeImageExtension(input.filename);
    const hash = createHash('sha256').update(input.buffer).digest('hex');
    const tenantDir = this.tenantDir(input.tenantId, input.carrierId);
    await mkdir(tenantDir, { recursive: true });
    const key = `${input.carrierId}/${randomUUID()}${extension}`;
    await writeFile(this.safePath(input.tenantId, key), input.buffer, { flag: 'wx' });
    return { hash, key, size: input.buffer.length };
  }

  /** Reads a previously stored carrier image after the caller has already validated tenant access. */
  async read(tenantId: string, key: string): Promise<{ buffer: Buffer; contentType: string }> {
    return { buffer: await readFile(this.safePath(tenantId, key)), contentType: contentTypeFor(key) };
  }

  private tenantDir(tenantId: string, carrierId: string): string {
    return join(this.config.imageStorageDir, tenantId, carrierId);
  }

  private safePath(tenantId: string, key: string): string {
    if (key.includes('\\') || key.includes('..')) {
      throw new BadRequestException('Chave de imagem inválida.');
    }
    const base = join(this.config.imageStorageDir, tenantId);
    const fullPath = normalize(join(base, key));
    if (!fullPath.startsWith(normalize(base))) {
      throw new BadRequestException('Chave de imagem inválida.');
    }
    return fullPath;
  }
}

function contentTypeFor(key: string): string {
  return mimeByExtension[extname(key).toLowerCase()] ?? 'application/octet-stream';
}

function safeImageExtension(filename: string): '.jpg' | '.jpeg' | '.png' | '.webp' {
  const extension = extname(filename).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg' || extension === '.png' || extension === '.webp') return extension;
  throw new BadRequestException('Formato não suportado. Envie PNG, JPG ou WebP.');
}
