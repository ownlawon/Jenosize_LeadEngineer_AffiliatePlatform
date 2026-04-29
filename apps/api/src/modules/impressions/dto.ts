import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class RecordImpressionsDto {
  @ApiProperty({
    description: 'Link IDs that became visible to the shopper. Cap at 50 per call to bound batch size.',
    type: [String],
    example: ['cl1234567890', 'cl0987654321'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  linkIds!: string[];
}
