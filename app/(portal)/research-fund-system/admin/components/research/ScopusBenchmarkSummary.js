"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Search, SlidersHorizontal, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import { scopusBenchmarkAPI } from '@/app/lib/api';
import { defaultSummaryFilters, createSummaryLoader, filterSummaryFaculty, sortSummaryRows, nextSummarySort, hasNonJournalTypes, qualityLabel, confidenceLabel, yearStateLabel, summaryHints } from '@/app/lib/scopus_benchmark_summary.mjs';
import Hint from './report/Hint';
import { missingScopusIDHint } from '@/app/lib/scopus_explanation_hints.mjs';
import SimpleCard from '../common/SimpleCard';
import DocumentDialog from './ScopusBenchmarkDocumentDialog';
import SummarySortHeader from './report/SummarySortHeader';
import { CountButton, ReportPanel } from './report/SummaryReportPrimitives';
import ScopusBenchmarkPresentation from './ScopusBenchmarkPresentation';

const count = (n) => n == null ? '—' : Number(n).toLocaleString('th-TH');
const pct = (n) => n == null ? '—' : `${Number(n).toFixed(1)}%`;
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-400';
const field = 'min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
function Label({ children, hint }) { return <span className="inline-flex items-center gap-1">{children}<Hint label={children} text={hint} /></span>; }
function CountTable({ title, rows, total, onDetail, category = false, quartile = false, compactQuartile = true, hint }) {
  const [sort,setSort]=useState(null);
  const sorted=sortSummaryRows(rows,sort);
  const all = total ? [...sorted, total] : sorted;
  const onSort=column=>setSort(current=>nextSummarySort(current,column));
  const firstColumn=quartile?'quartile':category?'label':'year';
  const firstLabel=quartile?'Quartile':category?'Category':'ปี ค.ศ.';
  const cell = `border-b border-slate-200 ${quartile ? compactQuartile ? 'px-1.5 py-2 text-xs' : 'px-2 py-2.5 text-sm' : 'px-3 py-2.5 text-sm'}`;
  const headerCell=quartile&&compactQuartile?'border-b border-slate-200 px-1 py-2 text-xs':cell;
  const tableHint = [summaryHints.thailand, summaryHints.kku, summaryHints.coc, summaryHints.percentages];
  return <ReportPanel title={title} hint={hint || (quartile ? [summaryHints.quartile,summaryHints.missingQuartile,summaryHints.notApplicable,summaryHints.percentages] : tableHint)} compact={quartile && compactQuartile} className="h-full">
    <div className="overflow-x-auto"><table className={`w-full table-fixed border-collapse ${quartile ? compactQuartile ? 'min-w-[320px]' : 'min-w-[360px]' : 'min-w-[480px]'}`}>
      <thead className="bg-blue-100 text-blue-900"><tr>
        <SummarySortHeader column={firstColumn} label={firstLabel} sort={sort} onSort={onSort} align="left" compact={quartile&&compactQuartile} className={`${category ? 'w-[40%]' : quartile ? 'w-[24%]' : 'w-[25%]'} ${headerCell} text-left`}/>
        {[['thailand',quartile?<abbr className="no-underline" title="Thailand">TH</abbr>:'Thailand','Thailand'],['kku','KKU','KKU'],['kku_pct','%KKU','%KKU'],['coc','COC','COC'],['coc_pct','%COC','%COC']].map(([column,label,sortLabel])=><SummarySortHeader key={column} column={column} label={label} sortLabel={sortLabel} sort={sort} onSort={onSort} compact={quartile&&compactQuartile} className={`${headerCell} text-right`}/>)}
      </tr></thead>
      <tbody>{all.map((r,i) => <tr key={`${r.year}:${r.category_id}:${r.quartile}:${i}`} className={`border-b last:border-0 ${r === total ? 'bg-blue-50 font-semibold' : `${i % 2 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50`}`}>
        <th scope="row" className={`${cell} text-left font-normal`}>
          {r === total ? r.label : quartile ? ['missing','not_applicable'].includes(r.quartile) ? <span className="inline-flex items-center gap-0.5"><span>{r.quartile === 'missing' ? 'ไม่มีข้อมูล' : qualityLabel.not_applicable}</span><Hint label={qualityLabel[r.quartile]} text={r.quartile === 'missing' ? summaryHints.missingQuartile : summaryHints.notApplicable}/></span> : qualityLabel[r.quartile] : r.label}
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
export default function ScopusBenchmarkSummary({ isActive=true, stale=false, onRefreshed, api=scopusBenchmarkAPI, presentation=false }) {
  const [view,setView]=useState('overview');const [draft,setDraft]=useState(defaultSummaryFilters);const [applied,setApplied]=useState(defaultSummaryFilters);
  const [quartileColumns,setQuartileColumns]=useState(2);
  const [showUnranked,setShowUnranked]=useState(false);
  const [confirmingVisibility,setConfirmingVisibility]=useState(false);
  const visibilityRevision=useRef(0);
  useEffect(()=>{visibilityRevision.current++;setShowUnranked(hasNonJournalTypes(applied.types));},[applied.types]);
  useEffect(()=>()=>{visibilityRevision.current++;},[]);
  const [version,setVersion]=useState(0);const [options,setOptions]=useState(null);const [report,setReport]=useState(null);const [faculty,setFaculty]=useState(null);
  const [viewStatus,setViewStatus]=useState({});const [generalError,setError]=useState('');const [exporting,setExporting]=useState(false);
  const [search,setSearch]=useState('');const [hideEmpty,setHideEmpty]=useState(false);const [sort,setSort]=useState({key:'total',direction:'desc'});const [detail,setDetail]=useState(null);const [documents,setDocuments]=useState(null);const [docLoading,setDocLoading]=useState(false);const [docError,setDocError]=useState('');
  const loaders=useRef(null);if(!loaders.current)loaders.current={options:createSummaryLoader(),overview:createSummaryLoader(),faculty:createSummaryLoader(),documents:createSummaryLoader()};
  const refreshRef=useRef(onRefreshed);refreshRef.current=onRefreshed;
  const refreshPending=useRef(false);
  const closeDetail=useCallback(()=>setDetail(null),[]);
  const exportAbort=useRef(null);
  const requestFilters={...applied,...(presentation?{report_view:'presentation'}:{})};
  const filterKey=JSON.stringify(requestFilters);const key=`${filterKey}:${version}`;
  const status=viewStatus[view]?.key===key?viewStatus[view]:null;
  const loading=Boolean(status?.loading),error=generalError||status?.error||'';
  useEffect(()=>{Object.values(loaders.current).forEach(loader=>{loader.stop();loader.clear();});},[api]);
  // Context invalidation is separate from visibility; inactive panels keep running.
  useEffect(()=>{
    ['overview','faculty','documents'].forEach(name=>loaders.current[name].stop());
  },[key,api]);
  useEffect(()=>{loaders.current.options.stop();},[version,api]);
  useEffect(()=>()=>Object.values(loaders.current).forEach(loader=>{loader.stop();loader.clear();}),[]);
  useEffect(()=>{if(!isActive)setDetail(null);},[isActive]);
  useEffect(()=>{
    if(!isActive)return undefined;
    const loader=loaders.current.options;
    loader.load(`options:${version}`,signal=>api.summaryOptions({signal}),r=>setOptions(r.data),e=>setError(e.message));
  },[isActive,api,version]);
  useEffect(()=>{
    if(!isActive)return undefined;
    const loader=loaders.current[view];setViewStatus(v=>({...v,[view]:{key,loading:true,error:''}}));setError('');
    loader.load(key,signal=>view==='overview'?api.summary(requestFilters,{signal}):api.summaryFaculty(requestFilters,{signal}),r=>{
      const result={key,data:r.data};if(view==='overview')setReport(result);else setFaculty(result);setViewStatus(v=>({...v,[view]:{key,loading:false,error:''}}));
      if(refreshPending.current){refreshPending.current=false;refreshRef.current?.()}
    },e=>{setViewStatus(v=>({...v,[view]:{key,loading:false,error:e.message||'โหลดรายงานไม่สำเร็จ'}}))});
  },[isActive,view,key,api]); // key contains the applied filters, not draft edits
  useEffect(()=>{
    if(!isActive||!detail)return undefined;
    const loader=loaders.current.documents;setDocLoading(true);setDocError('');setDocuments(null);
    loader.load(`${key}:${JSON.stringify(detail)}`,signal=>api.summaryDocuments({...applied,...detail.query,...detail.filters,page:detail.page},{signal}),r=>{setDocuments(r.data);setDocLoading(false)},e=>{setDocError(e.message);setDocLoading(false)});
    return()=>loader.stop();
  },[isActive,key,detail,api]);
  useEffect(()=>{exportAbort.current?.abort();setExporting(false);return()=>exportAbort.current?.abort()},[isActive,view,key]);
  const current=(view==='overview'?report:faculty);const data=current?.key===key?current.data:null;
  const visibleFaculty=useMemo(()=>filterSummaryFaculty(data?.faculty||[],search,hideEmpty,sort),[data,search,hideEmpty,sort]);
  const openDetail=(query,title)=>{setDetail({query,title,page:1,filters:{}});setDocuments(null)};
  const categories=useMemo(()=>[...new Map((data?.quartiles||[]).map(r=>[r.category_id||0,r.label])).entries()],[data]);
  const types=useMemo(()=>{
    const order=['Journal','Conference Proceeding','Book','Book Series','Trade Journal'];
    return [...(options?.types||['Journal'])].sort((a,b)=>(order.includes(a)?order.indexOf(a):order.length)-(order.includes(b)?order.indexOf(b):order.length)||a.localeCompare(b));
  },[options]);
  const appliedItems=[
    ['years','ปี',`${applied.year_from}–${applied.year_to}`],
    ['types','ประเภท',types.filter(t=>applied.types.split(',').includes(t)).join(', ')],
    ['category','Category',applied.category==='classified'?'มี Category':applied.category==='all'?'ทั้งหมด':applied.category==='unknown'?'ไม่มี Category':options?.categories?.find(c=>String(c.id)===String(applied.category))?.name||applied.category],
    ['confidence','Confidence',applied.confidence.split(',').map(v=>confidenceLabel[v]||v).join(', ')],
    ['quartile','Quartile',applied.quartile_mode==='t1'?'แยก T1':'Q1–Q4'],
  ];
  const change=(key,value)=>setDraft(d=>({...d,[key]:value}));
  const check=(key,value,checked)=>{const values=new Set(draft[key].split(',').filter(Boolean));checked?values.add(value):values.delete(value);change(key,[...values].sort().join(','))};
  const apply=()=>{
    if(Number(draft.year_from)>Number(draft.year_to)||!draft.types||!draft.confidence){setError('ตรวจช่วงปี และเลือกประเภทผลงานกับ confidence อย่างน้อยหนึ่งค่า');return}
    visibilityRevision.current++;setShowUnranked(hasNonJournalTypes(draft.types));
    setApplied({...draft,year_from:Number(draft.year_from),year_to:Number(draft.year_to)});setDetail(null);
  };
  const changeUnrankedVisibility=async(value)=>{
    if(value===showUnranked||confirmingVisibility)return;
    if(value||!hasNonJournalTypes(applied.types)){setShowUnranked(value);return;}
    const revision=visibilityRevision.current;
    setConfirmingVisibility(true);
    try {
      const result=await Swal.fire({
        title:'ซ่อนแถวที่ไม่ถูกนำมาจัดอันดับ?',
        text:'ตัวกรองปัจจุบันรวมผลงานประเภทอื่นนอกจาก Journal หากซ่อนแถวนี้ ผลบวกของแถวที่มองเห็นอาจไม่เท่ากับแถว “รวมทุกประเภท” เพราะยอดรวมยังนับผลงานที่ซ่อนไว้',
        icon:'warning',showCancelButton:true,confirmButtonText:'ยืนยันซ่อนแถว',cancelButtonText:'แสดงต่อ',
        reverseButtons:true,focusCancel:true,heightAuto:false,buttonsStyling:false,
        customClass:{popup:'rounded-xl',title:'text-xl font-semibold text-slate-900',htmlContainer:'text-sm text-slate-600',actions:'gap-2',confirmButton:'min-h-11 rounded-lg bg-blue-600 px-5 font-medium text-white hover:bg-blue-700',cancelButton:'min-h-11 rounded-lg border border-slate-300 bg-white px-5 font-medium text-slate-700 hover:bg-slate-50'},
      });
      if(result.isConfirmed&&revision===visibilityRevision.current)setShowUnranked(false);
    } finally {setConfirmingVisibility(false);}
  };
  const refresh=()=>{refreshPending.current=true;Object.values(loaders.current).forEach(l=>{l.stop();l.clear()});setVersion(v=>v+1);setDetail(null);};
  const download=async()=>{
    if(!data)return;setExporting(true);setError('');const controller=new AbortController();exportAbort.current=controller;
    try{const exportView=presentation?'presentation':view;const blob=await api.summaryExport({...requestFilters,view:exportView,revision:data.revision},{signal:controller.signal});if(controller.signal.aborted)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`scopus-benchmark-${exportView}-${applied.year_from}-${applied.year_to}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(e){if(!controller.signal.aborted)setError(e.message)}finally{if(!controller.signal.aborted)setExporting(false)}
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
          <fieldset className="min-w-0"><legend className="mb-1 text-xs font-medium text-slate-600">ประเภทผลงาน</legend><div className="flex flex-wrap gap-x-4">{types.map(t=><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-slate-700" key={t}><input className="h-4 w-4 accent-blue-600" type="checkbox" checked={draft.types.split(',').includes(t)} onChange={e=>check('types',t,e.target.checked)}/>{t}</label>)}</div></fieldset>
          <fieldset className="min-w-0"><legend className="mb-1 text-xs font-medium text-slate-600">Confidence</legend><div className="flex flex-wrap gap-x-4">{Object.entries(confidenceLabel).map(([v,label])=><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm text-slate-700" key={v}><input className="h-4 w-4 accent-blue-600" type="checkbox" checked={draft.confidence.split(',').includes(v)} onChange={e=>check('confidence',v,e.target.checked)}/>{label}</label>)}</div></fieldset>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <div className="flex min-w-0 flex-1 items-start gap-2 text-xs text-slate-600"><Filter size={14} aria-hidden="true" className="mt-0.5 shrink-0"/><div className="min-w-0"><p className="font-medium text-slate-700">ตัวกรองปัจจุบัน:</p><div className="mt-1 flex flex-wrap gap-1.5">{appliedItems.map(([key,label,value])=><span key={key} className="inline-flex max-w-full items-start gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"><span className="shrink-0 font-semibold text-slate-600">{label}:</span><span className="min-w-0 break-words">{value}</span></span>)}</div></div></div>
          <div className="flex shrink-0 gap-2"><button type="button" className={`${button} border-slate-300 text-slate-700 hover:bg-slate-100`} disabled={loading} onClick={()=>{const f=defaultSummaryFilters();visibilityRevision.current++;setDraft(f);setApplied(f);setShowUnranked(false);setDetail(null)}}>ล้างตัวกรอง</button><button type="button" className={`${button} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`} onClick={apply} disabled={loading}><Filter size={14}/>ใช้ตัวกรอง</button></div>
        </div>
      </div>
    </SimpleCard>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      {presentation?<p className="text-sm font-medium text-slate-700">ผลสรุป {applied.year_from}–{applied.year_to}</p>:<div className="flex gap-1">{[['overview','ภาพรวมผลงาน'],['faculty','บทบาทอาจารย์']].map(([v,label])=><button type="button" key={v} onClick={()=>{setView(v);setDetail(null)}} aria-pressed={view===v} className={`rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-300 ${view===v?'bg-blue-50 text-blue-700':'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}</div>}
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
      {presentation?<ScopusBenchmarkPresentation data={data} onDetail={openDetail}/>:view==='overview'?<>
        <div className="summary-paired-grid grid gap-4">
          <CountTable title="จำนวนผลงานตามปี" rows={data.yearly} total={data.total} onDetail={openDetail}/>
          <ReportPanel title="บทบาทอาจารย์ · COC" hint={[summaryHints.units,summaryHints.roles]} className="h-full">
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="summary-quartile-heading" className="text-base font-semibold text-slate-900">Quartile ตาม Category</h2><p className="mt-1 text-xs text-slate-500">{applied.year_from}–{applied.year_to} · {applied.quartile_mode==='t1'?'แยก T1':'Q1–Q4'}</p></div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-xs text-slate-600">ไม่ถูกนำมาจัดอันดับ<Hint label="การแสดงแถวที่ไม่ถูกนำมาจัดอันดับ" text={summaryHints.unrankedVisibility}/></span><div role="group" aria-label="แถวที่ไม่ถูกนำมาจัดอันดับ" className="inline-flex shrink-0">{[[false,'ซ่อน'],[true,'แสดง']].map(([value,label])=><button type="button" key={label} aria-pressed={showUnranked===value} disabled={confirmingVisibility} onClick={()=>changeUnrankedVisibility(value)} className={`border px-3 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg last:border-l-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${showUnranked===value?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{label}</button>)}</div></div>
              <div role="group" aria-label="มุมมองตาราง Quartile" className="inline-flex shrink-0">{[2,4].map(columns=><button type="button" key={columns} aria-pressed={quartileColumns===columns} onClick={()=>setQuartileColumns(columns)} className={`border px-3 py-2 text-sm font-medium first:rounded-l-lg last:rounded-r-lg last:border-l-0 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${quartileColumns===columns?'border-blue-500 bg-blue-50 text-blue-700':'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{columns} ตารางต่อแถว</button>)}</div>
            </div>
          </div>
          <div className="summary-quartile-grid grid gap-4" data-columns={quartileColumns}>
            {categories.map(([id,name])=>{const rows=data.quartiles.filter(r=>(r.category_id||0)===id);const visibleRows=showUnranked?rows:rows.filter(r=>r.quartile!=='not_applicable');const totalLabel=!showUnranked&&rows.some(r=>r.quartile==='not_applicable'&&r.thailand>0)?'รวมทุกประเภท':'รวม';return <CountTable key={id} title={name} rows={visibleRows} total={{...sumRows(rows,totalLabel),category_id:id}} quartile compactQuartile={quartileColumns===4} onDetail={openDetail}/>})}
          </div>
        </section>
      </>:<SimpleCard className="w-full" title={<Label hint={[summaryHints.units,summaryHints.roles,summaryHints.co,summaryHints.unknown]}>บทบาทรายอาจารย์</Label>}>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative w-full min-w-0 sm:w-64"><Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-3 text-slate-500"/><input aria-label="ค้นหาอาจารย์" placeholder="ค้นหาชื่อ / Scopus ID" value={search} onChange={e=>setSearch(e.target.value)} className={`${field} pl-9`}/></label>
          <select aria-label="เรียงอาจารย์" value={sort.key} onChange={e=>setSort({key:e.target.value,direction:['name','scopus_id'].includes(e.target.value)?'asc':'desc'})} className={`${field} sm:w-56`}>{[['total','จำนวนทั้งหมด'],['first','จำนวน First'],['corresponding','จำนวน Corresponding'],['lead','จำนวน First หรือ Corresponding'],['co','จำนวน Co-author'],['unknown','จำนวนยังระบุไม่ได้'],['first_pct','สัดส่วน First'],['corresponding_pct','สัดส่วน Corresponding'],['lead_pct','สัดส่วน First หรือ Corresponding'],['name','ชื่อ'],['scopus_id','Scopus ID']].map(([v,label])=><option key={v} value={v}>{label}</option>)}</select>
          <button type="button" role="switch" aria-checked={hideEmpty} onClick={()=>setHideEmpty(v=>!v)} className="inline-flex min-h-10 items-center gap-2.5 rounded-lg px-1 py-2 text-sm text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:ml-auto">
            <span aria-hidden="true" className={`inline-flex h-5 w-9 shrink-0 items-center rounded-full ${hideEmpty?'bg-blue-600':'bg-slate-400'}`}><span className={`h-4 w-4 rounded-full bg-white ${hideEmpty?'translate-x-4':'translate-x-1'}`}/></span>
            ซ่อนอาจารย์ที่ไม่มีผลงาน
          </button>
        </div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1000px] table-fixed border-collapse text-sm">
          <thead className="bg-blue-100 text-xs text-blue-900"><tr>
            <SummarySortHeader column="name" label="อาจารย์" sort={sort} onSort={column=>setSort(current=>nextSummarySort(current,column))} align="left" className="w-[22%] border border-slate-200 px-3 py-2 text-left"/>
            <SummarySortHeader column="scopus_id" label="Scopus ID" sort={sort} onSort={column=>setSort(current=>nextSummarySort(current,column))} align="left" className="w-[14%] border border-slate-200 px-3 py-2 text-left"/>
            <SummarySortHeader column="total" label="ทั้งหมด" sort={sort} onSort={column=>setSort(current=>nextSummarySort(current,column))} className="w-[7%] border border-slate-200 px-3 py-2 text-right"/>
            {[['first','First'],['corresponding','Corresponding'],['lead','First หรือ Corresponding'],['co','Co-author'],['unknown','ยังระบุไม่ได้']].map(([v,l])=><SummarySortHeader key={v} column={sort.key===`${v}_pct`?sort.key:v} label={<>{l}<span className="block text-xs font-normal">จำนวน / %</span></>} sortLabel={`${l}${sort.key===`${v}_pct`?' (สัดส่วน)':''}`} sort={sort} onSort={column=>setSort(current=>nextSummarySort(current,column))} className="border border-slate-200 px-3 py-2 text-right"/>)}
          </tr></thead>
          <tbody>{visibleFaculty.map((u,i)=><tr key={u.user_id} className={`border-b last:border-0 ${i%2 ? 'bg-slate-50' : 'bg-white'} hover:bg-blue-50`}>
            <th scope="row" className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-900">{u.name}</th>
            <td className="border border-slate-200 px-3 py-2 text-left tabular-nums text-slate-600">{u.linkable?u.scopus_id:<span className="inline-flex items-center gap-1">ไม่ระบุ<Hint label={`Scopus ID ${u.name}`} text={missingScopusIDHint}/></span>}</td>
            <td className="border border-slate-200 px-3 py-2 text-right"><CountButton value={u.linkable?u.total:null} onClick={()=>openDetail({level:'coc',user_id:u.user_id},u.name)}/></td>
            {['first','corresponding','lead','co','unknown'].map(role=><td key={role} className="border border-slate-200 px-3 py-2 text-right"><CountButton value={u.linkable?u[role]:null} onClick={()=>openDetail({level:'coc',user_id:u.user_id,role},`${u.name} · ${role}`)}/><span className="mt-1 block text-xs text-slate-500">{u.linkable?pct(u[`${role}_pct`]):'—'}</span></td>)}
          </tr>)}</tbody>
        </table></div>
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
        .summary-quartile-grid[data-columns="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }
    `}</style>
    {isActive&&detail&&<DocumentDialog state={detail} data={documents} loading={docLoading} error={docError} categories={options?.categories || []} quartileMode={applied.quartile_mode} onFilter={filters=>setDetail(d=>({...d,filters,page:1}))} onPage={page=>setDetail(d=>({...d,page}))} onClose={closeDetail}/>}
  </div>;
}
