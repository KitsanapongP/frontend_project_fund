"use client";

import { FileText, CheckCircle2, Clock } from "lucide-react";
import { formatNumber } from "@/app/utils/format";

// การ์ดภาพรวมคำร้องของผู้ใช้ (ใช้ข้อมูลจาก dashboard stats ที่หน้าโปรไฟล์ดึงมาแล้ว)
export default function MemberSubmissionOverview({
  total = 0,
  approved = 0,
  pending = 0,
  successRate = 0,
  approvedBudget = 0,
}) {
  const stats = [
    { label: "คำร้องทั้งหมด", value: formatNumber(total || 0), Icon: FileText, iconClass: "text-blue-600", tileClass: "border-blue-100 bg-blue-50" },
    { label: "อนุมัติแล้ว", value: formatNumber(approved || 0), Icon: CheckCircle2, iconClass: "text-green-600", tileClass: "border-green-100 bg-green-50" },
    { label: "รออนุมัติ", value: formatNumber(pending || 0), Icon: Clock, iconClass: "text-amber-600", tileClass: "border-amber-100 bg-amber-50" },
  ];

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-800">คำร้องของฉัน</h2>
      <div className="mt-3 flex flex-1 items-center">
        <div className="grid w-full grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-lg border px-2.5 py-2 ${s.tileClass}`}>
              <div className="flex items-center gap-1.5">
                <s.Icon className={`h-4 w-4 shrink-0 ${s.iconClass}`} />
                <span className="text-xl font-bold leading-tight text-slate-900">{s.value}</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
