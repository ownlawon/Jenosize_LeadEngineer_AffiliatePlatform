import { notFound } from 'next/navigation';
import Image from 'next/image';
import Nav from '@/components/Nav';
import { apiFetch, ApiError } from '@/lib/api';

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
        })),
      };
    const matchOffer = p.offers.find((o) => o.marketplace === link.marketplace);
    if (matchOffer) matchOffer.shortCode = link.shortCode;
    grouped.set(link.product.id, p);
  }
  const products = Array.from(grouped.values());

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
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
              <ProductRow key={p.productId} product={p} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function ProductRow({ product }: { product: ProductWithLinks }) {
  const minPrice = product.offers.length
    ? Math.min(...product.offers.map((o) => o.price))
    : null;
  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative h-36 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.title} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{product.title}</h3>
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
                    {isBest && (
                      <span className="badge bg-emerald-600 text-white">Best price</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{o.storeName}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ฿{o.price.toLocaleString()}
                  </div>
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
