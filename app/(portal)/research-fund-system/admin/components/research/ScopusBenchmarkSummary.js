"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Search, X, SlidersHorizontal, Filter } from 'lucide-react';
import { scopusBenchmarkAPI } from '@/app/lib/api';
import { defaultSummaryFilters, createSummaryLoader, filterSummaryFaculty, qualityLabel, confidenceLabel, yearStateLabel, summaryHints } from '@/app/lib/scopus_benchmark_summary.mjs';
import Hint from './report/Hint';
import SimpleCard from '../common/SimpleCard';

const count = (n) => n == null ? '—' : Number(n).toLocaleString('th-TH');
const pct = (n) => n == null ? '—' : `${Number(n).toFixed(1)}%`;
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400';
const field = 'min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
function Label({ children, hint }) { return <span className="inline-flex items-center gap-1">{children}<Hint label={children} text={hint} /></span>; }
function CountButton({ value, onClick }) { return value == null ? '—' : <button type="button" onClick={onClick} disabled={value === 0} className="rounded px-1 text-blue-700 hover:underline focus:ring-2 focus:ring-blue-300 disabled:text-slate-600 disabled:no-underline">{count(value)}</button>; }

// Operate mode: filters -> paired overview -> yearly categories -> four-column
// Quartile matrix. Shared edges and compact tables keep comparisons in one scan.
function ReportPanel({ title, hint, children, compact = false, className = '' }) {
  return <section className={`min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
    <header className={`flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 ${compact ? 'min-h-24' : 'min-h-14'}`}>
      <h3 className="min-w-0 text-sm font-semibold leading-5 text-slate-900">{title}</h3>
      {hint && <Hint label={title} text={hint}/>}
    </header>
    {children}
  </section>;
}
function CountTable({ title, rows, total, onDetail, category = false, quartile = false, hint }) {
  const all = total ? [...rows, total] : rows;
  const cell = `border-b border-slate-200 ${quartile ? 'px-1.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'}`;
  const tableHint = [summaryHints.thailand, summaryHints.kku, summaryHints.coc, summaryHints.percentages].join('\n');
  return <ReportPanel title={title} hint={hint || (quartile ? `${summaryHints.quartile}\nTH = Thailand. ${summaryHints.percentages}` : tableHint)} compact={quartile} className="h-full">
    <div className="overflow-x-auto"><table className={`w-full table-fixed border-collapse ${quartile ? 'min-w-[280px]' : 'min-w-[480px]'}`}>
      <thead className="bg-blue-100 text-blue-900"><tr>
        <th className={`${category ? 'w-[40%]' : quartile ? 'w-[24%]' : 'w-[25%]'} ${cell} text-left`}>{quartile ? 'Quartile' : category ? 'Category' : 'ปี ค.ศ.'}</th>
        <th className={`${cell} text-right`}>{quartile ? <abbr className="no-underline" title="Thailand">TH</abbr> : 'Thailand'}</th><th className={`${cell} text-right`}>KKU</th><th className={`${cell} text-right`}>%KKU</th><th className={`${cell} text-right`}>COC</th><th className={`${cell} text-right`}>%COC</th>
      </tr></thead>
      <tbody>{all.map((r,i) => <tr key={`${r.year}:${r.category_id}:${r.quartile}:${i}`} className={`border-b last:border-0 ${r === total ? 'bg-blue-50 font-semibold' : `${i % 2 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50`}`}>
        <th scope="row" className={`${cell} text-left font-normal`}>
          {r === total ? r.label : quartile ? <span title={qualityLabel[r.quartile]}>{r.quartile === 'missing' ? 'ไม่ระบุ' : r.quartile === 'not_applicable' ? 'ไม่ใช้' : qualityLabel[r.quartile]}</span> : r.label}
        </th>
        {['thailand','kku'].map((level) => <td className={`${cell} text-right tabular-nums`} key={level}><CountButton value={r[level]} onClick={() => onDetail({ level, ...(r.year ? {year:r.year}:{}), ...((category && r !== total) || quartile ? {document_category:r.category_id || 0}:{}), ...(quartile && r !== total ? {quartile:r.quartile}:{}) }, title)} /></td>)}
        <td className={`${cell} text-right tabular-nums`}>{quartile ? (r.kku_pct == null ? '—' : Number(r.kku_pct).toFixed(1)) : pct(r.kku_pct)}</td>
        <td className={`${cell} text-right tabular-nums`}><CountButton value={r.coc} onClick={() => onDetail({level:'coc', ...(r.year ? {year:r.year}:{}), ...((category && r !== total) || quartile ? {document_category:r.category_id || 0}:{}), ...(quartile && r !== total ? {quartile:r.quartile}:{})}, title)} /></td>
        <td className={`${cell} text-right tabular-nums`}>{quartile ? (r.coc_pct == null ? '—' : Number(r.coc_pct).toFixed(1)) : pct(r.coc_pct)}</td>
      </tr>)}</tbody>
    </table></div>
  </ReportPanel>;
}
function sumRows(rows,label) {
  const valid = rows.filter((r) => r.thailand != null);
  if (!valid.length) return { label, thailand:null,kku:null,coc:null };
  const thailand=valid.reduce((s,r)=>s+r.thailand,0),kku=valid.reduce((s,r)=>s+r.kku,0),coc=valid.reduce((s,r)=>s+r.coc,0);
  return { label,thailand,kku,coc,kku_pct:thailand?kku/thailand*100:null,coc_pct:kku?coc/kku*100:null };
}
function DocumentDialog({ state, data, loading, error, onPage, onClose }) {
  const closeRef=useRef(null);
  const dialogRef=useRef(null);
  useEffect(()=>{
    const previous=document.activeElement;closeRef.current?.focus();
    const close=(e)=>{
      if(e.key==='Escape')onClose();
      if(e.key==='Tab'){
        const nodes=[...dialogRef.current.querySelectorAll('button:not(:disabled),a[href]')];
        const first=nodes[0],last=nodes[nodes.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
      }
    };
    document.addEventListener('keydown',close);
    return()=>{document.removeEventListener('keydown',close);previous?.focus?.()};
  },[onClose]);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose()}}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="summary-document-title" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
      <div className="flex items-center justify-between"><h2 id="summary-document-title" className="text-lg font-semibold">รายละเอียดผลงาน — {state.title}</h2><button ref={closeRef} type="button" aria-label="ปิดรายละเอียด" onClick={onClose} className="rounded p-2 hover:bg-slate-100"><X size={20}/></button></div>
      <p className="mt-1 text-sm text-slate-500">ระดับ {state.query.level || 'COC'} · พบ {count(data?.total)} ผลงาน · หน้า {state.page}</p>
      {loading && <p role="status" className="py-8">กำลังโหลดรายละเอียด…</p>}
      {error && <p role="alert" className="my-4 rounded bg-rose-50 p-3 text-rose-700">{error}</p>}
      {!loading && data?.documents?.length===0 && <p className="py-8 text-slate-500">ไม่พบผลงานตามเงื่อนไขนี้</p>}
      {!loading && data?.documents?.map((d)=><article key={d.eid} className="mt-4 rounded-lg border border-slate-200 p-4">
        <h3 className="font-semibold">{d.title || d.eid}</h3><p className="mt-1 text-xs text-slate-500">{d.eid} · {d.year} · {d.publication_name} · {d.type}</p>
        <p className="mt-2 text-sm">{d.category_name} · {confidenceLabel[d.confidence] || d.confidence} · {qualityLabel[d.quartile]}{d.metric_year ? ` (metric ${d.metric_year}${d.metric_fallback ? ', ใช้ปีก่อนหน้า':''})`:''}</p>
        <p className="mt-1 text-xs text-slate-500">AF-ID: {d.afids.join(', ') || 'ไม่มีข้อมูล'} · {d.affiliations_complete ? 'มีรายการสังกัดจาก payload':'ข้อมูลสังกัดยังไม่ครบ'}</p>
        {/^(https?:\/\/)/i.test(d.scopus_link) && <a href={d.scopus_link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-700 hover:underline">เปิดใน Scopus</a>}
        <ol className="mt-3 space-y-2">{d.authors.map((a)=>{
          const known=['complete','no_correspondence'].includes(a.role_status) && a.first!=null && a.corresponding!=null;
          const roles=!known ? 'ยังระบุบทบาทไม่ได้' : [a.first?'First':null,a.corresponding?'Corresponding':null,!a.first&&!a.corresponding?'Co-author':null].filter(Boolean).join(' + ');
          return <li key={a.scopus_author_id} className="rounded bg-slate-50 px-3 py-2 text-sm"><span className="font-medium">{a.seq}. {a.name || a.scopus_author_id}</span><span className={`ml-2 ${a.eligible_user_ids.length?'text-blue-700':'text-slate-500'}`}>{roles}{a.eligible_user_ids.length?' · อาจารย์คณะเข้าเกณฑ์':''}</span><p className="mt-1 text-xs text-slate-500">Author ID {a.scopus_author_id} · AF-ID {a.afids.join(', ') || 'ไม่ระบุ'}{!a.affiliations_complete?' · ยังตรวจสังกัดไม่ครบ':''}</p></li>;
        })}</ol>
      </article>)}
      <div className="mt-5 flex justify-between"><button type="button" className={button} disabled={loading||state.page<=1} onClick={()=>onPage(state.page-1)}>ก่อนหน้า</button><button type="button" className={button} disabled={loading||!data||state.page*50>=data.total} onClick={()=>onPage(state.page+1)}>ถัดไป</button></div>
    </section>
  </div>;
}

export default function ScopusBenchmarkSummary({ isActive=true, stale=false, onRefreshed, api=scopusBenchmarkAPI }) {
  const [view,setView]=useState('overview');const [draft,setDraft]=useState(defaultSummaryFilters);const [applied,setApplied]=useState(defaultSummaryFilters);
  const [version,setVersion]=useState(0);const [options,setOptions]=useState(null);const [report,setReport]=useState(null);const [faculty,setFaculty]=useState(null);
  const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [exporting,setExporting]=useState(false);
  const [search,setSearch]=useState('');const [hideEmpty,setHideEmpty]=useState(false);const [sort,setSort]=useState('total');const [detail,setDetail]=useState(null);const [documents,setDocuments]=useState(null);const [docLoading,setDocLoading]=useState(false);const [docError,setDocError]=useState('');
  const loaders=useRef(null);if(!loaders.current)loaders.current={options:createSummaryLoader(),overview:createSummaryLoader(),faculty:createSummaryLoader(),documents:createSummaryLoader()};
  const refreshRef=useRef(onRefreshed);refreshRef.current=onRefreshed;
  const refreshPending=useRef(false);
  const closeDetail=useCallback(()=>setDetail(null),[]);
  const exportAbort=useRef(null);
  const filterKey=JSON.stringify(applied);const key=`${filterKey}:${version}`;
  useEffect(()=>{
    if(!isActive)return undefined;
    const loader=loaders.current.options;
    loader.load(`options:${version}`,signal=>api.summaryOptions({signal}),r=>setOptions(r.data),e=>setError(e.message));
    return()=>loader.stop();
  },[isActive,api,version]);
  useEffect(()=>{
    if(!isActive)return undefined;
    const loader=loaders.current[view];setLoading(true);setError('');
    loader.load(key,signal=>view==='overview'?api.summary(applied,{signal}):api.summaryFaculty(applied,{signal}),r=>{
      const result={key,data:r.data};if(view==='overview')setReport(result);else setFaculty(result);setLoading(false);
      if(refreshPending.current){refreshPending.current=false;refreshRef.current?.()}
    },e=>{setError(e.message||'โหลดรายงานไม่สำเร็จ');setLoading(false)});
    return()=>loader.stop();
  },[isActive,view,key,api]); // key contains the applied filters, not draft edits
  useEffect(()=>{
    if(!isActive||!detail)return undefined;
    const loader=loaders.current.documents;setDocLoading(true);setDocError('');setDocuments(null);
    loader.load(`${key}:${JSON.stringify(detail)}`,signal=>api.summaryDocuments({...applied,...detail.query,page:detail.page},{signal}),r=>{setDocuments(r.data);setDocLoading(false)},e=>{setDocError(e.message);setDocLoading(false)});
    return()=>loader.stop();
  },[isActive,key,detail,api]);
  useEffect(()=>{exportAbort.current?.abort();setExporting(false);return()=>exportAbort.current?.abort()},[isActive,view,key]);
  const current=(view==='overview'?report:faculty);const data=current?.key===key?current.data:null;
  const visibleFaculty=useMemo(()=>filterSummaryFaculty(data?.faculty||[],search,hideEmpty,sort),[data,search,hideEmpty,sort]);
  const openDetail=(query,title)=>{setDetail({query,title,page:1});setDocuments(null)};
  const categories=useMemo(()=>[...new Map((data?.quartiles||[]).map(r=>[r.category_id||0,r.label])).entries()],[data]);
  const change=(key,value)=>setDraft(d=>({...d,[key]:value}));
  const check=(key,value,checked)=>{const values=new Set(draft[key].split(',').filter(Boolean));checked?values.add(value):values.delete(value);change(key,[...values].sort().join(','))};
  const apply=()=>{
    if(Number(draft.year_from)>Number(draft.year_to)||!draft.types||!draft.confidence){setError('ตรวจช่วงปี และเลือกประเภทผลงานกับ confidence อย่างน้อยหนึ่งค่า');return}
    setApplied({...draft,year_from:Number(draft.year_from),year_to:Number(draft.year_to)});setDetail(null);
  };
  const refresh=()=>{refreshPending.current=true;Object.values(loaders.current).forEach(l=>{l.stop();l.clear()});setVersion(v=>v+1);setDetail(null);};
  const download=async()=>{
    if(!data)return;setExporting(true);setError('');const controller=new AbortController();exportAbort.current=controller;
    try{const blob=await api.summaryExport({...applied,view,revision:data.revision},{signal:controller.signal});if(controller.signal.aborted)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`scopus-benchmark-${view}-${applied.year_from}-${applied.year_to}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){if(!controller.signal.aborted)setError(e.message)}finally{if(!controller.signal.aborted)setExporting(false)}
  };
  return <div className="space-y-4" style={{containerType: 'inline-size', containerName: 'scopus-summary'}}>
    <SimpleCard title="ตัวกรองข้อมูล" icon={SlidersHorizontal} action={<Hint label="หน่วยและขอบเขตการนับ" text={summaryHints.units}/>} noPadding>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.3fr_1fr]">
          <fieldset className="min-w-0">
            <legend className="mb-2 text-xs font-medium text-slate-600">ช่วงปี (ค.ศ.)</legend>
            <div className="flex items-center gap-2">
              <input aria-label="ปีเริ่มต้น (ค.ศ.)" type="number" min="1900" max={new Date().getFullYear()+1} value={draft.year_from} onChange={e=>change('year_from',e.target.value)} className={field}/>
              <span className="text-slate-400">–</span>
              <input aria-label="ปีสิ้นสุด (ค.ศ.)" type="number" min="1900" max={new Date().getFullYear()+1} value={draft.year_to} onChange={e=>change('year_to',e.target.value)} className={field}/>
            </div>
          </fieldset>
          <label className="min-w-0 text-xs font-medium text-slate-600">Category<select className={`mt-2 ${field}`} value={draft.category} onChange={e=>change('category',e.target.value)}><option value="classified">มี Category</option><option value="all">ทั้งหมด</option><option value="unknown">ไม่มี Category</option>{options?.categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <div className="min-w-0 text-xs font-medium text-slate-600"><Label hint={summaryHints.quartile}>Quartile</Label><div className="mt-2 flex">{[['t1','แยก T1'],['q','Q1–Q4']].map(([v,label])=><button type="button" key={v} aria-pressed={draft.quartile_mode===v} className={`flex-1 border px-3 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg last:border-l-0 focus:ring-2 focus:ring-blue-300 ${draft.quartile_mode===v?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`} onClick={()=>{change('quartile_mode',v);setApplied(f=>({...f,quartile_mode:v}));setDetail(null)}}>{label}</button>)}</div></div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="min-w-0"><legend className="mb-1 text-xs font-medium text-slate-600">ประเภทผลงาน</legend><div className="flex flex-wrap gap-x-4">{(options?.types||['Journal']).map(t=><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-slate-700" key={t}><input className="h-4 w-4 accent-blue-600" type="checkbox" checked={draft.types.split(',').includes(t)} onChange={e=>check('types',t,e.target.checked)}/>{t}</label>)}</div></fieldset>
          <fieldset className="min-w-0"><legend className="mb-1 text-xs font-medium text-slate-600">Confidence</legend><div className="flex flex-wrap gap-x-4">{Object.entries(confidenceLabel).map(([v,label])=><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-slate-700" key={v}><input className="h-4 w-4 accent-blue-600" type="checkbox" checked={draft.confidence.split(',').includes(v)} onChange={e=>check('confidence',v,e.target.checked)}/>{label}</label>)}</div></fieldset>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <p className="min-w-0 text-xs text-slate-500">ผลที่แสดง: {applied.year_from}–{applied.year_to} · {applied.types} · {applied.category==='classified'?'มี Category':applied.category==='all'?'Category ทั้งหมด':applied.category==='unknown'?'ไม่มี Category':options?.categories?.find(c=>String(c.id)===String(applied.category))?.name} · {applied.confidence.split(',').map(v=>confidenceLabel[v]).join(', ')}</p>
          <div className="flex shrink-0 gap-2"><button type="button" className={`${button} border-slate-300 text-slate-700 hover:bg-slate-100`} disabled={loading} onClick={()=>{const f=defaultSummaryFilters();setDraft(f);setApplied(f);setDetail(null)}}>ล้างตัวกรอง</button><button type="button" className={`${button} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`} onClick={apply} disabled={loading}><Filter size={14}/>ใช้ตัวกรอง</button></div>
        </div>
      </div>
    </SimpleCard>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div className="flex gap-1">{[['overview','ภาพรวมผลงาน'],['faculty','บทบาทอาจารย์']].map(([v,label])=><button type="button" key={v} onClick={()=>{setView(v);setDetail(null)}} aria-pressed={view===v} className={`rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-300 ${view===v?'bg-blue-50 text-blue-700':'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}</div>
      <div className="flex gap-2"><button type="button" className={`${button} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`} onClick={refresh} disabled={loading}><RefreshCw size={16}/>อัปเดตข้อมูล</button><button type="button" className={`${button} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`} onClick={download} disabled={loading||exporting||!data}><Download size={16}/>{exporting?'กำลังส่งออก…':'ส่งออก Excel'}</button></div>
    </div>
    {stale&&<div role="status" className="flex items-center justify-between rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><span>ข้อมูลตั้งค่าหรือ harvest เปลี่ยนแล้ว ผลที่แสดงเป็นข้อมูลเดิม</span><button type="button" className={`${button} border-amber-300`} disabled={loading} onClick={refresh}>อัปเดตรายงาน</button></div>}
    {error&&<p role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {loading&&<div role="status" className="rounded-lg bg-slate-50 p-8 text-center text-slate-600">กำลังคำนวณรายงาน…</div>}
    {data&&!loading&&<>
      <details className="rounded-lg border border-slate-200 bg-white text-xs text-slate-600">
        <summary className="cursor-pointer px-4 py-3 focus-visible:ring-2 focus-visible:ring-blue-300">
          <span className="font-medium text-slate-700">สถานะข้อมูล</span>
          <span className="ml-3 inline-flex flex-wrap gap-x-3 gap-y-1">{data.year_states.map(y=><span key={y.year} className={y.status==='available'?'text-slate-600':'font-medium text-amber-800'}>{y.year}: {yearStateLabel[y.status]}</span>)}</span>
        </summary>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><span>อัปเดต {new Date(data.generated_at).toLocaleString('th-TH')}</span><Hint label="ข้อจำกัดข้อมูล" text={summaryHints.zero}/></div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-4">
            {data.year_states.map(y=><div key={y.year} className="flex justify-between gap-3"><dt>ชุดข้อมูล {y.year}</dt><dd className="tabular-nums">{count(y.observed)}{y.expected!=null?` / ${count(y.expected)}`:''}</dd></div>)}
            {[['มี Category',`${count(data.coverage.classified)} / ${count(data.coverage.base_documents)}`],['ผ่านตัวกรอง',count(data.coverage.selected)],['สังกัดผลงานยังไม่ครบ',count(data.coverage.affiliation_incomplete)],['สังกัดอาจารย์ยังไม่ครบ',count(data.coverage.faculty_affiliation_incomplete)],['บทบาทยังไม่ทราบ (คู่)',count(data.coverage.role_unknown_pairs)],['ใช้ metric ปีก่อนหน้า',count(data.coverage.metric_fallback)],['ไม่มี Quartile',count(data.coverage.missing_quartile)]].map(([label,value])=><div key={label} className="flex justify-between gap-3"><dt>{label}</dt><dd className="tabular-nums text-slate-900">{value}</dd></div>)}
          </dl>
        </div>
      </details>
      {data.coverage.selected===0&&<p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">ไม่พบผลงานผ่านตัวกรองในข้อมูลที่มี{data.coverage.base_documents>0&&data.coverage.classified===0?' — ชุดฐานยังไม่มี Category ที่จัดไว้ สามารถเลือก Category ทั้งหมดเพื่อสำรวจข้อมูลได้':''}</p>}
      {view==='overview'?<>
        <div className="summary-paired-grid grid gap-4">
          <CountTable title="จำนวนผลงานตามปี" rows={data.yearly} total={data.total} onDetail={openDetail}/>
          <ReportPanel title="บทบาทอาจารย์ · COC" hint={`${summaryHints.units}\n${summaryHints.roles}`} className="h-full">
            <dl className="grid grid-cols-2 px-4 sm:grid-cols-3">
              {[['total','ทั้งหมด',summaryHints.units],['first','First',summaryHints.roles],['corresponding','Corresponding',summaryHints.roles],['lead','First / Corresponding',summaryHints.roles],['co','Co-author เท่านั้น',summaryHints.co],['unknown','ยังสรุปไม่ได้',summaryHints.unknown]].map(([role,label,hint])=><div key={role} className="border-b border-slate-100 py-4">
                <dt className="flex items-center gap-1 text-xs text-slate-600">{label}<Hint label={label} text={hint}/></dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums"><CountButton value={data.faculty_roles[role]} onClick={()=>openDetail({level:'coc',...(role!=='total'?{role}:{})},label)}/></dd>
              </div>)}
            </dl>
          </ReportPanel>
        </div>
        <section aria-labelledby="summary-category-heading" className="pt-2">
          <h2 id="summary-category-heading" className="mb-3 text-base font-semibold text-slate-900">ผลงานตาม Category</h2>
          <div className="summary-paired-grid grid gap-4">
            {data.year_states.map(y=><CountTable key={y.year} title={`ปี ${y.year}`} rows={data.categories.filter(r=>r.year===y.year)} total={{...data.yearly.find(r=>r.year===y.year),label:'รวม'}} category onDetail={openDetail}/>)}
          </div>
        </section>
        <section aria-labelledby="summary-quartile-heading" className="pt-2">
          <div className="mb-3 flex items-center justify-between gap-3"><h2 id="summary-quartile-heading" className="text-base font-semibold text-slate-900">Quartile ตาม Category</h2><span className="text-xs text-slate-500">{applied.year_from}–{applied.year_to} · {applied.quartile_mode==='t1'?'แยก T1':'Q1–Q4'}</span></div>
          <div className="summary-quartile-grid grid gap-4">
            {categories.map(([id,name])=>{const rows=data.quartiles.filter(r=>(r.category_id||0)===id);return <CountTable key={id} title={name} rows={rows} total={{...sumRows(rows,'รวม'),category_id:id}} quartile onDetail={openDetail}/>})}
          </div>
        </section>
      </>:<SimpleCard className="w-full" title={<Label hint={`${summaryHints.units}\n${summaryHints.roles}\n${summaryHints.co}\n${summaryHints.unknown}`}>บทบาทรายอาจารย์</Label>}>

        <div className="flex flex-wrap items-center gap-3"><label className="relative"><Search size={15} className="absolute left-2 top-3 text-slate-400"/><input aria-label="ค้นหาอาจารย์" placeholder="ค้นหาชื่อ / Scopus ID" value={search} onChange={e=>setSearch(e.target.value)} className={`${field} pl-8`}/></label><select aria-label="เรียงอาจารย์" value={sort} onChange={e=>setSort(e.target.value)} className="rounded border border-slate-300 p-2 text-sm">{[['total','จำนวนทั้งหมด'],['first','จำนวน First'],['corresponding','จำนวน Corresponding'],['lead','จำนวน First หรือ Corresponding'],['co','จำนวน Co-author'],['unknown','จำนวนยังระบุไม่ได้'],['first_pct','สัดส่วน First'],['corresponding_pct','สัดส่วน Corresponding'],['lead_pct','สัดส่วน First หรือ Corresponding'],['name','ชื่อ']].map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={hideEmpty} onChange={e=>setHideEmpty(e.target.checked)}/>ซ่อนอาจารย์ที่ไม่มีผลงาน</label>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] table-fixed border-collapse text-sm"><thead className="bg-blue-100 text-xs text-blue-900"><tr><th className="w-[26%] border border-slate-200 px-3 py-2 text-left">อาจารย์</th><th className="border border-slate-200 px-3 py-2 text-right">ทั้งหมด</th>{[['first','First'],['corresponding','Corresponding'],['lead','First หรือ Corresponding'],['co','Co-author'],['unknown','ยังระบุไม่ได้']].map(([v,l])=><th key={v} className="border border-slate-200 px-3 py-2 text-right">{l}<div className="text-xs font-normal">จำนวน / %</div></th>)}</tr></thead><tbody>{visibleFaculty.map((u,i)=><tr key={u.user_id} className={`border-b last:border-0 ${i%2 ? "bg-slate-50" : "bg-white"} hover:bg-blue-50`}><th scope="row" className="border border-slate-200 px-3 py-2 text-left font-normal"><span className="font-medium">{u.name}</span><p className="mt-1 text-xs text-slate-500">{u.linkable?u.scopus_id:'ไม่มี Scopus ID — เชื่อมข้อมูลไม่ได้'}</p></th><td className="border border-slate-200 px-3 py-2 text-right"><CountButton value={u.linkable?u.total:null} onClick={()=>openDetail({level:'coc',user_id:u.user_id},u.name)}/></td>{['first','corresponding','lead','co','unknown'].map(role=><td key={role} className="border border-slate-200 px-3 py-2 text-right"><CountButton value={u.linkable?u[role]:null} onClick={()=>openDetail({level:'coc',user_id:u.user_id,role},`${u.name} · ${role}`)}/><span className="mt-1 block text-xs text-slate-500">{u.linkable?pct(u[`${role}_pct`]):'—'}</span></td>)}</tr>)}</tbody></table></div>
        {visibleFaculty.length===0&&<p className="py-8 text-center text-slate-500">ไม่พบอาจารย์ตามตัวกรองการแสดงผล</p>}
      </SimpleCard>}
    </>}
    <style jsx>{`
      @container scopus-summary (min-width: 1000px) {
        .summary-paired-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @container scopus-summary (min-width: 640px) {
        .summary-quartile-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @container scopus-summary (min-width: 1160px) {
        .summary-quartile-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }
    `}</style>
    {isActive&&detail&&<DocumentDialog state={detail} data={documents} loading={docLoading} error={docError} onPage={page=>setDetail(d=>({...d,page}))} onClose={closeDetail}/>}
  </div>;
}
