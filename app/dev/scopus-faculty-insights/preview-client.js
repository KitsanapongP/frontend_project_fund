"use client";

import { useMemo, useState } from 'react';
import AdminScopusFacultyInsights from '../../(portal)/research-fund-system/admin/components/research/AdminScopusFacultyInsights';
import SimpleCard from '../../components/research-fund/common/SimpleCard';
import { makeFacultyFixtureAPI } from './fixtures.mjs';

export default function FacultyInsightsPreview() {
  const [scenario, setScenario] = useState('normal'), [calls, setCalls] = useState([]), [draft, setDraft] = useState('all'), [appliedQuery, setAppliedQuery] = useState({ scope: 'faculty', open_access_mode: 'all' });
  const api = useMemo(() => makeFacultyFixtureAPI(scenario, (method, query) => setCalls(list => [...list.slice(-5), { method, ...query }])), [scenario]);
  return <main className="min-h-screen bg-slate-100 px-3 py-6 sm:px-6"><div className="mx-auto max-w-7xl space-y-6">
    <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><h1 className="font-bold">ทดสอบ UI เท่านั้น — ข้อมูลสมมติ {scenario === 'role_example' ? 226 : 512} ผลงาน ไม่เรียก Scopus/ฐานข้อมูล</h1><p>หน้าตรวจสำหรับนักพัฒนา ไม่ใช่ข้อมูลจริงและไม่เปิดใช้ใน production</p>
      <div className="flex flex-wrap gap-2">{[['normal', 'ปกติ'], ['unknown', 'ประเทศไม่ทราบ'], ['domestic', 'ไม่มีต่างประเทศ'], ['empty', 'ว่าง'], ['role_example', 'ตัวอย่าง 226 ผลงาน'], ['full_circle', 'บทบาทเดียวทั้งวง'], ['error', 'ไม่พร้อมใช้ (503)'], ['page_error', 'หน้าถัดไปผิดพลาด'], ['revision', 'ข้อมูลเปลี่ยน (409)'], ['slow', 'โหลดช้า / ทดสอบ race']].map(([key, label]) => <button type="button" key={key} aria-pressed={scenario === key} className={`rounded-lg border px-3 py-2 ${scenario === key ? 'border-blue-700 bg-blue-700 text-white' : 'border-amber-300 bg-white'}`} onClick={() => { setScenario(key); setCalls([]); }}>{label}</button>)}</div>
      <div className="flex flex-wrap items-center gap-3"><label>ตัวกรองร่าง <select aria-label="ช่วงปีร่าง" className="rounded border bg-white px-3 py-2" value={draft} onChange={e => setDraft(e.target.value)}><option value="all">ทุกปี</option><option value="2567">2567</option><option value="2568">2568</option><option value="2569">2569</option></select></label><button type="button" className="rounded border bg-white px-3 py-2" onClick={() => setAppliedQuery(draft === 'all' ? { scope: 'faculty', open_access_mode: 'all' } : { scope: 'faculty', open_access_mode: 'all', year_start_be: draft, year_end_be: draft })}>ใช้ตัวกรอง</button><span>ตัวกรองที่ใช้: {appliedQuery.year_start_be || 'ทุกปี'}</span></div>
      <details><summary className="cursor-pointer">คำขอจากหน้าทดสอบ ({calls.length} ล่าสุด)</summary><pre aria-label="คำขอทดสอบ" className="max-h-48 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(calls, null, 2)}</pre></details>
    </div>
    <SimpleCard title="ประวัติควอไทล์ระดับคณะ (ตำแหน่งอ้างอิง · ข้อมูลสมมติ)"><p className="text-sm text-slate-500">ทั้ง 3 ส่วนใหม่อยู่ถัดจากการ์ดนี้และก่อน H-index</p></SimpleCard>
    <AdminScopusFacultyInsights appliedQuery={appliedQuery} api={api} />
    <SimpleCard title="H-index (ตำแหน่งอ้างอิง · ไม่เรียกข้อมูล)"><p className="text-sm text-slate-500">ส่วน H-index เดิม</p></SimpleCard>
  </div></main>;
}
