'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CampaignDto, ProductDto } from '@jenosize/shared';

interface Props {
  products: ProductDto[];
  campaigns: CampaignDto[];
}

export default function GenerateLinkForm({ products, campaigns }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '');
  const [marketplace, setMarketplace] = useState<'LAZADA' | 'SHOPEE'>('LAZADA');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableMarkets = useMemo(() => {
    const product = products.find((p) => p.id === productId);
    if (!product) return ['LAZADA', 'SHOPEE'] as const;
    return product.offers.map((o) => o.marketplace);
  }, [products, productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, campaignId, marketplace }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Failed to generate link');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate link');
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0 || campaigns.length === 0) {
    return (
      <div className="card text-sm text-slate-500">
        {products.length === 0 && <p>Add at least one product first.</p>}
        {campaigns.length === 0 && <p>Create at least one campaign first.</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 md:grid-cols-4">
      <div className="md:col-span-2">
        <label className="label">Product</label>
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input">
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Campaign</label>
        <select
          value={campaignId}
          onChange={(e) => setCampaignId(e.target.value)}
          className="input"
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Marketplace</label>
        <select
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value as 'LAZADA' | 'SHOPEE')}
          className="input"
        >
          {(['LAZADA', 'SHOPEE'] as const).map((m) => (
            <option key={m} value={m} disabled={!availableMarkets.includes(m)}>
              {m}
              {!availableMarkets.includes(m) ? ' (no offer)' : ''}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="md:col-span-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}
      <div className="md:col-span-4 flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Generating…' : 'Generate link'}
        </button>
      </div>
    </form>
  );
}
