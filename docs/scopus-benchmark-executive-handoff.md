# Scopus Benchmark — Executive reporting redesign

วันที่: 14 กันยายน 2026 · สถานะ: แผนเสนอและ visual reference รอเจ้าของงานตรวจหน้าตา

ปรับเพิ่มหลังหารือ: ผู้ใช้เห็นด้วยกับทิศทางภาพร่าง และยอมรับให้ใช้ citation เท่าที่ข้อมูลปัจจุบันรองรับ คือยอดสะสมของเอกสารตามปีตีพิมพ์ เพิ่มส่วนการอ้างอิงตาม §5 E2 และ §9 D เป็นข้อกำหนดล่าสุด ภาพร่าง HTML รุ่นเดิมยังมีเพียงแถว citation เฉลี่ย; ให้ใช้ส่วน E2 แทนแถวนั้นตอน implement โดยไม่แสดงซ้ำ

## 1. เป้าหมายและอำนาจตัดสินใจ

ผู้ใช้เลือกการใช้งานหลัก: **ติดตามผลงานและรายงานต่อที่ประชุม** และอนุญาตให้ออกแบบหน้าใหม่ทั้งหมด ผู้วางแผนรับผิดชอบ handoff และ review; agent อีกตัวเป็นผู้ implement ตาม prompt ที่ผู้ใช้ส่งให้ ไม่มีการแก้ application code ในรอบวางแผนนี้

เปิดหน้าแล้วภายในประมาณ 30 วินาทีต้องตอบได้ว่า ปีใด/ขอบเขตใด, ผลงานคณะเปลี่ยนอย่างไร, เทียบภาพรวมมหาวิทยาลัยและประเทศอย่างไร, ข้อสรุปใดมีข้อจำกัดจากข้อมูล ไม่รวมการแนะนำจัดสรรงบ จัดอันดับบุคลากร หรือทำนายผลลัพธ์

Visual reference: `docs/scopus-benchmark-executive-preview.html` เป็นสำเนาภาพร่างสำหรับอ่านโดย agent; ตัวเลขทั้งหมดเป็นข้อมูลสมมติสำหรับออกแบบ ไม่ใช่ ground truth และห้ามนำเข้า runtime หรือใช้ยืนยันผลทดสอบจริง ภาพร่างเป็นข้อเสนอที่ยังไม่ได้รับอนุมัติหน้าตาขั้นสุดท้าย หากผู้ใช้ส่ง prompt นี้ให้ implement ให้ถือเป็นการอนุมัติให้ใช้แผนรุ่นนี้ เว้นแต่มีคำแก้ไขแนบมา

ภาพร่างแสดง composition หลัก, การสลับปี 2024/2025 และการเปิดรายละเอียด ตัวเลือก 5/10 ปี, ปุ่มพิมพ์/export, coverage states และเนื้อหารายละเอียดเต็มต้อง implement ตามเอกสารนี้แม้ภาพร่างไม่ได้จำลองครบ; ภาพร่างตาม theme ของเครื่อง ส่วนหน้า production ใช้ theme ของโปรเจกต์ ห้ามเพิ่ม dark-mode setting ใหม่เพียงเพราะภาพร่างแสดง dark ได้

## 2. Baseline ที่ตรวจแล้ว / ข้อจำกัดหลักฐาน

- FE repo `G:/works-fund-project/frontend_project_fund`, branch `feature/scopus-benchmark-dashboard`, HEAD `624842778e772632ab0967fd04b2e0cca5d30af7`.
- BE repo `G:/works-fund-project/fund-management-api`, branch `feature/scopus-benchmark-insights`, HEAD `b09afeddc34c965c9599edf45566d8237357fbd6`.
- ตรวจ source, docs และ API implementation แล้ว ไม่ได้ยืนยัน live DB/API หรือ screenshot หน้าเดิม; ไม่พบ listener 3000/3001/8080/8081 จากการตรวจ local ในรอบนี้ จึงห้ามอ้างว่าได้ verify UI จริงแล้ว
- FE มี `.claude/` untracked อยู่ก่อนงานนี้: ห้ามลบ/รวม commit โดยไม่เกี่ยวข้อง ไม่พบ AGENTS.md จากการค้นในสอง repo; agent ต้องตรวจใหม่ก่อนเริ่ม
- เอกสารเก่า `scopus-benchmark-dashboard-spec.md`, roadmap และ revamp เป็นประวัติเท่านั้น หาก layout/สูตรขัดกับเอกสารนี้ ให้เอกสารนี้เป็นข้อกำหนดงานใหม่ โดยรักษานิยาม verified faculty ที่ใช้อยู่
- ไม่เปลี่ยน route, global navigation, authorization, หน้ารายงานอื่น หรือกระบวนการ setup/harvest เดิม ไม่ deploy, merge, migrate production หรือเริ่ม harvest/refresh Scopus เพื่อทดสอบโดยอัตโนมัติ

## 3. ข้อค้นพบจากโค้ดที่ต้องแก้

ไฟล์ FE หลัก: `app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js`, `AdminScopusBenchmark.js`; API client `app/lib/api.js`.
ไฟล์ BE: `controllers/admin_scopus_benchmark_controller.go`, `services/scopus_benchmark_insights.go`, `services/scopus_benchmark_service.go`.

1. KPI อิง latest row แต่ lead/quality/impact อิง deepYear และ top journals รวมทุกปี: จัดเป็น reportYear เดียวสำหรับสรุปทุกส่วน
2. จำนวนสามระดับบนแกนเดียวซ่อนแนวโน้มคณะ: แยกกราฟจำนวนคณะและสัดส่วน ไม่ใช้ dual axis
3. `null` ถูกแปลงเป็น 0 หลายจุด; `null >= null` ใน lead สามารถสร้างคำสรุปว่าคณะนำได้: มี helper ตรวจ usable value ทุกสูตร/ข้อความ
4. กราฟ YoY ไม่กันปีปัจจุบัน แม้ KPI กันแล้ว: ห้ามเทียบ YTD กับเต็มปีในทุก surface
5. index ปัจจุบันเลือก positive base แยกปีต่อระดับ: รอบนี้ตัดโหมด index/YoY selector ออกจากหน้าหลัก ลดความซับซ้อน
6. coverage quartile รวมคณะ+KKU+ประเทศ ทั้งที่ชุดทับซ้อนกัน: ใช้ per-level เท่านั้น และแยกงานนอกการจัดกลุ่มออกจาก missing metadata
7. official faculty count ใช้ verified EID/ผู้แต่ง/affiliation/employment แต่ insights ใช้ `is_faculty` อย่างเดียว: ต้องทำให้ cohort ตรงกันก่อนประกาศเปรียบเทียบ
8. comparison map ไม่มี snapshot กลายเป็น 0; มี `faculty_metric` แต่ไม่ได้ pass เข้า dashboard: เพิ่ม metadata แยก missing/zero และส่งสถานะถึง UI
9. top-journals คือ publication venues ของ KKU ทุกปี ไม่ใช่คำแนะนำวารสารคณะ: เอาออกจาก report UI ไม่ต้องลบ endpoint
10. insights loading ทำให้ทั้งหน้ากลับเป็น skeleton และ refresh อ่าน comparison อย่างเดียว: ใช้ loading แยกส่วน และ refresh ข้อมูลรายงานทั้งหมดแบบ read-only

## 4. UX contract: เวลา ขอบเขต และความพร้อม

### Report year

- `reportYear` ตัวเดียวอยู่หัวหน้า ทุก KPI, ตารางเปรียบเทียบ, ประเด็นสำคัญ, quality/type details และ export ต้องอิงปีนี้; ห้ามแต่ละ metric fallback ไปคนละปีโดยเงียบ
- default เลือกปี < ปีปัจจุบัน ล่าสุดที่ faculty count มี snapshot และผ่าน readiness; ถ้าไม่มี ให้เลือกปี < ปีปัจจุบัน ล่าสุดที่มี snapshot ของ KKU/ประเทศ และแสดงว่าคณะยังไม่พร้อม; ถ้ามีเพียงปีปัจจุบัน ให้เลือกพร้อมป้ายข้อมูลสะสม; ถ้าไม่มีเลยแสดง empty state ไม่ยกข้อมูลสมมติมาใช้
- ค่า 0 ที่มี snapshot เป็นปีที่มีข้อมูล ห้ามใช้ `>0` ตัดสิน availability
- bootstrap อ่าน comparison 10 ปีย้อนหลังแบบ GET พร้อม additive `available_years` จาก snapshot metadata ทุกปีที่ controller อ่านอยู่แล้ว; หากปีล่าสุดที่เลือกได้อยู่นอกช่วง ให้โหลด comparison ช่วงนั้นครั้งเดียวและประเมิน faculty readiness ก่อนเลือก ไม่ไล่ยิงทุกปีถึง 1900; ไม่มี auto harvest ไม่มี auto detect endpoint ที่เรียก Scopus; manual year selector รองรับปี 1900..currentYear โดย validation เดิม
- แยกสองเรื่อง: “สิ้นสุดปีปฏิทินแล้ว” ไม่เท่ากับ “เก็บเอกสารครบแล้ว” ไม่ใช้คำว่าข้อมูลครบเพียงเพราะปีเก่า
- ประวัติเลือก 5 ปี (default) / 10 ปี **สิ้นสุดที่ reportYear** ไม่แยก from/to บนหน้ารายงาน งาน setup ใช้ตัวเลือกช่วงปีของตัวเอง
- เปลี่ยนปีเป็น atomic report context: label เปลี่ยนพร้อม placeholder ของค่าปีใหม่, ห้ามตัวเลขปีเก่าอยู่ใต้ชื่อปีใหม่; guard late responses; retry แยกส่วนได้
- ส่วนต่างปีต่อปีใช้ Y กับ Y-1 จริง แม้เลือกช่วงกราฟสั้นลง; ปีก่อนขาดไม่กระโดดข้ามปี
- ปีปัจจุบันใช้ “ข้อมูลสะสมปี YYYY” และไม่แสดง YoY/คำว่าลดลงเทียบปีเต็ม; same-year benchmark ยังแสดงได้เมื่อ coverage ผ่าน พร้อมระบุเป็นข้อมูลสะสม ไม่ประมาณการเต็มปี

### ขอบเขต

ชื่อไทยของสามระดับใช้ “คณะ”, “มหาวิทยาลัยขอนแก่น”, “ประเทศไทย” ตามจริง โดยแสดง Computer Science เป็น subtitle ถาวร ไม่สื่อว่าคณะเทียบกับทุกสาขาของประเทศ
คณะเป็นส่วนหนึ่งของ KKU และ KKU เป็นส่วนหนึ่งของประเทศ ไม่ใช่กลุ่มอิสระ ไม่ตีความเป็น ranking ไม่บวกยอดสามระดับเป็น grand total
อ่าน subject/scope config เพื่อยืนยัน COMP; ถ้าตั้งค่าไม่ตรงกัน ให้แจ้ง scope mismatch และงด benchmark conclusion ห้าม hardcode หัวข้อ COMP เพื่อกลบข้อมูลสาขาอื่น

## 5. Layout specification (ต้องทำตาม ไม่ใช้ layout เดิม)

ใช้ shell/sidebar เดิมของระบบ พื้นที่รายงานเป็น white report surface ต่อเนื่องบน canvas เดิม max-width 1280px; desktop padding 32px, tablet 24px, mobile 16px ไม่สร้าง sidebar ใหม่จากภาพร่าง

### A. Header (~100–140px)

บรรทัดบริบท “วิจัย / รายงานเปรียบเทียบ”; h1 “ผลการดำเนินงานวิจัย” 26–28px/600; subtitle “Computer Science · คณะเทียบมหาวิทยาลัยขอนแก่นและประเทศไทย” 14px.
ขวา: label “ปีรายงาน (ค.ศ.)” + select 40px; ปุ่ม secondary “พิมพ์รายงาน” และ menu/link “ส่งออกข้อมูล”. ไม่ทำ hero, gradient, sparkle, ไอคอนหน้าหัวข้อ หรือ slogan.
บรรทัด metadata: ปีรายงาน, ช่วงแนวโน้ม, วันที่ข้อมูลแต่ละแหล่งเมื่อทราบ; ปุ่มข้อความ “ดูแหล่งข้อมูล”. ถ้าวันที่ไม่ทราบบอก “ไม่ทราบวันที่อัปเดตข้อมูล” ไม่เอาเวลาที่เปิดหน้ามาแทน

### B. KPI strip (~140px)

หนึ่งแถว 4 คอลัมน์บน desktop, ไม่มีกรอบการ์ดแต่ละใบ ใช้เส้นแบ่งแนวตั้งบาง; บน mobile 2x2 พร้อมเส้นแบ่งแนวนอน
1) จำนวนผลงานคณะ: value + “ผลงาน”; subline “ปีก่อน N · +D ผลงาน (+P%)”
2) สัดส่วนผลงานคณะต่อ KKU: value %; subline “ปีก่อน P% · ±D จุดเปอร์เซ็นต์”
3) ผลงานในวารสารกลุ่ม T1–Q2: value %; subline จำนวนตัวตั้ง/ตัวหารที่จัดกลุ่มได้ และปีก่อนเมื่อ usable
4) ผลงานร่วมกับต่างประเทศ: value %; subline จำนวนตัวตั้ง/ตัวหารที่ตรวจได้ และปีก่อนเมื่อ usable
value 32–36px/600, label 14px, subline 13px, tabular numbers. ไม่ใส่ icon container หรือใช้สีคนละสีทุก KPI. ตัวเลข KKU/ประเทศไม่เป็น KPI ใหญ่แยกอีกชุด

### C. ประเด็นสำคัญของปี (~90–130px)

อยู่ถัด KPI ก่อนกราฟ เป็นข้อความไม่เกิน 2 bullets แต่ละ bullet ไม่เกิน 2 บรรทัดบน desktop; ไม่มี banner สีน้ำเงินขนาดใหญ่ ไม่มีการ์ด mini-bar ซ้ำ.
ทุกประโยคอิงกฎ deterministic ตาม §8. ไม่มีข้อความชมอัตโนมัติ “ยอดเยี่ยม/โดดเด่น/มีศักยภาพสูง”. หากข้อมูลไม่พอให้บอกข้อจำกัดที่เจาะจงแทนการสร้าง insight

### D. แนวโน้มย้อนหลัง (~280–320px)

หัวข้อซ้าย “แนวโน้มผลงานคณะ”; ขวา 5 ปี / 10 ปี (local control ขับสองกราฟนี้เท่านั้น ไม่เปลี่ยน reportYear)
desktop สองกราฟ 60:40, ขนาดพื้นที่ plot สูงเท่ากัน; ไม่มีการ์ดครอบ
- ซ้าย column chart จำนวนคณะรายปี baseline=0; ปีก่อนใช้ blue tint, reportYear ใช้ blue เข้ม; label count บนแท่ง; ticks ปีเต็ม, หน่วยผลงาน; ปีปัจจุบันใช้ fill pattern/เส้นขอบพร้อมคำว่า “สะสม” ไม่อาศัยสีอย่างเดียว
- ขวา line chart สัดส่วนคณะ/KKU รายปี จุดและเส้นตรง ไม่ smooth; หน่วย %, แกนเริ่ม 0, dynamic upper bound ที่อธิบายได้ ไม่ทำ dual axis; ค่าสุดท้าย direct label
- missing = gap ไม่ใช่ 0; สัดส่วน denominator 0 = ไม่มีฐานคำนวณ; short series แสดงได้ 1 จุดพร้อม caption
- ไม่มี mode count/index/YoY; ไม่มีเส้นจำนวนประเทศไทยทับคณะ; ไม่มีพื้นที่ chart toolbar/download ของ library ที่ซ้ำกับ report actions
- มี “ดูตัวเลขรายปี” เป็น native details เปิดตารางเดียวกันเพื่อ keyboard/meeting verification; ไม่เปิดโดย default

เป้าหมายที่ viewport 1440x900 (รวม shell จริง): เห็น header, KPI, ประเด็นหลักและกราฟส่วนใหญ่ โดยไม่ลดตัวหนังสือเพื่อยัดจอ; ที่ 1280x800 เห็นอย่างน้อยหัวกราฟ

### E. ตารางเปรียบเทียบ (สาระหลัก ไม่ซ่อนในแท็บ)

หัวข้อ “เปรียบเทียบปี YYYY”; columns: ตัวชี้วัด | คณะ | มหาวิทยาลัยขอนแก่น | ประเทศไทย | คณะเทียบ KKU.
แถว: จำนวนผลงาน, สัดส่วน T1–Q2, ความร่วมมือต่างประเทศ, Open Access. การอ้างอิงย้ายไปส่วน E2 ที่เห็นได้ทันทีด้านล่าง ไม่ซ้ำแถวเดิม
column คณะพื้น blue-50 เบามาก; table header เป็นพื้น neutral, เส้นแนวนอน ไม่มี vertical grid ทุก cell; ตัวเลข align right, labels left; row padding 14–16px, ตัวหนังสือ 14px.
ส่วนต่างของ % ใช้จุดเปอร์เซ็นต์; แถวจำนวนคอลัมน์สุดท้ายใช้ “คิดเป็น X%” ไม่แสดง count gap ระหว่างคณะกับองค์กรแม่
เซลล์คุณภาพแสดง numerator/denominator และความครอบคลุมรายระดับเป็น subline; missing/partial แสดงสถานะตรง cell ไม่ปล่อยให้ผู้ใช้ดูแค่ตัวเลขแล้วเข้าใจว่าครบ
ค่า OA/intl/citation ไม่ติดป้าย “ดีกว่า” หรือสีเขียวอัตโนมัติเมื่อสูงกว่า; ตารางเปรียบเทียบเชิงพรรณนา ไม่ใช่ performance score

### E2. การอ้างอิงของผลงาน (เปิดแสดงเสมอ)

วางหลังตารางเปรียบเทียบ ก่อนรายละเอียดที่พับได้ ใช้ section บน report surface เดียวกัน เส้นแบ่งบางและระยะ 24–32px ตามส่วนอื่น ไม่มี hero หรือการ์ดชุดใหม่
หัวข้อ **“การอ้างอิงสะสมของผลงานที่ตีพิมพ์ปี YYYY”**; subtitle **“ยอดสะสม ณ ครั้งที่อัปเดตข้อมูล ไม่ใช่จำนวนการอ้างอิงที่เกิดขึ้นในปี YYYY”** ปีตรงกับ reportYear เสมอ
ตารางกะทัดรัด 4 columns: ตัวชี้วัด | คณะ | มหาวิทยาลัยขอนแก่น | ประเทศไทย; เน้น column คณะแบบเดียวกับตารางหลัก แถว:
1. การอ้างอิงสะสมรวม — จำนวนเต็ม หน่วย “ครั้ง”
2. การอ้างอิงเฉลี่ยต่อผลงานที่มีข้อมูล — ทศนิยม 1 ตำแหน่ง หน่วย “ครั้ง/ผลงาน”
3. ผลงานที่มีข้อมูลการอ้างอิง — known docs / cohort docs พร้อมสถานะความครบถ้วนและวันที่/ช่วงวันที่อัปเดตที่พิสูจน์ได้รายระดับ
ไม่ต้องเพิ่มกราฟ 3 ระดับอีกชุด เพราะตารางตอบการเทียบยอดรวมและค่าเฉลี่ยพร้อมกันได้ ไม่ทำ citation YoY หรือกราฟ “citation ที่เกิดขึ้นแต่ละปี” จาก citedby_count และไม่ใช้ snapshot จำนวนผลงานแทน citation history
เมื่อมีเพียงบางระดับ ให้คงทุก column พร้อมข้อความ “ยังไม่มีข้อมูล”; ถ้า citation มีบางเอกสาร ให้ยอดรวมมี label “ยอดที่พบในข้อมูล N/M ผลงาน” และค่าเฉลี่ยมี denominator ที่มองเห็น ไม่อ้างเป็นยอดครบของระดับนั้น
ถ้าไม่ทราบวันที่ citation อัปเดต ให้แสดง “ไม่ทราบวันที่อัปเดตการอ้างอิง”; ไม่ซ่อนค่าที่มีเพียงเพราะไม่มี timestamp แต่ไม่สร้างคำสรุปว่าระดับใดเหนือกว่าเมื่อ freshness/coverage เทียบกันไม่ได้
caption ถาวร: “ผลงานเก่ามีเวลาสะสมการอ้างอิงมากกว่า สามระดับมีผลงานทับซ้อนกัน จึงไม่ควรรวมยอดเข้าด้วยกัน” ไม่ตีความค่าเฉลี่ยเป็นคุณภาพหรือ field-normalized impact
รวมส่วนนี้ในรายงานพิมพ์หลักและ CSV ตารางปีรายงาน; บนจอเล็กใช้รูปแบบตารางเลื่อนเฉพาะส่วนตามข้อกำหนดเดิม ไม่ซ่อนหลังแท็บหรือ details

### F. รายละเอียดประกอบ (progressive disclosure)

หนึ่ง native details ชื่อ “รายละเอียดคุณภาพวารสารและประเภทผลงาน” default collapsed; เปิดแล้ว desktop 2 columns:
- distribution T1, Q1 ที่ไม่รวม T1, Q2, Q3, Q4 เป็น horizontal stacked bars รายระดับ พร้อม counts; แสดง unclassified journal และงานนอกการจัดกลุ่มแยกชัดเจน ไม่ซ่อนใน 100% จนดูเหมือนจัดกลุ่มได้ทั้งหมด
- ประเภทผลงานเป็น count + share table (Article / Conference / Other) เทียบสามระดับ; default ไม่ใช้กราฟจำนวนที่ประเทศครอบสเกล
ไม่แสดง top journals ใน scope นี้; ไม่ต้องเพิ่ม journal recommendations หรือ drilldown endpoint รายเอกสารเพื่อให้ส่วนนี้ทำงาน

### G. Methodology/footer

ลิงก์ “นิยามและความพร้อมของข้อมูล” เปิด details มี definition ของ verified faculty, source counts vs harvested docs, metric-year policy, date-of-employment fallback, scope, การทับซ้อนสามระดับ, per-level availability/coverage และเวลาข้อมูลจริง
ข้อจำกัดที่มีผลต่อค่าบนหน้า ต้องปรากฏใกล้ค่านั้นอยู่แล้ว ไม่ซ่อนทุกอย่างไว้ท้ายหน้า
คงแท็บ “ตั้งค่า & ดึงข้อมูล” เพื่อเจ้าหน้าที่ แต่ลด prominence; ไม่ใส่ harvest CTA ในหน้ารายงาน ยกเว้นลิงก์ไป setup เมื่อข้อมูลขาด

## 6. Visual system / ข้อห้าม

- Font Sarabun ตามโปรเจกต์, fallback sans-serif; title 28/600, section 18/600, body/table 14–16/400, supporting 13/400, KPI 36/600; Thai line-height 1.5–1.65
- Colors: ink #0f172a, secondary #475569, muted #64748b, rules #e2e8f0, report #ffffff, canvas #f5f7fb, faculty #2563eb, subtle faculty #eff6ff. Amber สำหรับข้อจำกัด, red สำหรับ error; green ใช้เฉพาะ delta จำนวนที่อธิบายด้วย +/ข้อความแล้ว ไม่เป็นตราประทับความสำเร็จ
- spacing scale 4/8/12/16/24/32, section gap 32, control radius 6, structural surface radius ไม่เกิน 8; ไม่มี shadow ยกเว้น menu/popover
- ไอคอนเฉพาะปุ่ม action ที่ช่วยสื่อความหมาย; button labels ต้องมีข้อความ; ไม่ใส่ info ทุกหัวข้อ
- ห้าม hero gradient, decorative icon badges, nested cards, mini charts ซ้ำ KPI, doughnut/gauge/radar, arbitrary score/target, smooth lines บิดแนวโน้ม, all-green success narrative, header ใหญ่กินหน้าจอ, spinner ทับทั้งหน้าทุกครั้ง
- reuse Tailwind/project components ได้ แต่ห้ามใช้ Panel/KpiCard เดิมแล้วแค่สลับสี เพราะต้องเปลี่ยน visual hierarchy ตาม §5

## 7. Responsive, accessibility, printing/export

Responsive: >=1100 content px KPI 4 columns/charts 60:40; 700–1099 KPI 2x2/charts stack หาก labels แน่น; <700 header actions wrap, KPI 2x2, charts stack. ทดสอบ page viewport 1440x900, 1280x800, 768x1024, 390x844 และ 320px.
ตารางบนมือถือใช้ local horizontal scroll พร้อม caption ว่าเลื่อนได้และ sticky indicator column โดยไม่บังข้อมูล; ห้าม horizontal overflow ทั้งหน้า ไม่มี font ต่ำกว่า 12px. ใน print ไม่มี sticky/scroll
ใช้ semantic headings/table th scope/caption, native buttons/select/details, focus ring มองเห็น, target touch >=44px, chart accessible summary + table, ไม่ใช้ hover เป็นช่องทางเดียว. Keyboard เปลี่ยนปี เปิด details และ retry ได้ครบ

Print: ปุ่ม “พิมพ์รายงาน” เปิด browser print หลังข้อมูลพร้อม; ห้ามเรียก browser print จาก header เก่าอย่างเดียวแล้วถือว่าเสร็จ
- A4 portrait มี report header/year/scope, KPI, ประเด็นสำคัญ, trends, comparison และ essential caveats เรียงเดิม เป้าหมาย 2 หน้าเมื่อข้อมูลปกติ แต่ยอมเพิ่มหน้าเมื่อข้อความยาว ห้าม shrink จนอ่านไม่ได้
- ไม่พิมพ์ shell/sidebar/nav/setup/actions/controls; font body >=10.5pt; chart label >=9pt; repeat table header, avoid splitting KPI/chart/row; legend/values อ่านได้ grayscale
- closed optional details ไม่พิมพ์; essential source notes ต้องพิมพ์เสมอ; ถ้าผู้ใช้เปิดรายละเอียด ให้ต่อ appendix ด้วย page break; ห้ามบังคับหนึ่งหน้า
- แยก “สร้างรายงานเมื่อ” ออกจาก “ข้อมูลอัปเดตเมื่อ”; ส่วนไหนไม่พร้อมให้พิมพ์คำแจ้งตรงนั้น ห้ามรอไม่มีที่สิ้นสุด
- ส่งออกข้อมูลมี 2 ตัวเลือกชื่อชัด “ตัวเลขรายปี (CSV)” และ “ตารางเปรียบเทียบปีรายงาน (CSV)”; UTF-8 BOM, escape ตาม CSV, missing เป็นช่องว่างพร้อม status, มี denominator/coverage, scope/year/source dates; ไม่ export 0 แทน missing และไม่ใช้ข้อมูล mock

## 8. สูตรและกฎข้อความสรุป

- Growth = (Y - Y-1)/Y-1 ×100 เมื่อปีจบแล้ว ค่าทั้งคู่ usable และปีก่อน >0; ปีก่อน=0: แสดง “เพิ่มจาก 0 เป็น N” ไม่ Infinity. ทั้งคู่ 0: “ไม่เปลี่ยนแปลงจากปีก่อน”
- Share = faculty/KKU ×100 เมื่อทั้งคู่ usable และ KKU>0; share change เป็น subtraction หน่วยจุดเปอร์เซ็นต์ ไม่ relative %
- High-tier share = (T1 + Q1-exclusive + Q2)/(T1+Q1-exclusive+Q2+Q3+Q4) ×100; ตัวหาร 0 = unavailable. UI label T1–Q2, definition บอก T1 ถูกแยกจาก Q1 แล้ว ไม่บวกซ้ำ
- งานนอกการจัดกลุ่มไม่ถูกนับเป็น missing journal metadata; journal coverage = classified/eligible journals ตาม policy BE ที่ส่งมาชัดเจน ไม่เอา conference มาทำให้ดูว่า metadata ขาด; non-journal/unresolved classification ต้องแยกกัน
- OA/intl unknown ต้องไม่แปลงเป็น false เพื่อสร้างคำสรุป; ระบุ denominator policy หากใช้ observed rate; ไม่เปลี่ยน denominator โดยซ่อนจาก UI; count numerators ควรมาจาก BE ไม่ reverse-engineer ด้วย rounded percentages
- Citation total = SUM(citedby_count) ของ distinct documents ใน cohort ปีตีพิมพ์ที่เลือกและมีค่า citation ที่ทราบ; citation average = total / known citation documents (รวมค่าศูนย์จริงใน denominator). known=0 ให้ total และ average เป็น null ไม่ใช่ 0; ถ้าทุกค่าเป็นศูนย์จริงให้ทั้งสองเป็น 0. ถ้าข้อมูลมีบางส่วน ใช้ label observed subset ชัดเจน ไม่หารด้วยจำนวน snapshot ของเอกสารที่ยังไม่ได้เก็บ
- ไม่ใช้ค่าเฉลี่ยที่ปัดเศษแล้วคูณ docs เพื่อย้อนหายอดรวม; ไม่บวกยอดคณะ+KKU+ประเทศ เพราะ cohorts ทับซ้อนกัน ระบุ metric freshness และไม่ใช้ citation เป็นคำสรุปนำ ไม่สื่อเป็น field-normalized impact หรือ causal effect ของ OA

กฎเลือกประเด็น ไม่เกิน 2 (ลำดับ priority):
1. จำนวนคณะเพิ่มแต่ share ลด และ Y/Y-1 พร้อม: “ผลงานคณะเพิ่ม ... ผลงาน (...%) แต่สัดส่วนต่อ KKU ลด ... จุดเปอร์เซ็นต์ เนื่องจากจำนวนผลงาน KKU เติบโตเร็วกว่า” (เป็นความสัมพันธ์เชิงคณิตศาสตร์ ไม่ใช่เหตุของผลงานวิจัย)
2. มิฉะนั้นสรุปจำนวนเพิ่ม/ลด/คงที่พร้อมค่า Y และ Y-1 ไม่ตีความเหตุ
3. สรุป high-tier หรือ intl gap กับ KKU เมื่อ cohort/coverage/freshness comparable. ให้ BE ส่ง readiness; ไม่มีเกณฑ์ coverage ร้อยละที่คิดเองเพื่อประกาศนัยสำคัญ หาก metadata ยังไม่พอ แสดง “ยังสรุปช่องว่างด้าน...ไม่ได้” พร้อมเหตุ
4. ปีปัจจุบัน สรุปเพียงจำนวนสะสมและสถานะ coverage ไม่มี YoY
ปัดแสดง 1 decimal สำหรับ %, pp และ citation เฉลี่ย; citation รวมเป็นจำนวนเต็ม แต่คำนวณด้วยค่าดิบ; rounded difference=0 ให้ “ใกล้เคียงกันเมื่อปัดทศนิยม 1 ตำแหน่ง” ไม่กล่าวสูง/ต่ำ 0.0; no-data/error ไม่เกิด positive statement

## 9. BE work ที่จำเป็น (read-only benchmark scope)

ไม่เพิ่ม migration ถ้าใช้ข้อมูลที่มีอยู่ได้ ไม่เขียนตารางหลัก `scopus_documents/scopus_authors/scopus_document_authors/scopus_affiliations/scopus_source_metrics` ไม่เปลี่ยน ingest, Scopus Dashboard หรือ Research Search

### A. additive comparison metadata

รักษา existing fields เพื่อ compatibility เพิ่ม per-year/per-level metadata แยก snapshot existence, status, observed_at และ faculty readiness; property names ให้ agent ตกลงกับ FE ก่อน implementation และบันทึกตัวอย่าง response จริง
ข้อเสนอ `year_meta[year][faculty|university|country] = {status: available|missing|blocked, snapshot_exists, snapshot_at, reason}` และ `available_years` คือรายชื่อปีที่มี snapshot แยกต่อระดับจากทุกปีที่เก็บไว้ (รวม zero จริง; ไม่อ้างว่า faculty ready จนผ่าน coverage check). zero จริงมี snapshot_exists=true; missing map default 0 ของ legacy fields ถูก FE ignore เมื่อ metadata ไม่พร้อม. ตรวจ DB errors ไม่ปล่อย query error กลายเป็น empty/zero
Scope IDs resolve จาก code/config ไม่ hardcode 1/2 ใน endpoints ใหม่/ที่แก้. ส่ง report scope metadata ที่ FE ตรวจเทียบได้

### B. insights cohort + readiness

ใช้ verified faculty EID selection เดียวกับ official count (distinct EID, KKU COMP membership, matched author, allowed AF-ID 60017165/60280609, employment date เมื่อมี) ห้ามใช้ `is_faculty` แทนหลักฐานนี้. Extract private benchmark-only selector/helper ได้โดยไม่เปลี่ยนผลลัพธ์ของ verified count
KPI count เป็น snapshot; insight cohort เป็นข้อมูลเอกสารปัจจุบัน: ถ้าจำนวน/เวอร์ชันไม่ตรง snapshot ต้องแจ้ง mismatch ไม่ auto refresh/write และไม่อ้างว่าครบเพียง totals เท่ากัน; validation ต้องเปรียบเทียบ EID sets ในกรณี faculty ไม่ใช่ตรวจจำนวนอย่างเดียว
ต่อระดับเพิ่ม expected docs เมื่อรู้, harvested/eligible docs, missing metadata, active-run status และ `comparison_ready` พร้อม reasons. ไม่ใช้ available=true เพราะมีเอกสารเพียง 1 ชิ้นมาแปลว่าข้อมูลครบ; available และ ready คนละเรื่อง
กรณี active KKU harvest ต้องเคารพ coverage guard เดิม (faculty blocked); Thailand harvest กระทบเฉพาะ Thailand completeness ไม่ปิดคณะ/KKU โดยไม่มีเหตุ
quartile แยก classified, unclassified eligible journals, excluded non-journal, unresolved source type; aggregation type อื่น/ว่างอย่าถือเป็น journal โดยอัตโนมัติ และต้อง reconcile กับ docs. ระบุ tier policy และ metric year(s): service เดิมใช้ latest metric per source ไม่ใช่ publication-year metric ห้ามเรียกกราฟคุณภาพย้อนหลังว่าเป็นระดับ ณ ปีตีพิมพ์หรือเปลี่ยน policy โดยเงียบ
intl/OA เพิ่ม known/unknown/positive counts เท่าที่ข้อมูลพิสูจน์ได้ ตรวจ schema/ingest เพื่อทราบ null semantics; ถ้าไม่สามารถประเมิน unknown ได้ ให้ status unknown/ข้อจำกัด ไม่สร้าง coverage 100%. คง legacy rates หากจำเป็นและให้ field ใหม่มี denominator policy ชัด
source update times: ใช้ timestamp ที่สะท้อนข้อมูล metric จริง หากมีเพียง row-updated ซึ่งไม่ได้ refresh metric ต้องไม่ label เป็นวัน refresh citation; ไม่มีให้ null. ไม่เก็บ timestamp ใหม่เพื่อสร้างภาพความสดของข้อมูล

### C. prior-year insights

ใช้ GET insights(Y) และ GET insights(Y-1) แบบ cache/request guard; ไม่จำเป็นต้องสร้าง endpoint batch หรือดึง insights ทุกปีเพื่อแสดง 5/10-year volume. ใน YTD ไม่ต้องโหลด Y-1 insights เพื่อคำนวณ YoY
coverage ไม่ผ่าน: counts ที่พร้อมยังแสดงได้; deep metrics แสดง observed values ในรายละเอียดพร้อม label “จากข้อมูลที่เก็บได้” แต่ KPI/ช่อง gap ใช้ “ยังเปรียบเทียบไม่ได้”. การขาดประเทศไทยไม่ block คณะ vs KKU

กำหนด readiness แยกตาม metric และคู่เปรียบเทียบ ไม่ใช้ boolean เดียวปิดทุก metric: narrative/gap เปิดเมื่อทั้งสองชุดไม่มี active run/mismatch, expected vs harvested ผ่าน, ใช้ definition และ metric-year policy เดียวกัน และไม่พบ unknown ใน metadata ที่จำเป็นต่อ metric นั้น หากพิสูจน์ไม่ได้ให้ ready=false พร้อม reason. ค่าคุณภาพที่จัดกลุ่มได้บางส่วนยังแสดงเป็น observed descriptive value พร้อม coverage แต่ไม่สร้างข้อความว่าทั้งคณะนำ/ตาม. ไม่มี threshold 50/80/90% ที่เลือกเองเพื่อรับรองความเป็นตัวแทนของข้อมูล

### D. Citation เท่าที่ข้อมูลปัจจุบันรองรับ

เพิ่ม object แบบ additive ใน insights แต่ละระดับ เช่น `citations: {total, average, known_docs, cohort_docs, unknown_docs, coverage_status, updated_at, update_range, freshness_status}` ระบุชื่อจริงใน contract ก่อน FE ต่อ; คง legacy avg_cite สำหรับ compatibility โดยไม่เปลี่ยนความหมายเงียบ ๆ
คำนวณ SUM/COUNT จาก distinct document cohort ที่ใช้ insights เดียวกัน ระวัง metric joins ทำให้เอกสารซ้ำ ใช้ field citedby_count ที่เก็บอยู่ ไม่เรียก Scopus เพิ่ม ไม่เพิ่ม citation snapshots, migrations, yearly citation model หรือ backfill ภายใต้งานนี้
ตรวจ schema/ingest ว่าค่า missing ถูกเก็บเป็น NULL หรือ default 0 ถ้า default 0 ทำให้แยก unknown/zero ไม่ได้ ให้ coverage_status=unknown และอธิบายข้อจำกัด; ห้ามเดา known_docs=cohort_docs แล้วอ้างว่าข้อมูลครบ หากรายงานค่าเฉลี่ยจาก stored values ให้ระบุ denominator_policy ว่าเป็นเอกสารที่เก็บค่าไว้โดยยังไม่ยืนยันความครบถ้วน
timestamps ใช้หลักเดิมใน §9 B: ไม่แทนวัน refresh citation ด้วยเวลาที่โหลดรายงานหรือ row_updated_at ที่พิสูจน์ไม่ได้ว่าอัปเดต citation; nullable metadata ยอมรับได้ ผู้ใช้ตกลงใช้ข้อมูลเท่าที่มี ไม่ต้องสร้างโครงสร้างข้อมูลใหม่เพื่อให้ได้ metadata ที่ไม่มีอยู่
เพิ่ม tests: citation รวมจริงตรงผลรวมไม่ใช่ rounded average × docs, zero vs null, missing บางเอกสาร, duplicate join, distinct faculty cohort, ปีที่เลือกเป็น publication year, ขาด timestamp, ประเทศไม่มีเอกสาร และข้อมูลสามระดับทับซ้อนกันไม่ถูกบวกเป็น grand total

## 10. Implementation sequence และ architecture

1. ตรวจ branch/status/AGENTS และอ่านแผน+ภาพร่าง; เก็บ screenshot baseline ถ้ารันได้และ response ตัวอย่างแบบ read-only กับ test DB ที่ยืนยันแล้ว ไม่เปิดเผย .env/credentials ใน output
2. เขียน response contract ที่ตกลงกันไว้ลง docs พร้อม status cases; ทำ BE cohort/metadata tests ก่อน UI ที่อาศัยมัน; ไม่มีการเปลี่ยน data definitions เพื่อให้ตรงตัวเลข mock
3. แยก pure helpers สำหรับ availability, report-year selection, deltas, summary และ export จาก rendering; ใช้ component Header/KpiStrip/Findings/Trends/ComparisonTable/Details/SourceNotes ตาม layout. ห้ามทำ 800-line component ใหม่
4. ต่อ UI จริงและสถานะครบ; pass faculty_metric/scope/meta/error ลง dashboard; รักษา setup และรายงาน fetch context แยกกัน
5. ทำ print/export, responsive และ accessibility; ทดสอบ screenshot แล้วแก้ layout ให้ตรง reference ก่อนส่ง
6. ส่ง review package: commits/diff, tests, screenshots desktop/mobile/print, response samples ที่ลบ sensitive data, known limitations และ deviations ที่มีเหตุผล ไม่ merge/deploy

## 11. Acceptance / หลักฐานที่ต้องส่ง

### Data behavior tests (meaningful, ไม่ snapshot markup)

- zero snapshot vs missing snapshot, blocked faculty, Y-1 missing/zero, denominator zero, all-null insights ไม่สร้างคำสรุปนำ
- reportYear เปลี่ยนระหว่าง request: ไม่โชว์ค่าข้ามปี; เปลี่ยน 5/10 ปีไม่เปลี่ยนปีรายงาน; refresh invalidates report+prior insights และ comparison อย่างมีขอบเขต
- YTD ไม่มี YoY ทั้ง UI/summary/CSV/print; latest ended-year selection ยอมรับ zero จริง
- Thailand missing/partial ไม่ซ่อน KKU/faculty; low/unknown metadata ไม่อ้าง completeness; active harvest readiness
- verified faculty insights EID membership ตรง selector ทางการ (หลายอาจารย์บนชิ้นเดียว, affiliation ไม่ผ่าน, ก่อนเริ่มงาน, ไม่มีวันเริ่มงาน, duplicate joins); scope IDs ไม่ใช่ 1/2
- T1 ไม่ซ้ำ Q1, excluded conference แยก missing journal metrics, classified denominator=0, rates reconcile และ snapshot mismatch handling

### UI review checklist

- ภาพหน้าจอแรกเป็นรายงานตาม A–D ไม่เหลือ lead mini-bars/cards layout เดิม; ไม่มีตัวเลขประเทศทำเส้นคณะหาย
- ทุกจำนวน/เปอร์เซ็นต์ตรวจย้อนกลับได้ถึง denominator/ปี/สถานะ; คำอธิบายจำเป็นอ่านได้โดยไม่ hover
- ตารางเปรียบเทียบเห็น metrics พร้อมกัน; focus/year/dropdown/details ใช้งานด้วย keyboard; mobile ไม่ล้นหน้า
- header/KPI/summary/chart/table ไม่ใช้ปีคนละปี; no animated counting, no giant decorative icons, no green/red grading OA/intl
- print preview A4 ตรวจจริงทุกหน้า ไม่มี clipping/blank charts/broken Thai/table split ผิด; ค่าตรงหน้าจอและไม่มี shell
- ตรวจเคสตัวเลขยาว (>=100,000), ชื่อยาว, ข้อมูล 0/ไม่มี/partial, 10 ปี, error ต่อ API; แนบ screenshots แยก fixture จาก live อย่างชัดเจน

Required checks: FE `node --test` และ `npm run build` (ใช้ package manager ตาม lockfile ของ repo); BE `go test ./services` + controller tests ที่มี/เพิ่มตามส่วนเปลี่ยน และ `go build ./...`; diff whitespace check. ไม่รัน broad suites ซ้ำโดยไม่มีเหตุ ไม่อ้าง test ผ่านหากไม่ได้รัน และไม่ claim live verification จาก fixtures

ถือว่างานเสร็จสำหรับส่ง review เมื่อ implementation+design evidence ครบ ไม่ใช่ build ผ่านอย่างเดียว ผู้วางแผนจะ review โดยเทียบเอกสารนี้ ภาพร่าง และข้อมูลจริง; ผู้ใช้เป็นคนตัดสินใจ merge/deploy ต่อ

## 12. ส่งงานกลับให้ผู้วางแผน review (บังคับ)

ผู้ใช้เป็นคนส่งต่อข้อความระหว่าง agent ที่ implement และผู้วางแผน อย่าส่งเพียง “เสร็จแล้ว” หรือให้ผู้ใช้รวบรวมตำแหน่งไฟล์เอง และไม่ต้องส่งข้อความข้าม task อัตโนมัติ

สร้างไฟล์สรุปหลักที่ `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review.md` พร้อมหัวข้อต่อไปนี้:

1. **สถานะและขอบเขต:** เสร็จส่วนใด ค้างส่วนใด สิ่งที่เปลี่ยนใน FE/BE และ deviations จาก handoff พร้อมเหตุผล แยก implementation complete ออกจาก verified
2. **จุดตรวจโค้ด:** absolute repo/worktree paths ที่ทำงานจริง, branch, base commit ก่อนเริ่ม, HEAD ที่ส่ง review, commits งานนี้ และไฟล์สำคัญพร้อมหน้าที่ ถ้ามี uncommitted changes ให้ระบุชัดและแนบ diff ของงานที่ยังไม่ commit โดยไม่ปนงานเดิมของผู้ใช้ ห้ามทำ commit ย้อนหลังเพียงเพื่อกลบสถานะ
3. **ตาราง acceptance:** อ้าง section/ข้อกำหนดของ handoff → ผ่าน/ไม่ผ่าน/ยังไม่ได้ตรวจ → หลักฐานหรือเหตุผล รวม citation §5 E2 / §9 D โดยเฉพาะ
4. **Tests/build:** คำสั่งที่รันจริง, working directory, ผลและ exit code, วันที่ตรวจ, absolute path ของ log ที่เกี่ยวข้อง แยก checks ที่ไม่ได้รันและเหตุผล ไม่รายงาน fixture test เป็น live verification
5. **หลักฐาน UX/UI:** ภาพเต็มหน้าที่ 1440x900 และ 1280x800, tablet/mobile ตาม acceptance, first viewport, ส่วน citation, สถานะ missing/partial/error/YTD ที่ทดสอบ และรายงาน PDF ที่พิมพ์จริงหรือภาพ print preview ครบทุกหน้า ระบุ viewport/ปี/สถานะ/fixture หรือ live ต่อไฟล์
6. **หลักฐานข้อมูล:** ตัวอย่าง response comparison/insights ที่ลบ sensitive data, สูตรและ denominator, verified faculty cohort checks, missing vs zero, citation SUM/average/coverage/freshness พร้อมชี้ว่าตรวจเทียบข้อมูลจริงอะไรแล้ว ห้ามแนบ .env, tokens, credentials หรือข้อมูลส่วนตัวที่ไม่จำเป็น
7. **วิธีเปิดตรวจซ้ำ:** URL หน้าใช้งานจริงบน local/test, คำสั่งเริ่ม FE/BE และ working directories ที่ถูกต้อง, environment ที่ใช้โดยไม่เปิดเผย secrets, server ยังรันอยู่หรือหยุดแล้ว, เงื่อนไข login โดยไม่เขียนรหัสผ่านลงเอกสาร หากเปิดไม่ได้ให้ระบุ blocker และวิธีตรวจส่วนที่ยังตรวจได้
8. **ประเด็นให้ reviewer เน้น:** risks, known limitations, สมมติฐานด้านข้อมูล และสิ่งที่ต้องตัดสินใจ ให้ reviewer ไล่จากรายงานนี้ไปยังหลักฐานได้ครบ

เก็บหลักฐานใน `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-evidence/` หรือพื้นที่ output ที่ได้รับอนุญาตและคงอยู่ข้าม task แล้วใส่ absolute links ในรายงานหลัก ไม่ใช้ temp ที่หมดอายุ ไม่ commit หลักฐานขนาดใหญ่โดยอัตโนมัติ ห้ามสร้างภาพจำลองแทน screenshot implementation จริง หากเก็บหลักฐานข้อใดไม่ได้ให้บอกตามจริงและไม่ทำเครื่องหมายผ่าน

จากนั้นสร้าง `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-prompt.md` เป็น **ข้อความพร้อมคัดลอก 4–8 บรรทัด** สำหรับผู้ใช้ส่งกลับให้ผู้วางแผน โดยกรอกตำแหน่งและสถานะจริง ห้ามเหลือ placeholder:

- ขอให้ review implementation เทียบ handoff ล่าสุด รวม UX/UI, data correctness และ citation
- บอก absolute path ของรายงาน review หลัก ซึ่งมี links ไปโค้ดและหลักฐานครบ
- บอก FE/BE branch และ HEAD ที่ส่งตรวจ รวม uncommitted state ถ้ามี
- บอก URL ที่เปิดดูได้จริง หรือว่าไม่ได้เปิด server/มี blocker
- ขอให้รายงาน findings ตามความสำคัญและข้อที่ยังไม่ผ่านก่อนอนุมัติ ห้าม merge/deploy ระหว่าง review

คำตอบสุดท้ายของ agent ต้องมีลิงก์รายงาน review, สรุปส่วนที่ยังค้าง และ **แสดงข้อความ review prompt นี้ให้ผู้ใช้คัดลอกได้ทันที** ไม่ส่งเพียงลิงก์ไปไฟล์ prompt และไม่อ้างว่า reviewer อนุมัติแล้ว ผู้ใช้จะส่งข้อความนี้กลับให้ผู้วางแผนเอง
