# API recipes

> Copy-paste cURL commands that walk the live api end-to-end. Use these
> in lieu of Swagger when you want to script a smoke test, or paste them
> straight into a terminal during code review.

```bash
# Set this once per session
API=https://jenosizeapi-production.up.railway.app
```

---

## 1 · Health

```bash
curl -s "$API/health" | jq
```

Returns `{ status, uptimeSec, timestamp, checks: { db, redis } }`.
Returns **503** with the same payload if Postgres or Redis is down.

---

## 2 · Login → capture JWT into a shell variable

```bash
TOKEN=$(curl -s -X POST "$API/api/auth/login" \
  -H 'content-type: application/json' \
  -d '{"email":"admin@jenosize.test","password":"ChangeMe!2025"}' \
  | jq -r '.token')
```

`TOKEN` is good for 7 days. Use it as `Authorization: Bearer $TOKEN` on
every admin endpoint.

---

## 3 · Add a product

```bash
curl -s -X POST "$API/api/products" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"url":"https://www.lazada.co.th/products/matcha-001.html"}' \
  | jq
```

Repeat with the matching Shopee URL — same product (de-duped on title)
gains a second offer, and the `bestPrice: true` flag moves to whichever
offer is cheaper.

---

## 4 · List products (paginated)

```bash
curl -s "$API/api/products?page=1&pageSize=10" | jq '.items[] | {id, title, offers: [.offers[] | {marketplace, price, bestPrice}]}'
```

The envelope is `{ items, total, page, pageSize, pageCount }` everywhere
list endpoints exist.

---

## 5 · Create a campaign

```bash
curl -s -X POST "$API/api/campaigns" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -d '{
    "name": "Summer Deal 2025",
    "utmCampaign": "summer_deal_2025",
    "startAt": "2025-06-01T00:00:00.000Z",
    "endAt": "2025-08-31T23:59:59.000Z"
  }' \
  | jq
```

---

## 6 · Generate an affiliate short link

```bash
PRODUCT_ID=$(curl -s "$API/api/products" | jq -r '.items[0].id')
CAMPAIGN_ID=$(curl -s "$API/api/campaigns" | jq -r '.items[0].id')

curl -s -X POST "$API/api/links" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"campaignId\":\"$CAMPAIGN_ID\",\"marketplace\":\"LAZADA\"}" \
  | jq
```

The response is the canonical `LinkDto` — note the `shortUrl` field:
`https://<api>/go/<code>`.

---

## 7 · Hit the redirect (no follow)

```bash
SHORT=$(curl -s "$API/api/links" -H "authorization: Bearer $TOKEN" \
  | jq -r '.items[0].shortCode')

curl -s -i "$API/go/$SHORT" | head -10
```

Expected:

```
HTTP/2 302
location: https://www.lazada.co.th/products/matcha-001.html?utm_source=jenosize&utm_medium=affiliate&utm_campaign=summer_deal_2025
```

The click is recorded asynchronously — wait ~200ms then check the
dashboard.

---

## 8 · Dashboard summary

```bash
curl -s "$API/api/dashboard" -H "authorization: Bearer $TOKEN" | jq
```

Response includes `totalClicks`, `activeCampaigns`, `byMarketplace`,
`byCampaign`, and `clicksLast7Days` for the chart.

---

## 9 · Top products leaderboard

```bash
curl -s "$API/api/dashboard/top-products?limit=5" -H "authorization: Bearer $TOKEN" | jq
```

---

## 10 · Reset the demo (admin only)

```bash
curl -s -X POST "$API/api/admin/reset-demo" \
  -H "authorization: Bearer $TOKEN" \
  | jq
```

Wipes Click → Link → Campaign → Offer → Product, then re-runs the seed.
Returns `{ products, links, clicks }` counts. Admin users are preserved.

---

## 11 · Negative tests (sanity checks)

```bash
# Auth guard — should be 401
curl -s -o /dev/null -w '%{http_code}\n' \
  -X POST "$API/api/products" \
  -H 'content-type: application/json' \
  -d '{"url":"x"}'

# Validation — should be 400
curl -s -X POST "$API/api/auth/login" \
  -H 'content-type: application/json' \
  -d '{"email":"not-an-email","password":"short"}' | jq

# Login throttle — burst 10 attempts, expect 5×200 then 5×429
for i in $(seq 1 10); do
  curl -s -o /dev/null -w '%{http_code} ' \
    -X POST "$API/api/auth/login" \
    -H 'content-type: application/json' \
    -d '{"email":"admin@jenosize.test","password":"ChangeMe!2025"}'
done; echo

# Unknown short code — should be 404
curl -s -o /dev/null -w '%{http_code}\n' "$API/go/zzzzzz"
```
