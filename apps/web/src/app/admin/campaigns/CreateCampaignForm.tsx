'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCampaignForm() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const inThreeMonths = new Date(Date.now() + 90 * 86400_000).toISOString().slice(0, 10);

  const [name, setName] = useState('Summer Deal 2025');
  const [utmCampaign, setUtm] = useState('summer_deal_2025');
  const [startAt, setStart] = useState(today);
  const [endAt, setEnd] = useState(inThreeMonths);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side guard so the user gets feedback before a round-trip.
    if (new Date(endAt) <= new Date(startAt)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          utmCampaign,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(`${endAt}T23:59:59`).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const raw = data?.message ?? data?.error ?? 'Failed to create';
        throw new Error(Array.isArray(raw) ? raw.join(', ') : String(raw));
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 md:grid-cols-2">
      <div>
        <label className="label">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
      </div>
      <div>
        <label className="label">UTM campaign</label>
        <input
          value={utmCampaign}
          onChange={(e) => setUtm(e.target.value)}
          pattern="[a-zA-Z0-9_\-]+"
          title="alphanumeric, underscore, dash"
          className="input"
          required
        />
      </div>
      <div>
        <label className="label">Start date</label>
        <input
          type="date"
          value={startAt}
          onChange={(e) => setStart(e.target.value)}
          className="input"
          required
        />
      </div>
      <div>
        <label className="label">End date</label>
        <input
          type="date"
          value={endAt}
          min={startAt}
          onChange={(e) => setEnd(e.target.value)}
          className="input"
          required
        />
      </div>
      {error && (
        <p className="md:col-span-2 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}
      <div className="md:col-span-2 flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Creating…' : 'Create campaign'}
        </button>
      </div>
    </form>
  );
}
