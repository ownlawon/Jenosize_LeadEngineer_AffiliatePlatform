# UAT Test Plan

> User Acceptance Test cases mapped 1:1 to the assignment's required features.
> Run through these to verify the deployed application end-to-end.

## Prerequisites

| Item | Value |
|------|-------|
| Web (public + admin) | https://jenosizeweb-production.up.railway.app |
| API | https://jenosizeapi-production.up.railway.app |
| Swagger | https://jenosizeapi-production.up.railway.app/api/docs |
| Admin email | `admin@jenosize.test` |
| Admin password | `ChangeMe!2025` |
| Browser | Chrome / Firefox / Safari (latest) — devtools open recommended |

## Conventions

- **Steps** are sequential — each row depends on the previous unless stated.
- **Expected** is a hard pass/fail criterion.
- "Open" = open in a new browser tab. "Click" = left-click.

---

## TS-1 · Authentication

### TC-1.1 · Login with valid credentials (happy path)

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open `<web>/admin/login` | Login form renders with pre-filled email + password |
| 2 | Click **Sign in** | Page navigates to `/admin/dashboard` in **one click** (no bounce back to login) |
| 3 | Inspect cookies in devtools → Application → Cookies | `access_token` is `HttpOnly`, value = JWT |

### TC-1.2 · Login with invalid credentials

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open `/admin/login` | — |
| 2 | Change password to `WrongPassword!` and submit | Error banner: "Invalid credentials" or similar; URL stays on `/admin/login`; no cookie set |

### TC-1.3 · Protected route without login

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open new private window | No cookies |
| 2 | Visit `<web>/admin/dashboard` | Auto-redirects to `/admin/login?next=%2Fadmin%2Fdashboard` |
| 3 | Login | Redirects back to `/admin/dashboard` |

### TC-1.4 · Logout

| Step | Action | Expected |
|------|--------|---------|
| 1 | While logged in, click **Logout** in nav | Redirects to `/admin/login` on the **production domain** (not localhost) |
| 2 | Try `/admin/dashboard` again | Redirects back to `/admin/login` |

---

## TS-2 · Product Management

### TC-2.1 · Add Lazada product via URL

| Step | Action | Expected |
|------|--------|---------|
| 1 | Login → `/admin/products` | Empty table or existing rows |
| 2 | Paste `https://www.lazada.co.th/products/matcha-001.html` → **Add product** | Row appears: title "Premium Ceremonial Grade Matcha Powder 100g", Lazada column populated |

### TC-2.2 · Add Shopee offer to same product (auto-merge)

| Step | Action | Expected |
|------|--------|---------|
| 1 | After TC-2.1, paste `https://shopee.co.th/product/123456/matcha-001` → Add | Same row gets a Shopee offer; **Best price badge** moves to whichever marketplace is cheaper |

### TC-2.3 · Add product via raw SKU

| Step | Action | Expected |
|------|--------|---------|
| 1 | With the marketplace selector on **Auto-detect**, type just `yoga-mat-77` (no URL) and submit | Inline amber warning hints the input looks like a SKU; submit returns "Could not detect marketplace from URL" toast (Auto can't pick a marketplace from a bare SKU) |
| 2 | Switch the selector to **Lazada** and submit `yoga-mat-77` again | Row appears with a Lazada offer; same SKU + Shopee adds the Shopee offer to the same product |
| 3 | Or use the **Quick samples** buttons instead | Adds the corresponding product successfully without typing |

### TC-2.4 · Best price flag is correct

| Step | Action | Expected |
|------|--------|---------|
| 1 | Add same product on both marketplaces | The offer with the lower `price` shows the green **Best** badge; the other doesn't |

### TC-2.5 · Invalid URL

| Step | Action | Expected |
|------|--------|---------|
| 1 | Paste `https://amazon.com/dp/X` → Add | Error message indicating unsupported marketplace; no product created |

---

## TS-3 · Campaign Management

### TC-3.1 · Create a valid campaign (incl. assignment's "Summer Deal 2025")

| Step | Action | Expected |
|------|--------|---------|
| 1 | `/admin/campaigns` → form | Defaults to today + 90 days |
| 2 | Set name = `Summer Deal 2025`, UTM = `summer_deal_2025`, start = `2025-06-01`, end = `2025-08-31` | — |
| 3 | Click **Create campaign** | Row appears in table; **Active** badge if today is within the range |

### TC-3.2 · Validation: end before start

| Step | Action | Expected |
|------|--------|---------|
| 1 | Set end date earlier than start | Form blocks submit with inline error "End date must be after start date" (client guard); if forced via API, server returns 400 with the same human-readable message |

### TC-3.3 · Validation: invalid UTM characters

| Step | Action | Expected |
|------|--------|---------|
| 1 | UTM = `summer deal 2025` (space) | Form validation blocks submit; or server 400 "utmCampaign must be alphanumeric, underscore, or dash" |

---

## TS-4 · Affiliate Link Generation

### TC-4.1 · Generate Lazada short link

| Step | Action | Expected |
|------|--------|---------|
| 1 | `/admin/links` → choose Matcha, "Summer Deal 2025", LAZADA → **Generate** | Row appears with 6-char `shortCode`; `shortUrl` shown |
| 2 | Click **Copy** → paste into a new tab | Short URL opens in browser |

### TC-4.2 · Generate Shopee link for same product+campaign

| Step | Action | Expected |
|------|--------|---------|
| 1 | Repeat TC-4.1 with marketplace=SHOPEE | Second row appears, different `shortCode` |

### TC-4.3 · Marketplace without offer

| Step | Action | Expected |
|------|--------|---------|
| 1 | Add a product with only Lazada offer (skip Shopee) | — |
| 2 | Try generate Shopee link for it | Error: "Product has no offer for SHOPEE — add the marketplace first" |

### TC-4.4 · Idempotent re-generation

| Step | Action | Expected |
|------|--------|---------|
| 1 | Try to generate the same product+campaign+marketplace twice | Same `shortCode` returned (no duplicate row) |

---

## TS-5 · Public Landing & Redirect

### TC-5.1 · Public home

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open `<web>/` (logged out) | Shows "Active campaigns" list including "Summer Deal 2025" |

### TC-5.2 · Campaign page

| Step | Action | Expected |
|------|--------|---------|
| 1 | Click the "Summer Deal 2025" card | Navigates to `/c/<id>` |
| 2 | Inspect product card | Shows image, title, both prices, **Best price** badge on cheaper one, two CTAs |

### TC-5.3 · Lazada CTA → 302 with UTMs

| Step | Action | Expected |
|------|--------|---------|
| 1 | Right-click "Buy on LAZADA" → "Open in new tab" | Browser ends up at `https://www.lazada.co.th/products/matcha-001.html?utm_source=jenosize&utm_medium=affiliate&utm_campaign=summer_deal_2025` (the URL bar will show this) |
| 2 | In devtools Network tab, see the redirect chain | First request: `/go/<shortCode>` returns **302** with `Location: https://www.lazada.co.th/...?utm_*` |

### TC-5.4 · Shopee CTA → 302 with UTMs

Same as TC-5.3 but for Shopee.

### TC-5.5 · Unknown shortcode

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open `<api>/go/zz9zz9` (random 6 chars) | HTTP **404** "Link not found" |

### TC-5.6 · Open redirect protection

| Step | Action | Expected |
|------|--------|---------|
| 1 | _(Manual SQL injection attempt — requires DB access)_ Insert a Link with `targetUrl = "https://evil.com"` and call `/go/<code>` | API returns **400** "Refusing to redirect to host evil.com — only Lazada/Shopee allowed" |

> The redirect service has an explicit allow-list of `lazada.co.th`, `lazada.com`, `shopee.co.th`, `shopee.com` host suffixes; non-marketplace targets are refused even if they reach the database somehow.

---

## TS-6 · Analytics Dashboard

### Setup

Click each generated short link 3–5 times across both marketplaces (or run the smoke loop in [docs/architecture.md](architecture.md#smoke-test)) to populate clicks, then refresh `/admin/dashboard`.

### TC-6.1 · KPI cards

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open `/admin/dashboard` | "Total clicks", "Total impressions", "CTR", "Active campaigns" all show non-negative values; CTR shows `—` when impressions are zero, otherwise a percentage like `5.2%` with the underlying `clicks / impressions` ratio in the hint line |

### TC-6.2 · By-marketplace breakdown

| Step | Action | Expected |
|------|--------|---------|
| 1 | Inspect "By marketplace" card | Lists LAZADA + SHOPEE with click counts that sum to total |

### TC-6.3 · By-campaign breakdown

| Step | Action | Expected |
|------|--------|---------|
| 1 | "By campaign" card | "Summer Deal 2025" with clicks count |

### TC-6.4 · Top products leaderboard

| Step | Action | Expected |
|------|--------|---------|
| 1 | "Top products" list | Products ordered by clicks desc, each with image and number |

### TC-6.5 · 7-day click chart

| Step | Action | Expected |
|------|--------|---------|
| 1 | Bar chart "Clicks last 7 days" | Today's bar > 0; previous days 0 (or non-zero if tested previously) |

### TC-6.6 · Impression tracking + CTR

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open public campaign page `<web>/c/<id>` in a fresh private window | Product cards render |
| 2 | Wait ~2 seconds for cards to be ≥50% visible (no scroll) | Network tab shows one `POST /api/impressions` request with the linkIds for visible cards; response 202 with `{ recorded: N }` |
| 3 | Reload the same page in the same window | No new impression request fires (sessionStorage dedup blocks duplicates) |
| 4 | Open admin dashboard | "Total impressions" reflects the count; "CTR" shows a percentage if any clicks have happened |
| 5 | Inspect the request body | `{ linkIds: ['…', '…'] }` — capped at 50 IDs per call by DTO validation |

---

## TS-7 · API Documentation

### TC-7.1 · Swagger UI

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open `<api>/api/docs` | Swagger UI loads with sections: auth, products, campaigns, links, redirect, dashboard, health |
| 2 | Expand `/api/auth/login` → **Try it out** → execute with valid credentials | 200 OK with user + token in response |

### TC-7.2 · Health endpoint

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open `<api>/health` | `{"status":"ok","timestamp":"..."}` — used by Railway healthcheck |

### TC-7.3 · Public endpoints (no auth)

| Step | Action | Expected |
|------|--------|---------|
| 1 | `curl <api>/api/products` | 200 + JSON array (may be empty) |
| 2 | `curl <api>/api/campaigns` | 200 + JSON array |
| 3 | `curl <api>/api/campaigns/<id>` | 200 + campaign + linked products |

### TC-7.4 · Admin endpoints require auth

| Step | Action | Expected |
|------|--------|---------|
| 1 | `curl -X POST <api>/api/products -d '{"url":"..."}'` (no token) | **401 Unauthorized** |
| 2 | Same with valid `Authorization: Bearer <jwt>` | 201 Created |

---

## TS-8 · Security

### TC-8.1 · Input validation

| Step | Action | Expected |
|------|--------|---------|
| 1 | `POST /api/auth/login` with `{"email":"x","password":"1"}` | 400 with messages "email must be an email", "password must be longer than or equal to 8 characters" |

### TC-8.2 · Cookie security

| Step | Action | Expected |
|------|--------|---------|
| 1 | Devtools → Application → Cookies → `access_token` | Flags: HttpOnly = true, Secure = true (over HTTPS), SameSite = lax/none |

### TC-8.3 · Rate limit on redirect path

| Step | Action | Expected |
|------|--------|---------|
| 1 | `for i in {1..650}; do curl -s -o /dev/null <api>/go/<code>; done` | After ~600 requests within 60s, subsequent requests return 429 |

> Default limit: 600 reqs/min on `/go/:code` (configured in `ThrottlerModule`).

---

## TS-9 · Cron / Background Job

### TC-9.1 · Price refresh observable

| Step | Action | Expected |
|------|--------|---------|
| 1 | Note the `lastCheckedAt` timestamp on any offer (`/api/products/<id>/offers`) | Recorded |
| 2 | Wait for next 6-hour cron tick (or trigger manually in dev by changing `@Cron(EVERY_6_HOURS)` to `EVERY_MINUTE` and re-deploying) | After tick, `lastCheckedAt` is more recent and `price` may have drifted ±5% (mock adapter randomization) |

> In production, the cron is set to every 6 hours so this case is best verified in the deployed dev environment, or by inspecting `apps/api/src/modules/jobs/price-refresh.job.ts`.

---

## TS-10 · Repository & CI

### TC-10.1 · Repo structure matches the assignment

| Path | Should exist |
|------|--------------|
| `apps/api/` | ✅ NestJS backend |
| `apps/web/` | ✅ Next.js frontend |
| `packages/adapters/` | ✅ Marketplace adapter package |
| `packages/shared/` | ✅ Shared schemas (Zod) |
| `infra/docker-compose.yml` | ✅ Postgres + Redis |
| `.github/workflows/ci.yml` | ✅ GitHub Actions |
| `README.md` | ✅ Setup, architecture, trade-offs, roadmap |
| `docs/architecture.md` | ✅ Diagrams + smoke test |
| `docs/UAT.md` | ✅ This document |

### TC-10.2 · Continuous integration

| Step | Action | Expected |
|------|--------|---------|
| 1 | Open https://github.com/ownlawon/Jenosize_LeadEngineer_AffiliatePlatform_NoppapadonT/actions | Latest workflow run = ✅ green |
| 2 | Inspect run | Steps include: install, prisma generate + migrate, typecheck, unit tests, e2e tests, build |

### TC-10.3 · Tests

| Step | Action | Expected |
|------|--------|---------|
| 1 | Locally: `pnpm install && pnpm -r build && pnpm -r test` | All workspace tests pass (20 unit — 8 shopee adapter + 7 lazada adapter + 5 products) |
| 2 | `pnpm --filter @jenosize/api test:e2e` (with Postgres + Redis up) | All 11 e2e cases pass (5 redirect + 6 auth/throttle) |

---

## Pass/Fail Summary Template

Copy into a sheet for execution:

```
| Test ID | Description                              | Pass | Notes |
|---------|------------------------------------------|------|-------|
| TC-1.1  | Login with valid credentials             |  ☐   |       |
| TC-1.2  | Login with invalid credentials           |  ☐   |       |
| TC-1.3  | Protected route without login            |  ☐   |       |
| TC-1.4  | Logout                                   |  ☐   |       |
| TC-2.1  | Add Lazada product via URL               |  ☐   |       |
| TC-2.2  | Add Shopee offer to same product (merge) |  ☐   |       |
| TC-2.3  | Raw SKU handling                         |  ☐   |       |
| TC-2.4  | Best price flag                          |  ☐   |       |
| TC-2.5  | Invalid URL rejection                    |  ☐   |       |
| TC-3.1  | Create valid campaign                    |  ☐   |       |
| TC-3.2  | Validation: end before start             |  ☐   |       |
| TC-3.3  | Validation: invalid UTM                  |  ☐   |       |
| TC-4.1  | Generate Lazada link                     |  ☐   |       |
| TC-4.2  | Generate Shopee link                     |  ☐   |       |
| TC-4.3  | Missing offer rejection                  |  ☐   |       |
| TC-4.4  | Idempotent re-generation                 |  ☐   |       |
| TC-5.1  | Public home                              |  ☐   |       |
| TC-5.2  | Campaign page                            |  ☐   |       |
| TC-5.3  | Lazada CTA 302 + UTM                     |  ☐   |       |
| TC-5.4  | Shopee CTA 302 + UTM                     |  ☐   |       |
| TC-5.5  | Unknown shortcode 404                    |  ☐   |       |
| TC-5.6  | Open redirect blocked                    |  ☐   |       |
| TC-6.1  | KPI cards                                |  ☐   |       |
| TC-6.2  | By-marketplace breakdown                 |  ☐   |       |
| TC-6.3  | By-campaign breakdown                    |  ☐   |       |
| TC-6.4  | Top products leaderboard                 |  ☐   |       |
| TC-6.5  | 7-day chart                              |  ☐   |       |
| TC-6.6  | Impression tracking + CTR                |  ☐   |       |
| TC-7.1  | Swagger UI                               |  ☐   |       |
| TC-7.2  | Health endpoint                          |  ☐   |       |
| TC-7.3  | Public endpoints                         |  ☐   |       |
| TC-7.4  | Admin endpoints require auth             |  ☐   |       |
| TC-8.1  | Input validation                         |  ☐   |       |
| TC-8.2  | Cookie security                          |  ☐   |       |
| TC-8.3  | Rate limit                               |  ☐   |       |
| TC-9.1  | Cron price refresh                       |  ☐   |       |
| TC-10.1 | Repo structure                           |  ☐   |       |
| TC-10.2 | CI green                                 |  ☐   |       |
| TC-10.3 | Tests pass locally                       |  ☐   |       |
```

Total: **39 test cases** covering authentication, product/campaign/link management, public flow, click tracking, impression tracking + CTR, analytics, API documentation, security, cron, and repo/CI.
