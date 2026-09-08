# แผนปรับปรุงหน้า /admin/scopus-benchmark

> เอกสารสั่งงานสำหรับ agent ที่จะลงมือแก้ ผู้ตรวจ (Claude อีกตัว) จะใช้ไฟล์นี้เป็นเกณฑ์รีวิว
> เขียน: 2026-08-31

## บริบท / สภาพแวดล้อม

- **Repo (frontend):** `frontend_project_fund` — branch งาน: `feature/scopus-benchmark-revamp` (แตกจาก main แล้ว)
- **Repo (backend):** `fund-management-api` — P3: `feature/scopus-benchmark-verified-faculty` (`96eafca`); P5: `feature/scopus-benchmark-counts-optimize` (`5cfdbf6`, แตกต่อจาก P3)
- **ไฟล์หน้าเว็บหลัก:** `app/(portal)/research-fund-system/admin/components/research/AdminScopusBenchmark.js`
- **API client:** `app/lib/api.js` → `scopusBenchmarkAPI` (บรรทัด ~1239)
- **Backend ที่เกี่ยวข้อง (อ้างอิงเท่านั้นในเฟสหลัก):**
  - `controllers/admin_scopus_benchmark_controller.go`
  - `services/scopus_benchmark_service.go`, `services/scopus_benchmark_harvest.go`
  - `models/scopus_benchmark.go`
- **ฐานข้อมูล:** dev/ทดสอบ = remote `147.50.227.17` (`.env` ของ `fund-management-api` ชี้ตัวนี้) — **ทดสอบได้เต็มที่** ห้ามแตะ production (คนละเครื่อง XAMPP บน VM)

### สถาปัตยกรรมข้อมูลที่ต้องเข้าใจก่อนแก้

หน้านี้มี **2 เส้นทางข้อมูลแยกกัน** ที่ใช้ **query Scopus เดียวกัน** (`buildScopeQuery`) แต่คนละวัตถุประสงค์:

1. **Count path** (ปุ่ม "อัปเดตตัวเลข" → `refreshCounts`): ยิง Scopus นับจำนวนต่อปี เก็บลง `scopus_benchmark_count_snapshots` → endpoint `comparison` อ่าน snapshot ล่าสุดต่อปี (MAX(id)) มาทำ **กราฟ + การ์ด + ตาราง**
2. **Harvest path** (ปุ่มขั้นสูง → `harvest`): ดึงตัวเอกสารจริงเก็บลง `scopus_benchmark_documents` (+authors, +document_scopes) นับความคืบหน้าด้วย `documents_upserted` ใน `scopus_benchmark_harvest_runs`

> ทั้งสอง path ตัวเลขเอกสาร**จริงรายปีตรงกัน** ปัญหาที่ผู้ใช้เจอเป็นเรื่อง **การแสดงผลผิดหน่วย/ผูกปีผิด** ไม่ใช่การดึงข้อมูลผิด

### ตัวเลขใน dev DB ที่ใช้ตอน verify เฟส 1 (historical snapshot)

Scopes: `1=university (KKU, af_id=60017165)`, `2=country (Thailand)`, `3=faculty (CS)`; subject ทุกตัว = `COMP`

| ปี | คณะ snapshot (scope3) | KKU snapshot (scope1) | KKU harvest จริง (document_scopes) | คณะจาก is_faculty |
|----|----|----|----|----|
| 2024 | 52 | 231 | 231 | 51 |
| 2025 | 63 | 311 | 311 | 63 |
| 2026 | 59 | 214 | 214 | 59 |

- ตัวเลขชุดนี้เป็นสถานะที่ตรวจไว้ก่อนพบว่ารอบ harvest หลายปีถูกยกเลิกกลางทาง จึงห้ามใช้จำนวน membership เดิมเป็น ground truth ของ P3 จนกว่าจะเก็บครบและผ่าน coverage check
- เอกสารที่ harvest แล้วมีเฉพาะ KKU; country/faculty ยังไม่เคย harvest และไม่จำเป็นต่อ verified faculty metric
- Runs ตัวอย่าง: run#6 KKU 2024–2026 cancelled `documents_upserted=650`; run#1 & run#2 harvest ปี 2024 เหมือนกัน ได้ 231 **ทั้งคู่** (พิสูจน์ว่า upserted เป็นตัวนับการเขียน ไม่ใช่จำนวนเอกสาร)

---

## เฟส 1 — งานหลัก 4 อัน (ทำก่อน แก้รวมทีเดียว, frontend เท่านั้น)

> ทั้ง 4 อันแก้ในไฟล์ `AdminScopusBenchmark.js` เป็นหลัก ไม่ต้องแตะ backend

### งานที่ 1 (P2) — การ์ดต้องอิง "ปีล่าสุดที่มีข้อมูลจริง" ไม่ใช่ปลายช่วงปี ⭐ อาการหลัก

**ปัญหา:** การ์ด StatTile ทั้ง 3 ใบใช้ `latest = asc[asc.length-1]` ซึ่งเป็นค่าปี `yearTo` (ดีฟอลต์ = ปีปัจจุบัน 2026 ที่ยัง**ไม่ครบปี**) ทำให้การ์ดโชว์เลขต่ำกว่าแท่งเด่นในกราฟ (เช่น คณะ 2026=59 ในการ์ด แต่กราฟเด่นที่ 2025=63) และถ้า scope ใดไม่มี snapshot ปี `yearTo` การ์ดจะกลายเป็น 0/– ทั้งที่กราฟมีข้อมูล = "การ์ดกับกราฟไม่ตรงกันเลย"

**จุดแก้:** `AdminScopusBenchmark.js` — `latest` useMemo (~บรรทัด 337) และ StatTile 3 ใบ (~บรรทัด 404–406)

**สิ่งที่ต้องทำ:**
- คำนวณ "ปีล่าสุดที่มีข้อมูลจริง" **แยกต่อ metric** (คณะ / KKU / Thailand) = ปีมากสุดที่ค่าของ metric นั้น `> 0`
- การ์ดแต่ละใบแสดงค่าปีล่าสุดที่มีข้อมูลของ metric ตัวเอง และ hint บอกปีให้ตรงกับค่า (เช่น "ปีล่าสุดที่มีข้อมูล 2025")
- ถ้าปีบนสุดของช่วง (เช่น 2026) เป็นปีที่ยังไม่ครบ/ยังไม่มีข้อมูลของ metric นั้น ต้อง fallback ไปปีก่อนหน้าที่มีข้อมูล ไม่โชว์ 0 หลอกตา
- (แนะนำ) ใส่ข้อความ/แท็กเล็ก ๆ เตือนว่าปีปัจจุบันเป็นข้อมูลบางส่วน (partial year) ถ้าเลือก `yearTo` = ปีปัจจุบัน

**เกณฑ์ผ่าน (acceptance):**
- ด้วยข้อมูล dev ปัจจุบัน (2026 มีข้อมูลครบทุก scope) การ์ดคณะ/KKU/Thailand = ค่าปีล่าสุดที่ `>0` และ **ตรงกับความสูงแท่งปีเดียวกันในกราฟเป๊ะ**
- ทดสอบเคส scope ที่ปี `yearTo` เป็น 0: การ์ดต้อง fallback ไม่ใช่โชว์ 0 (จำลองโดยตั้ง `yearTo` เป็นปีอนาคตที่ไม่มี snapshot เช่น 2027 แล้วดูว่าการ์ดยังโชว์ปีล่าสุดจริง)

### งานที่ 2 (P1 + P6) — แยก "จำนวนเอกสารจริง" ออกจาก "ตัวนับการเขียน (upserted)"

**ปัญหา:** คอลัมน์ "เอกสาร" ใน History และข้อความใน banner "run กำลังทำงาน" แสดง `documents_upserted` ซึ่งเป็น **ผลรวมสะสมข้ามปี + นับการ upsert ซ้ำ** ไม่ใช่จำนวนเอกสารจริง ผู้ใช้เอาไปเทียบกับกราฟรายปีเลยสับสน (เห็น 650 > 311)

**จุดแก้:** `AdminScopusBenchmark.js`
- ตาราง History (~บรรทัด 560–591) คอลัมน์ "เอกสาร"
- Banner activeRun (~บรรทัด 621–629) ข้อความ "{documents_upserted} เอกสาร"

**สิ่งที่ต้องทำ:**
- เปลี่ยน label/ความหมายให้สื่อถูก เช่น "เขียนแล้ว (สะสม)" หรือ "อัปเดต X รายการ" แทนคำว่า "เอกสาร" เดี่ยว ๆ เพื่อไม่ให้เข้าใจว่าเป็นจำนวนเอกสารจริง
- ใน History แสดงช่วงปีของรอบ + สถานะให้ชัดว่าเลขนี้คือ "ตลอดทั้งรอบ (หลายปีรวมกัน)" ไม่ใช่ต่อปี
- (ถ้าทำได้ในเฟสนี้แบบ frontend ล้วน) ใส่ tooltip/หมายเหตุอธิบายสั้น ๆ ว่าเลขนี้เป็นตัวนับการเขียน อาจซ้ำได้ถ้ารันซ้ำ

> หมายเหตุ: การให้แสดง "จำนวนเอกสารจริง (distinct) ต่อปี" ต้องมี endpoint ใหม่ → อยู่ในงานขยายหน้า/แสดงเอกสาร ไม่ใช่เฟสนี้ เฟสนี้แค่ทำให้ป้าย/หน่วยไม่หลอกตา

**เกณฑ์ผ่าน:**
- ไม่มีจุดไหนในหน้าที่แสดง `documents_upserted` โดยใช้คำว่า "เอกสาร" เดี่ยว ๆ ที่ทำให้เข้าใจว่าเป็นจำนวนเอกสารจริงรายปี
- ผู้ใช้อ่านแล้วเข้าใจได้ว่าเลขในกราฟ (รายปี) กับเลขในประวัติ (สะสมทั้งรอบ) เป็นคนละหน่วย

### งานที่ 3 (P4) — เปลี่ยนช่วงปี / กด "ตั้งแต่ปีแรก" ต้อง reload กราฟอัตโนมัติ

**ปัญหา:** เปลี่ยน `yearFrom/yearTo` หรือกด "ตั้งแต่ปีแรก" (`detectFirstYear`) แล้วกราฟ/การ์ดไม่อัปเดตจนกดปุ่ม "รีเฟรช" เอง (ปุ่มรีเฟรชมีเฉพาะแท็บ results)

**จุดแก้:** `AdminScopusBenchmark.js`
- `detectFirstYear` (~บรรทัด 239) — หลังตั้งปีสำเร็จ ให้เรียก `loadComparison()`
- การเปลี่ยน `yearFrom/yearTo` — เพิ่ม auto-reload

**สิ่งที่ต้องทำ:**
- หลัง `detectFirstYear` set ปีเสร็จ → โหลด comparison ใหม่ทันที
- ทำ auto-reload เมื่อ `yearFrom/yearTo` เปลี่ยน โดยใส่ **debounce** (เช่น 400–600ms) กันยิงถี่ตอนพิมพ์ และกันยิงตอน mount ซ้ำซ้อน
- ระวัง: อย่าให้ auto-reload ชนกับ initial load ใน useEffect เดิม (ป้องกันยิงซ้ำตอน mount)

**เกณฑ์ผ่าน:**
- กด "ตั้งแต่ปีแรก" แล้วกราฟ/การ์ดขยับตามช่วงปีใหม่โดยไม่ต้องกดรีเฟรช
- แก้เลขในช่อง yearFrom/yearTo แล้วกราฟอัปเดตเองหลัง debounce
- ไม่มีการยิง `comparison` ซ้ำเกินจำเป็น (เช็คใน Network: พิมพ์เลขเดียวจบควรได้ 1 request)

### งานที่ 4 (P6) — เบ็ดเตล็ด robustness

**จุดแก้ + สิ่งที่ต้องทำ:**
- **Input ปีรับค่าต่ำกว่า min:** `setYearFrom(Number(e.target.value) || 1)` (~บรรทัด 114, 117) — clamp ให้อยู่ในช่วง `1900..CURRENT_YEAR+1` และกัน `yearFrom > yearTo`
- **Polling effect ผูกกับ `runs`:** useEffect (~บรรทัด 204–209) dependency `[activeRun, runs]` ทำให้ reschedule timeout ทุกครั้ง runs เปลี่ยน — ปรับให้ poll เสถียร (เช่น ผูกกับ `activeRun?.id` แทน หรือใช้ interval เดียว) โดยยังหยุดเมื่อไม่มี activeRun

**เกณฑ์ผ่าน:**
- พิมพ์ปีนอกช่วง (เช่น 100 หรือ 3000) แล้วระบบ clamp ไม่ส่งค่าเพี้ยนไป backend
- ตั้ง `yearFrom > yearTo` ไม่ทำให้ crash/กราฟพัง
- ระหว่างมี run ทำงาน polling ยังทำงานปกติและหยุดเมื่อ run จบ (ไม่มี timeout ค้าง/ซ้อน)

### Verification เฟส 1 (ก่อนส่งตรวจ)

1. รัน dev server ของ frontend และเปิดหน้า `/admin/scopus-benchmark` (login ด้วยบัญชีทดสอบ admin)
2. แท็บ "ผลเปรียบเทียบ": ยืนยันการ์ด 3 ใบ = ค่าปีล่าสุดที่มีข้อมูลจริง และตรงกับแท่งกราฟปีเดียวกัน (เทียบตาราง ground truth ด้านบน)
3. เปลี่ยนช่วงปี + กด "ตั้งแต่ปีแรก" → กราฟรีโหลดเอง
4. แท็บ "ตั้งค่า & ดึงข้อมูล" → ประวัติการดึง: คอลัมน์เลข upserted สื่อความหมายถูก ไม่ใช้คำว่า "เอกสาร" หลอก
5. ไม่มี error ใน console; ตรวจ Network ว่าไม่มี request `comparison` ซ้ำเกินจำเป็น
6. เก็บ screenshot การ์ด+กราฟ (ให้ผู้ตรวจดู)

### ผลดำเนินงานและ Verification จริง — 31 ส.ค. 2026

**สถานะ:** เฟส 1 เสร็จแล้วบน branch `feature/scopus-benchmark-revamp` และพร้อมส่งตรวจ

**Commits:**

| Commit | งาน |
|---|---|
| `aefcaa7` | P2 — แสดงปีล่าสุดที่มีข้อมูลแยกต่อ metric |
| `1351ced` | P1/P6 — เปลี่ยนความหมาย `documents_upserted` เป็นตัวนับการเขียนสะสม |
| `81d886b` | P4 — โหลด comparison อัตโนมัติเมื่อช่วงปีเปลี่ยน |
| `9b2b3f9` | P6 — ทำ year input และ active-run polling ให้ทนทานขึ้น |

**ผล automated verification:**

- `node --test`: ผ่าน **26/26 tests** รวม test ใหม่ของ `latestPositiveMetric` และ `normalizeYearRange`
- `next build`: ผ่านทั้ง compile, lint/type validation และ static page generation
- `git diff --check`: ไม่พบ whitespace error

**ผลทดสอบหน้าเว็บจริง:** ทดสอบด้วยบัญชี admin บน `http://localhost:3000/research-fund-system/admin/scopus-benchmark`

- การ์ดปี 2026 แสดง **คณะ 59, KKU 214, Thailand 3,264** และทุกใบระบุ `ปีล่าสุดที่มีข้อมูล 2026 (ข้อมูลบางส่วน)` ตรงกับข้อมูลในกราฟปีเดียวกัน
- เปลี่ยน `yearTo` เป็น 2027 แล้วการ์ดยังคง fallback ไปค่าปี 2026 ไม่แสดง 0
- พิมพ์ `3000` แล้ว blur → clamp เป็น 2027; พิมพ์ `100` → clamp เป็น 1900
- ตั้งช่วงปีกลับด้านโดยแก้ `yearFrom=2027` แล้ว `yearTo=2024` → ระบบปรับเป็น `2024–2024` และหน้าไม่ crash
- กด `ตั้งแต่ปีแรก` → ระบบตรวจพบช่วง `1981–2026` และกราฟ/การ์ดโหลดตามช่วงใหม่อัตโนมัติโดยไม่ต้องกดรีเฟรช
- แท็บประวัติแสดงหัวคอลัมน์ `เขียนแล้ว (สะสม)`, ช่วงปีของรอบ และหมายเหตุว่าอาจรวมหลายปี/นับรายการเดิมซ้ำ
- ไม่พบ error ใน browser console ระหว่างทดสอบ
- Screenshot หลักฐาน: `C:/Users/supha/.codex/visualizations/2026/08/31/01a058a4-1811-77f2-bcf1-dc21580641f5/scopus-benchmark-phase1.png`

**ข้อจำกัดของการทดสอบ:**

- ไม่เริ่ม harvest ใหม่เพื่อหลีกเลี่ยงการเปลี่ยนข้อมูลและใช้ Scopus quota จึงยังไม่ได้ทดสอบ polling กับ active run จริง; ตรวจจากโค้ดว่า interval ผูกกับ `activeRun.id` และถูก clear เมื่อ run เปลี่ยนหรือจบ
- เครื่องมือ browser ที่ใช้ไม่มี Network request log จึงไม่ได้เก็บจำนวน request เป็นตัวเลขโดยตรง; ตรวจพฤติกรรม debounce จาก UI และตรวจโค้ดป้องกัน initial/detect duplicate รวมถึง stale response แล้ว

**ห้ามทำในเฟส 1:** แตะ backend, เปลี่ยน endpoint, สร้าง endpoint ใหม่, แตะ query Scopus

---

## เฟส 2 — งาน follow-up (ทำหลังเฟส 1 ผ่านการตรวจแล้วเท่านั้น) แยกทีละอัน

**สถานะเฟส 2:** P3 และ P5 เสร็จพร้อม verify กับฐาน dev/Scopus จริงแล้ว

### ข้อจำกัดเพิ่มเติมจากผู้ใช้ — 1 ก.ย. 2026

- งาน P3/P5 ต้องจำกัดผลกระทบไว้เฉพาะหน้าและ API ของ **Scopus Benchmark**
- **ห้ามแก้** logic ของ Scopus Dashboard, Research Search, member Scopus views หรือหน้าอื่นที่ใช้งานได้อยู่แล้ว
- **ห้ามเปลี่ยน** behavior, schema หรือการ ingest ของตารางหลัก `scopus_documents`, `scopus_authors`, `scopus_document_authors`, `scopus_affiliations`
- งาน P3 **อ่านข้อมูลได้** จาก `scopus_documents` และตารางสัมพันธ์ชุดเดียวกับ Scopus Dashboard เพื่อคำนวณผลงานคณะ แต่ต้องสร้าง query/service/endpoint ใหม่ภายใต้ Scopus Benchmark และห้ามแก้ query ของ Dashboard เดิม
- ผลงาน KKU/Thailand ต้องใช้ count/harvest และ snapshot ในชุด `scopus_benchmark_*` ตามเดิม
- หาก P3 ต้องเก็บผลคำนวณหรือ metadata เพิ่ม ให้สร้างตารางภายใต้ namespace `scopus_benchmark_*` แยกจากตารางหลัก
- KKU/Thailand count path ที่ใช้งานได้แล้วต้องคงผลลัพธ์และ API contract เดิม
- นิยามผลงานคณะอย่างเป็นทางการ: เอกสาร Computer Science ที่อาจารย์ในระบบเป็นผู้แต่งใน `scopus_documents` และ affiliation ของอาจารย์คนนั้นในผลงานอยู่ใน allowlist สองค่าเท่านั้น: `60017165` (Khon Kaen University) หรือ `60280609` (Faculty of Science, Khon Kaen University); การยืนยันว่าเป็น `SUBJAREA(COMP)` ให้เชื่อมด้วย EID กับชุดเอกสาร KKU ที่มาจาก query `SUBJAREA(COMP)` ใน `scopus_benchmark_*`
- นับ `DISTINCT EID` ต่อปี; งานที่มีอาจารย์เข้าเกณฑ์หลายคนต้องนับเพียงครั้งเดียวในยอดระดับคณะ
- เมื่อ `users.date_of_employment` มีค่า ต้องตัดผลงานก่อนวันเริ่มงานออก; เมื่อยังว่าง ให้ใช้ AF-ID ใน allowlist สองค่านี้บน author-document relation เป็นหลักฐานการสังกัด KKU ไปก่อน และแสดง coverage/fallback ให้ผู้ใช้ทราบ (ข้อมูลจริงและ dev ยังไม่มีวันเริ่มงานเกือบทั้งหมด)

### P3 — รวมนิยาม "จำนวนผลงานคณะ" ให้เป็นแหล่งเดียว

**ปัญหา:** เลข "คณะ" มี 2 แหล่งให้ผลต่างกันเล็กน้อย (2024: count API = 52 vs is_faculty distinct = 51) เพราะคนละกลไก (query AU-ID อาจารย์ vs ธง is_faculty ตอน harvest)

**ข้อสรุปที่เลือก:** ใช้แหล่งผสมแบบตรวจสอบได้ โดยยึดชุด EID ของ KKU/COMP จาก `scopus_benchmark_*` แล้วตรวจผู้แต่ง, KKU AF-ID และวันเริ่มงาน (เมื่อมี) จากตารางหลักชุดเดียวกับ Dashboard ทั้งหมดทำใน service ของ Benchmark ใหม่ ไม่แก้ query/ingest/schema เดิม

**สถานะ:** ดำเนินการเสร็จและทดสอบแล้ว 1 ก.ย. 2026

**สิ่งที่ทำ:**

- `CountScope` เปลี่ยนเฉพาะ branch `level=faculty` ให้ใช้ local verified query; university/country ยังใช้ Scopus count path เดิม
- Query นับ `COUNT(DISTINCT bd.eid)` จาก KKU benchmark membership เชื่อม `scopus_documents` ด้วย EID แล้วใช้ author row เดียวกันตรวจ `users.scopus_id` และ `scopus_affiliations.afid IN (60017165, 60280609)`
- เงื่อนไขวันเริ่มงานเป็น `(date_of_employment IS NULL OR cover_date >= date_of_employment)` เพื่อใช้ AF-ID fallback กับข้อมูลปัจจุบัน และบังคับวันทันทีเมื่ออนาคตมีข้อมูล
- Comparison API เพิ่ม `faculty_metric` เพื่อรายงาน coverage โดยไม่แก้ contract ของ `years`; หน้า Benchmark แสดงข้อความว่าใช้ fallback กี่คน
- ถ้าไม่มีอาจารย์ active ที่ตั้ง Scopus ID จะไม่สร้าง faculty snapshot และหน้า comparison ซ่อนค่าคณะเก่า

**ผลตรวจฐาน dev:**

| ปี | ค่าเดิมจาก AU-ID query | verified เฉพาะ parent AF-ID | verified allowlist 2 AF-ID (ปัจจุบัน) |
|---|---:|---:|---:|
| 2024 | 52 | 47 | 52 |
| 2025 | 63 | 59 | 63 |
| 2026 | 59 | 53 | 58 |

- Employment-date coverage: อาจารย์ active ที่มี Scopus ID 41 คน, มีวันเริ่มงาน 1 คน, ไม่มี 40 คน
- เขียน snapshot ใหม่เฉพาะ scope `faculty_cs` ปี 2024–2026 สำเร็จ; ไม่ยิง Scopus และไม่เขียน KKU/Thailand ในการทดสอบนี้
- Backend: `go test ./services` ผ่าน และ `go test ./controllers -run '^$'` compile ผ่าน
- Frontend: `node --test` ผ่าน 26/26 และ production build ผ่าน
- ชุด controller test เต็มมี failure เดิมใน SSO scripted mock/driver collision ซึ่งไม่เกี่ยวกับไฟล์ที่แก้

### P5 — ลด N+1 request ตอน "อัปเดตตัวเลข" (backend)

**สถานะ 1 ก.ย. 2026: ดำเนินการเสร็จและทดสอบผ่าน**

**ปัญหา:** `AdminRefreshBenchmarkCounts` (controller ~บรรทัด 166) วนนับทีละปีต่อ scope = ~11 request/scope × 3 scope = ~33 request Scopus ต่อการกด 1 ครั้ง (sequential) → ช้า + เปลือง quota

**สิ่งที่ต้องทำ:**
- แตก branch คู่ใน `fund-management-api` (เช่น `feature/scopus-benchmark-counts-optimize`)
- ปรับ `refreshCounts`/`CountScope` ให้ใช้ Scopus range query (`PUBYEAR > x AND PUBYEAR < y`) + facet/group-by ปีในคำขอเดียว แทนการยิงทีละปี (ลดเหลือ ~1–2 request/scope)
- คงพฤติกรรมการเขียน snapshot รายปีให้ endpoint `comparison` อ่านได้เหมือนเดิม
- ทดสอบกับ Scopus จริง (ระวัง quota) และยืนยันตัวเลขรายปีตรงกับของเดิม

**ขอบเขต:** backend ล้วน — ต้องมี branch แยก + ทดสอบ Scopus จริง

**สิ่งที่ทำ:**

- เพิ่ม `CountScopeRange` และให้ endpoint refresh เรียกครั้งเดียวต่อ scope แทน `CountScope` แบบ total + วนทีละปี
- KKU/Thailand ใช้ range query + `pubyear` facet; แบ่งช่วงครั้งละไม่เกิน 30 ปีตาม facet limit (ช่วงปกติ 10 ปี = 1 request/scope, ช่วง 1981–2026 = 2 requests/scope)
- ตรวจว่าผลรวมทุก bucket เท่ากับ `opensearch:totalResults` ก่อนเขียน snapshot; ถ้าไม่ตรงจะไม่เขียนข้อมูลบางส่วน
- Faculty group ตามปีด้วย local DB query ครั้งเดียว และคง verified rule ของ P3
- เขียน snapshot ครบทุกปีในช่วงรวมปีที่เป็นศูนย์; response shape `total` + `by_year` เดิมยังอยู่ โดย `total` หมายถึงผลรวมในช่วงปีที่เลือก
- `CountScope` เดิมยังอยู่สำหรับ caller อื่น จึงไม่แตะ behavior ของ CLI/flow อื่น

**ผลทดสอบ Scopus จริงผ่าน VPN KKU (ช่วง 2024–2026):**

| Scope | Requests ภายนอก | 2024 | 2025 | 2026 | รวมช่วง |
|---|---:|---:|---:|---:|---:|
| KKU | 1 | 241 | 311 | 214 | 766 |
| Thailand | 1 | 4,742 | 5,597 | 3,264 | 13,603 |
| คณะ | 0 (local DB) | 47 | 59 | 53 | 159 |

- ก่อนเปิด VPN probe ได้ HTTP 400 `not entitled to access facets`; หลังเปิด VPN query เดิมได้ 200 ยืนยันว่า entitlement ผูกกับเครือข่าย KKU
- Integration refresh เขียน snapshot dev ครบทั้งสาม scope สำเร็จ
- Unit test ครอบคลุม facet parameters/decoding, total mismatch, zero-result และการแบ่งช่วง 30 ปี

### P3 Data-completeness guard + Full KKU re-harvest — 1 ก.ย. 2026

**สาเหตุที่ตัวเลขคณะจากการทดสอบก่อนหน้าไม่ครบ:** ผู้ใช้ยืนยันว่าเคยยกเลิก harvest กลางคัน และประวัติ run ใน dev DB ยืนยันดังนี้

| Run | ช่วงปี | สถานะ | เขียนแล้ว (สะสม) | Pages | Requests | หมายเหตุ |
|---|---|---|---:|---:|---:|---|
| #6 | 2024–2026 | cancelled | 650 | 27 | 29 | `cancelled by user` |
| #7 | 2025–2026 | cancelled | 389 | 16 | 17 | `cancelled by user` |
| #8 | 2017–2026 | failed | 651 | 27 | 29 | Scopus timeout ระหว่างปี 2024 (`context deadline exceeded`) |
| #9 | 2017–2024 | success | 1,517 | 64 | 72 | รันต่อช่วงที่ขาดด้วย retry/reconciliation รุ่นใหม่; จบ 1 ก.ย. 2026 19:39 น. |
| #10 | 2026 | success | 215 | 9 | 10 | รันเฉพาะปีล่าสุดเพื่อยืนยัน/reconcile membership; จบ 1 ก.ย. 2026 19:47 น. |

ผลคือชุด KKU/COMP EID ใน `scopus_benchmark_document_scopes` บางปีไม่ครบ แม้ count snapshot จาก Scopus จะครบแล้ว การนำ membership ที่ไม่ครบไป intersect กับ `scopus_documents` จึงทำให้ยอดคณะต่ำหรือเป็นศูนย์โดยไม่ควรถือเป็นผลทางการ

**สิ่งที่เพิ่มเพื่อกันข้อมูลผิด:**

- Comparison API เปรียบเทียบจำนวน KKU membership แบบ `DISTINCT document_id` รายปีกับ KKU count snapshot ล่าสุดของปีเดียวกัน
- ถ้าไม่มี snapshot หรือจำนวนไม่เท่ากัน จะส่งปีนั้นใน `faculty_metric.benchmark_years_missing` และคืนค่าคณะเป็น `null` แทนการแสดงศูนย์/ยอดเก่า
- การ refresh faculty จะถูกปฏิเสธจนกว่า KKU documents ในทุกปีของช่วงที่เลือกจะครบ
- หน้า Benchmark แสดงคำเตือนพร้อมรายชื่อปีที่ต้อง harvest และระบุชัดว่า KKU documents เป็นข้อมูลบังคับสำหรับตรวจผลงานคณะ ส่วน Thailand documents เป็นข้อมูลขั้นสูงที่ไม่บังคับ
- ระหว่างรันตรวจพบ mismatch ชั่วคราวในปี 2026: membership 215 รายการ ขณะที่ count snapshot ก่อนหน้าเท่ากับ 214 จึงยืนยันว่าต้องมี reconciliation หลังจบ query ของแต่ละปี เพื่อถอนเฉพาะ scope membership ที่ Scopus ไม่ส่งกลับมาแล้ว โดยไม่ลบ document หลักและไม่แตะตาราง Dashboard; เมื่อ refresh Scopus ล่าสุด count ปี 2026 ขยับเป็น 215 และตรงกับ membership
- หาก run ถูกยกเลิก หรือมี entry ใดเขียนไม่สำเร็จ จะไม่ทำ reconciliation เพื่อป้องกันการลบ membership จากชุดผลลัพธ์ที่ยังไม่ครบ
- เพิ่ม retry สูงสุด 3 ครั้งสำหรับ timeout/network error ชั่วคราว (หน่วง 2 วินาที) และคง backoff 8 วินาทีสำหรับ HTTP 429; เพิ่ม unit test จำลอง timeout ครั้งแรกแล้ว request ถัดไปสำเร็จ

**Verification ระหว่างดำเนินการ:**

- Backend `go test ./services` ผ่าน
- Backend `go test ./controllers -run '^$'` compile ผ่าน
- Frontend `node --test` ผ่าน 26/26
- Full old-year harvest ถูกทำเพราะใช้ช่วงทดสอบเดิม 2017–2026; หลังผู้ใช้ทักท้วง กำหนดหลักปฏิบัติใหม่ว่า verification ปกติใช้เฉพาะ 1–3 ปีล่าสุด และจะไม่รันย้อนหลังไกลโดยไม่มีเหตุจำเป็น/คำขอชัดเจน

**ผลสุดท้ายหลัง run #9, run #10 และ refresh:**

| ปี | Verified faculty | KKU/COMP | Thailand/COMP |
|---|---:|---:|---:|
| 2024 | 52 | 241 | 4,742 |
| 2025 | 63 | 311 | 5,597 |
| 2026 | 58 | 215 | 3,269 |

- `benchmark_years_missing = []` สำหรับช่วง 2024–2026: KKU membership ตรงกับ count snapshot ล่าสุดครบทุกปี
- Employment-date coverage ยังเป็น 1/41 คน; อีก 40 คนใช้ allowlist `60017165`/`60280609` fallback ตามข้อกำหนด
- ยืนยันจากข้อมูลจริงว่า `scopus_affiliations` เก็บ AF-ID หน่วยงานย่อยแยกจาก parent และ `scopus_document_authors` ผูก AF-ID แรกของผู้แต่ง; การใช้ parent อย่างเดียวจึงตกหล่น Faculty of Science จริง 5, 4 และ 5 EID ในปี 2024–2026 ตามลำดับ
- Refresh ล่าสุดยังใช้ P5 range facet: 1 Scopus request สำหรับ KKU และ 1 request สำหรับ Thailand; faculty คำนวณจาก local DB โดยไม่ยิง Scopus
- Backend `go test ./services` และ controller compile check ผ่าน; frontend `node --test` ผ่าน 26/26 และ `next build` ผ่าน

### ผล Code Review และ Integration Verification — 2 ก.ย. 2026

**ขอบเขตการตรวจ:** ตรวจ diff ของ Phase 1/P3/P5, automated tests, production build และเรียก Benchmark API จริงผ่าน VPN KKU โดยตรง ผู้ใช้ขอให้ตัดการทดสอบหน้าจริงบน `localhost` ออกจากรอบนี้ จึงไม่มี UI/manual-browser verification เพิ่มเติม

**Automated verification:**

- Backend `go test ./services` ผ่าน
- Backend `go test ./controllers -run '^$'` compile ผ่าน
- Frontend `node --test` ผ่าน 26/26
- Frontend production `next build` ผ่าน compile, lint/type validation และ static page generation
- `git diff --check main...HEAD` ผ่านทั้ง frontend/backend

**Integration จริงผ่าน VPN (เฉพาะปีล่าสุด 2025–2026):**

1. Refresh รอบแรกใช้ P5 range facet สำเร็จและพบค่าปี 2026 จาก Scopus เปลี่ยนจาก snapshot เดิมเป็น KKU 217 และ Thailand 3,323
2. เนื่องจาก KKU membership เดิมมี 215 รายการ coverage guard ส่ง `benchmark_years_missing=[2026]`, ปฏิเสธการเขียน faculty snapshot และ Comparison API คืน `faculty=null` สำหรับปี 2026 ถูกต้อง
3. รัน KKU harvest **run #11 เฉพาะปี 2026** สำเร็จ: `total_results_reported=217`, `documents_upserted=217`, `pages_fetched=9`, `requests_made=10`, ระยะเวลา 377.86 วินาที; ไม่ได้รันย้อนหลังปีเก่ากว่านี้
4. หลัง reconciliation และ refresh ซ้ำ `benchmark_years_missing=[]` และ faculty กลับมาคำนวณได้

| ปี | Verified faculty | KKU/COMP | Thailand/COMP |
|---|---:|---:|---:|
| 2025 | 63 | 311 | 5,597 |
| 2026 | 58 | 217 | 3,323 |

- Employment-date coverage ยังเป็น 1/41 คน; อีก 40 คนใช้ AF-ID allowlist fallback
- Query ตรวจฐาน dev แบบ read-only ยืนยันว่าเงื่อนไข `sd.cover_date IS NOT NULL` ยังไม่เปลี่ยนผลปี 2025–2026: current rule/without unconditional cover-date gate เท่ากับ 63/63 และ 58/58
- ไม่พบ active user ที่เก็บ `scopus_id` ในรูปแบบมี prefix `SCOPUS_ID:`
- รอบทดสอบเพิ่ม count snapshots และประวัติ harvest run #11 ในฐาน dev; ไม่แก้ Dashboard logic/schema/ingest และไม่มีการแก้โค้ดระหว่าง review

**Review findings — ยังไม่แก้ในรอบ review:**

1. **P1 — Coverage guard ตรวจเพียง cardinality:** `facultyBenchmarkMissingYears` เปรียบเทียบจำนวน membership กับ count snapshot เท่านั้น จึงอาจผ่านชั่วคราวระหว่าง active harvest หรือกรณี EID เก่า/ใหม่สลับกันแต่จำนวนเท่าเดิม ควรผูก coverage กับ successful KKU harvest generation/run ของแต่ละปี และไม่ให้ refresh faculty ระหว่าง KKU harvest
2. **P1 — Frontend อาจรายงาน partial refresh เป็น success:** `refreshCounts` ตรวจเฉพาะ error ของ `faculty_cs`; หาก KKU หรือ Thailand error แต่ faculty คำนวณจากข้อมูลเดิมสำเร็จ UI ยังแจ้ง “อัปเดตตัวเลขแล้ว” ควรตรวจผลทุก scope และแจ้ง partial failure
3. **P2 — Unconditional `cover_date` gate ไม่ตรง fallback เต็มรูปแบบ:** verified query บังคับ `sd.cover_date IS NOT NULL` แม้ `date_of_employment` ว่าง ทำให้เอกสารที่ AF-ID ถูกต้องแต่ไม่มี cover date ถูกตัดออก ควรต้องใช้ cover date เฉพาะเมื่อมีวันเริ่มงาน; ปัจจุบันยังไม่กระทบยอด dev ตามผลตรวจด้านบน

**ข้อสรุป review:** implementation และ integration หลักทำงานผ่าน แต่ยังไม่แนะนำให้ merge จนกว่า agent ถัดไปจะจัดการ P1 สองข้อข้างต้น ส่วน P2 ควรแก้หรือบันทึกการยอมรับ edge case อย่างชัดเจนก่อน merge

---

## ลำดับงานสรุป

1. เฟส 1: งาน 1→2→3→4 (frontend, branch `feature/scopus-benchmark-revamp`) → verify → **ส่งตรวจ**
2. P3 verified faculty metric — **เสร็จแล้ว**
3. P5 ลด request ตอน refresh counts — **เสร็จแล้ว**

## ข้อกำหนดสำหรับ agent ที่ลงมือ

- ทำงานแยกเป็น phase และ commit ให้ตรวจย้อนกลับได้
- แก้ให้ตรงไฟล์/บรรทัดที่ระบุ รักษา style เดิม (Tailwind + โครงคอมโพเนนต์เดิม)
- ทุกงานต้องมี Verification ตามเกณฑ์ผ่าน + แนบ screenshot/หลักฐาน
- commit เป็นก้อน ๆ ต่องาน (P2, P1/P6, P4, P6-robustness) เพื่อให้รีวิวง่าย
- อย่า merge เข้า main เอง รอผู้ตรวจ
