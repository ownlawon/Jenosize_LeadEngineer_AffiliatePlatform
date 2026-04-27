import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Use the incoming request's origin so the redirect lands on whichever host
  // the user is on (Railway, custom domain, localhost in dev) instead of a
  // hard-coded base URL.
  const target = new URL('/admin/login', req.url);
  const res = NextResponse.redirect(target, 303);
  res.cookies.set('access_token', '', { path: '/', maxAge: 0 });
  return res;
}
