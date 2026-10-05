"use client";

// Development-only UI integration harness. All numbers and names are fixtures.
import { useMemo, useRef, useState } from 'react';
import { notFound } from 'next/navigation';
import AdminScopusBenchmark from '../../(portal)/research-fund-system/admin/components/research/AdminScopusBenchmark';
import { buildApi } from '../scopus-benchmark-report/fixtures.mjs';
import { makeSummaryFixtureAPI } from './fixtures.mjs';

export default function SummaryHarness() {
  const [calls,setCalls]=useState({});const [scenario,setScenario]=useState('normal');
  const [events,setEvents]=useState([]),[mounted,setMounted]=useState(true);const held=useRef([]);
  const api=useMemo(()=>{
    const original={...buildApi('normal'),...makeSummaryFixtureAPI(scenario),
      listScopes:async()=>({data:[{id:1,code:'university_kku',level:'university',label:'KKU fixture',af_id:'60017165'},{id:2,code:'country_thailand',level:'country',label:'Thailand fixture',affil_country:'Thailand'}]}),
      listRuns:async()=>({data:[]}),refreshCounts:async()=>({data:[]}),
    };
    let failed=false;
    return Object.fromEntries(Object.entries(original).map(([name,fn])=>[name,(...args)=>{
      setCalls(c=>({...c,[name]:(c[name]||0)+1}));
      const log=phase=>setEvents(list=>[...list,{method:name,phase,query:args[0]?.signal?null:args[0]}]);
      const signal=args.find(arg=>arg?.signal)?.signal;
      signal?.addEventListener('abort',()=>log('aborted'),{once:true});
      const perform=async()=>{
        if(scenario==='retry'&&name==='summary'&&!failed){failed=true;log('failed');throw new Error('จำลองข้อผิดพลาดครั้งแรก');}
        const result=await fn(...args);log('completed');return result;
      };
      // Ignore aborted signals on purpose: stale-generation guards must still work.
      if(scenario==='held'&&['summaryOptions','summary','summaryFaculty','summaryDocuments','comparison','insights'].includes(name))return new Promise((resolve,reject)=>held.current.push(()=>perform().then(resolve,reject)));
      return perform();
    }]));
  },[scenario]);
  if(process.env.NODE_ENV==='production')return notFound();
  return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mb-4 max-w-7xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"><b>ทดสอบ UI เท่านั้น — ข้อมูลสมมติ ไม่เรียก Scopus/DB</b><div className="mt-2 flex gap-2">{[['normal','ปกติ'],['partial','ข้อมูลขาด'],['error','API ผิดพลาด'],['revision','Excel revision เปลี่ยน'],['held','พักคำขอ / ทดสอบสลับแท็บ'],['retry','ผิดพลาดครั้งแรก / ลองใหม่']].map(([v,label])=><button className="rounded border bg-white px-2 py-1" key={v} onClick={()=>{held.current.splice(0).forEach(release=>release());setCalls({});setEvents([]);setMounted(true);setScenario(v)}}>{label}</button>)}</div><button type="button" className="rounded border bg-white px-2 py-1" onClick={()=>held.current.splice(0).forEach(release=>release())}>ปล่อยคำขอที่ค้าง</button><button type="button" className="ml-2 rounded border bg-white px-2 py-1" onClick={()=>setMounted(value=>!value)}>{mounted?'ปิดหน้า Benchmark':'กลับหน้า Benchmark'}</button><pre aria-label="เหตุการณ์ request" className="sr-only">{JSON.stringify(events)}</pre><pre aria-label="จำนวน request" className="mt-2 whitespace-pre-wrap">{JSON.stringify(calls)}</pre></div><div className="mx-auto max-w-7xl">{mounted&&<AdminScopusBenchmark key={scenario} api={api}/>}</div></div>;
}
