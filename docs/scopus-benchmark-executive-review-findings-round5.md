# Scopus Benchmark — Review รอบ 5

วันที่ 2026-09-16

Verdict: ปิด R4-1 และผ่าน code review ของรายการแก้ที่ค้างจากรอบก่อน ไม่พบ application blocker ใหม่ในขอบเขตที่ตรวจรอบนี้. ยังไม่ใช่การรับรอง production acceptance ทั้งหน้า และไม่มี merge/deploy.

## R4-1 — ปิด

`app/lib/scopus_benchmark_report.mjs:151` resolveBootstrapFloor ใช้ available_years เป็น existence เพื่อกำหนดช่วงอ่านถึงปีจบที่เก่าที่สุด ไม่อ้างว่าปีนั้น ready. `ScopusBenchmarkDashboard.js:151` ขยาย window เมื่อ needed < windowFrom เท่านั้น และใช้ selectReportYear กับ year_meta ที่โหลดมาเพื่อเลือก faculty=available ก่อน fallback.

ผลตรวจ: ปี 2025 blocked แต่ 2010 available จะโหลดถึง 2010 แล้วเลือก 2010; ทุกปี faculty blocked แต่มี KKU snapshot จะ fallback ปีจบล่าสุด. เมื่อโหลดถึง floor แล้วเงื่อนไขขยาย window เป็น false จึงไม่มี widen loop จากกรณีนี้. manualYear ไม่ถูกแทนที่ด้วย default. Tests ที่เพิ่มครอบ helper และ selection; การไม่วนของ effect ตรวจจากโค้ด ไม่ใช่ component interaction test.

ภาพ desktop-1440-blockednew.png ยืนยันหน้ารายงานลงที่ปี 2010. ไม่มีข้อขอแก้ default-year เพิ่มในรอบนี้.

## UX/UI, CSV และ citation

- โครง executive report และ scope guard ที่ปิดในรอบก่อนยังคงอยู่ ไม่มีการเปลี่ยนทิศทางการออกแบบที่ต้องแก้ใหม่จาก patch นี้.
- comparison-scopebad.csv มี counts 74/304/2940 ตามชุดข้อมูลที่ผู้ implement ระบุ พร้อม subject ของแต่ละระดับ, scope_consistent=false และคำเตือน. ไม่ใช้คำว่า data-ready ใน CSV เป็นหลักฐานว่า scope พร้อมเทียบ.
- Citation ยังแยกยอดสะสมของผลงานตามปีตีพิมพ์ออกจาก citations ที่เกิดในปีนั้น มี known/cohort ตัวหารค่าเฉลี่ยและ freshness unknown. ไม่พบข้อผิดนิยาม citation ใหม่จากการแก้ bootstrap.

## ข้อสังเกตหลักฐาน — ไม่ใช่ production bug ที่พิสูจน์แล้ว

ภาพ blockednew ปี 2010 มี faculty count 40 แต่ classified denominator=72 และ citation cohort=72 ขณะไม่แสดง harvest mismatch; KKU count=180 แต่ citation cohort=300. ชุด fixture จึงไม่สอดคล้องกับกฎ BE ที่ตรวจ snapshot mismatch. ใช้ภาพนี้ยืนยัน default year ได้ แต่ไม่ใช้รับรอง readiness/citation ทั้งหน้า. ควรปรับ fixture ให้ count/cohort/readiness สอดคล้องกัน หรือระบุว่าภาพนี้ตรวจเฉพาะการเลือกปี. ไม่ต้องเปลี่ยน production logic เพื่อให้ตรงกับ fixture ที่ขัดกัน.

## Verification โดย reviewer

- FE node --test: 51/51 ผ่าน.
- BE go test ./services: ผ่าน (cached).
- ตรวจ helper, bootstrap effect, selection tests, comparison CSV และภาพ blockednew โดยตรง.
- ไม่ได้เปิด harness/browser ใหม่ ไม่ได้เดิน portal หลัง login/keyboard ไม่ได้ render PDF ใหม่ ไม่ได้ rerun build หรือ live DB sample ในรอบนี้. Build ผ่านเป็นผลของ implementer.

## ก่อนรับรองใช้งานจริง

ยังต้อง smoke-test route จริงหลัง login: default/year changes, refresh, export, keyboard และ print; และตรวจ response BE ปัจจุบันกับข้อมูล TEST DB เพื่อยืนยัน per-metric readiness/citation ที่ต่อกับ FE จริง. live-be-sample-round2.json เป็นหลักฐานรอบก่อน ไม่ยืนยัน contract ปัจจุบันทั้งหมด. ข้อจำกัดเหล่านี้เป็น acceptance ที่ยังไม่ตรวจ ไม่ใช่ findings โค้ดใหม่.

`.claude/launch.json` ยังคง unresolved ตามรายงาน ห้ามถือว่ากู้ต้นฉบับแล้วหรือรวมการเดาค่าเป็นส่วนที่ได้รับอนุมัติ.

ไม่จำเป็นต้องเปิดรอบแก้ application code ใหม่สำหรับ R4-1. งานถัดไปคือเก็บ integration acceptance ข้างต้น พร้อมระบุสิ่งที่ตรวจไม่ได้อย่างตรงไปตรงมา และแก้ fidelity ของ fixture ก่อนใช้อ้าง readiness. ห้าม merge/deploy จากผล review นี้.
