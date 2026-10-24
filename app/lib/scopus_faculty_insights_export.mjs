import { FACULTY_ROLES, INTERNATIONAL_STATES, insightYearLabel, insightRatio, validateInsightSummary } from './scopus_faculty_insights.mjs';

const filterLabels = {
  year_start_be: 'ปีเริ่มต้น (พ.ศ.)', year_end_be: 'ปีสิ้นสุด (พ.ศ.)',
  aggregation_types: 'ประเภทผลงาน', quality_buckets: 'คุณภาพวารสาร', open_access_mode: 'Open Access',
  citation_min: 'Citation ต่ำสุด', citation_max: 'Citation สูงสุด', search_title: 'ชื่อผลงาน',
  search_doi: 'DOI', search_eid: 'EID', search_scopus_id: 'Scopus ID', search_journal: 'วารสาร',
  search_author: 'ผู้เขียน', search_affiliation: 'สังกัด', search_keyword: 'คำสำคัญ',
};
const percent = value => value == null ? '—' : { value: value / 100, format: 'percent' };
const selection = (summary, bucket) => summary.by_year.find(y => y.bucket === bucket) || summary.totals;
const period = (summary, bucket) => summary.by_year.some(y => y.bucket === bucket)
  ? insightYearLabel(summary.by_year.find(y => y.bucket === bucket)) : 'ทุกปีตามเงื่อนไขที่เลือก';

// Uses the same validated snapshot as the cards; exporting never refetches or
// recomputes the faculty's classification from a separate document population.
export function buildFacultyInsightSheets(summary, { query = {}, roleYear = 'all', comparisonYear = 'all', now = new Date() } = {}) {
  validateInsightSummary(summary);
  const exported = now.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false });
  const filters = Object.entries(query).filter(([key, value]) => key !== 'scope' && value !== '' && value != null)
    .map(([key, value]) => `${filterLabels[key] || key}: ${key === 'open_access_mode' && value === 'all' ? 'ทั้งหมด' : value}`);

  function sheet(name, title, width) {
    const grid = [[title]], rowStyles = { 1: 'title' }, mergedRows = [1];
    const add = (cells, kind, merge = false) => {
      grid.push(cells);
      if (kind) rowStyles[grid.length] = kind;
      if (merge) mergedRows.push(grid.length);
    };
    add(['เฉพาะ Scopus · ระดับคณะ · ไม่รวม ThaiJO/TCI · หนึ่งผลงานนับครั้งเดียว'], null, true);
    add([`ส่งออกเมื่อ ${exported} (เวลาไทย)`], null, true);
    add([`ตัวกรองที่กดใช้: ${filters.length ? filters.join(' · ') : 'ทั้งหมด'}`], null, true);
    add([], null);
    return {
      add,
      finish: () => ({ name, columns: Array.from({ length: width }, (_, i) => ({ key: `c${i}`, header: grid[0][i] || '', width: i === 0 ? 34 : 20 })),
        rows: grid.slice(1).map(cells => Object.fromEntries(cells.map((v, i) => [`c${i}`, v]))),
        layout: { rowStyles, mergedRows, freezeRows: 4 } }),
    };
  }
  const years = [...summary.by_year.map(y => ({ ...y, label: insightYearLabel(y) })), { ...summary.totals, label: 'รวมตามเงื่อนไขที่เลือก', isTotal: true }];
  const roles = sheet('1 บทบาทผู้เขียน', 'บทบาทผู้เขียนของคณะ', 10);
  roles.add(['จำนวนและร้อยละรายปี · ร้อยละคิดจากผลงานทั้งหมดในแต่ละแถว'], 'section', true);
  roles.add(['ปี (พ.ศ.)', 'ทั้งหมด', ...FACULTY_ROLES.flatMap(r => [`${r.label} (ผลงาน)`, `${r.label} (%)`])], 'header');
  years.forEach(y => roles.add([y.label, y.total, ...FACULTY_ROLES.flatMap(r => [y.roles[r.key], percent(y.role_percent[r.key])])], y.isTotal ? 'total' : null));
  roles.add([]);
  roles.add([`ข้อมูลกราฟบทบาท · ${period(summary, roleYear)}`], 'section', true);
  roles.add(['บทบาทผู้เขียน', 'จำนวนผลงาน', 'ร้อยละของผลงานในช่วงที่เลือก'], 'header');
  const selectedRoles = selection(summary, roleYear);
  FACULTY_ROLES.forEach(r => roles.add([r.label, selectedRoles.roles[r.key], percent(selectedRoles.role_percent[r.key])]));
  roles.add(['รวม', selectedRoles.total, percent(insightRatio(selectedRoles.total, selectedRoles.total))], 'total');

  const international = sheet('2 ความร่วมมือระหว่างประเทศ', 'ความร่วมมือระหว่างประเทศของคณะ', 8);
  international.add(['จำนวนและร้อยละรายปี · ร้อยละคิดจากผลงานทั้งหมดในแต่ละแถว'], 'section', true);
  international.add(['ปี (พ.ศ.)', 'ทั้งหมด', ...INTERNATIONAL_STATES.flatMap(s => [`${s.label} (ผลงาน)`, `${s.label} (%)`])], 'header');
  years.forEach(y => international.add([y.label, y.total, ...INTERNATIONAL_STATES.flatMap(s => [y.international[s.key], percent(y.international_percent[s.key])])], y.isTotal ? 'total' : null));
  international.add([]);
  international.add(['ประเทศที่ร่วมตีพิมพ์ · ทุกปีตามเงื่อนไขที่เลือก'], 'section', true);
  international.add([`ร้อยละคิดจากผลงานที่ร่วมกับต่างประเทศ ${summary.totals.international.yes} ผลงาน · หนึ่งผลงานอาจร่วมกับหลายประเทศ จึงไม่ควรรวมยอดประเทศ`], null, true);
  international.add(['ประเทศ', 'จำนวนผลงาน', 'ร้อยละของผลงานร่วมต่างประเทศ'], 'header');
  summary.totals.partners.forEach(p => international.add([p.country_name, p.documents, percent(p.percent_international)]));
  if (!summary.totals.partners.length) international.add(['ไม่พบประเทศคู่ความร่วมมือในช่วงที่เลือก'], null, true);

  const comparison = sheet('3 ประเทศและบทบาทคณะ', 'บทบาทคณะ: ต่างประเทศและภายในประเทศ', 10);
  const selectedComparison = selection(summary, comparisonYear);
  comparison.add([`ข้อมูลกราฟและตารางไขว้ · ${period(summary, comparisonYear)}`], 'section', true);
  comparison.add(['ร้อยละคิดจากผลงานทั้งหมดในแต่ละกลุ่มความร่วมมือ · แสดงกลุ่มที่ยังระบุประเทศไม่ได้แยกต่างหาก'], null, true);
  comparison.add(['ความร่วมมือ', ...FACULTY_ROLES.flatMap(r => [`${r.label} (ผลงาน)`, `${r.label} (%)`]), 'รวมผลงาน'], 'header');
  INTERNATIONAL_STATES.forEach(s => comparison.add([s.label, ...FACULTY_ROLES.flatMap(r => [selectedComparison.country_role[s.key][r.key], percent(insightRatio(selectedComparison.country_role[s.key][r.key], selectedComparison.international[s.key]))]), selectedComparison.international[s.key]]));
  comparison.add(['รวม', ...FACULTY_ROLES.flatMap(r => [selectedComparison.roles[r.key], percent(selectedComparison.role_percent[r.key])]), selectedComparison.total], 'total');
  return [roles.finish(), international.finish(), comparison.finish()];
}
