// Real mounted Benchmark panels with held synthetic promises; no backend access.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3105';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Loopback fixtures only');
const directory = resolve(process.env.SCOPUS_UI_EVIDENCE_DIR || 'docs/scopus-ux-round2-evidence/benchmark');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const checks = [], errors = [], captures = [], blocked = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => { const u = new URL(route.request().url()); if (u.origin !== origin || u.pathname.startsWith('/api/')) { blocked.push(u.pathname); return route.abort(); } return route.continue(); });
const calls = async () => JSON.parse(await page.getByLabel('จำนวน request').innerText());
const events = async () => JSON.parse(await page.getByLabel('เหตุการณ์ request').innerText());
const count = async (method, n) => { await page.waitForFunction(([method,n]) => (JSON.parse(document.querySelector('[aria-label="จำนวน request"]').textContent)[method] || 0) === n, [method,n]); };
const tab = name => page.getByRole('button', { name, exact: true }).click();
const summary = () => tab('สรุปผลงานและบทบาทอาจารย์');
const presentation = () => tab('สรุปเปรียบเทียบ Thailand / KKU / COC');
const legacy = () => tab('ผลเปรียบเทียบเชิงวิเคราะห์');
const release = () => tab('ปล่อยคำขอที่ค้าง');
const ready = () => page.getByRole('heading', { name: 'จำนวนผลงานตามปี', exact: true }).waitFor();
const capture = async name => captures.push({ name, data: await page.screenshot({ fullPage: true }) });
const check = async (name, run) => { await run(); checks.push({ name, passed: true }); };
try {
  await page.goto(`${origin}/dev/scopus-benchmark-summary`); await ready();
  await tab('พักคำขอ / ทดสอบสลับแท็บ'); await count('summary', 1);
  await check('only the default summary is fetched before other tabs are visited', async () => {
    const c = await calls(); assert.equal(c.summary, 1); for (const key of ['summaryFaculty','comparison','insights','listScopes','listRuns']) assert.equal(c[key] || 0, 0);
  });
  await check('pending summary/presentation return reuses requests without aborting', async () => {
    await presentation(); await count('summary', 2); await summary(); await count('summary', 2);
    await tab('บทบาทอาจารย์'); await count('summaryFaculty', 1); await tab('ภาพรวมผลงาน'); await count('summary', 2);
    assert.equal((await events()).filter(e => e.phase === 'aborted').length, 0);
    await release(); await ready(); await presentation(); await summary(); await ready();
    const c = await calls(); assert.equal(c.summary, 2); assert.equal(c.summaryFaculty, 1); assert.equal(c.summaryOptions, 2);
    await capture('completed-summary-cache.png');
  });
  await check('legacy comparison and insights continue while hidden and rejoin without duplicates', async () => {
    await legacy(); await count('comparison', 1); await count('insights', 1); await summary(); await legacy();
    assert.equal((await calls()).comparison, 1); assert.equal((await calls()).insights, 1);
    assert.equal((await events()).filter(e => ['comparison','insights'].includes(e.method) && e.phase === 'aborted').length, 0);
    await release(); await page.getByRole('heading', { name: 'ผลการดำเนินงานวิจัย', exact: true }).waitFor();
    await summary(); assert.equal(await page.locator('style[data-scopus-report-page]').count(), 0);
    await legacy(); assert.equal((await calls()).comparison, 1); assert.equal((await calls()).insights, 1);
    assert.equal(await page.locator('style[data-scopus-report-page]').count(), 1); await capture('completed-legacy-cache.png');
    await summary();
  });
  await check('legacy refresh survives tab hiding; changed range/window cancels obsolete reads', async () => {
    await legacy(); await page.getByRole('button', { name: 'รีเฟรชข้อมูลรายงาน', exact: true }).click();
    await count('comparison', 2); await count('insights', 2); await summary(); await legacy();
    assert.equal((await calls()).comparison, 2); assert.equal((await calls()).insights, 2);
    await page.getByRole('spinbutton', { name: 'ปีสิ้นสุด', exact: true }).fill('2025');
    await page.getByRole('spinbutton', { name: 'ปีสิ้นสุด', exact: true }).press('Enter');
    await count('insights', 4);
    assert.ok((await events()).some(e => e.method === 'insights' && e.phase === 'aborted'));
    await release(); await page.getByText('ปีรายงาน 2025', { exact: false }).first().waitFor();
    assert.equal((await calls()).comparison, 3); // newly widened single-year trend window
    assert.ok((await events()).some(e => e.method === 'comparison' && e.phase === 'aborted')); await summary();
  });
  await check('applied filters cancel hidden obsolete overview/faculty reads and ignore late completion', async () => {
    await tab('Q1–Q4'); await count('summary', 3); await tab('บทบาทอาจารย์'); await count('summaryFaculty', 2);
    await tab('แยก T1');
    await page.waitForFunction(() => JSON.parse(document.querySelector('[aria-label="เหตุการณ์ request"]').textContent).filter(e => e.phase === 'aborted' && ['summary','summaryFaculty'].includes(e.method)).length >= 2);
    await release(); await tab('ภาพรวมผลงาน'); await ready();
    assert.equal((await calls()).summary, 3); assert.match(await page.getByText('ตัวกรองปัจจุบัน:').first().locator('..').innerText(), /แยก T1/);
    assert.equal(await page.getByRole('status').filter({ hasText: 'กำลังคำนวณรายงาน' }).count(), 0);
  });
  await check('explicit refresh discards completed cache and refetches visited active stream', async () => {
    await tab('อัปเดตข้อมูล'); await count('summary', 4); await release(); await ready();
    await presentation(); assert.equal((await calls()).summary, 4); await summary(); assert.equal((await calls()).summary, 4);
  });
  await check('closing detail aborts its pending read and a late result never reopens it', async () => {
    await page.getByRole('button', { name: '100', exact: true }).first().click(); await count('summaryDocuments', 1);
    await page.getByRole('button', { name: 'ปิดรายละเอียด', exact: true }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.ok((await events()).some(e => e.method === 'summaryDocuments' && e.phase === 'aborted'));
    await release(); assert.equal(await page.getByRole('dialog').count(), 0);
  });
  await check('page unmount aborts pending work; remount has a fresh local cache', async () => {
    await tab('Q1–Q4'); await count('summary', 5); await tab('ปิดหน้า Benchmark');
    assert.ok((await events()).some(e => e.method === 'summary' && e.phase === 'aborted'));
    await tab('กลับหน้า Benchmark'); await count('summary', 6); await release(); await ready();
    assert.match(await page.getByText('ตัวกรองปัจจุบัน:').first().locator('..').innerText(), /แยก T1/);
  });
  await check('summary failure can be refreshed and a failed result is never cached', async () => {
    await tab('ผิดพลาดครั้งแรก / ลองใหม่'); await page.getByRole('alert').filter({ hasText: 'จำลองข้อผิดพลาดครั้งแรก' }).waitFor();
    await tab('อัปเดตข้อมูล'); await ready(); assert.equal((await calls()).summary, 2);
    await presentation(); await summary(); assert.equal((await calls()).summary, 3); // one first visit to presentation
  });
  await page.setViewportSize({ width: 390, height: 844 });
  // Capture the product panel without the fixture-only request toolbar.
  const product = page.locator('.max-w-7xl').last();
  captures.push({ name: 'mobile-summary.png', data: await product.screenshot() });
  await legacy(); await page.getByRole('heading', { name: 'ผลการดำเนินงานวิจัย', exact: true }).waitFor();
  captures.push({ name: 'mobile-legacy.png', data: await product.screenshot() });
  assert.deepEqual(errors, []);
} finally {
  await browser.close(); await mkdir(directory, { recursive: true });
  for (const item of captures) await writeFile(resolve(directory, item.name), item.data);
  await writeFile(resolve(directory, 'browser-checks.json'), JSON.stringify({ fixture_only: true, checks, page_errors: errors, blocked_requests: blocked }, null, 2));
}
console.log(JSON.stringify({ passed: checks.length, pageErrors: errors.length }));
