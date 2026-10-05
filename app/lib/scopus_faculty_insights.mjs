export const FACULTY_ROLES = [
  { key: 'first', label: 'First author', color: '#2563eb' },
  { key: 'corresponding', label: 'Corresponding author', color: '#7c3aed' },
  { key: 'coauthor', label: 'Co-author', color: '#0d9488' },
  { key: 'unknown', label: 'ยังระบุบทบาทไม่ได้', color: '#94a3b8' },
];
export const INTERNATIONAL_STATES = [
  { key: 'yes', label: 'ร่วมกับต่างประเทศ', color: '#2563eb' },
  { key: 'no', label: 'ภายในประเทศ', color: '#0d9488' },
  { key: 'unknown', label: 'ยังระบุประเทศไม่ได้', color: '#94a3b8' },
];
export const insightNumber = (value) => Number(value).toLocaleString('th-TH');
export const insightPercent = (value) => value == null || !Number.isFinite(Number(value)) ? '—' : `${Number(value).toFixed(1)}%`;
export const insightRatio = (count, total) => total > 0 ? count * 100 / total : null;
export const insightYearLabel = (row) => row.bucket === 'undated' ? 'ไม่ระบุปี' : String(row.year_be);

export function insightFilterKey(query) {
  return JSON.stringify(Object.entries({ ...query, scope: 'faculty' }).filter(([, value]) => value != null).sort(([a], [b]) => a.localeCompare(b)));
}

// Only permit navigable web links. DOI text is encoded as a path rather than
// accepting a source-controlled URL/scheme; plain identifiers remain visible.
export function safeInsightURL(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try { const url = new URL(value.trim()); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function insightDOIURL(doi) {
  if (typeof doi !== 'string' || !/^10\.\d{4,9}\/\S+$/i.test(doi.trim())) return null;
  return `https://doi.org/${doi.trim().split('/').map(encodeURIComponent).join('/')}`;
}

const count = (n) => Number.isSafeInteger(n) && n >= 0;
function validAggregate(a) {
  if (!a || !count(a.total) || !Array.isArray(a.partners)) return false;
  const states = INTERNATIONAL_STATES.map(r => r.key), roles = FACULTY_ROLES.map(r => r.key);
  if (!states.every(s => count(a.international?.[s]) && roles.every(r => count(a.country_role?.[s]?.[r]))) || !roles.every(r => count(a.roles?.[r]))) return false;
  if (states.reduce((sum, s) => sum + a.international[s], 0) !== a.total || roles.reduce((sum, r) => sum + a.roles[r], 0) !== a.total) return false;
  if (!states.every(s => roles.reduce((sum, r) => sum + a.country_role[s][r], 0) === a.international[s]) || !roles.every(r => states.reduce((sum, s) => sum + a.country_role[s][r], 0) === a.roles[r])) return false;
  const percent = (p) => p === null || (typeof p === 'number' && Number.isFinite(p) && p >= 0 && p <= 100);
  return states.every(s => percent(a.international_percent?.[s]) && (a.total > 0 || a.international_percent[s] === null))
    && roles.every(r => percent(a.role_percent?.[r]) && (a.total > 0 || a.role_percent[r] === null))
    && a.partners.every(p => typeof p.country_key === 'string' && p.country_key !== 'thailand' && typeof p.country_name === 'string' && count(p.documents) && p.documents <= a.international.yes && percent(p.percent_international));
}
export function validateInsightSummary(response) {
  if (response?.success !== true || response.contract_version !== 'faculty-insights-v1' || response.source !== 'scopus_core' || response.scope !== 'faculty' || !/^[a-f0-9]{64}$/.test(response.revision || '') || !validAggregate(response.totals) || !Array.isArray(response.by_year) || !response.by_year.some(y => y.bucket === 'undated') || !response.by_year.every(validAggregate) || response.by_year.reduce((sum, y) => sum + y.total, 0) !== response.totals.total) {
    throw new Error('Invalid faculty insight response');
  }
  return response;
}
export function insightErrorMessage(error) {
  if (error?.status === 401) return 'กรุณาเข้าสู่ระบบใหม่เพื่อดูข้อมูล';
  if (error?.status === 403) return 'คุณไม่มีสิทธิ์ดูข้อมูลส่วนนี้';
  if (error?.status === 409) return 'ข้อมูลเปลี่ยนแปลงอีกครั้ง กรุณาอัปเดตข้อมูลแล้วลองใหม่';
  return 'ข้อมูลยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
}

// Shared resource for all three cards. Every request has an AbortController and
// a generation guard because transports/mock APIs may complete after abort.
export function createFacultyInsightStore(api) {
  let state = { filterKey: null, summary: null, loading: true, error: null, drilldown: null };
  let query = {}, summaryGeneration = 0, pageGeneration = 0, summaryController, pageController;
  const listeners = new Set();
  const publish = (patch) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const store = {
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    getSnapshot: () => state,
    setFilters: (params) => { query = { ...params, scope: 'faculty' }; return store.refresh(); },
    async refresh(resume = null, reason = 'refresh') {
      summaryController?.abort(); pageController?.abort(); pageGeneration++;
      const controller = new AbortController(); summaryController = controller;
      const generation = ++summaryGeneration, key = insightFilterKey(query), params = { ...query };
      publish({ filterKey: key, summary: null, loading: true, error: null, drilldown: resume ? { ...resume, page: 1, response: null, loading: true, error: null } : null });
      try {
        const response = await api.summary(params, { signal: controller.signal });
        if (controller.signal.aborted || generation !== summaryGeneration) return;
        const summary = validateInsightSummary(response);
        publish({ summary, loading: false });
        if (resume && state.drilldown) await store.open(resume.dimensions, resume.label, 1, resume.pageSize, false, reason === 'revision' ? 'ข้อมูลเปลี่ยนแปลงแล้ว อัปเดตสรุปและเริ่มรายการใหม่จากหน้า 1' : 'โหลดข้อมูลใหม่และเริ่มรายการจากหน้า 1', resume.search);
      } catch (error) {
        if (controller.signal.aborted || generation !== summaryGeneration) return;
        publish({ loading: false, error: insightErrorMessage(error), drilldown: resume && state.drilldown ? { ...resume, response: null, loading: false, error: insightErrorMessage(error) } : null });
      }
    },
    async open(dimensions, label, page = 1, pageSize = 25, allowRecovery = true, notice = '', search = '') {
      if (!state.summary || state.loading) return;
      pageController?.abort(); const controller = new AbortController(); pageController = controller;
      const generation = ++pageGeneration, summaryRun = summaryGeneration, revision = state.summary.revision;
      search = search.trim();
      const selection = { dimensions: { ...dimensions }, label, page, pageSize, notice, search };
      publish({ drilldown: { ...selection, response: null, error: null, loading: true } });
      try {
        const response = await api.drilldown({ ...query, ...dimensions, revision, page, page_size: pageSize, ...(search ? { drilldown_search: search } : {}) }, { signal: controller.signal });
        if (controller.signal.aborted || generation !== pageGeneration || summaryRun !== summaryGeneration) return;
        if (response?.revision !== revision) { const error = new Error('Revision changed'); error.status = 409; throw error; }
        if (response.success !== true || response.source !== 'scopus_core' || response.scope !== 'faculty' || !count(response.total) || response.page !== page || response.page_size !== pageSize || response.total_pages !== Math.ceil(response.total / pageSize) || !Array.isArray(response.documents) || response.documents.length > pageSize) throw new Error('Invalid insight page');
        if ((search || response.scope_total != null) && (!count(response.scope_total) || response.scope_total < response.total || response.search !== search)) throw new Error('Invalid insight search scope');
        publish({ drilldown: { ...selection, response, loading: false, error: null } });
      } catch (error) {
        if (controller.signal.aborted || generation !== pageGeneration || summaryRun !== summaryGeneration) return;
        if (error.status === 409 && allowRecovery) { await store.refresh(selection, 'revision'); return; }
        publish({ drilldown: { ...selection, response: null, loading: false, error: insightErrorMessage(error) } });
      }
    },
    page: (page, pageSize = state.drilldown?.pageSize) => { const d = state.drilldown; if (d) return store.open(d.dimensions, d.label, page, pageSize, true, '', d.search); },
    search: (search) => { const d = state.drilldown; if (d) return store.open(d.dimensions, d.label, 1, d.pageSize, true, '', search); },
    close: () => { pageController?.abort(); pageGeneration++; publish({ drilldown: null }); },
    dispose: () => { summaryController?.abort(); pageController?.abort(); summaryGeneration++; pageGeneration++; listeners.clear(); },
  };
  return store;
}
