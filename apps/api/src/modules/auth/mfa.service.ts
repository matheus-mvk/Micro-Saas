import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import * as qrcode from 'qrcode';

import { AppConfigService } from '../../config/app-config.service';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class MfaService {
  constructor(private readonly config: AppConfigService) {}

  generateSecret(): string {
    const bytes = randomBytes(20);
    let output = '';
    let bits = 0;
    let value = 0;

    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  otpauthUrl(input: { accountName: string; secret: string }): string {
    const label = encodeURIComponent(`${this.config.totpIssuer}:${input.accountName}`);
    const issuer = encodeURIComponent(this.config.totpIssuer);
    return `otpauth://totp/${label}?secret=${input.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  }

  async qrCodeDataUrl(otpauthUrl: string): Promise<string> {
    return qrcode.toDataURL(otpauthUrl, { errorCorrectionLevel: 'M', margin: 1, width: 192 });
  }

  verifyCode(secret: string, code: string, now = Date.now()): boolean {
    const normalized = code.replace(/\s+/g, '').toUpperCase();
    const timeStep = Math.floor(now / 30_000);

    for (const offset of [-1, 0, 1]) {
      if (safeEqual(normalized, this.generateTotp(secret, timeStep + offset))) {
        return true;
      }
    }

    return false;
  }

  generateRecoveryCodes(): string[] {
    return Array.from({ length: 10 }, () => `${randomChunk()}-${randomChunk()}`);
  }

  private generateTotp(secret: string, counter: number): string {
    const key = decodeBase32(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    const digest = createHmac('sha1', key).update(buffer).digest();
    const lastByte = digest.at(-1);
    if (lastByte === undefined) return '000000';
    const offset = lastByte & 0x0f;
    const b0 = digest[offset];
    const b1 = digest[offset + 1];
    const b2 = digest[offset + 2];
    const b3 = digest[offset + 3];
    if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) return '000000';
    const binary = ((b0 & 0x7f) << 24) | ((b1 & 0xff) << 16) | ((b2 & 0xff) << 8) | (b3 & 0xff);
    return String(binary % 1_000_000).padStart(6, '0');
  }
}

function decodeBase32(value: string): Buffer {
  let bits = 0;
  let current = 0;
  const bytes: number[] = [];

  for (const char of value.replace(/=+$/g, '').toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) continue;
    current = (current << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((current >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function randomChunk(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}
