import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { facultyInsightHints } from '../app/lib/scopus_faculty_insight_hints.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3116';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Loopback fixture only');
const directory = resolve(process.env.SCOPUS_UI_EVIDENCE_DIR || 'docs/faculty-thai-copy-evidence/copy');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const checks = [], errors = [], captures = [], blocked = [];
const forbidden = /XML|no_correspondence|complete|Thailand|ตัวกรองร่าง|รุ่นข้อมูล|ธง|ส่งปี|;/;
const check = async (name, run) => { await run(); checks.push({ name, passed: true }); };
const capture = async (name, target = page) => captures.push({ name, data: await target.screenshot({ fullPage: target === page, animations: 'disabled' }) });
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => { const u = new URL(route.request().url()); if (u.origin !== origin || u.pathname.startsWith('/api/')) { blocked.push(u.pathname); return route.abort(); } return route.continue(); });
const donuts = () => page.locator('[data-role-donut]');
const root = () => page.locator('[aria-label="ข้อมูลความร่วมมือและบทบาทผู้เขียนของคณะ"]');
const tooltip = () => page.getByRole('tooltip');
const dismiss = async () => { await page.keyboard.press('Escape'); await tooltip().waitFor({ state: 'hidden' }); };
const bounded = async () => {
  const box = await tooltip().boundingBox(), viewport = page.viewportSize();
  assert.ok(box.x >= 0 && box.x + box.width <= viewport.width && box.y >= 0 && box.y + box.height <= viewport.height);
  assert.ok(await tooltip().evaluate(element => element.scrollWidth <= element.clientWidth));
  assert.doesNotMatch(await tooltip().innerText(), forbidden); assert.doesNotMatch(await tooltip().innerText(), /\[object Object\]/);
};
try {
  await check('all hint groups use plain Thai, narrow emphasis and complete role/country counting explanations', async () => {
    const plain = line => typeof line === 'string' ? line : line.map(part => part.text).join('');
    for (const sections of Object.values(facultyInsightHints)) for (const section of sections) {
      assert.doesNotMatch(section.title, forbidden);
      for (const line of section.lines) { assert.doesNotMatch(plain(line), forbidden); if (Array.isArray(line)) { assert.ok(line[0].strong); assert.ok(line[0].text.length < 65); } }
    }
    assert.match(plain(facultyInsightHints.roles[0].lines[0]), /หนึ่งผลงานนับครั้งเดียว.*หลายคน/);
    assert.match(facultyInsightHints.roles[2].lines.map(plain).join(' '), /ไม่จัดเป็น Co-author โดยอัตโนมัติ/);
    assert.match(facultyInsightHints.international[1].lines.join(' '), /ผู้เขียนคนเดียว/);
    assert.match(facultyInsightHints.partners[1].lines.map(plain).join(' '), /อาจเกิน 100%/);
  });
  await page.goto(`${origin}/dev/scopus-faculty-insights`);
  await page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ', exact: true }).waitFor();
  await check('three centers use total label, contextual accessible denominators and no redundant footer', async () => {
    const expected = ['ร้อยละคิดจากผลงานทั้งหมด 512 ผลงาน', 'ร้อยละคิดจากผลงานที่ร่วมกับต่างประเทศทั้งหมด 236 ผลงาน', 'ร้อยละคิดจากผลงานภายในประเทศทั้งหมด 237 ผลงาน'];
    for (let index = 0; index < 3; index++) {
      const donut = donuts().nth(index), label = donut.locator('[data-donut-percent]');
      assert.equal(await label.textContent(), 'ผลงานทั้งหมด');
      const reference = await donut.locator('[data-role-legend="first"]').getAttribute('aria-describedby');
      assert.equal(await page.locator(`[id="${reference}"]`).textContent(), expected[index]);
      assert.equal(await donut.locator('[data-role-segment="first"]').getAttribute('aria-describedby'), reference);
      assert.doesNotMatch(await donut.innerText(), /ทุกบทบาทในกลุ่มนี้|ฐานคำนวณ:|คลิกเพื่อเลือกบทบาท/);
    }
    await capture('desktop.png'); await capture('desktop-role-chart.png', donuts().first());
  });
  await check('every desktop card hint renders safe emphasis and wraps within its bounded portal', async () => {
    for (const hint of await root().getByRole('button', { name: /^คำอธิบาย:/ }).all()) {
      const label = await hint.getAttribute('aria-label'); await hint.focus(); await tooltip().waitFor(); await page.keyboard.press('Enter');
      await bounded(); assert.ok(await tooltip().locator('strong').count() > 0);
      if (label === 'คำอธิบาย: การจัดกลุ่มบทบาทคณะ') {
        assert.match(await tooltip().locator('li').first().innerText(), /หนึ่งผลงานนับครั้งเดียว/);
        await capture('desktop-role-hint.png', tooltip());
        await tooltip().evaluate(element => { element.scrollTop = element.scrollHeight; }); await capture('desktop-role-unknown-hint.png', tooltip());
      }
      if (label === 'คำอธิบาย: ประเทศ จำนวน และร้อยละรายปี') await capture('desktop-international-hint.png', tooltip());
      if (label === 'คำอธิบาย: ประเทศคู่ความร่วมมือ') await capture('desktop-partners-hint.png', tooltip());
      if (label === 'คำอธิบาย: บทบาทคณะ: ต่างประเทศและภายในประเทศ') await capture('desktop-cross-hint.png', tooltip());
      await dismiss();
    }
  });
  await check('keyboard role selection and percentages stay unchanged without modal or API request', async () => {
    const before = await page.getByLabel('คำขอทดสอบ').textContent(), expected = [['93', '18.2%'], ['42', '17.8%'], ['44', '18.6%']];
    for (let index = 0; index < 3; index++) {
      const donut = donuts().nth(index), button = donut.locator('[data-role-legend="first"]');
      await button.focus(); await page.keyboard.press('Enter');
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await donut.locator('[data-donut-count]').textContent(), expected[index][0]);
      assert.equal(await donut.locator('[data-donut-percent]').textContent(), expected[index][1]);
      await page.keyboard.press('Space'); assert.equal(await button.getAttribute('aria-pressed'), 'false');
      await button.evaluate(element => element.blur());
    }
    assert.equal(await page.getByRole('dialog').count(), 0); assert.equal(await page.getByLabel('คำขอทดสอบ').textContent(), before);
  });
  await check('local year selectors retain independent scope and new denominators', async () => {
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('2569');
    assert.equal(await donuts().first().locator('[data-donut-count]').textContent(), '169');
    assert.match(await donuts().first().innerText(), /ร้อยละคิดจากผลงานทั้งหมด 169 ผลงาน/);
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้', exact: true }).selectOption('2569');
    for (const donut of [donuts().nth(1), donuts().nth(2)]) assert.equal(await donut.locator('[data-donut-count]').textContent(), '78');
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('all');
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้', exact: true }).selectOption('all');
  });
  await check('mobile centers and contextual denominators fit without page overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await capture('mobile.png');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const donut of await donuts().all()) {
      const text = await donut.locator('[data-donut-percent]').evaluate(element => { const box = element.getBBox(); return { x: box.x, right: box.x + box.width }; });
      assert.ok(text.x >= 55 && text.right <= 185);
      assert.ok(await donut.locator('p').last().evaluate(element => element.scrollWidth <= element.clientWidth));
    }
    await capture('mobile-role-chart.png', donuts().first()); await capture('mobile-international-chart.png', donuts().nth(1)); await capture('mobile-domestic-chart.png', donuts().nth(2));
  });
  await check('every mobile hint opens by touch and keeps Thai bullets/emphasis within the viewport', async () => {
    for (const hint of await root().getByRole('button', { name: /^คำอธิบาย:/ }).all()) {
      const label = await hint.getAttribute('aria-label'); await hint.tap(); await tooltip().waitFor(); await bounded();
      if (label === 'คำอธิบาย: การจัดกลุ่มบทบาทคณะ') {
        await capture('mobile-role-hint.png', tooltip());
        await tooltip().evaluate(element => { element.scrollTop = element.scrollHeight; }); await capture('mobile-role-unknown-hint.png', tooltip());
      }
      if (label === 'คำอธิบาย: ประเทศคู่ความร่วมมือ') await capture('mobile-partners-hint.png', tooltip());
      await dismiss();
    }
  });
  await check('paper/search explanations and role evidence use clear Thai without internal status codes', async () => {
    await page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ', exact: true }).tap();
    const dialog = page.getByRole('dialog'); await dialog.getByText('พบทั้งหมด 512', { exact: false }).waitFor();
    await dialog.getByRole('button', { name: /^รายละเอียด / }).first().tap();
    await dialog.getByText('ตรวจสอบแล้ว', { exact: true }).waitFor(); assert.doesNotMatch(await dialog.innerText(), /no_correspondence|complete|XML/);
    await dialog.getByRole('button', { name: 'คำอธิบาย: ค้นหาผลงานภายในกลุ่มทั้งหมด', exact: true }).tap(); await tooltip().waitFor(); await bounded();
    assert.match(await tooltip().innerText(), /ไม่จำกัดเฉพาะหน้าที่เห็นหรือ 200 รายการแรก/); await capture('mobile-search-hint.png', tooltip()); await dismiss();
    // Escape can also dismiss the containing Headless UI dialog.
    if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'ปิดรายการผลงาน' }).tap();
    await dialog.waitFor({ state: 'hidden' });
  });
  await check('Benchmark structured string bullets and legacy plain-string hints preserve rendering/accessibility', async () => {
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto(`${origin}/dev/scopus-benchmark-summary`);
    await page.getByRole('heading', { name: 'จำนวนผลงานตามปี', exact: true }).waitFor();
    const structured = page.getByRole('button', { name: 'คำอธิบาย: หน่วยและขอบเขตการนับ', exact: true }); await structured.focus(); await tooltip().waitFor();
    assert.ok(await tooltip().locator('li').count() > 0); assert.equal(await tooltip().locator('strong').count(), 0); assert.doesNotMatch(await tooltip().innerText(), /\[object Object\]/);
    await capture('benchmark-structured-hint.png', tooltip()); await dismiss();
    await page.getByRole('button', { name: 'ผลเปรียบเทียบเชิงวิเคราะห์', exact: true }).click(); await page.getByRole('heading', { name: 'ผลการดำเนินงานวิจัย', exact: true }).waitFor();
    const legacy = page.getByRole('button', { name: /^คำอธิบาย:/ }).first(); await legacy.focus(); await tooltip().waitFor(); await page.keyboard.press('Enter');
    assert.equal(await tooltip().locator('ul').count(), 0); assert.ok((await tooltip().innerText()).length > 30);
    assert.ok(await legacy.getAttribute('aria-describedby')); await capture('benchmark-plain-string-hint.png', tooltip()); await dismiss();
  });
  assert.deepEqual(errors, []);
} finally {
  await browser.close(); await mkdir(directory, { recursive: true });
  for (const item of captures) await writeFile(resolve(directory, item.name), item.data);
  await writeFile(resolve(directory, 'browser-checks.json'), JSON.stringify({ fixture_only: true, origin, checks, page_errors: errors, blocked_requests: blocked }, null, 2));
}
console.log(JSON.stringify({ passed: checks.length, pageErrors: errors.length }));
