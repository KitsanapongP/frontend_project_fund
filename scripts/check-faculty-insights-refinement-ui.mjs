// Loopback synthetic fixtures only. No backend/auth/Scopus requests or installs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3105';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Loopback fixture only');
const directory = resolve(process.env.SCOPUS_UI_EVIDENCE_DIR || 'docs/faculty-insights-ui-refinement-evidence');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const checks = [], errors = [], blocked = [];
// Buffer images until checks finish: writing under docs during next dev can trigger HMR.
const captures = [];
const capture = async (target, options) => { const { path, ...settings } = options; captures.push({ path, data: await target.screenshot(settings) }); };
page.on('pageerror', e => errors.push(e.message));
await page.route('**/*', route => { const u = new URL(route.request().url()); if (u.origin !== origin || u.pathname.startsWith('/api/')) { blocked.push(u.pathname); return route.abort(); } return route.continue(); });
const check = async (name, fn) => { await fn(); checks.push({ name, passed: true }); };
const ready = () => page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ', exact: true }).waitFor();
const openAll = () => page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ', exact: true }).click();
const dialog = () => page.getByRole('dialog');
const search = async text => { await dialog().getByRole('searchbox').fill(text); await dialog().getByRole('button', { name: 'ค้นหา', exact: true }).click(); await dialog().getByText(`ที่ตรงคำค้น “${text.trim()}”`, { exact: false }).waitFor(); };
const close = async () => { await dialog().getByRole('button', { name: 'ปิดรายการผลงาน' }).click(); await dialog().waitFor({ state: 'hidden' }); };
const shot = async name => capture(page, { path: resolve(directory, name), fullPage: !(await dialog().isVisible()) });
try {
  await page.goto(`${origin}/dev/scopus-faculty-insights`); await ready();
  await check('desktop role table and donut share the same top edge; selector is above both', async () => {
    const layout = page.locator('[data-role-layout]');
    const table = await layout.getByRole('region').boundingBox(), chart = await layout.locator('[data-role-donut]').boundingBox();
    assert.ok(Math.abs(table.y - chart.y) < 2); assert.ok(chart.x > table.x);
    await shot('desktop.png'); await capture(layout, { path: resolve(directory, 'desktop-role-alignment.png') });
  });
  await check('role year selector changes chart while yearly table stays intact', async () => {
    const yearly = page.getByRole('region', { name: 'ตารางบทบาทผู้เขียนรายปี' }); const before = await yearly.innerText();
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('2569');
    assert.equal(await yearly.innerText(), before); await page.getByRole('heading', { name: /ปี 2569/, exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('all');
  });
  await check('structured Benchmark hints open by keyboard, pin and close with Escape', async () => {
    const hint = page.getByRole('button', { name: 'คำอธิบาย: การจัดกลุ่มบทบาทคณะ', exact: true }); await hint.focus();
    await page.getByRole('tooltip').getByText('เมื่อข้อมูลยังไม่ชัดเจน', { exact: true }).waitFor();
    assert.match(await page.getByRole('tooltip').innerText(), /ไม่จัดเป็น Co-author โดยอัตโนมัติ/);
    assert.doesNotMatch(await page.getByRole('tooltip').innerText(), /XML|no_correspondence|complete|ธง/);
    await page.keyboard.press('Enter'); await page.mouse.move(0, 0); await shot('desktop-role-tooltip.png');
    await page.keyboard.press('Escape'); await page.getByRole('tooltip').waitFor({ state: 'hidden' });
  });
  await check('Benchmark-style table has expandable metadata and eligible-author details', async () => {
    await openAll(); await dialog().getByText('แสดง 1–25', { exact: false }).waitFor();
    assert.equal(await dialog().locator('tr[data-document-row]').count(), 25);
    await dialog().getByRole('button', { name: /^รายละเอียด / }).first().click();
    await dialog().getByRole('heading', { name: /ผู้เขียนคณะที่เข้าเกณฑ์/ }).waitFor();
    assert.equal(await dialog().locator('a[href^="javascript:"]').count(), 0);
    await shot('desktop-modal-details.png');
  });
  await check('EID search finds paper 401 outside first 200 without changing summary', async () => {
    await dialog().getByRole('combobox', { name: 'จำนวนผลงานต่อหน้า' }).selectOption('200');
    await dialog().getByText('แสดง 1–200', { exact: false }).waitFor();
    await search('FIXTURE-401');
    await dialog().getByText('กลุ่มที่เลือก 512 ผลงาน · พบทั้งหมด 1 ผลงาน', { exact: false }).waitFor();
    assert.equal(await dialog().locator('tr[data-document-row]').count(), 1); assert.match(await dialog().locator('tr[data-document-row]').innerText(), /401/);
    await shot('desktop-search-beyond-200.png');
    await dialog().getByRole('button', { name: 'ล้าง', exact: true }).click(); await dialog().getByText('แสดง 1–200', { exact: false }).waitFor();
    await close(); await ready();
  });
  await check('cross-tab search retains year, international and role dimensions', async () => {
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้', exact: true }).selectOption('2569');
    const region = page.getByRole('region', { name: 'ตารางไขว้ประเทศและบทบาท' });
    await region.getByRole('button', { name: /^ดูผลงาน ร่วมกับต่างประเทศ Co-author / }).click();
    await dialog().getByText('พบทั้งหมด', { exact: false }).waitFor(); const scope = await dialog().getByRole('status').first().innerText();
    await search('fixture-scopus-401'); assert.match(await dialog().getByRole('heading', { level: 2 }).innerText(), /ร่วมกับต่างประเทศ · Co-author · 2569/);
    assert.equal(await dialog().locator('tr[data-document-row]').count(), 1);
    await search('fixture-402'); await dialog().getByText('ไม่พบผลงานสำหรับรายการที่เลือก', { exact: true }).waitFor();
    assert.match(await dialog().getByRole('status').first().innerText(), /พบทั้งหมด 0/);
    await dialog().getByRole('button', { name: 'ล้าง', exact: true }).click(); await dialog().getByText('พบทั้งหมด', { exact: false }).waitFor();
    assert.equal(await dialog().getByRole('status').first().innerText(), scope); await close();
  });
  await check('partner-country search stays in selected country', async () => {
    await page.getByRole('button', { name: /^ดู Japan / }).click(); await dialog().getByText('พบทั้งหมด', { exact: false }).waitFor();
    await search('10.1234/fixture.401'); assert.match(await dialog().getByRole('heading', { level: 2 }).innerText(), /Japan/); await close();
  });
  await check('mobile cards/modal fit viewport; table scroll is contained; touch hints stay bounded', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await shot('mobile.png');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const hint = page.getByRole('button', { name: 'คำอธิบาย: ประเทศคู่ความร่วมมือ', exact: true }); await hint.tap();
    const tooltip = await page.getByRole('tooltip').boundingBox(); assert.ok(tooltip.x >= 0 && tooltip.x + tooltip.width <= 390 && tooltip.y >= 0 && tooltip.y + tooltip.height <= 844);
    await shot('mobile-country-tooltip.png'); await page.keyboard.press('Escape');
    await openAll(); await dialog().getByText('แสดง 1–25', { exact: false }).waitFor(); await search('fixture-401'); await shot('mobile-modal-search.png');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await dialog().getByRole('button', { name: /^รายละเอียด / }).click();
    const metadata = dialog().locator('dl'); const box = await metadata.boundingBox(); assert.ok(box.x >= 8 && box.x + box.width <= 382);
    await shot('mobile-modal-details.png');
    await page.keyboard.press('Escape'); await dialog().waitFor({ state: 'hidden' });
  });
  assert.deepEqual(errors, []); assert.ok(blocked.every(path => path === '/api/v1/profile'));
} finally {
  await browser.close();
  await mkdir(directory, { recursive: true });
  for (const { path, data } of captures) await writeFile(path, data);
  await writeFile(resolve(directory, 'browser-checks.json'), JSON.stringify({ fixture_only: true, origin, checks, page_errors: errors, blocked_requests: blocked }, null, 2));
}
console.log(JSON.stringify({ passed: checks.length, pageErrors: errors.length, fixtureOnly: true }));
