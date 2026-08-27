"use client";

import { formatThaiDateTime } from "@/app/utils/format";
import { CalendarClock } from "lucide-react";

const STATUS_LABELS = {
  open: { label: "กำลังเปิดรับ", className: "border-green-200 bg-green-50 text-green-700" },
  not_yet: { label: "ยังไม่เปิดรับ", className: "border-blue-200 bg-blue-50 text-blue-700" },
  closed: { label: "เลยกำหนด", className: "border-red-200 bg-red-50 text-red-700" },
};

function formatRemainingDays(days) {
  if (!Number.isFinite(days)) return "ไม่มีกำหนด";
  if (days < 0) return `เกินกำหนด ${Math.abs(days)} วัน`;
  if (days === 0) return "ปิดรับวันนี้";
  if (days === 1) return "เหลือ 1 วัน";
  return `เหลือ ${days} วัน`;
}

export default function UpcomingDeadlines({ periods = [] }) {
  const items = Array.isArray(periods) ? periods.slice(0, 5) : [];

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        ยังไม่มีรอบตัดรับทุนที่กำลังจะมาถึง
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {items.map((period) => {
        const key = `${period.year || ""}-${period.installment || period.name}-${period.fund_keyword || period.name || ""}`;
        const statusMeta = STATUS_LABELS[period.status] || STATUS_LABELS.open;
        const remainingLabel = formatRemainingDays(Number(period.days_remaining));
        const cutoffLabel = formatThaiDateTime(period.cutoff_datetime || period.cutoff_date);

        return (
          <div
            key={key}
            className="py-4 first:pt-0 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                <CalendarClock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{period.name || `รอบที่ ${period.installment}`}</p>
                    <p className="text-xs text-slate-500">ปีงบประมาณ {period.year || "-"}</p>
                  </div>
                  <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-semibold ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-3 text-sm text-slate-600">
                  <p>ปิดรับ {cutoffLabel}</p>
                  <p className="mt-0.5 text-xs font-medium text-amber-700">{remainingLabel}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
