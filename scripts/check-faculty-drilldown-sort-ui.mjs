// Synthetic loopback preview only. No live backend or Scopus requests.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { makeFacultyFixtureAPI } from '../app/dev/scopus-faculty-insights/fixtures.mjs';
const { chromium } = createRequire(import.meta.url)(process.env.SCOPUS_UI_PLAYWRIGHT_PATH || 'playwright');
const origin = process.env.SCOPUS_UI_ORIGIN || 'http://127.0.0.1:3121';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) throw new Error('Loopback fixture only');
const directory = resolve(process.env.SCOPUS_UI_EVIDENCE_DIR || 'docs/faculty-drilldown-sort-evidence');
const browser = await chromium.launch({ channel:'chrome', headless:true });
const page = await browser.newPage({ viewport:{width:1440,height:1000}, hasTouch:true });
const checks=[], errors=[], blocked=[], captures=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin||u.pathname.startsWith('/api/')){blocked.push(u.pathname);return route.abort();}return route.continue();});
const check=async(name,fn)=>{try{await fn();checks.push({name,passed:true});}catch(e){checks.push({name,passed:false,error:e.message});throw e;}};
const dialog=()=>page.getByRole('dialog');
const ready=()=>page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ',exact:true}).waitFor();
const openAll=async()=>{await page.getByRole('button',{name:'ดูผลงาน ทั้งหมด รวมตามเงื่อนไขที่เลือก 512 รายการ',exact:true}).click();await loaded();};
const loaded=async()=>{await dialog().locator('[aria-busy="false"]').waitFor();};
const close=async()=>{await dialog().getByRole('button',{name:'ปิดรายการผลงาน'}).click();await dialog().waitFor({state:'hidden'});};
const rows=()=>dialog().locator('tr[data-document-row]');
const ids=async()=>Promise.all((await rows().all()).map(async row=>Number((await row.locator('td').first().innerText()).match(/fixture-(\d+)/)[1])));
const header=field=>dialog().locator('th[aria-sort]').nth(['title','year','collaboration','faculty_role'].indexOf(field));
const sort=async field=>{await header(field).getByRole('button').click();await loaded();};
const search=async text=>{await dialog().getByRole('searchbox').fill(text);await dialog().getByRole('button',{name:'ค้นหา',exact:true}).click();await loaded();};
const scenario=async label=>{if(await dialog().isVisible())await close();await page.getByRole('button',{name:label,exact:true}).click();await ready();};
const shot=async name=>captures.push({name,data:await page.screenshot({fullPage:!(await dialog().isVisible())})});
const calls=async()=>JSON.parse(await page.getByLabel('คำขอทดสอบ',{exact:true}).textContent());
const expected=async(field,direction,extra={})=>{const api=makeFacultyFixtureAPI('sort_normal'),s=await api.summary({scope:'faculty',open_access_mode:'all'});return api.drilldown({scope:'faculty',open_access_mode:'all',revision:s.revision,page:1,page_size:25,...extra,sort_field:field,sort_direction:direction});};
try{
 await page.goto(`${origin}/dev/scopus-faculty-insights`);await ready();await scenario('ทดสอบเรียงข้อมูล');
 await check('default newest year first has an active descending year header and stable ID ties; details has no sort',async()=>{
  await openAll();assert.deepEqual(await ids(),(await expected('year','desc')).documents.map(d=>d.document_id));
  assert.equal(await header('year').getAttribute('aria-sort'),'descending');assert.equal(await dialog().locator('th[aria-sort="none"]').count(),3);assert.equal(await dialog().getByRole('columnheader',{name:'รายละเอียด',exact:true}).getByRole('button').count(),0);await shot('desktop-default.png');
 });
 await check('title ascending sorts beyond first 200, resets page and keeps missing titles last in both directions',async()=>{
  await dialog().getByRole('combobox',{name:'จำนวนผลงานต่อหน้า'}).selectOption('200');await loaded();
  await dialog().getByRole('button',{name:'ถัดไป',exact:true}).click();await loaded();
  await sort('title');assert.equal(await dialog().getByRole('combobox',{name:'เลือกรายการหน้า'}).inputValue(),'1');assert.equal(await header('title').getAttribute('aria-sort'),'ascending');assert.deepEqual((await ids()).slice(0,3),[501,502,1]);await shot('desktop-title-ascending.png');
  await dialog().getByRole('combobox',{name:'เลือกรายการหน้า'}).selectOption('3');await loaded();assert.deepEqual((await ids()).slice(-2),[503,504]);
  await sort('title');assert.equal(await header('title').getAttribute('aria-sort'),'descending');await dialog().getByRole('combobox',{name:'เลือกรายการหน้า'}).selectOption('3');await loaded();assert.deepEqual((await ids()).slice(-4),[501,502,503,504]);await shot('desktop-title-descending-last-page.png');
 });
 await check('numeric year, visible country/status and role labels sort in both directions before paging',async()=>{
  await dialog().getByRole('combobox',{name:'จำนวนผลงานต่อหน้า'}).selectOption('25');await loaded();
  for(const field of ['year','collaboration','faculty_role'])for(const direction of ['asc','desc']){
   await sort(field);const data=await expected(field,direction);assert.deepEqual(await ids(),data.documents.map(d=>d.document_id));assert.equal(await header(field).getAttribute('aria-sort'),direction==='asc'?'ascending':'descending');
  }await shot('desktop-role-descending.png');
 });
 await check('sort is preserved by search, clear, page and page size without changing summary or dimensions',async()=>{
  await search('fixture-401');assert.deepEqual(await ids(),[401]);await dialog().getByRole('combobox',{name:'จำนวนผลงานต่อหน้า'}).selectOption('10');await loaded();
  let last=(await calls()).at(-1);assert.equal(last.sort_field,'faculty_role');assert.equal(last.sort_direction,'desc');assert.equal(last.drilldown_search,'fixture-401');
  await dialog().getByRole('button',{name:'ล้าง',exact:true}).click();await loaded();await dialog().getByRole('button',{name:'ถัดไป',exact:true}).click();await loaded();last=(await calls()).at(-1);assert.equal(last.sort_direction,'desc');assert.equal(last.page,2);await close();
  await page.getByRole('combobox',{name:'ช่วงข้อมูลสำหรับกราฟและตารางไขว้',exact:true}).selectOption('2569');
  await page.getByRole('region',{name:'ตารางไขว้ประเทศและบทบาท'}).getByRole('button',{name:/^ดูผลงาน ร่วมกับต่างประเทศ Co-author /}).click();await loaded();await search('fixture-401');await sort('year');assert.deepEqual(await ids(),[401]);
  last=(await calls()).at(-1);assert.equal(last.year_be,'2569');assert.equal(last.international_status,'yes');assert.equal(last.faculty_role,'coauthor');assert.equal(last.drilldown_search,'fixture-401');assert.equal(last.sort_field,'year');await shot('desktop-search-dimensions.png');await close();
 });
 await check('rapid repeated header clicks keep newest direction even after older transport finishes',async()=>{
  await scenario('เปลี่ยนการเรียงเร็ว');await openAll();await header('title').getByRole('button').click();await header('title').getByRole('button').click();await loaded();const before=await ids();
  await page.waitForTimeout(1000);assert.equal(await header('title').getAttribute('aria-sort'),'descending');assert.deepEqual(await ids(),before);assert.equal((await calls()).filter(c=>c.method==='summary').length,1);await shot('desktop-rapid-sort.png');await close();
 });
 await check('revision recovery retains chosen sort, search, dimensions and page size and resumes page one',async()=>{
  await scenario('การเรียงกับข้อมูลเปลี่ยน');await page.getByRole('button',{name:/^ดู Japan /}).click();await loaded();await search('fixture-401');await dialog().getByRole('combobox',{name:'จำนวนผลงานต่อหน้า'}).selectOption('100');await loaded();
  await sort('faculty_role');await dialog().getByText('ข้อมูลเปลี่ยนแปลงแล้ว อัปเดตสรุปและเริ่มรายการใหม่จากหน้า 1',{exact:true}).waitFor();await loaded();assert.deepEqual(await ids(),[401]);const requests=await calls(),last=requests.at(-1);
  assert.equal(last.country_key,'japan');assert.equal(last.international_status,'yes');assert.equal(last.drilldown_search,'fixture-401');assert.equal(last.page_size,100);assert.equal(last.page,1);assert.equal(last.sort_field,'faculty_role');requests.filter(c=>c.method==='summary').forEach(c=>{assert.equal(c.sort_field,undefined);assert.equal(c.drilldown_search,undefined);});await shot('desktop-revision-recovery.png');await close();
 });
 await check('retry keeps sort and request selection after sorted page error',async()=>{
  await scenario('การเรียงผิดพลาดครั้งแรก');await openAll();await sort('title');await dialog().getByRole('alert').waitFor();await dialog().getByRole('button',{name:'ลองใหม่',exact:true}).click();await loaded();assert.deepEqual((await ids()).slice(0,2),[501,502]);assert.equal(await header('title').getAttribute('aria-sort'),'ascending');await shot('desktop-sort-retry.png');await close();
 });
 await check('keyboard and mobile touch sort headers have visible indicators and stay inside modal scroll area',async()=>{
  await scenario('ทดสอบเรียงข้อมูล');await openAll();await header('title').getByRole('button').focus();await page.keyboard.press('Enter');await loaded();assert.equal(await header('title').getAttribute('aria-sort'),'ascending');await close();
  await page.setViewportSize({width:390,height:844});await shot('mobile-full-page.png');await openAll();await header('title').getByRole('button').tap();await loaded();assert.deepEqual((await ids()).slice(0,2),[501,502]);await shot('mobile-title-ascending.png');
  await header('year').getByRole('button').tap();await loaded();assert.equal(await header('year').getAttribute('aria-sort'),'ascending');
  await dialog().locator('[aria-busy]').evaluate(el=>el.scrollLeft=el.scrollWidth);await header('faculty_role').getByRole('button').tap();await loaded();assert.equal(await header('faculty_role').getAttribute('aria-sort'),'ascending');const roleBox=await header('faculty_role').boundingBox();assert.ok(roleBox.x>=8&&roleBox.x+roleBox.width<=382);await shot('mobile-role-ascending.png');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const box=await dialog().locator('[data-explanation-container]').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390);await page.keyboard.press('Escape');await dialog().waitFor({state:'hidden'});
 });
 assert.deepEqual(errors,[]);assert.ok(blocked.every(p=>p==='/api/v1/profile'));
}finally{
 await browser.close();await mkdir(directory,{recursive:true});for(const capture of captures)await writeFile(resolve(directory,capture.name),capture.data);
 await writeFile(resolve(directory,'browser-checks.json'),JSON.stringify({fixture_only:true,origin,checks,page_errors:errors,blocked_requests:blocked,captures:captures.map(c=>c.name)},null,2));
}
console.log(JSON.stringify({passed:checks.filter(c=>c.passed).length,pageErrors:errors.length,fixtureOnly:true}));
