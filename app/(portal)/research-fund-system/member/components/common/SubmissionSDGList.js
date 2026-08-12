"use client";

import { Globe2 } from "lucide-react";

const resolveItems = (submission, detail) => {
  const candidates = [submission?.sdgs, submission?.submission_sdgs, detail?.sdgs, detail?.submission_sdgs];
  return candidates.find(Array.isArray) || [];
};

export default function SubmissionSDGList({ submission, detail, className = "mt-6 mb-6" }) {
  const items = resolveItems(submission, detail);
  return <section className={`rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100"><Globe2 className="h-5 w-5 text-emerald-700" /></div><div><h3 className="font-semibold text-gray-800">เป้าหมายการพัฒนาที่ยั่งยืน (SDGs)</h3><p className="text-xs text-gray-500">เป้าหมายที่สอดคล้องกับผลงานหรือโครงการ</p></div></div>
    {items.length ? <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{items.map((item, index) => <div key={item.submission_sdg_id ?? item.sdg_id ?? index} className="rounded-lg border border-emerald-100 bg-white p-3"><div className="text-sm font-semibold text-emerald-800">SDG {item.sdg_number ?? item.sdg_number_snapshot}: {item.name_th ?? item.name_th_snapshot}</div><div className="mt-1 text-xs text-gray-500">{item.name_en ?? item.name_en_snapshot}</div>{(item.description_th ?? item.description_th_snapshot) && <p className="mt-2 text-xs leading-relaxed text-gray-600">{item.description_th ?? item.description_th_snapshot}</p>}</div>)}</div> : <p className="text-sm text-gray-500">ไม่ได้ระบุ SDG สำหรับบทความนี้</p>}
  </section>;
}
