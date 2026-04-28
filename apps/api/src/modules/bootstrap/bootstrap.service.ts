import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Marketplace, Prisma } from '@prisma/client';
import { customAlphabet } from 'nanoid';

import { getAdapter } from '@jenosize/adapters';
import { PrismaService } from '../../prisma/prisma.service';

const SHORT_CODE_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateShortCode = customAlphabet(SHORT_CODE_ALPHABET, 6);

/**
 * The auto-seed populates only the first half of the fixture catalogue so a
 * reviewer landing on /admin/products has both:
 *   • a populated demo to look at (3 products with both Lazada + Shopee
 *     offers + 1 campaign + 6 links + best-price badges)
 *   • net-new products to add via the Quick Samples row (Coffee, Skincare,
 *     Keyboard) — clicking those produces visible feedback in the table,
 *     instead of an upsert no-op against pre-existing rows.
 *
 * The other three SKUs still ship in packages/adapters fixtures and the
 * Quick Sample buttons; they're just not seeded by default.
 */
const SEED_EXTERNAL_IDS = [
  'matcha-001',
  'yoga-mat-77',
  'wireless-earbuds-x9',
];

/**
 * One-shot demo seeder. Runs on every container start, but only writes if the
 * database has zero products — so the first deploy pre-populates a working
 * demo (six products, one campaign, twelve affiliate links) and subsequent
 * boots are no-ops. Idempotent and safe to leave enabled in production: any
 * real product/campaign data would suppress the seed.
 */
@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly log = new Logger(BootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const productCount = await this.prisma.product.count();
    if (productCount > 0) {
      this.log.log(`Skipping demo seed — found ${productCount} existing products`);
      return;
    }

    this.log.log('Empty catalogue detected — seeding demo data');
    await this.seedAll();
  }

  /**
   * Wipe every domain row (Click → Link → Campaign → Offer → Product) and
   * re-seed from fixtures. Admin User rows are preserved so the operator
   * isn't logged out. Exposed so the admin "reset demo" endpoint can call
   * it on demand.
   */
  async wipeAndReseed(): Promise<{ products: number; links: number; clicks: number }> {
    this.log.warn('Resetting demo data — wiping clicks/links/campaigns/offers/products');
    // Order matters: respect FK chain — Click → Link → (Campaign, Offer) → Product
    const wipedClicks = await this.prisma.click.deleteMany();
    const wipedLinks = await this.prisma.link.deleteMany();
    await this.prisma.campaign.deleteMany();
    await this.prisma.offer.deleteMany();
    await this.prisma.product.deleteMany();
    const result = await this.seedAll();
    this.log.warn(
      `Reset complete — wiped ${wipedClicks.count} clicks + ${wipedLinks.count} links, ` +
        `re-seeded ${result.products} products + ${result.links} links`,
    );
    return { ...result, clicks: wipedClicks.count };
  }

  private async seedAll(): Promise<{ products: number; links: number }> {
    const productIds = await this.seedProductsAndOffers();
    const campaignId = await this.seedSummerCampaign();
    const linkCount = await this.seedLinks(productIds, campaignId);
    this.log.log(
      `Demo seed complete — ${productIds.length} products, 1 campaign, ${linkCount} links`,
    );
    return { products: productIds.length, links: linkCount };
  }

  private async seedProductsAndOffers(): Promise<string[]> {
    const ids: string[] = [];
    for (const externalId of SEED_EXTERNAL_IDS) {
      const lazada = await this.upsertProductWithOffer(externalId, 'LAZADA');
      const shopee = await this.upsertProductWithOffer(externalId, 'SHOPEE');
      // Same title across marketplaces → upsert merged into one product row.
      if (lazada.id === shopee.id) ids.push(lazada.id);
    }
    return ids;
  }

  private async upsertProductWithOffer(externalId: string, marketplace: Marketplace) {
    const adapter = getAdapter(marketplace);
    const fetched = await adapter.fetchProduct(externalId);

    const existingByTitle = await this.prisma.product.findFirst({
      where: { title: fetched.title },
    });

    const product = await this.prisma.product.upsert({
      where: { id: existingByTitle?.id ?? '__none__' },
      update: {},
      create: { title: fetched.title, imageUrl: fetched.imageUrl },
    });

    await this.prisma.offer.upsert({
      where: { productId_marketplace: { productId: product.id, marketplace } },
      update: {
        storeName: fetched.storeName,
        price: new Prisma.Decimal(fetched.price),
        currency: fetched.currency,
        externalUrl: fetched.url,
        externalId: fetched.externalId,
        lastCheckedAt: new Date(),
      },
      create: {
        productId: product.id,
        marketplace,
        storeName: fetched.storeName,
        price: new Prisma.Decimal(fetched.price),
        currency: fetched.currency,
        externalUrl: fetched.url,
        externalId: fetched.externalId,
      },
    });

    return product;
  }

  private async seedSummerCampaign(): Promise<string> {
    const existing = await this.prisma.campaign.findFirst({
      where: { name: 'Summer Deal 2025' },
    });
    if (existing) return existing.id;
    const c = await this.prisma.campaign.create({
      data: {
        name: 'Summer Deal 2025',
        utmCampaign: 'summer_deal_2025',
        utmSource: 'jenosize',
        utmMedium: 'affiliate',
        startAt: new Date('2025-06-01T00:00:00.000Z'),
        endAt: new Date('2026-12-31T23:59:59.000Z'),
      },
    });
    return c.id;
  }

  private async seedLinks(productIds: string[], campaignId: string): Promise<number> {
    let created = 0;
    for (const productId of productIds) {
      for (const marketplace of ['LAZADA', 'SHOPEE'] as const) {
        const offer = await this.prisma.offer.findUnique({
          where: { productId_marketplace: { productId, marketplace } },
        });
        if (!offer) continue;
        const existing = await this.prisma.link.findUnique({
          where: {
            productId_campaignId_marketplace: { productId, campaignId, marketplace },
          },
        });
        if (existing) continue;
        await this.prisma.link.create({
          data: {
            productId,
            campaignId,
            marketplace,
            shortCode: generateShortCode(),
            targetUrl: offer.externalUrl,
          },
        });
        created += 1;
      }
    }
    return created;
  }
}
