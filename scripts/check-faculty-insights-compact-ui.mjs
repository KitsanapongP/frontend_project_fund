import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FACULTY_ROLES } from '../app/lib/scopus_faculty_insights.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3105';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Loopback fixtures only');
const directory = resolve('docs/scopus-ux-round2-evidence/faculty');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const checks = [], errors = [], captures = [], blocked = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => { const u = new URL(route.request().url()); if (u.origin !== origin || u.pathname.startsWith('/api/')) { blocked.push(u.pathname); return route.abort(); } return route.continue(); });
const check = async (name, run) => { await run(); checks.push({ name, passed: true }); };
const capture = async (name, target = page, fullPage = true) => captures.push({ name, data: await target.screenshot({ fullPage: target === page && fullPage }) });
const ready = () => page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามตัวกรอง 512 รายการ', exact: true }).waitFor();
const donuts = () => page.locator('[data-role-donut]');
const close = async () => { await page.getByRole('button', { name: 'ปิดรายการผลงาน' }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); };
try {
  await page.goto(`${origin}/dev/scopus-faculty-insights`); await ready();
  await check('card order is roles, international, comparison; compact desktop frames align', async () => {
    const headers = await page.getByRole('heading', { level: 2 }).allTextContents();
    assert.deepEqual(headers.slice(1, 4), ['บทบาทผู้เขียนของคณะ','ความร่วมมือระหว่างประเทศของคณะ','บทบาทคณะ: ต่างประเทศและภายในประเทศ']);
    const table = await page.getByRole('region', { name: 'ตารางบทบาทผู้เขียนรายปี' }).boundingBox(), chart = await donuts().first().boundingBox();
    assert.ok(Math.abs(table.y - chart.y) < 2); assert.ok(chart.x > table.x);
    assert.ok(table.height < 360); assert.ok(chart.height < 370);
    await capture('desktop.png'); await capture('desktop-roles.png', page.locator('[data-role-layout]'));
  });
  await check('international table and partners are side by side at sufficient container width', async () => {
    const table = await page.getByRole('region', { name: 'ตารางความร่วมมือรายปี' }).boundingBox(), partners = await page.locator('[data-partner-countries]').boundingBox();
    assert.ok(partners.x > table.x); assert.ok(Math.abs(partners.y - table.y) < 2);
    await capture('desktop-international.png', page.locator('[data-international-layout]'));
  });
  await check('all three larger donuts have compact legends on the left and the same palette', async () => {
    assert.equal(await donuts().count(), 3);
    for (const donut of await donuts().all()) {
      const legend = await donut.locator('ul').boundingBox(), svg = await donut.locator('svg[role="group"]').boundingBox();
      assert.ok(legend.x < svg.x && Math.abs(legend.y - svg.y) < 80); assert.ok(svg.width >= 250);
      for (const role of FACULTY_ROLES) { const segment=donut.locator(`[data-role-segment="${role.key}"]`); if(await segment.count()) assert.equal(await segment.getAttribute('stroke'), role.color); assert.equal(await donut.locator(`[data-role-legend="${role.key}"]`).count(), 1); }
    }
  });
  await check('legend hover highlights matching segment and shows count/percentage/denominator', async () => {
    const donut = donuts().first(); await donut.locator('[data-role-legend="first"]').hover();
    assert.equal(await donut.getAttribute('data-active-role'), 'first'); assert.equal(await donut.locator('[data-donut-count]').textContent(), '93');
    assert.equal(await donut.locator('[data-donut-percent]').textContent(), '18.2%'); assert.match(await donut.innerText(), /จาก 512 ผลงาน/);
    assert.equal(await donut.locator('[data-role-segment="first"]').getAttribute('stroke-width'), '36');
    assert.equal(await donut.locator('[data-role-segment="coauthor"]').getAttribute('opacity'), '0.3');
    await donut.locator('[data-role-legend="first"]').focus(); await capture('desktop-linked-focus.png', donut); await donut.locator('[data-role-legend="first"]').evaluate(element=>element.blur()); await page.mouse.move(0, 0);
    assert.equal(await donut.getAttribute('data-active-role'), '');
  });
  await check('segment focus highlights matching legend; keyboard drilldown restores focus', async () => {
    const donut = donuts().first(), segment = donut.locator('[data-role-segment="corresponding"]'); await segment.focus();
    assert.equal(await donut.getAttribute('data-active-role'), 'corresponding');
    assert.equal(await donut.locator('[data-donut-count]').textContent(), '94');
    await page.keyboard.press('Enter'); await page.getByRole('dialog').getByText('พบทั้งหมด 94', { exact: false }).waitFor();
    await page.keyboard.press('Escape'); await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.ok(await segment.evaluate(element => element === document.activeElement)); await segment.evaluate(element => element.blur());
  });
  await check('pointer at each actual arc opens its own role, rather than an overlapping circle', async () => {
    const donut = donuts().first();
    for (const role of FACULTY_ROLES) {
      const segment = donut.locator(`[data-role-segment="${role.key}"]`), svg = await donut.locator('svg[role="group"]').boundingBox();
      const point = await segment.evaluate(element => { const p = element.getPointAtLength(element.getTotalLength() / 2); return { x: p.x, y: p.y }; });
      await page.mouse.click(svg.x + point.x * svg.width / 240, svg.y + point.y * svg.height / 240);
      await page.getByRole('dialog').getByRole('heading', { name: new RegExp(role.label) }).waitFor(); await close();
    }
  });
  await check('year selector changes only the role donut; cross-tab legends retain country/year dimensions', async () => {
    const table = page.getByRole('region', { name: 'ตารางบทบาทผู้เขียนรายปี' }), before = await table.innerText();
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('2569');
    assert.equal(await table.innerText(), before); await page.getByRole('heading', { name: 'ปี 2569', exact: true }).waitFor();
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้', exact: true }).selectOption('2569');
    await donuts().nth(1).locator('[data-role-legend="coauthor"]').click();
    await page.getByRole('dialog').getByRole('heading', { name: /ร่วมกับต่างประเทศ · Co-author · 2569/ }).waitFor(); await close();
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('all');
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้', exact: true }).selectOption('all');
  });
  await check('reduced motion disables segment transitions', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await donuts().first().locator('[data-role-segment="first"]').evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
  await check('tablet stacks international layout without document overflow', async () => {
    await page.setViewportSize({ width: 900, height: 1000 });
    const table = await page.getByRole('region', { name: 'ตารางความร่วมมือรายปี' }).boundingBox(), partner = await page.locator('[data-partner-countries]').boundingBox();
    assert.ok(partner.y >= table.y + table.height); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await capture('tablet.png');
  });
  await check('mobile stacks charts and compact legends, supports touch and detailed hints', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await capture('mobile.png');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const donut of await donuts().all()) {
      const legend = await donut.locator('ul').boundingBox(), svg = await donut.locator('svg[role="group"]').boundingBox();
      assert.ok(legend.y >= svg.y + svg.height); assert.ok(svg.width >= 240); assert.ok(legend.height < 120);
    }
    await donuts().first().locator('[data-role-legend="first"]').tap();
    await page.getByRole('dialog').getByText('พบทั้งหมด 93', { exact: false }).waitFor(); await capture('mobile-drilldown.png', page, false); await close();
    await page.getByRole('button', { name: 'คำอธิบาย: การจัดกลุ่มบทบาทคณะ', exact: true }).tap();
    await page.getByRole('tooltip').getByText('ความเชื่อถือได้และกลุ่มไม่ทราบ', { exact: true }).waitFor(); await capture('mobile-hint.png', page, false); await page.keyboard.press('Escape');
  });
  await check('empty groups keep unknown neutral, zero denominator and usable legend drilldown', async () => {
    await page.getByRole('button', { name: 'ว่าง', exact: true }).click();
    await page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามตัวกรอง 0 รายการ', exact: true }).waitFor();
    await donuts().first().locator('[data-role-legend="unknown"]').focus();
    assert.equal(await donuts().first().locator('[data-donut-percent]').textContent(), '—');
    assert.equal(await page.locator('[data-role-segment]').count(), 0);
    await capture('mobile-empty.png');
  });
  assert.deepEqual(errors, []);
} finally {
  await browser.close(); await mkdir(directory, { recursive: true });
  for (const item of captures) await writeFile(resolve(directory, item.name), item.data);
  await writeFile(resolve(directory, 'browser-checks.json'), JSON.stringify({ fixture_only: true, checks, page_errors: errors, blocked_requests: blocked }, null, 2));
}
console.log(JSON.stringify({ passed: checks.length, pageErrors: errors.length }));
