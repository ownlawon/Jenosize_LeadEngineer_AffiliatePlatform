import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class CreateLinkDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  productId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  campaignId!: string;

  @ApiProperty({ enum: ['LAZADA', 'SHOPEE'] })
  @IsIn(['LAZADA', 'SHOPEE'])
  marketplace!: 'LAZADA' | 'SHOPEE';
}
