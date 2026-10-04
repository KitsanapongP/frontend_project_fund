"use client";

import { useState } from 'react';
import AdminScopusFacultyInsights from '../../(portal)/research-fund-system/admin/components/research/AdminScopusFacultyInsights';

// Deliberately uses the component's default authenticated admin API wrappers.
// Point NEXT_PUBLIC_API_URL at the disposable native test server for local QA.
export default function NativeFacultyInsightsPreview() {
  const [draft, setDraft] = useState('all');
  const [appliedQuery, setAppliedQuery] = useState({ scope: 'faculty', open_access_mode: 'all' });
  return <main className="min-h-screen bg-slate-100 px-3 py-6 sm:px-6"><div className="mx-auto max-w-7xl space-y-6">
    <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <h1 className="font-bold">ตรวจ API จริงกับ MariaDB ภายในเครื่อง — ข้อมูลสมมติเท่านั้น</h1>
      <p>หน้าตรวจสำหรับนักพัฒนา ใช้ API ที่ยืนยันตัวตน ไม่มีข้อมูลสำรองจาก fixture และไม่เปิดใน production</p>
      <div className="flex flex-wrap items-center gap-3"><label>ตัวกรองร่าง <select aria-label="ช่วงปีร่าง" className="rounded border bg-white px-3 py-2" value={draft} onChange={event => setDraft(event.target.value)}><option value="all">ทุกปี</option><option value="2569">2569</option><option value="2566">2566 (ไม่มีข้อมูลสมมติ)</option></select></label>
        <button type="button" className="rounded border bg-white px-3 py-2" onClick={() => setAppliedQuery(draft === 'all' ? { scope: 'faculty', open_access_mode: 'all' } : { scope: 'faculty', open_access_mode: 'all', year_start_be: draft, year_end_be: draft })}>ใช้ตัวกรอง</button>
        <span>ตัวกรองที่ใช้: {appliedQuery.year_start_be || 'ทุกปี'}</span>
      </div>
    </div>
    <AdminScopusFacultyInsights appliedQuery={appliedQuery} />
  </div></main>;
}
