import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { RedirectService } from './redirect.service';

@ApiTags('redirect')
@Controller()
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get('go/:code')
  @Throttle({ redirect: { ttl: 60_000, limit: 600 } })
  @ApiOperation({
    summary: 'Public redirect: resolves short code → marketplace URL with UTMs and tracks click',
  })
  async go(@Param('code') code: string, @Req() req: Request, @Res() res: Response) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const target = await this.redirectService.resolveAndTrack(code, {
      referrer: req.headers.referer ?? req.headers.referrer?.toString(),
      userAgent: req.headers['user-agent'],
      ip,
    });
    res.redirect(302, target);
  }
}
