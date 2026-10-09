import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const { chromium }=createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH||'playwright');
const origin=process.env.SCOPUS_UI_ORIGIN||'http://127.0.0.1:3119';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw new Error('Loopback fixtures only');
const directory=resolve(process.env.SCOPUS_UI_EVIDENCE_DIR||'docs/research-tooltip-evidence/standardization');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},hasTouch:true});
const checks=[],coverage=[],captures=[],errors=[],blocked=[],contextCaptures=new Set();
page.on('pageerror',e=>errors.push(e.stack || e.message));
await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin||u.pathname.startsWith('/api/')){blocked.push(u.pathname);return route.abort();}return route.continue();});
const check=async(name,fn)=>{await fn();checks.push({name,passed:true});};
const panel=()=>page.locator('[data-explanation-panel]');
const trigger=name=>page.getByRole('button',{name:`คำอธิบาย: ${name}`,exact:true});
const dismiss=async()=>{await page.keyboard.press('Escape');await panel().waitFor({state:'hidden'});};
const capture=async(name,target=page)=>captures.push({name,data:await target.screenshot({fullPage:target===page,animations:'disabled'})});
const viewportCapture=async name=>captures.push({name,data:await page.screenshot({fullPage:false,animations:'disabled'})});
const bounded=async()=>{
  await panel().waitFor(); const box=await panel().boundingBox(),v=page.viewportSize();
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=v.width+1&&box.y+box.height<=v.height+1,JSON.stringify(box));
  assert.ok(await panel().evaluate(e=>e.scrollWidth<=e.clientWidth));
  const style=await panel().evaluate(e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,font:s.fontSize,line:s.lineHeight,padding:s.padding,border:s.borderRadius,z:s.zIndex};});
  assert.deepEqual(style,{background:'rgb(255, 255, 255)',font:'12px',line:'19.5px',padding:'16px',border:'8px',z:'10000'});
  assert.ok(await panel().locator('li').count()>0); assert.ok(await panel().locator('strong').count()>0);
  assert.doesNotMatch(await panel().innerText(),/\[object Object\]|;|XML|doc_type|snapshot|role 1\/4\/5|production|\bdev\b/);
};
const tour=async(surface,touch=false)=>{
  await page.locator('[role="status"]:visible').filter({hasText:'กำลังคำนวณรายงาน'}).waitFor({state:'hidden'});
  const labels=await page.locator('[data-explanation-trigger]:visible').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label'))),seen=new Map();
  for(const label of labels){
    const index=seen.get(label)||0;seen.set(label,index+1);
    const t=page.locator('[data-explanation-trigger]:visible').filter({has:page.locator('svg')}).and(page.getByRole('button',{name:label,exact:true})).nth(index);
    await page.mouse.move(0,0);
    await t.scrollIntoViewIfNeeded();
    if(touch)await t.tap();else{await t.focus();await panel().waitFor();await page.keyboard.press('Enter');}
    await bounded(); assert.equal(await t.getAttribute('aria-expanded'),'true',label);
    assert.equal(await t.getAttribute('aria-describedby'),await panel().getAttribute('id'));
    const b=await t.boundingBox();assert.ok(b.width>=32&&b.height>=32);
    coverage.push({surface,label,touch});
    if(label.includes('สูตรคำนวณ')||label.includes('H-index')||label.includes('Scopus ID')||label.includes('ผลกระทบ')||label.includes('หน่วยและขอบเขต')||surface==='setup')await capture(`${surface}-${touch?'mobile':'desktop'}-${coverage.length}.png`,panel());
    const representative=label.includes('สูตรคำนวณ')?'formula':label.includes('H-index ระดับคณะ')?'hindex':label.includes('Scopus ID')?'missing-id':'help';
    const contextKey=`${surface}-${touch?'mobile':'desktop'}-viewport-${representative}`;
    if(!contextCaptures.has(contextKey)){await viewportCapture(`${contextKey}.png`);contextCaptures.add(contextKey);}
    await dismiss();assert.equal(await t.getAttribute('aria-expanded'),'false');
  }
};
const tab=async name=>page.getByRole('button',{name,exact:true}).first().click();
try{
  await page.goto(`${origin}/dev/scopus-research-tooltips`);
  await page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 505 รายการ',exact:true}).waitFor();
  await page.locator('.hidx-chart .apexcharts-canvas').waitFor();
  await tab('แสดงกลุ่มสัดส่วน (Ratio)');
  await check('research legacy overview formulas, faculty cards and both H-index explanations share the canonical desktop panel',async()=>{await tour('research-faculty');await capture('research-faculty-desktop-full.png');});
  await check('formula help includes the no-tier denominator and does not toggle its table row or fetch data',async()=>{
    const target=page.getByRole('button',{name:/คำอธิบาย: สูตรคำนวณ.*ทุกประเภท.*ไม่รวม TCI/}).first();
    const before=await page.getByLabel('คำขอทดสอบทั้งหน้า').textContent();await target.focus();await page.keyboard.press('Enter');await bounded();assert.match(await panel().innerText(),/N\/A/);
    await panel().locator('li').first().click();assert.equal(await panel().count(),1);assert.equal(await page.getByLabel('คำขอทดสอบทั้งหน้า').textContent(),before);await dismiss();
  });
  await check('hover preview remains usable when moving into the panel; pin survives panel click and outside click closes',async()=>{
    const t=trigger('H-index ระดับคณะ');await t.hover();await bounded();await panel().hover();await page.waitForTimeout(180);await bounded();await page.mouse.move(0,0);await panel().waitFor({state:'hidden'});
    await t.focus();await page.keyboard.press('Enter');await panel().locator('li').first().click();await bounded();await page.getByRole('heading',{level:1}).first().click();await panel().waitFor({state:'hidden'});
  });
  await check('keyboard focus preview persists and moving to another explanation leaves one linked panel',async()=>{
    const first=trigger('H-index ระดับคณะ');await first.focus();await bounded();await page.mouse.move(0,0);await bounded();await page.keyboard.press('Enter');const next=trigger('การอ่านกราฟ H-index ระดับคณะ');await next.focus();await bounded();assert.equal(await panel().count(),1);assert.equal(await first.getAttribute('aria-expanded'),'false');assert.equal(await next.getAttribute('aria-expanded'),'true');await dismiss();
  });
  await check('Escape on a focused donut control still clears selection when unrelated help was pinned',async()=>{
    const d=page.locator('[data-role-donut]').first();await d.locator('[data-role-legend="first"]').click();const h=d.locator('[data-explanation-trigger]');await h.focus();await page.keyboard.press('Enter');await bounded();await d.locator('[data-role-segment="first"]').focus();await page.keyboard.press('Escape');await panel().waitFor({state:'hidden'});assert.equal(await d.getAttribute('data-selected-roles'),'');
  });
  await check('faculty modal keeps help in its focus trap; Escape closes only the help before the dialog',async()=>{
    await page.getByRole('button',{name:/^ดูผลงาน First author รวมตามเงื่อนไขที่เลือก \d+ รายการ$/}).click();await page.getByRole('dialog').waitFor();
    const t=trigger('ค้นหาผลงานภายในกลุ่มทั้งหมด');
    await t.focus();await page.keyboard.press('Enter');await bounded();assert.equal(await panel().evaluate(e=>!!e.closest('[role="dialog"]')),true);
    await panel().locator('li').first().click();await bounded();await dismiss();assert.equal(await page.getByRole('dialog').count(),1);await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
  });
  await check('real chart value tooltip preserves article values and uses matching typography',async()=>{
    const chart=page.locator('.hidx-chart');await chart.scrollIntoViewIfNeeded();const marker=chart.locator('.apexcharts-marker').nth(1);await marker.hover({force:true});
    const value=chart.locator('.apexcharts-tooltip');await value.waitFor();await page.waitForFunction(()=>document.querySelector('.hidx-chart .apexcharts-tooltip')?.textContent.includes('บทความอันดับ'),null,{timeout:5000});assert.match(await value.textContent(),/บทความอันดับ 2.*ถูกอ้างอิง 8 ครั้ง/);assert.match(await value.textContent(),/บทความสมมติ H-index 2/);
    assert.equal(await value.evaluate(e=>getComputedStyle(e).fontSize),'12px');await capture('research-hindex-value-desktop.png',chart);
  });
  await check('legacy plain-string Hint callers remain compatible and literal HTML stays plain text',async()=>{
    await page.getByText('ทดสอบรูปแบบข้อความเดิม',{exact:true}).click();const t=trigger('ข้อความอธิบายรูปแบบเดิม');await t.focus();await page.keyboard.press('Enter');await panel().waitFor();assert.match(await panel().innerText(),/<b>ยังเป็นข้อความธรรมดา<\/b>/);assert.equal(await panel().locator('b').count(),0);assert.equal(await panel().locator('ul').count(),0);assert.equal(await panel().locator('p').count(),3);await dismiss();await page.getByText('ทดสอบรูปแบบข้อความเดิม',{exact:true}).click();
  });
  await check('research person summary and year matrix native help is migrated without changing sort or requests',async()=>{
    await page.getByRole('radio',{name:'รายบุคคล',exact:true}).check();await tab('ใช้ตัวกรอง');await trigger('H-index สรุปรายบุคคล').waitFor();const before=await page.getByLabel('คำขอทดสอบทั้งหน้า').textContent();
    await tour('research-person');assert.equal(await page.getByLabel('คำขอทดสอบทั้งหน้า').textContent(),before);await capture('research-person-desktop-full.png');
  });
  await page.setViewportSize({width:390,height:844});
  await check('research person tooltips support touch in sticky headers on mobile',async()=>{await tour('research-person',true);await capture('research-person-mobile-full.png');});
  await page.getByRole('radio',{name:'ระดับคณะ',exact:true}).check();await tab('ใช้ตัวกรอง');
  await check('research faculty legacy and history cards remain usable with bounded mobile help',async()=>{await tour('research-faculty',true);await capture('research-faculty-mobile-full.png');});
  await page.goto(`${origin}/dev/scopus-benchmark-summary`);await page.getByRole('heading',{name:'จำนวนผลงานตามปี',exact:true}).waitFor();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByText('สถานะข้อมูล',{exact:true}).click();
  await check('Benchmark summary overview covers units, data limits, role totals and every Category/Quartile card',async()=>{await tour('benchmark-summary');await capture('benchmark-summary-desktop-full.png');});
  await tab('บทบาทอาจารย์');if(await page.getByRole('switch').getAttribute('aria-checked')==='true')await page.getByRole('switch').click();await trigger('Scopus ID อาจารย์ไม่มี Scopus ID').waitFor();
  await check('Benchmark faculty role table includes canonical help for missing Scopus IDs',async()=>{await tour('benchmark-faculty');assert.ok(coverage.some(c=>c.label.includes('Scopus ID อาจารย์ไม่มี Scopus ID')));await capture('benchmark-faculty-desktop-full.png');});
  await tab('สรุปเปรียบเทียบ Thailand / KKU / COC');await page.getByRole('heading',{name:'ผลกระทบจากการกรอง',exact:true}).waitFor();
  await check('Benchmark presentation ratios, stage denominators and all three comparison tables share the canonical panel',async()=>{await tour('benchmark-presentation');await capture('benchmark-presentation-desktop-full.png');});
  await check('switching a retained tab dismisses pinned explanatory help',async()=>{
    const t=trigger('KKU / Thailand');await t.focus();await page.keyboard.press('Enter');await bounded();await tab('ผลเปรียบเทียบเชิงวิเคราะห์');await panel().waitFor({state:'hidden'});
  });
  await page.getByRole('region',{name:'ตัวชี้วัดหลักของคณะ'}).waitFor();
  await check('Benchmark analytical KPI and comparison table preserve their distinct denominators and matching printed definitions',async()=>{await tour('benchmark-analytical');await capture('benchmark-analytical-desktop-full.png');});
  await tab('ตั้งค่า & ดึงข้อมูล');await page.getByText('ตั้งค่าขอบเขต KKU',{exact:true}).waitFor();
  await check('Benchmark setup steps use shared explanatory help without invoking setup writes',async()=>{const before=await page.getByLabel('จำนวน request').textContent();await tour('setup');assert.equal(await page.getByLabel('จำนวน request').textContent(),before);await capture('benchmark-setup-desktop-full.png');});
  await page.setViewportSize({width:390,height:844});
  for(const [name,surface] of [['ตั้งค่า & ดึงข้อมูล','setup'],['ผลเปรียบเทียบเชิงวิเคราะห์','benchmark-analytical'],['สรุปเปรียบเทียบ Thailand / KKU / COC','benchmark-presentation'],['สรุปผลงานและบทบาทอาจารย์','benchmark-faculty']]){
    await tab(name);await check(`${surface} touch help remains inside the mobile viewport`,async()=>{await tour(surface,true);await capture(`${surface}-mobile-full.png`);});
  }
  await tab('ภาพรวมผลงาน');await check('Benchmark summary overview touch coverage includes all repeated Category/Quartile cards',async()=>{await tour('benchmark-summary',true);await capture('benchmark-summary-mobile-full.png');});
  assert.deepEqual(errors,[]);
}finally{
  await browser.close();await mkdir(directory,{recursive:true});for(const c of captures)await writeFile(resolve(directory,c.name),c.data);
  await writeFile(resolve(directory,'browser-checks.json'),JSON.stringify({fixture_only:true,checks,coverage,page_errors:errors,blocked_requests:blocked},null,2));
}
console.log(JSON.stringify({passed:checks.length,tooltipVisits:coverage.length,pageErrors:errors.length}));
