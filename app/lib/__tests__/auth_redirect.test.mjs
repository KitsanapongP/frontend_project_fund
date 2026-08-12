import test from 'node:test';
import assert from 'node:assert/strict';
import { getLoginRedirect } from '../auth_redirect.mjs';

test('logout redirects directly to login without a next parameter', () => {
  assert.equal(
    getLoginRedirect({
      isLoggingOut: true,
      currentPath: '/research-fund-system/member/dept-review',
    }),
    '/login',
  );
});

test('unauthenticated access preserves the requested path', () => {
  assert.equal(
    getLoginRedirect({
      isLoggingOut: false,
      currentPath: '/research-fund-system/member/dept-review?tab=pending',
    }),
    '/login?next=%2Fresearch-fund-system%2Fmember%2Fdept-review%3Ftab%3Dpending',
  );
});
