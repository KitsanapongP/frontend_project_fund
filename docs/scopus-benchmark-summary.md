# UI: สรุปผลงานและบทบาทอาจารย์

2026-09-30 — branch `feat/scopus-benchmark-summary`

## ตำแหน่งและไฟล์

`/admin/scopus-benchmark` ใน portal `/research-fund-system/admin/scopus-benchmark` เรียง: **สรุปผลงานและบทบาทอาจารย์** → **ผลเปรียบเทียบเชิงวิเคราะห์** เดิม → **ตั้งค่า & ดึงข้อมูล**

ไฟล์หลัก AdminScopusBenchmark.js, ScopusBenchmarkSummary.js, ScopusBenchmarkDashboard.js, app/lib/scopus_benchmark_summary.mjs, app/lib/api.js คู่มือ DB/migration/backfill/API หลักใน backend `docs/SCOPUS_BENCHMARK_SUMMARY.md`

## ตัวกรอง ตาราง และนิยาม

Default: ปี ค.ศ. ปัจจุบัน+ก่อนหน้า, Journal, มี Category, ไม่ Low, แยก T1 Draft ปี/ประเภท/หมวด/confidence เปลี่ยนผลเมื่อกด **แสดงผล**; **ล้างตัวกรอง** คืน default; **อัปเดตข้อมูล** ล้าง cache และโหลดเฉพาะ active view; toggle Quartile เปลี่ยน applied mode ทันทีโดยใช้ cohort เดิม

ภาพรวมรายปี → บทบาทระดับคณะ → Category รายปี → Quartile ราย Category รวมช่วงปี หัวข้อวงเล็บคำนวณยอดจริง คลิกจำนวนเปิดผลงานตามระดับ/ปี/หมวด/Quartile

รายอาจารย์ roster ครบ ค้นหาชื่อ/Scopus ID, ซ่อนไม่มีผลงาน, เรียงจำนวน/สัดส่วน, คลิกจำนวนแต่ละบทบาทเพื่อเปิดรายละเอียด Search/hide/sort เป็น display-only Excel ส่งทะเบียนครบหลัง applied filters

- Thailand: EID ไม่ซ้ำใน benchmark country scope; KKU: ภายในฐาน มี AF-ID 60017165/60280609/60026046/60277695/109899034
- COC: ผู้เขียนเป็นอาจารย์ทะเบียนและผู้เขียนนั้น AF-ID 60017165/60280609 ไม่กรองวันเริ่มงาน
- %KKU=KKU/Thailand; %COC=COC/KKU; รวมจากจำนวนรวม ตัวหาร 0 เป็นขีด
- Complete metric ปีตีพิมพ์หรือปีก่อนหน้าล่าสุด doc_type=all; T1 percentile 90–100 ไม่ซ้ำ Q1–Q4; non-Journal ไม่ใช้ Quartile
- XML flags จาก EID+Author ID: first/corresponding ซ้อนกันได้; lead union; co สอง flags false บน complete/no_correspondence; อื่นๆ unknown ไม่ใช่คะแนนปริมาณงานจริง
- Overview นับ papers ไม่ซ้ำ; รายคน user/EID ยอดรวมรายคนอาจมากกว่า overview ไม่มี ID เชื่อมไม่ได้/ขีด มี ID แต่ไม่พบงานแสดง 0 จากชุดที่สังเกตได้

Hint เป็นไอคอน hover/focus/tap ปิด Escape/outside click/blur ไม่แปะคำอธิบายยาวทุกแถว Details แสดงทุก authors รวมคนนอกคณะ, metric year/fallback และข้อมูล affiliations

## สถานะและ Excel

แสดง applied_filters/generated_at/revision/year_states/coverage จาก DB ที่เชื่อมอยู่ Year missing เป็นขีด มีข้อมูลแต่กรองไม่พบเป็น 0 รวมช่วงมีปีขาดระบุ “รวมจากปีที่มีข้อมูล” Dev ไม่ได้บอกสถานะ production

Excel จาก backend excelize ส่งมุมมองปัจจุบัน+applied filters พร้อม revision ตัวเลขเป็น numeric มีชีตคำอธิบาย/สูตร/coverage ถ้า server 409 แจ้งให้ refresh ไม่ดาวน์โหลดไฟล์ยอดต่างจากหน้าจอ

## Lazy loading

- หน้าแรก options/summary เท่านั้น ไม่มี comparison/insights/scopes/runs ของแท็บอื่น
- faculty เมื่อเปิดบทบาทอาจารย์; documents เมื่อคลิกจำนวน 50 รายการต่อหน้า
- วิเคราะห์ mount ครั้งแรกที่เปิด Effects comparison/insights guard isActive
- Setup เริ่ม scopes/runs/comparison เมื่อเปิด; debounce range 500ms เฉพาะ active setup
- ทั้งสองรายงาน retain state/cache หลังเคยเปิด แต่ inactive ไม่ทำ request หรือ widen window กลับแท็บใช้ cache
- ออกแท็บ/subview abort reads และ generation กันผลเก่า; refresh/filter ใหม่ใช้ cache key ใหม่
- Setup writes/harvest จบ mark stale แยกรายงานใหม่/เก่า แสดง refresh ไม่โหลดทั้งสองอัตโนมัติ Poll งานที่ผู้ใช้เริ่มไว้เป็นข้อมูลเบา

`createSummaryLoader` helper ร่วม; APIClient.get เพิ่ม optional options ตัวที่สามสำหรับ signal ไม่เปลี่ยน calls เดิม

## ตรวจและแก้ภายหลัง

```powershell
node --test
node node_modules/next/dist/bin/next build
node node_modules/next/dist/bin/next dev --port 3015
```

Development-only `/dev/scopus-benchmark-summary`: component จริง+fixture API และ counters, normal/partial/error/revision-change ไม่มี Scopus/DB request ชื่อ/ตัวเลขสมมติ Route คืน notFound ใน production

ตรวจหน้าแรก options/summary → เปิด faculty มี faculty call → คลิกจำนวนมี details → วิเคราะห์มี comparison/insights → กลับไม่มีเพิ่ม → draft ไม่ยิงจนแสดงผล → toggle ยอดคงเดิม → refresh active view → missing/zero/tooltip/details ภายนอก/pagination → Excel 409 แจ้งอัปเดต

Dev เริ่มต้นไม่มี Category country และไม่มี membership ปี 2025 จึงไม่เทียบยอดให้เท่ากับ Excel production ดูผลจริง/backfill/rerun ในคู่มือ backend

รายงานเดิมใช้ scopes/snapshots/ความพร้อมและ employment refinement เดิม รายงานใหม่ใช้ฐาน Thailand/benchmark classification/AF-ID 5/2/ไม่กรองวันเริ่มงาน นิยามต่างกันจึงได้ยอดต่างกันได้
