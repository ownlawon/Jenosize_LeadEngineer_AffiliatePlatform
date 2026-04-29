import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

import { PrismaService } from "../../prisma/prisma.service";

/**
 * Pre-computes per-day Click + Impression totals into ClickDaily /
 * ImpressionDaily so the dashboard's 7-day chart can be served without
 * scanning the raw event tables.
 *
 * Runs at 00:05 UTC every day so the boundary moment is well past midnight
 * (gives in-flight writes a few minutes to land before we close the day).
 *
 * Idempotent: uses upsert on (date) so re-running never double-counts.
 *
 * The dashboard currently still queries raw Click for last-7-days; this job
 * populates the aggregation tables proactively so the dashboard's query
 * path can be switched without a backfill once raw-table volume warrants
 * it. ADR-009 covers the rollout strategy.
 */
@Injectable()
export class DailyAggregationJob {
  private readonly log = new Logger(DailyAggregationJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron("5 0 * * *", { name: "dailyAggregation", timeZone: "UTC" })
  async aggregateYesterday() {
    // Yesterday in UTC: midnight..midnight window.
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const start = Date.now();
    const result = await this.aggregateRange(yesterday, today);
    this.log.log(
      `Daily aggregation done in ${Date.now() - start}ms — ` +
        `date=${yesterday.toISOString().slice(0, 10)} ` +
        `clicks=${result.clicks} impressions=${result.impressions}`,
    );
  }

  /**
   * Aggregate `[from, to)` and upsert into the daily tables. Exposed so
   * the bootstrap or a one-off CLI command can backfill historical days.
   */
  async aggregateRange(
    from: Date,
    to: Date,
  ): Promise<{ clicks: number; impressions: number }> {
    const [clickCount, impressionCount] = await Promise.all([
      this.prisma.click.count({ where: { timestamp: { gte: from, lt: to } } }),
      this.prisma.impression.count({
        where: { timestamp: { gte: from, lt: to } },
      }),
    ]);

    await this.prisma.$transaction([
      this.prisma.clickDaily.upsert({
        where: { date: from },
        update: { count: clickCount },
        create: { date: from, count: clickCount },
      }),
      this.prisma.impressionDaily.upsert({
        where: { date: from },
        update: { count: impressionCount },
        create: { date: from, count: impressionCount },
      }),
    ]);

    return { clicks: clickCount, impressions: impressionCount };
  }
}
