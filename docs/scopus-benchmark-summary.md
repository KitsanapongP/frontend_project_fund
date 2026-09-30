# UI: สรุปผลงานและบทบาทอาจารย์

2026-09-30 — branch `feat/scopus-benchmark-summary`

## ตำแหน่งและไฟล์

`/admin/scopus-benchmark` ใน portal `/research-fund-system/admin/scopus-benchmark` เรียง: **สรุปผลงานและบทบาทอาจารย์** → **สรุปเปรียบเทียบ Thailand / KKU / COC** → **ผลเปรียบเทียบเชิงวิเคราะห์** เดิม → **ตั้งค่า & ดึงข้อมูล**

ไฟล์หลัก AdminScopusBenchmark.js, ScopusBenchmarkSummary.js, ScopusBenchmarkPresentation.js, ScopusBenchmarkDashboard.js, app/lib/scopus_benchmark_summary.mjs, app/lib/api.js คู่มือ DB/migration/backfill/API หลักใน backend `docs/SCOPUS_BENCHMARK_SUMMARY.md`

## แท็บสรุปเปรียบเทียบ

- ใช้ `ScopusBenchmarkSummary presentation` อีก instance เพื่อแชร์ UI/validation/loader ของตัวกรอง แต่ draft/applied/results/revision แยกจากแท็บผลงานและบทบาท ค่าเริ่มต้นปีปัจจุบัน+ก่อนหน้า, Journal, มี Category, High/Medium/unknown, แยก T1 เช่นเดิม
- ปี ประเภท Category และ Confidence เปลี่ยนผลเมื่อกดใช้ตัวกรอง; toggle T1/Q1–Q4 เปลี่ยนทันทีเช่นแท็บเดิม ไม่ใช้การ toggle ประเภทแบบ instant ตามข้อสรุปล่าสุด
- ส่ง `report_view=presentation` ไป summary endpoint เพื่อขอ aggregates เพิ่มเท่านั้น ไม่ส่งเอกสารทั้งหมดเข้า browser และไม่ยิง Scopus หน้าแสดงยอดสรุป, ผลกระทบการกรองคู่กับรายปี, Category รวมช่วงปีคู่กับ Quartile รวมช่วงปี
- ก่อนกรองหมายถึงผลงานในฐาน Thailand ภายในช่วงปีที่เลือก; ใช้ตัวกรองสะสม ประเภท → Category → Confidence ตาม applied filters `% คงเหลือ` หารด้วยยอดก่อนกรองของระดับนั้น ไม่ใช่ขั้นก่อนหน้า ปุ่มตัวเลขในแต่ละขั้น override filters ตามขั้นนั้นเพื่อให้ drilldown ตรงกับจำนวน
- สัดส่วนแสดงชื่อเต็ม KKU / Thailand, COC / Thailand และ COC / KKU ตัวหาร 0/ข้อมูลขาดเป็นขีด ยอดรวมคำนวณจากจำนวนรวม ไม่เฉลี่ยเปอร์เซ็นต์; ปีขาดแสดงขีดและคงสถานะข้อมูล
- ตารางรายปี/Category/Quartile เรียงจากหัวคอลัมน์ได้ ยอดรวมอยู่ท้าย ขั้นตอนการกรองคงลำดับ; ผลงานประเภทอื่นแสดงแถวไม่ถูกนำมาจัดอันดับอัตโนมัติเมื่ออยู่ใน applied types ไม่ปนกับ Journal ไม่มี metric
- Mount เมื่อเปิดแท็บครั้งแรก; cache/filter คงอยู่เมื่อสลับออกและไม่โหลดใหม่เมื่อกลับมา Abort/generation ของ loader ป้องกัน response เก่าทับค่าใหม่ งานตั้งค่าทำให้ cache ของรายงานแต่ละแท็บเป็น stale แยกกัน
- Excel ส่ง `view=presentation`, `report_view=presentation`, revision เดียวกับผลที่เห็น มีชีตผลกระทบการกรอง รายปี Category รวมช่วงปี Quartile รวมช่วงปี และคำอธิบาย ถ้าข้อมูลเปลี่ยนต้องอัปเดตรายงานก่อนส่งออก
- ใช้ฐานเดียวและ AF-ID 5/2 ตามคู่มือ backend; ไม่ใช้ชีต COC แยกใน Excel เดิม และไม่ใช้ยอด snapshot เป็นตัวเลขรายงาน จึงไม่บังคับ dev ให้ตรงยอด production ใน workbook อ้างอิง

## ตัวกรอง ตาราง และนิยาม

Default: ปี ค.ศ. ปัจจุบัน+ก่อนหน้า, Journal, มี Category, Confidence High,Medium,unknown, แยก T1 Draft ปี/ประเภท/หมวด/confidence เปลี่ยนผลเมื่อกด **ใช้ตัวกรอง**; **ล้างตัวกรอง** คืน default; **อัปเดตข้อมูล** ล้าง cache และโหลดเฉพาะ active view; toggle Quartile เปลี่ยน applied mode ทันทีโดยใช้ cohort เดิม

ภาพรวมรายปีและบทบาทระดับคณะ COC เป็นคู่ ตามด้วย Category แยกตารางรายปี และ Quartile ราย Category รวมช่วงปี ใช้หัวข้อช่วงปีร่วมครั้งเดียว ยอดรวมอยู่ในตาราง คลิกจำนวนเปิดผลงานตามระดับ/ปี/หมวด/Quartile

รายอาจารย์ roster ครบ ค้นหาชื่อ/Scopus ID, ซ่อนไม่มีผลงาน, เรียงจำนวน/สัดส่วน, คลิกจำนวนแต่ละบทบาทเพื่อเปิดรายละเอียด Search/hide/sort เป็น display-only Excel ส่งทะเบียนครบหลัง applied filters

- Thailand: EID ไม่ซ้ำใน benchmark country scope; KKU: ภายในฐาน มี AF-ID 60017165/60280609/60026046/60277695/109899034
- COC: ผู้เขียนเป็นอาจารย์ทะเบียนและผู้เขียนนั้น AF-ID 60017165/60280609 ไม่กรองวันเริ่มงาน
- %KKU=KKU/Thailand; %COC=COC/KKU; รวมจากจำนวนรวม ตัวหาร 0 เป็นขีด
- Complete metric ปีตีพิมพ์หรือปีก่อนหน้าล่าสุด doc_type=all; T1 percentile 90–100 ไม่ซ้ำ Q1–Q4; non-Journal ไม่ใช้ Quartile
- XML flags จาก EID+Author ID: first/corresponding ซ้อนกันได้; lead union; co สอง flags false บน complete/no_correspondence; อื่นๆ unknown ไม่ใช่คะแนนปริมาณงานจริง
- Overview นับ papers ไม่ซ้ำ; รายคน user/EID ยอดรวมรายคนอาจมากกว่า overview ไม่มี ID เชื่อมไม่ได้/ขีด มี ID แต่ไม่พบงานแสดง 0 จากชุดที่สังเกตได้

Hint เป็นไอคอน hover/focus เพื่อดูชั่วคราว คลิก/tap เพื่อค้างไว้ จากนั้นคลิกที่ใดก็ได้อีกครั้งหรือกด Escape เพื่อปิด เมื่อค้างไว้การ blur ไม่ปิดคำอธิบาย Details แสดงทุก authors รวมคนนอกคณะ, metric year/fallback และข้อมูล affiliations

### รูปแบบ UI ร่วมกับ research-dashboard (2026-09-30)

- ใช้ SimpleCard และสี/ฟอนต์ของ research-dashboard หัวตารางสีฟ้า ตัวเลขชิดขวาและแถวสลับสีใช้แนวเดียวกับ dashboard รายละเอียดตัวกรองและกริด responsive อยู่ในหัวข้อการจัดหน้าด้วย Impeccable ด้านล่าง
- Hint ของรายงานทั้งสองแท็บใช้ body portal และตำแหน่ง fixed วัดขนาดจริงและรักษาขอบจอ 8px เลื่อนเหนือปุ่มเมื่อด้านล่างไม่พอ ปรับตำแหน่งเมื่อ scroll/resize และมีพื้นที่เลื่อนสำหรับข้อความยาว คลิก Hint อีกตัวปิดตัวเดิม
- แท็บวิเคราะห์เริ่มปีปัจจุบัน−1 ถึงปีปัจจุบัน แม้ snapshot ปีปัจจุบันยังไม่พร้อม ไม่เปลี่ยนปีที่ผู้ใช้เลือกเมื่อรีเฟรช การดึงครั้งแรกจำกัดช่วงสองปีและขยายเมื่อผู้ใช้เลือกช่วงอื่น

ตรวจด้วย fixture UI: ค่าเริ่มต้น 2025–2026, เลือก 2024–2025 แล้ว refresh คงค่าเดิม, ใช้ตัวกรอง, ตารางแบบกระชับ, Hint ชิดขอบขวา/จอ 390px, คลิกค้างและเปลี่ยน focus, คลิกปุ่มเดิม/คำอธิบาย/พื้นที่อื่นเพื่อปิด และกลับแท็บใช้ cache เดิม ไม่เปลี่ยนสูตรนับหรือ API ของรายงาน

ผลตรวจรอบปรับ UI: `node --test` ผ่าน 67/67 และ production build ผ่าน รวม lint/type check และสร้าง 34 routes มีคำเตือน Windows EPERM เฉพาะ webpack cache แต่ build จบสำเร็จ

## สถานะและ Excel

ใช้ applied_filters/generated_at/revision/year_states/coverage จาก DB ที่เชื่อมอยู่ แสดงตัวกรองที่ใช้จริงครั้งเดียว และสถานะรายปีในแถว “สถานะข้อมูล”; เปิดแถวนี้เพื่อดู coverage/เวลาอัปเดต Year missing เป็นขีด มีข้อมูลแต่กรองไม่พบเป็น 0 รวมช่วงมีปีขาดระบุ “รวมจากปีที่มีข้อมูล” Dev ไม่ได้บอกสถานะ production

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

ตรวจหน้าแรก options/summary → เปิด faculty มี faculty call → คลิกจำนวนมี details → วิเคราะห์มี comparison/insights → กลับไม่มีเพิ่ม → draft ไม่ยิงจนกดใช้ตัวกรอง → toggle ยอดคงเดิม → refresh active view → missing/zero/tooltip/details ภายนอก/pagination → Excel 409 แจ้งอัปเดต

Dev เริ่มต้นไม่มี Category country และไม่มี membership ปี 2025 จึงไม่เทียบยอดให้เท่ากับ Excel production ดูผลจริง/backfill/rerun ในคู่มือ backend

รายงานเดิมใช้ scopes/snapshots/ความพร้อมและ employment refinement เดิม รายงานใหม่ใช้ฐาน Thailand/benchmark classification/AF-ID 5/2/ไม่กรองวันเริ่มงาน นิยามต่างกันจึงได้ยอดต่างกันได้

### รายละเอียดการจัดหน้าใหม่ด้วย Impeccable

- ใช้โหมด Operate และ playbook layout ภายใน identity เดิมตาม DESIGN.md: Sarabun, blue/slate, พื้นขาวและเส้นขอบบาง บันทึกการจัดหน้าของรายงานนี้ในคู่มือ UI โดยไม่เปลี่ยน DESIGN.md หรือ .impeccable/design.json
- ตัวกรองเป็นฟอร์มกระชับเดียว ไม่มีกรอบซ้อน: ปี ค.ศ./Category/Quartile แถวแรก ตามด้วยประเภทและ Confidence; แถวท้ายมีข้อความ “ผลที่แสดง” ของ applied filters เพียงครั้งเดียวพร้อมปุ่มใช้/ล้างตัวกรอง
- CSS container queries อิงพื้นที่รายงานหลังหัก sidebar: จำนวนผลงานรายปี/บทบาท COC เป็นคู่ความกว้างและความสูงเท่ากัน และตาราง Category รายปีจัดเป็นคู่เมื่อพื้นที่ ≥1000px; Quartile ใช้สองคอลัมน์ ≥640px และสี่คอลัมน์ ≥1160px จึงเป็น 4+3 สำหรับ 7 หมวด นอกนั้นคอลัมน์เดียว DOM/focus order เป็นลำดับอ่านเดียวกัน ทุกส่วนใช้พื้นที่รายงานร่วมกัน ไม่มี max-width ต่างกันในแต่ละการ์ด
- Quartile เป็นตารางกระชับ ใช้หัวคอลัมน์ TH = Thailand และคอลัมน์ตัวเลข %KKU/%COC ชิดขวา; ค่าเปอร์เซ็นต์เป็นทศนิยมหนึ่งตำแหน่งโดยไม่ใส่เครื่องหมาย % ซ้ำทุกเซลล์ สูตรเดิมไม่เปลี่ยน หัวข้อช่วงปี/โหมดอยู่ที่หัวส่วนครั้งเดียว หัวตารางแต่ละหมวดแสดงเฉพาะชื่อหมวด ไม่ซ้ำช่วงปีหรือยอดจำนวนในชื่อ ชื่อหมวดมีพื้นที่ header เท่ากัน และสถานะไม่ระบุ/ไม่ใช้มีชื่อเต็มใน title/tooltip
- ไม่ใช้กรอบ stat cards ซ้อนในสรุปบทบาท: จัดตัวเลขเป็นกลุ่มเดียว First หรือ Corresponding ยังเป็น union ไม่ใช่ผลบวก คำอธิบายหน่วย/สูตรอยู่ใน Hint
- สถานะปีและข้อมูลบางส่วนยังมองเห็นทันที รายละเอียด coverage/เวลาอัปเดตใช้ disclosure “สถานะข้อมูล” กดเปิดได้ ไม่แสดงย่อหน้าวินิจฉัยยาวตลอดเวลา
- เอา Preface ออกจากตัวเลือกและ defaults frontend/backend ไม่ส่งค่านี้แฝงอยู่ใน filter ค่าเริ่มต้น High,Medium,unknown; DB และ API validation เดิมยังอ่านค่า Preface ย้อนหลังได้ ไม่ลบข้อมูลเก่า
- Fixture UI เพิ่มครบ 7 หมวดพร้อมยอดรวมที่สอดคล้องกัน เพื่อทดสอบชื่อยาว กริดจริง และเปลี่ยนโหมด T1/Q1–Q4
- ตรวจ desktop 1280px: คู่ภาพรวมขนาดเท่ากัน ตาราง 7 หมวดสองแถว ไม่มีการล้นตารางในโหมด compact; mobile 390px: ความกว้างหน้าเท่ากับ viewport เลื่อนตารางใหญ่ภายในกรอบ
- ผลตรวจ finish รอบสุดท้าย: Pass ทุกข้อกำหนดการจัดหน้า; frontend `node --test` ผ่าน 67/67 และ backend ชุด `TestSummary` ผ่าน สูตรนับและ roster ครบยังเป็นไปตามนิยามด้านบน

### แก้ duplicate key ในรายละเอียดผลงาน (2026-09-30)

ใช้ documents[].id และ authors[].author_id เป็น React keys ของรายละเอียด ไม่อาศัย Scopus ID ซึ่งอาจไม่มี หาก backend รุ่นเก่าไม่ส่ง PK ใช้ EID ของผลงาน หรือตำแหน่งในหน้ารายการเป็น fallback; ผู้เขียนใช้ Scopus ID/ลำดับ/ตำแหน่งในรายชื่อเป็น fallback ไม่ตัดรายการที่ ID ว่างออก Backend แก้ GORM mapping ของ eid ให้ส่ง Scopus EID จริงด้วย

### ตารางรายการผลงานและการค้นหา (2026-09-30)

- แยก modal เป็น `ScopusBenchmarkDocumentDialog.js`; แถวหลักแสดงชื่อผลงาน ปี Category และ Quartile ปุ่มรายละเอียดเปิดแถวขยายทีละผลงาน ซึ่งมี EID/DOI/วารสาร/metric/สังกัดและตารางผู้เขียนครบทุกคน
- ช่องค้นหารองรับชื่อผลงาน ผู้เขียน EID รวมถึง DOI วารสาร และ Scopus Author ID กดค้นหาหรือ Enter เพื่อใช้ค่าที่กรอก ไม่ยิงทุกครั้งที่พิมพ์ Backend ค้นหาทั้งรายการก่อนแบ่งหน้า 50 ผลงาน ไม่ค้นหาเฉพาะหน้าที่โหลดมา
- Category/Quartile เป็นตัวกรองย่อยภายในรายการที่คลิกมา หากคลิกเซลล์ที่ระบุ Category หรือ Quartile อยู่แล้ว ช่องนั้นแสดงค่าที่เลือกและไม่เปิดให้เปลี่ยนขอบเขต ปุ่มล้างล้างเฉพาะตัวกรองย่อยและคำค้น ไม่เปลี่ยนช่วงปี/ระดับ/อาจารย์/บทบาทของรายการเดิม
- คำขอใช้ `search`, `filter_category`, `filter_quartile` เพิ่มจาก context query เดิม ทุกครั้งที่ค้นหาหรือล้างกลับหน้า 1; เลือกหน้าโดยตรงหรือก่อนหน้า/ถัดไปได้ ส่วนหัว ฟอร์ม และ pagination คงอยู่ขณะเลื่อนตาราง บนหน้าจอเล็กเลื่อนตารางแนวนอนได้ภายใน modal
- Escape/กดพื้นที่นอก modal/ปุ่มปิด คืน focus ไปปุ่มที่เปิดรายการ; focus trap รวมช่องค้นหาและ select ล็อกการเลื่อนหน้าด้านหลัง และยังใช้ request abort/generation/cache เดิม
- ตรวจจริงบน dev: Thailand 2025 1,046 ผลงาน (21 หน้า), ข้ามหน้า 21, ค้นหา EID `2-s2.0-85218865983` ได้ 1 ผลงานและกลับหน้า 1; Quantum Information Science + Q1 ได้ 1 ผลงาน; คำค้นที่ไม่มีผลแสดง 0 และล้างกลับได้ ตรวจแถวผู้เขียน/บทบาท และ viewport 390px ด้วย

### สลับความหนาแน่นตาราง Quartile (2026-09-30)

หัวส่วน Quartile ตาม Category มีปุ่มเลือก 2/4 ตารางต่อแถว ค่าเริ่มต้น 2 ตารางและใช้ตัวเลขขนาด text-sm เพื่ออ่านง่ายขึ้น แบบ 4 ตารางใช้ขนาด compact เดิม นี่เป็น state การจัดหน้าเท่านั้น ไม่เปลี่ยนสูตร ตัวกรอง API หรือไฟล์ Excel และคงค่าที่เลือกไว้เมื่อสลับแท็บในหน้าเดิม (เปิดหน้าใหม่เริ่มที่ 2)

Responsive อิง container ของรายงาน: พื้นที่น้อยกว่า 640px เป็นคอลัมน์เดียว; ตั้งแต่ 640px สองคอลัมน์; แบบ 4 ตารางใช้สี่คอลัมน์เมื่อพื้นที่ตั้งแต่ 1160px การลดคอลัมน์ตามพื้นที่ช่วยให้ตารางยังอ่านได้บนจอแคบ

ปรับหัวการ์ด Quartile ให้กระชับ: แบบ 2 ตารางใช้ความสูงขั้นต่ำ 56px ตามหัวการ์ดทั่วไป ส่วนแบบ 4 ตารางใช้ขั้นต่ำ 64px แทน 96px เดิม และให้ชื่อยาวขยายความสูงได้โดยไม่ตัดข้อความ

### Toolbar และ Scopus ID ในตารางบทบาทรายอาจารย์

ตัวเลือกซ่อนอาจารย์ไม่มีผลงานใช้สวิตช์ blue/slate พร้อม `role="switch"` และ `aria-checked` จัดร่วมแถวค้นหาและเรียงลำดับ โดย wrap บนจอแคบ ใช้ state และกติกากรองเดิม ไม่ยิง API เพิ่ม แยก Scopus ID เป็นคอลัมน์ถัดจากชื่ออาจารย์ ถ้าไม่มี ID แสดง “ไม่ระบุ” พร้อม title อธิบายว่าเชื่อมข้อมูลไม่ได้ และยอดยังเป็นขีด ตารางเลื่อนแนวนอนภายในกรอบเมื่อพื้นที่ไม่พอ

### คำอธิบายและการเรียงตาราง (2026-09-30)

- “ไม่ใช้ Quartile” = ผลงานที่ไม่ใช่ Journal เช่น Conference Proceeding/Book; “ไม่มีข้อมูล” = Journal ที่หา Quartile ตามกติกา metric ไม่ได้ เพิ่ม Hint แยกให้สองแถวนี้ เพื่อไม่ให้สับสน ค่า 0 และกลุ่มเหล่านี้ยังคงอยู่ตามผล backend
- `summaryHints` เก็บเป็นหัวข้อกับรายการสั้น (`{title, lines}`) และส่งหลายหัวข้อเป็น array แทนการต่อข้อความยาว `Hint` รองรับทั้งรูปแบบใหม่นี้และ string เดิม มีเส้นแบ่งหัวข้อ ระยะห่าง และ scroll ภายในเมื่อยาว ยัง hover/focus เพื่ออ่าน กดเพื่อค้าง คลิกอีกที่หรือ Escape เพื่อปิด และ clamp อยู่ใน viewport
- `SummarySortHeader` ใช้ปุ่มจริง พร้อมไอคอนขึ้น/ลงและ `aria-sort` บน th ใช้กับตารางรายปี Category Quartile และรายอาจารย์ กดซ้ำสลับ asc/desc แถวรวมอยู่นอกการ sort และคงท้ายตารางเสมอ เรียงตัวเลขจากค่าจริง รวมถึงเปอร์เซ็นต์ ไม่เรียงจากข้อความที่ format แล้ว
- `sortSummaryRows` คืน array ใหม่และให้ค่า null/ไม่มีข้อมูลอยู่ท้ายรายการทั้งสองทิศทาง โดย 0 ยังเป็นค่าตัวเลขจริง Quartile เรียง T1 → Q1–Q4 → ไม่มีข้อมูล → ไม่ใช้ Quartile ส่วน Scopus ID เรียงตัวเลขใน string โดยไม่แปลงเป็น floating point การ sort เป็น local UI state ไม่เรียก API เพิ่ม ไม่เปลี่ยนสูตร/Excel
- ตัวเลือกเรียงรายอาจารย์และหัวคอลัมน์ใช้ state เดียวกัน หัวคอลัมน์บทบาทสลับทิศทางของจำนวน หรือสัดส่วนเมื่อเลือกสัดส่วนจาก dropdown
- ตรวจจริง: Category 2025 Thailand เรียงลงได้ 551 → 210 → … → 9 และเรียงขึ้นกลับกัน โดยรวม 1,046 ยังอยู่ท้าย; ทะเบียน 45 คน ซ่อนคนไม่มีผลงานเหลือ 19; เรียงจำนวนขึ้นและ Scopus ID ได้ ตรวจ tooltip หลายหัวข้อ กดค้าง/คลิกนอก/Escape และ viewport 390px ไม่ล้นหน้าจอ Regression tests ครอบคลุมตัวเลข ศูนย์ null เปอร์เซ็นต์ Quartile และ ID

### ประเภทผลงาน ตัวกรองปัจจุบัน และแถวที่ไม่ถูกนำมาจัดอันดับ

- เปลี่ยน label ของ `not_applicable` เป็น “ไม่ถูกนำมาจัดอันดับ” รวม dropdown/รายการผลงาน หมายถึงประเภทที่ไม่ใช่ Journal ตามนิยามของรายงาน ไม่ใช่ Journal ที่ metric ว่าง
- หัวส่วน Quartile ตาม Category มีปุ่ม “ซ่อน / แสดง” ข้างปุ่ม 2/4 ตาราง เมื่อใช้ตัวกรองเฉพาะ Journal จะซ่อนแถวนี้เป็นค่าเริ่มต้น หากกดใช้ตัวกรองที่รวมประเภทอื่นด้วย (หรือเลือกเฉพาะประเภทอื่น) จะแสดงแถวนี้อัตโนมัติทุกครั้ง การแก้ checkbox ใน draft ยังไม่เปลี่ยนแถวจนกดใช้ตัวกรอง
- เมื่อ applied types มีประเภทอื่นนอกจาก Journal การกด “ซ่อน” ต้องยืนยันคำเตือนก่อน: ผลบวกของแถวที่มองเห็นอาจไม่เท่ากับแถว “รวมทุกประเภท” เพราะยอดรวมยังนับงานที่ซ่อน “แสดงต่อ” หรือปิดคำเตือนจะคงแถวไว้ ยืนยันแล้วจึงซ่อน ไม่มีคำเตือนเมื่อเลือกเฉพาะ Journal
- การสลับเป็น local display state ไม่ยิง API และไม่เปลี่ยนชุดผลงานหรือยอดรวม หากมีผลงานในแถวที่ซ่อน แถวรวมใช้คำว่า “รวมทุกประเภท” Journal ที่ไม่มี Quartile ยังคงอยู่ในแถว “ไม่มีข้อมูล” การสลับ T1/Q1–Q4 หรือ 2/4 ตารางไม่ล้างการตัดสินใจซ่อนที่ยืนยันแล้ว Tooltip ข้างปุ่มอธิบายกติกานี้
- ล้างตัวกรองจะคืนค่าเริ่มต้น Journal และซ่อนแถวนี้ Excel ยังคงมีข้อมูลทุกกลุ่มจาก backend รวมแถว not_applicable; ปุ่มซ่อน/แสดงควบคุมการจัดหน้าบนเว็บเท่านั้น
- ตัวเลือกประเภทเรียง Journal → Conference Proceeding → Book → Book Series → Trade Journal แล้วตามด้วยค่าที่ระบบเพิ่มในอนาคต ไม่เปลี่ยนค่าที่ส่ง API
- สรุป applied filters ใช้รูปแบบ “ตัวกรองปัจจุบัน:” และป้ายชื่อ/ค่าตาม research-dashboard แสดงปี ประเภท Category Confidence และโหมด Quartile จาก applied state เท่านั้น ไม่แสดงค่าที่แก้ใน draft ก่อนกดใช้ตัวกรอง ข้อความยาว wrap บนจอแคบ
- ตรวจ dev: ค่าเริ่มต้นไม่มีแถว not_applicable ในทั้ง 7 ตาราง; ปุ่มแสดงเพิ่มแถวครบทั้ง 7 และซ่อนกลับได้โดยยอดรวมเดิม ตรวจลำดับ Journal/Conference และเลือก Conference ใน draft แล้วยืนยันว่าป้ายประเภทปัจจุบันยังเป็น Journal จนกดใช้ตัวกรอง
- ตรวจคำเตือนใน browser: Journal + Book แสดงแถวทั้ง 7 อัตโนมัติหลังใช้ตัวกรอง; “แสดงต่อ” คงแถวไว้; “ยืนยันซ่อนแถว” ซ่อนครบโดยตัวเลขรวมเดิมทุกตาราง; ใช้ตัวกรองเดิมซ้ำกลับมาแสดง; Journal อย่างเดียวซ่อนโดยไม่มีคำเตือน การสลับ 2/4 ตารางไม่ล้างค่าที่เลือก และ tooltip แสดงกติกาใหม่ ทดสอบ helpers 8 กรณีผ่าน รวมประเภทผสม ประเภทอื่นอย่างเดียว และค่าเผื่อประเภทใหม่
### ผลตรวจแท็บสรุปเปรียบเทียบ (2026-09-30)

การจัดตาราง: ผลกระทบการกรองและรายปียังเป็นคู่บนจอกว้าง ส่วน Category รวมช่วงปีและ Quartile รวมช่วงปีแสดงเต็มความกว้างคนละแถวทุกขนาดหน้าจอ เพื่อให้ชื่อหมวดและสัดส่วนอ่านได้สะดวกขึ้น

- Frontend helper tests ผ่าน 65 กรณี (`node --test app/lib/__tests__/*.test.mjs`); backend packages `services` และ `controllers` ผ่าน รวม regression ของขั้นการกรอง, stage drilldown, revision และอ่าน XLSX กลับมาเทียบค่าตัวเลข
- ตรวจ dev ค่าเริ่มต้นปี 2025–2026: ก่อนกรอง Thailand 9,296 / KKU 559 / COC 126; หลังกรอง Journal + มี Category + High/Medium/ไม่ระบุ ได้ 1,835 / 155 / 48 ตรงกับแท็บรายงานเดิม สัดส่วน KKU/Thailand 8.4%, COC/Thailand 2.6%, COC/KKU 31.0%
- กดยอด COC ก่อนกรองเปิดรายการได้ 126 ผลงาน; draft ประเภทไม่เปลี่ยนยอดจนกดใช้ตัวกรอง; Journal + Book ได้ 1,905 / 164 / 49 และแถวไม่ถูกนำมาจัดอันดับ 70 / 9 / 1; เปลี่ยน Q1–Q4 แล้วยอดรวมคงเดิม; ล้างตัวกรองคืน Journal และแยก T1
- Harness ตรวจ lazy loading: เปิดแท็บเดิม options/summary อย่างละ 1 request; เปิดแท็บใหม่เพิ่มเป็นอย่างละ 2; สลับออก/กลับไม่เพิ่ม request; อัปเดตเพิ่มเป็นอย่างละ 3 ไม่มี request ของ analysis, setup, faculty หรือ documents จนร้องขอมุมมองนั้น ตรวจปีที่ไม่มีข้อมูลเป็นขีดและ API error state ด้วย
- ตัวกรองและผลของสองแท็บเก็บแยกกัน; ตรวจเรียง Thailand ในตาราง Category ทั้งมากไปน้อยและน้อยไปมาก โดยยอดรวมอยู่ท้ายตาราง; Hint แสดงคำอธิบายเป็นหัวข้อและรายการ
- ตรวจ responsive: viewport กว้าง 1,712px ได้ตารางคู่สองคอลัมน์; viewport 390px ได้คอลัมน์เดียวและตารางเลื่อนภายใน ไม่มี horizontal overflow ของหน้า คืนขนาด browser ปกติหลังตรวจ
- กดส่งออกจริงเรียก export พร้อม `report_view=presentation`, `view=presentation` และ revision ได้ HTTP 200; in-app browser ไม่ส่ง download event ของไฟล์ Blob ให้ตัวทดสอบ จึงยืนยันเนื้อหาไฟล์จาก backend XLSX readback tests ไม่อ้างว่าได้ตรวจไฟล์ดาวน์โหลดจริงผ่าน browser ไม่มี console error หลังการส่งออก
- เปิด frontend port 3000 และ backend port 8080 ทิ้งไว้สำหรับตรวจต่อ การตรวจรอบนี้ใช้ dev server ไม่ได้รัน frontend production build
