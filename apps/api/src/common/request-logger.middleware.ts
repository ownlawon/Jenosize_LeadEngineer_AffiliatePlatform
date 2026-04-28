import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Tags every request with an x-request-id and emits a single concise log line
 * on completion (`METHOD path → status • Nms id=<uuid>`). Health checks are
 * skipped to keep the log signal-to-noise high.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly log = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) || randomUUID();
    res.setHeader('x-request-id', requestId);
    (req as Request & { requestId: string }).requestId = requestId;

    if (req.path === '/health') return next();

    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const line = `${req.method} ${req.originalUrl} → ${res.statusCode} • ${ms}ms id=${requestId.slice(0, 8)}`;
      if (res.statusCode >= 500) this.log.error(line);
      else if (res.statusCode >= 400) this.log.warn(line);
      else this.log.log(line);
    });

    next();
  }
}
