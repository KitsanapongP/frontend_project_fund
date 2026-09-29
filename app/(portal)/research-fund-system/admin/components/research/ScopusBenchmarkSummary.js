"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Search, X, AlertCircle } from 'lucide-react';
import { scopusBenchmarkAPI } from '@/app/lib/api';
import { defaultSummaryFilters, createSummaryLoader, filterSummaryFaculty, qualityLabel, confidenceLabel, yearStateLabel, summaryHints } from '@/app/lib/scopus_benchmark_summary.mjs';
import Hint from './report/Hint';

const count = (n) => n == null ? '—' : Number(n).toLocaleString('th-TH');
const pct = (n) => n == null ? '—' : `${Number(n).toFixed(1)}%`;
const button = 'inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400';
const field = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm';
function Label({ children, hint }) { return <span className="inline-flex items-center gap-1">{children}<Hint label={children} text={hint} /></span>; }
function CountButton({ value, onClick }) { return value == null ? '—' : <button type="button" onClick={onClick} disabled={value === 0} className="rounded px-1 text-blue-700 hover:underline focus:ring-2 focus:ring-blue-300 disabled:text-slate-600 disabled:no-underline">{count(value)}</button>; }

function CountTable({ title, rows, total, onDetail, category = false, quartile = false }) {
  const all = total ? [...rows, total] : rows;
  return <section className="rounded-lg border border-slate-200 bg-white">
    <div className="flex items-center justify-between gap-2 rounded-t-lg bg-slate-100 px-4 py-3"><h3 className="font-semibold text-slate-800">{title}</h3><Hint label={title} text={quartile ? summaryHints.quartile : summaryHints.zero} /></div>
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="border-b bg-slate-50 text-slate-700"><tr>
        <th className="p-3 text-left">{quartile ? 'Quartile' : category ? 'Category' : 'ปี ค.ศ.'}</th>
        <th className="p-3 text-right">Thailand</th><th className="p-3 text-right">KKU</th><th className="p-3 text-right">% KKU</th><th className="p-3 text-right">COC</th><th className="p-3 text-right">% COC</th>
      </tr></thead>
      <tbody>{all.map((r,i) => <tr key={`${r.year}:${r.category_id}:${r.quartile}:${i}`} className={`border-b last:border-0 ${r === total ? 'bg-blue-50 font-semibold' : 'hover:bg-slate-50'}`}>
        <th scope="row" className="max-w-md p-3 text-left font-normal">{r === total ? r.label : quartile ? qualityLabel[r.quartile] : r.label}</th>
        {['thailand','kku'].map((level) => <td className="p-3 text-right tabular-nums" key={level}><CountButton value={r[level]} onClick={() => onDetail({ level, ...(r.year ? {year:r.year}:{}), ...((category && r !== total) || quartile ? {document_category:r.category_id || 0}:{}), ...(quartile ? {quartile:r.quartile}:{}) }, title)} /></td>)}
        <td className="p-3 text-right tabular-nums">{pct(r.kku_pct)}</td>
        <td className="p-3 text-right tabular-nums"><CountButton value={r.coc} onClick={() => onDetail({level:'coc', ...(r.year ? {year:r.year}:{}), ...((category && r !== total) || quartile ? {document_category:r.category_id || 0}:{}), ...(quartile ? {quartile:r.quartile}:{})}, title)} /></td>
        <td className="p-3 text-right tabular-nums">{pct(r.coc_pct)}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;
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
  return <div className="space-y-5">
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">สรุปผลงานและบทบาทอาจารย์</h2><Hint label="หน่วยและขอบเขตการนับ" text={summaryHints.units}/></div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <label className="text-sm">ปีเริ่มต้น (ค.ศ.)<input type="number" min="1900" max={new Date().getFullYear()+1} value={draft.year_from} onChange={e=>change('year_from',e.target.value)} className={`mt-1 ${field}`}/></label>
        <label className="text-sm">ปีสิ้นสุด (ค.ศ.)<input type="number" min="1900" max={new Date().getFullYear()+1} value={draft.year_to} onChange={e=>change('year_to',e.target.value)} className={`mt-1 ${field}`}/></label>
        <label className="text-sm">Category<select className={`mt-1 ${field}`} value={draft.category} onChange={e=>change('category',e.target.value)}><option value="classified">มี Category</option><option value="all">ทั้งหมด</option><option value="unknown">ไม่มี Category</option>{options?.categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <div className="text-sm"><Label hint={summaryHints.quartile}>การแสดง Quartile</Label><div className="mt-1 flex rounded-md border border-slate-300 p-1">{[['t1','แยก T1'],['q','Q1–Q4']].map(([v,label])=><button type="button" key={v} aria-pressed={draft.quartile_mode===v} className={`flex-1 rounded px-3 py-2 ${draft.quartile_mode===v?'bg-blue-600 text-white':'text-slate-600'}`} onClick={()=>{change('quartile_mode',v);setApplied(f=>({...f,quartile_mode:v}));setDetail(null)}}>{label}</button>)}</div></div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><fieldset><legend className="mb-2 text-sm font-medium">ประเภทผลงาน</legend><div className="flex flex-wrap gap-4">{(options?.types||['Journal']).map(t=><label className="inline-flex items-center gap-2 text-sm" key={t}><input type="checkbox" checked={draft.types.split(',').includes(t)} onChange={e=>check('types',t,e.target.checked)}/>{t}</label>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-medium">Confidence</legend><div className="flex flex-wrap gap-4">{Object.entries(confidenceLabel).map(([v,label])=><label className="inline-flex items-center gap-2 text-sm" key={v}><input type="checkbox" checked={draft.confidence.split(',').includes(v)} onChange={e=>check('confidence',v,e.target.checked)}/>{label}</label>)}</div></fieldset>
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" className={`${button} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`} onClick={apply} disabled={loading}>แสดงผล</button><button type="button" className={`${button} border-slate-300 hover:bg-slate-50`} onClick={()=>{const f=defaultSummaryFilters();setDraft(f);setApplied(f);setDetail(null)}}>ล้างตัวกรอง</button><button type="button" className={`${button} border-slate-300 hover:bg-slate-50`} onClick={refresh} disabled={loading}><RefreshCw size={16}/>อัปเดตข้อมูล</button><button type="button" className={`${button} ml-auto border-emerald-300 text-emerald-800 hover:bg-emerald-50`} onClick={download} disabled={loading||exporting||!data}><Download size={16}/>{exporting?'กำลังส่งออก…':'ส่งออก Excel'}</button></div>
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">{[['overview','ภาพรวมผลงาน'],['faculty','บทบาทอาจารย์']].map(([v,label])=><button type="button" key={v} onClick={()=>{setView(v);setDetail(null)}} aria-pressed={view===v} className={`rounded-full px-4 py-2 text-sm font-medium ${view===v?'bg-slate-800 text-white':'bg-slate-100 text-slate-600'}`}>{label}</button>)}</div>
    </section>
    {stale&&<div role="status" className="flex items-center justify-between rounded-lg bg-amber-50 p-3 text-sm text-amber-800"><span>ข้อมูลตั้งค่าหรือ harvest เปลี่ยนแล้ว ผลที่แสดงเป็นข้อมูลเดิม</span><button type="button" className={`${button} border-amber-300`} disabled={loading} onClick={refresh}>อัปเดตรายงาน</button></div>}
    {error&&<p role="alert" className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    {loading&&<div role="status" className="rounded-lg bg-slate-50 p-8 text-center text-slate-600">กำลังคำนวณรายงาน…</div>}
    {data&&!loading&&<>
      <p className="text-xs text-slate-500">ผลที่แสดง: {applied.year_from}–{applied.year_to} · {applied.types} · Category {applied.category==='classified'?'มีหมวด':applied.category==='all'?'ทั้งหมด':applied.category==='unknown'?'ไม่มีหมวด':options?.categories?.find(c=>String(c.id)===String(applied.category))?.name||applied.category} · Confidence {applied.confidence.split(',').map(v=>confidenceLabel[v]||v).join(', ')}</p>
      <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2"><AlertCircle size={16}/><span className="font-medium">ความครอบคลุมของข้อมูลที่เชื่อมอยู่</span><Hint label="ข้อจำกัดข้อมูล" text={summaryHints.zero}/><span className="ml-auto text-xs text-slate-500">สร้างผล {new Date(data.generated_at).toLocaleString('th-TH')}</span></div>
        <div className="mt-2 flex flex-wrap gap-2">{data.year_states.map(y=><span key={y.year} className="rounded bg-white px-2 py-1 text-xs">{y.year}: {yearStateLabel[y.status]} · มีในฐาน {count(y.observed)}{y.expected!=null?` / คาดหมาย ${count(y.expected)}`:''}</span>)}</div>
        <p className="mt-2 text-xs text-slate-600">มี Category {count(data.coverage.classified)} / {count(data.coverage.base_documents)} · ผ่านตัวกรอง {count(data.coverage.selected)} · ตรวจสังกัดผลงานยังไม่ครบ {count(data.coverage.affiliation_incomplete)} · สังกัดผู้เขียนในทะเบียนยังไม่ครบ {count(data.coverage.faculty_affiliation_incomplete)} · บทบาทยังระบุไม่ได้ {count(data.coverage.role_unknown_pairs)} คู่ · metric ปีก่อนหน้า {count(data.coverage.metric_fallback)} · ไม่มี Quartile {count(data.coverage.missing_quartile)}</p>
      </section>
      {data.coverage.selected===0&&<p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">ไม่พบผลงานผ่านตัวกรองในข้อมูลที่มี{data.coverage.base_documents>0&&data.coverage.classified===0?' — ชุดฐานยังไม่มี Category ที่จัดไว้ สามารถเลือก Category ทั้งหมดเพื่อสำรวจข้อมูลได้':''}</p>}
      {view==='overview'?<>
        <div className="flex flex-wrap gap-5 text-sm"><Label hint={summaryHints.thailand}>Thailand</Label><Label hint={summaryHints.kku}>KKU</Label><Label hint={summaryHints.coc}>COC</Label><Label hint={summaryHints.percentages}>สูตรเปอร์เซ็นต์</Label></div>
        <CountTable title="จำนวนผลงานตามปี" rows={data.yearly} total={data.total} onDetail={openDetail}/>
        <section className="rounded-lg border border-slate-200 bg-white p-4"><h3 className="font-semibold"><Label hint={summaryHints.roles}>บทบาทอาจารย์ในผลงาน COC (ผลงานไม่ซ้ำ)</Label></h3><div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">{[['total','ทั้งหมด',summaryHints.units],['first','First',summaryHints.roles],['corresponding','Corresponding',summaryHints.roles],['lead','First หรือ Corresponding',summaryHints.roles],['co','Co-author เท่านั้น',summaryHints.co],['unknown','ยังสรุปไม่ได้',summaryHints.unknown]].map(([role,label,hint])=><div key={role} className="rounded-lg bg-slate-50 p-3"><div className="text-xs"><Label hint={hint}>{label}</Label></div><p className="mt-2 text-xl font-semibold"><CountButton value={data.faculty_roles[role]} onClick={()=>openDetail({level:'coc',...(role!=='total'?{role}:{})},label)}/></p></div>)}</div></section>
        {data.year_states.map(y=><CountTable key={y.year} title={`Category ปี ${y.year}`} rows={data.categories.filter(r=>r.year===y.year)} total={{...data.yearly.find(r=>r.year===y.year),label:'รวม'}} category onDetail={openDetail}/>)}
        {categories.map(([id,name])=>{const rows=data.quartiles.filter(r=>(r.category_id||0)===id);return <CountTable key={id} title={`${name} (${count(sumRows(rows,'').thailand)}) · ${applied.year_from}–${applied.year_to}`} rows={rows} total={{...sumRows(rows,'รวม'),category_id:id}} quartile onDetail={openDetail}/>})}
      </>:<section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-500"><Label hint={summaryHints.roles}>การนับบทบาทซ้อนกัน</Label><Label hint={summaryHints.co}>Co-author</Label><Label hint={summaryHints.unknown}>ยังระบุไม่ได้</Label></div>
        <div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold"><Label hint={summaryHints.units}>บทบาทรายอาจารย์</Label></h3><label className="relative ml-auto"><Search size={15} className="absolute left-2 top-3 text-slate-400"/><input aria-label="ค้นหาอาจารย์" placeholder="ค้นหาชื่อ / Scopus ID" value={search} onChange={e=>setSearch(e.target.value)} className={`${field} pl-8`}/></label><select aria-label="เรียงอาจารย์" value={sort} onChange={e=>setSort(e.target.value)} className="rounded border border-slate-300 p-2 text-sm">{[['total','จำนวนทั้งหมด'],['first','จำนวน First'],['corresponding','จำนวน Corresponding'],['lead','จำนวน First หรือ Corresponding'],['co','จำนวน Co-author'],['unknown','จำนวนยังระบุไม่ได้'],['first_pct','สัดส่วน First'],['corresponding_pct','สัดส่วน Corresponding'],['lead_pct','สัดส่วน First หรือ Corresponding'],['name','ชื่อ']].map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={hideEmpty} onChange={e=>setHideEmpty(e.target.checked)}/>ซ่อนอาจารย์ที่ไม่มีผลงาน</label>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-slate-50"><tr><th className="p-3 text-left">อาจารย์</th><th className="p-3 text-right">ทั้งหมด</th>{[['first','First'],['corresponding','Corresponding'],['lead','First หรือ Corresponding'],['co','Co-author'],['unknown','ยังระบุไม่ได้']].map(([v,l])=><th key={v} className="p-3 text-right">{l}<div className="text-xs font-normal">จำนวน / %</div></th>)}</tr></thead><tbody>{visibleFaculty.map(u=><tr key={u.user_id} className="border-b last:border-0"><th scope="row" className="p-3 text-left font-normal"><span className="font-medium">{u.name}</span><p className="mt-1 text-xs text-slate-500">{u.linkable?u.scopus_id:'ไม่มี Scopus ID — เชื่อมข้อมูลไม่ได้'}</p></th><td className="p-3 text-right"><CountButton value={u.linkable?u.total:null} onClick={()=>openDetail({level:'coc',user_id:u.user_id},u.name)}/></td>{['first','corresponding','lead','co','unknown'].map(role=><td key={role} className="p-3 text-right"><CountButton value={u.linkable?u[role]:null} onClick={()=>openDetail({level:'coc',user_id:u.user_id,role},`${u.name} · ${role}`)}/><span className="ml-1 text-xs text-slate-500">/ {u.linkable?pct(u[`${role}_pct`]):'—'}</span></td>)}</tr>)}</tbody></table></div>
        {visibleFaculty.length===0&&<p className="py-8 text-center text-slate-500">ไม่พบอาจารย์ตามตัวกรองการแสดงผล</p>}
      </section>}
    </>}
    {isActive&&detail&&<DocumentDialog state={detail} data={documents} loading={docLoading} error={docError} onPage={page=>setDetail(d=>({...d,page}))} onClose={closeDetail}/>}
  </div>;
}
