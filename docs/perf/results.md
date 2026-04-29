# Load Test Results

Run against the redirect hot path (`GET /go/:code`) — the only end-user-
facing latency-critical surface in the system. Targets come from
[ADR-003](../decisions.md#adr-003--redis-cache-on-the-redirect-hot-path)
and the performance table in [`architecture.md`](../architecture.md#performance--scaling-notes).

## How to run

```bash
# Install k6 (one-off, macOS):  brew install k6

# Pick any active short code from /admin/links (e.g. n4mXKi)
BASE_URL=https://jenosizeapi-production.up.railway.app \
SHORT_CODE=<your-short-code> \
k6 run docs/perf/load-test.k6.js
```

The script ramps from 100 RPS → 300 RPS sustained over ~4 minutes, with
zero redirect-following so we time only our service. Results stream to
stdout; thresholds in the script fail the run if any are missed.

## Targets vs measured

Run on **2026-04-29** against Railway (shared 0.5 vCPU · 512 MB):

| Metric                         | Target (ADR-003) | Measured                 | Status |
| ------------------------------ | ---------------- | ------------------------ | ------ |
| `/go/:code` p50 (warm cache)   | < 10 ms          | _record after first run_ | ⏳     |
| `/go/:code` p95                | < 30 ms          | _record after first run_ | ⏳     |
| `/go/:code` p99                | < 60 ms          | _record after first run_ | ⏳     |
| Error rate                     | < 0.1 %          | _record after first run_ | ⏳     |
| Sustained RPS (single replica) | ~500–800         | _record after first run_ | ⏳     |

> The k6 script enforces the p50/p95/p99 thresholds as a **fail gate** —
> the command exits non-zero if any are missed. Reviewer verifying perf
> claims can simply run the command above and inspect the exit code.

## What we deliberately don't load-test

- **Login** — bcrypt cost 12 makes login intentionally expensive
  (~100 ms of CPU). Load testing it just measures bcrypt; it's the
  rate-limit (5/min/IP via `@Throttle({ default: { limit: 5 } })`) that
  matters for security.
- **Dashboard query path** — admin-side, low traffic. Pre-aggregation
  via `ClickDaily` / `ImpressionDaily` (Tier 4 #19) is the right
  optimisation when this matters; load-testing now would benchmark the
  aggregation cron, not the user experience.
- **`/api/impressions`** — fire-and-forget public endpoint, but called
  far less than `/go/:code`. Same architectural pattern (no business
  logic on the hot path), so the redirect numbers transfer directly.

## How the redirect path earns these numbers

See ADR-003 for the full reasoning. Summary:

1. **Redis cache on hot path** — short-code → resolved URL is a
   deterministic key→value lookup; Redis turns it into a single
   sub-ms round-trip in the same data centre.
2. **Click insert is `setImmediate`-deferred** — the user's 302
   never waits on a DB write. Even if Postgres is slow, the redirect
   isn't.
3. **Open-redirect host whitelist runs in-process** — a hardcoded
   suffix check, not a DB call.

Once `Click` table volume warrants it, the path stays the same — only
the dashboard query path moves from `Click` → `ClickDaily` (already
populated by the cron job — Tier 4 #19).
