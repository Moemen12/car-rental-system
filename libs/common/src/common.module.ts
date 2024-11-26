import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { CommonService } from './common.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';

import { JwtModule } from '@nestjs/jwt';
import { PayloadEncryptionMiddleware } from './middlewares/payload-encryption.middleware';
import { AuthController } from 'apps/api-gateway/src/modules/auth/auth.controller';
import { EncryptionModule } from './modules/encryption/encryption.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    EncryptionModule,
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    JwtModule,
    EmailModule,
  ],
  providers: [CommonService],
  exports: [CommonService, EmailModule],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PayloadEncryptionMiddleware).forRoutes(AuthController);
  }
}
