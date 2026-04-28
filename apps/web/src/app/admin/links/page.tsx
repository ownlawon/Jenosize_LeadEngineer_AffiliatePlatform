import { apiFetch } from '@/lib/api';
import type { CampaignDto, LinkDto, Paginated, ProductDto } from '@jenosize/shared';
import GenerateLinkForm from './GenerateLinkForm';
import LinksTable from './LinksTable';

export const dynamic = 'force-dynamic';

export default async function AdminLinksPage() {
  const [products, campaigns, links] = await Promise.all([
    apiFetch<Paginated<ProductDto>>('/api/products?pageSize=100', { authed: true }),
    apiFetch<Paginated<CampaignDto>>('/api/campaigns?pageSize=100', { authed: true }),
    apiFetch<Paginated<LinkDto>>('/api/links?pageSize=100', { authed: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Links</h1>
        <p className="text-sm text-slate-500">
          Generate trackable affiliate short links per product · campaign · marketplace
        </p>
      </div>

      <GenerateLinkForm products={products.items} campaigns={campaigns.items} />

      <LinksTable
        links={links.items}
        products={products.items}
        campaigns={campaigns.items}
      />
    </div>
  );
}
