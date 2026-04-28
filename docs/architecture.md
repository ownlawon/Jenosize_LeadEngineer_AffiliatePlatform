# Architecture

This document expands on the [README architecture overview](../README.md#architecture) with sequence diagrams, request lifecycles, and the smoke-test checklist.

---

## Data model (ER diagram)

```mermaid
erDiagram
    USER {
      string id PK
      string email UK
      string password "bcrypt hash"
      datetime createdAt
    }
    PRODUCT {
      string id PK
      string title
      string imageUrl
      datetime createdAt
    }
    OFFER {
      string id PK
      string productId FK
      enum   marketplace "LAZADA | SHOPEE"
      string storeName
      decimal price
      string currency
      string externalUrl
      string externalId
      datetime lastCheckedAt
    }
    CAMPAIGN {
      string id PK
      string name
      string utmSource
      string utmMedium
      string utmCampaign
      datetime startAt
      datetime endAt
    }
    LINK {
      string id PK
      string productId FK
      string campaignId FK
      enum   marketplace
      string shortCode UK
      string targetUrl
      datetime createdAt
    }
    CLICK {
      string id PK
      string linkId FK
      datetime timestamp
      string referrer
      string userAgent
      string ipHash "sha256(ip + salt)"
    }

    PRODUCT  ||--o{ OFFER : "has"
    PRODUCT  ||--o{ LINK  : "promoted by"
    CAMPAIGN ||--o{ LINK  : "groups"
    LINK     ||--o{ CLICK : "tracked by"
```

> The unique `(productId, marketplace)` index on `Offer` and
> `(productId, campaignId, marketplace)` on `Link` keep the model
> idempotent: re-adding the same product or generating the same link
> upserts in place instead of creating duplicates.

---

## Module dependency graph

```mermaid
flowchart LR
  subgraph apps_web [apps/web · Next.js]
    Public[Public pages /, /c/:id]
    Admin[/admin/* · middleware-guarded/]
    WebProxy[/api/* · proxy to api/]
  end

  subgraph apps_api [apps/api · NestJS]
    Auth[AuthModule]
    Products[ProductsModule]
    Campaigns[CampaignsModule]
    Links[LinksModule]
    Redirect[RedirectModule]
    Dashboard[DashboardModule]
    Jobs[JobsModule · cron]
  end

  Public -->|REST| Campaigns
  Admin -->|cookie auth| WebProxy
  WebProxy -->|Bearer JWT| Auth
  WebProxy --> Products
  WebProxy --> Campaigns
  WebProxy --> Links
  WebProxy --> Dashboard

  Products --> Adapters[(packages/adapters)]
  Jobs --> Adapters
  Auth --> Prisma[(Prisma · Postgres)]
  Products --> Prisma
  Campaigns --> Prisma
  Links --> Prisma
  Dashboard --> Prisma
  Redirect --> Prisma
  Redirect --> Redis[(Redis cache)]
```

---

## Redirect lifecycle (hot path)

```mermaid
sequenceDiagram
    autonumber
    participant U as Browser
    participant W as apps/web
    participant N as Next rewrite
    participant A as apps/api · RedirectController
    participant S as RedirectService
    participant R as Redis
    participant D as Postgres
    participant M as Lazada/Shopee

    U->>W: GET /go/abc12345
    W->>N: matches rewrites()
    N->>A: GET /go/abc12345
    A->>S: resolveAndTrack(code, meta)
    S->>R: GET link:abc12345
    alt cache miss
        S->>D: SELECT link + campaign
        S->>R: SET link:abc12345 (TTL 300s)
    end
    S-->>A: target URL + UTMs appended
    A-->>U: 302 Location: marketplace URL
    par fire-and-forget click insert
        S->>D: INSERT INTO Click
    and
        U->>M: follows 302
    end
```

**Why this design:**
- Cache TTL is 5 min — short enough to pick up campaign UTM changes; long enough to amortize cold lookups.
- Click insert is `setImmediate`-deferred: a slow DB write never blocks the user's redirect.
- **Open-redirect defense**: even if a malicious targetUrl somehow landed in the DB, `appendUtm` rejects any host that isn't a Lazada/Shopee suffix.

---

## Add product flow (admin)

```mermaid
sequenceDiagram
    autonumber
    participant U as Admin
    participant W as apps/web /admin/products
    participant N as /api/products (proxy)
    participant A as apps/api ProductsController
    participant Ad as @jenosize/adapters
    participant D as Postgres

    U->>W: paste URL → submit form
    W->>N: POST /api/products { url }
    N->>A: forward Bearer JWT
    A->>Ad: detectMarketplace(url)
    A->>Ad: getAdapter(market).parseUrl(url)
    A->>Ad: adapter.fetchProduct(externalId)
    Ad-->>A: { title, image, price, ... }
    A->>D: upsert Product + Offer
    A-->>N: ProductDto with bestPrice flag
    N-->>W: 200
    W->>W: router.refresh() → re-render list
```

---

## Smoke test (post-deploy)

After deploying to Railway, walk through this checklist on the public URLs:

- [ ] **API health** — `GET <api>/health` returns `{status:"ok"}`
- [ ] **Swagger** — `<api>/api/docs` loads with all 13 endpoints
- [ ] **Login** — `<web>/admin/login` with seeded credentials redirects to `/admin/dashboard`
- [ ] **Add product** (Lazada) — paste `https://www.lazada.co.th/products/matcha-001.html` → row appears with offer
- [ ] **Add product** (Shopee) — paste `https://shopee.co.th/product/123456/matcha-001` → second offer appears on same product, **Best price** badge moves to whichever is cheaper
- [ ] **Create campaign** "Summer Deal 2025" with UTM `summer_deal_2025`
- [ ] **Generate link** — Lazada and Shopee shortcodes produced
- [ ] **Public landing** — `<web>/c/:id` shows product card with both prices and CTAs
- [ ] **Click CTA** — opens marketplace URL with `utm_source=jenosize&utm_medium=affiliate&utm_campaign=summer_deal_2025`
- [ ] **Dashboard** — `<web>/admin/dashboard` totalClicks increments; bar chart for "today" non-zero
- [ ] **Top products** — leaderboard shows the product just clicked
- [ ] **Cron** — wait one tick (or use a manual trigger in dev) → `Offer.lastCheckedAt` advances
- [ ] **Logout** — cookie cleared; `/admin/dashboard` redirects to `/admin/login?next=...`

If every box is ticked, the submission is functionally complete.
