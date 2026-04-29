'use client';

import { useEffect, useRef } from 'react';

interface ProductWithLinks {
  productId: string;
  title: string;
  imageUrl: string;
  offers: Array<{
    marketplace: 'LAZADA' | 'SHOPEE';
    storeName: string;
    price: number;
    currency: string;
    shortCode?: string;
    linkId?: string;
  }>;
}

const SESSION_KEY = 'jenosize-impressions-v1';
// Require the card to occupy ≥50% of the viewport row before counting — prevents
// quick flicks past the page from inflating impressions.
const VIEW_RATIO = 0.5;
// Require 1s of continuous visibility before firing — filters bot-like
// machine-gun scrolling.
const VIEW_DURATION_MS = 1000;

export default function ProductRowClient({ product }: { product: ProductWithLinks }) {
  const ref = useRef<HTMLDivElement>(null);
  const linkIds = product.offers.map((o) => o.linkId).filter((id): id is string => Boolean(id));

  useEffect(() => {
    if (linkIds.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const node = ref.current;
    if (!node) return;

    // Already counted this card in the current session → skip silently. Stops
    // a single shopper from inflating the impression count by scrolling up
    // and down the page repeatedly.
    const seen = readSeen();
    const fresh = linkIds.filter((id) => !seen.has(id));
    if (fresh.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= VIEW_RATIO) {
            if (!timer) {
              timer = setTimeout(() => {
                fire(fresh);
                obs.disconnect();
              }, VIEW_DURATION_MS);
            }
          } else if (timer) {
            clearTimeout(timer);
            timer = undefined;
          }
        }
      },
      { threshold: VIEW_RATIO },
    );
    obs.observe(node);

    return () => {
      obs.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [linkIds]);

  const prices = product.offers.map((o) => o.price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const savings =
    minPrice !== null && maxPrice !== null && maxPrice > minPrice ? maxPrice - minPrice : 0;

  return (
    <div ref={ref} className="card flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-36 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-semibold">{product.title}</h3>
          {savings > 0 && (
            <span className="badge whitespace-nowrap bg-emerald-100 text-emerald-700">
              Save ฿{savings.toLocaleString()}
            </span>
          )}
        </div>
        <div className="mt-3 space-y-2">
          {product.offers.map((o) => {
            const isBest = o.price === minPrice;
            return (
              <div
                key={o.marketplace}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  isBest ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{o.marketplace}</span>
                    {isBest && <span className="badge bg-emerald-600 text-white">Best price</span>}
                  </div>
                  <div className="text-xs text-slate-500">{o.storeName}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular-nums">฿{o.price.toLocaleString()}</div>
                  {o.shortCode ? (
                    <a
                      href={`/go/${o.shortCode}`}
                      rel="nofollow sponsored"
                      className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline"
                    >
                      Buy on {o.marketplace} →
                    </a>
                  ) : (
                    <div className="text-xs text-slate-400">No link</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function readSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markSeen(ids: string[]) {
  try {
    const seen = readSeen();
    for (const id of ids) seen.add(id);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen]));
  } catch {
    // sessionStorage quota or disabled — give up silently, tracking is best-effort.
  }
}

function fire(linkIds: string[]) {
  markSeen(linkIds);
  void fetch('/api/impressions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ linkIds }),
    keepalive: true,
  }).catch(() => {
    // Best-effort; if it fails we don't retry — analytics shouldn't block UX.
  });
}
