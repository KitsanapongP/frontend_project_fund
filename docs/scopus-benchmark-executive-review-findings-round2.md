# Scopus executive report — ผล review รอบ 2

วันที่: 14 กันยายน 2026 · ผล: **ยังไม่อนุมัติ**

ตรวจ working tree บน FE `feature/scopus-benchmark-dashboard` / BE `feature/scopus-benchmark-insights` เทียบ handoff และ R1–R9 รอบแรก ไม่แก้ application code ไม่ commit/merge/deploy. งานแก้หลายส่วนถูกต้องแล้ว แต่ยังมี findings ต่อไปนี้

## Findings เรียงตามความสำคัญ

### R2-1 [P1] Readiness ยังไม่แยกตาม metric และ KPI ยังข้าม guard

อ้างอิง `G:/works-fund-project/fund-management-api/services/scopus_benchmark_insights.go:410–450`, `G:/works-fund-project/frontend_project_fund/app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js:249–281`, `report/ComparisonTable.js:60–65`, `app/lib/scopus_benchmark_report.mjs:164–178`.

R3 รอบแรกแก้แล้วเฉพาะ snapshot count mismatch และ gap guard ระดับชุดเอกสาร แต่ `comparison_ready` ไม่ตรวจ unknown OA/intl, unclassified journal/unresolved source type หรือ metric coverage. หาก expected snapshot ไม่มี (`expectedDocs=nil`) ก็ยังอนุญาต comparison เมื่อมีเอกสารและไม่มี active run. `canCompare` ตัวเดียวเปิดทุก metric และ `buildFindings` ใช้ readiness รวมนี้สำหรับสรุปคุณภาพ

หลักฐานข้อมูลจริงที่ agent ส่ง: `live-be-sample-round2.json` ปี 2025 KKU มี `unclassified_journal=113` แต่ `comparison_ready=true`; ปี 2024 มี 93 และ ready=true เช่นกัน จึงยังสามารถสร้างข้อความเทียบคุณภาพจากชุดที่ metadata ไม่ครบตาม handoff. นี่เป็นการอ่าน sample ที่ส่งมา ไม่ใช่ reviewer เรียก DB ใหม่

ใน live harness `scenario=mismatch` ตารางหยุด gap ถูกต้องแล้ว แต่ KPI ด้านบนยังแสดง T1–Q2=84%, “ปีก่อน 84%” และ intl=50%, “ปีก่อน 50%” โดยไม่แสดงเหตุผลของ cohort mismatch ที่ KPI. ชื่อ KPI ยังสื่อว่าเป็นค่าคณะปกติทั้งที่ตารางด้านล่างบอกว่าเทียบไม่ได้. Citation table ก็ยังไม่รับ harvest readiness/expected-doc context มาบอกความครบถ้วนใกล้ค่า (known/cohort คือความครบของ citation ในเอกสารที่เก็บมา ไม่ใช่ความครบของการ harvest)

แก้: แยก readiness ราย metric และคู่ปี/ระดับ; กรณีไม่มี expected snapshot ให้ถือว่ายังพิสูจน์ completeness ไม่ได้. ใช้สถานะนี้กับ KPI/subline ปีก่อน, findings, gap, citation caveat และ export. Observed values แสดงได้พร้อมขอบเขตที่เห็นชัด แต่ไม่สรุปว่าเปรียบเทียบได้จาก boolean รวม. ห้ามเพิ่มการดึงข้อมูลเพื่อทำให้ ready; เมื่อข้อมูลไม่พอให้แสดงข้อจำกัดตาม handoff

ตรวจรับ: cohort count ตรงแต่ metadata ไม่ครบต้องไม่เปิด comparative gap/finding; mismatch และปีก่อน partial ไม่แสดง KPI เปรียบเทียบแบบปกติ; metric อื่นที่พร้อมยังแสดงได้. เพิ่ม tests ของ nil snapshot, missing journal metadata, OA unknown และ Y-1 not-ready ไม่ใช่เฉพาะ snapshot_mismatch

### R2-2 [P1] CSV OA/intl ยังใช้สูตรเก่า จึงต่างจากหน้าจอ

อ้างอิง `G:/works-fund-project/frontend_project_fund/app/lib/scopus_benchmark_report.mjs:281–284`; หน้าจอใช้ `report/ComparisonTable.js:37–46`.

หน้าจอเปลี่ยนเป็น positive/known แต่ comparison CSV ยังส่ง legacy `oa_pct/intl_pct` ซึ่ง BE หารด้วย docs ทั้งหมด และตัวหารใน CSV ยังเป็น docs. ดังนั้นไฟล์ที่จะนำไปประชุมไม่ใช่ค่าที่เห็นในรายงาน

Reviewer ทดสอบ helper จริงด้วย docs=100, OA positive=20/known=40/unknown=60 และ intl positive=30/known=60/unknown=40:
- หน้าจอตามสูตรปัจจุบัน: OA=50%, intl=50%
- CSV จริง: OA=20.0%, intl=30.0%, ตัวหารทั้งคู่=100

นอกจากนี้ caption ท้ายตารางยังบอก “ตัวหาร = ผลงานทั้งหมดในชุด” ทั้งที่ UI หาร known. การระบุ intl เป็น lower-bound ในรายงาน review ก็ยังไม่แม่นสำหรับ positive/known: เมื่อ exclude unknown อัตรา subset ไม่จำเป็นต้องเป็น lower bound ของทั้ง cohort

แก้: ใช้ pure metric helper ร่วมกันระหว่าง KPI/table/CSV พร้อม numerator/known/unknown, denominator policy และ readiness; แก้ caption ให้ตรงสูตร. หากเลือกแสดง observed subset ก็เรียก subset ตามนั้น ไม่อ้าง lower bound ของทุกเอกสาร. เพิ่ม regression test เทียบ display model กับ CSV เมื่อ unknown>0

### R2-3 [P2] Scope mismatch เป็นเพียง banner แต่ยังแสดงข้อสรุปตามเดิม

อ้างอิง `G:/works-fund-project/frontend_project_fund/app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js:324–365`.

`scopeMismatch` ใช้แสดงข้อความว่าจะ “งดข้อสรุป” เท่านั้น แต่ `<KeyFindings findings={findings}>` และ ComparisonTable ไม่ได้รับ guard นี้ ยังแสดง findings/gaps และคำว่า Computer Science เดียวกันทุกระดับ. BE report_scope ยังสะท้อนเพียง university.SubjectArea ไม่ได้ตรวจว่าทั้งสาม scope ตรงกัน ดังนั้น KKU=COMP แต่ country คนละสาขาไม่ถูกจับด้วย

แก้: ตรวจทุก scope ที่ใช้เทียบและนำผล mismatch ไปหยุด comparative narrative/gaps จริง รวม export/print; label ต้องตรงข้อมูล. แสดงส่วนที่อ่านแบบ observed ได้พร้อมขอบเขต ไม่ทำ banner ที่ขัดกับเนื้อหา

ตรวจรับ: ทดสอบทั้ง university!=COMP และ university=COMP/country!=COMP ต้องไม่ปรากฏข้อความเปรียบเทียบว่าขอบเขตเดียวกันหรือ gap ที่ข้าม scope

### R2-4 [P2] หากมีข้อมูลเฉพาะปีเก่า หน้าเข้า empty state และเลือกปีไม่ได้

อ้างอิง `G:/works-fund-project/frontend_project_fund/app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js:119–144,315`.

available_years ของ BE ขยายครบทุกปีแล้ว แต่ default selection ยังมาจาก year_meta ในช่วงโหลดแรกเท่านั้น. หากทุก snapshot เก่ากว่า CURRENT_YEAR-14 เช่นมีเฉพาะ 2010, selection/reportYear=null; effect ขยาย window ออกจากฟังก์ชันทันที และ render EmptyState ก่อน year picker. ผู้ใช้จึงเข้าถึงปี 2010 ที่ API บอกว่ามีข้อมูลไม่ได้เลย. ถ้ามี current-year data แต่ ended year มีเฉพาะนอก window ก็เลือก currentYear ผิดลำดับ default เช่นกัน

แก้: bootstrap selection ใช้ available_years เป็น candidate แล้ว fetch ช่วงของ candidate เพื่อยืนยัน readiness ก่อน fallback/current-year/empty. อย่าประกาศไม่มีข้อมูลจน discovery ที่มีอยู่ถูกตรวจ; เติม Y-1 สำหรับการเปรียบเทียบเมื่อจำเป็น

ตรวจรับ: มีเฉพาะ old snapshots, มี old ended+current, old faculty+recent country; ต้องเลือกปี default ตาม handoff และเปิดกราฟได้. เพิ่ม orchestration test หรือ harness ที่ comparison เคารพ requested range จริง

## สถานะ R1–R9 รอบแรก

| ข้อ | ผลรอบ 2 |
|---|---|
| R1 SQL args | ปิด bug หลักได้: order เป็น scope/year/AFIDs, test แก้แล้ว; sample ใหม่ faculty docs 52/63 และ citation totals 540/351 |
| R2 global print | ปิด regression หลักได้: selector ใช้ body:has(report root), @page inject/remove ตาม report mount; PDF regression หน้าไม่มี root มีเนื้อหา |
| R3 readiness | ยังไม่ปิด ดู R2-1 / R2-3; snapshot mismatch gap guard ดีขึ้นจริง |
| R4 missing/zero | ปิดเส้นทาง normalization หลักได้: table/CSV ใช้ normalizeReportRow |
| R5 OA/intl unknown | เพิ่ม counts และ subset rates แล้ว แต่ readiness และ CSV ยังไม่สอดคล้อง ดู R2-1 / R2-2 |
| R6 quality buckets | แยก journal-only/unclassified/excluded/unresolved แล้ว; การใช้ coverage เพื่อสรุปยังค้าง R2-1 |
| R7 year discovery | เลือกปีเก่าด้วยมือและขยาย window ดีขึ้น แต่ bootstrap ยังติด R2-4 |
| R8 export | yearly range/status/date ดีขึ้น; comparison rates ยังผิด R2-2 |
| R9 chart label scale | ปิดที่ 390px ได้: วัด live SVG width=298/viewBox=298/fontSize=12 ทั้งสองกราฟ ไม่ถูก scale เหลือ 6px แบบเดิม; ยังต้องตรวจ portal จริง/long labels ตาม acceptance |

## หลักฐานและขอบเขตการตรวจรอบนี้

- FE node --test รันซ้ำผ่าน 44/44; BE go test ./services รันซ้ำผ่าน โดยใช้ workspace GOCACHE. ไม่ rerun builds; ผล build pass เป็นรายงานจาก implementer
- อ่าน source ปัจจุบัน, review package รอบ 2 และ live-be-sample-round2.json; ไม่มีการ query DB/API จริงเพิ่ม ไม่มีการ login portal
- เปิด actual component harness บน localhost:3142?scenario=mismatch ผ่าน browser แล้วอ่าน KPI/table จริงและวัดกราฟที่ viewport 390x844; ทดสอบ pure CSV helpers โดยตรงด้วย unknown counts
- Render/inspect `print-regression-other-page.pdf`: มีเนื้อหา ไม่ว่าง สอดคล้องกับ guarded stylesheet. ไม่ได้ยืนยัน print integration ของ portal ที่ login แล้วจาก PDF นี้
- ยังขาด authenticated route UI/keyboard tab-through และ delayed-response interaction verification ตามรายงาน agent. การไม่มี component test framework ไม่ทำให้ถือว่าผ่าน; ใช้ browser harness ที่จำลอง latency/error ได้โดยไม่จำเป็นต้องเพิ่ม dependency
- Report package เก็บเนื้อหารอบแรกที่ขัดกับรอบสองไว้ เช่น “faculty ไม่มีเอกสาร” และรายการ deviation เก่าภายใต้หัวข้อ verified ต้องระบุ archived/superseded ให้ชัด หรือย้ายประวัติออก เพื่อ reviewer ไม่หยิบหลักฐานที่ bug R1 ทำให้ผิดมาใช้
- `.claude/launch.json` ที่ implementer เขียนทับยังไม่มีหลักฐานกู้ค่าดั้งเดิม ให้รายงานว่า unresolved และห้ามเดาว่าค่าที่ reconstruct ถูกต้อง

## สิ่งที่ต้องส่งรอบถัดไป

แก้ R2-1 ถึง R2-4 ภายใต้ handoff เดิม ไม่ขยายเป็น harvesting/snapshots ใหม่ ส่งตาราง finding → fix → test/evidence พร้อม sample/harness ของ metadata partial, CSV unknown, scope mismatch และ old-only years. อัปเดตรายงาน review ให้มีสถานะปัจจุบันชัดเจน เก็บ screenshot/print ที่เกี่ยวข้องและ prompt สั้นสำหรับผู้ใช้ส่งกลับมา review อีกครั้ง ไม่ merge/deploy
