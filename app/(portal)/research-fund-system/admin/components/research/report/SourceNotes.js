"use client";

import { formatCount, HINT_T1Q2, HINT_INTL } from "@/app/lib/scopus_benchmark_report.mjs";

// Methodology + footer (§5 G). The definitions live in a collapsible; the essential
// source dates and the "generated vs data updated" distinction always print. The
// tooltip hints do not print, so their full text is repeated here (§5).
export default function SourceNotes({ periodLabel, isRange = false, perYearSnapshots = null, scope, sourceDates = {}, facultyMetric, open, onToggle, onGoSetup, generatedAt }) {
  const date = (value) => value || "ไม่ทราบวันที่อัปเดตข้อมูล";

  return (
    <section className="pt-5" aria-label="นิยามและแหล่งข้อมูล" id="scopus-report-sources">
      <details open={open} onToggle={(event) => onToggle?.(event.currentTarget.open)}>
        <summary className="cursor-pointer text-sm font-medium text-slate-700">นิยามและความพร้อมของข้อมูล</summary>
        <div className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-slate-600">
          <p><b className="font-medium text-slate-700">คณะ (verified faculty):</b> ผลงาน Computer Science ในชุด KKU ที่มีอาจารย์ในระบบเป็นผู้แต่ง มี AF-ID 60017165 หรือ 60280609 บนผลงาน และตีพิมพ์ตั้งแต่วันเริ่มงานเมื่อมีข้อมูลวันเริ่มงาน (มิฉะนั้นใช้ AF-ID เป็นหลักฐานการสังกัด) เป็นชุดเดียวกับที่ใช้นับ KPI</p>
          <p><b className="font-medium text-slate-700">แหล่งข้อมูลและการนับ:</b> จำนวนผลงานมาจาก snapshot การนับ ส่วนตัวชี้วัดเชิงลึก (คุณภาพวารสาร ความร่วมมือ Open Access การอ้างอิง) มาจากเอกสารที่เก็บไว้จริง หากจำนวนสองส่วนไม่ตรงกันจะไม่สรุปเปรียบเทียบ</p>
          <p><b className="font-medium text-slate-700">ปีของตัวชี้วัด:</b> ปีรายงานคือปีตีพิมพ์ของผลงาน · กลุ่มคุณภาพวารสารใช้ค่า CiteScore ล่าสุดต่อวารสาร (ไม่ใช่ค่า ณ ปีตีพิมพ์) · การอ้างอิงเป็นยอดสะสม ไม่ใช่ค่าที่ปรับตามสาขา</p>
          <p><b className="font-medium text-slate-700">ผลงานในวารสารกลุ่ม T1–Q2:</b> {HINT_T1Q2}</p>
          <p><b className="font-medium text-slate-700">ผลงานร่วมกับต่างประเทศ:</b> {HINT_INTL}</p>
          <p><b className="font-medium text-slate-700">ขอบเขต:</b> {scope?.subject_area || "COMP"} (Computer Science) · คณะเป็นส่วนหนึ่งของ KKU และ KKU เป็นส่วนหนึ่งของประเทศไทย สามระดับมีผลงานทับซ้อนกัน จึงไม่รวมยอดเป็นผลรวมเดียว และไม่ตีความเป็นการจัดอันดับ</p>
          <p><b className="font-medium text-slate-700">ความพร้อมของข้อมูล:</b> การสิ้นสุดปีปฏิทินไม่ได้แปลว่าเก็บเอกสารครบ · ความครอบคลุมของการอ้างอิงแสดงเป็น known/cohort ต่อระดับ และยังไม่ทราบวันที่อัปเดตการอ้างอิงที่พิสูจน์ได้</p>
          {isRange && Array.isArray(perYearSnapshots) && perYearSnapshots.length > 0 && (
            <div>
              <p className="mb-1"><b className="font-medium text-slate-700">วันที่อัปเดตข้อมูลรายปี:</b> รายงานช่วงนี้รวมหลายปี วันที่อัปเดตของแต่ละปี/ระดับอาจต่างกัน (ค่า “ไม่ทราบ” คงไว้ตามจริง ไม่นำมารวมเป็นช่วงวันที่)</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[360px] border-collapse text-[12px] tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th scope="col" className="py-1.5 pr-3 font-medium">ปี</th>
                      <th scope="col" className="py-1.5 pr-3 font-medium">คณะ</th>
                      <th scope="col" className="py-1.5 pr-3 font-medium">KKU</th>
                      <th scope="col" className="py-1.5 font-medium">ประเทศไทย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perYearSnapshots.map((row) => (
                      <tr key={row.year} className="border-b border-slate-100 text-slate-600">
                        <td className="py-1.5 pr-3">{row.year}</td>
                        <td className="py-1.5 pr-3">{row.faculty || "ไม่ทราบ"}</td>
                        <td className="py-1.5 pr-3">{row.university || "ไม่ทราบ"}</td>
                        <td className="py-1.5">{row.country || "ไม่ทราบ"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {facultyMetric?.ready === false && (
            <p className="text-amber-700">ยังคำนวณตัวเลขคณะไม่ได้เพราะไม่พบอาจารย์ที่ตั้ง Scopus ID</p>
          )}
          {Array.isArray(facultyMetric?.benchmark_years_missing) && facultyMetric.benchmark_years_missing.length > 0 && (
            <p className="text-amber-700">ต้องดึงเอกสาร KKU เพิ่มสำหรับปี {facultyMetric.benchmark_years_missing.join(", ")} เพื่อคำนวณค่าคณะของปีเหล่านั้น</p>
          )}
        </div>
      </details>

      <footer className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <span>ขอบเขต {scope?.subject_area || "COMP"} · {periodLabel ?? "–"}</span>
        <span>สร้างรายงานเมื่อ {generatedAt} · {isRange ? "ข้อมูลอัปเดตต่างกันรายปี (ดูตารางด้านบน)" : `ข้อมูลอัปเดต คณะ ${date(sourceDates.faculty)} · KKU ${date(sourceDates.university)} · ประเทศไทย ${date(sourceDates.country)}`}</span>
        <button type="button" onClick={onGoSetup} className="no-print font-medium text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline">
          ตั้งค่า & ดึงข้อมูล
        </button>
      </footer>
    </section>
  );
}
