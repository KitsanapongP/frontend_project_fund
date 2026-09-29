import test from 'node:test';
import assert from 'node:assert/strict';
import { createSummaryLoader, defaultSummaryFilters, filterSummaryFaculty } from '../scopus_benchmark_summary.mjs';

test('summary defaults use prior/current CE years, Journal, classified and non-Low',()=>{
  assert.deepEqual(defaultSummaryFilters(2026),{year_from:2025,year_to:2026,types:'Journal',category:'classified',confidence:'High,Medium,Preface,unknown',quartile_mode:'t1'});
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
test('inactive/old filter responses are aborted and cannot overwrite newer results',async()=>{
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
