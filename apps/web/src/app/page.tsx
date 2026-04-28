import Link from 'next/link';
import Nav from '@/components/Nav';
import { apiFetch, isAuthenticated } from '@/lib/api';
import type { CampaignDto } from '@jenosize/shared';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let campaigns: CampaignDto[] = [];
  try {
    campaigns = await apiFetch<CampaignDto[]>('/api/campaigns');
  } catch {
    campaigns = [];
  }
  const active = campaigns.filter((c) => c.active);

  return (
    <>
      <Nav admin={isAuthenticated()} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-12 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-700 p-10 text-white shadow-lg">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Compare Lazada & Shopee prices in one place
          </h1>
          <p className="mt-3 max-w-2xl text-brand-100">
            Find the best deal across marketplaces, generated through Jenosize affiliate campaigns.
          </p>
          <Link
            href="/admin/login"
            className="mt-6 inline-block rounded-lg bg-white px-5 py-2 text-sm font-semibold text-brand-700 hover:bg-slate-100"
          >
            Open admin →
          </Link>
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
