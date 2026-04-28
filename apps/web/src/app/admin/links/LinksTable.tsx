'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { LinkDto } from '@jenosize/shared';

/** Best-effort host extraction; safe for malformed strings. */
function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

export default function LinksTable({ links }: { links: LinkDto[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
      toast.success('Short URL copied to clipboard');
    } catch {
      toast.error('Clipboard not available — copy manually from the link');
    }
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Short link</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Marketplace</th>
            <th className="px-4 py-3 text-right font-medium text-slate-600">Clicks</th>
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
            links.map((l) => {
              const targetHost = hostOf(l.targetUrl);
              return (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <a
                        href={l.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={l.shortUrl}
                        className="font-mono text-sm font-semibold text-brand-600 hover:underline"
                      >
                        /go/{l.shortCode}
                      </a>
                      <span
                        className="truncate text-xs text-slate-400"
                        title={l.targetUrl}
                      >
                        → {targetHost || l.targetUrl}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-slate-100 text-slate-700">{l.marketplace}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.clickCount ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => copy(l.shortUrl, l.id)}
                      className="btn-outline text-xs"
                    >
                      {copied === l.id ? 'Copied' : 'Copy'}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
