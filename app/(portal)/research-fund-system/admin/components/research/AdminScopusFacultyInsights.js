"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { ChevronDown, ChevronUp, Globe2, Users, ChartPie, RefreshCw, X, ExternalLink } from 'lucide-react';
import SimpleCard from '../common/SimpleCard';
import adminAPI from '@/app/lib/admin_api';
import {
  FACULTY_ROLES, INTERNATIONAL_STATES, createFacultyInsightStore, insightFilterKey,
  insightNumber, insightPercent, insightRatio, insightYearLabel, safeInsightURL, insightDOIURL,
} from '@/app/lib/scopus_faculty_insights.mjs';

const liveAPI = {
  summary: (query, options) => adminAPI.getScopusFacultyInsights(query, options),
  drilldown: (query, options) => adminAPI.getScopusFacultyInsightsDrilldown(query, options),
};
const cell = 'border border-slate-200 px-3 py-2.5 text-right whitespace-nowrap';
const head = 'border border-blue-200 bg-blue-50 px-3 py-3 text-right font-semibold text-blue-900 whitespace-nowrap';
const action = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40';

function CountButton({ value, label, onClick }) {
  return <button type="button" onClick={onClick} aria-label={`ดูผลงาน ${label} ${insightNumber(value)} รายการ`} className="min-h-9 min-w-9 rounded px-1 font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">{insightNumber(value)}</button>;
}

function InsightCard({ title, icon, children }) {
  const [collapsed, setCollapsed] = useState(false); const id = useId();
  return <SimpleCard title={title} icon={icon} action={<button type="button" className="inline-flex items-center gap-1 rounded px-2 text-xs font-medium text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" aria-expanded={!collapsed} aria-controls={id} onClick={() => setCollapsed(v => !v)}><span>{collapsed ? 'แสดง' : 'ซ่อน'}</span>{collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>}>
    <div id={id} hidden={collapsed}>{children}</div>
  </SimpleCard>;
}

function ResourceState({ loading, error, retry }) {
  if (loading) return <p role="status" className="flex items-center gap-2 py-6 text-sm text-slate-500"><RefreshCw size={17} className="animate-spin" aria-hidden="true" />กำลังโหลดข้อมูล Scopus ตามตัวกรองที่ใช้...</p>;
  if (error) return <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p>{error}</p><button type="button" onClick={retry} className={`${action} mt-3`}>ลองใหม่</button></div>;
  return null;
}

function RoleDonut({ title, roles, total, onSelect }) {
  const radius = 70, circumference = 2 * Math.PI * radius; let offset = 0;
  return <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
    <h3 className="text-center font-semibold text-slate-800">{title}</h3>
    <svg viewBox="0 0 220 210" className="mx-auto h-52 w-full max-w-[260px]" role="group" aria-label={`สัดส่วนบทบาท ${title} รวม ${insightNumber(total)} ผลงาน`}>
      <circle cx="110" cy="102" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="25" />
      {FACULTY_ROLES.map(role => {
        const n = roles[role.key], length = total ? n / total * circumference : 0, start = offset; offset += length;
        if (!n) return null;
        return <circle key={role.key} cx="110" cy="102" r={radius} fill="none" stroke={role.color} strokeWidth="25" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-start} transform="rotate(-90 110 102)" role="button" tabIndex={0} aria-label={`${title} ${role.label} ${insightNumber(n)} ผลงาน ${insightPercent(insightRatio(n, total))}`} onClick={() => onSelect(role)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(role); } }} className="cursor-pointer hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-800" />;
      })}
      <text x="110" y="101" textAnchor="middle" fontSize="27" fontWeight="700" fill="#0f172a">{insightNumber(total)}</text>
      <text x="110" y="125" textAnchor="middle" fontSize="12" fill="#64748b">ผลงานไม่ซ้ำ</text>
    </svg>
    <p className="mb-2 text-center text-xs text-slate-500">ฐานคำนวณ: {insightNumber(total)} ผลงานในกลุ่มนี้</p>
    <ul className="space-y-1">
      {FACULTY_ROLES.map(role => <li key={role.key}><button type="button" onClick={() => onSelect(role)} className="flex min-h-10 w-full items-center gap-2 rounded px-2 text-left text-sm hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: role.color }} aria-hidden="true" /><span className="flex-1">{role.label}</span><span className="font-semibold tabular-nums">{insightNumber(roles[role.key])}</span><span className="w-16 text-right text-xs tabular-nums text-slate-500">{insightPercent(insightRatio(roles[role.key], total))}</span></button></li>)}
    </ul>
    {total === 0 && <p className="mt-2 text-center text-xs text-slate-500">ไม่พบผลงานในกลุ่มนี้</p>}
  </div>;
}

function YearSelect({ years, selected, setSelected, id }) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><label htmlFor={id} className="text-sm text-slate-600">ช่วงข้อมูลสำหรับกราฟและตารางไขว้</label><select id={id} value={selected} onChange={e => setSelected(e.target.value)} className="max-w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="all">ทุกปีตามตัวกรอง</option>{years.map(y => <option key={y.bucket} value={y.bucket}>{insightYearLabel(y)}</option>)}</select></div>;
}

function InternationalCard({ summary, open }) {
  const rows = [...summary.by_year, { ...summary.totals, bucket: 'all', year_be: 'รวมตามตัวกรอง' }];
  const max = Math.max(1, ...summary.totals.partners.map(p => p.documents));
  return <div className="space-y-5">
    <p className="text-sm leading-6 text-slate-600">นับผลงาน Scopus ไม่ซ้ำตามตัวกรองที่ใช้ ร้อยละใช้ผลงานทั้งหมดในแถวนั้นเป็นฐาน รวมกลุ่มที่ยังระบุประเทศไม่ได้</p>
    <div className="overflow-x-auto rounded-lg" role="region" aria-label="ตารางความร่วมมือรายปี" tabIndex={0}><table className="min-w-full border-collapse text-sm"><caption className="sr-only">ความร่วมมือระหว่างประเทศและร้อยละของผลงานทั้งหมด รายปีและยอดรวม</caption><thead><tr><th scope="col" className={`${head} text-left`}>ปีที่ตีพิมพ์ (พ.ศ.)</th><th scope="col" className={head}>ทั้งหมด</th>{INTERNATIONAL_STATES.map(s => <th key={s.key} scope="col" className={head}>{s.label}<span className="block text-xs font-normal">จำนวน / ร้อยละ</span></th>)}</tr></thead><tbody>{rows.map(y => {
      const dims = y.bucket === 'all' ? {} : { year_be: y.bucket }; const label = y.bucket === 'all' ? y.year_be : insightYearLabel(y);
      return <tr key={y.bucket} className={y.bucket === 'all' ? 'bg-blue-50 font-semibold' : 'odd:bg-slate-50/50'}><th scope="row" className={`${cell} text-left font-medium`}>{label}</th><td className={cell}><CountButton value={y.total} label={`ทั้งหมด ${label}`} onClick={() => open(dims, `ทั้งหมด · ${label}`)} /></td>{INTERNATIONAL_STATES.map(s => <td key={s.key} className={cell}><CountButton value={y.international[s.key]} label={`${s.label} ${label}`} onClick={() => open({ ...dims, international_status: s.key }, `${s.label} · ${label}`)} /><span className="ml-2 text-xs text-slate-500">{insightPercent(y.international_percent[s.key])}</span></td>)}</tr>;
    })}</tbody></table></div>
    <div><h3 className="mb-1 font-semibold text-slate-800">ประเทศที่ร่วมตีพิมพ์</h3><p className="mb-4 text-xs leading-5 text-slate-500">เฉพาะผลงานร่วมกับต่างประเทศ ({insightNumber(summary.totals.international.yes)} ผลงาน) หนึ่งผลงานอาจนับในหลายประเทศ จึงไม่ควรรวมแท่งเป็นยอดผลงานทั้งหมด</p>
      {summary.totals.partners.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">ไม่พบประเทศคู่ความร่วมมือในช่วงที่เลือก</p> : <ul className="max-h-[430px] space-y-2 overflow-y-auto pr-1">{summary.totals.partners.map(p => <li key={p.country_key}><button type="button" className="grid min-h-12 w-full grid-cols-[minmax(0,1fr)_minmax(60px,2fr)_70px] items-center gap-3 rounded-lg p-2 text-left text-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => open({ country_key: p.country_key, international_status: 'yes' }, `ร่วมกับต่างประเทศ · ${p.country_name}`)} aria-label={`ดู ${p.country_name} ${p.documents} ผลงาน`}><span className="break-words font-medium text-slate-700">{p.country_name}</span><span className="h-5 overflow-hidden rounded bg-blue-50" aria-hidden="true"><span className="block h-full rounded bg-blue-600" style={{ width: `${p.documents / max * 100}%` }} /></span><span className="text-right"><b className="text-blue-700">{insightNumber(p.documents)}</b><span className="block text-xs text-slate-500">{insightPercent(p.percent_international)}</span></span></button></li>)}</ul>}
    </div>
    <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">การมีทั้งสังกัดคณะและสังกัดต่างประเทศในผลงานเดียวกันถือเป็นความร่วมมือเมื่อยืนยันประเทศต่างประเทศได้ แม้เป็นผู้เขียนคนเดียวกันหรือข้อมูลบางส่วนยังไม่ครบ หากข้อมูลไม่ครบและยังยืนยันต่างประเทศไม่ได้ จะแยกเป็น “ยังระบุประเทศไม่ได้”</p>
  </div>;
}

function RolesCard({ summary, open }) {
  const [selected, setSelected] = useState('all'); const id = useId();
  const aggregate = selected === 'all' ? summary.totals : summary.by_year.find(y => y.bucket === selected) || summary.totals;
  const dims = selected === 'all' || !summary.by_year.some(y => y.bucket === selected) ? {} : { year_be: selected };
  return <div className="space-y-5"><p className="text-sm leading-6 text-slate-600">นับบทบาทผู้เขียนที่เชื่อมกับบุคลากรคณะและสังกัดที่เข้าเกณฑ์ หนึ่งผลงานอยู่ในกลุ่มเดียว: หากมี First author ของคณะที่ยืนยันได้จะนับเป็น First; Corresponding นับเฉพาะผลงานที่ไม่มี First ของคณะ ส่วนที่เหลือจึงนับเป็น Co-author ลำดับนี้ใช้ป้องกันการนับซ้ำ ไม่ใช่การจัดอันดับความสำคัญ หากข้อมูลบทบาทไม่พอจะอยู่ในกลุ่มยังไม่ทราบ</p>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="overflow-x-auto rounded-lg" role="region" aria-label="ตารางบทบาทผู้เขียนรายปี" tabIndex={0}><table className="min-w-full border-collapse text-sm"><caption className="sr-only">บทบาทผู้เขียนของคณะตามปีที่ตีพิมพ์</caption><thead><tr><th scope="col" className={`${head} text-left`}>ปี (พ.ศ.)</th><th scope="col" className={head}>ทั้งหมด</th>{FACULTY_ROLES.map(r => <th key={r.key} scope="col" className={head}>{r.label}</th>)}</tr></thead><tbody>{[...summary.by_year, { ...summary.totals, bucket: 'all' }].map(y => {
      const yearDims = y.bucket === 'all' ? {} : { year_be: y.bucket }, label = y.bucket === 'all' ? 'รวมตามตัวกรอง' : insightYearLabel(y);
      return <tr key={y.bucket} className={y.bucket === 'all' ? 'bg-blue-50 font-semibold' : 'odd:bg-slate-50/50'}><th scope="row" className={`${cell} text-left font-medium`}>{label}</th><td className={cell}><CountButton value={y.total} label={label} onClick={() => open(yearDims, `ทุกบทบาท · ${label}`)} /></td>{FACULTY_ROLES.map(r => <td key={r.key} className={cell}><CountButton value={y.roles[r.key]} label={`${r.label} ${label}`} onClick={() => open({ ...yearDims, faculty_role: r.key }, `${r.label} · ${label}`)} /><span className="block text-xs font-normal text-slate-500">{insightPercent(y.role_percent[r.key])}</span></td>)}</tr>;
    })}</tbody></table></div><div className="space-y-3"><YearSelect id={id} years={summary.by_year} selected={selected} setSelected={setSelected} /><RoleDonut title={Object.keys(dims).length ? `ปี ${selected === 'undated' ? 'ไม่ระบุ' : selected}` : 'บทบาทคณะตามตัวกรอง'} total={aggregate.total} roles={aggregate.roles} onSelect={r => open({ ...dims, faculty_role: r.key }, `${r.label} · ${selected === 'all' ? 'ทุกปีตามตัวกรอง' : selected}`)} /></div></div>
  </div>;
}

function ComparisonCard({ summary, open }) {
  const [selected, setSelected] = useState('all'); const id = useId();
  const year = summary.by_year.find(y => y.bucket === selected), aggregate = year || summary.totals, dims = year ? { year_be: year.bucket } : {};
  return <div className="space-y-5"><YearSelect id={id} years={summary.by_year} selected={selected} setSelected={setSelected} /><p className="text-sm leading-6 text-slate-600">สีและลำดับบทบาทเหมือนกันทุกกราฟ แต่ละกราฟใช้จำนวนผลงานในกลุ่มของตัวเองเป็นฐาน กลุ่มที่ยังระบุประเทศไม่ได้แสดงแยกในตารางด้านล่าง</p>
    <div className="grid gap-4 md:grid-cols-2">{INTERNATIONAL_STATES.slice(0, 2).map(s => <RoleDonut key={s.key} title={s.label} roles={aggregate.country_role[s.key]} total={aggregate.international[s.key]} onSelect={r => open({ ...dims, international_status: s.key, faculty_role: r.key }, `${s.label} · ${r.label}${year ? ` · ${insightYearLabel(year)}` : ''}`)} />)}</div>
    <div className="overflow-x-auto rounded-lg" role="region" aria-label="ตารางไขว้ประเทศและบทบาท" tabIndex={0}><table className="min-w-full border-collapse text-sm"><caption className="mb-2 text-left font-semibold text-slate-800">ประเทศ × บทบาทคณะ{year ? ` · ${insightYearLabel(year)}` : ' · รวมตามตัวกรอง'}</caption><thead><tr><th scope="col" className={`${head} text-left`}>ความร่วมมือ</th>{FACULTY_ROLES.map(r => <th key={r.key} scope="col" className={head}>{r.label}</th>)}<th scope="col" className={head}>รวม</th></tr></thead><tbody>{INTERNATIONAL_STATES.map(s => <tr key={s.key} className="odd:bg-slate-50/50"><th scope="row" className={`${cell} text-left font-medium`}>{s.label}</th>{FACULTY_ROLES.map(r => <td key={r.key} className={cell}><CountButton value={aggregate.country_role[s.key][r.key]} label={`${s.label} ${r.label}`} onClick={() => open({ ...dims, international_status: s.key, faculty_role: r.key }, `${s.label} · ${r.label}${year ? ` · ${insightYearLabel(year)}` : ''}`)} /></td>)}<td className={cell}><CountButton value={aggregate.international[s.key]} label={s.label} onClick={() => open({ ...dims, international_status: s.key }, `${s.label}${year ? ` · ${insightYearLabel(year)}` : ''}`)} /></td></tr>)}</tbody></table></div>
  </div>;
}

function DocumentEvidence({ document: d }) {
  const role = FACULTY_ROLES.find(r => r.key === d.faculty_role), country = INTERNATIONAL_STATES.find(s => s.key === d.international_status);
  const link = safeInsightURL(d.scopus_link), doi = insightDOIURL(d.doi);
  const currentRoles = ['complete', 'no_correspondence'].includes(d.author_role_status);
  return <article className="rounded-lg border border-slate-200 bg-white p-4">
    <h4 className="break-words font-semibold text-slate-900">{d.title || 'ไม่ระบุชื่อผลงาน'}</h4>
    <p className="mt-1 break-words text-xs text-slate-500">{d.year_be || 'ไม่ระบุปี'} · {d.publication_name || 'ไม่ระบุแหล่งตีพิมพ์'} · {d.eid}</p>
    <div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded bg-blue-50 px-2 py-1 text-blue-800">{country?.label || 'ยังระบุประเทศไม่ได้'}</span><span className="rounded bg-slate-100 px-2 py-1 text-slate-700">{role?.label || 'ยังระบุบทบาทไม่ได้'}</span><span className="rounded bg-slate-100 px-2 py-1 text-slate-700">Citation {insightNumber(d.citations || 0)}</span></div>
    <p className="mt-3 text-xs leading-5 text-slate-600">ประเทศที่ยืนยันได้: {d.country_evidence_current && d.countries?.length ? d.countries.map(c => c.country_name).join(', ') : 'ยังไม่สามารถยืนยันข้อมูลประเทศปัจจุบันได้'}</p>
    <details className="mt-2 text-xs"><summary className="cursor-pointer rounded py-2 font-medium text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">ผู้เขียนคณะที่เข้าเกณฑ์ ({d.eligible_authors?.length || 0} ลิงก์)</summary><p className="mb-2 text-slate-500">บทบาทผลงาน: {role?.label || 'ยังระบุบทบาทไม่ได้'} · {currentRoles ? 'ตรวจสอบบทบาทแล้ว' : 'ยังยืนยันบทบาทไม่ได้'}</p><ul className="space-y-2">{d.eligible_authors?.map(a => <li key={a.link_id} className="rounded bg-slate-50 p-2 leading-5">{a.full_name || a.scopus_author_id || 'ไม่ระบุชื่อผู้เขียน'}<span className="block text-slate-500">ลำดับ {a.author_seq || '—'} · First: {!currentRoles || a.is_first_author == null ? 'ยังไม่ทราบ' : a.is_first_author ? 'ใช่' : 'ไม่ใช่'} · Corresponding: {!currentRoles || a.is_corresponding_author == null ? 'ยังไม่ทราบ' : a.is_corresponding_author ? 'ใช่' : 'ไม่ใช่'}</span></li>)}</ul></details>
    {(link || doi) && <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-blue-700">{link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">ดูใน Scopus <ExternalLink size={12} /></a>}{doi && <a href={doi} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">DOI <ExternalLink size={12} /></a>}</div>}
  </article>;
}

function InsightDrilldown({ store, drilldown: d, close }) {
  return <Dialog open={Boolean(d)} onClose={close} className="fixed inset-0 z-[130]"><div className="fixed inset-0 bg-slate-950/50" aria-hidden="true" /><div className="fixed inset-0 flex items-center justify-center p-2 sm:p-5"><DialogPanel className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-xl">
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-5"><div><DialogTitle className="font-semibold text-slate-900">ผลงาน Scopus · {d?.label}</DialogTitle><p className="mt-1 text-xs text-slate-500">ใช้ตัวกรองเดียวกับสรุป · ผลงานไม่ซ้ำ · เรียงตามรหัสผลงาน</p></div><button type="button" autoFocus aria-label="ปิดรายการผลงาน" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><X size={20} /></button></div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">{d?.notice && <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{d.notice}</p>}<ResourceState loading={d?.loading} error={d?.error} retry={() => store.refresh({ dimensions: d.dimensions, label: d.label, pageSize: d.pageSize })} />{d?.response && <><p role="status" className="text-sm text-slate-600">พบทั้งหมด <b>{insightNumber(d.response.total)}</b> ผลงาน{d.response.total > 0 ? ` · แสดง ${(d.page - 1) * d.pageSize + 1}–${Math.min(d.page * d.pageSize, d.response.total)}` : ''}</p>{d.response.documents.length ? d.response.documents.map(doc => <DocumentEvidence key={doc.document_id} document={doc} />) : <p className="rounded-lg bg-white p-8 text-center text-sm text-slate-500">ไม่พบผลงานสำหรับรายการที่เลือก</p>}</>}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white p-4"><label className="flex items-center gap-2 text-sm text-slate-600">ต่อหน้า<select aria-label="จำนวนผลงานต่อหน้า" value={d?.pageSize || 25} disabled={d?.loading || !d?.response} onChange={e => store.page(1, Number(e.target.value))} className="rounded-lg border border-slate-300 px-2 py-2">{[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}</select></label><div className="flex items-center gap-2"><button type="button" className={action} disabled={d?.loading || !d?.response || d.page <= 1} onClick={() => store.page(d.page - 1)}>ก่อนหน้า</button><span className="text-xs text-slate-500">{d?.response?.total_pages === 0 ? 'ไม่มีหน้า' : `หน้า ${d?.page || 1} / ${d?.response?.total_pages ?? '—'}`}</span><button type="button" className={action} disabled={d?.loading || !d?.response || d.page >= d.response.total_pages} onClick={() => store.page(d.page + 1)}>ถัดไป</button></div></div>
  </DialogPanel></div></Dialog>;
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
  return <div ref={rootRef} tabIndex={-1} className="space-y-6" aria-label="ข้อมูลความร่วมมือและบทบาทผู้เขียนของคณะ">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>เฉพาะ Scopus · ตามตัวกรองที่ใช้ · ไม่รวม ThaiJO/TCI</span><button ref={refreshRef} type="button" className="inline-flex min-h-9 items-center gap-1 rounded px-2 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-40" disabled={loading} onClick={() => store.refresh()}><RefreshCw size={13} />อัปเดตข้อมูลทั้ง 3 ส่วน</button></div>
    <InsightCard title="ความร่วมมือระหว่างประเทศของคณะ" icon={Globe2}>{summary ? <InternationalCard summary={summary} open={open} /> : <ResourceState loading={loading} error={error} retry={() => store.refresh()} />}</InsightCard>
    <InsightCard title="บทบาทผู้เขียนของคณะ" icon={Users}>{summary ? <RolesCard key={summary.revision} summary={summary} open={open} /> : <ResourceState loading={loading} error={error} retry={() => store.refresh()} />}</InsightCard>
    <InsightCard title="บทบาทคณะ: ต่างประเทศและภายในประเทศ" icon={ChartPie}>{summary ? <ComparisonCard key={summary.revision} summary={summary} open={open} /> : <ResourceState loading={loading} error={error} retry={() => store.refresh()} />}</InsightCard>
    {current && state.drilldown && <InsightDrilldown store={store} drilldown={state.drilldown} close={close} />}
  </div>;
}
