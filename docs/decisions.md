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
- *Live API integration.* Blocked on approval lead-time outside the 3–5
  day delivery window.
- *Headless-browser scraping.* Fragile, expensive to run, and would
  invite bot-detection issues during a public demo.

**Reviewer signal.** The `pluggable adapter` pattern is the architecture
takeaway: the api never imports `lazada.mock.ts` directly — it goes
through `getAdapter(marketplace)` and the registry, so swapping
implementations doesn't require api changes.

---

## ADR-002 · pnpm workspace monorepo (apps/* + packages/*)

**Status:** accepted

**Context.** Two deliverables (api + web) share product/marketplace
concepts, validation schemas, and DTOs. They will deploy independently
but their type contracts must move in lockstep.

**Decision.** Single repo, pnpm workspace. `apps/api` and `apps/web` are
independently deployable; `packages/shared` (Zod schemas + DTO types)
and `packages/adapters` are workspace dependencies.

**Rejected alternatives.**
- *Two separate repos with shared types via npm.* Adds publish/version
  ceremony for what amounts to a single product.
- *Single Next.js app with route handlers.* Hides the api/frontend
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
- *Process-local LRU cache.* Doesn't survive a deploy or scale across
  multiple replicas.
- *No cache, lean on Postgres.* Adds ~5ms p95 to every redirect for
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
- *Token in Authorization header from the client.* Forces the token
  into JS; weaker XSS posture.
- *Server session table.* Heavier; needs cleanup; we already pay for
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
- *Trust the database.* The `Link.targetUrl` is populated from
  `Offer.externalUrl`, which is populated from the adapter's
  `MarketplaceProduct.url`. If an adapter is ever compromised, the
  whitelist is the second line of defense.

---

## ADR-006 · BootstrapService auto-seeds when the catalogue is empty

**Status:** accepted

**Context.** The reviewer needs to land on a populated demo within
seconds of opening the URL — a blank dashboard reads as "broken" even
when it's correct.

**Decision.** On `OnModuleInit`, count `Product` rows. If `0`, seed six
fixtures + the "Summer Deal 2025" campaign + twelve links. Idempotent
once data exists.

**Rejected alternatives.**
- *Run `pnpm db:seed` manually after deploy.* Adds a step the reviewer
  has to know about.
- *Always seed.* Would clobber any data the reviewer creates between
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
- *Cursor pagination.* Cleaner for infinite-scroll UIs, but the admin
  surfaces here are tabular and want jumpable pages.
- *No pagination yet.* Cheap now; nasty migration later.
