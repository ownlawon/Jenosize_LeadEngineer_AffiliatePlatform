import {
  Controller,
  Get,
  ServiceUnavailableException,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

interface HealthReport {
  status: 'ok' | 'degraded';
  uptimeSec: number;
  timestamp: string;
  checks: {
    db: boolean;
    redis: boolean;
  };
}

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Liveness + readiness probe',
    description:
      'Checks Postgres + Redis connectivity. Returns 503 with the per-check ' +
      'state if anything is degraded — used by Railway/k8s healthchecks.',
  })
  async health(): Promise<HealthReport> {
    const [db, redis] = await Promise.all([
      this.prisma
        .$queryRawUnsafe('SELECT 1')
        .then(() => true)
        .catch(() => false),
      this.redis.ping(),
    ]);

    const report: HealthReport = {
      status: db && redis ? 'ok' : 'degraded',
      uptimeSec: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { db, redis },
    };

    if (report.status !== 'ok') {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }
}
