'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const SAMPLES = [
  { url: 'https://www.lazada.co.th/products/matcha-001.html', label: 'Lazada · Matcha' },
  { url: 'https://shopee.co.th/product/123456/matcha-001', label: 'Shopee · Matcha' },
  { url: 'https://www.lazada.co.th/products/yoga-mat-77.html', label: 'Lazada · Yoga Mat' },
  { url: 'https://shopee.co.th/product/123456/yoga-mat-77', label: 'Shopee · Yoga Mat' },
  {
    url: 'https://www.lazada.co.th/products/wireless-earbuds-x9.html',
    label: 'Lazada · Earbuds',
  },
  { url: 'https://shopee.co.th/product/123456/wireless-earbuds-x9', label: 'Shopee · Earbuds' },
  {
    url: 'https://www.lazada.co.th/products/coffee-beans-arabica.html',
    label: 'Lazada · Coffee Beans',
  },
  {
    url: 'https://shopee.co.th/product/123456/coffee-beans-arabica',
    label: 'Shopee · Coffee Beans',
  },
  {
    url: 'https://www.lazada.co.th/products/skincare-glow-set.html',
    label: 'Lazada · Skincare Set',
  },
  {
    url: 'https://shopee.co.th/product/123456/skincare-glow-set',
    label: 'Shopee · Skincare Set',
  },
  {
    url: 'https://www.lazada.co.th/products/mechanical-keyboard-75.html',
    label: 'Lazada · Keyboard',
  },
  {
    url: 'https://shopee.co.th/product/123456/mechanical-keyboard-75',
    label: 'Shopee · Keyboard',
  },
];

export default function AddProductForm() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(target?: string) {
    const value = (target ?? url).trim();
    if (!value) return;
    setLoading(true);
    const tid = toast.loading('Adding product…');
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: value }),
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
        className="flex flex-col gap-3 md:flex-row"
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a sample URL or click a Quick Sample below"
          className="input flex-1"
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Adding…' : 'Add product'}
        </button>
      </form>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs uppercase tracking-wide text-slate-500">Quick samples</p>
          <span className="text-[11px] text-slate-400">
            Hover a button to see the URL it submits — paste any of those into the
            field above to test the form by hand.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.url}
              type="button"
              onClick={() => submit(s.url)}
              disabled={loading}
              title={s.url}
              className="btn-outline text-xs"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
