import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Campaign } from '@prisma/client';

import { CampaignDto } from '@jenosize/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto } from './dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCampaignDto): Promise<CampaignDto> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (endAt <= startAt) {
      throw new BadRequestException('End date must be after start date');
    }
    const c = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        utmCampaign: dto.utmCampaign,
        utmSource: dto.utmSource ?? 'jenosize',
        utmMedium: dto.utmMedium ?? 'affiliate',
        startAt,
        endAt,
      },
    });
    return this.toDto(c);
  }

  async findAll(): Promise<CampaignDto[]> {
    const list = await this.prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
    return list.map((c) => this.toDto(c));
  }

  async findOne(id: string): Promise<CampaignDto & { links: unknown[] }> {
    const c = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        links: {
          include: {
            product: { include: { offers: true } },
            _count: { select: { clicks: true } },
          },
        },
      },
    });
    if (!c) throw new NotFoundException(`Campaign ${id} not found`);
    return {
      ...this.toDto(c),
      links: c.links.map((l) => ({
        id: l.id,
        shortCode: l.shortCode,
        marketplace: l.marketplace,
        targetUrl: l.targetUrl,
        clickCount: l._count.clicks,
        product: {
          id: l.product.id,
          title: l.product.title,
          imageUrl: l.product.imageUrl,
          offers: l.product.offers.map((o) => ({
            id: o.id,
            marketplace: o.marketplace,
            storeName: o.storeName,
            price: Number(o.price),
            currency: o.currency,
            externalUrl: o.externalUrl,
          })),
        },
      })),
    };
  }

  async remove(id: string): Promise<{ ok: true }> {
    const exists = await this.prisma.campaign.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`Campaign ${id} not found`);
    await this.prisma.campaign.delete({ where: { id } });
    return { ok: true };
  }

  private toDto(c: Campaign): CampaignDto {
    const now = new Date();
    return {
      id: c.id,
      name: c.name,
      utmSource: c.utmSource,
      utmMedium: c.utmMedium,
      utmCampaign: c.utmCampaign,
      startAt: c.startAt.toISOString(),
      endAt: c.endAt.toISOString(),
      active: c.startAt <= now && now <= c.endAt,
    };
  }
}
