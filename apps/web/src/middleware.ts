import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'access_token';

/**
 * Protect /admin/* routes:
 *  - Anonymous user → /admin/login?next=<path>
 *  - Authed user already on /admin/login → /admin/dashboard (no point
 *    re-logging in)
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;

  if (pathname === '/admin/login') {
    if (token) {
      const next = req.nextUrl.searchParams.get('next') || '/admin/dashboard';
      const target = req.nextUrl.clone();
      target.pathname = next.startsWith('/') ? next : '/admin/dashboard';
      target.search = '';
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  if (token) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
