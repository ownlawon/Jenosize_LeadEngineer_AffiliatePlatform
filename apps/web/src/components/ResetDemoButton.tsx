'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Demo-only control: wipes domain data and re-seeds the fixture catalogue.
 * Hidden behind a confirm() prompt because the action is destructive even
 * though the data is mock — anyone running through the UAT shouldn't fire
 * it accidentally between test cases.
 */
export default function ResetDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reset() {
    if (loading) return;
    const confirmed = window.confirm(
      'Reset the demo to a clean state?\n\n' +
        'This will delete every product, campaign, link, and click row, then ' +
        're-seed 3 starter products + Summer Deal 2025 + 6 links — leaving ' +
        'the other three Quick Samples (Coffee, Skincare, Keyboard) for the ' +
        'reviewer to add fresh.\n\n' +
        'Admin users are preserved.',
    );
    if (!confirmed) return;
    setLoading(true);
    const tid = toast.loading('Resetting demo data…');
    try {
      const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? data?.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        products: number;
        links: number;
        clicks: number;
        impressions: number;
      };
      toast.success(
        `Reset complete — ${data.products} products / ${data.links} links / ${data.clicks} clicks / ${data.impressions} impressions wiped`,
        { id: tid },
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reset failed', { id: tid });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group/reset relative inline-flex items-center">
      <button
        type="button"
        onClick={reset}
        disabled={loading}
        aria-describedby="reset-demo-hint"
        className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60"
      >
        {loading ? 'Resetting…' : 'Reset demo data'}
      </button>
      {/* Hover/focus popover — touch users get the same copy via the
          confirm() dialog when they actually press the button. */}
      <span
        id="reset-demo-hint"
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 origin-top-right rounded-md border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-600 opacity-0 shadow-lg transition-opacity duration-150 group-hover/reset:opacity-100 group-focus-within/reset:opacity-100"
      >
        Wipes <span className="font-medium text-slate-900">all products, campaigns, links, and clicks</span>,
        then re-seeds 3 starter products + 1 campaign + 6 links. The other
        three SKUs stay un-seeded so reviewers can add them via Quick Samples.
        Admin users are preserved.
      </span>
    </div>
  );
}
