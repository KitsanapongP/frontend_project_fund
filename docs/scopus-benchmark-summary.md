# UI: สรุปผลงานและบทบาทอาจารย์

2026-09-30 — branch `feat/scopus-benchmark-summary`

## ตำแหน่งและไฟล์

`/admin/scopus-benchmark` ใน portal `/research-fund-system/admin/scopus-benchmark` เรียง: **สรุปผลงานและบทบาทอาจารย์** → **ผลเปรียบเทียบเชิงวิเคราะห์** เดิม → **ตั้งค่า & ดึงข้อมูล**

ไฟล์หลัก AdminScopusBenchmark.js, ScopusBenchmarkSummary.js, ScopusBenchmarkDashboard.js, app/lib/scopus_benchmark_summary.mjs, app/lib/api.js คู่มือ DB/migration/backfill/API หลักใน backend `docs/SCOPUS_BENCHMARK_SUMMARY.md`

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
