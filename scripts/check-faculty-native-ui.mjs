// Uses the real frontend API wrappers, auth middleware and local native MariaDB.
// The JWT and its session belong only to a disposable synthetic httptest server.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const manifestPath = resolve(process.env.SCOPUS_NATIVE_UI_HANDSHAKE_PATH || '');
assert.ok(manifestPath.startsWith(resolve('../.phase5-mariadb') + sep), 'Manifest must stay in the owned runtime');
const fixture = JSON.parse(await readFile(manifestPath, 'utf8'));
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3106';
for (const url of [origin, fixture.api_origin]) assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);
assert.equal(fixture.fixture_only, true);
assert.equal(fixture.documents, 246);
const directory = resolve('docs/faculty-insights-phase5-evidence');
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [], requests = [], checks = [], blocked = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => {
  const url = new URL(response.url());
  if (url.origin === fixture.api_origin) requests.push({ path: url.pathname, query: url.search, status: response.status() });
});
await page.route('**/*', route => {
  const url = new URL(route.request().url());
  if (![origin, fixture.api_origin].includes(url.origin)) { blocked.push(url.origin); return route.abort(); }
  return route.continue();
});
await page.addInitScript(({ token }) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user_data', JSON.stringify({ user_id: 9001, role_id: 3, email: 'admin@fixture.invalid' }));
}, { token: fixture.access_token });
const check = async (name, fn) => { await fn(); checks.push({ name, passed: true }); };
const total = count => page.getByRole('button', { name: `ดูผลงาน ทั้งหมด รวมตามตัวกรอง ${count} รายการ`, exact: true });
const close = async () => { await page.getByRole('button', { name: 'ปิดรายการผลงาน', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); };
const mutate = async action => {
  const result = await fetch(`${fixture.api_origin}/api/v1/__fixture/mutate`, { method: 'POST', headers: { Authorization: `Bearer ${fixture.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
  assert.equal(result.status, 200);
};
let passed = false;
try {
  await page.goto(`${origin}/dev/scopus-faculty-insights-integrated`);
  await total(246).waitFor();
  await check('real authenticated summary and explicit synthetic label', async () => {
    await page.getByRole('heading', { name: /MariaDB/ }).waitFor();
    assert.ok(requests.some(request => request.path.endsWith('/faculty-insights') && request.status === 200));
    await page.getByText('ลำดับนี้ใช้ป้องกันการนับซ้ำ ไม่ใช่การจัดอันดับความสำคัญ', { exact: false }).waitFor();
  });
  await page.screenshot({ path: resolve(directory, 'native-desktop.png'), fullPage: true });
  await check('real server pagination reaches document 246 beyond 200', async () => {
    await total(246).click(); const dialog = page.getByRole('dialog');
    await dialog.getByText('แสดง 1–25', { exact: false }).waitFor();
    await dialog.getByRole('combobox', { name: 'จำนวนผลงานต่อหน้า' }).selectOption('200');
    await dialog.getByText('แสดง 1–200', { exact: false }).waitFor();
    await dialog.getByRole('button', { name: 'ถัดไป', exact: true }).click();
    await dialog.getByText('แสดง 201–246', { exact: false }).waitFor();
    assert.equal(await dialog.locator('article').count(), 46);
    await page.screenshot({ path: resolve(directory, 'native-page-two.png') });
    await close();
  });
  await check('country partner uses matching real international membership', async () => {
    await page.getByRole('button', { name: /^ดู Japan 3 ผลงาน$/ }).click();
    await page.getByRole('dialog').getByText('พบทั้งหมด', { exact: false }).waitFor();
    assert.equal(await page.getByRole('dialog').locator('article').count(), 3); await close();
  });
  await check('real unknown evidence remains separate; links use safe protocols', async () => {
    await page.getByRole('region', { name: 'ตารางไขว้ประเทศและบทบาท' }).getByRole('button', { name: 'ดูผลงาน ยังระบุประเทศไม่ได้ 4 รายการ', exact: true }).click();
    await page.getByRole('dialog').getByText('พบทั้งหมด', { exact: false }).waitFor();
    assert.equal(await page.getByRole('dialog').locator('article').count(), 4);
    assert.equal(await page.getByRole('dialog').getByText('ยังระบุประเทศไม่ได้', { exact: true }).count(), 4);
    assert.equal(await page.getByRole('dialog').getByText('ยังไม่สามารถยืนยันข้อมูลประเทศปัจจุบันได้', { exact: false }).count(), 3);
    for (const href of await page.getByRole('dialog').locator('a').evaluateAll(links => links.map(link => link.href))) assert.match(href, /^https?:\/\//);
    await close();
  });
  await check('real 409 refreshes summary and restarts page one', async () => {
    await total(246).click(); const dialog = page.getByRole('dialog');
    await dialog.getByText('แสดง 1–25', { exact: false }).waitFor();
    await mutate('change');
    await dialog.getByRole('button', { name: 'ถัดไป', exact: true }).click();
    await dialog.getByText('ข้อมูลเปลี่ยนแปลงแล้ว อัปเดตสรุปและเริ่มรายการใหม่จากหน้า 1', { exact: true }).waitFor();
    await dialog.getByText('แสดง 1–25', { exact: false }).waitFor();
    assert.equal(await dialog.locator('article').count(), 25);
    assert.ok(requests.some(request => request.status === 409));
    await page.screenshot({ path: resolve(directory, 'native-revision-recovery.png') });
    await close(); await mutate('restore');
  });
  await check('draft year sends no request; applied BE year reaches real API', async () => {
    const before = requests.filter(request => request.path.endsWith('/faculty-insights')).length;
    await page.getByRole('combobox', { name: 'ช่วงปีร่าง' }).selectOption('2569');
    assert.equal(requests.filter(request => request.path.endsWith('/faculty-insights')).length, before);
    assert.equal(await total(246).count(), 1);
    await page.getByRole('button', { name: 'ใช้ตัวกรอง', exact: true }).click();
    await total(241).waitFor();
    assert.ok(requests.some(request => request.path.endsWith('/faculty-insights') && request.query.includes('year_start_be=2569') && request.query.includes('year_end_be=2569')));
  });
  await check('real API empty year renders zero without invented percentages', async () => {
    await page.getByRole('combobox', { name: 'ช่วงปีร่าง' }).selectOption('2566');
    await page.getByRole('button', { name: 'ใช้ตัวกรอง', exact: true }).click(); await total(0).waitFor();
    assert.ok(await page.getByText('—', { exact: true }).count() > 0);
    await total(0).click(); await page.getByRole('dialog').getByText('ไม่มีหน้า', { exact: true }).waitFor(); await close();
  });
  await check('real API mobile cards fit viewport', async () => {
    await page.getByRole('combobox', { name: 'ช่วงปีร่าง' }).selectOption('all');
    await page.getByRole('button', { name: 'ใช้ตัวกรอง', exact: true }).click(); await total(246).waitFor();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: resolve(directory, 'native-mobile.png'), fullPage: true });
  });
  const pages = requests.filter(request => request.path.endsWith('/drilldown'));
  assert.ok(pages.length > 0);
  for (const request of pages) assert.match(new URLSearchParams(request.query).get('revision'), /^[a-f0-9]{64}$/);
  assert.equal(errors.length, 0); assert.equal(blocked.length, 0);
  passed = true;
} finally {
  // No token, secret, identity from application configuration, or auth headers in evidence.
  const result = { passed, fixture_only: true, native_mariadb: true, authenticated_real_api: true, checks, requests, page_errors: errors, blocked_external_origins: blocked };
  await writeFile(resolve(directory, 'browser-checks.json'), JSON.stringify(result, null, 2));
  await writeFile(`${manifestPath}.done`, JSON.stringify(result));
  await browser.close();
}
console.log(JSON.stringify({ passed, checks: checks.length, requests: requests.length, pageErrors: errors.length }));
