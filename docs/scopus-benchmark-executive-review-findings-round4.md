# Scopus Benchmark — Review รอบ 4

2026-09-15 · Verdict: ยังไม่อนุมัติ เหลือ R4-1 [P2] ด้าน default year

ตรวจ working tree เทียบ handoff ล่าสุด โดย HEAD ทั้งสอง repo ตรงตามที่ส่งมา. ไม่แก้ application code ไม่ merge/deploy และไม่แก้ findings รอบก่อน.

## R4-1 [P2] Bootstrap สับสนระหว่างปีที่มี snapshot กับปีที่ faculty-ready

ตำแหน่ง: `app/lib/scopus_benchmark_report.mjs:149–153` และ `app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js:153–157`.

`resolveBootstrapTarget` เลือก Math.max ของ available_years.faculty แล้วหยุดค้นหา แต่ BE `controllers/admin_scopus_benchmark_controller.go:487` ระบุชัดว่า available_years เป็น snapshot existence ไม่ใช่ readiness และรวม blocked year ด้วย. faculty status ที่บรรทัด 446–454 อาจ blocked เฉพาะปีได้เมื่อเอกสาร KKU ไม่ครบ.

Repro ที่ reviewer รันด้วย helpers จริง:

- currentYear=2026, initial windowFrom=2012, trendRange=5
- available_years.faculty=[2025,2010], university=[2025,2010]
- loaded year_meta: 2025 faculty=blocked, university=available
- ปี 2010 ที่อยู่นอก window: faculty=available
- resolveBootstrapTarget ได้ 2025; needed=2021 จึงไม่ขยาย window
- selectReportYear ของข้อมูลที่โหลดได้ 2025/faculty_not_ready แต่เมื่อให้ metadata ครบจะได้ 2010/faculty_ready

ผลต่อผู้ใช้: เปิดรายงานที่บอกว่าคณะไม่พร้อม ทั้งที่มีปีจบที่คณะพร้อมอยู่แล้ว ผิดลำดับ default ใน handoff §4 และยังเป็นส่วนที่เหลือของ R3-2.

ขอแก้ให้ใช้ readiness ที่ยืนยันได้ในการตัดสิน default: โหลด metadata ให้ครอบ candidate faculty years ที่ยังไม่ตรวจ ก่อนเลือก fallback; หรือให้ BE ส่ง default/ready-year metadata ที่คำนวณจากกฎจริง. ไม่ใช้ชื่อ available_years แทน ready years และไม่ override manualYear. เพิ่ม regression case ข้างต้น รวมกรณี faculty ทุกปี blocked ที่ต้องจบด้วย fallback ไม่ loading วน.

## สถานะ R3-1 / R3-2

- R3-1 ปิดสาระหลัก: share KPI ถูกงด, trendPoints.share=null, กราฟ share แทนด้วยข้อความ, table gaps guarded และ CSV บันทึกสาขาของสามระดับ/คำเตือน พร้อมเว้น faculty_kku_pct. ตรวจภาพ desktop-1440-scopebad.png โดยตรงและ CSV ทั้งสองไฟล์. Code path จาก BE consistent=false ใช้ร่วมกันไม่ขึ้นกับระดับใดผิดสาขา; การขาดภาพ faculty mismatch เพียงอย่างเดียวไม่เป็น blocker เพิ่ม.
- R3-2 ปิดกรณีเดิมที่ทุก faculty snapshot พร้อม (old-only, current+old-ended, faculty-old+KKU-recent) แต่ยังไม่ครบเมื่อ snapshot ปีใหม่ blocked ตาม R4-1.

## UX/UI, citation และคุณภาพหลักฐาน

ภาพ scopebad แสดงลำดับรายงาน executive ตามที่ตกลง และแก้ความขัดแย้งของ share KPI/กราฟกับ banner แล้ว. Citation ยังแสดงยอดสะสมของผลงานตามปีตีพิมพ์ ไม่ใช่ citations ที่เกิดในปีนั้น พร้อม known/cohort, ตัวหารของค่าเฉลี่ย, freshness unknown และข้อจำกัดการรวมยอด. ไม่พบ blocker citation ใหม่จากส่วนที่ตรวจรอบนี้.

หมายเหตุหลักฐาน (ไม่ถือเป็น runtime bug โดยไม่มี reproduction): CSV scopebad ไม่ได้เป็น export จาก dataset เดียวกับ screenshot — ภาพมี counts 74/304/2940 แต่ CSV มี 72/300/3000 และ faculty OA ต่างกัน. ใช้ไฟล์เหล่านี้ยืนยัน scope format ได้ แต่ใช้ยืนยัน screen=export end-to-end ไม่ได้. รอบถัดไปควร export จาก scenario ที่ capture ภาพเดียวกันและระบุวิธีสร้าง. ช่อง CSV “พร้อมเทียบ” ยังเป็น readiness ระดับข้อมูล ไม่รวม scope; ควรตั้งชื่อให้ชัดหรือแยก scope-ready เพื่อไม่ให้ผู้อ่านเข้าใจขัดกับ warning.

## Verification / ขอบเขตการอนุมัติ

- Reviewer รัน FE node --test: 49/49 ผ่าน; BE go test ./services ผ่าน (cached).
- รัน helper reproduction R4-1 ได้ผลตามข้างต้น.
- อ่านโค้ด helper, orchestrator, TrendCharts, controller และหลักฐานภาพ/CSV ของรอบนี้.
- ไม่ได้เปิด harness ใหม่, ตรวจ portal หลัง login/keyboard หรือ render PDF ใหม่. Build ผ่านเป็นผล implementer ไม่ใช่ reviewer รันซ้ำ.
- ไม่มี live BE re-sample รอบนี้ จึงไม่อ้างว่า live response contract ราย metric ได้รับการตรวจใหม่.
- .claude/launch.json ยัง unresolved ตาม implementer; ต้องไม่ระบุว่ากู้ค่าเดิมแล้ว.

## ส่งกลับจาก agent

แก้ R4-1 พร้อม test และหลักฐาน default-year จาก metadata ที่มี blocked snapshot จริงตาม contract. อัปเดตตาราง finding → code → evidence และข้อจำกัด. ควรให้ภาพกับ CSV ใช้ dataset เดียวกัน. ส่ง prompt สั้นพร้อม absolute paths ให้ผู้ใช้เรียก review ต่อ. ห้าม merge/deploy และห้ามแก้ findings ของ reviewer.
