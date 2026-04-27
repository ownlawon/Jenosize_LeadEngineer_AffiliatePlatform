import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'access_token';

/**
 * Protect /admin/* routes (except /admin/login). If no auth cookie present,
 * redirect to /admin/login with ?next=<original-path> for round-trip.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
