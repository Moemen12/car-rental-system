import { Module } from '@nestjs/common';
import { EmailServiceController } from './email-service.controller';
import { EmailServiceService } from './email-service.service';

import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  controllers: [EmailServiceController],
  providers: [EmailServiceService],
  exports: [EmailServiceService],
})
export class EmailServiceModule {}
