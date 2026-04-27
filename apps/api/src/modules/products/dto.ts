import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Lazada or Shopee product URL, or raw SKU/externalId',
    example: 'https://www.lazada.co.th/products/matcha-001.html',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2048)
  url!: string;

  @ApiProperty({
    description: 'Optional explicit marketplace; auto-detected if omitted',
    enum: ['LAZADA', 'SHOPEE'],
    required: false,
  })
  @IsOptional()
  @IsIn(['LAZADA', 'SHOPEE'])
  marketplace?: 'LAZADA' | 'SHOPEE';
}
