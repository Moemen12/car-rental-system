import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET_KEY'),
        signOptions: {
          expiresIn: '1d',
        },
      }),
    }),
    ClientsModule.registerAsync([
      {
        inject: [ConfigService],
        name: 'USER_SERVICE',
        useFactory: (ConfigService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: ConfigService.get('USER_SERVICE_HOST'),
            port: ConfigService.get('USER_SERVICE_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [AuthController],
  exports: [JwtModule],
  providers: [AuthService],
})
export class AuthModule {}
