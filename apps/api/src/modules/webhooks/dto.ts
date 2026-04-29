import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

/**
 * Marketplace webhook payload — what real Lazada/Shopee Open Platform
 * webhooks would send when a SKU's price changes. We accept a subset
 * (the fields the Offer table actually stores) so the contract is
 * forward-compatible.
 */
export class MarketplaceWebhookDto {
  @ApiProperty({ example: "matcha-001", description: "Marketplace SKU" })
  @IsString()
  @MinLength(1)
  externalId!: string;

  @ApiProperty({ example: 449.0 })
  @IsNumber()
  @Min(0)
  @Max(10_000_000)
  price!: number;

  @ApiProperty({ required: false, example: "THB" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, example: "Acme Tea Co." })
  @IsOptional()
  @IsString()
  storeName?: string;
}
