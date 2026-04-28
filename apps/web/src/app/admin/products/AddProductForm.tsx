'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

type Sample = {
  url: string;
  label: string;
  externalId: string;
  marketplace: 'LAZADA' | 'SHOPEE';
};

const SAMPLES: Sample[] = [
  { url: 'https://www.lazada.co.th/products/matcha-001.html', label: 'Lazada · Matcha', externalId: 'matcha-001', marketplace: 'LAZADA' },
  { url: 'https://shopee.co.th/product/123456/matcha-001', label: 'Shopee · Matcha', externalId: 'matcha-001', marketplace: 'SHOPEE' },
  { url: 'https://www.lazada.co.th/products/yoga-mat-77.html', label: 'Lazada · Yoga Mat', externalId: 'yoga-mat-77', marketplace: 'LAZADA' },
  { url: 'https://shopee.co.th/product/123456/yoga-mat-77', label: 'Shopee · Yoga Mat', externalId: 'yoga-mat-77', marketplace: 'SHOPEE' },
  { url: 'https://www.lazada.co.th/products/wireless-earbuds-x9.html', label: 'Lazada · Earbuds', externalId: 'wireless-earbuds-x9', marketplace: 'LAZADA' },
  { url: 'https://shopee.co.th/product/123456/wireless-earbuds-x9', label: 'Shopee · Earbuds', externalId: 'wireless-earbuds-x9', marketplace: 'SHOPEE' },
  { url: 'https://www.lazada.co.th/products/coffee-beans-arabica.html', label: 'Lazada · Coffee Beans', externalId: 'coffee-beans-arabica', marketplace: 'LAZADA' },
  { url: 'https://shopee.co.th/product/123456/coffee-beans-arabica', label: 'Shopee · Coffee Beans', externalId: 'coffee-beans-arabica', marketplace: 'SHOPEE' },
  { url: 'https://www.lazada.co.th/products/skincare-glow-set.html', label: 'Lazada · Skincare Set', externalId: 'skincare-glow-set', marketplace: 'LAZADA' },
  { url: 'https://shopee.co.th/product/123456/skincare-glow-set', label: 'Shopee · Skincare Set', externalId: 'skincare-glow-set', marketplace: 'SHOPEE' },
  { url: 'https://www.lazada.co.th/products/mechanical-keyboard-75.html', label: 'Lazada · Keyboard', externalId: 'mechanical-keyboard-75', marketplace: 'LAZADA' },
  { url: 'https://shopee.co.th/product/123456/mechanical-keyboard-75', label: 'Shopee · Keyboard', externalId: 'mechanical-keyboard-75', marketplace: 'SHOPEE' },
];

interface AddProductFormProps {
  /** "<externalId>|<marketplace>" keys already present in the catalogue. */
  existingOfferKeys?: string[];
}

type MarketplaceChoice = 'AUTO' | 'LAZADA' | 'SHOPEE';

export default function AddProductForm({ existingOfferKeys = [] }: AddProductFormProps) {
  const existingSet = new Set(existingOfferKeys);
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [marketplace, setMarketplace] = useState<MarketplaceChoice>('AUTO');
  const [loading, setLoading] = useState(false);

  async function submit(target?: string, forceMarketplace?: 'LAZADA' | 'SHOPEE') {
    const value = (target ?? url).trim();
    if (!value) return;
    // Quick Samples carry their own marketplace; the form selector applies
    // only when the user submits via the input. AUTO sends no marketplace
    // hint so the backend's host-based detector takes over.
    const explicit: 'LAZADA' | 'SHOPEE' | undefined =
      forceMarketplace ?? (marketplace === 'AUTO' ? undefined : marketplace);
    setLoading(true);
    const tid = toast.loading('Adding product…');
    try {
      const body: { url: string; marketplace?: 'LAZADA' | 'SHOPEE' } = { url: value };
      if (explicit) body.marketplace = explicit;
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? data?.error ?? 'Failed to add product');
      }
      const product = (await res.json().catch(() => null)) as { title?: string } | null;
      toast.success(product?.title ? `Added "${product.title}"` : 'Product added', { id: tid });
      setUrl('');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add product', { id: tid });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <details className="group rounded-md border border-slate-200 bg-slate-50/60 text-xs text-slate-600 transition-colors open:border-amber-200 open:bg-amber-50/60 open:text-amber-800">
        <summary className="flex cursor-pointer list-none select-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
          <span className="font-medium">Demo mode</span>
          <span className="text-slate-400 group-open:hidden">— mock catalogue, 3 seeded + 3 to add via Quick Samples</span>
          <span className="ml-auto text-slate-400 group-open:hidden">Show details</span>
          <span className="ml-auto hidden text-amber-700 group-open:inline">Hide</span>
        </summary>
        <p className="border-t border-amber-200/60 px-3 py-2 leading-relaxed">
          The catalogue is backed by a mock adapter (per the assignment&apos;s
          allowance), so only the six sample SKUs in the Quick Samples below
          resolve. Real Lazada/Shopee URLs would work once the live affiliate
          adapter is wired up — see{' '}
          <code className="rounded bg-white/60 px-1 py-0.5">packages/adapters</code>.
        </p>
      </details>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:w-24">
            Marketplace
          </span>
          <div
            role="radiogroup"
            aria-label="Marketplace"
            className="inline-flex rounded-md border border-slate-200 bg-white p-0.5"
          >
            {(
              [
                { value: 'AUTO', label: 'Auto-detect' },
                { value: 'LAZADA', label: 'Lazada' },
                { value: 'SHOPEE', label: 'Shopee' },
              ] as const
            ).map((opt) => {
              const active = marketplace === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMarketplace(opt.value)}
                  className={cn(
                    'rounded px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              marketplace === 'AUTO'
                ? 'Paste a Lazada or Shopee URL — host detected automatically'
                : `Paste a ${marketplace === 'LAZADA' ? 'Lazada' : 'Shopee'} URL or just a SKU like "matcha-001"`
            }
            className="input flex-1"
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding…' : 'Add product'}
          </button>
        </div>

        {/* Detect "SKU-shaped" input while still on Auto-detect — Auto needs
            a URL host, so warn before the user submits and gets a 400. */}
        {(() => {
          const trimmed = url.trim();
          const looksLikeSku =
            trimmed.length > 0 && !trimmed.includes('/') && !trimmed.includes(':');
          if (!looksLikeSku || marketplace !== 'AUTO') return null;
          return (
            <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 sm:flex-row sm:items-center">
              <span className="flex-1">
                <span className="font-semibold">Looks like a SKU.</span>{' '}
                Auto-detect needs a URL host — pick a marketplace to resolve{' '}
                <code className="rounded bg-white/70 px-1 py-0.5 font-mono">
                  {trimmed}
                </code>
                .
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMarketplace('LAZADA')}
                  className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                >
                  Use Lazada
                </button>
                <button
                  type="button"
                  onClick={() => setMarketplace('SHOPEE')}
                  className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                >
                  Use Shopee
                </button>
              </div>
            </div>
          );
        })()}

        <p className="text-[11px] leading-relaxed text-slate-500">
          <span className="font-medium text-slate-600">Examples:</span>{' '}
          URL <code className="rounded bg-slate-100 px-1 py-0.5">https://www.lazada.co.th/products/matcha-001.html</code>{' '}
          · SKU <code className="rounded bg-slate-100 px-1 py-0.5">matcha-001</code>{' '}
          (with Lazada or Shopee selected)
        </p>
      </form>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500">Quick samples</p>
          <span className="text-[11px] text-slate-400">
            <span className="mr-0.5 inline-block rounded border border-emerald-300 bg-emerald-100 px-1 text-emerald-800">✓ added</span>
            <span className="mx-1">vs</span>
            <span className="mr-0.5 inline-block rounded border border-slate-200 bg-white px-1 text-slate-700">white</span>
            = ready to add
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => {
            const added = existingSet.has(`${s.externalId}|${s.marketplace}`);
            return (
              <button
                key={s.url}
                type="button"
                onClick={() => submit(s.url, s.marketplace)}
                disabled={loading}
                title={
                  added
                    ? `${s.url}\n\nAlready in the catalogue — clicking will refresh the price.`
                    : s.url
                }
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  added
                    ? 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80'
                    : 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                {added && (
                  <span aria-hidden className="text-[11px] leading-none">✓</span>
                )}
                {s.label}
              </button>
            );
          })}
        </div>

        <details className="mt-4 group rounded-md border border-slate-200 bg-slate-50/50 text-xs text-slate-600">
          <summary className="flex cursor-pointer list-none select-none items-center gap-2 px-3 py-2 font-medium text-slate-700 [&::-webkit-details-marker]:hidden">
            <span>Or paste a URL by hand</span>
            <span className="text-slate-400 group-open:hidden">— show 12 sample URLs</span>
            <span className="ml-auto text-slate-400 group-open:hidden">▾</span>
            <span className="ml-auto hidden text-slate-400 group-open:inline">▴</span>
          </summary>
          <div className="border-t border-slate-200 p-3 space-y-2">
            <p className="text-[11px] leading-relaxed text-slate-500">
              Copy any URL below into the input above and click{' '}
              <span className="font-medium text-slate-700">Add product</span>.
              Same effect as clicking the matching Quick Sample button.
            </p>
            <ul className="space-y-1 font-mono text-[11px]">
              {SAMPLES.map((s) => {
                const added = existingSet.has(`${s.externalId}|${s.marketplace}`);
                return (
                  <li
                    key={s.url}
                    className="flex items-center gap-2 rounded bg-white/60 px-2 py-1"
                  >
                    <span
                      className={cn(
                        'inline-block w-12 shrink-0 text-[10px] font-semibold uppercase tracking-wide',
                        s.marketplace === 'LAZADA'
                          ? 'text-orange-600'
                          : 'text-rose-600',
                      )}
                    >
                      {s.marketplace}
                    </span>
                    {added && (
                      <span
                        title="Already in the catalogue"
                        className="text-[10px] text-emerald-600"
                        aria-hidden
                      >
                        ✓
                      </span>
                    )}
                    <span className="truncate text-slate-700" title={s.url}>
                      {s.url}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          await navigator.clipboard.writeText(s.url);
                          toast.success('URL copied');
                        } catch {
                          toast.error('Clipboard not available');
                        }
                      }}
                      className="ml-auto rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Copy
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
