import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Aggregate stats: total clicks, by marketplace, by campaign' })
  summary() {
    return this.dashboard.summary();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Top products by clicks' })
  topProducts(@Query('limit') limit?: string) {
    const n = limit ? Math.min(50, Math.max(1, parseInt(limit, 10) || 10)) : 10;
    return this.dashboard.topProducts(n);
  }
}
