import test from 'node:test';
import assert from 'node:assert/strict';
import { createFacultyInsightStore, validateInsightSummary, insightPercent, insightRatio, safeInsightURL, insightDOIURL, insightFilterKey } from '../scopus_faculty_insights.mjs';
import { makeFacultyFixtureSummary, makeFacultyFixtureAPI } from '../../dev/scopus-faculty-insights/fixtures.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const summary = (revision = 'a'.repeat(64)) => makeFacultyFixtureSummary({}, 'normal', revision);
const page = (params, extra = {}) => ({ success: true, source: 'scopus_core', scope: 'faculty', contract_version: 'faculty-insights-v1', revision: params.revision, page: params.page, page_size: params.page_size, total: 0, total_pages: 0, documents: [], ...extra });

test('country/role totals and partner overlap remain valid, zero percentages are em dash', () => {
  const s = validateInsightSummary(summary());
  assert.equal(s.totals.total, 512);
  assert.ok(s.totals.international.unknown > 0);
  assert.ok(s.totals.partners.reduce((sum, p) => sum + p.documents, 0) > s.totals.international.yes);
  assert.equal(insightPercent(insightRatio(0, 0)), '—');
  assert.equal(insightPercent(0), '0.0%');
  const roles = s.totals.country_role.yes;
  assert.equal(Object.values(roles).reduce((sum, n) => sum + n, 0), s.totals.international.yes);
  assert.notEqual(insightRatio(roles.first, s.totals.international.yes), insightRatio(roles.first, s.totals.total));
  const empty = validateInsightSummary(makeFacultyFixtureSummary({}, 'empty'));
  assert.equal(empty.totals.international_percent.no, null);
});

test('malformed summary cannot become misleading zero output', () => {
  for (const alter of [s => { s.totals = {}; }, s => { s.source = 'mixed'; }, s => { s.revision = 'old'; }, s => { s.totals.international.no++; }, s => { s.totals.country_role.unknown.coauthor++; }, s => { s.by_year = []; }, s => { delete s.totals.role_percent.first; }]) { const s = summary(); alter(s); assert.throws(() => validateInsightSummary(s)); }
});

test('external links reject unsafe schemes, relative URLs and embedded credentials', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///x', '//evil.test', '/local', 'https://user:password@example.com']) assert.equal(safeInsightURL(url), null);
  assert.equal(safeInsightURL('https://www.scopus.com/record?a=1'), 'https://www.scopus.com/record?a=1');
  assert.equal(insightDOIURL('javascript:alert(1)'), null);
  assert.equal(insightDOIURL('https://evil.test'), null);
  assert.equal(insightDOIURL('10.1234/a?<tag>'), 'https://doi.org/10.1234/a%3F%3Ctag%3E');
});

test('obsolete summary is aborted and ignored even when transport completes after abort', async () => {
  const requests = [], store = createFacultyInsightStore({ summary: (p, o) => { const d = deferred(); requests.push({ p, o, d }); return d.promise; } });
  const old = store.setFilters({ year_start_be: '2567' });
  const current = store.setFilters({ year_start_be: '2569' });
  assert.equal(requests[0].o.signal.aborted, true);
  requests[1].d.resolve(summary('b'.repeat(64))); await current;
  requests[0].d.resolve(summary()); await old;
  assert.equal(store.getSnapshot().summary.revision, 'b'.repeat(64));
  assert.equal(store.getSnapshot().filterKey, insightFilterKey({ year_start_be: '2569' }));
  store.dispose();
});

test('new applied filters immediately clear summary/pages; draft state never enters requests', async () => {
  const requests = [], store = createFacultyInsightStore({ summary: async p => { requests.push(p); return summary(); }, drilldown: async p => page(p) });
  await store.setFilters({ year_start_be: '2567', quality_buckets: 'Q2', search_author: 'Alice' });
  await store.open({ country_key: 'japan', international_status: 'yes' }, 'Japan');
  const fresh = store.setFilters({ year_start_be: '2568' });
  assert.equal(store.getSnapshot().summary, null); assert.equal(store.getSnapshot().drilldown, null);
  await fresh; assert.equal(requests.at(-1).year_start_be, '2568'); assert.equal(requests.at(-1).scope, 'faculty');
  store.dispose();
});

test('paging sends complete filters/dimensions/revision and preserves full total beyond 200', async () => {
  const params = [], store = createFacultyInsightStore({ summary: async () => summary(), drilldown: async p => { params.push(p); return page(p, { total: 512, total_pages: Math.ceil(512 / p.page_size) }); } });
  const filters = { year_start_be: '2567', year_end_be: '2569', quality_buckets: 'Q2', search_author: 'Alice', citation_min: '4', open_access_mode: 'oa' };
  await store.setFilters(filters); const dims = { faculty_role: 'coauthor', international_status: 'yes', country_key: 'japan', year_be: '2569' };
  await store.open(dims, 'Selection'); await store.page(9);
  assert.deepEqual(params.at(-1), { ...filters, scope: 'faculty', ...dims, revision: 'a'.repeat(64), page: 9, page_size: 25 });
  assert.equal(store.getSnapshot().drilldown.response.total, 512);
  await store.page(1, 200); assert.equal(params.at(-1).page_size, 200); store.dispose();
});

test('late page cannot overwrite new page and closing aborts/ignores results', async () => {
  const requests = [], store = createFacultyInsightStore({ summary: async () => summary(), drilldown: (p, o) => { const d = deferred(); requests.push({ p, o, d }); return d.promise; } });
  await store.setFilters({}); const old = store.open({}, 'All', 1), next = store.open({}, 'All', 2);
  assert.equal(requests[0].o.signal.aborted, true);
  requests[1].d.resolve(page(requests[1].p, { total: 50, total_pages: 2 })); await next;
  requests[0].d.resolve(page(requests[0].p, { total: 50, total_pages: 2 })); await old;
  assert.equal(store.getSnapshot().drilldown.page, 2);
  const pending = store.page(1); store.close(); requests[2].d.resolve(page(requests[2].p)); await pending;
  assert.equal(requests[2].o.signal.aborted, true); assert.equal(store.getSnapshot().drilldown, null); store.dispose();
});

test('409 refreshes shared summary then restarts the same dimension on page 1 once', async () => {
  const summaries = [], pages = []; let n = 0;
  const store = createFacultyInsightStore({ summary: async p => { summaries.push(p); return summary((++n === 1 ? 'a' : 'b').repeat(64)); }, drilldown: async p => { pages.push(p); if (p.revision === 'a'.repeat(64)) { const e = new Error('Changed'); e.status = 409; throw e; } return page(p); } });
  await store.setFilters({ search_title: 'Current', year_start_be: '2567' });
  await store.open({ year_be: '2568', faculty_role: 'first' }, 'First', 4, 50);
  assert.equal(summaries.length, 2); assert.equal(pages.length, 2);
  assert.equal(pages[1].page, 1); assert.equal(pages[1].revision, 'b'.repeat(64)); assert.equal(pages[1].faculty_role, 'first'); assert.equal(pages[1].search_title, 'Current');
  assert.match(store.getSnapshot().drilldown.notice, /หน้า 1/); store.dispose();
});

test('repeated 409 cannot trigger an infinite refresh loop', async () => {
  let summaries = 0, pages = 0;
  const store = createFacultyInsightStore({ summary: async () => { summaries++; return summary(); }, drilldown: async () => { pages++; const e = new Error('Changed'); e.status = 409; throw e; } });
  await store.setFilters({}); await store.open({}, 'All');
  assert.equal(summaries, 2); assert.equal(pages, 2); assert.match(store.getSnapshot().drilldown.error, /เปลี่ยนแปลงอีกครั้ง/); store.dispose();
});

test('closing while recovering a revision never reopens the dialog', async () => {
  const recovery = deferred(); let n = 0;
  const store = createFacultyInsightStore({ summary: async () => ++n === 1 ? summary() : recovery.promise, drilldown: async () => { const e = new Error(); e.status = 409; throw e; } });
  await store.setFilters({}); const pending = store.open({}, 'All'); await Promise.resolve(); await Promise.resolve(); store.close(); recovery.resolve(summary('b'.repeat(64))); await pending;
  assert.equal(store.getSnapshot().drilldown, null); store.dispose();
});

test('unavailable summary and page errors do not keep old values or show internal errors', async () => {
  const store = createFacultyInsightStore({ summary: async () => { const e = new Error('migration 050'); e.status = 503; throw e; } });
  await store.setFilters({}); assert.equal(store.getSnapshot().summary, null); assert.match(store.getSnapshot().error, /ไม่พร้อมใช้งาน/); assert.doesNotMatch(store.getSnapshot().error, /migration/); store.dispose();
  let fails = false;
  const pages = createFacultyInsightStore({ summary: async () => summary(), drilldown: async p => { if (fails) throw new Error('internal SQL'); return page(p); } });
  await pages.setFilters({}); await pages.open({}, 'All'); fails = true; await pages.page(2); assert.equal(pages.getSnapshot().drilldown.response, null); assert.ok(pages.getSnapshot().drilldown.error); pages.dispose();
});

test('closing during failed revision recovery cannot reopen an error dialog', async () => {
  const recovery = deferred(); let n = 0;
  const store = createFacultyInsightStore({ summary: async () => ++n === 1 ? summary() : recovery.promise, drilldown: async () => { const e = new Error(); e.status = 409; throw e; } });
  await store.setFilters({}); const pending = store.open({}, 'All'); await Promise.resolve(); await Promise.resolve(); store.close(); recovery.reject(new Error('unavailable')); await pending;
  assert.equal(store.getSnapshot().drilldown, null); assert.equal(store.getSnapshot().summary, null); assert.ok(store.getSnapshot().error); store.dispose();
});

test('development fixture has coherent paged data and never truncates its matching population', async () => {
  const api = makeFacultyFixtureAPI('normal'), s = await api.summary({ scope: 'faculty' }); validateInsightSummary(s);
  const ids = new Set();
  for (let page = 1; page <= 3; page++) { const d = await api.drilldown({ scope: 'faculty', revision: s.revision, page, page_size: 200 }); assert.equal(d.total, 512); d.documents.forEach(doc => { assert.equal(ids.has(doc.document_id), false); ids.add(doc.document_id); }); }
  assert.equal(ids.size, 512);
  for (const partner of s.totals.partners) { const d = await api.drilldown({ scope: 'faculty', revision: s.revision, country_key: partner.country_key, international_status: 'yes', page: 1, page_size: 200 }); assert.equal(d.total, partner.documents); }
});
