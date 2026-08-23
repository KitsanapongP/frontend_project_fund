"use client";

// dashboard/StatCard.js
import { useMemo } from "react";
import { FileText, TrendingUp, Calendar, DollarSign, AlertCircle, RefreshCcw } from "lucide-react";
import { useStatusMap } from "@/app/hooks/useStatusMap";

const STATUS_CARD_STYLES = {
  approved: { panel: "border-green-200 bg-green-50", iconTone: "bg-green-100 text-green-700", icon: TrendingUp },
  pending: { panel: "border-amber-200 bg-amber-50", iconTone: "bg-amber-100 text-amber-700", icon: Calendar },
  rejected: { panel: "border-red-200 bg-red-50", iconTone: "bg-red-100 text-red-700", icon: AlertCircle },
  revision: { panel: "border-amber-200 bg-amber-50", iconTone: "bg-amber-100 text-amber-700", icon: RefreshCcw },
  draft: { panel: "border-slate-200 bg-slate-50", iconTone: "bg-slate-200 text-slate-700", icon: FileText },
};

export default function StatCard({ stats }) {
  const { statuses } = useStatusMap();

  const statusCards = useMemo(() => {
    if (!Array.isArray(statuses) || !stats?.myApplications) {
      return [];
    }

    return statuses
      .map((status) => {
        const count = stats.myApplications[status.status_code];
        if (typeof count !== "number") {
          return null;
        }

        const style = STATUS_CARD_STYLES[status.status_code] || {
          panel: "border-slate-200 bg-slate-50",
          iconTone: "bg-slate-200 text-slate-700",
          icon: FileText,
        };

        return {
          number: count,
          label: status.status_name,
          panel: style.panel,
          iconTone: style.iconTone,
          icon: style.icon,
        };
      })
      .filter(Boolean);
  }, [statuses, stats?.myApplications]);

  const cards = [
    {
      number: stats.myApplications.total,
      label: "คำร้องทั้งหมดของฉัน",
      panel: "border-blue-200 bg-blue-50",
      iconTone: "bg-blue-100 text-blue-700",
      icon: FileText,
    },
    ...statusCards,
    {
      number: `${stats.budgetUsed.thisYear.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}฿`,
      label: "งบประมาณที่ได้รับปีนี้",
      panel: "border-green-200 bg-green-50",
      iconTone: "bg-green-100 text-green-700",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`flex min-h-36 flex-col justify-between rounded-xl border p-5 ${card.panel}`}
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconTone}`}>
            <card.icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="mt-5">
            <div className="text-3xl font-semibold tabular-nums text-slate-950">{card.number}</div>
            <div className="mt-1 text-sm text-slate-600">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
