import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from '@app/common';
import { EmailServiceModule } from 'apps/email-service/src/email-service.module';
import { seconds, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { CarModule } from './modules/car/car.module';
import { RentalModule } from './modules/rental/rental.module';

@Module({
  imports: [
    CommonModule.register(),
    UsersModule,
    AuthModule,
    EmailServiceModule,
    RentalModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'Global_Throttler',
            limit: configService.get<number>('THROTTLER_LIMIT'),
            ttl: seconds(configService.get<number>('THROTTLER_TTL')),
            blockDuration: seconds(
              configService.get<number>('THROTTLER_BLOCK_DURATION'),
            ),
          },
        ],
      }),
    }),
    CarModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ApiGatewayModule {}
