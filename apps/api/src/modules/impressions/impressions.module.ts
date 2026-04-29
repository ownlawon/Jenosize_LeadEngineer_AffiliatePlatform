import { Module } from '@nestjs/common';

import { ImpressionsController } from './impressions.controller';
import { ImpressionsService } from './impressions.service';

@Module({
  controllers: [ImpressionsController],
  providers: [ImpressionsService],
})
export class ImpressionsModule {}
