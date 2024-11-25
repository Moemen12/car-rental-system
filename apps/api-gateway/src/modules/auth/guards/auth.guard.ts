import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { throwCustomError } from '@app/common/utilities/general';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throwCustomError('Unauthorized access. Please log in to continue.', 401);
    }

    try {
      await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET_KEY'),
      });

      const userInfo = request['user_info'];
      if (!userInfo) {
        throwCustomError('Token expired or invalid', 401);
      }

      // Check expiration from decrypted data
      const now = Math.floor(Date.now() / 1000);
      if (userInfo.exp && userInfo.exp < now) {
        throwCustomError('Token has expired', 401);
      }
    } catch {
      throwCustomError('Unauthorized access. Please log in to continue.', 401);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return undefined;
  }
}