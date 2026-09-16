# Scopus Benchmark — Executive report (คู่มืออ้างอิงฟีเจอร์)

เอกสารอ้างอิงหลักสำหรับดูแลระบบ "รายงานเปรียบเทียบผลงาน Scopus (Computer Science)" ระดับผู้บริหาร
ที่หน้า `admin/scopus-benchmark` แท็บ **ผลเปรียบเทียบ**. สัญญา request/response ดูที่
[scopus-benchmark-report-contract.md](./scopus-benchmark-report-contract.md).

โค้ดหลัก: helper บริสุทธิ์ [`app/lib/scopus_benchmark_report.mjs`](../app/lib/scopus_benchmark_report.mjs)
(+ test [`app/lib/__tests__/scopus_benchmark_report.test.mjs`](../app/lib/__tests__/scopus_benchmark_report.test.mjs)),
container [`ScopusBenchmarkDashboard.js`](<../app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js>),
ชิ้นส่วน UI ใน [`components/research/report/`](<../app/(portal)/research-fund-system/admin/components/research/report>),
harness ตรวจ layout (dev-only, 404 ใน production) [`app/dev/scopus-benchmark-report/`](../app/dev/scopus-benchmark-report).

## 1. วัตถุประสงค์
รายงานหน้าเดียวสำหรับผู้บริหาร เปรียบเทียบผลงานวิจัย CS ของ **คณะ (verified faculty)** เทียบกับ
**มหาวิทยาลัยขอนแก่น (KKU)** และ **ประเทศไทย** ในปีที่เลือก โดยแสดงเฉพาะค่าที่ข้อมูลรองรับจริง —
ไม่ประดิษฐ์ตัวเลข ไม่รวมยอดสามระดับ (ผลงานทับซ้อนกัน) และไม่ตีความค่าที่สูงกว่าว่าดีกว่าโดยอัตโนมัติ.
คณะ = ชุดเดียวกับที่ใช้นับ KPI (verified-faculty EID cohort, KKU COMP membership, AF-ID 60017165/60280609,
ผูก employment date เมื่อมี).

## 2. โครงหน้าและ UX ที่ใช้จริง
เรียงบนลงล่าง (component จริงในโฟลเดอร์ `report/`):
- **Header** — ชื่อรายงาน, ปีรายงาน (dropdown), ช่วงแนวโน้ม, วันที่ snapshot ต่อระดับ, ปุ่ม รีเฟรช / พิมพ์ / ส่งออก / ดูแหล่งข้อมูล.
- **KPI strip** — 4 ตัวของ **คณะ**: จำนวนผลงาน, สัดส่วนคณะ/KKU, T1–Q2, ร่วมต่างประเทศ พร้อม subline เทียบปีก่อน (เฉพาะปีจบ) และหมายเหตุเมื่อ snapshot ไม่ครบ.
- **ประเด็นสำคัญของปี** — 0–2 ประโยคเชิงความสัมพันธ์ทางคณิตศาสตร์ (ไม่มีคำชม/สาเหตุเชิงวิจัย).
- **แนวโน้มย้อนหลัง** — กราฟแท่งจำนวนผลงานคณะ + กราฟเส้นสัดส่วนคณะ/KKU (5/10 ปี) + `<details>` ตารางรายปี. ปีปัจจุบันเป็นข้อมูลสะสม (ลายเส้น + "สะสม"); ปีที่ไม่มีข้อมูลเป็นช่องว่าง ไม่ใช่ 0.
- **ตารางเปรียบเทียบปี …** — คณะ/KKU/ประเทศไทย + คอลัมน์ "คณะเทียบ KKU" (แสดงส่วนต่างเฉพาะ metric ที่พร้อมทั้งสองฝั่ง).
- **การอ้างอิงสะสม …** — ตาราง 3 แถว (ยอดสะสมรวม / เฉลี่ยต่อผลงานที่มีข้อมูล / known/cohort). เปิดแสดงเสมอ ไม่ซ่อนในแท็บ.
- **รายละเอียดคุณภาพวารสารและประเภทผลงาน** — `<details>` การกระจายกลุ่มวารสาร (เฉพาะที่จัดกลุ่มได้) + ตารางประเภทผลงาน.
- **นิยามและความพร้อมของข้อมูล** — `<details>` นิยาม + footer (ขอบเขต/ปี/สร้างเมื่อ/วันที่อัปเดต) ที่แสดงเสมอ.

## 3. การเลือกปีรายงาน (default / fallback / YTD)
ตรรกะอยู่ใน `selectReportYear`, `resolveBootstrapFloor` (lib) และ effect ใน dashboard.
- **default (ไม่เลือกเอง)** เรียงลำดับความชอบ: ปีจบ (`< ปีปัจจุบัน`) ล่าสุดที่ **faculty = available** → ปีจบล่าสุดที่ **KKU/ประเทศไทย available** (คณะยังไม่พร้อม) → **ปีปัจจุบันแบบสะสม** เมื่อมีระดับใด available → `null` (empty state). ไม่ fallback ไปข้อมูลที่ประดิษฐ์.
- **แยก "มี snapshot" ออกจาก "พร้อม"**: `available_years` = การมี snapshot (รวมปีที่ faculty `blocked`) ใช้บอกแค่ "ต้องโหลดถึงปีไหน"; ความพร้อมจริงอ่านจาก `year_meta[...].status`. `resolveBootstrapFloor` = ปีจบเก่าสุดที่มี snapshot → ขยาย window ลงไปถึง floor ให้ `year_meta` มีสถานะ faculty จริงของทุกปีจบ แล้วจึงเลือก ทำให้ปีใหม่ที่ `blocked` ไม่บังปีเก่าที่ faculty พร้อม. floor คงที่ → ไม่วนโหลด.
- **เลือกเอง (manual)**: dropdown มาจาก union ของ `available_years` (เลือกปีเก่านอก window แรกได้ — โหลด window เพิ่มตามช่วงแนวโน้ม). ค่า manual ไม่ถูกแทนที่ด้วย default.
- **YTD / ปีปัจจุบัน**: เมื่อปีที่เลือก = ปีปัจจุบัน → โหมดสะสม (`isCurrentYear`) ไม่เทียบปีก่อนแบบเต็มปี, KPI subline ระบุ "ข้อมูลสะสม (ยังไม่ครบปี)".

## 4. สูตรและตัวหาร (lib §8)
- **จำนวนผลงาน (count)** = `years[].faculty|university|country` จาก count snapshot (เฉพาะระดับที่ `status=available`).
- **สัดส่วนคณะ/KKU** = `faculty / university × 100` — งดเมื่อ scope ไม่ตรง (ดู §6).
- **T1–Q2 (high-tier share)** = `(t1 + q1 + q2) / (t1+q1+q2+q3+q4) × 100`; ตัวหาร = ผลงานที่ **จัดกลุ่มวารสารได้** (classified) เท่านั้น. T1 ถูกแยกออกจาก Q1 แล้ว (บวก ไม่ใช่นับซ้ำ).
- **OA / นานาชาติ (observed)** = `positive / known × 100`; เอกสารที่ไม่ทราบสถานะ (`unknown`) **ไม่ถูกนับเป็นตัวหาร** และไม่นับเป็นค่าลบ. ถ้าไม่มี coverage counts จึง fallback เป็นอัตราแบบ docs เดิม.
- **การอ้างอิงเฉลี่ย** = `total / known_docs` (รวมค่าศูนย์จริงในตัวหาร); `null` เมื่อ `known_docs=0` (ไม่ใช่ 0).
- **ส่วนต่าง (คณะเทียบ KKU)** เป็น "จุดเปอร์เซ็นต์"; ปัดแล้วเท่ากันแสดงว่า "ใกล้เคียงกัน" ไม่ใช่ 0 ปลอม.

## 5. Missing กับ Zero
- `isUsable`: `0` จริงถือว่าใช้ได้; `null/undefined/NaN/""` ใช้ไม่ได้.
- `normalizeReportRow`: ระดับที่ snapshot **ไม่** `available` → count เป็นค่าว่าง (ไม่ใช่ 0) ในตาราง/CSV/สัดส่วน. ระดับที่มี snapshot ค่าเป็นศูนย์จริง → คงเป็น 0.
- กราฟแนวโน้ม: ปีที่ไม่มีข้อมูลเป็นช่องว่าง (เส้นขาด/ไม่มีแท่ง) ไม่ลากลงศูนย์.

## 6. Scope guard
`report_scope.consistent === false` (สามระดับต่าง subject หรือไม่ใช่ COMP) → **งดทุก surface ที่เป็นการเปรียบเทียบ**:
ประเด็นสำคัญ, ส่วนต่างในตาราง, KPI สัดส่วนคณะ/KKU, เส้นสัดส่วนในกราฟ และคอลัมน์ share ใน CSV — พร้อม banner เตือน.
แสดงเฉพาะค่าที่สังเกตได้ต่อระดับ.

## 7. การอ้างอิง (ตามปีตีพิมพ์)
- เป็น **ยอดสะสม ณ ครั้งที่อัปเดต** ของผลงานที่ **ตีพิมพ์ในปีรายงาน** — ไม่ใช่การอ้างอิงที่เกิดขึ้นในปีนั้น.
- `known/cohort` = ความครอบคลุมของข้อมูลการอ้างอิงภายในชุดที่ harvest แล้ว; `cohort_docs` = จำนวนผลงานที่สังเกต (observed) ของปีนั้น (ดูสัญญาใน contract). ไม่ทราบวันที่อัปเดต → `freshness_status = unknown`.
- ไม่รวมยอดสามระดับ (cohort ทับซ้อน) และไม่ตีความค่าเฉลี่ยเป็นคุณภาพที่ปรับตามสาขา.

## 8. Export และ Print
- **CSV**: รายปี (ช่วงแนวโน้มที่แสดง) และ เปรียบเทียบ (ปีรายงาน) — มีตัวตั้ง/ตัวหาร, สถานะ snapshot, ความพร้อมราย metric, citation freshness และบรรทัด `# scope_consistent`. ใช้ helper ตัวเดียวกับหน้าจอ (ค่าตรงกัน) และ regenerate ได้ด้วย [`scripts/gen-scopus-benchmark-evidence.mjs`](../scripts/gen-scopus-benchmark-evidence.mjs).
- **Print (A4)**: `@page A4 portrait` inject เฉพาะตอนรายงาน mount; กฎ print ทั้งหมด guard ด้วย `body:has(#scopus-report-root)` (หน้าอื่น/จอปกติไม่กระทบ). กฎแบ่งหน้า: หัวข้ออยู่กับบล็อกถัดไป, ไม่ตัดกลางแถว/กราฟ/การ์ด/บล็อก citation, ทำซ้ำหัวตาราง, ปล่อยภาคผนวกไหลต่อ. ปุ่มพิมพ์ (และ Ctrl+P) กาง `<details>` ที่พับอยู่ให้ครบตอนพิมพ์แล้วคืนสถานะ (effect `beforeprint`/`afterprint`) — PDF จึง self-contained.

## 9. ข้อจำกัดที่ยังมี
- ไม่ทราบวันที่อัปเดตการอ้างอิงที่พิสูจน์ได้ → `freshness=unknown` (ใช้ข้อมูลเท่าที่มี).
- OA/นานาชาติเป็นอัตราจากเอกสารที่ทราบสถานะ (unknown เป็น lower-bound ของความครอบคลุม).
- ไม่มีการ normalize ตามสาขา; สามระดับทับซ้อนจึงไม่รวมยอด.
- บางปี faculty ต้องดึงเอกสาร KKU เพิ่ม (`faculty_metric.benchmark_years_missing`) จึงคำนวณค่าคณะได้.
- `employment_date` ยังไม่ครบทุกคน (`faculty_metric.employment_date_missing`) — เมื่อไม่มีใช้ AF-ID เป็นหลักฐานสังกัด.

## 10. สรุปการตรวจล่าสุด (รอบ 1–7)
แยกตามผู้ตรวจ:
- **Reviewer ตรวจ**: FE `node --test` 51/51; BE `go build ./...` + `go test ./services` ผ่าน; per-metric readiness/observedRate/scope guard/bootstrap (R2–R4); print pagination P1–P4 จาก PDF A4 ที่ render จริง; fixture fidelity (invariant script ผ่านทุก scenario) และรูปสัญญา insights เทียบตัวอย่าง live ปี 2025.
- **Implementer รายงาน**: smoke หน้า portal จริง (default=ปีจบล่าสุด, เปลี่ยนปี, refresh) เทียบ TEST DB; headless print-to-pdf รวม auto-expand (ยืนยัน event `beforeprint` กาง details ครบ); CSV regenerate ผ่าน lib เดียวกับปุ่มส่งออก; พบกรณีจริง `observed > count` (snapshot mismatch แบบเปิดเผย).
- **ผู้ใช้ยืนยัน**: keyboard navigation ผ่านทุกข้อ; ดาวน์โหลด CSV/PDF ตรวจแล้ว; ผลพิมพ์ยอมรับได้.

> หลักฐานภาพ/PDF/live-sample เก็บไว้นอก repo (ไม่ commit — มีทั้งไฟล์หนักและตัวอย่างจาก TEST DB). ตัวเลขตรวจสอบซ้ำได้จาก harness + `scripts/gen-scopus-benchmark-evidence.mjs`.
