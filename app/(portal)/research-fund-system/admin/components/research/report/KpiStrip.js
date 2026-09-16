"use client";

// KPI strip (§5 B): one row of four columns separated by thin vertical rules on
// desktop, 2×2 with horizontal rules on mobile. No per-card borders, no icon
// containers, no per-KPI colours. Faculty figures only — KKU/country are context.
function Kpi({ label, value, unit, sublines }) {
  return (
    <div className="flex flex-col px-0 sm:px-5">
      <div className="text-sm leading-snug text-slate-500">{label}</div>
      <div className="mt-1.5 text-[33px] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">
        {value}
        {unit ? <span className="ml-1.5 text-sm font-normal text-slate-500">{unit}</span> : null}
      </div>
      <div className="mt-2.5 space-y-0.5">
        {sublines.map((line, index) => (
          <div key={index} className="text-[13px] leading-snug text-slate-500 tabular-nums">{line}</div>
        ))}
      </div>
    </div>
  );
}

export default function KpiStrip({ items }) {
  return (
    <section
      aria-label="ตัวชี้วัดหลักของคณะ"
      className="grid grid-cols-2 gap-x-0 gap-y-6 border-b border-slate-200 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-slate-200"
    >
      {items.map((item, index) => (
        <Kpi key={index} {...item} />
      ))}
    </section>
  );
}
