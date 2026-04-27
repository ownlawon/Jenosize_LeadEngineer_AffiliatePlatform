import { Module } from '@nestjs/common';
import { PriceRefreshJob } from './price-refresh.job';

@Module({
  providers: [PriceRefreshJob],
})
export class JobsModule {}
