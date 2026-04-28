import { apiFetch } from '@/lib/api';
import type { DashboardSummary, TopProduct } from '@jenosize/shared';
import DashboardChart from './DashboardChart';
import ResetDemoButton from '@/components/ResetDemoButton';
import OnboardingCard from '@/components/OnboardingCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [summary, top] = await Promise.all([
    apiFetch<DashboardSummary>('/api/dashboard', { authed: true }),
    apiFetch<TopProduct[]>('/api/dashboard/top-products?limit=5', { authed: true }),
  ]);

  const ctr = summary.totalLinks > 0 ? (summary.totalClicks / summary.totalLinks).toFixed(2) : '0.00';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Aggregate stats across all campaigns</p>
        </div>
        <ResetDemoButton />
      </div>

      {summary.totalProducts === 0 && <OnboardingCard />}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Total clicks" value={summary.totalClicks} />
        <Stat label="Total links" value={summary.totalLinks} />
        <Stat label="Avg clicks / link" value={ctr} />
        <Stat
          label="Active campaigns"
          value={
            summary.activeCampaigns === summary.totalCampaigns
              ? summary.activeCampaigns
              : `${summary.activeCampaigns} / ${summary.totalCampaigns}`
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Clicks last 7 days</h2>
          <DashboardChart data={summary.clicksLast7Days} />
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">By marketplace</h2>
          {summary.byMarketplace.length === 0 ? (
            <p className="text-sm text-slate-500">No clicks yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.byMarketplace.map((m) => (
                <li key={m.marketplace} className="flex items-center justify-between">
                  <span className="font-medium">{m.marketplace}</span>
                  <span className="tabular-nums">{m.clicks}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">By campaign</h2>
          {summary.byCampaign.length === 0 ? (
            <p className="text-sm text-slate-500">No campaigns with clicks yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {summary.byCampaign.map((c) => (
                <li key={c.campaignId} className="flex items-center justify-between">
                  <span className="truncate">{c.name}</span>
                  <span className="tabular-nums">{c.clicks}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Top products</h2>
          {top.length === 0 ? (
            <p className="text-sm text-slate-500">No products yet.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {top.map((p, idx) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="w-5 text-slate-400">{idx + 1}.</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.title} className="h-10 w-10 rounded object-cover" />
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="font-semibold tabular-nums">{p.clicks}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}
