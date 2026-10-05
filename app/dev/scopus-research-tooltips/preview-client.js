"use client";
import { useMemo, useState } from 'react';
import AdminScopusResearchDashboard from '../../(portal)/research-fund-system/admin/components/research/AdminScopusResearchDashboard';
import { makeResearchTooltipAPIs } from './fixtures.mjs';
import Hint from '../../(portal)/research-fund-system/admin/components/research/report/Hint';
export default function Preview() {
  const [calls,setCalls]=useState([]);
  const apis=useMemo(()=>makeResearchTooltipAPIs((method,query)=>setCalls(previous=>[...previous,{method,query}])),[]);
  return <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6"><div className="mx-auto max-w-7xl">
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><h1 className="font-semibold">ทดสอบ UI ทั้งหน้า — ข้อมูลสมมติ ไม่เรียก Scopus หรือฐานข้อมูล</h1><p>ใช้ส่วนประกอบจริงของแดชบอร์ดงานวิจัย ชุดข้อมูลกราฟ H-index เป็นตัวอย่างแยกสำหรับทดสอบการใช้งาน</p><pre className="sr-only" aria-label="คำขอทดสอบทั้งหน้า">{JSON.stringify(calls)}</pre><details className="mt-2"><summary>ทดสอบรูปแบบข้อความเดิม</summary><Hint label="ข้อความอธิบายรูปแบบเดิม" text={'ข้อความเดิม <b>ยังเป็นข้อความธรรมดา</b>\nรองรับคำอธิบายหลายบรรทัด'}/></details></div>
    <AdminScopusResearchDashboard {...apis}/>
  </div></main>;
}
