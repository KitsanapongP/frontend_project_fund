"use client";

// Key findings of the year (§5 C): at most two plain-text bullets. No large blue
// banner, no repeated mini-bar cards, no automatic praise. Every sentence comes
// from the deterministic rules in scopus_benchmark_report.mjs.
export default function KeyFindings({ findings }) {
  return (
    <section className="border-b border-slate-200 py-6" aria-label="ประเด็นสำคัญของปี">
      <h2 className="text-sm font-semibold text-slate-900">ประเด็นสำคัญของปี</h2>
      {findings.length ? (
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700">
          {findings.map((finding, index) => (
            <li key={index}>{finding}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">ยังไม่มีข้อมูลเพียงพอสำหรับสรุปประเด็นของปีนี้</p>
      )}
    </section>
  );
}
