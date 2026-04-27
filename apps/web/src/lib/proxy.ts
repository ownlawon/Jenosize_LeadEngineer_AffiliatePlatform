import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from './api';

const COOKIE = 'access_token';

/** Forward an admin-authed request from a Next route handler to the API. */
export async function proxy(req: NextRequest, upstreamPath: string) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const init: RequestInit = {
    method: req.method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await req.text();
    if (body) init.body = body;
  }
  const upstream = await fetch(`${API_URL}${upstreamPath}`, init);
  const text = await upstream.text();
  return new NextResponse(text || null, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
