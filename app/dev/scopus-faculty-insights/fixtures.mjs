import { FACULTY_ROLES, INTERNATIONAL_STATES, insightRatio, insightFilterKey } from '../../lib/scopus_faculty_insights.mjs';

export function facultyFixtureDocuments() {
  return Array.from({ length: 512 }, (_, n) => {
    const id = n + 1, international = id % 13 === 0 ? 'unknown' : id % 2 ? 'yes' : 'no';
    const role = id % 11 === 0 ? 'unknown' : id % 5 === 0 ? 'first' : id % 4 === 0 ? 'corresponding' : 'coauthor';
    const year = id % 67 === 0 ? null : 2024 + id % 3;
    const countries = international === 'unknown' ? [] : [{ country_key: 'thailand', country_name: 'Thailand', provenance: 'fixture' }, ...(international === 'yes' ? [{ country_key: 'japan', country_name: 'Japan', provenance: 'fixture' }, ...(id % 3 === 0 ? [{ country_key: 'china', country_name: 'China', provenance: 'fixture' }] : [])] : [])];
    return { document_id: id, eid: `fixture-${id}`, scopus_id: `fixture-scopus-${id}`, title: `ข้อมูลสมมติ ${id}: ระบบวิเคราะห์งานวิจัยและความร่วมมือของคณะ`, doi: id === 1 ? 'javascript:alert(1)' : `10.1234/fixture.${id}`, scopus_link: id === 1 ? 'javascript:alert(1)' : 'https://www.scopus.com', publication_name: 'วารสารสมมติสำหรับตรวจ UI', year_ce: year, year_be: year == null ? null : year + 543, citations: id % 40, international_status: international, faculty_role: role, countries, country_evidence_current: international !== 'unknown', author_role_status: role === 'unknown' ? 'needs_review' : 'complete', eligible_authors: [{ link_id: id, author_id: 1, scopus_author_id: 'fixture-author', full_name: 'อาจารย์สมมติ ก', author_seq: 1, is_first_author: role === 'unknown' ? null : role === 'first', is_corresponding_author: role === 'unknown' ? null : role === 'corresponding' }], country_metadata: { status: international === 'unknown' ? 'dirty_catalogue' : 'complete', normalizer_version: 'core-countries-v2' } };
  });
}

function aggregate(documents) {
  const a = { total: documents.length, international: {}, roles: {}, international_percent: {}, role_percent: {}, country_role: {}, partners: [] }, partners = new Map();
  INTERNATIONAL_STATES.forEach(s => { a.international[s.key] = 0; a.country_role[s.key] = Object.fromEntries(FACULTY_ROLES.map(r => [r.key, 0])); });
  FACULTY_ROLES.forEach(r => { a.roles[r.key] = 0; });
  for (const d of documents) {
    a.international[d.international_status]++; a.roles[d.faculty_role]++; a.country_role[d.international_status][d.faculty_role]++;
    if (d.international_status === 'yes') for (const c of d.countries.filter(c => c.country_key !== 'thailand')) { const p = partners.get(c.country_key) || { country_key: c.country_key, country_name: c.country_name, documents: 0 }; p.documents++; partners.set(c.country_key, p); }
  }
  INTERNATIONAL_STATES.forEach(s => { a.international_percent[s.key] = insightRatio(a.international[s.key], a.total); });
  FACULTY_ROLES.forEach(r => { a.role_percent[r.key] = insightRatio(a.roles[r.key], a.total); });
  a.partners = [...partners.values()].map(p => ({ ...p, percent_international: insightRatio(p.documents, a.international.yes) })).sort((a, b) => b.documents - a.documents || a.country_key.localeCompare(b.country_key));
  return a;
}
function filteredFixture(query, scenario) {
  if (scenario === 'empty') return [];
  let documents = facultyFixtureDocuments();
  if (scenario === 'role_example' || scenario === 'full_circle') {
    documents = documents.slice(0, scenario === 'role_example' ? 226 : 512).map((document, index) => {
      const role = scenario === 'full_circle' ? 'coauthor' : index < 20 ? 'first' : index < 102 ? 'corresponding' : 'coauthor';
      return { ...document, faculty_role: role, author_role_status: 'complete', eligible_authors: document.eligible_authors.map(author => ({ ...author, is_first_author: role === 'first', is_corresponding_author: role === 'corresponding' })) };
    });
  }
  return documents.filter(d => {
    const start = Number(query.year_start_be), end = Number(query.year_end_be);
    if (start && (!d.year_be || d.year_be < start)) return false;
    if (end && (!d.year_be || d.year_be > end)) return false;
    if (query.search_title && !d.title.includes(query.search_title)) return false;
    if (scenario === 'domestic') return d.international_status === 'no';
    if (scenario === 'unknown') return d.international_status === 'unknown';
    return true;
  });
}
export function makeFacultyFixtureSummary(query = {}, scenario = 'normal', revision = 'a'.repeat(64)) {
  const documents = filteredFixture(query, scenario), years = [...new Set(documents.map(d => d.year_ce).filter(Boolean))].sort();
  return { success: true, contract_version: 'faculty-insights-v1', source: 'scopus_core', scope: 'faculty', revision, totals: aggregate(documents), by_year: [...years.map(ce => ({ ...aggregate(documents.filter(d => d.year_ce === ce)), bucket: String(ce + 543), year_ce: ce, year_be: ce + 543 })), { ...aggregate(documents.filter(d => d.year_ce == null)), bucket: 'undated', year_ce: null, year_be: null }] };
}
export function makeFacultyFixtureAPI(scenario, onCall = () => {}) {
  let version = 0; const revisions = new Map();
  const revisionFor = (p) => { const key = `${insightFilterKey(p)}:${version}`; if (!revisions.has(key)) revisions.set(key, (revisions.size + 1).toString(16).padStart(64, '0')); return revisions.get(key); };
  const wait = (query) => new Promise(resolve => setTimeout(resolve, scenario === 'slow' ? (query.year_start_be === '2567' ? 1600 : query.year_start_be === '2569' ? 150 : 1200) : 150));
  const unavailable = () => { const e = new Error('Fixture unavailable'); e.status = 503; throw e; };
  return {
    async summary(query, options) {
      onCall('summary', query); await wait(query); if (scenario === 'error') unavailable();
      // Deliberately finish even after abort, to exercise generation protection.
      return makeFacultyFixtureSummary(query, scenario, revisionFor(query));
    },
    async drilldown(query, options) {
      onCall('drilldown', query); await wait(query); if (scenario === 'error' || (scenario === 'page_error' && query.page > 1)) unavailable();
      const { revision, page, page_size, year_be, international_status, faculty_role, country_key, drilldown_search, ...filters } = query;
      if (scenario === 'revision' && version === 0) version++;
      if (revision !== revisionFor(filters)) { const e = new Error('Fixture revision changed'); e.status = 409; throw e; }
      const selected = filteredFixture(filters, scenario).filter(d => (!year_be || (year_be === 'undated' ? d.year_ce == null : d.year_be === Number(year_be))) && (!international_status || d.international_status === international_status) && (!faculty_role || d.faculty_role === faculty_role) && (!country_key || d.countries.some(c => c.country_key === country_key)));
      const search = (drilldown_search || '').trim();
      const documents = selected.filter(d => !search || [d.title, d.doi, d.eid, d.scopus_id, d.publication_name, ...d.eligible_authors.map(a => a.full_name)].some(v => v?.toLowerCase().includes(search.toLowerCase())));
      return { success: true, scope_total: selected.length, search, contract_version: 'faculty-insights-v1', source: 'scopus_core', scope: 'faculty', revision, total: documents.length, page, page_size, total_pages: Math.ceil(documents.length / page_size), sort: 'document_id_asc', documents: documents.slice((page - 1) * page_size, page * page_size) };
    },
  };
}
