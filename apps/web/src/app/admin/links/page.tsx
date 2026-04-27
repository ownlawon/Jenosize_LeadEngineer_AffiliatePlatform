import { apiFetch } from '@/lib/api';
import type { CampaignDto, LinkDto, ProductDto } from '@jenosize/shared';
import GenerateLinkForm from './GenerateLinkForm';
import LinksTable from './LinksTable';

export const dynamic = 'force-dynamic';

export default async function AdminLinksPage() {
  const [products, campaigns, links] = await Promise.all([
    apiFetch<ProductDto[]>('/api/products', { authed: true }),
    apiFetch<CampaignDto[]>('/api/campaigns', { authed: true }),
    apiFetch<LinkDto[]>('/api/links', { authed: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Links</h1>
        <p className="text-sm text-slate-500">
          Generate trackable affiliate short links per product · campaign · marketplace
        </p>
      </div>

      <GenerateLinkForm products={products} campaigns={campaigns} />

      <LinksTable links={links} />
    </div>
  );
}
