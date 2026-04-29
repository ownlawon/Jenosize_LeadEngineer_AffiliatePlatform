import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RecordImpressionsDto } from './dto';
import { ImpressionsService } from './impressions.service';

@ApiTags('impressions')
@Controller('impressions')
export class ImpressionsController {
  constructor(private readonly impressions: ImpressionsService) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({
    summary:
      'Record a batch of impressions. Public endpoint called by the landing page when product cards enter the viewport. Returns 202 because writes are best-effort and unknown linkIds are dropped silently.',
  })
  async record(@Body() dto: RecordImpressionsDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return this.impressions.recordBatch(dto.linkIds, {
      referrer: req.headers.referer ?? req.headers.referrer?.toString(),
      userAgent: req.headers['user-agent'],
      ip,
    });
  }
}
