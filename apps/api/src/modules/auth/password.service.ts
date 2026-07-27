import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { Injectable } from '@nestjs/common';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const FORMAT = 'scrypt';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const key = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    return `${FORMAT}$${salt}$${key.toString('base64url')}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [format, salt, encodedKey] = storedHash.split('$');

    if (format !== FORMAT || !salt || !encodedKey) {
      return false;
    }

    const storedKey = Buffer.from(encodedKey, 'base64url');
    const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;

    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  }
}
