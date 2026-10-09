import test from 'node:test';
import assert from 'node:assert/strict';
import { facultyRoleArcLayout, facultyRoleSelection } from '../scopus_faculty_donut.mjs';
import { insightPercent } from '../scopus_faculty_insights.mjs';
const roles = (first, corresponding, coauthor, unknown = 0) => ({ first, corresponding, coauthor, unknown });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('20 + 82 of 226 yields 102 and 45.1%, unique roles in presentation order', () => {
  const summary = facultyRoleSelection(roles(20, 82, 124), 226, ['corresponding', 'first', 'first']);
  assert.deepEqual(summary.keys, ['first', 'corresponding']); assert.equal(summary.count, 102);
  assert.equal(insightPercent(summary.percent), '45.1%');
});
test('aggregate percentage rounds once from counts, rather than adding rounded percentages', () => {
  const summary = facultyRoleSelection(roles(1, 1, 1), 3, ['first', 'corresponding']);
  assert.equal(insightPercent(summary.percent), '66.7%');
});
test('none means full total; all roles partition the same total; zero selection keeps a missing percentage', () => {
  const data = roles(20, 82, 120, 4);
  assert.equal(facultyRoleSelection(data, 226, []).count, 226);
  assert.equal(facultyRoleSelection(data, 226, Object.keys(data)).count, 226);
  const zero = facultyRoleSelection(roles(0, 0, 0), 0, ['unknown']);
  assert.equal(zero.count, 0); assert.equal(zero.percent, null); assert.deepEqual(zero.keys, ['unknown']);
});
test('asymmetric First/Corresponding shares center their combined arc at 12 without distorting spans', () => {
  for (const data of [roles(20, 82, 120, 4), roles(1, 89, 3, 7), roles(80, 1, 14, 5)]) {
    const total = Object.values(data).reduce((a, b) => a + b), layout = facultyRoleArcLayout(data, total);
    assert.deepEqual(layout.map(role => role.key), ['first', 'corresponding', 'coauthor', 'unknown']);
    near((layout[0].start + layout[1].end) / 2, 0);
    near(layout.reduce((sum, role) => sum + role.span, 0), 360);
    for (let index = 0; index < 4; index++) {
      near(layout[index].span, data[layout[index].key] / total * 360);
      if (index) near(layout[index].start, layout[index - 1].end);
    }
  }
});
test('zero top pair starts at 12; full-circle and empty data have finite geometry and no artificial gap', () => {
  const full = facultyRoleArcLayout(roles(0, 0, 10), 10);
  assert.equal(full[2].start, 0); assert.equal(full[2].end, 360); assert.equal(full[2].gap, 0);
  const first = facultyRoleArcLayout(roles(10, 0, 0), 10)[0];
  assert.equal(first.start, -180); assert.equal(first.end, 180); assert.equal(first.gap, 0);
  assert.ok(facultyRoleArcLayout(roles(0, 0, 0), 0).every(role => role.start === 0 && role.end === 0));
});
test('new year proportions recompute the rotation instead of retaining the old offset', () => {
  const before = facultyRoleArcLayout(roles(31, 31, 91, 15), 168);
  const after = facultyRoleArcLayout(roles(30, 31, 92, 16), 169);
  assert.notEqual(before[0].start, after[0].start); near((after[0].start + after[1].end) / 2, 0);
});
