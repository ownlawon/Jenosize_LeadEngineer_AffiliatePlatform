# Loom walkthrough — recording script (~7 min)

> Word-for-word teleprompter script. Read at a relaxed pace; total
> length lands at **~7:00–7:30** when delivered conversationally.
> The four mandatory checkpoints from the brief — Add → Compare →
> Generate → Click → Dashboard — are scenes 5–9.
>
> Symbols:
> **[SHOW]** — what's on screen
> **[DO]** — click / type / hover action
> **[SAY]** — exact words, in English

---

## Pre-flight (do before you press record)

- [ ] Login to admin → click **Reset demo data** → confirm. Wait
  for the green toast.
- [ ] Open four browser tabs, in this order:
  1. `https://jenosizeweb-production.up.railway.app` (signed-out
     tab — use private window)
  2. `https://jenosizeweb-production.up.railway.app/admin/login`
  3. `https://jenosizeapi-production.up.railway.app/api/docs`
  4. `https://github.com/ownlawon/Jenosize_LeadEngineer_AffiliatePlatform`
- [ ] Open your editor with three files in tabs:
  `apps/api/src/modules/redirect/redirect.service.ts`,
  `packages/adapters/src/types.ts`,
  `docs/decisions.md`.
- [ ] DevTools open in tab 2: **Network** tab, **Preserve log** ON.
- [ ] Loom: **HD 1080p**, **cursor highlight ON**, mic checked.
- [ ] Close Slack, mail, anything that could ping mid-recording.

---

## Scene 1 · Intro · 0:00 → 0:25

**[SHOW]** GitHub repo README, top of the page (badges row).

**[SAY]**
> "Hi, I'm Noppapadon. This is a seven-minute walkthrough of my
> submission for the Jenosize Lead Engineer assignment.
>
> The product is an affiliate platform that compares Lazada and
> Shopee prices for the same product, generates trackable short
> links per campaign, and reports clicks on an admin dashboard.
>
> I'll walk the user flow first, then spend the last minute on the
> architecture decisions behind it."

---

## Scene 2 · Architecture in 35 seconds · 0:25 → 1:00

**[DO]** Open `docs/architecture.md`. Scroll to the first Mermaid
diagram (overview).

**[SAY]**
> "Two apps, two packages, in one pnpm workspace.
>
> `apps/api` is a NestJS service. `apps/web` is a Next.js app with
> the public landing and the admin surface. They share types
> through `packages/shared`, and they reach Lazada and Shopee
> through a pluggable adapter in `packages/adapters` —
> deliberately a seam, so we can swap the mock implementation for
> the real Affiliate API without touching the api code."

**[DO]** Scroll down to the ER diagram.

**[SAY]**
> "Five entities — Product, Offer, Campaign, Link, Click —
> Postgres through Prisma, and Redis on the redirect hot path.
> That's the whole map."

---

## Scene 3 · Public landing · 1:00 → 1:30

**[DO]** Switch to tab 1 (the signed-out home page).

**[SAY]**
> "This is the public landing — what a shopper sees. Active
> campaigns are listed; they click into one, and they see products
> with both Lazada and Shopee prices side by side."

**[DO]** Click the "Summer Deal 2025" card. Wait for product cards
to render.

**[SAY]**
> "The cheaper marketplace earns the green Best-price badge, and
> the right-hand corner shows how much they'd save in baht. Click
> either Buy button and we'll redirect them — but I'll do that
> from the admin side in a minute so you can see what's happening
> on the wire."

---

## Scene 4 · Login · 1:30 → 2:10

**[DO]** Switch to tab 2 (`/admin/login`). DevTools should already
be open in this tab.

**[SAY]**
> "Admin side — the credentials are in the collapsible 'Demo
> credentials' block, so reviewers don't have to dig into the
> README."

**[DO]** Click the details to expand. Type the email and password.
Click **Sign in**.

**[SHOW]** Dashboard loads.

**[SAY]**
> "The dashboard is the operations view. KPIs at the top — total
> clicks, total links, average clicks per link, active campaigns.
> Below that, a seven-day click chart, click breakdown by
> marketplace and by campaign, and a top-products leaderboard.
>
> The red **Reset demo data** button on the top right wipes every
> domain row and re-seeds the fixture catalogue, so anyone
> reviewing this can return to a known-good state in one click."

---

## Scene 5 · Add products → compare view · 2:10 → 3:25

**[DO]** Click **Products** in the nav.

**[SAY]**
> "Adding a product takes a Lazada or Shopee URL — or a raw SKU.
> The form auto-detects the marketplace from the host. Quick-
> Sample buttons short-circuit the typing for the six fixture
> SKUs we ship."

**[DO]** Click **Lazada · Coffee Beans**. Wait for the toast.

**[SAY]**
> "There's the toast in the top-right — every admin action goes
> through a single notification surface, not inline error
> banners. The product just landed in the table with one Lazada
> offer."

**[DO]** Click **Shopee · Coffee Beans**.

**[SAY]**
> "Now the same product on Shopee. Notice it merged onto the
> existing row instead of creating a duplicate, and the green
> 'Best price' badge moved to whichever marketplace is cheaper.
>
> That's because Offers are unique on `(productId, marketplace)`,
> so re-adding the same SKU upserts in place — and the
> best-price flag is computed from the live Offer set every time
> we serve the product."

**[DO]** Click two more Quick Samples — say, Earbuds Lazada then
Earbuds Shopee — so the table has variety.

---

## Scene 6 · Create a campaign · 3:25 → 4:00

**[DO]** Click **Campaigns** in the nav.

**[SAY]**
> "A campaign groups affiliate links under a UTM tag. The form
> pre-fills with sensible defaults — name, UTM slug, start, end —
> and the slug is alphanumeric plus underscore or dash, because
> that's what Lazada, Shopee, and Google Analytics expect for a
> URL query parameter."

**[DO]** Use defaults (Summer Deal 2025). Click **Create campaign**.

**[SAY]**
> "Validation runs both client-side and server-side. End-before-
> start fires a toast immediately without a round trip; the
> server has the same check as defence in depth."

---

## Scene 7 · Generate short links · 4:00 → 4:40

**[DO]** Click **Links** in the nav.

**[SAY]**
> "Now we mint a short link — one for each product × campaign ×
> marketplace combination."

**[DO]** Pick the Coffee Beans product, Summer Deal 2025 campaign,
**LAZADA** marketplace. Click **Generate link**.

**[SAY]**
> "Each link gets a six-character nanoid over a confusable-free
> alphabet — no zero-vs-O ambiguity. The Copy button puts the
> full URL on the clipboard; the table shows the short path
> prominently with the destination host underneath, the way
> bit.ly's dashboard does it."

**[DO]** Generate one for SHOPEE too.

---

## Scene 8 · Click redirect with UTMs · 4:40 → 5:30

**[SAY]**
> "This next step is the load-bearing flow — what happens when a
> shopper clicks the affiliate link."

**[DO]** Open DevTools Network tab if not already open. Click
the Lazada short URL in the table — opens in a new tab.

**[DO]** Switch to that new tab. Highlight the Network panel
showing the 302.

**[SAY]**
> "One request, one 302. Look at the Location header — it points
> at Lazada's search page for arabica coffee beans, with
> `utm_source`, `utm_medium`, and `utm_campaign` appended.
>
> Three things happen on the server side: a Redis lookup of the
> short code, the UTM build, and a fire-and-forget Click insert
> that runs on the next event-loop tick — so the redirect itself
> is never gated on the database write.
>
> And there's a host whitelist on the redirect — even if a Link
> row ever pointed at a non-marketplace host, we'd return 400
> instead of acting as a phishing relay. There's an end-to-end
> test that asserts that exact behaviour."

---

## Scene 9 · Dashboard updated · 5:30 → 6:00

**[DO]** Switch back to the admin tab. Click **Dashboard**.

**[SAY]**
> "Total clicks ticked up. The by-marketplace breakdown reflects
> which one we just clicked, the campaign breakdown shows our
> click landed under 'Summer Deal 2025', and Top Products moves
> Coffee Beans up the leaderboard."

**[DO]** Hover over today's bar in the chart.

**[SAY]**
> "And today's bar in the seven-day chart updated."

---

## Scene 10 · Engineering decisions · 6:00 → 7:00

**[DO]** Open `docs/decisions.md` in the GitHub repo (or your
editor). Scroll slowly while talking.

**[SAY]**
> "Last minute — the decisions behind the code. The repo has
> seven Architecture Decision Records, one per load-bearing
> trade-off. I'll skim the highlights.
>
> First — mock adapters instead of real APIs. Both marketplaces
> require Affiliate Program approval, which doesn't fit a five-
> day delivery window. The pluggable adapter interface means the
> swap is one file, not a refactor.
>
> Second — Redis on the redirect hot path with a five-minute
> TTL. Turns the 302 into a single round trip in the same data
> centre. Click writes are deferred so a slow database doesn't
> slow the user.
>
> Third — JWT in an httpOnly cookie, not an Authorization
> header. Closes the XSS-token-exfiltration door even though the
> admin surface is server-rendered.
>
> Fourth — open-redirect host whitelist as a second line of
> defence; even if data is ever tampered with, we don't act as a
> phishing relay.
>
> Fifth — auto-seeding on first boot, plus a manual reset
> button, so a fresh deploy lands the reviewer on a populated
> dashboard with zero setup."

---

## Scene 11 · Closing · 7:00 → 7:25

**[DO]** Switch to the GitHub repo README.

**[SAY]**
> "The repo is at github.com/ownlawon — and the README points
> at the docs folder, where you'll find the ADRs, architecture
> diagrams with performance targets, a cURL recipe book, and a
> 38-case UAT plan. CI runs lint, typecheck, unit and end-to-end
> tests, and CodeQL on every push.
>
> Thank you for reviewing. Happy to dig into anything in detail."

**[DO]** Stop recording.

---

## Word count budget

- Scenes 1–11: ~1,000 words spoken
- At 140 words/min: **~7 min 10 s**
- Add ~10 s of natural pauses per scene → **~7 min 30 s** total

If you overshoot 8 minutes on a take, the scene to cut first is
**Scene 3** (public landing) — the Loom viewer can click the demo
URL themselves; you'll still hit all four mandatory checkpoints.

## Recording tips

- **Speak ~10 % slower than feels natural.** Reviewer comprehension
  benefits, especially for non-native English listeners.
- **Don't read every word verbatim.** The script is a safety net,
  not a teleprompter chain. Glance, then look at the screen, then
  speak. One natural "uh, let me show this" beats ten flat
  sentences.
- **Pause briefly between scenes** so Loom's editor has cut points.
- **Final review:** watch your own video at 1.25× speed before
  uploading. If anything is unclear at 1.25×, re-record that scene.

## Submission link

Once uploaded, drop the share URL into README's Demo section:

```md
**Demo video:** [Loom · 7-min walkthrough](https://www.loom.com/share/<your-id>)
```
