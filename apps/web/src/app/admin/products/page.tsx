import { apiFetch } from '@/lib/api';
import type { Paginated, ProductDto } from '@jenosize/shared';
import AddProductForm from './AddProductForm';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const data = await apiFetch<Paginated<ProductDto>>(
    '/api/products?pageSize=50',
    { authed: true },
  );
  const products = data.items;

  // Build a set of "<externalId>|<marketplace>" keys for the existing
  // offer pairs so the Quick Sample buttons can mark themselves as
  // already-added. Reviewer can see at a glance which fixtures still
  // bring fresh rows vs which would just upsert in place.
  const existingOfferKeys = new Set(
    products.flatMap((p) => p.offers.map((o) => `${o.externalId}|${o.marketplace}`)),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-sm text-slate-500">Add by Lazada/Shopee URL or SKU</p>
      </div>

      <AddProductForm existingOfferKeys={Array.from(existingOfferKeys)} />

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Lazada</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Shopee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-slate-400">
                  No products yet — add one above.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const lazada = p.offers.find((o) => o.marketplace === 'LAZADA');
                const shopee = p.offers.find((o) => o.marketplace === 'SHOPEE');
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-10 w-10 rounded object-cover"
                        />
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <OfferCell offer={lazada} />
                    </td>
                    <td className="px-4 py-3">
                      <OfferCell offer={shopee} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfferCell({ offer }: { offer: ProductDto['offers'][number] | undefined }) {
  if (!offer) return <span className="text-slate-300">—</span>;
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums">฿{offer.price.toLocaleString()}</span>
        {offer.bestPrice && <span className="badge bg-emerald-100 text-emerald-700">Best</span>}
      </div>
      <div className="text-xs text-slate-500">{offer.storeName}</div>
    </div>
  );
}
