import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Summer Deal 2025' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'summer_deal_2025' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Matches(/^[a-zA-Z0-9_\-]+$/, {
    message: 'utmCampaign must be alphanumeric, underscore, or dash',
  })
  utmCampaign!: string;

  @ApiPropertyOptional({ example: 'jenosize' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  utmSource?: string;

  @ApiPropertyOptional({ example: 'affiliate' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  utmMedium?: string;

  @ApiProperty({ example: '2025-06-01T00:00:00.000Z' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ example: '2025-08-31T23:59:59.000Z' })
  @IsDateString()
  endAt!: string;
}
