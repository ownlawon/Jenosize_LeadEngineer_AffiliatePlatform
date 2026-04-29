import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/api';

/**
 * Public endpoint — no auth required. Shopper on the landing page calls this
 * when product cards become visible (IntersectionObserver). We forward the
 * caller's headers so the API records a faithful referrer / user-agent / IP.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const xff =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    req.ip ??
    '';
  const upstream = await fetch(`${API_URL}/api/impressions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(req.headers.get('user-agent') ? { 'user-agent': req.headers.get('user-agent')! } : {}),
      ...(req.headers.get('referer') ? { referer: req.headers.get('referer')! } : {}),
      ...(xff ? { 'x-forwarded-for': xff } : {}),
    },
    body,
  });
  const text = await upstream.text();
  return new NextResponse(text || null, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
