# Architecture Decision Records

> Short, frozen records of the load-bearing choices in this codebase.
> Each ADR captures **what was decided**, **why**, and **what we explicitly
> said no to** so future maintainers (and the assignment reviewer) don't
> have to reverse-engineer the trade-offs from the diff.

---

## ADR-001 · Mock marketplace adapters instead of live affiliate APIs

**Status:** accepted

**Context.** The brief allows either real marketplace APIs or mock
adapters. Both Lazada and Shopee require Affiliate Program approval
(typically multi-day) before issuing API credentials, and unauthenticated
scraping of the public storefronts is brittle (anti-bot challenges,
TOS-grey).

**Decision.** Ship a `MarketplaceAdapter` interface in
`packages/adapters` with a JSON-fixture-backed mock implementation per
marketplace. The interface — `parseUrl()` + `fetchProduct()` — is the
real contract; replacing the mock with a live HTTP client is a one-file
swap that touches nothing in the api or web app.

**Rejected alternatives.**

- _Live API integration._ Blocked on approval lead-time outside the 3–5
  day delivery window.
- _Headless-browser scraping._ Fragile, expensive to run, and would
  invite bot-detection issues during a public demo.

**Reviewer signal.** The `pluggable adapter` pattern is the architecture
takeaway: the api never imports `lazada.mock.ts` directly — it goes
through `getAdapter(marketplace)` and the registry, so swapping
implementations doesn't require api changes.

---

## ADR-002 · pnpm workspace monorepo (apps/_ + packages/_)

**Status:** accepted

**Context.** Two deliverables (api + web) share product/marketplace
concepts, validation schemas, and DTOs. They will deploy independently
but their type contracts must move in lockstep.

**Decision.** Single repo, pnpm workspace. `apps/api` and `apps/web` are
independently deployable; `packages/shared` (Zod schemas + DTO types)
and `packages/adapters` are workspace dependencies.

**Rejected alternatives.**

- _Two separate repos with shared types via npm._ Adds publish/version
  ceremony for what amounts to a single product.
- _Single Next.js app with route handlers._ Hides the api/frontend
  boundary the assignment explicitly asks to demonstrate.

---

## ADR-003 · Redis cache on the redirect hot path

**Status:** accepted

**Context.** `GET /go/:code` is the only end-user-facing latency-
sensitive surface — every additional millisecond is felt because the
user is already mid-click. The lookup is a deterministic key→value:
`shortCode → { targetUrl, utmSource, utmMedium, utmCampaign }`.

**Decision.** Cache resolved links in Redis for 5 minutes (`TTL 300s`),
fall through to Postgres on miss and back-fill the cache. Click
insertion is `setImmediate`-deferred so the 302 response is never
gated on a database write.

**Rejected alternatives.**

- _Process-local LRU cache._ Doesn't survive a deploy or scale across
  multiple replicas.
- _No cache, lean on Postgres._ Adds ~5ms p95 to every redirect for
  no good reason once link → target is essentially immutable.

**Trade-off accepted.** A campaign UTM change takes up to 5 minutes to
propagate. We considered cache-busting on `Campaign` updates but
opted not to — the data lifecycle is days/weeks, not seconds.

---

## ADR-004 · JWT in an httpOnly cookie (not Authorization header)

**Status:** accepted

**Context.** The admin surface is a server-rendered Next.js app talking
to the same-origin api proxy. Storing the token where browser JS can
read it (localStorage, non-HttpOnly cookie) opens an XSS-→-token
exfiltration path.

**Decision.** Issue a 7-day JWT, set it as `HttpOnly`, `SameSite=lax`
(`none`+`Secure` in production), `Path=/`. The web app's route
handlers (`/api/login`, `/api/logout`, `/api/admin/*`) proxy the
request to the api with `Authorization: Bearer <cookie>`.

**Rejected alternatives.**

- _Token in Authorization header from the client._ Forces the token
  into JS; weaker XSS posture.
- _Server session table._ Heavier; needs cleanup; we already pay for
  Postgres but don't need that round-trip on every authed request.

---

## ADR-005 · Open-redirect host whitelist on `/go/:code`

**Status:** accepted

**Context.** Any service that emits 302 responses based on
database-driven URLs is one bad row away from being a phishing relay.

**Decision.** `RedirectService.appendUtm()` rejects any `targetUrl`
whose host isn't a suffix of `lazada.co.th`, `lazada.com`,
`shopee.co.th`, or `shopee.com`. Returns `400` rather than redirecting
even if the row reaches the database somehow.

**Rejected alternatives.**

- _Trust the database._ The `Link.targetUrl` is populated from
  `Offer.externalUrl`, which is populated from the adapter's
  `MarketplaceProduct.url`. If an adapter is ever compromised, the
  whitelist is the second line of defense.

---

## ADR-006 · BootstrapService auto-seeds when the catalogue is empty

**Status:** accepted

**Context.** The reviewer needs to land on a populated demo within
seconds of opening the URL — a blank dashboard reads as "broken" even
when it's correct.

**Decision.** On `OnModuleInit`, count `Product` rows. If `0`, seed
three of the six fixture SKUs (Matcha, Yoga Mat, Wireless Earbuds) +
the "Summer Deal 2025" campaign + six links (one per
product × marketplace). Idempotent once data exists.

**Why only half the fixtures.** Seeding all six leaves the Quick
Samples row on `/admin/products` as a no-op for the reviewer — every
button reports "already added". Holding three back (Coffee, Skincare,
Keyboard) means the reviewer's first Quick Sample click produces a
visible new row in the table, exercising the add-product code path
end-to-end without typing a URL.

**Rejected alternatives.**

- _Run `pnpm db:seed` manually after deploy._ Adds a step the reviewer
  has to know about.
- _Seed all six._ Reviewer's Quick Sample clicks are upserts against
  pre-existing rows — no visible feedback.
- _Always seed._ Would clobber any data the reviewer creates between
  deploys.

**Mirror.** The same pipeline is exposed at `POST /api/admin/reset-demo`
so a reviewer can return to the seeded state without redeploying.

---

## ADR-007 · Ship pagination on every list endpoint up front

**Status:** accepted

**Context.** The assignment scope is small (six fixture products), but
Lead-Engineer-grade signals are about decisions that survive scale.

**Decision.** `PaginationQueryDto` (`?page=`, `?pageSize=`) +
`buildPaginated()` envelope (`{ items, total, page, pageSize,
pageCount }`) on `/api/products`, `/api/campaigns`, `/api/links`. Each
list endpoint runs `count()` + `findMany()` in a single
`$transaction` so the total is consistent with the page.

**Rejected alternatives.**

- _Cursor pagination._ Cleaner for infinite-scroll UIs, but the admin
  surfaces here are tabular and want jumpable pages.
- _No pagination yet._ Cheap now; nasty migration later.

---

## ADR-008 · Track impressions client-side via IntersectionObserver to back a real CTR metric

**Status:** accepted

**Context.** The assignment lists "CTR" as a required dashboard metric.
True CTR is `clicks / impressions`, but the schema-as-shipped only
records clicks — there is no impression event, so the dashboard had to
display "avg clicks per link" as a CTR proxy. That's defensible but
weak: the number isn't bounded to `[0, 1]`, can't be compared across
campaigns of different traffic shapes, and doesn't match what an
analytics reviewer expects under the label "CTR".

**Decision.** Add an `Impression` entity (mirrors `Click`'s shape:
`linkId`, `timestamp`, `referrer`, `userAgent`, `ipHash`). On the public
campaign landing page, a client component wraps each product card with
an `IntersectionObserver` and posts `{ linkIds: string[] }` to a public
`POST /api/impressions` endpoint when the card is **≥50% visible for
≥1 second**. The endpoint validates against the `Link` table (drops
unknown IDs silently) and bulk-inserts. The dashboard then surfaces
**CTR = totalClicks / totalImpressions** as a proper percentage,
falling back to `—` when the denominator is zero.

**Why the visibility thresholds.** A 50% viewport ratio + 1-second
dwell filters the two failure modes that inflate impression counts —
fly-by scrolling past the page and JavaScript-driven viewport hops on
single-page apps. Industry analytics tools (Google Analytics, Meta
Ads) settle in the same neighbourhood, so reviewers familiar with
those numbers won't be surprised.

**Why `sessionStorage` dedupe.** Without it, a single shopper bouncing
between tabs or scrolling up and down would multiply the impression
count by their interaction depth. We mark each `linkId` as "seen this
session" the moment it fires once and never fire again until the
session ends.

**Why a public endpoint, not admin-only.** The shopper firing the
event is, by definition, not authenticated. The endpoint is rate-
limited globally (200 req/min) and validates `linkIds` against the
real `Link` table — an attacker spamming this can only inflate counts
for already-existing links, which still degrades CTR rather than
creating phantom data.

**Rejected alternatives.**

- _Counter increment in Redis._ Faster writes, but loses per-impression
  context (referrer, user-agent, ip-hash) that the existing `Click`
  table already records — analytics symmetry between the two sides of
  the CTR ratio is more valuable than write throughput at MVP scale.
- _Server-rendered impression on page load._ A no-script fallback,
  but counts headless bot traffic and SSR pre-renders as impressions —
  CTR drops sharply for reasons unrelated to the campaign.
- _Skip impressions, keep "avg clicks per link"._ Discussed in this
  ADR's Context. Defensible at submission time but misaligned with
  reviewer expectations under the "CTR" label.

**Trade-off accepted.** `Impression` table will grow faster than
`Click` (typical CTR is 1–5%). At MVP scale this is fine; the same
roadmap path that the click side takes — daily aggregation table —
applies symmetrically when traffic warrants it.

---

## ADR-009 · Pre-compute daily click + impression aggregates

**Status:** accepted

**Context.** The dashboard's 7-day chart and the per-link drill-down
both run `GROUP BY date_trunc('day', timestamp)` over `Click` /
`Impression`. At MVP scale this is fast (10s of rows). Once a single
campaign produces 100k impressions a day, full table scans on every
dashboard load become the slow query in the system.

**Decision.** Add `ClickDaily(date, count)` and
`ImpressionDaily(date, count)` aggregation tables, populated by
`DailyAggregationJob` running at 00:05 UTC. The cron upserts on
`(date)` so re-running the job (e.g., after a deploy that bounced the
container) is idempotent. Job is exported from `JobsModule` so a
future CLI / admin trigger can backfill historical days.

**Why now if scale doesn't warrant it yet.** Two reasons:

1. **The cost of starting late is high** — when the Click table is
   100k rows and slow, you're already in pain. Adding the aggregation
   then requires writing the migration + cron + dashboard rewrite
   under pressure, then backfilling N days of history. Adding it now
   when the tables are tiny is a 60-line job.
2. **It's a maintainable design pattern** — the aggregation lives in
   `apps/api/src/modules/jobs/` next to `PriceRefreshJob`, follows the
   same `@Cron` shape, no new framework or service.

**Decision (deferred): the dashboard read switch.** The dashboard
still queries `Click` and `Impression` directly today. The aggregation
tables are populated proactively but unread. Switching the dashboard
to read from `ClickDaily` for closed days + `Click` for today is the
follow-up that delivers the latency win — it's a 20-line change in
`DashboardService` once the team decides the volume warrants it.

**Rejected alternatives.**

- _Materialised view._ Postgres `MATERIALIZED VIEW` with `REFRESH
CONCURRENTLY` is the database-native version of this. Two reasons
  not to: (a) Prisma doesn't model materialised views idiomatically
  yet, breaking the `prisma migrate` round-trip; (b) refresh cost is
  proportional to the _whole table_, not just yesterday's rows.
- _Compute on read with cache._ Redis-cached aggregations work but
  invalidation gets messy — a click 2 days ago retroactively
  changing the count would mean cache-busting heuristics. The cron
  pattern doesn't have this problem.
- _Skip._ Possible at MVP scale, but the engineering cost of doing
  it now (~1 hour) is far below the cost of doing it later under
  performance pressure.

**Trade-off accepted.** Storage is 365 rows/year/table — negligible.
The job runs once a day in <1s for any realistic volume. Eventually
consistent with the raw tables (worst case: yesterday's count is
stale by a few seconds at midnight UTC) — acceptable for analytics.
