import { PrismaClient, Marketplace, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

import { getAdapter } from '@jenosize/adapters';

const prisma = new PrismaClient();
const generateShortCode = customAlphabet(
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  8,
);

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@jenosize.test';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe!2025';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const hash = await bcrypt.hash(password, 12);
  return prisma.user.create({ data: { email, password: hash } });
}

async function ensureProductWithOffer(externalId: string, marketplace: Marketplace) {
  const adapter = getAdapter(marketplace);
  const fetched = await adapter.fetchProduct(externalId);

  const product = await prisma.product.upsert({
    where: { id: (await prisma.product.findFirst({ where: { title: fetched.title } }))?.id ?? '__none__' },
    update: {},
    create: { title: fetched.title, imageUrl: fetched.imageUrl },
  });

  await prisma.offer.upsert({
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

async function main() {
  await ensureAdmin();

  const productIds: string[] = [];
  for (const externalId of ['matcha-001', 'yoga-mat-77', 'wireless-earbuds-x9']) {
    const p1 = await ensureProductWithOffer(externalId, 'LAZADA');
    const p2 = await ensureProductWithOffer(externalId, 'SHOPEE');
    if (p1.id === p2.id) productIds.push(p1.id);
  }

  const summer = await prisma.campaign.upsert({
    where: { id: (await prisma.campaign.findFirst({ where: { name: 'Summer Deal 2025' } }))?.id ?? '__none__' },
    update: {},
    create: {
      name: 'Summer Deal 2025',
      utmCampaign: 'summer_deal_2025',
      utmSource: 'jenosize',
      utmMedium: 'affiliate',
      startAt: new Date('2025-06-01T00:00:00.000Z'),
      endAt: new Date('2026-12-31T23:59:59.000Z'),
    },
  });

  for (const productId of productIds) {
    for (const marketplace of ['LAZADA', 'SHOPEE'] as const) {
      const offer = await prisma.offer.findUnique({
        where: { productId_marketplace: { productId, marketplace } },
      });
      if (!offer) continue;
      const existing = await prisma.link.findUnique({
        where: {
          productId_campaignId_marketplace: {
            productId,
            campaignId: summer.id,
            marketplace,
          },
        },
      });
      if (existing) continue;
      await prisma.link.create({
        data: {
          productId,
          campaignId: summer.id,
          marketplace,
          shortCode: generateShortCode(),
          targetUrl: offer.externalUrl,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('✅ Seed complete');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
