# Executive report redesign — reviewer findings, round 1

วันที่ตรวจ: 14 กันยายน 2026
ผล: **ยังไม่อนุมัติ — ต้องแก้ P1 และข้อกำหนดที่ตกหล่นก่อนส่ง review รอบถัดไป**

เทียบ handoff ล่าสุด รวม citation §5 E2 / §9 D; ตรวจ working tree ของ FE/BE ที่ HEAD ตามรายงานส่งงาน ไม่มีการแก้ application code, commit, merge หรือ deploy ในรอบ review นี้ เอกสารนี้เป็นผลตรวจของ reviewer แยกจาก `scopus-benchmark-executive-review.md` ของ implementer

## Findings เรียงตามความสำคัญ

### R1 — [P1] SQL bind arguments สลับลำดับ ทำให้ faculty insights/citation หาย

จุดแก้: `G:/works-fund-project/fund-management-api/services/scopus_benchmark_insights.go:234` (`insightArgs`), query ที่บรรทัด 209/229; test `services/scopus_benchmark_insights_test.go:63`.

ทั้งสอง query วาง placeholders `WHERE bds.scope_id = ? AND bds.pub_year = ?` **ก่อน** faculty EXISTS ที่มี AF-ID สองค่า แต่ `insightArgs` ส่ง `[AFID1, AFID2, scopeID, year]`. ตัวอย่าง scope=1/year=2025 กลายเป็น scope=60017165, pub_year=60280609 และ aff.afid IN (1,2025). Faculty cohort จึงไม่ใช่ cohort ที่ต้องการและมักได้ 0 ทั้ง quality/OA/intl/citations.

หลักฐานที่ implementer ส่ง (`live-be-sample.json`) มี faculty unavailable ทั้งปี 2025/2026 สอดคล้องกับผลของ bug นี้ จึงใช้ sample นั้นยืนยันว่า faculty ไม่มีผลงานจริงไม่ได้. Reviewer ไม่ได้เรียก DB ใหม่และไม่ได้อนุมานยอด faculty จริงจาก sample นี้

แก้ให้ส่ง `[scopeID, year, AFID1, AFID2]` และแก้ test ที่ปัจจุบันกำหนด expected เป็นลำดับผิดเดียวกัน. เพิ่ม test ที่ตรวจ query + bound arguments ร่วมกัน และตรวจ EID set/citation ของ faculty กับ official selector บน test data มีสมาชิกผ่านจริง ไม่ใช่ตรวจ string fragments อย่างเดียว

ผ่านเมื่อ: faculty ที่มีเอกสารจริงแสดง insights/citations, totals และ distinct membership ตรง official selector; เก็บ live sample ใหม่และอัปเดตข้อสรุปเดิม

### R2 — [P1] Print stylesheet ทำให้การพิมพ์หน้าอื่นทั้งระบบว่าง

จุดแก้: `G:/works-fund-project/frontend_project_fund/app/globals.css:490–497`.

กฎ `@media print { body * { visibility:hidden !important } }` อยู่ใน global stylesheet และเปิด visibility คืนเฉพาะ `#scopus-report-root`. ทุกหน้าที่ไม่มี report root จะถูกซ่อนตอนพิมพ์ด้วย รวมถึงงานรายงานเดิมที่อยู่นอก scope นี้; `@page` ยังตั้ง A4 ให้ global print ด้วย

จำกัดกฎให้ทำงานเฉพาะเมื่อมีรายงานนี้/อยู่ใน print context ของรายงานนี้ ไม่เปลี่ยน printing behavior ของหน้าอื่น ห้ามใช้ visibility global ที่ไม่มี guard. คำนึงถึง layout containers ของ portal จริงด้วย ไม่ใช่เฉพาะ standalone harness

ผ่านเมื่อ: พิมพ์ report ได้ และ regression check หน้าที่ไม่มี report root ยังคงมีเนื้อหาใน print preview

### R3 — [P1] Readiness ไม่ตรวจความครบถ้วน และ KPI/ตารางไม่ใช้ guard นี้

จุดแก้: `G:/works-fund-project/fund-management-api/services/scopus_benchmark_insights.go:336–379`; FE `ScopusBenchmarkDashboard.js:220–241`, `report/ComparisonTable.js:37–38`.

KKU/Thailand พร้อมเทียบทันทีที่มีเอกสารและไม่มี active run แม้ harvest ไม่ครบ snapshot; faculty ไม่ตรวจ current cohort vs official snapshot mismatch. ไม่มี per-metric readiness/metadata sufficiency ตาม handoff. ฝั่ง FE KPI quality/intl และ pointDiff ใช้ค่าทันทีโดยไม่ดู readiness แม้ BE จะตอบ comparison_ready=false. ข้อความ SourceNotes ที่ว่า “หากจำนวนสองส่วนไม่ตรงกันจะไม่สรุปเปรียบเทียบ” จึงไม่ตรงพฤติกรรมจริง

Reproduce ผ่าน harness ปกติ: ปี 2025 KPI count=74 แต่ insight docs=72 และยังมี high-tier comparative finding. เลือก 2026 ซึ่ง faculty snapshot blocked ยังเห็น quality=84%, intl=50% และตาราง gap +19/+10 pp โดยไม่มีเหตุผลการ block ใกล้ค่า. นี่เป็น fixture demonstration ของ guard ที่หาย ไม่ใช่ข้อสรุปตัวเลขจริง

เพิ่ม expected/observed counts และ mismatch/active-run/metric-specific metadata checks ตาม handoff แล้วใช้ guard ใน KPI, prior-year comparison, findings, gap columns และ exports. ค่าจากชุดที่เก็บได้บางส่วนแสดงได้ในฐานะ observed พร้อมขอบเขต แต่ห้ามสื่อเป็นข้อมูลครบพร้อม benchmark. Citation known/cohort coverage ต้องไม่ถูกใช้แทน harvest completeness; ชุดที่เก็บมาไม่ครบควรมี caveat ใกล้ยอดรวมด้วย

ผ่านเมื่อ: fixture เก็บเพียงบางส่วน, active run, mismatched snapshot และ unknown metric metadata งดข้อสรุป/gap พร้อมแสดงเหตุผล ในขณะที่ metrics/ระดับอื่นที่พร้อมยังใช้งานได้

### R4 — [P1] ตารางและ CSV แสดง missing snapshot เป็นศูนย์จริง

จุดแก้: `G:/works-fund-project/frontend_project_fund/app/(portal)/research-fund-system/admin/components/research/report/ComparisonTable.js:22–23`; `app/lib/scopus_benchmark_report.mjs:205–220,230`.

Controller คง legacy default 0 เมื่อไม่มี snapshot และส่ง year_meta แยกไว้. KPI/trends ใช้ metadata แต่ตารางรับ raw row โดยไม่มี metadata; CSV อ่าน numeric raw value อย่างเดียว. จึงเกิด KPI “ไม่มีข้อมูล” แต่ตาราง/CSV “0 ผลงาน”, รวมถึง share=0% ทั้งที่ไม่ทราบ faculty count

Reviewer เรียก helper จริงด้วย row={faculty:0, university:100, country:0} และ metadata faculty/country status=missing. ได้ yearly CSV `2025,0,missing,100,available,0,missing,0.0` และ comparison CSV `จำนวนผลงาน,0,100,0`. ต้องเป็นช่องว่าง/ยังไม่มีข้อมูลและ share ว่าง ไม่ใช่ 0

Normalize report rows ด้วย per-level year_meta ก่อนใช้ทุก surface และให้ comparison export มี count status. เพิ่ม test ด้วย raw zero + missing metadata ซึ่งเป็น payload รูปแบบจริง ไม่ใช่ทดสอบเฉพาะ null input

### R5 — [P2] OA/intl unknown ยังกลายเป็น negative observation

จุดแก้: `G:/works-fund-project/fund-management-api/services/scopus_benchmark_insights.go:171–182`; `report/ComparisonTable.js` และ KPI intl.

OA NULL ถูก CASE ELSE 0 และ intl ที่ไม่มีหลักฐาน affiliation ถูกนับเป็นไม่ international โดยหารด้วยเอกสารทั้งหมด. Caption “จาก N ผลงาน” ไม่ได้บอกว่ามีข้อมูลที่ไม่ทราบ/ไม่สามารถยืนยันอยู่ด้วย และยังแสดง gap ของ observed rates เหมือน benchmark ปกติ. Deviation นี้ยังไม่ผ่าน §9 B ไม่ใช่เพียง follow-up ด้านความสวยงาม

OA ส่ง positive/known/unknown counts ที่ schema รองรับ; intl ระบุ unknown semantics เท่าที่พิสูจน์ได้ หากยังแยกไม่ได้ให้สถานะ unknown และ label lower-bound/observed rate ที่ตรงนิยาม โดยไม่สร้าง completeness หรือ comparative gap ปกติจากข้อมูลไม่พร้อม. ห้ามเพิ่ม harvesting เพื่อปิดช่องว่างใน scope นี้

### R6 — [P2] Quality coverage ยังแยก missing metadata ออกจาก non-journal ไม่ได้

จุดแก้: `G:/works-fund-project/fund-management-api/services/scopus_benchmark_insights.go:184–200,301`; `report/QualityTypeDetails.js`.

unclassified=docs-classified รวม conference, งานประเภทอื่น และ journal missing metrics. เงื่อนไข aggregation_type != 'conference proceeding' ยังถือ blank/ประเภทอื่นเป็น eligible tier เมื่อมี metric. UI บอก “ยังจัดกลุ่มไม่ได้/งานนอกการจัดกลุ่ม” รวมกัน จึงตรวจว่า metadata ของวารสารครอบคลุมเท่าไรไม่ได้ตาม §5 F/§9 B. ตารางหลักมี numerator/classified แต่ไม่มี coverage ของ eligible journals รายระดับ

แยก eligible classified/unclassified, excluded non-journal และ unresolved source type; ส่ง metric-year policy/coverage และแสดงใกล้ค่า พร้อม reconcile กับ docs. อย่าตัดสิน completeness จากยอด classified รวมสามระดับที่ทับซ้อนกัน

### R7 — [P2] ปีเก่าถูกตัดทิ้งและกราฟสิบปีมีช่องว่างที่ไม่ได้เกิดจากข้อมูลจริง

จุดแก้: `ScopusBenchmarkDashboard.js:31,88–91,111–119`; controller `admin_scopus_benchmark_controller.go:425–483`.

FE อ่านตายตัว 15 ปีและไม่ fetch เพิ่มเมื่อเลือกปีเก่า; yearOptions มาจาก year_meta ช่วงนั้นเท่านั้น. BE available_years ก็รวบรวมใน loop ของ requested range และ faculty เฉพาะ usable ไม่ใช่ snapshot list ทุกปีตาม handoff. เลือกปีต้นช่วงแล้วกราฟ 10 ปีจะสร้าง gaps นอกช่วงที่โหลด แม้ DB มีข้อมูลจริง และข้อมูลที่เก่ากว่า 15 ปีจะเลือกไม่ได้เลย

แก้ available_years ให้ครอบคลุม snapshot metadata ทุกปี (รวม zero/blocked existence แยกจาก readiness), ใช้ discovery นี้เลือก default และโหลดช่วง trend/Y-1 ที่ต้องใช้จริง. การอ่าน 15 ปีครั้งแรกทำได้ถ้าไม่ทำให้ฟังก์ชันขาด ไม่ใช่ใช้เป็นขอบเขตข้อมูลทั้งหมด

### R8 — [P2] CSV ไม่ตรงช่วงกราฟและสูญเสียบริบทข้อมูล

จุดแก้: `ScopusBenchmarkDashboard.js:251–256`; `app/lib/scopus_benchmark_report.mjs:198–266`.

exportYearly ส่ง rows ทั้ง 15 ปีแทนช่วง 5/10 ปีที่เห็นบนหน้า รวมปีหลัง reportYear ด้วย. sourceDates ที่ใส่หัวไฟล์เป็นของ reportYear เดียว ไม่ใช่วันที่ snapshot ของแต่ละปี. Comparison CSV ไม่ใส่ readiness/status ของ metrics, OA/intl denominators, citation freshness/source dates; อาจอ่าน observed subset เป็นรายงานครบเมื่อไฟล์ถูกส่งออกจากหน้า

ใช้ normalized rows ในช่วงที่ผู้ใช้เลือกและแนบ per-row/per-level source metadata; export report-year metrics พร้อม status/denominator/coverage/freshness ตามที่หน้าแสดง ห้ามใช้ reportYear dates แทนทุกปี. เพิ่ม test ว่าเปลี่ยน 5→10 และ reportYear แล้ว export ตรงช่วง/สถานะจริง

### R9 — [P2] ตัวอักษรกราฟถูกย่อจนอ่านไม่ได้บนมือถือ

จุดแก้: `report/TrendCharts.js:24–26,55,78,92–94` (absolute base path ตาม FE ด้านบน).

กราฟจำนวนใช้ fixed SVG viewBox 520 และ fontSize=11 แล้ว scale ทั้งภาพตาม width. Reviewer วัด live harness ที่ viewport 390: plot width=298px ทำให้ตัวหนังสือเทียบเท่า 11×298/520 ≈ **6.3px**, ต่ำกว่าเกณฑ์ 12px มาก; share chart scaled เช่นเดียวกัน กราฟสองอันบน desktop ยังมี effective text scale/height ต่างกันจาก viewBox ที่กว้างไม่เท่ากัน

วาดตาม container width จริง หรือชดเชย label size/axes/layout ให้ขนาดอ่านได้ไม่ถูก scale ลง ใช้จำนวน ticks เหมาะกับจอเล็กและ 10 ปี. ตรวจ 320/390 ด้วย actual viewport ไม่เพียง screenshot กว้างตามชื่อไฟล์; ไม่แก้ด้วย horizontal overflow ทั้งหน้า

## ข้อที่ยังไม่ผ่าน/ต้องแก้หลักฐานก่อนอนุมัติ

- R1–R9 ต้องมี fixes/verification ตรงประเด็นก่อนอ้าง acceptance ผ่านทั้งชุด
- ยังไม่มี authenticated production-route UI verification; harness ไม่ยืนยัน portal shell/auth/print integration. รอบ reviewer นี้ใช้ harness เช่นกัน ไม่ได้ login หรือเรียก live API/DB เพิ่ม
- ไม่มีการตรวจ scope mismatch ทั้งสามระดับก่อน hardcode “Computer Science เดียวกัน”; ทำ guard ตาม handoff §4
- Refresh ทั้งรายงานยังไม่มี action ที่ใช้งานได้ (setReload ใช้ retry initial error เท่านั้น); prior-year insights error ถูกกลืนเป็นไม่มีข้อมูล; print/export ยังเปิดระหว่าง loading และ print ซ่อน error banner จึงไม่บอก failure ตามข้อกำหนด ควรปิด action ระหว่างเปลี่ยนปีหรือพิมพ์สถานะที่ชัดเจน
- เกณฑ์ atomic year/readiness/late responses ยังไม่มี interaction tests ที่มี delayed responses; การตรวจ helper อย่างเดียวไม่พิสูจน์รายงานทุก section
- Snapshot EID-set equivalence ยังไม่ถูกทดสอบจริง; query-fragment tests ไม่เพียงพอและมี test ที่ encode bug R1
- ภาพ mobile ที่ implementer ส่งดูถูกตัดด้านขวา แต่ reviewer วัด live harness ใหม่แล้ว root ไม่ล้น viewport 390 (332px root, body width 380). ไม่สรุปว่ามี whole-page overflow ใน code ปัจจุบันจากภาพเก่าเพียงอย่างเดียว; ต้องเก็บ evidence ใหม่ที่ตรง viewport/HEAD
- `.claude/launch.json` ถูก implementer รายงานว่าเขียนทับและเดาค่าใหม่: ต้องตรวจเทียบ backup/ประวัติที่มีและแจ้ง user ถ้ากู้ไม่ได้ ห้ามเดาค่าเดิมเพิ่ม Reviewer ไม่ได้แก้ไฟล์นี้
- Review package ทำเครื่องหมายผ่านหลายข้อที่ยังตกหล่น (per-metric readiness, CSV context, unknown metadata) ให้ปรับสถานะตามหลักฐานจริง

## สิ่งที่ตรวจแล้วและใช้ต่อได้

- โครงรายงานใหม่อ่านเป็นลำดับชัดกว่าหน้าเดิม ไม่มี hero/mini-bars ซ้ำ; citation เป็น section เปิดแสดงพร้อมยอดรวมและค่าเฉลี่ย นิยาม cumulative publications cohort ถูกต้อง
- Citation query แยกจาก source-metrics join, schema citedby_count เป็น nullable และ harvest parse pointer; SUM/known-denominator และการปล่อย timestamp ไม่ทราบเป็น null เป็นแนวทางถูกต้อง **ยกเว้น faculty argument bug และ harvest completeness ข้างต้น**
- FE `node --test`: rerun ผ่าน 43/43; BE `go test ./services`: rerun ผ่าน (ใช้ workspace GOCACHE เนื่องจาก default cache ถูกปฏิเสธสิทธิ์). Passing suites ไม่ได้ปิด findings ข้างต้น
- ไม่ rerun builds ในรอบ reviewer; build pass เป็นหลักฐานจาก implementer ไม่ใช่ผลรันใหม่ของ reviewer
- เปิด harness จริงบน local temporary port 3142, ตรวจ selected year และค่าตาราง, ตรวจ layout ที่ 390px ด้วย DOM geometry; ตรวจ source, diffs, tests และ live-be-sample ที่ส่งมา
- Local preview โหลด Sarabun จาก Google Fonts ไม่สำเร็จและใช้ fallback font จึงไม่ถือว่ารอบนี้ยืนยัน typography Sarabun จริงครบ; finding เรื่อง SVG scale อิง viewBox/ขนาดที่วัดได้และยังคงใช้ได้ ปิด preview server และคืน browser viewport หลังตรวจแล้ว
- อ่าน PDF `print-normal.pdf` โดย render และตรวจทั้ง 3 หน้า: ไทย/ตาราง/citation อ่านได้ ไม่มีการ clip ที่เห็นใน sample นี้ แต่ยังมี summary ของ details ปิดอยู่พิมพ์ออกมา และยังไม่ยืนยัน print ใน portal จริง/หน้าอื่น. จำนวน 3 หน้าไม่ใช่ blocker ด้วยตัวเอง

## รอบแก้ไขที่ขอ

ให้ implementer อ่านไฟล์นี้และ handoff ล่าสุด แก้ R1–R9 กับ remaining acceptance โดยไม่ merge/deploy อัปเดต review package พร้อมตาราง R1–R9 → change → evidence, เพิ่ม regression tests ที่จับ bugs จริง, เก็บ screenshots/PDF และ sample ใหม่ที่แยก fixture/live และส่ง prompt สั้นพร้อม path รายงานกลับมาให้ reviewer อีกครั้ง ห้ามแก้ expected test ให้ผ่านโดยไม่ตรวจนิยามและผลลัพธ์จริง
