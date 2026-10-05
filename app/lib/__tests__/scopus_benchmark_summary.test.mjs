import test from 'node:test';
import assert from 'node:assert/strict';
import { createSummaryLoader, defaultSummaryFilters, filterSummaryFaculty, sortSummaryRows, nextSummarySort, hasNonJournalTypes, presentationRows } from '../scopus_benchmark_summary.mjs';

test('presentation ratios distinguish COC/Thailand from COC/KKU and preserve missing/zero',()=>{
  const source=[{thailand:100,kku:20,coc:5},{thailand:0,kku:0,coc:0},{thailand:null,kku:null,coc:null}];
  const result=presentationRows(source);
  assert.equal(result[0].kku_pct,20);assert.equal(result[0].coc_thailand_pct,5);assert.equal(result[0].coc_pct,25);
  for(const row of result.slice(1)){assert.equal(row.kku_pct,null);assert.equal(row.coc_thailand_pct,null);assert.equal(row.coc_pct,null);}
  assert.equal(source[0].coc_thailand_pct,undefined);
});

test('unranked rows default to shown for mixed or exclusively non-Journal types',()=>{
  for(const types of ['Journal,Book','Conference Proceeding','Trade Journal',' Book Series , Journal ','Journal,New Type'])assert.equal(hasNonJournalTypes(types),true,types);
  for(const types of ['Journal',' Journal ,', '',null])assert.equal(hasNonJournalTypes(types),false,types);
});

test('summary defaults use prior/current CE years, Journal, classified and non-Low',()=>{
  assert.deepEqual(defaultSummaryFilters(2026),{year_from:2025,year_to:2026,types:'Journal',category:'classified',confidence:'High,Medium,unknown',quartile_mode:'t1'});
});
test('view loads only on activation and reuses successful cached responses',async()=>{
  const overview=createSummaryLoader(),faculty=createSummaryLoader(),legacy=createSummaryLoader();
  let calls=0;const fetcher=async()=>{calls++;return {data:'ok'}};const received=[];
  assert.equal(calls,0);
  await overview.load('filter1',fetcher,r=>received.push(r),assert.fail);
  overview.stop();faculty.stop();legacy.stop();
  await overview.load('filter1',fetcher,r=>received.push(r),assert.fail);
  assert.equal(calls,1);assert.equal(received.length,2);
  await faculty.load('filter1',fetcher,()=>{},assert.fail);assert.equal(calls,2);
  overview.clear();await overview.load('filter1',fetcher,()=>{},assert.fail);assert.equal(calls,3);
});
test('explicit cancellation/old filter responses are aborted and cannot overwrite newer results',async()=>{
  const loader=createSummaryLoader();let complete;let signal;const results=[];
  const old=loader.load('old',s=>{signal=s;return new Promise(r=>complete=r)},r=>results.push(r),assert.fail);
  loader.stop();assert.equal(signal.aborted,true);
  await loader.load('new',async()=> 'new',r=>results.push(r),assert.fail);
  complete('old');await old;assert.deepEqual(results,['new']);
});
test('a failed request is retryable and not cached',async()=>{
  const loader=createSummaryLoader();let error;
  await loader.load('a',async()=>{throw new Error('failure')},assert.fail,e=>error=e);
  assert.equal(error.message,'failure');let result;await loader.load('a',async()=>42,r=>result=r,assert.fail);assert.equal(result,42);
});
test('faculty roster search, hide-empty and ratio ordering do not mutate the full roster',()=>{
  const rows=[{name:'A',scopus_id:'1',total:10,first_pct:10},{name:'B',scopus_id:'2',total:2,first_pct:100},{name:'C',scopus_id:'',total:0}];
  assert.deepEqual(filterSummaryFaculty(rows,'',false,'first_pct').map(r=>r.name),['B','A','C']);
  assert.equal(filterSummaryFaculty(rows,'',true,'total').length,2);assert.equal(filterSummaryFaculty(rows,'2',false,'total')[0].name,'B');assert.equal(rows.length,3);
});

test('table sorting compares numbers and keeps unavailable values last in either direction',()=>{
  const rows=[{label:'ten',thailand:10,kku_pct:20},{label:'missing',thailand:null,kku_pct:null},{label:'two',thailand:2,kku_pct:90},{label:'zero',thailand:0,kku_pct:0}];
  assert.deepEqual(sortSummaryRows(rows,{key:'thailand',direction:'asc'}).map(r=>r.label),['zero','two','ten','missing']);
  assert.deepEqual(sortSummaryRows(rows,{key:'thailand',direction:'desc'}).map(r=>r.label),['ten','two','zero','missing']);
  assert.deepEqual(sortSummaryRows(rows,{key:'kku_pct',direction:'desc'}).map(r=>r.label),['two','ten','zero','missing']);
  assert.equal(rows[0].label,'ten');
});
test('header clicks toggle direction, Quartile uses quality order and unlinked faculty stay last',()=>{
  const initial=nextSummarySort(null,'thailand');
  assert.deepEqual(initial,{key:'thailand',direction:'desc'});
  assert.deepEqual(nextSummarySort(initial,'thailand'),{key:'thailand',direction:'asc'});
  assert.deepEqual(nextSummarySort(initial,'label'),{key:'label',direction:'asc'});
  const quartiles=['missing','Q4','T1','not_applicable','Q1'].map(quartile=>({quartile}));
  assert.deepEqual(sortSummaryRows(quartiles,{key:'quartile',direction:'asc'}).map(r=>r.quartile),['T1','Q1','Q4','missing','not_applicable']);
  const faculty=[{name:'A',scopus_id:'10',total:0,linkable:false},{name:'B',scopus_id:'2',total:0,linkable:true},{name:'C',scopus_id:'11',total:2,linkable:true}];
  assert.deepEqual(filterSummaryFaculty(faculty,'',false,{key:'total',direction:'asc'}).map(r=>r.name),['B','C','A']);
  assert.deepEqual(filterSummaryFaculty(faculty,'',false,{key:'scopus_id',direction:'asc'}).map(r=>r.scopus_id),['2','10','11']);
});


const pendingResult=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject};};
test('pending tab return joins the same promise; background completion is cached',async()=>{
 const loader=createSummaryLoader(),request=pendingResult(),received=[];let calls=0,signal;
 const fetcher=s=>{calls++;signal=s;return request.promise;};
 const first=loader.load('applied',fetcher,value=>received.push(['initial',value]),assert.fail);
 // Visibility changes deliberately do not call stop.
 const joined=loader.load('applied',fetcher,value=>received.push(['returned',value]),assert.fail);
 assert.equal(first,joined);assert.equal(calls,1);assert.equal(signal.aborted,false);
 request.resolve('ready');await first;assert.deepEqual(received,[['returned','ready']]);
 await loader.load('applied',fetcher,value=>received.push(['cached',value]),assert.fail);
 assert.equal(calls,1);assert.deepEqual(received.at(-1),['cached','ready']);
});
test('visited streams complete independently; unvisited streams are never eagerly fetched',async()=>{
 const streams={overview:createSummaryLoader(),faculty:createSummaryLoader(),presentation:createSummaryLoader(),comparison:createSummaryLoader(),insights:createSummaryLoader()};
 const pending=pendingResult();let calls=0;const values=[];
 const first=streams.overview.load('filters',()=>{calls++;return pending.promise},v=>values.push(v),assert.fail);
 await streams.presentation.load('presentation',async()=>{calls++;return 'presentation'},v=>values.push(v),assert.fail);
 assert.equal(calls,2);pending.resolve('overview');await first;assert.deepEqual(values,['presentation','overview']);
});
test('changing applied filters aborts old request even when its panel is hidden',async()=>{
 const loader=createSummaryLoader(),old=pendingResult(),values=[];let signal;
 const first=loader.load('old',s=>{signal=s;return old.promise},v=>values.push(v),assert.fail);
 await loader.load('new',async()=> 'current',v=>values.push(v),assert.fail);
 assert.equal(signal.aborted,true);old.resolve('obsolete');await first;assert.deepEqual(values,['current']);
});
test('explicit refresh invalidates completed cache and pending generation',async()=>{
 const loader=createSummaryLoader(),old=pendingResult(),values=[];let signal,calls=0;
 await loader.load('cached',async()=>{calls++;return 'before'},v=>values.push(v),assert.fail);
 const first=loader.load('pending',s=>{signal=s;return old.promise},v=>values.push(v),assert.fail);
 loader.stop();loader.clear();assert.equal(signal.aborted,true);
 await loader.load('cached',async()=>{calls++;return 'after'},v=>values.push(v),assert.fail);
 old.resolve('old');await first;assert.equal(calls,2);assert.deepEqual(values,['before','after']);
});
test('joined failure reaches latest receiver and remains retryable',async()=>{
 const loader=createSummaryLoader(),request=pendingResult();let error,calls=0;
 const first=loader.load('same',()=>{calls++;return request.promise},assert.fail,assert.fail);
 const second=loader.load('same',assert.fail,assert.fail,e=>error=e);
 request.reject(new Error('retry'));await second;await first;assert.equal(error.message,'retry');assert.equal(calls,1);
 let value;await loader.load('same',async()=>42,v=>value=v,assert.fail);assert.equal(value,42);
});
test('unmount cleanup stops pending work and clears completed cache',async()=>{
 const loader=createSummaryLoader(),request=pendingResult();let signal,calls=0;
 await loader.load('ready',async()=>{calls++;return 'cached'},()=>{},assert.fail);
 const first=loader.load('pending',s=>{signal=s;return request.promise},assert.fail,assert.fail);
 loader.stop();loader.clear();request.resolve('late');await first;assert.equal(signal.aborted,true);
 await loader.load('ready',async()=>{calls++;return 'new page'},()=>{},assert.fail);assert.equal(calls,2);
});
