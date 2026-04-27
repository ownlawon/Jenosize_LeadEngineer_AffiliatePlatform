import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (origin, cb) => cb(null, true),
      credentials: true,
    },
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['go/:code', 'health'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Jenosize Affiliate API')
    .setDescription('REST API for the affiliate marketplace price comparison platform')
    .setVersion('0.1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Railway / Heroku-style platforms inject PORT; honour that first, then
  // fall back to API_PORT (local override) and finally to 3001 for dev.
  const portRaw = process.env.PORT || process.env.API_PORT || '3001';
  const port = Number(portRaw) || 3001;
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on http://localhost:${port} (docs: /api/docs)`, 'Bootstrap');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
