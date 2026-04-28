'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(target?: string) {
    const value = (target ?? url).trim();
    if (!value) return;
    setError(null);
    setLoading(true);
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
      setUrl('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <strong className="font-semibold">Demo mode:</strong> the catalogue is
        backed by a mock adapter (per the assignment&apos;s allowance), so only
        the six sample SKUs in the Quick Samples below resolve. Real
        Lazada/Shopee URLs would work once the live affiliate adapter is
        wired up — see{' '}
        <code className="rounded bg-white/60 px-1 py-0.5">packages/adapters</code>.
      </div>

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
      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Quick samples</p>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.url}
              type="button"
              onClick={() => submit(s.url)}
              disabled={loading}
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
