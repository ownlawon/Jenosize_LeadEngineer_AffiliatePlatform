import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve the user-facing origin even when Next.js sits behind a reverse
 * proxy (Railway forwards requests as http://localhost:3000 internally,
 * so req.url points at the loopback instead of the public domain).
 */
function publicOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto');
  if (forwardedHost) {
    return `${forwardedProto || 'https'}://${forwardedHost}`;
  }
  const host = req.headers.get('host');
  if (host) {
    return `${forwardedProto || 'http'}://${host}`;
  }
  return new URL(req.url).origin;
}

export async function POST(req: NextRequest) {
  const target = new URL('/admin/login', publicOrigin(req));
  const res = NextResponse.redirect(target, 303);
  res.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  return res;
}
