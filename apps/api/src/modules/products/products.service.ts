import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Marketplace, Offer, Prisma } from '@prisma/client';

import { detectMarketplace, getAdapter } from '@jenosize/adapters';
import { OfferDto, ProductDto } from '@jenosize/shared';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: { url: string; marketplace?: Marketplace }): Promise<ProductDto> {
    const marketplace: Marketplace | null = input.marketplace ?? detectMarketplace(input.url);
    if (!marketplace) {
      throw new BadRequestException(
        'Could not detect marketplace from URL. Provide a Lazada or Shopee URL or specify "marketplace" explicitly.',
      );
    }

    const adapter = getAdapter(marketplace);
    const parsed = adapter.parseUrl(input.url);
    if (!parsed) {
      throw new BadRequestException(`URL is not a valid ${marketplace} product URL`);
    }

    const fetched = await adapter.fetchProduct(parsed.externalId);

    // Upsert by (title, imageUrl) — we treat same-titled items as the same Product
    // and attach Offers per marketplace. In a real system, productId would come from
    // a canonical catalog; here we de-dup on title.
    const product = await this.prisma.product.upsert({
      where: { id: await this.findExistingProductIdByTitle(fetched.title) ?? '__none__' },
      update: {},
      create: {
        title: fetched.title,
        imageUrl: fetched.imageUrl,
      },
    });

    await this.prisma.offer.upsert({
      where: {
        productId_marketplace: { productId: product.id, marketplace },
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
      update: {
        storeName: fetched.storeName,
        price: new Prisma.Decimal(fetched.price),
        currency: fetched.currency,
        externalUrl: fetched.url,
        externalId: fetched.externalId,
        lastCheckedAt: new Date(),
      },
    });

    return this.findOne(product.id);
  }

  private async findExistingProductIdByTitle(title: string): Promise<string | null> {
    const existing = await this.prisma.product.findFirst({ where: { title } });
    return existing?.id ?? null;
  }

  async findAll(): Promise<ProductDto[]> {
    const products = await this.prisma.product.findMany({
      include: { offers: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => this.toProductDto(p, p.offers));
  }

  async findOne(id: string): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { offers: true },
    });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return this.toProductDto(product, product.offers);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const exists = await this.prisma.product.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Product ${id} not found`);
    await this.prisma.product.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Convert a Product + Offer[] to ProductDto, marking the lowest-price offer
   * with bestPrice: true. Pure function — kept here for unit-testability.
   */
  toProductDto(
    product: { id: string; title: string; imageUrl: string; createdAt: Date },
    offers: Offer[],
  ): ProductDto {
    const offerDtos = offers.map((o) => this.toOfferDto(o));
    const withBest = ProductsService.markBestPrice(offerDtos);
    return {
      id: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt.toISOString(),
      offers: withBest,
    };
  }

  toOfferDto(offer: Offer): OfferDto {
    return {
      id: offer.id,
      marketplace: offer.marketplace,
      storeName: offer.storeName,
      price: Number(offer.price),
      currency: offer.currency,
      externalUrl: offer.externalUrl,
      externalId: offer.externalId,
      lastCheckedAt: offer.lastCheckedAt.toISOString(),
    };
  }

  /** Mark the cheapest offer with bestPrice=true. Pure & deterministic. */
  static markBestPrice(offers: OfferDto[]): OfferDto[] {
    if (offers.length === 0) return offers;
    const min = offers.reduce((m, o) => (o.price < m ? o.price : m), Infinity);
    return offers.map((o) => ({ ...o, bestPrice: o.price === min }));
  }
}
