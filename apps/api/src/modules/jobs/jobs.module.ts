import { Module } from "@nestjs/common";
import { PriceRefreshJob } from "./price-refresh.job";
import { DailyAggregationJob } from "./daily-aggregation.job";

@Module({
  providers: [PriceRefreshJob, DailyAggregationJob],
  exports: [DailyAggregationJob],
})
export class JobsModule {}
