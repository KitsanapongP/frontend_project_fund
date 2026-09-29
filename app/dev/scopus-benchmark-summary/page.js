"use client";

// Development-only UI integration harness. All numbers and names are fixtures.
import { useMemo, useState } from 'react';
import { notFound } from 'next/navigation';
import AdminScopusBenchmark from '../../(portal)/research-fund-system/admin/components/research/AdminScopusBenchmark';
import { buildApi } from '../scopus-benchmark-report/fixtures.mjs';
import { makeSummaryFixtureAPI } from './fixtures.mjs';

export default function SummaryHarness() {
  const [calls,setCalls]=useState({});const [scenario,setScenario]=useState('normal');
  const api=useMemo(()=>{
    const original={...buildApi('normal'),...makeSummaryFixtureAPI(scenario),
      listScopes:async()=>({data:[{id:1,code:'university_kku',level:'university',label:'KKU fixture',af_id:'60017165'},{id:2,code:'country_thailand',level:'country',label:'Thailand fixture',affil_country:'Thailand'}]}),
      listRuns:async()=>({data:[]}),refreshCounts:async()=>({data:[]}),
    };
    return Object.fromEntries(Object.entries(original).map(([name,fn])=>[name,(...args)=>{setCalls(c=>({...c,[name]:(c[name]||0)+1}));return fn(...args)}]));
  },[scenario]);
  if(process.env.NODE_ENV==='production')return notFound();
  return <div className="min-h-screen bg-slate-50 p-6"><div className="mx-auto mb-4 max-w-7xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm"><b>ทดสอบ UI เท่านั้น — ข้อมูลสมมติ ไม่เรียก Scopus/DB</b><div className="mt-2 flex gap-2">{[['normal','ปกติ'],['partial','ข้อมูลขาด'],['error','API ผิดพลาด'],['revision','Excel revision เปลี่ยน']].map(([v,label])=><button className="rounded border bg-white px-2 py-1" key={v} onClick={()=>{setCalls({});setScenario(v)}}>{label}</button>)}</div><pre aria-label="จำนวน request" className="mt-2 whitespace-pre-wrap">{JSON.stringify(calls)}</pre></div><div className="mx-auto max-w-7xl"><AdminScopusBenchmark key={scenario} api={api}/></div></div>;
}
