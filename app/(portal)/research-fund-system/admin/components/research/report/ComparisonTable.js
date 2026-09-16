"use client";

import { formatCount, formatPct, formatPoints, highTierShare, shareOf, isUsable, observedRate, canCompareMetric } from "@/app/lib/scopus_benchmark_report.mjs";

const LEVELS = ["faculty", "kku", "thailand"];

// A single data cell. Faculty (index 0) gets a faint blue tint to anchor the eye,
// matching the report's faculty accent, but never a "better"/green treatment.
function Cell({ children, sub, faculty }) {
  return (
    <td className={`border-b border-slate-200 px-3 py-3.5 text-right align-top tabular-nums ${faculty ? "bg-blue-50/60" : ""}`}>
      <div className="text-slate-900">{children}</div>
      {sub ? <div className="mt-0.5 text-[11px] font-normal text-slate-500">{sub}</div> : null}
    </td>
  );
}

// Comparison table (§5 E): the report year's metrics for คณะ / KKU / ประเทศไทย seen
// together, plus a คณะ-vs-KKU column. Citations live in the E2 section below, not
// here. Percentage gaps are in percentage points; the count column shows a share,
// not a raw count gap. Missing/partial states are shown in the cell itself.
export default function ComparisonTable({ reportYear, row, insights, scopeConsistent = true }) {
  const counts = { faculty: row?.faculty, kku: row?.university, thailand: row?.country };
  const level = (key) => insights?.levels?.[key];

  const htValue = (key) => highTierShare(level(key)?.quartile);
  const htSub = (key) => {
    const q = level(key)?.quartile;
    if (!q) return null;
    const classified = Number(q.t1 || 0) + Number(q.q1 || 0) + Number(q.q2 || 0) + Number(q.q3 || 0) + Number(q.q4 || 0);
    if (classified <= 0) return "ไม่มีวารสารที่จัดกลุ่มได้";
    return `${formatCount(Number(q.t1 || 0) + Number(q.q1 || 0) + Number(q.q2 || 0))} / ${formatCount(classified)} ที่จัดกลุ่มได้`;
  };
  // OA/intl use the SHARED observedRate helper (same numbers as KPI + CSV, R2-2):
  // positive/known, with unknown docs excluded from the denominator (§8).
  const rateValue = (key, which) => observedRate(level(key), which).value;
  const rateSub = (key, which) => {
    const lv = level(key);
    if (!lv?.available) return null;
    const r = observedRate(lv, which);
    if (r.known === null) return `จาก ${formatCount(lv.docs)} ผลงาน (observed)`;
    return `${formatCount(r.positive)}/${formatCount(r.known)} ที่ทราบ${r.unknown > 0 ? ` · ไม่ทราบ ${formatCount(r.unknown)}` : ""}`;
  };

  // The คณะเทียบ KKU gap is shown PER METRIC — only when that specific metric is
  // ready on BOTH คณะ and KKU (harvest complete AND that metric's metadata complete).
  // A metric with unknown OA / unclassified journals is withheld while others show (R2-1).
  const notReady = <span className="font-normal text-slate-400">ยังเทียบไม่ได้</span>;
  const gapAllowed = (metric) => scopeConsistent && canCompareMetric(level("faculty"), level("kku"), metric);
  const pointDiff = (metric, facultyValue, kkuValue) => {
    if (!gapAllowed(metric)) return notReady;
    return facultyValue === null || facultyValue === undefined || kkuValue === null || kkuValue === undefined ? "–" : formatPoints(facultyValue - kkuValue);
  };

  const anyGapWithheld = !scopeConsistent || ["quality", "intl", "oa"].some((m) => !canCompareMetric(level("faculty"), level("kku"), m));
  const reasons = Array.from(new Set([
    ...(level("faculty")?.readiness?.metrics ? Object.values(level("faculty").readiness.metrics).flatMap((m) => m.reasons || []) : []),
    ...(level("kku")?.readiness?.metrics ? Object.values(level("kku").readiness.metrics).flatMap((m) => m.reasons || []) : []),
  ]));

  const shareFacultyKku = shareOf(counts.faculty, counts.kku);

  const missing = <span className="font-normal text-slate-400">ยังไม่มีข้อมูล</span>;

  return (
    <section className="border-b border-slate-200 py-6" aria-label={`ตารางเปรียบเทียบปี ${reportYear}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">เปรียบเทียบปี {reportYear}</h2>
        <span className="text-xs text-slate-500">{scopeConsistent ? "ขอบเขต Computer Science เดียวกันทุกระดับ" : "ขอบเขตสามระดับไม่ตรงกัน — งดการเปรียบเทียบ"}</span>
      </div>
      <div className="overflow-x-auto">
        <p className="mb-2 text-[11px] text-slate-400 sm:hidden">เลื่อนแนวนอนเพื่อดูทุกคอลัมน์</p>
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <caption className="sr-only">เปรียบเทียบตัวชี้วัดของคณะ มหาวิทยาลัยขอนแก่น และประเทศไทย สำหรับปี {reportYear}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <th scope="col" className="px-3 py-2.5 text-left font-medium">ตัวชี้วัด</th>
              <th scope="col" className="bg-blue-50 px-3 py-2.5 text-right font-medium">คณะ</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">มหาวิทยาลัยขอนแก่น</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">ประเทศไทย</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">คณะเทียบ KKU</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="border-b border-slate-200 px-3 py-3.5 text-left font-normal text-slate-700">จำนวนผลงาน</th>
              <Cell faculty>{isUsable(counts.faculty) ? formatCount(counts.faculty) : missing}</Cell>
              <Cell>{isUsable(counts.kku) ? formatCount(counts.kku) : missing}</Cell>
              <Cell>{isUsable(counts.thailand) ? formatCount(counts.thailand) : missing}</Cell>
              <Cell>{!scopeConsistent ? notReady : shareFacultyKku === null ? "–" : `คิดเป็น ${formatPct(shareFacultyKku)}`}</Cell>
            </tr>
            <tr>
              <th scope="row" className="border-b border-slate-200 px-3 py-3.5 text-left font-normal text-slate-700">ผลงานในวารสารกลุ่ม T1–Q2</th>
              <Cell faculty sub={htSub("faculty")}>{htValue("faculty") === null ? missing : formatPct(htValue("faculty"))}</Cell>
              <Cell sub={htSub("kku")}>{htValue("kku") === null ? missing : formatPct(htValue("kku"))}</Cell>
              <Cell sub={htSub("thailand")}>{htValue("thailand") === null ? missing : formatPct(htValue("thailand"))}</Cell>
              <Cell>{pointDiff("quality", htValue("faculty"), htValue("kku"))}</Cell>
            </tr>
            <tr>
              <th scope="row" className="border-b border-slate-200 px-3 py-3.5 text-left font-normal text-slate-700">ผลงานร่วมกับต่างประเทศ <span className="text-[11px] font-normal text-slate-400">(observed)</span></th>
              <Cell faculty sub={rateSub("faculty", "intl")}>{rateValue("faculty", "intl") === null ? missing : formatPct(rateValue("faculty", "intl"))}</Cell>
              <Cell sub={rateSub("kku", "intl")}>{rateValue("kku", "intl") === null ? missing : formatPct(rateValue("kku", "intl"))}</Cell>
              <Cell sub={rateSub("thailand", "intl")}>{rateValue("thailand", "intl") === null ? missing : formatPct(rateValue("thailand", "intl"))}</Cell>
              <Cell>{pointDiff("intl", rateValue("faculty", "intl"), rateValue("kku", "intl"))}</Cell>
            </tr>
            <tr>
              <th scope="row" className="border-b border-slate-200 px-3 py-3.5 text-left font-normal text-slate-700">Open Access <span className="text-[11px] font-normal text-slate-400">(observed)</span></th>
              <Cell faculty sub={rateSub("faculty", "oa")}>{rateValue("faculty", "oa") === null ? missing : formatPct(rateValue("faculty", "oa"))}</Cell>
              <Cell sub={rateSub("kku", "oa")}>{rateValue("kku", "oa") === null ? missing : formatPct(rateValue("kku", "oa"))}</Cell>
              <Cell sub={rateSub("thailand", "oa")}>{rateValue("thailand", "oa") === null ? missing : formatPct(rateValue("thailand", "oa"))}</Cell>
              <Cell>{pointDiff("oa", rateValue("faculty", "oa"), rateValue("kku", "oa"))}</Cell>
            </tr>
          </tbody>
        </table>
      </div>
      {anyGapWithheld && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          บางตัวชี้วัดยังเทียบคณะกับ KKU ไม่ได้ในปีนี้ (แสดงเป็นค่าที่สังเกตได้เท่านั้น){reasons.length ? `: ${reasons.join(" · ")}` : ""}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        T1–Q2 คำนวณจากผลงานที่จัดกลุ่มวารสารได้ (T1 แยกจาก Q1 ไม่นับซ้ำ) · ส่วนต่างของสัดส่วนเป็นหน่วยจุดเปอร์เซ็นต์ · OA/นานาชาติเป็นอัตราจากเอกสารที่ทราบสถานะ (positive/known) เอกสารที่ไม่ทราบไม่ถูกนับเป็นตัวหาร · สามระดับมีผลงานทับซ้อนกัน จึงไม่รวมยอด · ค่าที่สูงกว่าไม่ได้แปลว่าดีกว่าโดยอัตโนมัติ
      </p>
    </section>
  );
}
