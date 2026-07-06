import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  'http://127.0.0.1:8080/api/v1';

let API_BASE = 'http://127.0.0.1:8080';
let API_BASE_PATH = '/api/v1';
try {
  const u = new URL(API_URL);
  API_BASE = `${u.protocol}//${u.host}`;
  API_BASE_PATH = u.pathname || '/api/v1';
} catch { /* keep defaults */ }

const joinURL = (base, path) =>
  `${base.replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;

async function fetchWithTimeout(url, options = {}, ms = 10000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const primaryURL = joinURL(joinURL(API_BASE, API_BASE_PATH || ''), '/publications/search') + '?' + searchParams.toString();
  const fallbackURL = joinURL(API_BASE, '/publications/search') + '?' + searchParams.toString();

  try {
    let resp = await fetchWithTimeout(primaryURL, { cache: 'no-store' });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.warn(`[publications/search] primary failed ${resp.status}: ${text}`);
      resp = await fetchWithTimeout(fallbackURL, { cache: 'no-store' });
      if (!resp.ok) {
        const text2 = await resp.text().catch(() => '');
        return NextResponse.json(
          { success: false, error: `Backend error: ${resp.status} ${text2}` },
          { status: 502 }
        );
      }
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[publications/search] proxy error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch publications: ' + (err?.message || 'unknown') },
      { status: 502 }
    );
  }
}
