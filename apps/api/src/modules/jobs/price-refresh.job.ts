import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';

import { getAdapter } from '@jenosize/adapters';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PriceRefreshJob {
  private readonly log = new Logger(PriceRefreshJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refresh all offer prices every 6 hours by calling the adapter for each offer.
   * In dev (NODE_ENV !== 'production'), shorten to every 5 minutes for visibility.
   */
  @Cron(CronExpression.EVERY_6_HOURS, { name: 'priceRefresh' })
  async refreshAllPrices() {
    const start = Date.now();
    const offers = await this.prisma.offer.findMany();
    let updated = 0;
    let failed = 0;

    for (const offer of offers) {
      try {
        const adapter = getAdapter(offer.marketplace);
        const fresh = await adapter.fetchProduct(offer.externalId);
        await this.prisma.offer.update({
          where: { id: offer.id },
          data: {
            price: new Prisma.Decimal(fresh.price),
            storeName: fresh.storeName,
            currency: fresh.currency,
            externalUrl: fresh.url,
            lastCheckedAt: new Date(),
          },
        });
        updated += 1;
      } catch (e) {
        failed += 1;
        this.log.warn(
          `Refresh failed for offer ${offer.id} (${offer.marketplace}/${offer.externalId}): ${(e as Error).message}`,
        );
      }
    }
    this.log.log(
      `Price refresh complete in ${Date.now() - start}ms — updated=${updated} failed=${failed} total=${offers.length}`,
    );
  }
}
