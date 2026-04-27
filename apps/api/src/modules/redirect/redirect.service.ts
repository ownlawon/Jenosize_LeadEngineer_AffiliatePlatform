import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

interface CachedLink {
  linkId: string;
  targetUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

const CACHE_TTL_SECONDS = 300; // 5 min
const CACHE_KEY = (code: string) => `link:${code}`;

const ALLOWED_HOST_SUFFIXES = ['lazada.co.th', 'lazada.com', 'shopee.co.th', 'shopee.com'];

@Injectable()
export class RedirectService {
  private readonly log = new Logger(RedirectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Look up a short code, returning a fully-built target URL with UTM params appended.
   * Uses Redis cache (5-min TTL) on the hot path. Click logging is fire-and-forget
   * so it never blocks the redirect response.
   */
  async resolveAndTrack(
    shortCode: string,
    meta: { referrer?: string; userAgent?: string; ip?: string },
  ): Promise<string> {
    const cached = await this.redis.get<CachedLink>(CACHE_KEY(shortCode));
    let resolved: CachedLink;

    if (cached) {
      resolved = cached;
    } else {
      const link = await this.prisma.link.findUnique({
        where: { shortCode },
        include: { campaign: true },
      });
      if (!link) throw new NotFoundException('Link not found');

      resolved = {
        linkId: link.id,
        targetUrl: link.targetUrl,
        utmSource: link.campaign.utmSource,
        utmMedium: link.campaign.utmMedium,
        utmCampaign: link.campaign.utmCampaign,
      };
      // Best-effort cache write
      void this.redis.set(CACHE_KEY(shortCode), resolved, CACHE_TTL_SECONDS);
    }

    const safeUrl = this.appendUtm(resolved);

    // Fire-and-forget click insert. Error is swallowed (don't fail redirect).
    setImmediate(() => {
      const ipHash = meta.ip ? this.hashIp(meta.ip) : null;
      this.prisma.click
        .create({
          data: {
            linkId: resolved.linkId,
            referrer: meta.referrer ?? null,
            userAgent: meta.userAgent ?? null,
            ipHash,
          },
        })
        .catch((err) => this.log.warn(`Failed to record click: ${(err as Error).message}`));
    });

    return safeUrl;
  }

  private appendUtm(c: CachedLink): string {
    let target: URL;
    try {
      target = new URL(c.targetUrl);
    } catch {
      throw new BadRequestException('Stored target URL is not a valid URL');
    }

    if (!ALLOWED_HOST_SUFFIXES.some((suffix) => target.hostname.endsWith(suffix))) {
      // Defensive: refuse to redirect to anything other than the whitelisted marketplaces
      throw new BadRequestException(
        `Refusing to redirect to host ${target.hostname} — only Lazada/Shopee allowed`,
      );
    }

    target.searchParams.set('utm_source', c.utmSource);
    target.searchParams.set('utm_medium', c.utmMedium);
    target.searchParams.set('utm_campaign', c.utmCampaign);
    return target.toString();
  }

  private hashIp(ip: string): string {
    const salt = this.config.get<string>('IP_SALT') ?? 'jenosize-default-salt';
    return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex').slice(0, 32);
  }
}
