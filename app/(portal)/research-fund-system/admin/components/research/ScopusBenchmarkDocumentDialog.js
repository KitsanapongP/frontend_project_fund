"use client";

import { Fragment, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Search, X, ExternalLink } from 'lucide-react';
import { qualityLabel, confidenceLabel } from '@/app/lib/scopus_benchmark_summary.mjs';

const field = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100';
const button = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50';
const blankFilters = { search: '', filter_category: '', filter_quartile: '' };
const number = value => Number(value).toLocaleString('th-TH');
const roleLabel = author => {
  const known = ['complete', 'no_correspondence'].includes(author.role_status) && author.first != null && author.corresponding != null;
  if (!known) return 'ยังระบุไม่ได้';
  return [author.first && 'First', author.corresponding && 'Corresponding', !author.first && !author.corresponding && 'Co-author'].filter(Boolean).join(' + ');
};

function DocumentDetails({ document: d }) {
  const metric = d.metric_year ? `${d.metric_year}${d.metric_fallback ? ' (ใช้ปีก่อนหน้า)' : ''}` : 'ไม่มีข้อมูล';
  const metadata = [
    ['EID', d.eid || 'ไม่ระบุ'], ['วารสาร / แหล่งตีพิมพ์', d.publication_name || 'ไม่ระบุ'],
    ['ประเภท', d.type || 'ไม่ระบุ'], ['Confidence', confidenceLabel[d.confidence] || d.confidence || 'ไม่ระบุ'],
    ['ปี metric', metric], ['DOI', d.doi || 'ไม่ระบุ'],
    ['AF-ID ของผลงาน', (d.afids || []).join(', ') || 'ไม่ระบุ'],
    ['ข้อมูลสังกัด', d.affiliations_complete ? 'มีรายการสังกัดครบจาก payload' : 'ยังตรวจสังกัดไม่ครบ'],
  ];
  return <div className="space-y-4 px-4 py-4 sm:px-5">
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {metadata.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-0.5 break-words text-sm text-slate-900">{value}</dd></div>)}
    </dl>
    {/^(https?:\/\/)/i.test(d.scopus_link) && <a href={d.scopus_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">เปิดใน Scopus <ExternalLink size={14}/></a>}
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-900">ผู้เขียน ({number(d.authors?.length || 0)})</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-slate-100 text-xs text-slate-700"><tr><th className="px-3 py-2 font-medium">ผู้เขียน</th><th className="px-3 py-2 font-medium">บทบาท</th><th className="px-3 py-2 font-medium">Author ID / AF-ID</th></tr></thead>
          <tbody>{(d.authors || []).map((a, index) => <tr key={a.author_id || `author:${a.scopus_author_id || 'unknown'}:${a.seq}:${index}`} className="border-t border-slate-200 align-top">
            <td className="px-3 py-2"><span className="mr-2 text-slate-500">{a.seq}.</span>{a.name || a.scopus_author_id || 'ไม่ระบุชื่อ'}{a.eligible_user_ids?.length > 0 && <span className="mt-0.5 block text-xs text-blue-700">อาจารย์คณะเข้าเกณฑ์</span>}</td>
            <td className="px-3 py-2 whitespace-nowrap">{roleLabel(a)}</td>
            <td className="px-3 py-2 text-xs text-slate-600"><div>Author ID: {a.scopus_author_id || 'ไม่ระบุ'}</div><div className="mt-1">AF-ID: {(a.afids || []).join(', ') || 'ไม่ระบุ'}{!a.affiliations_complete && ' · ยังตรวจไม่ครบ'}</div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  </div>;
}

export default function ScopusBenchmarkDocumentDialog({ state, data, loading, error, categories = [], quartileMode, onFilter, onPage, onClose }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState({ ...blankFilters, ...state.filters });
  const [expanded, setExpanded] = useState(null);
  const categoryLocked = state.query.document_category != null;
  const quartileLocked = Boolean(state.query.quartile);
  const total = data?.total || 0;
  const pageSize = data?.page_size || 50;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const scope = [({ thailand: 'Thailand', kku: 'KKU', coc: 'COC' })[state.query.level] || 'COC', state.query.year].filter(Boolean).join(' · ');
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const nodes = [...dialogRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', handleKey); previous?.focus?.(); };
  }, [onClose]);
  useEffect(() => { setExpanded(null); scrollRef.current?.scrollTo(0, 0); }, [state.page, state.filters]);
  const clear = () => { setDraft({ ...blankFilters }); onFilter({ ...blankFilters }); };
  const hasFilters = Object.values(state.filters || {}).some(Boolean) || Object.values(draft).some(Boolean);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-2 sm:p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="summary-document-title" className="flex max-h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="min-w-0"><h2 id="summary-document-title" className="text-base font-semibold text-slate-900">รายการผลงาน — {state.title}</h2><p className="mt-1 text-xs text-slate-600">{scope}</p></div>
        <button ref={closeRef} type="button" aria-label="ปิดรายละเอียด" onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:ring-2 focus:ring-blue-400"><X size={20}/></button>
      </header>
      <form onSubmit={e => { e.preventDefault(); onFilter({ ...draft, search: draft.search.trim() }); }} className="grid shrink-0 grid-cols-2 items-end gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.7fr)_auto]">
        <label className="col-span-2 min-w-0 text-xs font-medium text-slate-700 md:col-span-1">ค้นหาผลงาน<div className="relative mt-1"><Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-slate-500"/><input type="search" value={draft.search} maxLength={200} onChange={e => setDraft(f => ({ ...f, search: e.target.value }))} placeholder="ชื่อผลงาน ผู้เขียน หรือ EID" className={`${field} pl-9`}/></div></label>
        <label className="min-w-0 text-xs font-medium text-slate-700">Category<select value={categoryLocked ? String(state.query.document_category) : draft.filter_category} disabled={categoryLocked} onChange={e => setDraft(f => ({ ...f, filter_category: e.target.value }))} className={`mt-1 ${field}`}><option value="">ทั้งหมดในรายการนี้</option><option value="0">ไม่มี Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="min-w-0 text-xs font-medium text-slate-700">Quartile<select value={quartileLocked ? state.query.quartile : draft.filter_quartile} disabled={quartileLocked} onChange={e => setDraft(f => ({ ...f, filter_quartile: e.target.value }))} className={`mt-1 ${field}`}><option value="">ทั้งหมด</option>{Object.entries(qualityLabel).filter(([key]) => key !== 'T1' || quartileMode === 't1').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <div className="col-span-2 flex items-center gap-2 md:col-span-1"><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"><Search size={15} aria-hidden="true"/>ค้นหา</button><button type="button" disabled={loading || !hasFilters} onClick={clear} className={button}>ล้าง</button></div>
      </form>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto" aria-busy={loading}>
        {loading && <p role="status" className="px-5 py-12 text-center text-sm text-slate-600">กำลังโหลดผลงาน…</p>}
        {error && <p role="alert" className="m-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {!loading && !error && data && total === 0 && <div className="px-5 py-12 text-center"><p className="text-sm text-slate-700">ไม่พบผลงานตามเงื่อนไขนี้</p>{hasFilters && <button type="button" onClick={clear} className="mt-3 text-sm font-medium text-blue-700 hover:underline">ล้างตัวกรองรายการ</button>}</div>}
        {!loading && !error && total > 0 && <table className="w-full min-w-[680px] table-fixed text-left text-sm">
          <colgroup><col className="w-[47%]"/><col className="w-[7%]"/><col className="w-[24%]"/><col className="w-[10%]"/><col className="w-[12%]"/></colgroup>
          <thead className="sticky top-0 z-10 bg-blue-100 text-blue-900"><tr>{['ชื่อผลงาน', 'ปี', 'Category', 'Quartile', ''].map((label, index) => <th key={index} scope="col" className="border-b border-blue-200 px-3 py-2.5 font-medium first:pl-5">{label || <span className="sr-only">รายละเอียด</span>}</th>)}</tr></thead>
          <tbody>{data.documents.map((d, index) => {
            const key = d.id || d.eid || `document:${state.page}:${index}`;
            const open = expanded === key;
            const panelID = `summary-document-${state.page}-${index}`;
            return <Fragment key={key}>
              <tr className={`border-b border-slate-200 align-top ${open ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}>
                <td className="break-words py-3 pl-5 pr-3 font-medium leading-5 text-slate-900">{d.title || d.eid || 'ไม่ระบุชื่อผลงาน'}</td>
                <td className="px-3 py-3 tabular-nums text-slate-600">{d.year}</td>
                <td className="px-3 py-3 text-xs leading-5 text-slate-600">{d.category_name || 'ไม่มี Category'}</td>
                <td className="px-3 py-3"><span title={qualityLabel[d.quartile]} className={`text-xs font-semibold ${d.quartile === 'T1' ? 'text-blue-700' : 'text-slate-700'}`}>{d.quartile === 'missing' ? 'ไม่ระบุ' : qualityLabel[d.quartile] || 'ไม่ระบุ'}</span></td>
                <td className="px-2 py-2"><button type="button" aria-label={`รายละเอียด ${d.title || d.eid}`} aria-expanded={open} aria-controls={open ? panelID : undefined} onClick={() => setExpanded(open ? null : key)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400"><span>รายละเอียด</span>{open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</button></td>
              </tr>
              {open && <tr id={panelID} className="border-b border-slate-300 bg-slate-50"><td colSpan={5}><DocumentDetails document={d}/></td></tr>}
            </Fragment>;
          })}</tbody>
        </table>}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 sm:px-5">
        <p role="status" className="text-xs text-slate-600">{loading ? 'กำลังโหลด…' : `${total ? number((state.page - 1) * pageSize + 1) : '0'}–${number(Math.min(state.page * pageSize, total))} จาก ${number(total)} ผลงาน`}</p>
        <div className="flex items-center gap-2"><button type="button" className={button} disabled={loading || state.page <= 1} onClick={() => onPage(state.page - 1)}>ก่อนหน้า</button><label className="flex items-center gap-2 text-xs text-slate-600"><span className="hidden sm:inline">หน้า</span><select aria-label="เลือกรายการหน้า" value={state.page} disabled={loading || !total} onChange={e => onPage(Number(e.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-400">{Array.from({ length: pages }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} / {pages}</option>)}</select></label><button type="button" className={button} disabled={loading || state.page >= pages} onClick={() => onPage(state.page + 1)}>ถัดไป</button></div>
      </footer>
    </section>
  </div>;
}
