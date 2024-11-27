import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from '@app/common';
import { EmailServiceModule } from 'apps/email-service/src/email-service.module';

@Module({
  imports: [UsersModule, AuthModule, CommonModule, EmailServiceModule],
  controllers: [],
  providers: [],
})
export class ApiGatewayModule {}
