'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const search = useSearchParams();
  const next = search.get('next') ?? '/admin/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? 'Login failed');
      }
      // Full page navigation so the just-set httpOnly cookie is included in
      // the next request — router.push() is a client-side soft-nav and the
      // middleware sometimes runs before the browser commits Set-Cookie,
      // bouncing the user back to /login on the first attempt.
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Admin login</h1>
          <p className="text-sm text-slate-500">Jenosize Affiliate Platform</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoComplete="username"
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <details className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium text-slate-600">
            Demo credentials (for reviewers)
          </summary>
          <div className="mt-2 space-y-1 font-mono">
            <div>
              <span className="text-slate-400">email:</span> admin@jenosize.test
            </div>
            <div>
              <span className="text-slate-400">password:</span> ChangeMe!2025
            </div>
          </div>
        </details>
      </form>
    </div>
  );
}
