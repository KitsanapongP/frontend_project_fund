โปรด review รอบ 7 ของหน้า Scopus Benchmark (executive report) — แก้เฉพาะ **การแบ่งหน้าพิมพ์ (print pagination)** ตามที่ผู้ใช้แจ้งจาก PDF จริง. ไม่แตะสูตร/ข้อมูล/หน้าจอ. ตอบข้อค้าง "print/PDF จริง" จากรอบ 6
รายงาน review หลัก (รอบ 7 อยู่บนสุด → รอบ 6 → ก่อนหน้า): G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review.md
findings ของ reviewer ไม่ถูกแก้ไข (round5/round6): G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-findings-round6.md
FE: repo G:/works-fund-project/frontend_project_fund · branch feature/scopus-benchmark-dashboard · base/HEAD 624842778e772632ab0967fd04b2e0cca5d30af7 · uncommitted (ห้าม merge/push/deploy)

ไฟล์ที่แก้ (2 ไฟล์):
- G:/works-fund-project/frontend_project_fund/app/globals.css — เฉพาะบล็อก `@media print` ที่ guard ด้วย `body:has(#scopus-report-root)` (ไม่มีกฎ global, ไม่แตะสูตร/ขนาดตัวอักษร) — P1/P2/P3
- G:/works-fund-project/frontend_project_fund/app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js — เพิ่ม effect print-only (beforeprint/afterprint) กาง `<details>` ตอนพิมพ์แล้วคืนค่า — P4 (ไม่แตะ render ปกติ/สูตร/ข้อมูล)

สิ่งที่ต้องตรวจ:
1) **P1** หัวข้อกราฟ "สัดส่วนผลงานคณะต่อ KKU" ต้องอยู่หน้าเดียวกับกราฟ (กฎ `h2,h3,summary{break-after:avoid}` + `.grid>*{break-inside:avoid}`)
2) **P2** หัวข้อ + ตาราง citation ต้องไม่ถูกแยกหน้า (กฎ `section[aria-label^="การอ้างอิงสะสม"]{break-inside:avoid}`)
3) **P3** ไม่บังคับ `<details>` เปิดขึ้นหน้าใหม่แล้ว (ลบ `details[open]{break-before:page}`) → ภาคผนวกไหลต่อ ไม่มีช่องว่างใหญ่
4) **P4** กดปุ่ม "พิมพ์รายงาน" (หรือ Ctrl+P) ต้องกาง "รายละเอียดคุณภาพวารสารและประเภทผลงาน" + "นิยามและความพร้อมของข้อมูล" (และตารางรายปี) ให้เห็นครบใน PDF โดยไม่ต้องกางเอง แล้วคืนค่าเดิมบนจอหลังพิมพ์
5) ยืนยันว่า **ไม่มีกฎ print ระดับ global**, ไม่แตะ `app/lib/scopus_benchmark_report.mjs`, และ render ปกติบนจอไม่เปลี่ยน (details ยังพับ/กางตามผู้ใช้)

หลักฐาน PDF (A4, สร้างจาก dev harness = component จริง + fixture "normal", @page A4 inject ตอนพิมพ์):
- เปิดรายละเอียด (4 หน้า): G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-evidence/print-normal-paginated-open.pdf
- พับรายละเอียด (3 หน้า): G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-evidence/print-normal-paginated-collapsed.pdf
- **P4 กดพิมพ์โดยไม่กางเอง → กางให้ 4 หน้าเต็ม:** G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-evidence/print-normal-autoexpand-button.pdf
ตรวจทุกหน้า: ไม่มีข้อความถูกตัด/ตารางล้น/หน้าว่าง; footer ครบหน้าสุดท้าย. (หมายเหตุ: ช่องว่างท้ายหน้า 2 ในไฟล์พับเป็น tradeoff ที่ตั้งใจ — ยึด citation ไว้ด้วยกันไม่ให้หัวข้อค้าง)

วิธีดูสด: `npm run dev` → พิมพ์ http://localhost:3000/dev/scopus-benchmark-report?scenario=normal&open=1 (และไม่มี `open=1` = พับ) ด้วย A4 · หรือพิมพ์จาก portal จริงหลัง admin login (/research-fund-system/admin/scopus-benchmark)
ข้อจำกัด: หลักฐานจาก harness (component จริง) ยังไม่ได้พิมพ์จาก portal จริงหลัง login รอบนี้; keyboard/ปุ่ม export ไฟล์จริงยังตามข้อค้างรอบ 6. FE tests ไม่กระทบ (lib ไม่ถูกแตะ). โปรดรายงาน findings ตามความสำคัญ — ห้าม merge/push/deploy ระหว่าง review
