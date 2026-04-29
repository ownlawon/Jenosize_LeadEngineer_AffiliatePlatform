import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ImpressionsService {
  private readonly log = new Logger(ImpressionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Bulk-insert Impression rows. Filters linkIds against the Link table first so a
   * malicious caller can't pollute the table with rows that violate the FK
   * constraint (which would cascade-fail the whole batch). Unknown IDs are
   * silently dropped — this is a best-effort tracking endpoint, not a write API.
   */
  async recordBatch(
    linkIds: string[],
    meta: { referrer?: string; userAgent?: string; ip?: string },
  ): Promise<{ recorded: number }> {
    const unique = Array.from(new Set(linkIds));
    if (unique.length === 0) return { recorded: 0 };

    const existing = await this.prisma.link.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    const validIds = existing.map((l) => l.id);
    if (validIds.length === 0) return { recorded: 0 };

    const ipHash = meta.ip ? this.hashIp(meta.ip) : null;
    const result = await this.prisma.impression.createMany({
      data: validIds.map((linkId) => ({
        linkId,
        referrer: meta.referrer ?? null,
        userAgent: meta.userAgent ?? null,
        ipHash,
      })),
    });

    return { recorded: result.count };
  }

  private hashIp(ip: string): string {
    const salt = this.config.get<string>('IP_SALT') ?? 'jenosize-default-salt';
    return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 32);
  }
}
