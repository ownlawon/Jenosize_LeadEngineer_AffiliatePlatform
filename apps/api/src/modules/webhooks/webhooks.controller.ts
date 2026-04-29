import { Body, Controller, Headers, HttpCode, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { MarketplaceWebhookDto } from "./dto";
import { WebhooksService } from "./webhooks.service";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post("lazada")
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Lazada webhook for Offer price updates. Body must be HMAC-SHA256 signed with LAZADA_WEBHOOK_SECRET; signature passed in `X-Signature: sha256=<hex>` header.",
  })
  async lazada(
    @Headers("x-signature") signature: string | undefined,
    @Body() body: MarketplaceWebhookDto,
    @Req() req: Request & { rawBody?: string },
  ) {
    return this.webhooks.receive(
      "LAZADA",
      req.rawBody ?? JSON.stringify(body),
      signature,
      body,
    );
  }

  @Post("shopee")
  @HttpCode(200)
  @ApiOperation({
    summary:
      "Shopee webhook for Offer price updates. Body must be HMAC-SHA256 signed with SHOPEE_WEBHOOK_SECRET; signature passed in `X-Signature: sha256=<hex>` header.",
  })
  async shopee(
    @Headers("x-signature") signature: string | undefined,
    @Body() body: MarketplaceWebhookDto,
    @Req() req: Request & { rawBody?: string },
  ) {
    return this.webhooks.receive(
      "SHOPEE",
      req.rawBody ?? JSON.stringify(body),
      signature,
      body,
    );
  }
}
