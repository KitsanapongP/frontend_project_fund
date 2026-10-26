import test from 'node:test';
import assert from 'node:assert/strict';
import { additionalRoleIds, roleGrantPermissions } from '../role_grants.mjs';
import { resolvePreviewPermissions } from '../permission_presentation.mjs';
import { hasAdminPortalAccess, hasMemberPortalAccess, isPrimaryAdmin, isExecutiveOnly } from '../access_routing.js';

const catalog = [
  { role_id: 1, permission_codes: ['portal.member.access', 'submission.read.own'] },
  { role_id: 3, permission_codes: ['portal.admin.access', 'access.manage', 'ui.page.admin.applications.view'] },
  { role_id: 4, permission_codes: ['submission.read.own', 'dept_head.review.recommend'] },
];

test('teacher can receive the complete Admin grant while preserving teacher identity and landing', () => {
  const user = { role_id: 1, permissions: roleGrantPermissions(catalog, 1, ['3']) };
  assert.equal(isPrimaryAdmin(user), false);
  assert.equal(hasMemberPortalAccess(user), true);
  assert.equal(hasAdminPortalAccess(user), true);
  for (const code of catalog[1].permission_codes) assert.ok(user.permissions.includes(code));
  assert.equal(user.role_id, 1);
});

test('multiple role grants form a union; removing a grant retains shared and primary permissions', () => {
  const both = roleGrantPermissions(catalog, 1, ['3', '4']);
  assert.equal(both.filter((code) => code === 'submission.read.own').length, 1);
  assert.ok(both.includes('access.manage'));
  const remaining = roleGrantPermissions(catalog, 1, ['4']);
  assert.ok(remaining.includes('dept_head.review.recommend'));
  assert.ok(remaining.includes('submission.read.own'));
  assert.ok(!remaining.includes('access.manage'));
  assert.deepEqual(roleGrantPermissions(catalog, 1, []), catalog[0].permission_codes);
});

test('preview uses the latest role catalog and keeps explicit deny above all role grants', () => {
  const updated = catalog.map((role) => role.role_id === 3
    ? { ...role, permission_codes: [...role.permission_codes, 'projects.manage'] } : role);
  const baseline = roleGrantPermissions(updated, 1, ['3']);
  const preview = resolvePreviewPermissions({ baselinePermissions: baseline,
    overrides: { 'access.manage': 'deny', 'submission.read.all': 'deny', 'report.export': 'allow' },
    implications: { 'access.manage': ['access.view'], 'ui.page.admin.applications.view': ['submission.read.all'] } });
  assert.ok(preview.has('projects.manage'));
  assert.ok(preview.has('report.export'));
  assert.ok(!preview.has('access.manage'));
  assert.ok(!preview.has('submission.read.all'));
});

test('saved additional role selection excludes the primary role and removes duplicates', () => {
  assert.deepEqual(additionalRoleIds([
    { role_id: 1, is_primary: true }, { role_id: 3, is_primary: false },
    { role_id: 4, is_primary: false }, { role_id: 3, is_primary: false },
  ]), ['3', '4']);
});

test('empty permission snapshots do not restore legacy role access', () => {
  assert.equal(hasAdminPortalAccess({ role_id: 3, permissions: [] }), false);
  assert.equal(hasMemberPortalAccess({ role_id: 1, permissions: [] }), false);
});

test('executive identity with an Admin grant gets full UI, teacher with executive grant gets executive UI', () => {
  assert.equal(isExecutiveOnly({ role_id: 5, permissions: ['portal.executive.access', 'portal.admin.access'] }), false);
  assert.equal(isExecutiveOnly({ role_id: 1, permissions: ['portal.executive.access'] }), true);
});
