'use client';

import { useState } from 'react';
import type { LinkDto } from '@jenosize/shared';

export default function LinksTable({ links }: { links: LinkDto[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Short URL</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Marketplace</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Clicks</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {links.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                No links yet.
              </td>
            </tr>
          ) : (
            links.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3">
                  <a
                    href={l.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-brand-600 hover:underline"
                  >
                    {l.shortUrl}
                  </a>
                </td>
                <td className="px-4 py-3">{l.marketplace}</td>
                <td className="px-4 py-3 tabular-nums">{l.clickCount ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => copy(l.shortUrl, l.id)} className="btn-outline text-xs">
                    {copied === l.id ? 'Copied' : 'Copy'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
