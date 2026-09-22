"use client";

import { useEffect, useState } from "react";
import { Award, BookOpen, Quote } from "lucide-react";
import memberAPI from "@/app/lib/member_api";
import { formatNumber } from "@/app/utils/format";

// การ์ดภาพรวมผลงาน Scopus แบบกระชับ (H-index / จำนวนผลงาน / การอ้างอิงรวม) — ค่าสะสมทั้งอาชีพ (ช่วงปีเต็ม)
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
    { label: "H-index", value: data ? formatNumber(data.h_index) : "-", Icon: Award, iconClass: "text-blue-600", tileClass: "border-blue-100 bg-blue-50" },
    { label: "ผลงาน (Scopus)", value: data ? formatNumber(data.document_count) : "-", Icon: BookOpen, iconClass: "text-slate-500", tileClass: "border-slate-200 bg-slate-50" },
    { label: "การอ้างอิงรวม", value: data ? formatNumber(data.citation_total) : "-", Icon: Quote, iconClass: "text-slate-500", tileClass: "border-slate-200 bg-slate-50" },
  ];

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">ภาพรวมผลงาน (Scopus)</h2>
      {data?.available_year_min != null && (
        <p className="mt-0.5 text-xs text-slate-500">
          ช่วงปีผลงาน (พ.ศ.): {data.available_year_min + 543}–{data.available_year_max + 543}
        </p>
      )}
      {noScopus ? (
        <p className="mt-3 flex flex-1 items-center text-sm text-slate-500">
          ยังไม่ได้เชื่อม Scopus ID — โปรดติดต่อผู้ดูแลระบบหรือเจ้าหน้าที่กองทุนวิจัยเพื่อเชื่อมบัญชีของคุณ
        </p>
      ) : (
        <div className="mt-3 flex flex-1 items-center">
          <div className="grid w-full grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className={`rounded-lg border px-2.5 py-2 ${s.tileClass}`}>
                <div className="flex items-center gap-1.5">
                  <s.Icon className={`h-4 w-4 shrink-0 ${s.iconClass}`} />
                  <span className="text-xl font-bold leading-tight text-slate-900">{loading ? "…" : s.value}</span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
