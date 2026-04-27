import { Injectable } from '@nestjs/common';
import { Marketplace } from '@prisma/client';

import { DashboardSummary, TopProduct } from '@jenosize/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(): Promise<DashboardSummary> {
    const [
      totalClicks,
      totalLinks,
      totalProducts,
      totalCampaigns,
      byMarketplaceRows,
      byCampaignRows,
      last7,
    ] = await Promise.all([
      this.prisma.click.count(),
      this.prisma.link.count(),
      this.prisma.product.count(),
      this.prisma.campaign.count(),
      this.prisma.$queryRaw<Array<{ marketplace: Marketplace; clicks: bigint }>>`
        SELECT l."marketplace" AS marketplace, COUNT(c.*) AS clicks
        FROM "Link" l
        LEFT JOIN "Click" c ON c."linkId" = l."id"
        GROUP BY l."marketplace"
      `,
      this.prisma.$queryRaw<Array<{ id: string; name: string; clicks: bigint }>>`
        SELECT cm."id", cm."name", COUNT(c.*) AS clicks
        FROM "Campaign" cm
        LEFT JOIN "Link" l ON l."campaignId" = cm."id"
        LEFT JOIN "Click" c ON c."linkId" = l."id"
        GROUP BY cm."id", cm."name"
        ORDER BY clicks DESC
      `,
      this.prisma.$queryRaw<Array<{ day: Date; clicks: bigint }>>`
        SELECT DATE_TRUNC('day', "timestamp") AS day, COUNT(*) AS clicks
        FROM "Click"
        WHERE "timestamp" >= NOW() - INTERVAL '6 days'
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    return {
      totalClicks,
      totalLinks,
      totalProducts,
      totalCampaigns,
      byMarketplace: byMarketplaceRows.map((r) => ({
        marketplace: r.marketplace,
        clicks: Number(r.clicks),
      })),
      byCampaign: byCampaignRows.map((r) => ({
        campaignId: r.id,
        name: r.name,
        clicks: Number(r.clicks),
      })),
      clicksLast7Days: this.fillDays(last7),
    };
  }

  async topProducts(limit = 10): Promise<TopProduct[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; title: string; image_url: string; clicks: bigint }>
    >`
      SELECT p."id", p."title", p."imageUrl" AS image_url, COUNT(c.*) AS clicks
      FROM "Product" p
      LEFT JOIN "Link" l ON l."productId" = p."id"
      LEFT JOIN "Click" c ON c."linkId" = l."id"
      GROUP BY p."id", p."title", p."imageUrl"
      ORDER BY clicks DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      productId: r.id,
      title: r.title,
      imageUrl: r.image_url,
      clicks: Number(r.clicks),
    }));
  }

  /** Pad the last 7 days so the chart shows zeros for empty days. */
  private fillDays(rows: Array<{ day: Date; clicks: bigint }>) {
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = new Date(r.day).toISOString().slice(0, 10);
      map.set(key, Number(r.clicks));
    }
    const result: Array<{ date: string; clicks: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, clicks: map.get(key) ?? 0 });
    }
    return result;
  }
}
