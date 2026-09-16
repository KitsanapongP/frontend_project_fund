# Scopus Benchmark — Executive redesign · review package

> **รอบ 7 (print pagination fix) — 2026-09-17.** แก้เฉพาะ **layout การพิมพ์** (globals.css, @media print เท่านั้น) ตามที่ผู้ใช้แจ้งจาก PDF จริง ไม่แตะสูตร/ข้อมูล/หน้าจอ. ตอบข้อค้าง "print/PDF จริง" ที่ค้างจากรอบ 6. ดูรอบ 7 ด้านล่างนี้ก่อน แล้วจึงรอบ 6 เป็นต้นไป. ไฟล์ findings ของ reviewer ไม่ถูกแก้ไข.

## รอบ 7 — print pagination → สิ่งที่แก้ → หลักฐาน

ผู้ใช้แจ้ง 3 ปัญหาจาก PDF ที่พิมพ์จริง (A4): (1) หัวข้อกราฟสัดส่วนอยู่ท้ายหน้าแต่กราฟไปหน้าถัดไป; (2) หัวข้อ citation + หัวตารางอยู่ท้ายหน้าแต่ข้อมูลขึ้นหน้าใหม่; (3) พื้นที่ว่างมากก่อนภาคผนวก.

| ปัญหา | สาเหตุ (print CSS) | สิ่งที่แก้ (`app/globals.css`, `@media print` guarded ด้วย `body:has(#scopus-report-root)`) |
|---|---|---|
| **P1** หัวข้อกราฟ "สัดส่วนผลงานคณะต่อ KKU" ท้ายหน้า กราฟไปหน้าถัดไป | มีแต่ `break-inside: avoid` บน h2/tr/`section>svg` — ไม่มีกฎ "ให้หัวข้ออยู่กับบล็อกถัดไป" และคอลัมน์กราฟ (h3+svg) แยกกันได้ | เพิ่ม `h2,h3,summary { break-after: avoid }` (หัวข้อไม่ตกท้ายหน้า) + `.grid > * { break-inside: avoid }` (แต่ละ cell ของ grid = การ์ด KPI / คอลัมน์กราฟ / คอลัมน์ appendix อยู่ครบก้อน) + `svg { break-inside: avoid }` |
| **P2** หัวข้อ citation + หัวตารางค้างท้ายหน้า ข้อมูลขึ้นหน้าใหม่ | ไม่มีกฎยึดหัวข้อ+ตารางเล็กไว้ด้วยกัน | เพิ่ม `section[aria-label^="การอ้างอิงสะสม"] { break-inside: avoid }` — ตารางสั้น (3 แถว) ยกทั้งบล็อก (หัวข้อ+ตาราง+หมายเหตุ) ไปหน้าเดียวกัน ไม่ทิ้งหัวข้อค้าง |
| **P3** พื้นที่ว่างมากก่อนภาคผนวก | `details[open] { break-before: page }` บังคับทุก `<details>` ที่เปิด (ภาคผนวกคุณภาพ, ตารางแนวโน้ม, นิยาม) ขึ้นหน้าใหม่ → เกิดช่องว่างท้ายหน้าก่อนหน้า | **ลบกฎ break-before นี้** → ภาคผนวกไหลต่อจาก citation เติมเต็มหน้า, แตกหน้าเฉพาะจุดที่กฎ break-inside อนุญาต. ไม่บังคับทั้งรายงานเป็นก้อนเดียว: ตารางยาว (เปรียบเทียบ/รายปี) ยังแตกระหว่างแถวได้ พร้อม repeat `thead` |

| **P4** ถ้าผู้ใช้ไม่กางรายละเอียดก่อนพิมพ์ "รายละเอียดคุณภาพวารสารและประเภทผลงาน" + "นิยามและความพร้อมของข้อมูล" หลุดจาก PDF (print CSS ซ่อน `details:not([open])`) | รายงานที่พิมพ์ควร self-contained | เพิ่ม effect print-only ใน `ScopusBenchmarkDashboard.js`: ผูก `beforeprint` → กาง `<details>` ที่ยังพับทั้งหมดใน `#scopus-report-root`, `afterprint` → คืนค่าเดิม. ครอบทั้งปุ่ม "พิมพ์รายงาน" และ Ctrl+P. ตั้ง `.open` ตรง ๆ (ขับ controlled `<details>` ผ่าน onToggle ให้ React sync). ไม่แตะสูตร/ข้อมูล/ค่าที่แสดง |

ไม่แตะ: สูตร (`scopus_benchmark_report.mjs`), ขนาดตัวอักษร (คงกติกา ≥10.5pt ตาราง / 9pt subscript / 12px chart), และไม่มีกฎ print ระดับ global (ทั้ง 23 rule guard ด้วย `body:has(#scopus-report-root)` → หน้าอื่นและจอปกติไม่กระทบ — regression guard เดิมจากรอบ R2). การแก้ P1–P3 อยู่ใน `app/globals.css` ล้วน; P4 เพิ่มเฉพาะ print-behavior effect ใน component (ไม่เปลี่ยน render ปกติ — details ยังพับ/กางตามผู้ใช้บนจอ, กางเฉพาะช่วงพิมพ์แล้วคืนค่า).

### หลักฐาน (สร้างด้วย headless Chrome `--print-to-pdf` บน dev harness = component จริง + fixture; @page A4 ที่ component inject ตอนพิมพ์)
- `docs/scopus-benchmark-executive-review-evidence/print-normal-paginated-open.pdf` — **รายละเอียดเปิด (?open=1) = 4 หน้า**: หน้า1 header/KPI/findings/หัวข้อแนวโน้ม+กราฟจำนวน; หน้า2 **หัวข้อสัดส่วน+กราฟสัดส่วนอยู่ด้วยกัน (P1 แก้)** + ตารางรายปี + ตารางเปรียบเทียบครบ; หน้า3 **หัวข้อ citation+ตารางครบอยู่ด้วยกัน (P2 แก้)** + ภาคผนวกคุณภาพไหลต่อเติมหน้า (P3 แก้); หน้า4 ตารางประเภทผลงาน + นิยาม + footer
- `docs/scopus-benchmark-executive-review-evidence/print-normal-paginated-collapsed.pdf` — **รายละเอียดพับ = 3 หน้า**: citation ยกทั้งบล็อกไปหน้า 3 (หัวข้อไม่ค้าง), footer ครบ, ไม่มีหน้าว่าง. (ช่องว่างท้ายหน้า 2 เล็กน้อยเป็นผลของการยึด citation ไว้ด้วยกัน — เป็น tradeoff ที่ตั้งใจ ตามคำสั่ง "หัวข้ออยู่กับเนื้อหาช่วงแรก")
- ตรวจทุกหน้า: ไม่มีข้อความถูกตัด ไม่มีตารางล้นแนวนอน (ทุกคอลัมน์ครบ) ไม่มีหน้าว่าง

- `docs/scopus-benchmark-executive-review-evidence/print-normal-autoexpand-button.pdf` — **พิมพ์โดย "ไม่" กางรายละเอียดล่วงหน้า** (harness ไม่มี `?open=1`): beforeprint กางให้เอง → ได้ 4 หน้าเต็ม (byte-identical layout กับไฟล์ open ข้างบน) พิสูจน์ว่า P4 ทำงานในเส้นทางพิมพ์จริง

### ตรวจแล้ว / ข้อจำกัด
- ทั้งสองกรณี (เปิด/พับ) ผ่าน. หน้าจอปกติไม่กระทบ (กฎ CSS อยู่ใน `@media print` ล้วน; effect P4 แตะ `.open` เฉพาะช่วง before/afterprint แล้วคืนค่า). หน้าอื่นของแอปไม่กระทบ (guard `body:has(#scopus-report-root)`).
- P4 ตรวจในเบราว์เซอร์: dispatch `beforeprint` → `<details>` เปิดครบ 3/3; dispatch `afterprint` → คืนเป็น 0/3. และ PDF จาก harness ที่ไม่ได้กางล่วงหน้าออกมา 4 หน้าเต็ม.
- หลักฐานสร้างจาก harness (fixture "normal") — เป็น component จริงของรายงาน. ยังไม่ได้พิมพ์จาก portal จริงหลัง login รอบนี้ (แต่ layout เหมือนกันเพราะ component เดียวกัน). ผู้ใช้/reviewer พิมพ์จาก portal จริงยืนยันซ้ำได้.
- FE `node --test` ไม่กระทบ (lib ไม่ถูกแตะ). ห้าม merge/push/deploy จนกว่าจะตรวจรับ.

---

> **รอบ 6 (ตาม reviewer รอบ 5: fixture fidelity + integration acceptance) — 2026-09-16.** R4-1 ปิดแล้วในรอบ 5. รอบนี้ไม่ได้แก้ application code — จัดการตามข้อสังเกตหลักฐานของ reviewer รอบ 5 (fixture ที่ count/cohort/readiness ขัดกัน) และเก็บ integration acceptance เท่าที่ตรวจได้ พร้อมระบุข้อที่ยังตรวจไม่ได้ตรง ๆ. ดูรอบ 6 ด้านล่างนี้ก่อน แล้วจึงรอบ 5 (R4-1) เป็นต้นไป. ไฟล์ findings ของ reviewer ทุกฉบับไม่ถูกแก้ไข.

## รอบ 6 — fixture fidelity + integration acceptance → สิ่งที่ทำ → หลักฐาน

อ้างอิง reviewer รอบ 5: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-findings-round5.md` (ไฟล์ของ reviewer — ไม่แก้ไข). Verdict รอบ 5: ปิด R4-1, ไม่พบ blocker ใหม่, และ **ขอให้ปรับ fixture ให้ count/cohort/readiness สอดคล้องกันก่อนใช้อ้าง readiness/citation** (หรือระบุว่าภาพ blockednew ตรวจเฉพาะการเลือกปี). เลือกทางแรก: แก้ fixture ให้สอดคล้อง.

| งาน | สิ่งที่ทำ (โค้ด) | tests / หลักฐาน |
|---|---|---|
| **F-1** dev harness fixture ขัดแย้งในตัวเอง: `blockednew`@2010 แสดง faculty count=40 แต่ classified denom=72 / citation cohort=72 (cohort > count เป็นไปไม่ได้), KKU count=180 vs cohort=300 และ doctype share ทะลุ 100% — โดยไม่มี harvest mismatch flag | **สาเหตุ:** harness เดิมสร้าง insights detail จาก base คงที่ที่ปรับตามปี (`scale()`) **แยกอิสระจาก** count ในตารางเปรียบเทียบ จึงตรงกันแค่ปี `CURRENT_YEAR-1` และเพี้ยนหนักที่ปีเก่า (ปัญหาเดียวกันแฝงใน `oldonly` และ thailand ของ `normal` ด้วย). **แก้:** แยก data builders ออกเป็น `app/dev/scopus-benchmark-report/fixtures.mjs` (pure JS) แล้ว `insightsFor(year)` **ดึง count ทางการของปีนั้นจาก payload เปรียบเทียบชุดเดียวกัน** และ derive ทุกค่าให้ผูกกลับกับ count: `docs = count` (observed = count ยกเว้นกรณี mismatch ที่ observed < count), `cohort_docs = docs`, `classified + unclassified_journal + non_journal = docs`, doctypes รวม = docs, readiness สะท้อน count/observed. `page.js` เหลือแค่ UI + import fixtures | ยืนยันสด (npm run dev) `?scenario=blockednew&open=1`: **default = 2010** (R4-1 คงเดิม), count 40/180/1600 = cohort 40/40·180/180·1,600/1,600 (complete), classified 25/32·91/140·586/960 (≤ count), doctype 80/15/5% (รวม 100%). `?scenario=oldonly`: 20/90/800 = cohort ครบ. `?scenario=mismatch`: observed 70 < count 74 + note "harvest incomplete: count snapshot has 74 docs but 70 were harvested" + คณะเทียบ KKU งดรายเมตริก |
| **F-2** หลักฐาน CSV ต้องตรงกับตัวเลขบนจอ (ตามหมายเหตุ reviewer รอบ 4/5) | เพิ่ม `scripts/gen-scopus-benchmark-evidence.mjs` — import `fixtures.mjs` + report lib ตัวจริง แล้ว **regenerate CSV ผ่าน `buildComparisonCsv`/`buildYearlyCsv` ชุดเดียวกับปุ่มส่งออกของแอป** (จึงตรงกับที่จอ render). สคริปต์ยัง assert invariant ทุก scenario/ทุกปี/ทุกระดับ: cohort ≤ count, classified ≤ count, doctypes รวม = docs, known ≤ cohort, count.ready ตรงกับสถานะ mismatch | `node scripts/gen-scopus-benchmark-evidence.mjs` → **FIXTURE FIDELITY: PASS (7 scenarios)**. เขียนทับ `comparison-scopebad.csv` (cohort เดิม 72/72·300/300·3000/3000 → **74/74·304/304·2,940/2,940 complete**; classified 48/59·154/237·1,076/1,764; Thailand `T1–Q2 พร้อมเทียบ`=false คงเดิมผ่าน unclassified journals) และ `yearly-scopebad.csv` (counts ไม่เปลี่ยน = เหมือนเดิม). FE `node --test` **51/51 ผ่าน** (lib ไม่ถูกแตะ) |

### เหตุผลที่ไม่แก้ application code
reviewer รอบ 5 ระบุชัด: "ไม่ต้องเปลี่ยน production logic เพื่อให้ตรงกับ fixture ที่ขัดกัน". โค้ดรายงาน (lib + component) ถูกต้องอยู่แล้ว — จุดผิดอยู่ที่ **ข้อมูลทดสอบของ harness** เท่านั้น. การแก้จึงจำกัดที่ `app/dev/**` และ `scripts/**` + regenerate หลักฐาน; ไม่มีการเปลี่ยน `app/lib/scopus_benchmark_report.mjs` หรือ component ในรอบนี้.

### integration acceptance ที่ตรวจได้รอบนี้ (harness = component จริง + fixture ที่สอดคล้องแล้ว)
- **default/year-change:** blockednew ลง 2010 ถูกต้อง; dropdown มี 2026/2025/2010; เลือกปีเปลี่ยนบริบทได้
- **export:** CSV ที่ปุ่มส่งออกสร้าง = ที่จอแสดง (พิสูจน์ผ่าน gen-script ที่ใช้ code path เดียวกัน)
- **per-metric readiness/citation:** mismatch แสดง observed<count + งด gap รายเมตริก; Thailand ใน scopebad ยัง quality-not-ready; citation cohort = count ทุกระดับที่ ready

### ข้อจำกัด / สิ่งที่ยังตรวจไม่ได้รอบนี้ (แจ้งตรง ๆ)
- **ภาพ PNG ในโฟลเดอร์หลักฐาน (`desktop-1440-blockednew.png`, `-oldonly.png`, `-scopebad.png`, `-normal.png` ฯลฯ) และ PDF prints ยัง "เก่า" — ยังไม่ re-capture ลงดิสก์รอบนี้** (สภาพแวดล้อมนี้บันทึกภาพจาก browser ลงไฟล์หลักฐานไม่ได้). ภาพ blockednew/oldonly/scopebad เดิม **ยังโชว์ตัวเลขชุดที่ขัดกันก่อนแก้** — อย่าใช้ยืนยัน fixture ใหม่. หลักฐานรอบนี้ = ข้อความ render สด (บันทึกในตารางข้างบน) + CSV ที่ regenerate + invariant script. ผู้ตรวจโปรด re-capture เองด้วยขั้นตอนใน review-prompt (เปิด `?scenario=…&open=1` แล้วถ่าย)
- **portal จริงหลัง login (keyboard tab-through, print จริง):** ยังไม่ได้ตรวจ (agent กรอกรหัสผ่านไม่ได้) — ใช้ harness แทน
- **live BE / TEST DB re-sample:** รอบนี้ไม่ได้เรียกใหม่; per-metric readiness/citation เทียบ contract BE ปัจจุบันกับข้อมูลจริงยังไม่ยืนยัน (`live-be-sample-round2.json` เป็นของรอบก่อน)
- **hydration mismatch (dev-only, มีมาก่อนแล้ว):** ปุ่มเลือก scenario ของ harness เตือน hydration เพราะ `initialScenario()` อ่าน `window.location.search` ใน `useState` — เป็น cosmetic เฉพาะหน้า harness ไม่เกี่ยวกับ component รายงาน และไม่ได้เกิดจากการแก้รอบนี้
- **`.claude/launch.json`** ยัง unresolved (frontend:3000 / backend-api:8080 เป็นค่าที่ reconstruct — โปรดตรวจกับของเดิม)

### ภาคผนวกรอบ 6 — LIVE integration acceptance (authenticated portal, 2026-09-16)
รันจริงทั้ง stack: FE `npm run dev` (3000) + BE `go run ./cmd/api` (8080, ต่อ **TEST DB** — host กำหนดใน `.env` ไม่ commit) แล้ว **ผู้ใช้ login เอง** (agent ไม่กรอกรหัส) เปิด `/research-fund-system/admin/scopus-benchmark`. เก็บ response BE จริงไว้ที่ `docs/scopus-benchmark-executive-review-evidence/live-be-sample-round6.json` (แทน `live-be-sample-round2.json`).

ตรวจแล้วบนข้อมูลจริง:
- **default year = 2025** (ปีจบล่าสุดที่ faculty-ready) ถูกต้อง
- **เปลี่ยนปี** 2025→2020 โหลด insights ปีนั้น+ปีก่อน และเลื่อนช่วงแนวโน้มเป็น 2016–2020; **refresh** ยิง comparison+insights ใหม่ = 200 ทุกตัว
- **fixture fidelity ตรงกับ BE จริง field-by-field:** faculty 2025 docs=63, cohort=63 (=count), classified 33 (≤63), doctypes 31+29+3=63; kku 2025 docs=311, cohort=311, `quality.ready=false "113 journals have no CiteScore metadata"`. โครง `readiness.metrics{count,quality,oa,intl,citations}` + quartile `{unclassified_journal,excluded_non_journal,unresolved}` ตรงกับที่ `levelFromCount` สร้าง
- **snapshot mismatch ถูก "เปิดเผย" เสมอ ไม่เงียบ:** ปี 2020 faculty count snapshot=7 แต่ observed_docs=32 → `snapshot_mismatch=true` + FE โชว์ "ข้อมูลชุดนี้ยังไม่ครบเทียบ snapshot" และงด gap; Thailand 2025/2020 count มีแต่ observed=0 → available=false → "ยังไม่มีข้อมูล". นี่คือจุดต่างสำคัญจาก bug blockednew เดิม (cohort>count แบบเงียบ ไม่มี flag)
- **บทเรียนจากข้อมูลจริง:** cohort ผูกกับ **observed_docs** ไม่ใช่ count snapshot; cohort==count เฉพาะระดับที่ ready. ทิศ observed>count (count เก่าต่ำกว่าจริง) เกิดได้จริงและถูก disclose — fixture รอบนี้จำลองทิศ observed<count ส่วนทิศ observed>count ครอบคลุมด้วยหลักฐาน live นี้แล้ว
- **console errors ที่เห็นไม่เกี่ยวฟีเจอร์:** 401 `/api/v1/profile` เป็น poll **ก่อน login** (backend เพิ่งบูต), hydration warning มาจากหน้า `/dev/...` (harness-only, มีมาก่อน) — benchmark endpoints ทั้งหมด 200

ยัง **ไม่ได้** ตรวจ (ตรงไปตรงมา): export → ไฟล์ดาวน์โหลดจริง (ไม่ทริกเกอร์ดาวน์โหลดตามกฎ + CSV เป็น client-side Blob จับเนื้อไฟล์จาก network ไม่ได้ — ยืนยันระดับ data/helper ด้วย gen-script แล้ว, ผู้ใช้คลิกเองยืนยันไฟล์ได้ 1 คลิก); print → PDF จริง (dialog อัตโนมัติไม่ได้); keyboard tab-through เต็มเส้นทาง (year selector เป็น native `<select>` เข้าถึงด้วยคีย์บอร์ดโดยปริยาย); re-capture ภาพ PNG ลงไฟล์หลักฐาน (ยังทำในสภาพแวดล้อมนี้ไม่ได้)

**หลังส่ง reviewer (addendum รอบ 6 ของ reviewer):** reviewer สอบทาน `live-be-sample-round6.json` แล้ว **คงผ่าน** และยอมรับหลักฐาน live ปี 2025 สำหรับ contract/เลข citation; ข้อค้างเหลือ = ดาวน์โหลด CSV ปุ่มจริง + print/PDF จริง + keyboard tab-through. reviewer ชี้จุดถูกต้อง 1 จุดในหลักฐาน (ไม่ใช่ในโค้ด): คำ `_note` เดิมเขียน "never emits cohort>count" ซึ่งขัดกับตัวอย่าง 2020 (count 7 / cohort 32) ในไฟล์เอง. **แก้แล้ว** — เขียน invariant ให้ถูก: cohort ผูกกับ observed_docs, ==count เฉพาะระดับ ready, และ count≠observed ถูก disclose ด้วย snapshot_mismatch เสมอ (cohort>count ทำได้เมื่อ mismatch เปิดเผย); bug เดิม blockednew คือ cohort>count แบบ **เงียบ** บนระดับที่ mark ว่า ready. แก้เฉพาะคำบรรยาย ไม่แตะค่าข้อมูล และขยาย block ปี 2020 เป็น raw response เต็มรูป (field-by-field). ไม่แก้ findings ของ reviewer.

---

> **รอบ 5 (แก้ตาม reviewer findings รอบ 4: R4-1) — 2026-09-15.** ดูตาราง R4-1 ด้านล่างนี้ก่อน แล้วจึงเป็นรอบ 4 (R3-1/R3-2), รอบ 3 (R2-1..R2-4), รอบ 2 (R1–R9) ตามลำดับ. ไฟล์ findings ของ reviewer ทุกฉบับไม่ถูกแก้ไข.

## รอบ 5 — R4-1 → สิ่งที่แก้ → หลักฐาน

อ้างอิง reviewer รอบ 4: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-findings-round4.md` (ไม่แก้ไข)

| finding | สิ่งที่แก้ (โค้ด) | tests / หลักฐาน |
|---|---|---|
| **R4-1 [P2]** bootstrap สับสนระหว่างปีที่มี snapshot กับปี faculty-ready (Math.max ของ available_years.faculty ทั้งที่ปีล่าสุด blocked) | แทน `resolveBootstrapTarget` (Math.max→ปี blocked) ด้วย **`resolveBootstrapFloor(available_years, currentYear)` = ปีจบที่เก่าที่สุดที่มี snapshot** (ใช้บอกแค่ "ต้องโหลดถึงปีไหน" ไม่ใช่ปีที่จะเลือก) `app/lib/scopus_benchmark_report.mjs`; widen effect โหลดลงไปถึง floor เพื่อให้ **year_meta มีสถานะ faculty จริงของทุกปีจบ** แล้ว `selectReportYear` เลือกปีจบล่าสุดที่ faculty=available (ข้ามปีใหม่ที่ blocked) `ScopusBenchmarkDashboard.js`; เคารพ manualYear; floor คงที่จึงไม่ loop | `desktop-1440-blockednew.png` (2025 faculty blocked + 2010 faculty ready นอก window → **default = 2010**, gaps เปิดที่ 2010); FE tests `resolveBootstrapFloor…` (recent-blocked+old-ready→floor 2010), `selectReportYear skips a blocked recent year…`, `selectReportYear falls back (never loops) when every faculty year is blocked` |

### แยก "ปีที่มี snapshot" ออกจาก "ปี faculty-ready" (ตาม R4-1)
- `available_years` (จาก BE) = **snapshot existence** เท่านั้น (รวมปี blocked) → ใช้กำหนด "โหลดถึงปีไหน" (floor)
- `year_meta[year].faculty.status` = **readiness จริง** (available/blocked/missing) → ใช้ "เลือกปีไหน" (selectReportYear)
- ผลลัพธ์: ปีใหม่ที่ snapshot มีแต่ faculty blocked จะไม่ถูกเลือกเป็น default แทนปีเก่าที่ faculty พร้อม

### หลักฐานที่ reviewer รอบ 4 ขอเพิ่ม
- **ปีใหม่ blocked แต่ปีเก่าพร้อม:** `desktop-1440-blockednew.png` + tests ข้างต้น
- **ทุกปี blocked → fallback ไม่ loop:** test `selectReportYear falls back (never loops)…` (เลือกปีจบล่าสุดที่มี KKU snapshot, faculty_not_ready) + floor คงที่ = ไม่ widen ซ้ำ
- **ภาพ = CSV ชุดเดียวกัน (แก้ตามหมายเหตุ reviewer):** `yearly-scopebad.csv` และ `comparison-scopebad.csv` รอบนี้ **export จากปุ่มส่งออกจริงของ scenario=scopebad (reportYear 2025)** — ตัวเลขตรงกับ `desktop-1440-scopebad.png` (คณะ/KKU/ประเทศไทย = 74/304/2940). วิธีสร้าง: เปิด `?scenario=scopebad` แล้วกด "ส่งออกข้อมูล" ทั้งสองรายการ
- **CSV แยก scope ออกจาก data-readiness:** เพิ่มบรรทัด `# scope_consistent: false` + คำเตือน แยกจากคอลัมน์ "พร้อมเทียบ" ที่เป็น data readiness ราย metric

### harness fidelity (ปรับให้หลักฐานตรงจริง)
- แก้ dev harness ให้ระบุ `readiness.metrics` ครบ (เดิมใส่แต่ comparison_ready) และตั้งชุด normal ให้ classified/complete → ภาพ normal แสดง gap ที่คำนวณได้จริง (T1–Q2/intl/OA) ส่วน mismatch แสดงการงดราย metric — ให้ภาพสะท้อนกติกา per-metric ที่ BE ใช้จริง

### ข้อจำกัดที่ยังเหลือ (แจ้งตรง ๆ)
- ยังไม่ได้ตรวจหน้า production หลัง login / keyboard tab-through บน portal จริง (agent กรอกรหัสผ่านไม่ได้) — ใช้ harness (component จริง + fixture) + live service call รอบก่อน
- รอบนี้ไม่ได้ re-verify BE ด้วย live TEST DB call ใหม่ (ใช้ `live-be-sample-round2.json` + unit tests ราย metric/bootstrap)
- ไม่มี component interaction test (repo ใช้ node --test; pure helpers ครอบ bootstrap/selection/CSV/readiness; effect/late-response พึ่ง request-id guard ในโค้ด)
- ยังไม่มีภาพแยก faculty≠COMP / university≠COMP (code path เดียวกัน + `consistent` จาก BE + tests)
- `.claude/launch.json` **ยัง unresolved** (เขียนทับโดยไม่มี backup — reconstruct frontend/backend-api, โปรดตรวจกับของเดิม)

---

> **รอบ 4 (แก้ตาม reviewer findings รอบ 3: R3-1, R3-2) — 2026-09-15.** ดูตาราง R3-1/R3-2 ด้านล่างนี้ก่อน แล้วจึงเป็นรอบ 3 (R2-1..R2-4), รอบ 2 (R1–R9) และบริบทเดิมตามลำดับ. เนื้อหารอบก่อน ๆ เก็บไว้เป็นประวัติ ส่วนที่ถูกแทนที่ระบุไว้ในหมายเหตุ superseded.

## รอบ 4 — ตาราง R3-1 / R3-2 → สิ่งที่แก้ → หลักฐาน

อ้างอิง reviewer รอบ 3: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-findings-round3.md` (ไฟล์ของ reviewer — ไม่แก้ไข)

| finding | สิ่งที่แก้ (โค้ด) | tests / หลักฐาน |
|---|---|---|
| **R3-1 [P1]** scope guard ยังไม่คลุม KPI share, trend share, CSV | โฮสต์ `scopeConsistent` ไว้ต้น component แล้วใช้ทุก surface: **KPI สัดส่วนคณะ/KKU** → "ยังเทียบไม่ได้" + subline "ขอบเขตไม่ตรง — งดสัดส่วนคณะ/KKU" (`ScopusBenchmarkDashboard.js`); **trendPoints.share=null** เมื่อไม่ตรง และ **TrendCharts** แสดงกล่องอธิบายแทนกราฟสัดส่วน (คงกราฟจำนวนคณะที่สังเกตได้); **CSV** ทั้งสองไฟล์ผ่าน `scopeHeaderLines(scope)` = บันทึกสาขาแต่ละระดับ + คำเตือน และ **yearly `faculty_kku_pct` เว้นว่าง**เมื่อไม่ตรง (`scopus_benchmark_report.mjs`) | `desktop-1440-scopebad.png` (share KPI + กราฟสัดส่วน + gap ถูกงดพร้อมกัน, กราฟจำนวนคณะยังอยู่); CSV จริง `yearly-scopebad.csv`, `comparison-scopebad.csv` (มีสาขาแต่ละระดับ + คำเตือน, faculty_kku_pct ว่าง); `print-scopebad.pdf`; FE test "CSV withholds cross-scope comparison…" |
| **R3-2 [P2]** default year ยังเลือกปีปัจจุบันก่อนปีจบที่อยู่นอก window | เพิ่ม pure `resolveBootstrapTarget(available_years, currentYear)` = ปีจบล่าสุดที่ faculty-ready ก่อน → ปีจบล่าสุดทุกระดับ → null; widen effect ใช้ target นี้ (ไม่ผูกกับ reportYear) เพื่อโหลด window ให้ครอบ candidate ก่อน แล้ว `selectReportYear` จึงเลือกปีจบที่ถูกต้อง; **เคารพปีที่ผู้ใช้เลือกเอง** (manualYear ไม่ถูก override) | FE test `resolveBootstrapTarget…` 5 เคส (old-only→2010, current+old-ended→2010, faculty-old+KKU-recent→2010, no-faculty-ended→ปีจบล่าสุด, only-current→null); `default-year-cases.json`; `desktop-1440-oldonly.png` |

### หลักฐานที่ reviewer รอบ 3 ขอเพิ่มเจาะจง
- **ภาพ scope mismatch สองแบบ:** `desktop-1440-scopebad.png` (country=MEDI). เส้นทางโค้ดเดียวกันจับ faculty/university ต่างสาขาด้วย เพราะ `consistent` มาจาก BE ที่ตรวจทั้งสาม subject_area (คุมด้วย `resolveBootstrapTarget` ไม่เกี่ยว) — ครอบด้วย test `CSV withholds…` (country=MEDI) และ BE `scopeConsistent = subject==COMP && faculty==COMP && country==COMP`. (ยังไม่มีภาพแยกสำหรับ faculty≠COMP; กลไกเดียวกันผ่าน test)
- **CSV ตัวอย่างที่มี scope mismatch:** `yearly-scopebad.csv`, `comparison-scopebad.csv`
- **ผล default-year สามกรณี:** `default-year-cases.json` (old-only, current+old-ended, faculty-old+KKU-recent ทั้งหมด → 2010; only-current → null)

### สถานะ findings รอบ 2/3 หลังรอบนี้
R2-1/R2-2 ปิด (per-metric readiness + observedRate). R2-3/R3-1 ปิด (scope guard ครอบทุก surface + CSV). R2-4/R3-2 ปิด (bootstrap เลือก default ตาม preference จาก discovery ทุกปี).

### ข้อจำกัดที่ยังเหลือ (แจ้งตรง ๆ)
- ยังไม่มีภาพแยกสำหรับ faculty≠COMP / university≠COMP (ใช้ code path + test ยืนยันแทน); reviewer อาจขอภาพเพิ่มได้
- ยังไม่ได้ตรวจหน้า production หลัง login / keyboard tab-through บน portal จริง (agent กรอกรหัสผ่านไม่ได้)
- BE readiness ราย metric รอบนี้ยังไม่ได้ re-verify ด้วย live TEST DB call ใหม่ (ใช้ `live-be-sample-round2.json` จากรอบก่อน + unit tests ราย metric); ถ้าต้องการ live sample รอบใหม่แจ้งได้
- ไม่มี component interaction test (repo ใช้ node --test; pure helpers ครอบ logic — bootstrap/CSV/readiness — แต่ effect/late-response ยังพึ่ง request-id guard ในโค้ด)
- `.claude/launch.json` **ยัง unresolved** (เขียนทับโดยไม่มี backup — reconstruct frontend/backend-api, โปรดตรวจกับของเดิม)

---

> **รอบ 3 (แก้ตาม reviewer findings รอบ 2: R2-1 ถึง R2-4) — 2026-09-14.** ดูตาราง R2-1..R2-4 ด้านล่างนี้ก่อน แล้วจึงเป็นตาราง R1–R9 (รอบ 2) และบริบทเดิม.

> **หลักฐานที่ถูกแทนที่ (archived/superseded):** `live-be-sample.json` (รอบ 1) เกิดก่อนแก้ R1 จึงแสดง faculty ไม่มีเอกสาร — **อย่าใช้ยืนยันข้อมูลจริง**; ใช้ `live-be-sample-round2.json` แทน. ข้อความรอบ 1 ที่ว่า "faculty ไม่มีเอกสาร" เป็นผลของ bug R1 ที่แก้แล้ว. `.claude/launch.json` (local, untracked) ที่เผลอเขียนทับ **ยังกู้ค่าเดิมไม่ได้ (unresolved)** — reconstruct เป็น frontend(3000)/backend-api(8080) โปรดตรวจกับของเดิม.

## รอบ 3 — ตาราง R2-1 ถึง R2-4 → สิ่งที่แก้ → หลักฐาน

อ้างอิง reviewer รอบ 2: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-findings-round2.md`

| finding | สิ่งที่แก้ | หลักฐานใหม่ |
|---|---|---|
| **R2-1 [P1]** readiness ไม่แยกตาม metric + KPI ข้าม guard | BE: readiness เพิ่ม `metrics{count,quality,intl,oa,citations}.ready+reasons` — quality ต้อง unclassified_journal/unresolved=0, oa/intl ต้อง unknown=0, และ **expectedDocs=nil ⇒ completeness ยังพิสูจน์ไม่ได้ = not ready**. FE: gap แต่ละแถวใช้ readiness ราย metric, KPI ปีก่อน quality/intl แสดงเฉพาะเมื่อ metric-ready ทั้งสองปี (ไม่งั้นขึ้น "ยังเทียบปีก่อน/ระดับไม่ได้"), KPI count มีโน้ต mismatch, citation section มีโน้ต "ชุดเอกสารยังไม่ครบการ harvest", findings quality gap ใช้ `canCompareMetric(...,'quality')` | `desktop-1440-mismatch.png` (KPI มีโน้ต, gap รายตัว); BE tests `TestComputeLevelReadinessPerMetricMetadata`, `TestComputeLevelReadinessNilSnapshotBlocksCompleteness`; FE test `canCompareMetric…` |
| **R2-2 [P1]** CSV OA/intl ใช้สูตรเก่า ต่างจากหน้าจอ | สร้าง `observedRate(level,which)` = positive/known เป็น **แหล่งเดียว** ที่ KPI/table/CSV ใช้ร่วมกัน; comparison CSV เปลี่ยนเป็น positive/known + คอลัมน์ known/unknown + ready ต่อ metric; แก้ caption ตาราง/CSV ให้ตรง (ตัวหาร = known ไม่ใช่ docs) | FE test `observedRate…` และ `comparison CSV OA/intl match the display model…` (docs=100, OA 20/40→50.0 ทั้งหน้าจอและ CSV); `print-normal.pdf` |
| **R2-3 [P2]** scope guard เป็นแค่ banner | BE `report_scope` ตรวจทั้งสาม scope (`faculty/university/country_subject_area` + `consistent`); FE เมื่อ `consistent=false` **หยุดจริง**: findings เหลือข้อจำกัด, ComparisonTable ทุก gap+share = "ยังเทียบไม่ได้", subtitle เปลี่ยน, banner ระบุสาขาแต่ละระดับ | `desktop-1440-scopebad.png` (country=MEDI → งดเทียบทั้งหมด); `print-scopebad.pdf`; controller diff `scopeConsistent` |
| **R2-4 [P2]** มีเฉพาะปีเก่า → EmptyState เลือกปีไม่ได้ | FE bootstrap: ใช้ available_years หา candidate (ปีจบล่าสุดที่มี) แล้ว **ขยาย window ไปโหลดช่วงนั้นก่อน**; ระหว่างรอโหลดแสดง loading (ไม่ใช่ EmptyState) เมื่อ available_years ยังมีปี; EmptyState เฉพาะเมื่อไม่มีปีจริง ๆ | `desktop-1440-oldonly.png` (มีเฉพาะ 2010 = ปีนี้−16 → เลือก 2010 ได้, กราฟเปิดได้, ไม่ตัน) |

### ตรวจรับที่เพิ่ม/ยืนยัน
- metadata ไม่ครบ (unclassified journal / OA unknown / nil snapshot) → **ไม่เปิด** gap/finding ของ metric นั้น แต่ metric ที่พร้อมยังแสดง (R2-1) — เห็นใน mismatch shot ที่ intl/oa/quality gap = "ยังเทียบไม่ได้" ขณะ count share ยังแสดง
- CSV == หน้าจอ เมื่อ unknown>0 (R2-2) — มี regression test
- university=COMP/country=MEDI ก็จับได้ (R2-3) — ไม่ใช่ตรวจแค่ university
- old-only / bootstrap (R2-4) — harness `?scenario=oldonly` และ comparison ของ harness เคารพ requested range จริง

### สถานะ R1–R9 (รอบ 2) — คงเดิม/ปรับ
R1,R2,R4,R9 ปิดแล้ว (ดูตารางรอบ 2). R3 ขยายเป็น per-metric ในรอบนี้ (R2-1). R5/R6 ค่า+bucket เพิ่มแล้ว และตอนนี้ readiness+CSV สอดคล้อง (R2-1/R2-2). R7 bootstrap ครบใน R2-4. R8 comparison CSV rates แก้แล้ว (R2-2).

### limitation ที่เหลือ (แจ้งตรง ๆ)
- intl unknown = "เอกสารไม่มีข้อมูลประเทศในสังกัดใด ๆ"; อัตราที่แสดงเป็น positive/known ของ subset ที่ทราบ (ไม่ได้อ้างเป็น lower-bound ของทุกเอกสารแล้ว)
- ยังไม่ได้ตรวจหน้า production หลัง login / keyboard tab-through บน portal จริง (agent กรอกรหัสผ่านไม่ได้) — ใช้ harness + live service call
- ไม่มี component interaction test (repo ใช้ node --test ล้วน ไม่เพิ่ม jsdom/RTL ใน scope นี้); atomic year/late-response มี request-id guard ในโค้ด
- `.claude/launch.json` unresolved (ข้างต้น)

---

> **รอบ 2 (แก้ตาม reviewer findings R1–R9) — 2026-09-14.** ดูตาราง R1–R9 → สิ่งที่แก้ → หลักฐาน ด้านล่างก่อน. ส่วนที่เหลือของเอกสารเป็นบริบทรอบแรกที่ปรับให้ตรงสถานะปัจจุบันแล้ว.

## รอบ 2 — ตาราง R1–R9 → สิ่งที่แก้ → หลักฐานใหม่

อ้างอิง reviewer findings: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-findings.md`

| finding | สิ่งที่แก้ | หลักฐานใหม่ |
|---|---|---|
| **R1 [P1]** SQL args สลับลำดับ ทำให้ faculty insights/citation หาย | `insightArgs` ส่ง `[scopeID, year, AFID1, AFID2]` ให้ตรงลำดับ placeholder จริง (WHERE ก่อน, EXISTS AF-ID ท้าย) `services/scopus_benchmark_insights.go` | **live TEST DB**: `live-be-sample-round2.json` — faculty `available:true`, docs 52/63, citations.total 540/351 (เดิม unavailable ทั้งหมด). Test ใหม่ `TestBenchmarkInsightLevelBindsFacultyArgsInQueryOrder` (scripted DB จับลำดับ args ทั้ง aggregate+citation) และแก้ `TestInsightArgsOrderMatchesQueryPlaceholders` |
| **R2 [P1]** print stylesheet ทำหน้าอื่นว่างตอนพิมพ์ | ทุกกฎ `@media print` scope ด้วย `body:has(#scopus-report-root)`; ย้าย `@page A4` มา inject ตอน runtime เฉพาะตอน report mount (`app/globals.css`, `ScopusBenchmarkDashboard.js`) | `print-regression-other-page.pdf` — หน้า **ไม่มี report root** พิมพ์ออกมามีเนื้อหาครบ (ไม่ว่าง); `print-normal.pdf` ยังพิมพ์รายงานได้ปกติ |
| **R3 [P1]** readiness ไม่ตรวจ mismatch และ FE ไม่ใช้ guard | BE: readiness เพิ่ม `expected_docs/observed_docs/snapshot_mismatch` + เหตุผล (`computeLevelReadiness`); FE: ComparisonTable gap = "ยังเทียบไม่ได้" + amber caveat เมื่อไม่ ready, findings/gap เคารพ `comparison_ready` | `desktop-1440-mismatch.png` (gap "ยังเทียบไม่ได้" + caveat "harvest incomplete…", finding gap หาย); tests `TestComputeLevelReadinessSnapshotMismatch`, `TestComputeLevelReadinessPerLevel`; live sample มีเคส `snapshot_mismatch:true` จริง |
| **R4 [P1]** ตาราง/CSV แสดง missing snapshot เป็น 0 | `normalizeReportRow(row, meta)` แปลง level ที่ status≠available เป็น null ก่อนทุก surface; comparison ใช้ normalized row; CSV blank + status | tests `normalizeReportRow…`, `buildYearlyCsv writes blanks…`, `buildComparisonCsv normalizes missing counts…` (payload raw-0 + missing แบบจริง) |
| **R5 [P2]** OA/intl unknown กลายเป็น negative | BE เพิ่ม `oa{known,positive,unknown}` (openaccess_flag NULL=unknown) และ `intl{known,positive,unknown}` (doc ที่ไม่มีข้อมูลประเทศ=unknown); FE แสดง observed rate = positive/known + "ไม่ทราบ K"; legacy `oa_pct/intl_pct` คงไว้ | `desktop-1440-mismatch.png` KPI intl "33/66 ที่ทราบ · ไม่ทราบ 6"; ตาราง OA/intl "(observed)"; live sample มี `oa.known/positive`; test `TestBenchmarkInsightQueryTiersJournalsOnlyAndReportsCoverage` |
| **R6 [P2]** quality ไม่แยก missing-metadata จาก non-journal | BE tier เฉพาะ `aggregation_type='journal'`; เพิ่ม `unclassified_journal / excluded_non_journal / unresolved`; FE details แสดงแยก "วารสารยังไม่มีค่า CiteScore / ไม่ใช่วารสาร / ระบุประเภทไม่ได้" | `print-appendix.pdf` (รายละเอียดเปิด); live sample มี `excluded_non_journal`; test ตรวจ tier journal-only + coverage columns |
| **R7 [P2]** ปีเก่าเลือกไม่ได้ / กราฟ 10 ปีมี gap ปลอม | BE `available_years` = **ทุกปีที่มี snapshot** ต่อระดับ (existence ไม่ผูก readiness); FE yearOptions จาก available_years และโหลด window กว้างขึ้นเมื่อเลือกปีเก่า (`windowFrom`) | controller diff (`allSnapshotYears`); orchestrator effect widen window; live sample `years_with_documents` 2017–2026 |
| **R8 [P2]** CSV ไม่ตรงช่วงกราฟ/ขาดบริบท | yearly CSV = เฉพาะช่วง 5/10 ปีบนหน้า + per-row snapshot date/status; comparison CSV เพิ่ม status/comparison_ready/denominator/coverage/freshness | tests `buildYearlyCsv`/`buildComparisonCsv`; orchestrator slice ตาม trendRange |
| **R9 [P2]** ตัวอักษรกราฟถูกย่อจนอ่านไม่ได้บนมือถือ | วาด SVG ตาม container width จริง (ResizeObserver 1:1) font ≥12px, ticks ปรับตามความกว้าง (`TrendCharts.js`) | `mobile-390-normal.png`, `mobile-320-normal.png` — ตัวเลข/ปี/แกนอ่านได้ |

### remaining acceptance ที่แก้เพิ่ม
- **Refresh ใช้งานได้จริง**: ปุ่ม “รีเฟรช” โหลด comparison+insights ใหม่ (เห็นใน screenshots); print/export ถูก disable ระหว่างโหลด; insights error banner **พิมพ์ออก** (ไม่ซ่อน) เพื่อแจ้ง failure ตาม §7
- **scope mismatch guard (§4)**: ถ้า `report_scope.subject_area` ≠ COMP แสดง amber banner และงดข้อสรุป
- **is_faculty**: ไม่ใช้เป็นนิยาม faculty แล้ว (verified cohort)

### ยังคงเป็น limitation (แจ้งตรง ๆ)
- **intl unknown** นิยามว่า “ไม่มีข้อมูลประเทศในสังกัดใด ๆ” = unknown; ถ้ามีประเทศแต่ไม่มีต่างชาติถือเป็น domestic (observed lower-bound) — ระบุ label observed ชัดเจน ไม่สร้าง completeness. OA unknown แยกได้จริง (nullable) และใน TEST DB ปัจจุบัน unknown=0
- **authenticated production-route UI**: ยังไม่ได้ (agent กรอกรหัสผ่านไม่ได้) — ใช้ fixture-through-real-component + live service call; keyboard tab-through ยังไม่เดินจริงบน portal
- **interaction tests (atomic year/late responses)**: มี request-id guard ในโค้ด แต่ repo ใช้ `node --test` ล้วน ไม่มี jsdom/RTL จึงยังไม่มี component interaction test (ไม่เพิ่ม dependency ใน scope นี้)
- `.claude/launch.json` (local, untracked): reconstruct เป็น frontend(3000)/backend-api(8080, `go run .` เดา) — โปรดตรวจกับของเดิม

---

วันที่ส่ง review: 2026-09-14 · ผู้ implement: agent · สำหรับผู้วางแผน review เทียบ handoff ล่าสุด
อ้างอิงข้อกำหนด: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-handoff.md`
contract ที่ตกลง: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-contract.md`

> สรุป: implement ครบตามโครงรายงาน §5 A–G + E2 (citation) และ BE §9 A/B/D (verified faculty cohort, citations, readiness, comparison metadata, scope resolution) แบบ additive. Build/tests ผ่าน. UI ตรวจด้วย **fixture** ผ่าน component จริง (screenshots + print PDF). ข้อมูลจริงตรวจผ่าน **การเรียก service ตรงกับ TEST DB** (ไม่ผ่าน auth). **ยังไม่ merge/deploy/commit** — งานทั้งหมดอยู่ใน working tree.

---

## 1. สถานะและขอบเขต

**เสร็จ (implementation complete):**
- FE: ออกแบบหน้า `/admin/scopus-benchmark` แท็บ “ผลเปรียบเทียบ” ใหม่ทั้งหมดเป็น report surface — Header ปีเดียว, KPI strip (ไม่ใช่การ์ด), ประเด็นสำคัญ deterministic, กราฟจำนวน (column) + สัดส่วน (line) แยกกัน (SVG, ไม่ dual axis, ไม่ smooth), ตาราง benchmark เห็นตัวชี้วัดพร้อมกัน, ส่วน citation E2 เปิดแสดงเสมอ, รายละเอียดพับได้, source notes, พิมพ์ A4, export CSV 2 แบบ, responsive + keyboard + a11y.
- BE: insights ใช้ **verified faculty EID cohort** (แทน `is_faculty`), เพิ่ม `citations` + `readiness` ต่อระดับ, resolve scope จาก level (ไม่ hardcode 1/2); comparison เพิ่ม `year_meta` + `available_years` + `report_scope` (คง field เดิมทั้งหมด).
- Tests: BE unit tests ใหม่ (citation rules, readiness, query fragments, args order) + FE unit tests ใหม่ (selection, findings, formulas, CSV). build ทั้งสองฝั่งผ่าน.

**ตรวจแล้ว (verified):**
- UI/print: ผ่าน **fixture** บน component จริง (ดู §5) — desktop/tablet/mobile/print/สถานะ missing/YTD/error.
- Data: ผ่าน **live TEST DB** ด้วยการเรียก service จริง (ดู §6, `live-be-sample.json`) — citations SUM ตรง raw sum, scope resolve ถูก, coverage/among-levels ถูก.

**ยังไม่ได้ทำ / deviations (ต้องให้ผู้วางแผนชั่งน้ำหนัก — รายละเอียด §8):**
1. **OA/intl known/unknown/positive counts (§9 B)** — ยังคงเป็น observed rate (ตัวหาร = เอกสารทั้งหมดในชุด) ไม่ได้เพิ่ม field แยก known/unknown. `openaccess_flag` เป็น nullable จึงแยก unknown ของ OA ได้ในอนาคต; intl ไม่มี null semantics ที่ชัด. **นี่คือ deviation หลัก.**
2. **แยก unclassified journal vs งานนอกการจัดกลุ่ม (§5 F/§9 B)** — BE ส่ง `unclassified` รวม (docs − classified) UI จึงแสดงรวมเป็นบรรทัดเดียว “ยังจัดกลุ่มไม่ได้/งานนอกการจัดกลุ่ม” ยังไม่แยก non-journal/unresolved.
3. **Screenshot หน้า production จริง (มีข้อมูลจริง หลัง login)** — ทำไม่ได้เพราะกฎห้าม agent กรอกรหัสผ่านเพื่อ authenticate; จึงใช้ fixture-through-real-component + live service call แทน และแยกหลักฐานให้ชัด.
4. **FE trend อ่าน comparison แบบ `years_back=15`** (ครั้งเดียว) แทน “10 ปี” เพื่อรองรับกราฟ 10 ปีที่จบก่อนปีปัจจุบัน + การเลือกปี ใน GET เดียว.
5. **ไม่ได้เพิ่ม controller test ของ comparison `year_meta`** (logic เป็น inline ตรงไปตรงมา; ตรวจด้วยการรันจริง).

**ไม่แตะ (ตามข้อห้าม):** ingest/harvest, Scopus Dashboard/Research Search tables, migrations, auto harvest/refresh, top-journals endpoint (คงเดิม, out of report scope), route/nav/auth. ไม่ deploy/migrate/merge.

---

## 2. จุดตรวจโค้ด

| | FE | BE |
|---|---|---|
| repo | `G:/works-fund-project/frontend_project_fund` | `G:/works-fund-project/fund-management-api` |
| branch | `feature/scopus-benchmark-dashboard` | `feature/scopus-benchmark-insights` |
| base commit (ก่อนเริ่ม) | `624842778e772632ab0967fd04b2e0cca5d30af7` | `b09afeddc34c965c9599edf45566d8237357fbd6` |
| HEAD ที่ส่ง review | **เท่ากับ base** (ยังไม่ commit) | **เท่ากับ base** (ยังไม่ commit) |

**Uncommitted:** งานทั้งหมดอยู่ใน working tree ยังไม่ commit (ตาม handoff: ให้ผู้ใช้ตัดสิน merge/deploy). ไม่มีการ commit ย้อนหลังกลบสถานะ.

**FE tracked changes:** `git -C G:/works-fund-project/frontend_project_fund diff`
- `app/(portal)/research-fund-system/admin/components/research/ScopusBenchmarkDashboard.js` — orchestrator ใหม่ (fetch comparison+insights แยกจาก setup, reportYear atomic, KPI/findings/CSV/print)
- `app/(portal)/research-fund-system/admin/components/research/AdminScopusBenchmark.js` — เรียก report แบบ self-contained (แยก fetch context จาก setup)
- `app/globals.css` — print stylesheet (`@media print`, พิมพ์เฉพาะ `#scopus-report-root`, A4, ตารางพอดีหน้า)

**FE new files (untracked):**
- `app/lib/scopus_benchmark_report.mjs` — pure helpers (selection, deltas, findings, CSV, formatting)
- `app/lib/__tests__/scopus_benchmark_report.test.mjs` — 15 tests
- `app/(portal)/research-fund-system/admin/components/research/report/` — `ReportHeader.js`, `KpiStrip.js`, `KeyFindings.js`, `TrendCharts.js`, `ComparisonTable.js`, `CitationsSection.js`, `QualityTypeDetails.js`, `SourceNotes.js`
- `app/dev/scopus-benchmark-report/page.js` — **dev-only harness** (fixture, 404 ใน production; ลบก่อน deploy ได้)
- `docs/scopus-benchmark-executive-contract.md` — response contract
- `docs/scopus-benchmark-executive-review*.md`, `docs/scopus-benchmark-executive-review-evidence/` — review package

**BE tracked changes:** `git -C G:/works-fund-project/fund-management-api diff`
- `services/scopus_benchmark_insights.go` — verified faculty cohort (`benchmarkFacultyExistsClause`), `benchmarkCitationQuery`, `computeCitationSummary`, `computeLevelReadiness`, `resolveInsightScopes`, structs `BenchmarkCitationSummary`/`BenchmarkLevelReadiness`
- `controllers/admin_scopus_benchmark_controller.go` — comparison `year_meta`/`available_years`/`report_scope` + snapshot `captured_at`
- `services/scopus_benchmark_insights_test.go` — เขียน tests ใหม่ให้ตรง contract

> หมายเหตุ line endings: repo เป็น CRLF ทั้ง repo `gofmt -l` จึง flag ~197 ไฟล์ทั้ง repo (artifact ของ CRLF ไม่ใช่ของงานนี้). ไฟล์งานนี้ทำ `gofmt -w` แล้ว (โครงสร้าง Go ถูกต้อง) และ `git diff --check` สะอาด.

---

## 3. ตาราง acceptance (เทียบ handoff)

| handoff | สถานะ | หลักฐาน |
|---|---|---|
| §4 report year เดียว, default = ปีจบล่าสุดที่ faculty พร้อม / fallback / YTD cumulative / empty | ✅ | `selectReportYear` + tests; screenshots normal(2025) & ytd(2026) |
| §4 ค่า 0 ที่มี snapshot = usable, ไม่ใช้ `>0` | ✅ | `isUsable(0)===true` test; usability อิง `year_meta.status` |
| §4 atomic year change (ไม่โชว์ค่าข้ามปี, guard late responses) | ✅ | orchestrator clears insights + request-id guard |
| §5 A Header ปีเดียว + print/export + metadata + แหล่งข้อมูล | ✅ | `ReportHeader.js`; desktop screenshot |
| §5 B KPI strip 4 คอลัมน์ ไม่มีการ์ด/ไอคอน | ✅ | `KpiStrip.js`; screenshots |
| §5 C ประเด็นสำคัญ ≤2 bullets deterministic ไม่ชมอัตโนมัติ | ✅ | `buildFindings` + tests |
| §5 D กราฟจำนวน (column) + สัดส่วน (line) แยก, ไม่ dual axis/smooth, current=hatch “สะสม”, missing=gap, details ตัวเลขรายปี | ✅ | `TrendCharts.js`; ytd screenshot (hatch), print PDF |
| §5 E ตารางเปรียบเทียบ เห็น metrics พร้อมกัน, faculty tint, numerator/denominator, จุดเปอร์เซ็นต์, ไม่ auto-green | ✅ | `ComparisonTable.js`; print PDF p.2 |
| §5 **E2 citation เปิดแสดงเสมอ** (รวม/เฉลี่ย/known-cohort, caption, ไม่ YoY, ไม่รวมยอด) | ✅ | `CitationsSection.js`; print PDF p.3; live sample |
| §5 F รายละเอียด (quartile stacked + doctype table) พับได้ | ✅ (ดู §8.2) | `QualityTypeDetails.js`; print-appendix.pdf |
| §5 G methodology + footer (สร้างเมื่อ vs อัปเดตเมื่อ) | ✅ | `SourceNotes.js`; print PDF p.3 |
| §6 visual system (สี/typography/ห้าม hero/gauge/all-green) | ✅ | screenshots |
| §7 responsive (1440/1280/768/390/320) ไม่ล้นหน้า, ตารางเลื่อนเฉพาะส่วน | ✅ | screenshots desktop/tablet/mobile |
| §7 print A4 เฉพาะ report, body ≥10.5pt, chart ≥9pt, ไม่ clip | ✅ | print-normal.pdf (3 หน้า) |
| §7 export CSV 2 แบบ (BOM, escape, missing=blank+status, denominator) | ✅ | `buildYearlyCsv`/`buildComparisonCsv` + tests |
| §8 สูตร growth/share/high-tier/citation + กฎข้อความ | ✅ | report.mjs + tests |
| §9 A comparison additive metadata + scope resolve | ✅ | controller diff; live sample (scope ids 3/1/2) |
| §9 B verified faculty cohort = official selector | ✅ (ดู §8.6) | `benchmarkFacultyExistsClause`; query-fragment test; live sample |
| §9 B per-level readiness (ไม่ boolean เดียว) | ✅ | `computeLevelReadiness` + tests; live sample |
| §9 B OA/intl known/unknown/positive counts | ✅ (รอบ 2, R5) | `oa/intl{known,positive,unknown}`; intl unknown = ไม่มีข้อมูลประเทศ (observed lower-bound) |
| §9 B quartile แยก classified/unclassified-eligible/excluded/unresolved | ✅ (รอบ 2, R6) | tier journal-only + `unclassified_journal/excluded_non_journal/unresolved` |
| §9 **D citations additive** (SUM distinct cohort, zero vs null, coverage, denominator policy, timestamps=null) | ✅ | `computeCitationSummary` + tests; live crosscheck (119==119) |
| §9 D tests (SUM≠avg×docs, zero/null, partial, duplicate-join, distinct cohort, pub-year, missing timestamp, ประเทศไม่มีเอกสาร, ไม่รวม grand total) | ✅ | insights_test.go + report tests |
| §11 ไม่ deploy/merge/migrate/auto-harvest | ✅ | uncommitted; ไม่แตะ ingest |

---

## 4. Tests / build (รันจริง)

BE — cwd `G:/works-fund-project/fund-management-api`, 2026-09-14:
- `go build ./...` → exit 0
- `go test ./services` → `ok  fund-management-api/services` (ครอบคลุม tests ใหม่ทั้งหมด)
- `go vet ./services ./controllers` → มี warning เดิม `thaijo_ingest_service.go:125 self-assignment` (pre-existing, นอกงานนี้)
- `git diff --check` → สะอาด
- ⚠️ `go test ./controllers` **fail ที่ base เดิมอยู่แล้ว** (`sql: Register called twice` ใน `sso_auth_test.go` — ยืนยันด้วยการ stash งานนี้แล้วรันที่ base ก็ fail เหมือนกัน) ไม่เกี่ยวกับงานนี้ (งานนี้ไม่มี controller test)

FE — cwd `G:/works-fund-project/frontend_project_fund`, package manager = npm (package-lock.json):
- `node --test` → tests 43 / pass 43 / fail 0
- `npm run build` → Compiled successfully (รวม route dev harness)
- `git diff --check` → มีเพียง warning eol (LF→CRLF) ไม่ใช่ whitespace error

---

## 5. หลักฐาน UX/UI (fixture ผ่าน component จริง)

ทั้งหมดอยู่ที่ `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-evidence/`
สร้างจากหน้า harness `/dev/scopus-benchmark-report` ซึ่ง render **component จริง** ด้วย **fixture api** (ตัวเลขสมมติ มีแบนเนอร์กำกับ) — ไม่ใช่ภาพ mockup แยก. Data จริงดู §6.

| ไฟล์ | viewport / สถานะ | ชนิดข้อมูล |
|---|---|---|
| `desktop-1440-normal.png` | 1440 ปกติ (ปีจบ 2025) | fixture |
| `desktop-1280-normal.png` | 1280 ปกติ | fixture |
| `tablet-768-normal.png` | 768 | fixture |
| `mobile-390-normal.png` | 390 (KPI 2×2, กราฟเรียง, ตารางเลื่อน) | fixture |
| `mobile-320-normal.png` | 320 (ไม่ล้นหน้า) | fixture |
| `desktop-1440-ytd.png` | ปีปัจจุบันสะสม 2026 (hatch “สะสม”, ไม่มี YoY) | fixture |
| `desktop-1440-partial.png` | ประเทศไทยไม่มีข้อมูล (“ยังไม่มีข้อมูล”) | fixture |
| `desktop-1440-error.png` | insights error (banner + report ยังแสดง) | fixture |
| `print-normal.pdf` | พิมพ์ A4 (3 หน้า, report เท่านั้น) | fixture |
| `print-appendix.pdf` | พิมพ์เมื่อเปิด details (appendix ขึ้นหน้าใหม่) | fixture |
| `print-partial.pdf` | พิมพ์กรณีขาดประเทศไทย | fixture |

หมายเหตุ 1440×900/1280×800: ภาพจับด้วยความสูงยาวเพื่อเห็นทั้งรายงานในภาพเดียว (กว้างตรงตาม viewport ที่ระบุ).

---

## 6. หลักฐานข้อมูล (live TEST DB)

ไฟล์: `G:/works-fund-project/frontend_project_fund/docs/scopus-benchmark-executive-review-evidence/live-be-sample.json`
ที่มา: รันเครื่องมือชั่วคราวเรียก service จริงกับ DB ที่ตั้งใน `.env` (`DB_DATABASE=drnadech_fund_cpkku_intern` = TEST/intern DB) — read-only, ไม่มี PII/credential, ไม่เรียก Scopus, ไม่เขียน DB. เครื่องมือถูกลบหลังเก็บผลแล้ว.

ยืนยันจากข้อมูลจริง:
- **Scope resolve จาก level ไม่ hardcode**: `faculty_scope_id=3, university_scope_id=1, country_scope_id=2` (โค้ด query by level).
- **Citation SUM = raw sum**: KKU ปี 2026 `citations.total=119` เท่ากับ `SELECT SUM(citedby_count)` ดิบ = 119 (พิสูจน์ว่าไม่ใช่ rounded average × docs). known_docs=cohort_docs=221 → coverage `complete`.
- **zero/null & coverage**: faculty ปี 2025 ไม่มีเอกสาร → `available:false`, citations `total:null, average:null, coverage_status:"none"`, readiness reasons=[“no faculty documents for this year”].
- **timestamps**: `updated_at/update_range=null, freshness_status:"unknown"` ทุกระดับ (ไม่แทนวัน refresh citation ด้วย row-updated).
- **faculty metric 10y**: ready=true, faculty_with_scopus_id=41, employment_date_missing=40 (ใช้ AF-ID fallback), benchmark_years_missing=[].
- ปีที่มีเอกสาร: 2017–2026.

สูตร/ตัวหารสำคัญ: citation average หารด้วย **known citation docs** เท่านั้น (`denominator_policy: known_citation_docs`); high-tier = (T1+Q1+Q2)/classified; share = faculty/KKU (ตัวหาร 0 → null). ทั้งสามระดับ cohort ทับซ้อน ห้ามรวมยอด (UI/CSV บังคับ caption).

---

## 7. วิธีเปิดตรวจซ้ำ

**สถานะ server ปัจจุบัน:** ไม่มี server ที่ agent เปิดค้างไว้ (ปิด dev preview บน 3137/3101 แล้ว). ผู้ใช้อาจมี dev server ของตนบน 3000/8080.

**ดู UI (ไม่ต้อง login, ไม่ต้อง DB):**
```
cd G:/works-fund-project/frontend_project_fund
npm run dev        # http://localhost:3000
```
เปิด `http://localhost:3000/dev/scopus-benchmark-report` (มี query `?scenario=normal|partial|ytd|error`, `&open=1` เพื่อกางรายละเอียด). พิมพ์ = Ctrl+P.

**ดูหน้าจริงในระบบ (ต้อง login):** แท็บ “ผลเปรียบเทียบ” ที่ `http://localhost:3000/research-fund-system/admin` → เมนู “เทียบผลงาน Scopus (CS)” (ต้องรัน BE บน :8080 ที่ต่อ TEST DB และเข้าสู่ระบบด้วยบัญชีแอดมินของทีม; agent ไม่กรอกรหัสผ่านเอง).

**BE:**
```
cd G:/works-fund-project/fund-management-api
go build ./... && go test ./services
```
Endpoints ที่เปลี่ยน (read-only, หลัง admin auth): `GET /api/v1/admin/scopus/benchmark/comparison`, `GET .../insights?year=YYYY`.

---

## 8. ประเด็นให้ reviewer เน้น (risks / limitations / deviations)

1. **OA/intl เป็น observed rate** (ตัวหาร = เอกสารทั้งหมดในชุด) ยังไม่มี known/unknown/positive counts (§9 B). ความเสี่ยง: เอกสารที่ไม่มี affiliation/ไม่มีธง OA อาจถูกนับเป็น “ไม่ใช่” โดยปริยาย. UI ระบุ “จาก N ผลงานที่เก็บได้” ให้เห็นตัวหารแล้ว. เสนอ follow-up: OA แยก known/unknown ได้ (openaccess_flag nullable); intl ต้องนิยาม unknown เพิ่ม.
2. **quartile `unclassified` รวมก้อนเดียว** (docs − classified) UI แสดง “ยังจัดกลุ่มไม่ได้/งานนอกการจัดกลุ่ม” ยังไม่แยก non-journal/unresolved ตาม §9 B; ต้องแก้ BE ให้ส่งการแยกนี้ก่อน UI จึงแยกได้.
3. **UI screenshots เป็น fixture** (ผ่าน component จริง) เพราะ agent ห้ามกรอกรหัสผ่าน login; data จริงยืนยันผ่าน service call (§6). reviewer ที่ต้องการภาพหน้าจริงพร้อมข้อมูลจริง ให้ทีม login แล้วถ่ายเพิ่ม.
4. **`years_back=15`** สำหรับ trend (GET เดียว) — ต่างจากถ้อยคำ “10 ปี” ใน §4 แต่ยังเป็น additive read ครั้งเดียว ไม่ probe รายปี.
5. **ไม่มี controller test ของ comparison `year_meta`** — logic inline; ตรวจด้วยการรันจริง.
6. **verified faculty cohort ของ insights** ใช้ EXISTS clause เดียวกับ `verifiedFacultyCountQuery` (ค่าคงที่ `benchmarkFacultyExistsClause`) จึงตรงนิยาม official โดยโครงสร้าง; มี query-fragment test + live sample แต่ยังไม่มี unit test เทียบ EID set ตรง ๆ.
7. **is_faculty** ยังอยู่ใน DB (คง compat) แต่ insights ไม่ใช้เป็นนิยาม faculty แล้ว.
8. **top-journals endpoint** คงเดิม (scope_id=1 hardcode) เพราะไม่อยู่ใน report UI แล้ว (§5 F).
9. **เหตุการณ์:** agent เผลอเขียนทับ `.claude/launch.json` (untracked, local-only) ก่อนอ่าน — reconstruct เป็น `frontend`(3000)+`backend-api`(8080, args `go run .` เป็นการเดา) โปรดตรวจ/แก้ให้ตรงของเดิมถ้าจำเป็น. (`.claude` เป็น local-only ไม่เข้า diff)
10. **dev harness** `app/dev/scopus-benchmark-report/page.js` 404 ใน production build อยู่แล้ว แต่แนะนำลบก่อน deploy.
11. Pre-existing: `go test ./controllers` panic (`sql.Register` ซ้ำ) — มีอยู่ก่อนงานนี้.
12. **Keyboard**: ใช้ native `<select>/<details>/<button>` + focus ring ที่มองเห็น (โครงสร้างเข้าถึงด้วยคีย์บอร์ดโดยธรรมชาติ) แต่ **ยังไม่ได้เดิน tab-through ทีละจุดบนหน้าจริง** — แนะนำให้ตรวจ tab order/โฟกัสตอน login แล้ว.
