import { notFound } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { apiFetch, ApiError, isAuthenticated } from '@/lib/api';
import ProductRowClient from './ProductRowClient';

export const dynamic = 'force-dynamic';

interface CampaignWithLinks {
  id: string;
  name: string;
  utmCampaign: string;
  startAt: string;
  endAt: string;
  active: boolean;
  links: Array<{
    id: string;
    shortCode: string;
    marketplace: 'LAZADA' | 'SHOPEE';
    targetUrl: string;
    clickCount: number;
    product: {
      id: string;
      title: string;
      imageUrl: string;
      offers: Array<{
        id: string;
        marketplace: 'LAZADA' | 'SHOPEE';
        storeName: string;
        price: number;
        currency: string;
      }>;
    };
  }>;
}

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

export default async function CampaignPage({ params }: { params: { id: string } }) {
  let campaign: CampaignWithLinks;
  try {
    campaign = await apiFetch<CampaignWithLinks>(`/api/campaigns/${params.id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  // Group links by product so we can show one row per product with both marketplace CTAs
  const grouped = new Map<string, ProductWithLinks>();
  for (const link of campaign.links) {
    const p: ProductWithLinks =
      grouped.get(link.product.id) ?? {
        productId: link.product.id,
        title: link.product.title,
        imageUrl: link.product.imageUrl,
        offers: link.product.offers.map((o) => ({
          marketplace: o.marketplace,
          storeName: o.storeName,
          price: o.price,
          currency: o.currency,
          shortCode: undefined,
          linkId: undefined,
        })),
      };
    const matchOffer = p.offers.find((o) => o.marketplace === link.marketplace);
    if (matchOffer) {
      matchOffer.shortCode = link.shortCode;
      matchOffer.linkId = link.id;
    }
    grouped.set(link.product.id, p);
  }
  const products = Array.from(grouped.values());

  return (
    <>
      <Nav admin={isAuthenticated()} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-900"
        >
          <span aria-hidden>←</span> All campaigns
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="mt-2 text-sm text-slate-500">
            UTM <code className="rounded bg-slate-100 px-1.5 py-0.5">{campaign.utmCampaign}</code>{' '}
            • {new Date(campaign.startAt).toLocaleDateString()} →{' '}
            {new Date(campaign.endAt).toLocaleDateString()}
            {campaign.active ? (
              <span className="badge ml-2 bg-emerald-100 text-emerald-700">Active</span>
            ) : (
              <span className="badge ml-2 bg-slate-100 text-slate-500">Inactive</span>
            )}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="card text-slate-500">No products in this campaign yet.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((p) => (
              <ProductRowClient key={p.productId} product={p} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
