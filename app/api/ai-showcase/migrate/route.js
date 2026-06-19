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

async function fetchWithTimeout(url, options = {}, ms = 60000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function POST() {
  const primaryURL = joinURL(joinURL(API_BASE, API_BASE_PATH || ''), '/ai-showcase/migrate');
  const fallbackURL = joinURL(API_BASE, '/ai-showcase/migrate');

  try {
    let resp = await fetchWithTimeout(primaryURL, { method: 'POST', cache: 'no-store' });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.warn(`[ai-showcase/migrate] primary failed ${resp.status}: ${text}`);
      resp = await fetchWithTimeout(fallbackURL, { method: 'POST', cache: 'no-store' });
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
    console.error('[ai-showcase/migrate] proxy error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to migrate: ' + (err?.message || 'unknown') },
      { status: 502 }
    );
  }
}
