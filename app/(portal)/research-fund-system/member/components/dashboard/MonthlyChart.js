// dashboard/MonthlyChart.js
"use client";

import { BarChart3, TrendingUp } from "lucide-react";

export default function MonthlyChart({ data = [] }) {
  const normalizedData = (Array.isArray(data) ? data : []).map((item) => ({
    month: item?.month ?? "",
    applications: Number(item?.applications ?? item?.total_applications ?? 0),
    approved: Number(item?.approved ?? 0),
  }));

  const maxValue = normalizedData.length > 0
    ? Math.max(...normalizedData.map((d) => d.applications))
    : 0;
  const scale = maxValue > 0 ? 200 / maxValue : 1;

  const totalApplications = normalizedData.reduce((sum, item) => sum + item.applications, 0);
  const totalApproved = normalizedData.reduce((sum, item) => sum + item.approved, 0);
  const approvalRate = totalApplications > 0
    ? ((totalApproved / totalApplications) * 100).toFixed(1)
    : 0;

  return (
    <div>
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          <span className="text-sm text-slate-600">
            ข้อมูล 6 เดือนล่าสุด
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={16} className="text-green-600" />
          <span className="text-slate-600">
            อัตราอนุมัติ: <span className="font-semibold text-green-600">{approvalRate}%</span>
          </span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-around px-2">
          {normalizedData.map((stat, index) => (
            <div key={index} className="flex flex-col items-center flex-1 mx-1">
              {/* Values on top of bars */}
              <div className="mb-2 text-center">
                <div className="text-xs font-semibold text-slate-700">
                  {stat.applications}
                </div>
                <div className="text-xs text-green-600">
                  ({stat.approved})
                </div>
              </div>
              
              {/* Bars */}
              <div className="relative w-full flex flex-col items-center">
                {/* Total Applications Bar */}
                <div 
                  className="w-12 bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600 relative group"
                  style={{ height: `${stat.applications * scale}px` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    ยื่นคำร้อง: {stat.applications}
                  </div>
                </div>
                
                {/* Approved Bar (overlay) */}
                <div 
                  className="w-12 bg-green-500 absolute bottom-0 rounded-b-md transition-all duration-500 hover:bg-green-600 group"
                  style={{ height: `${stat.approved * scale}px` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    อนุมัติ: {stat.approved}
                  </div>
                </div>
              </div>
              
              {/* Month Label */}
              <span className="mt-2 text-xs font-medium text-slate-600">
                {stat.month}
              </span>
            </div>
          ))}
        </div>

        {/* Y-axis grid lines */}
        <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
          {[0, 25, 50, 75, 100].map((percentage) => (
            <div
              key={percentage}
              className="border-t border-dashed border-slate-200"
              style={{ height: `${percentage}%` }}
            >
              <span className="absolute left-0 -mt-2 text-xs text-slate-400">
                {Math.round((maxValue * percentage) / 100)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-slate-600">ยื่นคำร้อง</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm text-slate-600">อนุมัติ</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{totalApplications}</p>
          <p className="text-xs text-slate-600">คำร้องทั้งหมด</p>
        </div>
        <div className="border-x border-slate-200 text-center">
          <p className="text-2xl font-bold text-green-600">{totalApproved}</p>
          <p className="text-xs text-slate-600">อนุมัติ</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{approvalRate}%</p>
          <p className="text-xs text-slate-600">อัตราอนุมัติ</p>
        </div>
      </div>
    </div>
  );
}
