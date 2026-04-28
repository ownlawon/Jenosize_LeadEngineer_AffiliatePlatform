import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { CampaignDto, Paginated } from '@jenosize/shared';
import CreateCampaignForm from './CreateCampaignForm';

export const dynamic = 'force-dynamic';

export default async function AdminCampaignsPage() {
  const data = await apiFetch<Paginated<CampaignDto>>(
    '/api/campaigns?pageSize=50',
    { authed: true },
  );
  const campaigns = data.items;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-sm text-slate-500">Group affiliate links under a UTM campaign</p>
      </div>

      <CreateCampaignForm />

      <div className="card overflow-hidden p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">UTM Campaign</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Period</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                      {c.utmCampaign}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(c.startAt).toLocaleDateString()} →{' '}
                    {new Date(c.endAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {c.active ? (
                      <span className="badge bg-emerald-100 text-emerald-700">Active</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/c/${c.id}`} className="text-brand-600 hover:underline">
                      Public page →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
