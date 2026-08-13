"use client";

import { useEffect, useState } from "react";
import { Globe2, Loader2 } from "lucide-react";
import sdgAPI from "@/app/lib/sdg_api";

export default function SDGSelector({ value = [], onChange, disabled = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const selectedId = Array.isArray(value) && value.length > 0 ? Number(value[0]) : "";

  useEffect(() => {
    let cancelled = false;
    sdgAPI.listActive()
      .then((list) => { if (!cancelled) setItems(list); })
      .catch((err) => { if (!cancelled) setError(err?.message || "ไม่สามารถโหลดรายการ SDG ได้"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selectSDG = (event) => {
    if (disabled) return;
    const id = Number(event.target.value);
    onChange?.(Number.isInteger(id) && id > 0 ? [id] : []);
  };

  return <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
    <div className="mb-3 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100"><Globe2 className="h-5 w-5 text-emerald-700" /></div>
      <div><h3 className="font-semibold text-gray-800">เป้าหมายการพัฒนาที่ยั่งยืน (SDGs)</h3><p className="text-xs text-gray-600">เลือกเป้าหมายหลักที่ผลงานหรือโครงการของคุณสอดคล้อง 1 เป้าหมาย</p></div>
    </div>
    {loading ? <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" />กำลังโหลดรายการ SDG...</div> : error ? <p className="text-sm text-red-600">{error}</p> : <select value={selectedId} onChange={selectSDG} disabled={disabled} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500">
      <option value="">เลือกเป้าหมาย SDG</option>
      {items.map((item) => <option key={item.sdg_id} value={item.sdg_id}>SDG {item.sdg_number}: {item.name_th} ({item.name_en})</option>)}
    </select>}
  </section>;
}
