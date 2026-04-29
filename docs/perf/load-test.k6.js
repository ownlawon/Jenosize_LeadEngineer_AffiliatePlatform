/**
 * k6 load test for the redirect hot path (`GET /go/:code`).
 *
 * Run locally against the deployed Railway URL:
 *
 *   BASE_URL=https://jenosizeapi-production.up.railway.app \
 *   SHORT_CODE=<a real short code from /admin/links> \
 *   k6 run docs/perf/load-test.k6.js
 *
 * Or against local docker-compose:
 *   pnpm dev   # boots api + web
 *   BASE_URL=http://localhost:3001 SHORT_CODE=<code> k6 run docs/perf/load-test.k6.js
 *
 * Output: open the summary k6 prints at the end + the JSON in
 * `docs/perf/results/`. Compare p50/p95/p99 against the targets in
 * ADR-003 / docs/architecture.md (p50 < 10 ms warm, p95 < 30 ms).
 *
 * Why this script doesn't follow redirects: the marketplace 302
 * Location target is outside our system; following it just times
 * Lazada/Shopee, not us.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3001";
const SHORT_CODE = __ENV.SHORT_CODE || "replace";

export const options = {
  scenarios: {
    warmup: {
      executor: "constant-arrival-rate",
      rate: 100,
      timeUnit: "1s",
      duration: "60s",
      preAllocatedVUs: 30,
      maxVUs: 100,
      tags: { phase: "warmup" },
    },
    steady: {
      executor: "ramping-arrival-rate",
      startTime: "60s",
      startRate: 100,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 300,
      stages: [
        { target: 300, duration: "60s" },
        { target: 300, duration: "120s" },
      ],
      tags: { phase: "steady" },
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.001"], // <0.1% errors
    http_req_duration: ["p(50)<10", "p(95)<30", "p(99)<60"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(95)", "p(99)", "max"],
};

export default function () {
  const res = http.get(`${BASE_URL}/go/${SHORT_CODE}`, { redirects: 0 });
  check(res, {
    "status is 302": (r) => r.status === 302,
    "has Location header": (r) =>
      Boolean(r.headers["Location"] || r.headers["location"]),
  });
  // Tiny think time so we don't bot-stamp a pure benchmark loop.
  sleep(0.01);
}
