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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    JwtModule,
  ],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PayloadEncryptionMiddleware).forRoutes(AuthController);
  }
}
