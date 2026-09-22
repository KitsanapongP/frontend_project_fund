"use client";

import { formatCount, formatPct, shareOf } from "@/app/lib/scopus_benchmark_report.mjs";

const LEVEL_LABEL = { faculty: "คณะ", kku: "มหาวิทยาลัยขอนแก่น", thailand: "ประเทศไทย" };
const TIERS = [
  { key: "t1", label: "T1", color: "#1e3a8a" },
  { key: "q1", label: "Q1 (ไม่รวม T1)", color: "#2563eb" },
  { key: "q2", label: "Q2", color: "#60a5fa" },
  { key: "q3", label: "Q3", color: "#a5c8e0" },
  { key: "q4", label: "Q4", color: "#cbd5e1" },
];

// Journal-tier distribution as a horizontal stacked bar per level, with the counts
// listed and the unclassified/out-of-classification documents shown separately so
// the 100% never implies everything was classifiable (§5 F).
function QualityDistribution({ levels }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-slate-800">การกระจายกลุ่มวารสาร (เฉพาะผลงานที่จัดกลุ่มได้)</h3>
      <div className="space-y-4">
        {levels.map(({ key, level }) => {
          const q = level.quartile || {};
          const classified = TIERS.reduce((sum, tier) => sum + Number(q[tier.key] || 0), 0);
          const journalDocs = classified + Number(q.unclassified_journal || 0);
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span className={key === "faculty" ? "font-semibold text-blue-700" : ""}>{LEVEL_LABEL[key]}</span>
                <span className="tabular-nums text-slate-500">มีค่า CiteScore {formatCount(classified)}/{formatCount(journalDocs)} วารสาร</span>
              </div>
              {classified > 0 ? (
                <div className="flex h-5 w-full overflow-hidden rounded-sm" role="img" aria-label={`การกระจายกลุ่มวารสารของ${LEVEL_LABEL[key]}`}>
                  {TIERS.map((tier) => {
                    const value = Number(q[tier.key] || 0);
                    if (value <= 0) return null;
                    return <div key={tier.key} title={`${tier.label}: ${value}`} style={{ width: `${(value / classified) * 100}%`, backgroundColor: tier.color }} />;
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">ไม่มีวารสารที่จัดกลุ่มได้</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500 tabular-nums">
                {TIERS.map((tier) => (
                  <span key={tier.key} className="inline-flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-[1px]" style={{ backgroundColor: tier.color }} aria-hidden="true" />
                    {tier.label} {formatCount(Number(q[tier.key] || 0))}
                  </span>
                ))}
              </div>
              {/* Missing journal metadata vs non-journal work vs unresolved type are
                  shown separately so coverage is honest (§5 F / §9 B). */}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 tabular-nums">
                <span>วารสารยังไม่มีค่า CiteScore {formatCount(Number(q.unclassified_journal || 0))}</span>
                <span>· ไม่ใช่วารสาร (คอนเฟอเรนซ์/หนังสือ) {formatCount(Number(q.excluded_non_journal || 0))}</span>
                {Number(q.unresolved || 0) > 0 && <span>· ระบุประเภทไม่ได้ {formatCount(Number(q.unresolved || 0))}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Document type as counts + share (§5 F) — a table, not a national-scale chart.
function DocTypeTable({ levels }) {
  const types = [
    { key: "article", label: "Article" },
    { key: "conference", label: "Conference" },
    { key: "other", label: "Other" },
  ];
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-slate-800">ประเภทผลงาน</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th scope="col" className="py-2 pr-3 text-left font-medium">ประเภท</th>
              {levels.map(({ key }) => (
                <th key={key} scope="col" className="py-2 pr-3 text-right font-medium">{LEVEL_LABEL[key]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <tr key={type.key} className="border-b border-slate-100">
                <th scope="row" className="py-2 pr-3 text-left font-normal text-slate-700">{type.label}</th>
                {levels.map(({ key, level }) => {
                  const value = Number(level.doctypes?.[type.key] || 0);
                  const share = shareOf(value, level.docs);
                  return (
                    <td key={key} className="py-2 pr-3 text-right text-slate-900">
                      {formatCount(value)} <span className="text-[11px] text-slate-500">({formatPct(share)})</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function QualityTypeDetails({ insights }) {
  const levels = ["faculty", "kku", "thailand"]
    .map((key) => ({ key, level: insights?.levels?.[key] }))
    .filter(({ level }) => level?.available);

  return (
    <details className="border-b border-slate-200 py-5">
      <summary className="cursor-pointer text-sm font-medium text-slate-700">รายละเอียดคุณภาพวารสารและประเภทผลงาน</summary>
      {levels.length ? (
        <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <QualityDistribution levels={levels} />
          <DocTypeTable levels={levels} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">ยังไม่มีข้อมูลเชิงลึกสำหรับปีนี้</p>
      )}
    </details>
  );
}
