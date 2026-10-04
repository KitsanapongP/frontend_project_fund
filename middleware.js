import { NextResponse } from 'next/server';

// Limit this guard to the developer QA pages. Return 404 before streaming starts,
// so production cannot expose the preview or report an HTTP 200 not-found shell.
export function middleware() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.next();
}

export const config = { matcher: ['/dev/scopus-faculty-insights/:path*', '/dev/scopus-faculty-insights-integrated/:path*'] };
