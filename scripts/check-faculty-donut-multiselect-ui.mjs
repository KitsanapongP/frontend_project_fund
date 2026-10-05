import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3118';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Loopback fixtures only');
const directory = resolve(process.env.SCOPUS_UI_EVIDENCE_DIR || 'docs/faculty-donut-multi-evidence/multiselect');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
const checks = [], errors = [], captures = [], blocked = [];
const keys = ['first', 'corresponding', 'coauthor', 'unknown'];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => { const u = new URL(route.request().url()); if (u.origin !== origin || u.pathname.startsWith('/api/')) { blocked.push(u.pathname); return route.abort(); } return route.continue(); });
const check = async (name, run) => { await run(); checks.push({ name, passed: true }); };
const capture = async (name, target) => captures.push({ name, data: await target.screenshot({ animations: 'disabled' }) });
const donuts = () => page.locator('[data-role-donut]');
const legend = (d, key) => d.locator(`[data-role-legend="${key}"]`);
const segment = (d, key) => d.locator(`[data-role-segment="${key}"]`);
const requests = () => page.getByLabel('คำขอทดสอบ').textContent();
const count = async d => Number((await d.locator('[data-donut-count]').textContent()).replaceAll(',', ''));
const total = async d => Number((await d.locator('p[id]').first().textContent()).match(/([\d,]+) ผลงาน$/)[1].replaceAll(',', ''));
const roleCount = async (d, key) => Number((await legend(d,key).locator('b').textContent()).replaceAll(',', ''));
const clear = async d => { await legend(d,'first').focus(); await page.keyboard.press('Escape'); };
const verify = async (d, chosen) => {
  assert.equal(await d.getAttribute('data-selected-roles'), chosen.join(','));
  const n = chosen.length ? (await Promise.all(chosen.map(key => roleCount(d,key)))).reduce((a,b)=>a+b,0) : await total(d);
  assert.equal(await count(d), n);
  assert.equal(await d.locator('[data-donut-percent]').textContent(), chosen.length ? (await total(d) ? `${(n / await total(d) * 100).toFixed(1)}%` : '—') : 'ผลงานทั้งหมด');
  for (const key of keys) {
    assert.equal(await legend(d,key).getAttribute('aria-pressed'), String(chosen.includes(key)));
    if (await segment(d,key).count()) {
      assert.equal(await segment(d,key).getAttribute('aria-pressed'), String(chosen.includes(key)));
      assert.equal(await segment(d,key).getAttribute('opacity'), chosen.length && !chosen.includes(key) ? '0.3' : '1');
    }
  }
};
const point = async (d,key) => {
  const box = await d.locator('svg[role="group"]').boundingBox();
  const p = await segment(d,key).evaluate(e => { const p=e.getPointAtLength(e.getTotalLength()/2); return {x:p.x,y:p.y}; });
  return {x:box.x+p.x*box.width/240,y:box.y+p.y*box.height/240};
};
const blank = async (d, x=120, y=175, touch=false) => {
  await d.locator('svg[role="group"]').scrollIntoViewIfNeeded(); const b=await d.locator('svg[role="group"]').boundingBox();
  await page[touch?'touchscreen':'mouse'][touch?'tap':'click'](b.x+x*b.width/240,b.y+y*b.height/240);
};
const rotation = async d => {
  const t=await total(d), f=await roleCount(d,'first'), c=await roleCount(d,'corresponding');
  let angle=t?-(f+c)/t*180:0;
  for(const key of keys) { const n=await roleCount(d,key), span=t?n/t*360:0;
    if(n) { const s=segment(d,key); assert.ok(Math.abs(Number(await s.getAttribute('data-start-angle'))-angle)<1e-8); assert.ok(Math.abs(Number(await s.getAttribute('data-end-angle'))-angle-span)<1e-8); }
    angle+=span;
  }
};
try {
  await page.goto(`${origin}/dev/scopus-faculty-insights`);
  await page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ',exact:true}).waitFor();
  await page.getByRole('button',{name:'ตัวอย่าง 226 ผลงาน',exact:true}).click();
  await page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 226 รายการ',exact:true}).waitFor();
  const baseline=await requests();
  await check('all three asymmetric distributions rotate the proportional First + Corresponding pair to twelve',async()=>{ for(const d of await donuts().all()) await rotation(d); });
  await check('20 + 82 of 226 equals 102 and 45.1 percent with two pressed roles and combined accessible summary',async()=>{
    const d=donuts().first(); await legend(d,'first').click(); await legend(d,'corresponding').click(); await verify(d,['first','corresponding']);
    assert.equal(await count(d),102); assert.equal(await d.locator('[data-donut-percent]').textContent(),'45.1%');
    assert.match(await d.getByRole('status').textContent(),/First author และ Corresponding author รวม 102 ผลงาน.*45.1%.*226/);
    await capture('desktop-two-selected-rotation.png',d);
  });
  await check('hover and keyboard focus on an unselected arc preserve the aggregate and selected highlights',async()=>{
    const d=donuts().first(); await legend(d,'coauthor').hover(); await segment(d,'coauthor').focus(); await verify(d,['first','corresponding']);
    assert.equal(await d.getAttribute('data-active-roles'),'first,corresponding');
    for(const key of ['first','corresponding']) assert.equal(await segment(d,key).getAttribute('stroke-width'),'36');
    await page.keyboard.press('Tab'); await segment(d,'coauthor').focus();
    assert.equal(await d.locator('[data-role-halo="coauthor"]').evaluate(e=>getComputedStyle(e).opacity),'1');
    assert.equal(await segment(d,'coauthor').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
    await capture('desktop-focus-unselected-aggregate.png',d);
  });
  await check('toggle removes only that role and the last removal restores total despite hover',async()=>{
    const d=donuts().first(); await legend(d,'first').click(); await verify(d,['corresponding']); await legend(d,'corresponding').click(); await legend(d,'coauthor').hover(); await verify(d,[]);
  });
  await check('actual rotated arc targets independently toggle two roles in every donut',async()=>{
    let index=0;
    for(const d of await donuts().all()) { await d.locator('svg[role="group"]').scrollIntoViewIfNeeded(); for(const key of ['first','corresponding']) { const p=await point(d,key); await page.mouse.click(p.x,p.y); } await verify(d,['first','corresponding']); await capture(`desktop-two-selected-rotation-${++index}.png`,d); }
  });
  await check('text, Hint trigger, portal clicks and Hint Escape preserve selections; page background is isolated',async()=>{
    const d=donuts().first(); for(const target of [d.locator('h3'),d.locator('[data-donut-count]'),d.locator('p[id]').first().locator('span')]) { await target.click(); await verify(d,['first','corresponding']); }
    const hint=d.getByRole('button',{name:/^คำอธิบาย:/}); await hint.click(); await page.getByRole('tooltip').waitFor();
    assert.match(await page.getByRole('tooltip').innerText(),/เลือกได้หลายบทบาท/);
    await page.getByRole('tooltip').locator('li').first().click(); await verify(d,['first','corresponding']);
    await hint.focus(); await page.keyboard.press('Enter'); await page.getByRole('tooltip').waitFor(); await page.keyboard.press('Escape'); await verify(d,['first','corresponding']);
    await page.getByRole('heading',{level:1}).click(); for(const item of await donuts().all()) await verify(item,['first','corresponding']);
  });
  await check('blank interior, SVG outer space and frame padding clear only their own chart',async()=>{
    await blank(donuts().first()); await verify(donuts().first(),[]); await verify(donuts().nth(1),['first','corresponding']);
    await blank(donuts().nth(1),10,10); await verify(donuts().nth(1),[]); await verify(donuts().nth(2),['first','corresponding']);
    const d=donuts().nth(2); await d.scrollIntoViewIfNeeded(); const b=await d.boundingBox(); await page.mouse.click(b.x+4,b.y+4); await verify(d,[]);
  });
  await check('Enter and Space independently toggle arc/legend roles and Escape clears on focused controls in all charts',async()=>{
    for(const d of await donuts().all()) { await segment(d,'first').focus(); await page.keyboard.press('Enter'); await legend(d,'corresponding').focus(); await page.keyboard.press('Space'); await verify(d,['first','corresponding']); await page.keyboard.press('Escape'); await verify(d,[]); }
    assert.equal(await requests(),baseline); assert.equal(await page.getByRole('dialog').count(),0);
  });
  await check('local year resets its own chart and recomputes rotation; new summary resets all',async()=>{
    for(const d of await donuts().all()) await legend(d,'first').click();
    await page.getByRole('combobox',{name:'ช่วงข้อมูลสำหรับกราฟบทบาท',exact:true}).selectOption('2569');
    await verify(donuts().first(),[]); await rotation(donuts().first()); await verify(donuts().nth(1),['first']);
    await page.getByRole('combobox',{name:'ช่วงข้อมูลสำหรับกราฟและตารางไขว้',exact:true}).selectOption('2569');
    for(const d of await donuts().all()) { await verify(d,[]); await rotation(d); }
    await legend(donuts().first(),'first').click(); await page.getByRole('button',{name:'ปกติ',exact:true}).click();
    await page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ',exact:true}).waitFor();
    for(const d of await donuts().all()) await verify(d,[]);
    await page.getByRole('combobox',{name:'ช่วงข้อมูลสำหรับกราฟบทบาท',exact:true}).selectOption('all');
    await page.getByRole('combobox',{name:'ช่วงข้อมูลสำหรับกราฟและตารางไขว้',exact:true}).selectOption('all');
  });
  await check('mobile touch selects two rotated arcs and legends in every chart; blank tap clears locally',async()=>{
    await page.getByRole('button',{name:'ตัวอย่าง 226 ผลงาน',exact:true}).click();
    await page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 226 รายการ',exact:true}).waitFor();
    await page.setViewportSize({width:390,height:844});
    for(let i=0;i<3;i++) { const d=donuts().nth(i); await d.locator('svg[role="group"]').scrollIntoViewIfNeeded(); for(const key of ['first','corresponding']) { const p=await point(d,key); await page.touchscreen.tap(p.x,p.y); } await verify(d,['first','corresponding']); await capture(`mobile-two-selected-rotation-${i+1}.png`,d); await blank(d,120,175,true); await verify(d,[]); for(const key of ['first','corresponding']) await legend(d,key).tap(); await verify(d,['first','corresponding']); await clear(d); }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  });
  await check('full-circle coauthor has a stable zero start and an actual touch target; zeros remain selectable',async()=>{
    await page.getByRole('button',{name:'บทบาทเดียวทั้งวง',exact:true}).click(); const d=donuts().first(); await segment(d,'first').waitFor({state:'detached'}); await rotation(d);
    const s=segment(d,'coauthor'); assert.equal(await s.getAttribute('data-start-angle'),'0'); assert.equal(await s.getAttribute('data-end-angle'),'360'); assert.equal((await s.getAttribute('d')).match(/ A /g).length,2);
    await d.locator('svg[role="group"]').scrollIntoViewIfNeeded(); const p=await point(d,'coauthor'); await page.touchscreen.tap(p.x,p.y); await verify(d,['coauthor']);
    await page.getByRole('button',{name:'ว่าง',exact:true}).click();
    await page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 0 รายการ',exact:true}).waitFor();
    for(const d of await donuts().all()) { assert.equal(await d.locator('[data-role-segment]').count(),0); await legend(d,'unknown').tap(); await verify(d,['unknown']); await blank(d,120,175,true); await verify(d,[]); }
  });
  assert.deepEqual(errors,[]); assert.ok(blocked.every(path=>path==='/api/v1/profile'));
} finally {
  await browser.close(); await mkdir(directory,{recursive:true});
  for(const item of captures) await writeFile(resolve(directory,item.name),item.data);
  await writeFile(resolve(directory,'browser-checks.json'),JSON.stringify({fixture_only:true,checks,page_errors:errors,blocked_requests:blocked},null,2));
}
console.log(JSON.stringify({passed:checks.length,pageErrors:errors.length}));
