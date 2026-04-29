import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Marketplace, Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { verifyHmac } from "../../common/hmac-verifier";
import { MarketplaceWebhookDto } from "./dto";

@Injectable()
export class WebhooksService {
  private readonly log = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Verify the signature against the marketplace's shared secret, then update
   * the matching Offer's price + lastCheckedAt. Throws 401 on signature
   * mismatch and 404 when no offer matches the externalId.
   *
   * In real life Lazada and Shopee push prices via webhook so the cron only
   * runs as a backstop. The mock adapter's price drift is simulated via
   * cron; this endpoint demonstrates the production-ready receive path.
   */
  async receive(
    marketplace: Marketplace,
    rawBody: string,
    signature: string | undefined,
    body: MarketplaceWebhookDto,
  ): Promise<{ updated: number }> {
    const secret = this.config.get<string>(`${marketplace}_WEBHOOK_SECRET`);
    if (!secret) {
      // Misconfiguration — fail closed rather than accepting unsigned payloads.
      throw new UnauthorizedException(
        `${marketplace} webhook secret not configured`,
      );
    }
    if (!signature || !verifyHmac(rawBody, signature, secret)) {
      throw new UnauthorizedException("Invalid signature");
    }

    const result = await this.prisma.offer.updateMany({
      where: { marketplace, externalId: body.externalId },
      data: {
        price: new Prisma.Decimal(body.price),
        ...(body.currency ? { currency: body.currency } : {}),
        ...(body.storeName ? { storeName: body.storeName } : {}),
        lastCheckedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        `No ${marketplace} offer found for externalId=${body.externalId}`,
      );
    }

    this.log.log(
      `${marketplace} webhook applied — externalId=${body.externalId} ` +
        `price=${body.price} updated=${result.count}`,
    );
    return { updated: result.count };
  }
}
