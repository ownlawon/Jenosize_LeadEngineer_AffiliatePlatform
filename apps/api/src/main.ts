// MUST be the first import: OpenTelemetry's auto-instrumentations patch
// http/express/pg/ioredis modules at require-time. If any module above
// loads them first, those call sites won't be traced.
import "./common/tracing";

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ValidationPipe } from "@nestjs/common";
import { Logger as PinoLogger } from "nestjs-pino";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { json, type Request as ExpressRequest } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  // Build the CORS allowlist from explicit env vars. Reject everything else so
  // a stolen token can't be replayed from a malicious origin via fetch.
  const allowedOrigins = [
    process.env.WEB_ORIGIN_URL,
    "http://localhost:3000",
  ].filter((v): v is string => Boolean(v));

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    cors: {
      origin: (origin, cb) => {
        // Allow same-origin / curl / server-to-server requests (no Origin header).
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`), false);
      },
      credentials: true,
    },
  });

  // Replace Nest's default Logger with Pino so every log line is structured
  // JSON in production (req.id, level, msg) and pretty-printed locally.
  app.useLogger(app.get(PinoLogger));

  // Helmet sets sensible secure HTTP headers (X-Frame-Options, X-Content-Type-
  // Options, Referrer-Policy, etc.). The CSP is scoped narrow — Swagger UI
  // uses inline scripts so we allow 'unsafe-inline' for script-src, but
  // everything else is locked to 'self'. This protects every other endpoint
  // (and any future static assets) without breaking /api/docs.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          // Swagger UI bootstraps via inline <script> + inline event handlers.
          // 'unsafe-inline' is the minimum carve-out that keeps it functional.
          "script-src": ["'self'", "'unsafe-inline'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "https:"],
          "connect-src": ["'self'"],
          "object-src": ["'none'"],
          "frame-ancestors": ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cookieParser());

  // Capture the raw JSON body for HMAC verification on /api/webhooks/*
  // (after parsing, the original byte string is gone — but signatures sign
  // exactly those bytes). The verify callback fires before route handling.
  app.use(
    json({
      verify: (req, _res, buf: Buffer) => {
        (req as ExpressRequest & { rawBody?: string }).rawBody =
          buf.toString("utf8");
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix("api", { exclude: ["go/:code", "health"] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Jenosize Affiliate API")
    .setDescription(
      "REST API for the affiliate marketplace price comparison platform",
    )
    .setVersion("0.1.0")
    .addCookieAuth("access_token")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  // Activate Nest's lifecycle hooks. PrismaService and RedisService both
  // implement OnModuleDestroy — without this, SIGTERM exits the process
  // mid-request without giving them a chance to flush + disconnect cleanly.
  // Railway sends SIGTERM 30s before forcefully killing during deploys.
  app.enableShutdownHooks();

  // Railway / Heroku-style platforms inject PORT; honour that first, then
  // fall back to API_PORT (local override) and finally to 3001 for dev.
  const portRaw = process.env.PORT || process.env.API_PORT || "3001";
  const port = Number(portRaw) || 3001;
  await app.listen(port, "0.0.0.0");
  app
    .get(PinoLogger)
    .log(
      `API listening on http://localhost:${port} (docs: /api/docs)`,
      "Bootstrap",
    );
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal bootstrap error", err);
  process.exit(1);
});
