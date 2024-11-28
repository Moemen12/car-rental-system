import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  DynamicModule,
  RequestMethod,
} from '@nestjs/common';
import { CommonService } from './common.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { JwtModule } from '@nestjs/jwt';
import { PayloadEncryptionMiddleware } from './middlewares/payload-encryption.middleware';
import { AuthController } from 'apps/api-gateway/src/modules/auth/auth.controller';
import { EncryptionModule } from './modules/encryption/encryption.module';
import { AuthGuard } from 'apps/api-gateway/src/modules/auth/guards/auth.guard';
import { UsersController } from 'apps/api-gateway/src/modules/users/users.controller';

@Global()
@Module({})
export class CommonModule implements NestModule {
  static register(): DynamicModule {
    return {
      global: true,
      module: CommonModule,
      imports: [
        EncryptionModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        DatabaseModule,
        JwtModule.registerAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET_KEY'),
            signOptions: {
              expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
            },
          }),
        }),
      ],
      providers: [CommonService, AuthGuard],
      exports: [
        CommonService,
        JwtModule,
        DatabaseModule,
        EncryptionModule,
        AuthGuard,
      ],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PayloadEncryptionMiddleware)
      .forRoutes(AuthController, UsersController);
  }
}
