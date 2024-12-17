import { throwCustomError } from '@app/common/utilities/general';
import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;
  private readonly iv: Buffer;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException('ENCRYPTION_KEY is not set.');
    }
    this.key = crypto.createHash('sha256').update(String(secretKey)).digest();
    this.iv = crypto.randomBytes(16); // IV for encryption
  }

  encrypt(data: any): string {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${this.iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): any {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted text format.');
      }

      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Try to parse the decrypted data as JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      // Log or handle specific decryption errors
      throwCustomError(
        'Decryption failed. Please verify the encryption key and data integrity.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
