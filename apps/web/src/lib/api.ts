import { cookies } from 'next/headers';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AUTH_COOKIE = 'access_token';

interface FetchOpts extends RequestInit {
  authed?: boolean;
}

/** Server-side fetch helper. Forwards the auth cookie when authed=true. */
export async function apiFetch<T = unknown>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set('content-type', 'application/json');
  if (opts.authed) {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;
    if (token) headers.set('authorization', `Bearer ${token}`);
  }

  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Returns true if the request has a valid auth cookie. Used by middleware. */
export function isAuthenticated(): boolean {
  return Boolean(cookies().get(AUTH_COOKIE)?.value);
}
