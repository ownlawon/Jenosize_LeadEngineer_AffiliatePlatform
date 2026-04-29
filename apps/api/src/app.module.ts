import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "crypto";
import type { IncomingMessage, ServerResponse } from "http";

import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { ThrottlerByUserGuard } from "./common/throttler-by-user.guard";
import { AuthModule } from "./modules/auth/auth.module";
import { ProductsModule } from "./modules/products/products.module";
import { CampaignsModule } from "./modules/campaigns/campaigns.module";
import { LinksModule } from "./modules/links/links.module";
import { ImpressionsModule } from "./modules/impressions/impressions.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { RedirectModule } from "./modules/redirect/redirect.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { BootstrapModule } from "./modules/bootstrap/bootstrap.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthController } from "./modules/health/health.controller";

const isDev = process.env.NODE_ENV !== "production";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        // Pretty single-line output locally, JSON in production for log aggregators.
        transport: isDev
          ? {
              target: "pino-pretty",
              options: { singleLine: true, colorize: true },
            }
          : undefined,
        level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
        // Reuse incoming x-request-id header when present so callers can
        // correlate across services; otherwise mint a fresh UUID.
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const incoming = req.headers["x-request-id"];
          const id =
            (Array.isArray(incoming) ? incoming[0] : incoming) ?? randomUUID();
          res.setHeader("x-request-id", id);
          return id;
        },
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return "error";
          if (res.statusCode >= 400) return "warn";
          return "info";
        },
        // Health checks pollute the log feed without adding signal.
        autoLogging: {
          ignore: (req) => req.url === "/health",
        },
        // Hide cookies + auth headers from structured output.
        redact: {
          paths: ["req.headers.cookie", "req.headers.authorization"],
          remove: true,
        },
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: "default", ttl: 60_000, limit: 200 },
      { name: "redirect", ttl: 60_000, limit: 600 },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    ProductsModule,
    CampaignsModule,
    LinksModule,
    ImpressionsModule,
    WebhooksModule,
    RedirectModule,
    DashboardModule,
    JobsModule,
    BootstrapModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerByUserGuard }],
})
export class AppModule {}
