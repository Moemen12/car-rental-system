import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommonService } from './common.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';

import { JwtModule } from '@nestjs/jwt';
import { PayloadEncryptionMiddleware } from './middlewares/payload-encryption.middleware';
import { publicRoutes } from './utilities/constants';

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
    consumer.apply(PayloadEncryptionMiddleware).exclude(...publicRoutes);
  }
}
