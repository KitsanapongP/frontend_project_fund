# Scopus Benchmark — Review รอบ 3

วันที่ 2026-09-15 · Verdict: ยังไม่อนุมัติ ปิด findings ด้านล่างก่อน

ตรวจ working tree เทียบ handoff ล่าสุด และ implementation report รอบ 3. HEAD ทั้งสอง repo ตรงตามที่ส่งมา ไม่มีการแก้ application code, merge หรือ deploy.

## Findings ตามความสำคัญ

### R3-1 [P1] Scope guard ยังไม่ครอบคลุมรายงานและ CSV

- `app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js:353` ใช้ scopeConsistent เฉพาะ findings และ ComparisonTable แต่ KPI สัดส่วนคณะ/KKU (บรรทัด 300), trendPoints.share (ประมาณ 198), TrendCharts (400) ยังแสดงการเปรียบเทียบตามเดิม.
- หลักฐานภาพ `docs/scopus-benchmark-executive-review-evidence/desktop-1440-scopebad.png` แสดง banner “งด…การเปรียบเทียบทั้งหมด” แต่ยังมี KPI 24.3%, ปีก่อน +0.2 จุดเปอร์เซ็นต์ และกราฟ share 24.3%. Fixture นี้ country=MEDI; เมื่อ faculty หรือ university ต่างสาขา เส้นทางโค้ดเดียวกันจะคำนวณ share ข้ามขอบเขตจริงด้วย.
- `app/lib/scopus_benchmark_report.mjs:247` และ `:284` เขียนขอบเขต CSV จาก subject_area เพียงค่าเดียว ไม่ส่งออก consistent=false หรือสาขาของแต่ละระดับ; yearly CSV ยังคำนวณ faculty_kku_pct ที่บรรทัด 254. ไฟล์ที่นำไปประชุมจึงไม่มีคำเตือนที่เห็นบนหน้า และติดป้าย COMP ให้ข้อมูลประเทศไทย MEDI. comparison CSV readiness ราย metric ก็ยังไม่ได้รวม scope guard.
- ขอใช้ scope policy เดียวกันกับ KPI, trend/table, findings และ exports; ตาม contract ปัจจุบันเมื่อ scope ไม่ตรงให้หยุดค่าที่ใช้เปรียบเทียบทั้งหมด และคงค่าที่สังเกตได้โดยบอกสาขาของแต่ละระดับชัดเจน. CSV ต้องเก็บข้อจำกัดนี้ได้ด้วยตนเอง. เพิ่ม test ทั้ง country mismatch และ faculty/university mismatch รวมข้อมูล export.

### R3-2 [P2] Bootstrap ยังเลือกปีปัจจุบันก่อนปีจบที่อยู่นอก window

- `app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js:121–143`: selection คำนวณจาก year_meta ของ window ที่โหลด และ target ใช้ reportYear ก่อน available_years. จึงค้นหาปีเก่าเฉพาะเมื่อ reportYear=null.
- Repro ที่ reviewer รันด้วย helper จริง: currentYear=2026, year_meta มี snapshot ปี 2026, available_years=[2026,2010], windowFrom=2012, trendRange=5. selectReportYear ได้ 2026; target=2026; needed=2022 จึงไม่ขยาย window. ปี 2010 ไม่ถูกพิจารณาเป็น default แม้เป็นปีจบแล้ว. ผู้ใช้เลือกเองได้ แต่ default ผิด handoff §4.
- อีกกรณีที่ต้องครอบคลุม: ปีจบใน window มีเพียง KKU แต่ faculty-ready ปีเก่าอยู่นอก window ต้องรักษาลำดับ preference ของ faculty-ready ก่อน fallback.
- ขอ resolve default candidate จากข้อมูล discovery ทุกปีตามลำดับ preference ก่อนยอมรับ fallback ใน loaded window แล้วโหลด metadata มายืนยัน. อย่า override ปีที่ผู้ใช้เลือกเอง. เพิ่ม regression tests สำหรับ old-only, current+old-ended และ faculty-old+KKU-recent.

## สถานะ findings รอบ 2

| รายการ | ผลตรวจ |
|---|---|
| R2-1 | ปิดสาระหลัก: BE แยก metrics readiness, nil snapshot ไม่พร้อม; quality/intl KPI ปีก่อนและ table gaps ใช้ metric guard; citation coverage มี caveat harvest แยกจาก known/cohort |
| R2-2 | ปิดสูตร: observedRate ใช้ร่วม KPI/table/CSV และ test positive/known ผ่าน; scope context ของ export ยังอยู่ใน R3-1 |
| R2-3 | ยังปิดไม่ได้ — R3-1 |
| R2-4 | old-only แก้แล้ว แต่ default หลายประเภทปีพร้อมกันยังไม่ครบ — R3-2 |

## UX/UI และ citation

โครง report, hierarchy, KPI strip และ citation section ยังคงทิศทาง executive report ที่ตกลง. ตรวจภาพ scopebad ที่ส่งมาโดยตรง พบความขัดแย้งระหว่างคำเตือนกับค่าที่แสดงตาม R3-1. Citation ใช้ยอดสะสมของผลงานตามปีตีพิมพ์ มี total/average/known-cohort และคำเตือน freshness/การทับซ้อน ไม่ได้อ้างเป็น citations ที่เกิดในปีนั้น; รอบนี้ไม่พบ blocker ใหม่ในนิยาม citation จากโค้ดที่ตรวจ.

## Verification และข้อจำกัด

- Reviewer รัน `node --test`: 47/47 ผ่าน และ `go test ./services`: ผ่าน.
- Reviewer ตรวจ helper/orchestrator/table/citation/readiness/controller และภาพ scopebad ที่ implementer ส่ง; ไม่ได้เปิด browser harness ใหม่หรือเดิน keyboard/authenticated portal ในรอบนี้ และไม่ได้ render PDF ใหม่.
- Build ที่ผ่านเป็นผลที่ implementer รายงาน ไม่ใช่ build ที่ reviewer รันซ้ำรอบนี้.
- live-be-sample-round2.json เป็นหลักฐานข้อมูลจากรอบก่อน ยังไม่ยืนยัน response contract readiness ราย metric ของ BE รอบ 3 ด้วย live call ใหม่. ไม่ได้รัน query TEST DB ใหม่ในรอบนี้.
- `.claude/launch.json` ยังคง unresolved ตามรายงาน ต้องไม่ถือว่ากู้ค่าเดิมแล้ว.

## สิ่งที่ต้องส่งกลับจาก agent

แก้ R3-1/R3-2 พร้อมตาราง finding → code → test/evidence, ภาพ scope mismatch ทั้งสองแบบ, CSV ตัวอย่างที่มี scope mismatch และผล default-year สามกรณี. ระบุสิ่งที่ยังไม่ตรวจอย่างตรงไปตรงมา. ส่ง prompt สั้นให้ผู้ใช้นำกลับมาเรียก review พร้อม absolute paths ของรายงานและหลักฐาน. ห้าม merge/deploy และไม่เขียนทับไฟล์ review findings ฉบับนี้.
