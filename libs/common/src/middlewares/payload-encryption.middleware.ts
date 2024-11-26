import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { JwtService } from '@nestjs/jwt';
import { EncryptionService } from '../modules/encryption/encryption.service';

@Injectable()
export class PayloadEncryptionMiddleware implements NestMiddleware {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    console.log('middleware triggered');

    // Handle response encryption
    const originalJson = res.json;
    res.json = (body: any) => {
      if (body?.access_token) {
        const payload = this.jwtService.decode(body.access_token);
        if (payload && typeof payload === 'object') {
          // Get current timestamp
          const now = Math.floor(Date.now() / 1000);
          const fullPayload = {
            ...payload,
            iat: now,
            exp: now + 24 * 60 * 60, // 24 hours from now
          };

          // Encrypt everything as a single package
          const encryptedData = this.encryptionService.encrypt(fullPayload);
          const newToken = this.jwtService.sign(
            { encrypted: encryptedData },
            {
              secret: process.env.JWT_SECRET_KEY,
              // Don't include exp claim in the JWT options since it's in our encrypted payload
              noTimestamp: true,
            },
          );
          body.access_token = newToken;
        }
      }
      return originalJson.call(res, body);
    };

    // Handle request decryption
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const payload = this.jwtService.decode(token);
        if (payload && typeof payload === 'object' && payload.encrypted) {
          const decryptedData = this.encryptionService.decrypt(
            payload.encrypted,
          );

          // Verify expiration
          const now = Math.floor(Date.now() / 1000);
          if (decryptedData.exp && decryptedData.exp < now) {
            // Token has expired
            req['user_info'] = null;
          } else {
            req['user_info'] = decryptedData;
          }
        }
      } catch (error) {
        // Let the AuthGuard handle token validation errors
        throw error;
      }
    }

    next();
  }
}
