"use client";

import { useEffect, useState } from "react";
import { Check, Globe2, Loader2 } from "lucide-react";
import sdgAPI from "@/app/lib/sdg_api";

export default function SDGSelector({ value = [], onChange, disabled = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selected = new Set((Array.isArray(value) ? value : []).map(Number));

  useEffect(() => {
    let cancelled = false;
    sdgAPI.listActive()
      .then((list) => { if (!cancelled) setItems(list); })
      .catch((err) => { if (!cancelled) setError(err?.message || "ไม่สามารถโหลดรายการ SDG ได้"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggle = (id) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange?.(Array.from(next).sort((a, b) => a - b));
  };

  return <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
    <div className="mb-3 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100"><Globe2 className="h-5 w-5 text-emerald-700" /></div>
      <div><h3 className="font-semibold text-gray-800">เป้าหมายการพัฒนาที่ยั่งยืน (SDGs)</h3><p className="text-xs text-gray-600">เลือกเป้าหมายที่ผลงานหรือโครงการของคุณสอดคล้อง</p></div>
    </div>
    {loading ? <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />กำลังโหลดรายการ SDG...</div> : error ? <p className="text-sm text-red-600">{error}</p> : <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {items.map((item) => { const id = Number(item.sdg_id); const checked = selected.has(id); return <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${checked ? "border-emerald-400 bg-white shadow-sm" : "border-gray-200 bg-white/70 hover:border-emerald-300"} ${disabled ? "cursor-not-allowed opacity-70" : ""}`}><input type="checkbox" checked={checked} onChange={() => toggle(id)} disabled={disabled} className="sr-only" /><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white"}`}>{checked ? <Check size={14} /> : null}</span><span className="min-w-0"><span className="block text-sm font-medium text-gray-800">SDG {item.sdg_number}: {item.name_th}</span><span className="block text-xs text-gray-500">{item.name_en}</span></span></label>; })}
    </div>}
  </section>;
}
