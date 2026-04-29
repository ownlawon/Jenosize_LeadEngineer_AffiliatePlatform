import { test, expect } from "@playwright/test";

/**
 * End-to-end happy path that mirrors the assignment's required demo flow:
 *   Login → Add product → Create campaign → Generate link → Click → Dashboard
 *
 * Assumptions (set up by `webServer` in playwright.config.ts + a running api):
 *   - api reachable at the URL the web app's NEXT_PUBLIC_API_URL points to
 *   - admin credentials match .env: admin@jenosize.test / ChangeMe!2025
 *   - Reset Demo button is functional (wipes + reseeds; we lean on it
 *     to start from a known state without coupling to test order)
 */
test.describe("Affiliate happy path", () => {
  test.beforeEach(async ({ page }) => {
    // Login first — the rest of the flow needs the access_token cookie.
    await page.goto("/admin/login");
    await page.getByRole("button", { name: /Fill demo credentials/i }).click();
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Reset to known state. The button confirms via window.confirm — accept it.
    page.on("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Reset demo data/i }).click();
    // Wait for the success toast so we know the seed completed.
    await expect(page.getByText(/Reset complete/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("login → add product → create campaign → generate link → click → dashboard updates", async ({
    page,
    request,
  }) => {
    // ── Step 1: Add a product via the Quick Sample shortcut ────────────────
    await page.getByRole("link", { name: /^Products$/ }).click();
    await expect(page).toHaveURL(/\/admin\/products/);

    // Wait for the table to render the 3 starter products from the reset.
    // Reading .count() right after navigation hits before hydration finishes,
    // so we use toHaveCount() which retries until the assertion holds.
    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(3, { timeout: 15_000 });

    // Coffee Beans is one of the 3 SKUs that the reset deliberately leaves
    // un-seeded so this click produces visible feedback (table grows to 4).
    await page.getByRole("button", { name: /Lazada · Coffee Beans/i }).click();
    await expect(rows).toHaveCount(4, { timeout: 15_000 });

    // Add the Shopee offer to the same product. Offer.unique([productId,
    // marketplace]) means it merges into the existing Coffee Beans row —
    // count stays at 4. We wait for the POST to complete instead of asserting
    // visual changes, since the row count is the same and per-row markup
    // varies between iterations.
    const shopeeResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/products") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Shopee · Coffee Beans/i }).click();
    const shopeeRes = await shopeeResponse;
    expect(shopeeRes.status()).toBeLessThan(400);
    await expect(rows).toHaveCount(4, { timeout: 15_000 });

    // ── Step 2: Create a campaign ──────────────────────────────────────────
    await page.getByRole("link", { name: /^Campaigns$/ }).click();
    await expect(page).toHaveURL(/\/admin\/campaigns/);

    const stamp = Date.now();
    const campaignName = `E2E Campaign ${stamp}`;
    const utmSlug = `e2e_${stamp}`;
    await page.getByLabel(/Name/i).fill(campaignName);
    await page.getByLabel(/UTM campaign/i).fill(utmSlug);
    const campaignResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/campaigns") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Create campaign/i }).click();
    const campaignRes = await campaignResponse;
    expect(campaignRes.status()).toBeLessThan(400);
    // Wait for the campaign to appear in the table (router.refresh roundtrip).
    await expect(page.getByRole("cell", { name: campaignName })).toBeVisible({
      timeout: 15_000,
    });

    // ── Step 3: Generate a link ────────────────────────────────────────────
    await page.getByRole("link", { name: /^Links$/ }).click();
    await expect(page).toHaveURL(/\/admin\/links/);

    // Pick the Coffee Beans option by reading its value off the DOM —
    // selectOption({ label }) requires a literal string and we don't want to
    // hardcode the fixture title (which could change). Same trick for
    // Campaign so the test is robust to ordering changes.
    const productSelect = page.getByLabel(/Product/i);
    const coffeeValue = await productSelect
      .locator("option")
      .filter({ hasText: /Coffee/i })
      .first()
      .getAttribute("value");
    expect(coffeeValue).toBeTruthy();
    await productSelect.selectOption(coffeeValue!);

    await page.getByLabel(/Campaign/i).selectOption({ label: campaignName });
    await page.getByLabel(/Marketplace/i).selectOption("LAZADA");
    const linkResponse = page.waitForResponse(
      (r) => r.url().includes("/api/links") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Generate link/i }).click();
    const linkRes = await linkResponse;
    expect(linkRes.status()).toBeLessThan(400);
    const linkBody = await linkRes.json();
    const shortCode = String(linkBody.shortCode);
    expect(shortCode).toMatch(/^[A-Za-z0-9]{6}$/);

    // ── Step 4: Click the redirect (without following the 302) ─────────────
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
    const redirectRes = await request.get(`${apiBase}/go/${shortCode}`, {
      maxRedirects: 0,
    });
    expect(redirectRes.status()).toBe(302);
    const location = redirectRes.headers()["location"];
    expect(location).toMatch(/lazada\.co\.th|lazada\.com/i);
    expect(location).toContain(`utm_campaign=${utmSlug}`);

    // ── Step 5: Verify dashboard reflects the click ────────────────────────
    await page.getByRole("link", { name: /^Dashboard$/ }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Total clicks should be ≥ 1 — the Click write is fire-and-forget so
    // give it a moment to land.
    await expect
      .poll(
        async () => {
          const text = await page
            .locator("p", { hasText: /Total clicks/i })
            .first()
            .locator("..")
            .innerText();
          const match = text.match(/\b(\d+)\b/);
          return match ? Number(match[1]) : 0;
        },
        {
          timeout: 10_000,
          message: "Dashboard total clicks did not increment after redirect",
        },
      )
      .toBeGreaterThanOrEqual(1);
  });
});
