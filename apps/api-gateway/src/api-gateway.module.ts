import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from '@app/common';

@Module({
  imports: [UsersModule, AuthModule, CommonModule],
  controllers: [],
  providers: [],
})
export class ApiGatewayModule {}
