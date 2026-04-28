'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
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
  const [loading, setLoading] = useState(false);

  const availableMarkets = useMemo(() => {
    const product = products.find((p) => p.id === productId);
    if (!product) return ['LAZADA', 'SHOPEE'] as const;
    return product.offers.map((o) => o.marketplace);
  }, [products, productId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading('Generating link…');
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
      const link = (await res.json().catch(() => null)) as { shortCode?: string } | null;
      toast.success(
        link?.shortCode ? `Generated /go/${link.shortCode}` : 'Link generated',
        { id: tid },
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate link', { id: tid });
    } finally {
      setLoading(false);
    }
  }

  if (products.length === 0 || campaigns.length === 0) {
    const missing: { label: string; href: string; cta: string }[] = [];
    if (products.length === 0)
      missing.push({
        label: 'You don’t have any products yet.',
        href: '/admin/products',
        cta: 'Add a product →',
      });
    if (campaigns.length === 0)
      missing.push({
        label: 'No campaigns exist to attach the link to.',
        href: '/admin/campaigns',
        cta: 'Create a campaign →',
      });
    return (
      <div className="card space-y-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            A link binds <span className="font-semibold">a product</span> to{' '}
            <span className="font-semibold">a campaign</span> for one
            marketplace — finish the prerequisites first.
          </p>
        </div>
        <ul className="space-y-2">
          {missing.map((m) => (
            <li
              key={m.href}
              className="flex flex-col gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm text-slate-600">{m.label}</span>
              <Link href={m.href} className="btn-outline self-start text-xs sm:self-auto">
                {m.cta}
              </Link>
            </li>
          ))}
        </ul>
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

      <div className="md:col-span-4 flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Generating…' : 'Generate link'}
        </button>
      </div>
    </form>
  );
}
