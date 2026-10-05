"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChevronDown, ChevronUp, Globe2, Users, ChartPie, RefreshCw, X, ExternalLink, Search } from 'lucide-react';
import SimpleCard from '../common/SimpleCard';
import Hint from './report/Hint';
import RoleDonut from './FacultyRoleDonut';
import styles from './FacultyInsights.module.css';
import { facultyInsightHints as hints } from '@/app/lib/scopus_faculty_insight_hints.mjs';
import adminAPI from '@/app/lib/admin_api';
import {
  FACULTY_ROLES, INTERNATIONAL_STATES, createFacultyInsightStore, insightFilterKey,
  insightNumber, insightPercent, insightRatio, insightYearLabel, safeInsightURL, insightDOIURL,
} from '@/app/lib/scopus_faculty_insights.mjs';

const liveAPI = {
  summary: (query, options) => adminAPI.getScopusFacultyInsights(query, options),
  drilldown: (query, options) => adminAPI.getScopusFacultyInsightsDrilldown(query, options),
};
const cell = 'border border-slate-200 px-1.5 py-1 text-right whitespace-nowrap';
const head = 'border border-blue-200 bg-blue-50 px-1.5 py-2 text-right font-semibold text-blue-900 whitespace-normal';
const action = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40';

function CountButton({ value, label, onClick }) {
  return <button type="button" onClick={onClick} aria-label={`ดูผลงาน ${label} ${insightNumber(value)} รายการ`} className="min-h-8 min-w-8 rounded px-1 font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">{insightNumber(value)}</button>;
}

function InsightCard({ title, icon, hint, children }) {
  const [collapsed, setCollapsed] = useState(false); const id = useId();
  return <SimpleCard title={title} icon={icon} noPadding headerClassName="!min-h-12 !px-3 !py-2 sm:!px-4" action={<div className="flex items-center gap-2 [&_button]:!min-h-8 [&_button]:!min-w-8"><Hint label={title} text={hint} /><button type="button" className="inline-flex items-center gap-1 rounded px-2 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" aria-expanded={!collapsed} aria-controls={id} onClick={() => setCollapsed(v => !v)}><span>{collapsed ? 'แสดง' : 'ซ่อน'}</span>{collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button></div>}>
    <div id={id} hidden={collapsed} className="p-3 sm:p-4">{children}</div>
  </SimpleCard>;
}

function ResourceState({ loading, error, retry }) {
  if (loading) return <p role="status" className="flex items-center gap-2 py-6 text-sm text-slate-500"><RefreshCw size={17} className="animate-spin" aria-hidden="true" />กำลังโหลดข้อมูล Scopus ตามตัวกรองที่ใช้...</p>;
  if (error) return <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{error}</p><button type="button" onClick={retry} className={`${action} mt-3`}>ลองใหม่</button></div>;
  return null;
}

function YearSelect({ years, selected, setSelected, id, roleOnly = false }) {
  return <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-1 text-sm text-slate-600"><label htmlFor={id}>{roleOnly ? 'ช่วงข้อมูลสำหรับกราฟบทบาท' : 'ช่วงข้อมูลสำหรับกราฟและตารางไขว้'}</label><Hint label={roleOnly ? 'ตัวเลือกปีกราฟบทบาท' : 'ตัวเลือกปีกราฟและตารางไขว้'} text={roleOnly ? hints.roleYear : hints.comparisonYear} /></div><select id={id} value={selected} onChange={e => setSelected(e.target.value)} className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="all">ทุกปีตามตัวกรอง</option>{years.map(y => <option key={y.bucket} value={y.bucket}>{insightYearLabel(y)}</option>)}</select></div>;
}

function InternationalCard({ summary, open }) {
  const rows = [...summary.by_year, { ...summary.totals, bucket: 'all', year_be: 'รวมตามตัวกรอง' }];
  const max = Math.max(1, ...summary.totals.partners.map(p => p.documents));
  return <div className="space-y-3">
    <p className="text-sm leading-5 text-slate-600">ผลงานไม่ซ้ำตามตัวกรองที่ใช้ · ร้อยละต่อผลงานทั้งหมดในแต่ละแถว <Hint label="ประเทศ จำนวน และร้อยละรายปี" text={hints.international} /></p>
    <div data-international-layout className={styles.internationalLayout}>
      <div className="overflow-x-auto rounded-lg" role="region" aria-label="ตารางความร่วมมือรายปี" tabIndex={0}><table className="w-full min-w-[500px] table-fixed border-collapse text-[13px]"><caption className="sr-only">ความร่วมมือระหว่างประเทศและร้อยละของผลงานทั้งหมด รายปีและยอดรวม</caption><colgroup><col className="w-[16%]"/><col className="w-[12%]"/>{INTERNATIONAL_STATES.map(state=><col key={state.key} className="w-[24%]"/>)}</colgroup>
        <thead><tr><th scope="col" className={`${head} text-left`}>ปี (พ.ศ.)</th><th scope="col" className={head}>ทั้งหมด</th>{INTERNATIONAL_STATES.map(state => <th key={state.key} scope="col" className={head}><abbr className="no-underline" title={state.label}>{state.key === 'yes' ? 'ต่างประเทศ' : state.key === 'no' ? 'ภายในประเทศ' : 'ยังระบุไม่ได้'}</abbr><span className="block text-xs font-normal">จำนวน / ร้อยละ</span></th>)}</tr></thead>
        <tbody>{rows.map(year => {
          const dims = year.bucket === 'all' ? {} : { year_be: year.bucket }, label = year.bucket === 'all' ? year.year_be : insightYearLabel(year);
          return <tr key={year.bucket} className={year.bucket === 'all' ? 'bg-blue-50 font-semibold' : 'odd:bg-slate-50/50'}><th scope="row" className={`${cell} text-left font-medium !whitespace-normal`}>{label}</th><td className={cell}><CountButton value={year.total} label={`ทั้งหมด ${label}`} onClick={() => open(dims, `ทั้งหมด · ${label}`)}/></td>{INTERNATIONAL_STATES.map(state=><td key={state.key} className={cell}><CountButton value={year.international[state.key]} label={`${state.label} ${label}`} onClick={() => open({ ...dims, international_status: state.key }, `${state.label} · ${label}`)}/><span className="ml-1 text-xs font-normal text-slate-600">{insightPercent(year.international_percent[state.key])}</span></td>)}</tr>;
        })}</tbody>
      </table></div>
      <div data-partner-countries className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/50 p-3"><h3 className="mb-1 text-sm font-semibold text-slate-800">ประเทศที่ร่วมตีพิมพ์ <Hint label="ประเทศคู่ความร่วมมือ" text={hints.partners}/></h3><p className="mb-2 text-xs leading-5 text-slate-600">ฐาน {insightNumber(summary.totals.international.yes)} ผลงานต่างประเทศ · หนึ่งผลงานอยู่ได้หลายประเทศ</p>
        {summary.totals.partners.length === 0 ? <p className="py-3 text-sm text-slate-500">ไม่พบประเทศคู่ความร่วมมือในช่วงที่เลือก</p> : <ul className="max-h-[280px] space-y-1 overflow-y-auto">{summary.totals.partners.map(partner=><li key={partner.country_key}><button type="button" className="grid min-h-11 w-full grid-cols-[minmax(65px,1fr)_minmax(50px,1.5fr)_60px] items-center gap-2 rounded-lg px-1.5 py-1 text-left text-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => open({ country_key: partner.country_key, international_status: 'yes' }, `ร่วมกับต่างประเทศ · ${partner.country_name}`)} aria-label={`ดู ${partner.country_name} ${partner.documents} ผลงาน`}><span className="break-words font-medium text-slate-700">{partner.country_name}</span><span className="h-3 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><span className="block h-full rounded-full bg-[#245b78]" style={{ width: `${partner.documents / max * 100}%` }}/></span><span className="text-right tabular-nums"><b className="text-slate-800">{insightNumber(partner.documents)}</b><span className="block text-xs text-slate-600">{insightPercent(partner.percent_international)}</span></span></button></li>)}</ul>}
      </div>
    </div>
  </div>;
}

function RolesCard({ summary, open }) {
  const [selected, setSelected] = useState('all'); const id = useId();
  const aggregate = selected === 'all' ? summary.totals : summary.by_year.find(y => y.bucket === selected) || summary.totals;
  const dims = selected === 'all' || !summary.by_year.some(y => y.bucket === selected) ? {} : { year_be: selected };
  return <div className="space-y-3"><p className="text-sm leading-6 text-slate-600">หนึ่งผลงานต่อหนึ่งบทบาท: First → Corresponding → Co-author หรือยังระบุไม่ได้ <Hint label="การจัดกลุ่มบทบาทคณะ" text={hints.roles} /></p>
    <YearSelect roleOnly id={id} years={summary.by_year} selected={selected} setSelected={setSelected} />
    <div data-role-layout className={styles.roleLayout}><div className="overflow-x-auto rounded-lg" role="region" aria-label="ตารางบทบาทผู้เขียนรายปี" tabIndex={0}><table className="w-full min-w-[520px] table-fixed border-collapse text-[13px]"><caption className="sr-only">บทบาทผู้เขียนของคณะตามปีที่ตีพิมพ์</caption><thead><tr><th scope="col" className={`${head} text-left`}>ปี (พ.ศ.)</th><th scope="col" className={head}>ทั้งหมด</th>{FACULTY_ROLES.map(r => <th key={r.key} scope="col" className={head}><abbr className="no-underline" title={r.label}>{r.key === 'corresponding' ? 'Corr.' : r.shortLabel}</abbr></th>)}</tr></thead><tbody>{[...summary.by_year, { ...summary.totals, bucket: 'all' }].map(y => {
      const yearDims = y.bucket === 'all' ? {} : { year_be: y.bucket }, label = y.bucket === 'all' ? 'รวมตามตัวกรอง' : insightYearLabel(y);
      return <tr key={y.bucket} className={y.bucket === 'all' ? 'bg-blue-50 font-semibold' : 'odd:bg-slate-50/50'}><th scope="row" className={`${cell} text-left font-medium !whitespace-normal`}>{label}</th><td className={cell}><CountButton value={y.total} label={label} onClick={() => open(yearDims, `ทุกบทบาท · ${label}`)} /></td>{FACULTY_ROLES.map(r => <td key={r.key} className={cell}><CountButton value={y.roles[r.key]} label={`${r.label} ${label}`} onClick={() => open({ ...yearDims, faculty_role: r.key }, `${r.label} · ${label}`)} /><span className="block text-xs font-normal text-slate-500">{insightPercent(y.role_percent[r.key])}</span></td>)}</tr>;
    })}</tbody></table></div><div><RoleDonut title={Object.keys(dims).length ? `ปี ${selected === 'undated' ? 'ไม่ระบุ' : selected}` : 'บทบาทคณะตามตัวกรอง'} total={aggregate.total} roles={aggregate.roles} onSelect={r => open({ ...dims, faculty_role: r.key }, `${r.label} · ${selected === 'all' ? 'ทุกปีตามตัวกรอง' : selected}`)} /></div></div>
  </div>;
}

function ComparisonCard({ summary, open }) {
  const [selected, setSelected] = useState('all'); const id = useId();
  const year = summary.by_year.find(y => y.bucket === selected), aggregate = year || summary.totals, dims = year ? { year_be: year.bucket } : {};
  return <div className="space-y-3"><YearSelect id={id} years={summary.by_year} selected={selected} setSelected={setSelected} /><p className="text-sm leading-6 text-slate-600">แต่ละกราฟใช้ฐานผลงานของกลุ่มตนเอง · กลุ่มยังระบุประเทศไม่ได้แสดงแยกในตาราง <Hint label="ฐานเปรียบเทียบต่างประเทศและภายในประเทศ" text={hints.donut} /></p>
    <div className="grid gap-3 xl:grid-cols-2">{INTERNATIONAL_STATES.slice(0, 2).map(s => <RoleDonut key={s.key} title={s.label} roles={aggregate.country_role[s.key]} total={aggregate.international[s.key]} onSelect={r => open({ ...dims, international_status: s.key, faculty_role: r.key }, `${s.label} · ${r.label}${year ? ` · ${insightYearLabel(year)}` : ''}`)} />)}</div>
    <div className="overflow-x-auto rounded-lg" role="region" aria-label="ตารางไขว้ประเทศและบทบาท" tabIndex={0}><table className="w-full min-w-[520px] table-fixed border-collapse text-[13px]"><caption className="mb-2 text-left font-semibold text-slate-800">ประเทศ × บทบาทคณะ{year ? ` · ${insightYearLabel(year)}` : ' · รวมตามตัวกรอง'} <Hint label="ตารางไขว้ประเทศและบทบาท" text={hints.cross} /></caption><thead><tr><th scope="col" className={`${head} text-left`}>ความร่วมมือ</th>{FACULTY_ROLES.map(r => <th key={r.key} scope="col" className={head}><abbr className="no-underline" title={r.label}>{r.key === 'corresponding' ? 'Corr.' : r.shortLabel}</abbr></th>)}<th scope="col" className={head}>รวม</th></tr></thead><tbody>{INTERNATIONAL_STATES.map(s => <tr key={s.key} className="odd:bg-slate-50/50"><th scope="row" className={`${cell} text-left font-medium !whitespace-normal`}>{s.label}</th>{FACULTY_ROLES.map(r => <td key={r.key} className={cell}><CountButton value={aggregate.country_role[s.key][r.key]} label={`${s.label} ${r.label}`} onClick={() => open({ ...dims, international_status: s.key, faculty_role: r.key }, `${s.label} · ${r.label}${year ? ` · ${insightYearLabel(year)}` : ''}`)} /></td>)}<td className={cell}><CountButton value={aggregate.international[s.key]} label={s.label} onClick={() => open({ ...dims, international_status: s.key }, `${s.label}${year ? ` · ${insightYearLabel(year)}` : ''}`)} /></td></tr>)}</tbody></table></div>
  </div>;
}

function DocumentEvidence({ document: d }) {
  const role = FACULTY_ROLES.find(r => r.key === d.faculty_role);
  const link = safeInsightURL(d.scopus_link), doi = insightDOIURL(d.doi);
  const currentRoles = ['complete', 'no_correspondence'].includes(d.author_role_status);
  const flag = value => !currentRoles || value == null ? 'ยังไม่ทราบ' : value ? 'ใช่' : 'ไม่ใช่';
  const metadata = [
    ['EID', d.eid || 'ไม่ระบุ'], ['Scopus ID', d.scopus_id || 'ไม่ระบุ'], ['DOI', d.doi || 'ไม่ระบุ'],
    ['วารสาร / แหล่งตีพิมพ์', d.publication_name || 'ไม่ระบุ'], ['ประเภท', d.aggregation_type || 'ไม่ระบุ'], ['Citation', insightNumber(d.citations || 0)],
    ['ประเทศที่ยืนยันได้', d.country_evidence_current && d.countries?.length ? d.countries.map(c => c.country_name).join(', ') : 'ยังไม่สามารถยืนยันข้อมูลประเทศปัจจุบันได้'],
    ['บทบาทผลงานของคณะ', role?.label || 'ยังระบุบทบาทไม่ได้'], ['สถานะตรวจบทบาท', d.author_role_status || 'ยังไม่ตรวจ'],
  ];
  return <div className="sticky left-0 w-[calc(100vw-1rem)] space-y-4 px-4 py-4 sm:px-5 md:static md:w-full">
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">{metadata.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-0.5 break-words text-sm text-slate-900">{value}</dd></div>)}</dl>
    {(link || doi) && <div className="flex flex-wrap gap-4 text-sm font-medium text-blue-700">{link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">เปิดใน Scopus <ExternalLink size={14} /></a>}{doi && <a href={doi} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">เปิด DOI <ExternalLink size={14} /></a>}</div>}
    <div><h3 className="mb-2 text-sm font-semibold text-slate-900">ผู้เขียนคณะที่เข้าเกณฑ์ ({insightNumber(d.eligible_authors?.length || 0)} ลิงก์) <Hint label="บทบาทและหลักฐานผู้เขียน" text={hints.roles} /></h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-100 text-xs text-slate-700"><tr>{['ผู้เขียน / ลำดับ', 'First', 'Corresponding', 'Scopus Author ID'].map(label => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead><tbody>{(d.eligible_authors || []).map(a => <tr key={a.link_id} className="border-t border-slate-200 align-top"><td className="px-3 py-2"><span className="mr-2 text-slate-500">{a.author_seq || '—'}.</span>{a.full_name || a.scopus_author_id || 'ไม่ระบุชื่อผู้เขียน'}</td><td className="px-3 py-2">{flag(a.is_first_author)}</td><td className="px-3 py-2">{flag(a.is_corresponding_author)}</td><td className="break-words px-3 py-2 text-xs text-slate-600">{a.scopus_author_id || 'ไม่ระบุ'}</td></tr>)}</tbody></table></div>
      <p className="mt-2 text-xs text-slate-500">ลิงก์ผู้เขียนอาจมีหลายสังกัด แต่จำนวนผลงานและบทบาทของคณะนับผลงานไม่ซ้ำ</p>
    </div>
  </div>;
}

const searchField = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400';
function InsightDrilldown({ store, drilldown: d, close }) {
  const [draft, setDraft] = useState(d.search || ''), [expanded, setExpanded] = useState(null);
  const scrollRef = useRef(null), id = useId();
  useEffect(() => { setDraft(d.search || ''); }, [d.search]);
  useEffect(() => { setExpanded(null); scrollRef.current?.scrollTo(0, 0); }, [d.page, d.pageSize, d.search, d.response?.revision]);
  const data = d.response, pages = data?.total_pages || 0;
  const searchDisabled = !store.getSnapshot().summary;
  const clear = () => { setDraft(''); store.search(''); };
  return <Dialog open onClose={close} className="fixed inset-0 z-[130]">
    <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4"><DialogPanel className="flex max-h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5"><div className="min-w-0"><DialogTitle className="text-base font-semibold text-slate-900">รายการผลงาน — {d.label}</DialogTitle><p className="mt-1 text-xs text-slate-600">เฉพาะ Scopus · ตัวกรองเดียวกับสรุป · ผลงานไม่ซ้ำ</p></div><button type="button" autoFocus aria-label="ปิดรายการผลงาน" onClick={close} className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-blue-400"><X size={20} /></button></header>
      <form onSubmit={e => { e.preventDefault(); store.search(draft); }} className="grid shrink-0 grid-cols-1 items-end gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0"><div className="flex items-center gap-1 text-xs font-medium text-slate-700"><label htmlFor={`${id}-search`}>ค้นหาผลงานภายในกลุ่มทั้งหมด</label><Hint label="ค้นหาผลงานภายในกลุ่มทั้งหมด" text={hints.search} /></div><div className="relative mt-1"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-slate-500" /><input id={`${id}-search`} type="search" value={draft} maxLength={200} onChange={e => setDraft(e.target.value)} placeholder="ชื่อผลงาน DOI EID Scopus ID วารสาร หรือผู้เขียนคณะ" aria-describedby={`${id}-search-fields`} className={`${searchField} pl-9`} /></div><p id={`${id}-search-fields`} className="mt-1 text-xs text-slate-500">ชื่อผลงาน · DOI · EID · Scopus ID · วารสาร · ชื่อผู้เขียนคณะที่เข้าเกณฑ์</p></div>
        <div className="flex gap-2 md:pb-5"><button type="submit" disabled={searchDisabled} className="inline-flex items-center gap-1.5 disabled:opacity-50 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400"><Search size={15} aria-hidden="true" />ค้นหา</button><button type="button" disabled={searchDisabled || (!draft && !d.search)} onClick={clear} className={action}>ล้าง</button></div>
      </form>
      <div className="shrink-0 border-b border-slate-200 px-4 py-2 text-xs text-slate-600 sm:px-5" role="status">{data ? <>กลุ่มที่เลือก <b>{insightNumber(data.scope_total ?? data.total)}</b> ผลงาน · พบทั้งหมด <b>{insightNumber(data.total)}</b> ผลงาน{d.search ? <>ที่ตรงคำค้น “{d.search}”</> : null}</> : d.loading ? 'กำลังโหลดรายการในกลุ่มที่เลือก…' : 'รายการยังไม่พร้อมใช้งาน'}</div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto" aria-busy={d.loading}>
        {d.notice && <p role="status" className="m-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{d.notice}</p>}
        {(d.loading || d.error) && <div className="px-5"><ResourceState loading={d.loading} error={d.error} retry={() => store.refresh({ dimensions: d.dimensions, label: d.label, pageSize: d.pageSize, search: d.search })} /></div>}
        {data && data.documents.length === 0 && <div className="px-5 py-12 text-center"><p className="text-sm text-slate-700">ไม่พบผลงานสำหรับรายการที่เลือก</p>{d.search && <button type="button" onClick={clear} className="mt-3 text-sm font-medium text-blue-700 hover:underline">ล้างคำค้นในรายการ</button>}</div>}
        {data && data.documents.length > 0 && <table className="w-full min-w-[760px] table-fixed text-left text-sm"><caption className="sr-only">ผลงาน Scopus ในกลุ่มที่เลือกและคำค้น</caption><colgroup><col className="w-[43%]" /><col className="w-[7%]" /><col className="w-[21%]" /><col className="w-[17%]" /><col className="w-[12%]" /></colgroup><thead className="sticky top-0 z-10 bg-blue-100 text-blue-900"><tr>{['ชื่อผลงาน', 'ปี พ.ศ.', 'ความร่วมมือ / ประเทศ', 'บทบาทคณะ', 'รายละเอียด'].map(label => <th key={label} scope="col" className="border-b border-blue-200 px-3 py-2.5 font-medium first:pl-5">{label}</th>)}</tr></thead><tbody>{data.documents.map((doc, index) => {
          const open = expanded === doc.document_id, panelID = `${id}-document-${index}`;
          return <Fragment key={doc.document_id}><tr data-document-row className={`border-b border-slate-200 align-top ${open ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}><td className="break-words py-3 pl-5 pr-3 font-medium leading-5 text-slate-900">{doc.title || doc.eid || 'ไม่ระบุชื่อผลงาน'}<span className="mt-1 block text-xs font-normal text-slate-500">{doc.eid}</span></td><td className="px-3 py-3 tabular-nums text-slate-600">{doc.year_be || 'ไม่ระบุ'}</td><td className="break-words px-3 py-3 text-xs leading-5 text-slate-600">{INTERNATIONAL_STATES.find(s => s.key === doc.international_status)?.label}<span className="block text-slate-500">{doc.country_evidence_current && doc.countries?.length ? doc.countries.map(c => c.country_name).join(', ') : 'ยังไม่สามารถยืนยันข้อมูลประเทศปัจจุบันได้'}</span></td><td className="px-3 py-3 text-xs leading-5 text-slate-700">{FACULTY_ROLES.find(r => r.key === doc.faculty_role)?.label}</td><td className="px-2 py-2"><button type="button" aria-label={`รายละเอียด ${doc.title || doc.eid}`} aria-expanded={open} aria-controls={open ? panelID : undefined} onClick={() => setExpanded(open ? null : doc.document_id)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-1 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400">รายละเอียด{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></td></tr>{open && <tr id={panelID} className="border-b border-slate-300 bg-slate-50"><td colSpan={5}><DocumentEvidence document={doc} /></td></tr>}</Fragment>;
        })}</tbody></table>}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-3"><p role="status" className="text-xs text-slate-600">{data ? `แสดง ${data.total && data.documents.length ? insightNumber((d.page - 1) * d.pageSize + 1) : '0'}–${insightNumber(Math.min(d.page * d.pageSize, data.total))} จาก ${insightNumber(data.total)} ผลงาน` : 'กำลังโหลด…'}</p><label className="flex items-center gap-2 text-xs text-slate-600">ต่อหน้า<select aria-label="จำนวนผลงานต่อหน้า" value={d.pageSize} disabled={d.loading || !data} onChange={e => store.page(1, Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-blue-400">{[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}</select></label></div>
        <div className="flex items-center gap-2"><button type="button" className={action} disabled={d.loading || !data || d.page <= 1} onClick={() => store.page(d.page - 1)}>ก่อนหน้า</button>{pages ? <select aria-label="เลือกรายการหน้า" value={d.page} disabled={d.loading} onChange={e => store.page(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:ring-2 focus:ring-blue-400">{Array.from({ length: pages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} / {pages}</option>)}</select> : <span className="text-xs text-slate-500">{data ? 'ไม่มีหน้า' : 'หน้า —'}</span>}<button type="button" className={action} disabled={d.loading || !data || d.page >= pages} onClick={() => store.page(d.page + 1)}>ถัดไป</button></div>
      </footer>
    </DialogPanel></div>
  </Dialog>;
}

export default function AdminScopusFacultyInsights({ appliedQuery = {}, enabled = true, refreshToken, api = liveAPI }) {
  const store = useMemo(() => createFacultyInsightStore(api), [api]);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const key = insightFilterKey(appliedQuery);
  const query = useMemo(() => Object.fromEntries(JSON.parse(key)), [key]);
  const triggerRef = useRef(null), refreshRef = useRef(null), rootRef = useRef(null);
  useEffect(() => { if (enabled) store.setFilters(query); else store.close(); }, [store, query, enabled, refreshToken]);
  useEffect(() => () => store.dispose(), [store]);
  const current = enabled && state.filterKey === key, summary = current ? state.summary : null;
  const loading = !current || state.loading, error = current ? state.error : null;
  const open = (dimensions, label) => { triggerRef.current = document.activeElement; return store.open(dimensions, label); };
  const close = () => {
    store.close();
    requestAnimationFrame(() => {
      const target = triggerRef.current?.isConnected ? triggerRef.current : refreshRef.current?.disabled ? rootRef.current : refreshRef.current;
      target?.focus({ preventScroll: true });
    });
  };
  return <div ref={rootRef} tabIndex={-1} className="space-y-4" style={{ containerType: 'inline-size', containerName: 'faculty-insights' }} aria-label="ข้อมูลความร่วมมือและบทบาทผู้เขียนของคณะ">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>เฉพาะ Scopus · ตามตัวกรองที่ใช้ · ไม่รวม ThaiJO/TCI <Hint label="ขอบเขตข้อมูลคณะและตัวกรอง" text={hints.scope} /></span><button ref={refreshRef} type="button" className="inline-flex min-h-9 items-center gap-1 rounded px-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40" disabled={loading} onClick={() => store.refresh()}><RefreshCw size={13} />อัปเดตข้อมูลทั้ง 3 ส่วน</button></div>
    <InsightCard title="บทบาทผู้เขียนของคณะ" icon={Users} hint={hints.roles}>{summary ? <RolesCard key={summary.revision} summary={summary} open={open} /> : <ResourceState loading={loading} error={error} retry={() => store.refresh()} />}</InsightCard>
    <InsightCard title="ความร่วมมือระหว่างประเทศของคณะ" icon={Globe2} hint={hints.international}>{summary ? <InternationalCard summary={summary} open={open} /> : <ResourceState loading={loading} error={error} retry={() => store.refresh()} />}</InsightCard>
    <InsightCard title="บทบาทคณะ: ต่างประเทศและภายในประเทศ" icon={ChartPie} hint={hints.cross}>{summary ? <ComparisonCard key={summary.revision} summary={summary} open={open} /> : <ResourceState loading={loading} error={error} retry={() => store.refresh()} />}</InsightCard>
    {current && state.drilldown && <InsightDrilldown store={store} drilldown={state.drilldown} close={close} />}
  </div>;
}
