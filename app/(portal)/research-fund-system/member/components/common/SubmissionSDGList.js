"use client";

import { Globe2 } from "lucide-react";

const resolveItems = (submission, detail) => {
  const candidates = [submission?.sdgs, submission?.submission_sdgs, detail?.sdgs, detail?.submission_sdgs];
  return candidates.find(Array.isArray) || [];
};

export default function SubmissionSDGList({ submission, detail, className = "mt-6 mb-6" }) {
  const items = resolveItems(submission, detail);
  return (
    <section className={`rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 ${className}`}>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700">
          <Globe2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-emerald-950">เป้าหมายการพัฒนาที่ยั่งยืน (SDGs)</h2>
          <p className="text-xs text-emerald-800">เป้าหมายที่สอดคล้องกับผลงานหรือโครงการ</p>
        </div>
      </div>

      {items.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item, index) => (
            <article key={item.submission_sdg_id ?? item.sdg_id ?? index} className="rounded-lg border border-emerald-200 bg-white p-3.5">
              <h3 className="text-sm font-semibold text-emerald-800">
                SDG {item.sdg_number ?? item.sdg_number_snapshot}: {item.name_th ?? item.name_th_snapshot}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{item.name_en ?? item.name_en_snapshot}</p>
              {(item.description_th ?? item.description_th_snapshot) ? (
                <p className="mt-2 text-xs leading-relaxed text-slate-600">
                  {item.description_th ?? item.description_th_snapshot}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-emerald-800">ไม่ได้ระบุ SDG สำหรับบทความนี้</p>
      )}
    </section>
  );
}
