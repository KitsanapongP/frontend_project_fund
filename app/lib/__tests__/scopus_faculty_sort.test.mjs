import test from 'node:test';
import assert from 'node:assert/strict';
import { createFacultyInsightStore } from '../scopus_faculty_insights.mjs';
import { makeFacultyFixtureSummary, makeFacultyFixtureAPI, sortFacultyFixtureDocuments } from '../../dev/scopus-faculty-insights/fixtures.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; };
const response = (p, extra={}) => ({ success:true, source:'scopus_core', scope:'faculty', revision:p.revision, page:p.page, page_size:p.page_size, total:0, scope_total:512, search:p.drilldown_search || '', total_pages:0, documents:[], sort:p.sort_field ? `${p.sort_field}_${p.sort_direction}` : 'year_desc', ...extra });

test('sorts full 512 population before paging, ties and missing titles stay deterministic in both directions', async () => {
 const calls=[], api=makeFacultyFixtureAPI('sort_normal',(method,p)=>calls.push({method,p})), store=createFacultyInsightStore(api);
 await store.setFilters({}); const summary=store.getSnapshot().summary;
 await store.open({},'All',2,200); assert.equal(calls.at(-1).p.sort_field,'year');assert.equal(calls.at(-1).p.sort_direction,'desc');
 await store.sort('title'); let d=store.getSnapshot().drilldown;
 assert.equal(d.page,1); assert.deepEqual(d.sort,{field:'title',direction:'asc'});assert.deepEqual(d.response.documents.slice(0,3).map(d=>d.document_id),[501,502,1]);
 await store.page(3); d=store.getSnapshot().drilldown;assert.deepEqual(d.response.documents.slice(-2).map(d=>d.document_id),[503,504]);
 await store.sort('title'); d=store.getSnapshot().drilldown;assert.equal(d.page,1);assert.equal(d.sort.direction,'desc');
 await store.page(3); d=store.getSnapshot().drilldown;assert.deepEqual(d.response.documents.slice(-4).map(d=>d.document_id),[501,502,503,504]);
 await store.sort('year');assert.deepEqual(store.getSnapshot().drilldown.sort,{field:'year',direction:'asc'});
 assert.equal(store.getSnapshot().summary,summary);assert.equal(calls.filter(c=>c.method==='summary').length,1);store.dispose();
});

test('sort persists through search, clear, dimension selection, page size and retry', async () => {
 const calls=[], api=makeFacultyFixtureAPI('normal',(method,p)=>calls.push({method,p})), store=createFacultyInsightStore(api);
 await store.setFilters({search_title:'ข้อมูลสมมติ'});
 const dims={year_be:'2569',international_status:'yes',faculty_role:'coauthor',country_key:'japan'};
 await store.open(dims,'Cell');await store.sort('collaboration');await store.search('fixture-401');
 let d=store.getSnapshot().drilldown;assert.equal(d.response.total,1);assert.equal(d.response.documents[0].document_id,401);assert.deepEqual(d.dimensions,dims);
 await store.page(1,10);assert.equal(calls.at(-1).p.sort_field,'collaboration');assert.equal(calls.at(-1).p.drilldown_search,'fixture-401');
 await store.search('');d=store.getSnapshot().drilldown;assert.equal(d.page,1);assert.equal(d.sort.field,'collaboration');
 await store.refresh({dimensions:d.dimensions,label:d.label,pageSize:d.pageSize,search:d.search,sort:d.sort});
 d=store.getSnapshot().drilldown;assert.deepEqual(d.dimensions,dims);assert.equal(d.pageSize,10);assert.deepEqual(d.sort,{field:'collaboration',direction:'asc'});
 calls.filter(c=>c.method==='summary').forEach(c=>assert.deepEqual(c.p,{scope:'faculty',search_title:'ข้อมูลสมมติ'}));store.dispose();
});

test('rapid sort changes ignore stale results and stale conflicts, abort pending request and preserve latest choice', async () => {
 const requests=[];let summaries=0;
 const store=createFacultyInsightStore({summary:async()=>{summaries++;return makeFacultyFixtureSummary();},drilldown:(p,o)=>{const d=deferred();requests.push({p,o,d});return d.promise;}});
 await store.setFilters({});const opening=store.open({},'All');requests[0].d.resolve(response(requests[0].p));await opening;
 const asc=store.sort('title'),desc=store.sort('title');assert.equal(requests[1].o.signal.aborted,true);
 requests[2].d.resolve(response(requests[2].p));await desc;const conflict=new Error();conflict.status=409;requests[1].d.reject(conflict);await asc;
 assert.deepEqual(store.getSnapshot().drilldown.sort,{field:'title',direction:'desc'});assert.equal(summaries,1);
 const pending=store.sort('year');store.close();requests[3].d.resolve(response(requests[3].p));await pending;assert.equal(store.getSnapshot().drilldown,null);store.dispose();
});

test('409 recovery retains sort, search, dimensions and page size without adding sort to summary filters', async () => {
 let version=0;const requests=[];
 const store=createFacultyInsightStore({summary:async p=>{requests.push({method:'summary',p});return makeFacultyFixtureSummary({},'normal',(++version===1?'a':'b').repeat(64));},drilldown:async p=>{
  requests.push({method:'page',p});if(p.sort_field==='faculty_role'&&p.revision==='a'.repeat(64)){const e=new Error();e.status=409;throw e;}return response(p);
 }});
 await store.setFilters({year_start_be:'2567'});const dims={international_status:'yes',country_key:'japan'};
 await store.open(dims,'Japan',4,100,true,'','Alice');await store.sort('faculty_role');
 const d=store.getSnapshot().drilldown;assert.equal(d.page,1);assert.equal(d.pageSize,100);assert.equal(d.search,'Alice');assert.deepEqual(d.dimensions,dims);assert.deepEqual(d.sort,{field:'faculty_role',direction:'asc'});assert.match(d.notice,/หน้า 1/);
 requests.filter(r=>r.method==='summary').forEach(r=>assert.deepEqual(r.p,{scope:'faculty',year_start_be:'2567'}));assert.equal(requests.at(-1).p.sort_field,'faculty_role');store.dispose();
});

test('rejects a sorted response that silently retains default order; ignores non-sortable detail column', async () => {
 const requests=[];const store=createFacultyInsightStore({summary:async()=>makeFacultyFixtureSummary(),drilldown:async p=>{requests.push(p);return response(p,{sort:p.sort_field === 'year' ? 'year_desc' : 'document_id_asc'});}});
 await store.setFilters({});await store.open({},'All');await store.sort('details');assert.equal(requests.length,1);
 await store.sort('title');assert.ok(store.getSnapshot().drilldown.error);assert.equal(store.getSnapshot().drilldown.response,null);store.dispose();
});

test('fixture mirrors visible country and role lexical keys, numeric year and missing-last directions', () => {
 const docs=[{document_id:5,year_ce:null,faculty_role:'unknown',international_status:'unknown'}, {document_id:4,year_ce:2026,faculty_role:'first',international_status:'yes',country_evidence_current:true,countries:[{country_name:'Japan'}]}, {document_id:3,year_ce:2024,faculty_role:'corresponding',international_status:'yes',country_evidence_current:true,countries:[{country_name:'China'}]}, {document_id:2,year_ce:2026,faculty_role:'coauthor',international_status:'no',country_evidence_current:true,countries:[{country_name:'Thailand'}]}];
 const expected={year:[[3,2,4,5],[2,4,3,5]],faculty_role:[[2,3,4,5],[4,3,2,5]],collaboration:[[2,3,4,5],[4,3,2,5]]};
 for(const [field,orders] of Object.entries(expected))for(const [index,direction] of ['asc','desc'].entries())assert.deepEqual(sortFacultyFixtureDocuments([...docs],field,direction).map(d=>d.document_id),orders[index]);
 assert.deepEqual(sortFacultyFixtureDocuments([...docs]).map(d=>d.document_id),expected.year[1]);
});

test('new drilldowns default to newest year, keep undated last with ID ties and preserve default through page/search/recovery', async () => {
 const api=makeFacultyFixtureAPI('normal'),store=createFacultyInsightStore(api);await store.setFilters({});await store.open({},'All',1,200);
 assert.deepEqual(store.getSnapshot().drilldown.sort,{field:'year',direction:'desc'});
 const first=store.getSnapshot().drilldown.response;assert.deepEqual(first.documents.slice(0,3).map(d=>d.document_id),[2,5,8]);
 await store.page(3);const tail=store.getSnapshot().drilldown.response.documents;assert.deepEqual(tail.filter(d=>d.year_ce==null).map(d=>d.document_id),[67,134,201,268,335,402,469]);assert.equal(tail.at(-1).year_ce,null);
 await store.search('fixture-401');assert.deepEqual(store.getSnapshot().drilldown.sort,{field:'year',direction:'desc'});
 const d=store.getSnapshot().drilldown;await store.refresh(d,'revision');assert.deepEqual(store.getSnapshot().drilldown.sort,d.sort);
 await store.sort('year');assert.equal(store.getSnapshot().drilldown.sort.direction,'asc');await store.open({},'Reopen');assert.deepEqual(store.getSnapshot().drilldown.sort,{field:'year',direction:'desc'});store.dispose();
 const s=await api.summary({});const omitted=await api.drilldown({revision:s.revision,page:1,page_size:25});assert.equal(omitted.sort,'year_desc');assert.equal(omitted.documents[0].document_id,2);
});
