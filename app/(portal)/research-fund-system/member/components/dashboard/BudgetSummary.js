// dashboard/BudgetSummary.js
"use client";

import { DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react";

export default function BudgetSummary({ budget }) {
  const total = Number(budget?.total ?? budget?.total_budget ?? 0);
  const used = Number(budget?.thisYear ?? budget?.used ?? budget?.used_budget ?? 0);
  const remaining = Number.isFinite(Number(budget?.remaining))
    ? Number(budget?.remaining)
    : Math.max(total - used, 0);

  const safeTotal = total >= 0 ? total : 0;
  const safeUsed = used >= 0 ? used : 0;
  const safeRemaining = remaining >= 0 ? remaining : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
  };

  const percentageUsed = safeTotal > 0
    ? ((safeUsed / safeTotal) * 100).toFixed(1)
    : 0;

  const percentageRemaining = safeTotal > 0
    ? ((safeRemaining / safeTotal) * 100).toFixed(1)
    : 0;

  const budgetItems = [
    {
      label: "งบประมาณที่ขอทั้งหมด",
      value: formatCurrency(safeTotal),
      icon: DollarSign,
      bgColor: "bg-slate-50",
      borderColor: "border-slate-200",
      textColor: "text-slate-900",
      iconColor: "text-slate-600"
    },
    {
      label: "ใช้ไปในปีนี้",
      value: formatCurrency(safeUsed),
      icon: TrendingDown,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      iconColor: "text-blue-500",
      percentage: `${percentageUsed}%`
    },
    {
      label: "คงเหลือสำหรับปีนี้",
      value: formatCurrency(safeRemaining),
      icon: TrendingUp,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      iconColor: "text-green-500",
      percentage: `${percentageRemaining}%`
    }
  ];

  return (
    <div className="space-y-4">
      {/* Budget Items */}
      {budgetItems.map((item, index) => (
        <div
          key={index}
          className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${item.bgColor} ${item.borderColor}`}
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bgColor}`}>
              <item.icon size={20} className={item.iconColor} />
            </div>
            <div>
              <p className="text-sm text-slate-600">{item.label}</p>
              {item.percentage && (
                <p className="text-xs text-slate-500">{item.percentage} ของทั้งหมด</p>
              )}
            </div>
          </div>
          <span className={`font-bold text-lg ${item.textColor}`}>
            {item.value}
          </span>
        </div>
      ))}

      {/* Visual Progress Bar */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">การใช้งบประมาณ</span>
          <span className="text-sm text-slate-600">{percentageUsed}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full flex">
            <div 
              className="bg-blue-500 transition-all duration-500"
              style={{ width: `${percentageUsed}%` }}
            />
            <div 
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${percentageRemaining}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="text-blue-600">ใช้ไป: {percentageUsed}%</span>
          <span className="text-green-600">คงเหลือ: {percentageRemaining}%</span>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
        <div className="flex items-center gap-2 mb-2">
          <PieChart size={20} />
          <h4 className="font-semibold">สรุปการใช้งบประมาณ</h4>
        </div>
        <p className="text-sm text-blue-800">
          คุณได้ใช้งบประมาณไปแล้ว {percentageUsed}% จากงบประมาณทั้งหมดที่ได้รับ
        </p>
      </div>
    </div>
  );
}
