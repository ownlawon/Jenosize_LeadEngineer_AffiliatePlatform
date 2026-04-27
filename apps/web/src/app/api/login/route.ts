import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

const COOKIE = 'access_token';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Browser → /api/login (web origin) → upstream /api/auth/login (api origin).
 * We forward credentials and re-issue the cookie on the web origin so the
 * browser stores it under the user-facing domain (avoids cross-site cookie issues).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const upstream = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { error: data?.message ?? 'Login failed' },
      { status: upstream.status },
    );
  }

  const res = NextResponse.json({ ok: true, user: data.user });
  if (data?.token) {
    res.cookies.set(COOKIE, data.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.floor(ONE_WEEK_MS / 1000),
    });
  }
  return res;
}
