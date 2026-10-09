import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FACULTY_ROLES } from '../app/lib/scopus_faculty_insights.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3105';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Loopback fixtures only');
const directory = resolve(process.env.SCOPUS_UI_EVIDENCE_DIR || 'docs/scopus-donut-polish-evidence/faculty');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const checks = [], errors = [], captures = [], blocked = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => { const u = new URL(route.request().url()); if (u.origin !== origin || u.pathname.startsWith('/api/')) { blocked.push(u.pathname); return route.abort(); } return route.continue(); });
const check = async (name, run) => { await run(); checks.push({ name, passed: true }); };
const capture = async (name, target = page, fullPage = true) => captures.push({ name, data: await target.screenshot({ fullPage: target === page && fullPage, animations: 'disabled' }) });
const ready = () => page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ', exact: true }).waitFor();
const donuts = () => page.locator('[data-role-donut]');
const requests = () => page.getByLabel('คำขอทดสอบ').textContent();
const noRead = async before => { assert.equal(await page.getByRole('dialog').count(), 0); assert.equal(await requests(), before); };
const arcPoint = async (donut, role) => {
  const svg = await donut.locator('svg[role="group"]').boundingBox();
  const point = await donut.locator(`[data-role-segment="${role}"]`).evaluate(element => { const p = element.getPointAtLength(element.getTotalLength() / 2); return { x: p.x, y: p.y }; });
  return { x: svg.x + point.x * svg.width / 240, y: svg.y + point.y * svg.height / 240 };
};
const close = async () => { await page.getByRole('button', { name: 'ปิดรายการผลงาน' }).click(); await page.getByRole('dialog').waitFor({ state: 'hidden' }); };
try {
  await page.goto(`${origin}/dev/scopus-faculty-insights`); await ready();
  await check('card order is roles, international, comparison; compact desktop frames align', async () => {
    const headers = await page.getByRole('heading', { level: 2 }).allTextContents();
    assert.deepEqual(headers.slice(1, 4), ['บทบาทผู้เขียนของคณะ','ความร่วมมือระหว่างประเทศของคณะ','บทบาทคณะ: ต่างประเทศและภายในประเทศ']);
    const table = await page.getByRole('region', { name: 'ตารางบทบาทผู้เขียนรายปี' }).boundingBox(), chart = await donuts().first().boundingBox();
    assert.ok(Math.abs(table.y - chart.y) < 2); assert.ok(chart.x > table.x);
    assert.ok(table.height < 360); assert.ok(chart.height < 395);
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
  await check('legend hover cues a role while no selection keeps the full total', async () => {
    const donut = donuts().first(); await donut.locator('[data-role-legend="first"]').hover();
    assert.equal(await donut.getAttribute('data-active-roles'), 'first'); assert.equal(await donut.locator('[data-donut-count]').textContent(), '512');
    assert.equal(await donut.locator('[data-donut-percent]').textContent(), 'ผลงานทั้งหมด');
    assert.equal(await donut.locator('[data-role-segment="first"]').getAttribute('stroke-width'), '36');
    assert.equal(await donut.locator('[data-role-segment="coauthor"]').getAttribute('opacity'), '1');
    await donut.locator('[data-role-legend="first"]').focus(); await capture('desktop-linked-focus.png', donut); await donut.locator('[data-role-legend="first"]').evaluate(element=>element.blur()); await page.mouse.move(0, 0);
    assert.equal(await donut.getAttribute('data-active-roles'), '');
  });
  await check('keyboard selects/toggles without a read; focus halo follows the arc without a rectangle', async () => {
    const donut = donuts().first(), segment = donut.locator('[data-role-segment="corresponding"]'); await segment.focus();
    assert.equal(await donut.getAttribute('data-active-roles'), 'corresponding');
    assert.equal(await donut.locator('[data-donut-count]').textContent(), '512');
    const halo = donut.locator('[data-role-halo="corresponding"]');
    assert.equal(await segment.evaluate(element=>getComputedStyle(element).outlineStyle), 'none');
    assert.equal(await halo.evaluate(element=>getComputedStyle(element).opacity), '1');
    assert.equal(await halo.getAttribute('d'), await segment.getAttribute('d'));
    await capture('desktop-keyboard-arc-focus.png', donut);
    const before = await requests(); await page.keyboard.press('Enter'); await noRead(before);
    assert.equal(await segment.getAttribute('aria-pressed'), 'true');
    assert.equal(await donut.locator('[data-role-legend="corresponding"]').getAttribute('aria-pressed'), 'true');
    await segment.evaluate(element=>element.blur()); await page.mouse.move(0,0);
    assert.equal(await donut.locator('[data-donut-count]').textContent(), '94');
    await donut.locator('[data-role-legend="first"]').hover(); assert.equal(await donut.locator('[data-donut-count]').textContent(), '94');
    assert.equal(await donut.getAttribute('data-selected-roles'), 'corresponding'); await page.mouse.move(0,0);
    assert.equal(await donut.locator('[data-donut-count]').textContent(), '94');
    await segment.focus(); await page.keyboard.press('Space'); await noRead(before);
    assert.equal(await segment.getAttribute('aria-pressed'), 'false'); assert.equal(await donut.locator('[data-donut-count]').textContent(), '512');
    await segment.evaluate(element=>element.blur());
  });
  await check('pointer at every actual arc selects its own role, persists and toggles back to total', async () => {
    const donut = donuts().first(), before = await requests();
    for (const role of FACULTY_ROLES) {
      const segment = donut.locator(`[data-role-segment="${role.key}"]`), point = await arcPoint(donut, role.key);
      await page.mouse.click(point.x, point.y); await noRead(before);
      assert.equal(await donut.getAttribute('data-selected-roles'), role.key); assert.equal(await segment.getAttribute('aria-pressed'), 'true');
      await segment.evaluate(element=>element.blur()); await page.mouse.move(0,0);
      assert.equal(await donut.locator('[data-donut-count]').textContent(), await donut.locator(`[data-role-legend="${role.key}"] b`).textContent());
      if(role.key === 'coauthor') await capture('desktop-selected-role.png', donut);
      await page.mouse.click(point.x, point.y); assert.equal(await donut.getAttribute('data-selected-roles'), '');
      assert.equal(await donut.locator('[data-donut-count]').textContent(), '512'); await noRead(before);
    }
  });
  await check('all three legends select independently; year resets charts while table drilldown keeps dimensions', async () => {
    const table = page.getByRole('region', { name: 'ตารางบทบาทผู้เขียนรายปี' }), before = await table.innerText();
    const beforeReads = await requests();
    await donuts().first().locator('[data-role-legend="first"]').click();
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('2569');
    assert.equal(await table.innerText(), before); await page.getByRole('heading', { name: 'ปี 2569', exact: true }).waitFor();
    assert.equal(await donuts().first().getAttribute('data-selected-roles'), '');
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้', exact: true }).selectOption('2569');
    await donuts().nth(1).locator('[data-role-legend="coauthor"]').click();
    await donuts().nth(2).locator('[data-role-legend="corresponding"]').click(); await noRead(beforeReads);
    assert.equal(await donuts().nth(1).getAttribute('data-selected-roles'), 'coauthor');
    assert.equal(await donuts().nth(2).getAttribute('data-selected-roles'), 'corresponding');
    for (const donut of [donuts().nth(1), donuts().nth(2)]) {
      const role = await donut.locator('[data-role-segment][aria-pressed="false"]').first().getAttribute('data-role-segment');
      const segment = donut.locator(`[data-role-segment="${role}"]`);
      await donut.locator('svg[role="group"]').scrollIntoViewIfNeeded(); const point = await arcPoint(donut, role);
      await page.mouse.click(point.x, point.y); assert.equal(await segment.getAttribute('aria-pressed'), 'true'); await noRead(beforeReads);
    }
    const cross = page.getByRole('region', { name: 'ตารางไขว้ประเทศและบทบาท' });
    const crossCount = cross.getByRole('button', { name: /^ดูผลงาน ร่วมกับต่างประเทศ Co-author / }); await crossCount.click();
    await page.getByRole('dialog').getByRole('heading', { name: /ร่วมกับต่างประเทศ · Co-author · 2569/ }).waitFor(); await close();
    assert.equal(await crossCount.evaluate(element=>document.activeElement === element), true);
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟบทบาท', exact: true }).selectOption('all');
    await page.getByRole('combobox', { name: 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้', exact: true }).selectOption('all');
  });
  await check('partner rows have visible hover/keyboard feedback and still open the country drilldown', async () => {
    const country = page.getByRole('button', { name: /^ดู Japan / });
    const baseline = await country.evaluate(element=>getComputedStyle(element).backgroundColor);
    await country.hover(); assert.notEqual(await country.evaluate(element=>getComputedStyle(element).backgroundColor), baseline);
    assert.equal(await country.locator('svg').count(), 1);
    await page.keyboard.press('Tab'); await country.focus(); await page.mouse.move(0,0);
    assert.equal(await country.evaluate(element=>element.matches(':focus-visible')), true);
    assert.notEqual(await country.evaluate(element=>getComputedStyle(element).backgroundColor), baseline);
    assert.ok((await country.boundingBox()).height >= 44); await capture('desktop-country-focus.png', page.locator('[data-partner-countries]'));
    await page.keyboard.press('Enter'); await page.getByRole('dialog').getByText('พบทั้งหมด 236', { exact: false }).waitFor(); await close();
    assert.equal(await country.evaluate(element=>document.activeElement === element), true); await country.evaluate(element=>element.blur());
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
  await check('mobile touch selects/toggles chart; table and country still drill down; hints remain detailed', async () => {
    await page.setViewportSize({ width: 390, height: 844 }); await capture('mobile.png');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const donut of await donuts().all()) {
      const legend = await donut.locator('ul').boundingBox(), svg = await donut.locator('svg[role="group"]').boundingBox();
      assert.ok(legend.y >= svg.y + svg.height); assert.ok(svg.width >= 240); assert.ok(legend.height < 120);
    }
    const donut = donuts().first(), before = await requests();
    await donut.locator('[data-role-legend="first"]').tap(); await noRead(before);
    assert.equal(await donut.getAttribute('data-selected-roles'), 'first'); assert.equal(await donut.locator('[data-donut-count]').textContent(), '93');
    await donut.locator('[data-role-legend="first"]').tap(); assert.equal(await donut.locator('[data-donut-count]').textContent(), '512'); await noRead(before);
    await donut.locator('svg[role="group"]').scrollIntoViewIfNeeded(); const point = await arcPoint(donut, 'coauthor'); await page.touchscreen.tap(point.x, point.y); await noRead(before);
    assert.equal(await donut.getAttribute('data-selected-roles'), 'coauthor'); await capture('mobile-selected-role.png', donut);
    await page.getByRole('region', { name: 'ตารางบทบาทผู้เขียนรายปี' }).getByRole('button', { name: 'ดูผลงาน First author รวมตามเงื่อนไขที่เลือก 93 รายการ', exact: true }).tap();
    await page.getByRole('dialog').getByText('พบทั้งหมด 93', { exact: false }).waitFor(); await capture('mobile-drilldown.png', page, false); await close();
    await page.getByRole('button', { name: /^ดู China / }).tap(); await page.getByRole('dialog').getByText('พบทั้งหมด 78', { exact: false }).waitFor(); await close();
    await capture('mobile-country-rows.png', page.locator('[data-partner-countries]'));
    await page.getByRole('button', { name: 'คำอธิบาย: การจัดกลุ่มบทบาทคณะ', exact: true }).tap();
    await page.getByRole('tooltip').getByText('เมื่อข้อมูลยังไม่ชัดเจน', { exact: true }).waitFor(); await capture('mobile-hint.png', page, false); await page.keyboard.press('Escape');
  });
  await check('empty groups keep unknown neutral, zero denominator and usable legend selection', async () => {
    await page.getByRole('button', { name: 'ว่าง', exact: true }).click();
    await page.getByRole('button', { name: 'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 0 รายการ', exact: true }).waitFor();
    await donuts().first().locator('[data-role-legend="unknown"]').click();
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
