import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import request from 'supertest';
import cookieParser from 'cookie-parser';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * End-to-end test for the click-tracking redirect flow.
 *
 * Requires a running Postgres + Redis (DATABASE_URL / REDIS_URL).
 * In CI, GitHub Actions provisions these as service containers.
 */
describe('Redirect /go/:code (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let shortCode: string;
  let linkId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api', { exclude: ['go/:code', 'health'] });
    await app.init();

    prisma = app.get(PrismaService);

    // Clean test rows
    await prisma.click.deleteMany();
    await prisma.link.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.campaign.deleteMany();

    // Set up minimal data: 1 product, 1 offer, 1 campaign, 1 link
    const product = await prisma.product.create({
      data: { title: 'E2E Matcha', imageUrl: 'https://example.com/img.jpg' },
    });
    await prisma.offer.create({
      data: {
        productId: product.id,
        marketplace: 'LAZADA',
        storeName: 'Test Shop',
        price: new Prisma.Decimal(459),
        currency: 'THB',
        externalUrl: 'https://www.lazada.co.th/products/matcha-001.html',
        externalId: 'matcha-001',
      },
    });
    const campaign = await prisma.campaign.create({
      data: {
        name: 'E2E Campaign',
        utmCampaign: 'e2e_test',
        utmSource: 'jenosize',
        utmMedium: 'affiliate',
        startAt: new Date('2020-01-01'),
        endAt: new Date('2099-12-31'),
      },
    });
    const link = await prisma.link.create({
      data: {
        productId: product.id,
        campaignId: campaign.id,
        marketplace: 'LAZADA',
        shortCode: 'e2etest1',
        targetUrl: 'https://www.lazada.co.th/products/matcha-001.html',
      },
    });
    shortCode = link.shortCode;
    linkId = link.id;
  });

  afterAll(async () => {
    await prisma.click.deleteMany({ where: { linkId } });
    await prisma.link.deleteMany({ where: { id: linkId } });
    await app.close();
  });

  it('returns 302 with appended UTM params and target URL', async () => {
    const res = await request(app.getHttpServer()).get(`/go/${shortCode}`).expect(302);
    const location = res.headers.location as string;
    expect(location).toMatch(/^https:\/\/www\.lazada\.co\.th\/products\/matcha-001\.html/);
    expect(location).toContain('utm_source=jenosize');
    expect(location).toContain('utm_medium=affiliate');
    expect(location).toContain('utm_campaign=e2e_test');
  });

  it('records a Click row asynchronously', async () => {
    await request(app.getHttpServer())
      .get(`/go/${shortCode}`)
      .set('referer', 'https://example.com/test')
      .set('user-agent', 'jest-e2e-agent')
      .expect(302);

    // Click insert is fire-and-forget via setImmediate — wait briefly
    await new Promise((r) => setTimeout(r, 200));

    const click = await prisma.click.findFirst({
      where: { linkId, userAgent: 'jest-e2e-agent' },
      orderBy: { timestamp: 'desc' },
    });
    expect(click).toBeTruthy();
    expect(click?.referrer).toBe('https://example.com/test');
  });

  it('returns 404 for unknown short code', async () => {
    await request(app.getHttpServer()).get('/go/zzzzzzzz').expect(404);
  });
});
