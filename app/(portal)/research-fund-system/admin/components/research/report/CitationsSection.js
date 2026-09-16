"use client";

import { formatCount, formatDecimal } from "@/app/lib/scopus_benchmark_report.mjs";

const COLUMNS = [
  { key: "faculty", label: "คณะ", faculty: true },
  { key: "kku", label: "มหาวิทยาลัยขอนแก่น" },
  { key: "thailand", label: "ประเทศไทย" },
];

const COVERAGE_TEXT = {
  complete: "ครบทุกผลงานในชุด",
  partial: "มีข้อมูลบางส่วน",
  none: "ยังไม่มีข้อมูล",
};

// Citations of the year's publications (§5 E2). Always visible — never behind a
// tab or details. A cumulative total and per-known-doc average side by side, with
// visible coverage. It never sums the three overlapping levels and never reads the
// average as field-normalised quality.
export default function CitationsSection({ reportYear, insights }) {
  const cite = (key) => insights?.levels?.[key]?.citations || null;
  const missing = <span className="font-normal text-slate-400">ยังไม่มีข้อมูล</span>;

  const totalCell = (key) => {
    const c = cite(key);
    if (!c || c.total === null || c.total === undefined) return { value: missing };
    const sub = c.coverage_status === "partial" ? `ยอดที่พบในข้อมูล ${formatCount(c.known_docs)}/${formatCount(c.cohort_docs)} ผลงาน` : null;
    return { value: `${formatCount(c.total)} ครั้ง`, sub };
  };
  const avgCell = (key) => {
    const c = cite(key);
    if (!c || c.average === null || c.average === undefined) return { value: missing };
    return { value: `${formatDecimal(c.average, 1)} ครั้ง/ผลงาน`, sub: `หารด้วย ${formatCount(c.known_docs)} ผลงานที่มีข้อมูล` };
  };
  // known/cohort is citation coverage WITHIN the docs we harvested — it is NOT the
  // completeness of the harvest itself. When the harvest is incomplete for the year
  // (count metric not ready) we say so next to the value so cohort_docs is not read
  // as the full population (R2-1).
  const harvestIncomplete = (key) => {
    const r = insights?.levels?.[key]?.readiness;
    return r ? r.metrics?.count?.ready === false : false;
  };
  const coverageCell = (key) => {
    const c = cite(key);
    if (!c || c.cohort_docs === 0) return { value: missing };
    const harvestNote = harvestIncomplete(key) ? " · ชุดเอกสารยังไม่ครบการ harvest" : "";
    return {
      value: `${formatCount(c.known_docs)} / ${formatCount(c.cohort_docs)} ผลงาน`,
      sub: `${COVERAGE_TEXT[c.coverage_status] || ""} · ไม่ทราบวันที่อัปเดตการอ้างอิง${harvestNote}`,
    };
  };

  const renderRow = (label, cellFn) => (
    <tr>
      <th scope="row" className="border-b border-slate-200 px-3 py-3.5 text-left font-normal text-slate-700">{label}</th>
      {COLUMNS.map((column) => {
        const cell = cellFn(column.key);
        return (
          <td key={column.key} className={`border-b border-slate-200 px-3 py-3.5 text-right align-top tabular-nums ${column.faculty ? "bg-blue-50/60" : ""}`}>
            <div className="text-slate-900">{cell.value}</div>
            {cell.sub ? <div className="mt-0.5 text-[11px] font-normal text-slate-500">{cell.sub}</div> : null}
          </td>
        );
      })}
    </tr>
  );

  return (
    <section className="border-b border-slate-200 py-6" aria-label={`การอ้างอิงสะสมของผลงานที่ตีพิมพ์ปี ${reportYear}`}>
      <h2 className="text-lg font-semibold text-slate-900">การอ้างอิงสะสมของผลงานที่ตีพิมพ์ปี {reportYear}</h2>
      <p className="mt-1 text-xs text-slate-500">ยอดสะสม ณ ครั้งที่อัปเดตข้อมูล ไม่ใช่จำนวนการอ้างอิงที่เกิดขึ้นในปี {reportYear}</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">การอ้างอิงสะสมของผลงานที่ตีพิมพ์ปี {reportYear} แยกตามคณะ มหาวิทยาลัยขอนแก่น และประเทศไทย</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <th scope="col" className="px-3 py-2.5 text-left font-medium">ตัวชี้วัด</th>
              {COLUMNS.map((column) => (
                <th key={column.key} scope="col" className={`px-3 py-2.5 text-right font-medium ${column.faculty ? "bg-blue-50" : ""}`}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderRow("การอ้างอิงสะสมรวม", (key) => totalCell(key))}
            {renderRow("การอ้างอิงเฉลี่ยต่อผลงานที่มีข้อมูล", (key) => avgCell(key))}
            {renderRow("ผลงานที่มีข้อมูลการอ้างอิง", (key) => coverageCell(key))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        ผลงานเก่ามีเวลาสะสมการอ้างอิงมากกว่า สามระดับมีผลงานทับซ้อนกัน จึงไม่ควรรวมยอดเข้าด้วยกัน และไม่ควรตีความค่าเฉลี่ยเป็นคุณภาพหรือผลกระทบที่ปรับตามสาขาแล้ว
      </p>
    </section>
  );
}
