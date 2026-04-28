import Link from 'next/link';
import Nav from '@/components/Nav';
import { apiFetch, isAuthenticated } from '@/lib/api';
import type { CampaignDto, Paginated } from '@jenosize/shared';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let campaigns: CampaignDto[] = [];
  try {
    const data = await apiFetch<Paginated<CampaignDto>>('/api/campaigns?pageSize=50');
    campaigns = data.items;
  } catch {
    campaigns = [];
  }
  const active = campaigns.filter((c) => c.active);

  return (
    <>
      <Nav admin={isAuthenticated()} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-12 overflow-hidden rounded-2xl border border-slate-200 bg-white p-10 shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]">
          <span className="badge bg-slate-100 text-slate-600">Affiliate · Lazada · Shopee</span>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.02em] text-slate-900 md:text-5xl">
            Compare marketplace prices,{' '}
            <span className="text-slate-400">track every click.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500">
            One short link per product — automatic UTM, click attribution, and a
            best-price badge across Lazada and Shopee.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/admin/login" className="btn-primary">
              Open admin →
            </Link>
            <a
              href="https://github.com/ownlawon/Jenosize_LeadEngineer_AffiliatePlatform"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              View source
            </a>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Active campaigns</h2>
          {active.length === 0 ? (
            <div className="card text-slate-500">
              No active campaigns yet.
              {campaigns.length > 0 && (
                <span className="ml-1">
                  Try one of the upcoming/expired campaigns below.
                </span>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {active.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}

          {campaigns.length > active.length && (
            <>
              <h3 className="mb-3 mt-10 text-sm font-semibold text-slate-500 uppercase tracking-wide">
                Other campaigns
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.filter((c) => !c.active).map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}

function CampaignCard({ campaign }: { campaign: CampaignDto }) {
  return (
    <Link href={`/c/${campaign.id}`} className="card block transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{campaign.name}</h3>
        <span
          className={`badge ${
            campaign.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {campaign.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-500">UTM: {campaign.utmCampaign}</p>
      <p className="mt-1 text-xs text-slate-400">
        {new Date(campaign.startAt).toLocaleDateString()} — {new Date(campaign.endAt).toLocaleDateString()}
      </p>
    </Link>
  );
}
