import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";

/**
 * Drop-in replacement for {@link ThrottlerGuard} that keys the rate
 * counter on the authenticated user ID when present, falling back to
 * the request IP for unauthenticated traffic.
 *
 * The default IP-only behaviour is brittle in two real scenarios this
 * app cares about:
 *
 *  1. **Corporate / mobile NAT** — multiple admins egressing through
 *     one IP would compete for the same 200 req/min budget.
 *  2. **Cloud egress** — Railway/Vercel/etc. occasionally route
 *     through shared addresses; a noisy neighbour can starve us.
 *
 * Per-user keying eliminates both. Anonymous traffic (the redirect path,
 * the public landing) keeps IP-keying because there's no user to bind to.
 */
@Injectable()
export class ThrottlerByUserGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const userId = (req as Request & { user?: { sub?: string } }).user?.sub;
    if (userId) return `user:${userId}`;

    const xff = req.headers["x-forwarded-for"];
    const xffStr = Array.isArray(xff) ? xff[0] : xff;
    const ip = xffStr?.split(",")[0]?.trim() || req.ip || "unknown";
    return `ip:${ip}`;
  }
}
