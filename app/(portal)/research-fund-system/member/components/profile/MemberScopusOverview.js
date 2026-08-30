"use client";

import { useEffect, useState } from "react";
import memberAPI from "@/app/lib/member_api";
import { formatNumber } from "@/app/utils/format";

// การ์ดภาพรวมผลงาน Scopus แบบกระชับ (h-index / จำนวนผลงาน / การอ้างอิงรวม) — ค่าสะสมทั้งอาชีพ (ช่วงปีเต็ม)
export default function MemberScopusOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noScopus, setNoScopus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await memberAPI.getMyHIndexGraph({}); // ไม่กรองปี = ค่าสะสมทั้งอาชีพ
        const g = res?.data || null;
        if (cancelled) return;
        setData(g);
        setNoScopus(g == null);
      } catch (_) {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = [
    { label: "h-index", value: data ? formatNumber(data.h_index) : "-", accent: true },
    { label: "ผลงาน (Scopus)", value: data ? formatNumber(data.document_count) : "-" },
    { label: "การอ้างอิงรวม", value: data ? formatNumber(data.citation_total) : "-" },
  ];

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-slate-800">ภาพรวมผลงาน (Scopus)</h2>
      {noScopus ? (
        <p className="mt-4 flex-1 text-sm text-slate-500">
          ยังไม่ได้เชื่อม Scopus ID — โปรดติดต่อผู้ดูแลระบบหรือเจ้าหน้าที่กองทุนวิจัยเพื่อเชื่อมบัญชีของคุณ
        </p>
      ) : (
        <div className="mt-4 grid flex-1 grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border p-3 ${
                s.accent ? "border-blue-100 bg-blue-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="text-2xl font-bold text-slate-900">{loading ? "…" : s.value}</div>
              <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {data?.available_year_min != null && (
        <p className="mt-3 text-xs text-slate-500">
          ช่วงปีผลงาน (พ.ศ.): {data.available_year_min + 543}–{data.available_year_max + 543}
        </p>
      )}
    </section>
  );
}
