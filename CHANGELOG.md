# Changelog

All notable changes to this project. The format is loosely based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), without strict
SemVer because this is a one-shot assignment submission.

## [0.1.0] — Initial submission

### Core

- Monorepo bootstrap with pnpm workspaces (`apps/api`, `apps/web`,
  `packages/adapters`, `packages/shared`).
- NestJS 10 + Prisma 5 + Postgres 16 + Redis 7 backend, Next.js 14
  frontend.
- Six-entity domain model: `Product / Offer / Campaign / Link / Click /
  Impression` with FK chain + unique constraints for idempotent upserts.
  (The five entities required by the brief plus `Impression` to back a
  real CTR metric.)

### Features

- Add product from Lazada/Shopee URL or raw SKU; mock adapter behind
  a `MarketplaceAdapter` interface.
- Best-price computation across marketplaces with `bestPrice: true`
  flag per offer.
- Campaign management with UTM (source/medium/campaign) + start/end
  range, plus a runtime `active` flag.
- Affiliate short links: 6-char nanoid over a confusable-free alphabet,
  `/go/<code>` 302 redirect with UTM appended at lookup time.
- Click tracking — `referrer`, `userAgent`, hashed IP — recorded
  asynchronously so the redirect path is never blocked.
- Impression tracking via `IntersectionObserver` on the public landing
  page: a product card counts as one impression per Lazada/Shopee link
  once it is ≥50% visible for ≥1 second. `sessionStorage` dedupe
  prevents the same shopper from inflating counts by scrolling. Backs
  a real `CTR = clicks ÷ impressions` KPI on the admin dashboard.
- Analytics dashboard: KPIs (clicks, impressions, **CTR**, active
  campaigns), by-marketplace breakdown, by-campaign breakdown, top
  products leaderboard, last-7-days bar chart.
- Public landing page with active campaigns + per-campaign price
  comparison view.
- Cron `PriceRefreshJob` re-runs the adapter every 6 hours; mock
  randomises ±5% so the effect is observable on `lastCheckedAt`.

### Architecture & Infrastructure

- Dockerfile per app (multi-stage, devDeps-aware build).
- Local infra via `infra/docker-compose.yml`.
- GitHub Actions CI: install → lint → typecheck → unit + e2e tests →
  build, with a Postgres + Redis service container.
- Live deploy on Railway (api + web + Postgres + Redis).

### Production hardening

- `helmet` middleware on the api with a CRP override that allows the
  same-origin web client to fetch.
- Login-specific throttle (5 reqs/min/IP) on top of the global
  200/min ThrottlerGuard; redirect path raises to 600/min.
- `/health` is a readiness probe — pings Postgres + Redis in parallel,
  503s with `checks: { db, redis }` when degraded.
- Request-logger middleware tags every response with `x-request-id`
  and emits one structured log line on completion.
- Open-redirect protection: `/go/:code` only resolves to hosts whose
  suffix is `lazada.co.th`, `lazada.com`, `shopee.co.th`, or
  `shopee.com`.
- Rate-limited; `class-validator` on every body; bcrypt cost 12;
  httpOnly+SameSite cookie auth.

### Reviewer experience

- `BootstrapService` auto-seeds 3 starter products + 1 campaign + 6
  links on first boot when the catalogue is empty. The other 3 fixture
  SKUs ship in `Quick Samples` so the reviewer's first click visibly
  adds a row instead of being a no-op upsert.
- Admin "Reset demo data" button + `POST /api/admin/reset-demo`
  endpoint that wipes domain rows and re-seeds in one call.
- `/admin/products` form supports raw-SKU input via a marketplace
  selector (Auto-detect / Lazada / Shopee). Auto resolves URLs by host;
  picking a marketplace lets the reviewer paste a bare SKU
  (`matcha-001`) without a URL.
- `/admin/products` collapsible reference panel exposes 6 SKUs (with
  per-row Copy buttons) and 12 fixture URLs so by-hand testing doesn't
  require typing.
- `/admin/links` table renames "Short link" to a 6-column layout —
  Product (image + title), Campaign (name + UTM slug), Short link,
  Marketplace, Clicks, Copy — so reviewers can see what each row
  promotes at a glance.
- Onboarding card on the dashboard when `totalProducts === 0` walks
  the admin through the three-step flow.
- Demo-mode banner on `/admin/products` collapses to a single-line
  pill by default; expands on click.
- Skeleton loaders (`loading.tsx` per route) with shimmer + opacity
  pulse, gated by `prefers-reduced-motion`.
- Toast notifications via `sonner` for every admin action — replaces
  the previous mix of inline error banners and microcopy.
- 38-case UAT plan in `docs/UAT.md`.
- 7 ADRs in `docs/decisions.md` documenting load-bearing trade-offs.
- cURL recipe book in `docs/api-recipes.md` for scripted smoke tests.

### Known caveats

- Mock adapter only resolves the six fixture SKUs (3 auto-seeded plus
  3 surfaced via Quick Samples). Real Lazada/Shopee URLs return a 400
  explaining this.
- `SHORT_LINK_BASE_URL` should include scheme (`https://...`).
  Missing scheme degrades the displayed `shortUrl` only — actual
  redirects still work via the api domain.
- 6-char short codes drop collision headroom from ~10¹⁴ to ~3·10¹⁰.
  Insert path retries on the unique-constraint conflict; ample for
  MVP scale.
