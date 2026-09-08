# แผน BE-2 — เก็บ affiliation ของ benchmark แล้วค่อยลบ raw_json

> เอกสารสั่งงานสำหรับ agent ที่จะลงมือ · ผู้ตรวจ (Claude อีกตัว) ใช้ไฟล์นี้เป็นเกณฑ์รีวิว
> เขียน: 2026-09-03 · อ้างอิง roadmap: `scopus-benchmark-dashboard-roadmap.md` (หัวข้อ BE-2)

## เป้าหมาย
เก็บ **affiliation** (สังกัด) ของเอกสาร benchmark ลงตาราง benchmark เอง (แยกจาก dashboard) เพื่อรองรับการวิเคราะห์ความร่วมมือ (สถาบัน/ประเทศ, KKU vs ต่างสถาบัน, international collaboration) **แล้วจึงลบ `raw_json`** เพื่อคืนพื้นที่ DB — โดย**ห้ามลบ raw_json จนกว่า affiliation จะถูกเก็บครบและ verify ผ่าน**

## บริบท / repo / branch
- **Repo:** `fund-management-api` (Go) — งานนี้ **backend ล้วน + migration**
- **Branch:** แตกใหม่ `feature/scopus-benchmark-affiliation` **จาก `feature/scopus-benchmark-counts-optimize`** (สถานะ benchmark backend ล่าสุด = P3+P5+fix) เพื่อไม่ให้ divergence กับ harvest.go
- **DB dev/ทดสอบ:** remote `147.50.227.17` (`.env`) — ทดสอบได้เต็มที่ · **ห้ามแตะ prod**

## ขอบเขตการรัน (สำคัญ)
- **ทำโค้ด + migration + เทสให้เสร็จบน local โดยรันกับ DB ทดสอบเท่านั้น** (ตัวที่ `.env` ปัจจุบันเชื่อมอยู่ = remote `147.50.227.17`) — รวมถึงรัน migration 041/042 และ backfill บน dev DB นี้ได้เต็มที่
- **ห้าม deploy / ห้ามรัน migration บน prod** — การ deploy จริงผู้ใช้จะมาทำร่วมกับผู้ตรวจอีกรอบแยกต่างหาก (ส่วน "⚠️ backup XAMPP ก่อน migration prod" ในขั้น 2e เป็นบันทึกไว้สำหรับตอน deploy เท่านั้น ไม่ต้องทำในรอบนี้)
- ส่งมอบ = โค้ด+migration พร้อม, ทดสอบผ่านบน dev, รอผู้ตรวจ แล้วค่อยว่ากันเรื่อง deploy

## กติกาเหล็ก (isolation — ผู้ใช้ยืนยันแล้ว)
- เก็บ affiliation ใน **ตาราง benchmark ใหม่แยกต่างหาก** — **ห้ามเขียน/แก้ `scopus_affiliations`, `scopus_documents`, `scopus_document_authors`, `scopus_authors`** ของ dashboard เด็ดขาด (อ่านได้ ไม่เขียน)
- ทำเฉพาะ **BE-2** เท่านั้น — **อย่าแตะ** BE-1 (citation refresh), BE-3 (CiteScore), dashboard KKU name→afid, หรือหน้า frontend dashboard
- **อย่า merge main เอง** รอผู้ตรวจ

---

## Ground truth (ตรวจโค้ดแล้ว — ใช้อ้างอิงและ reuse)

**โครง dashboard ที่จะมิเรอร์** (`models/scopus.go`):
```
ScopusAffiliation:      id, afid (uniqueIndex), name*, city*, country*, affiliation_url*
ScopusDocumentAuthor:   id, document_id, author_id, author_seq, affiliation_id*  ← มี affiliation_id
```

**โครง benchmark ปัจจุบัน** (`models/scopus_benchmark.go`):
```
ScopusBenchmarkDocumentAuthor: id, document_id, author_id, author_seq, is_faculty   ← ยังไม่มี affiliation_id
(ยังไม่มีตาราง affiliation ของ benchmark)
```

**Struct parse (มีอยู่แล้ว ใช้ซ้ำได้)** `services/scopus_ingest_service.go`:
- `entry.Affiliation` = `scopusAffiliations` → `scopusAffiliation{ Afid "afid", AffilName "affilname", City "affiliation-city", Country "affiliation-country", URL "affiliation-url" }`
- `author.Affiliations` = `scopusStringSlice` (json `"afid"`) → `.First()` = afid แรกของผู้แต่ง
- `parseScopusEntry(raw)` แปลง raw_json → `*scopusEntry` (ใช้ตอน backfill ได้เลย)

**Logic ที่จะมิเรอร์** `upsertAffiliations` (ingest:403) + การผูก author→affiliation ที่ `upsertAuthorsAndLinks` (ingest:485): `if firstAfid := author.Affiliations.First(); firstAfid != "" { docAuthor.AffiliationID = &affMap[firstAfid] }` — **เก็บ afid แรกต่อผู้แต่ง** (dashboard ทำแบบนี้ — มิเรอร์ให้ตรงเพื่อ parity; multi-affiliation เป็น enhancement อนาคต)

**จุดที่ benchmark harvest จะแก้** `services/scopus_benchmark_harvest.go`:
- `upsertBenchmarkEntry` (per-doc Transaction) — ปัจจุบันเรียก `buildBenchmarkDocument` + `upsertBenchmarkAuthors`
- `buildBenchmarkDocument` (map doc fields) · `upsertBenchmarkAuthors` (author + is_faculty, ยังไม่ตั้ง affiliation)
- `docModel.RawJSON = cloneJSON(raw)` — จุดที่จะ "หยุดเขียน" ในขั้นสุดท้าย

**Migration convention:** `migrations/NNN_YYYYMMDD_desc.sql` — ล่าสุด `040_...` → ใช้ **`041_`**, ราวลบ raw_json ใช้เลขถัดไป

**ข้อมูลปัจจุบัน dev:** benchmark docs ~53,000 rows (บาง env ~2,045) ทุก row มี `raw_json` → backfill ได้จาก raw_json ทั้งหมด **ไม่ต้องยิง Scopus**

---

## งานตามลำดับ (ห้ามข้ามขั้น — ลบ raw_json ได้เฉพาะหลังขั้น 4 ผ่าน)

### BE-2a · Schema + model
- Migration `041_YYYYMMDD_add_benchmark_affiliations.sql`:
  - `CREATE TABLE scopus_benchmark_affiliations` (id PK, `afid` VARCHAR unique index, `name`, `city`, `country`, `affiliation_url` — nullable, ชนิด/charset ให้ตรงกับ `scopus_affiliations`)
  - `ALTER TABLE scopus_benchmark_document_authors ADD COLUMN affiliation_id BIGINT UNSIGNED NULL` (+ index; FK จะใส่หรือไม่ ให้ดู pattern เดิมของ benchmark tables ใน `033_...create_scopus_benchmark_tables.sql`)
- Model: เพิ่ม `ScopusBenchmarkAffiliation` (+ `TableName()` = `scopus_benchmark_affiliations`) และเพิ่มฟิลด์ `AffiliationID *uint` ใน `ScopusBenchmarkDocumentAuthor` (`models/scopus_benchmark.go`)
**ผ่าน:** migrate ขึ้น dev สำเร็จ, `go build ./...` ผ่าน

### BE-2b · Harvest เก็บ affiliation ต่อไป (forward)
- เพิ่ม `upsertBenchmarkAffiliations(tx, entry)` (มิเรอร์ `upsertAffiliations`) คืน `map[afid]uint` เขียนลง `scopus_benchmark_affiliations`
- ใน `upsertBenchmarkEntry`: เรียก affiliations **ก่อน** authors ภายใน tx เดิม แล้วส่ง map เข้า `upsertBenchmarkAuthors`
- ใน `upsertBenchmarkAuthors`: ตั้ง `link.AffiliationID` จาก `author.Affiliations.First()` ผ่าน map (มิเรอร์ ingest:485)
**ผ่าน:** harvest ปีล่าสุด 1 ปีบน dev แล้ว `scopus_benchmark_affiliations` มีแถว + `scopus_benchmark_document_authors.affiliation_id` ถูกเติม (spot-check เอกสารที่มี KKU afid `60017165`/`60280609`)

### BE-2c · Backfill จาก raw_json (one-time, ไม่ยิง Scopus)
- CLI ใหม่ เช่น `cmd/benchmark-affiliation-backfill` (หรือเพิ่ม flag ใน `cmd/scopus-benchmark`) วนทุก `scopus_benchmark_documents` ที่ `raw_json` ไม่ว่าง:
  - `parseScopusEntry(raw_json)` → upsert affiliations → อัปเดต `affiliation_id` ของ `scopus_benchmark_document_authors` โดย match ผู้แต่งด้วย `scopus_author_id` (author.AuthID) → author row เดิม → set affiliation_id ตาม afid แรก
  - idempotent (รันซ้ำได้ ไม่เพี้ยน), batch + log ความคืบหน้า
**ผ่าน:** รัน backfill บน dev จบโดยไม่ error, รายงานจำนวน affiliation ที่สร้าง/ผูก

### BE-2d · Verify coverage (ด่านก่อนลบ)
- Query ยืนยัน: จำนวน `scopus_benchmark_documents` ที่ raw_json มี affiliation array แต่**ยังไม่มี** affiliation ผูกในตารางใหม่ = **ต้องเป็น 0** (หรืออธิบายส่วนที่เหลือได้ว่าเป็นเอกสารที่ raw_json ไม่มี affiliation จริง)
- Spot-check ≥5 เอกสารเทียบ raw_json กับตารางใหม่ว่าตรง
- ยืนยัน **dashboard ไม่ถูกแตะ**: row count ของ `scopus_affiliations`, `scopus_document_authors` **เท่าเดิม** ก่อน/หลังงานนี้
**ผ่าน:** coverage ครบ + dashboard tables ไม่เปลี่ยน → จึงไป BE-2e ได้

### BE-2e · ลบ raw_json (หลัง 2d ผ่านเท่านั้น)
- หยุดเขียน: เอา `docModel.RawJSON = cloneJSON(raw)` ออกจาก `upsertBenchmarkEntry` (หรือ set nil)
- Migration `042_YYYYMMDD_drop_benchmark_raw_json.sql`: ระยะแรก `UPDATE scopus_benchmark_documents SET raw_json = NULL` แล้ว `OPTIMIZE TABLE scopus_benchmark_documents` (คืนพื้นที่); เก็บคอลัมน์ไว้ก่อน (reversible) — `DROP COLUMN` ทำ migration แยกทีหลังเมื่อมั่นใจ
- **⚠️ บน prod: backup โฟลเดอร์ data XAMPP ก่อนรัน migration เสมอ** (prod MySQL เปราะตอน reboot/แก้)
**ผ่าน:** ขนาดตารางลดลงชัดเจน, harvest รอบใหม่ไม่เขียน raw_json แล้ว, ฟีเจอร์เดิม (comparison/verified faculty) ยังทำงานปกติ

---

## Verification รวม (ก่อนส่งตรวจ)
- `go build ./...` + `go test ./services` ผ่าน (เพิ่ม unit test: parse affiliation จาก raw ตัวอย่าง → map ถูก; author→afid แรกถูกผูก)
- รายงานตัวเลข: affiliations สร้างกี่แถว, document_authors ผูก affiliation กี่ %, ประเทศ/สถาบัน top จาก benchmark (พิสูจน์ว่าใช้วิเคราะห์ได้จริง)
- ยืนยัน dashboard tables row count ไม่เปลี่ยน
- commit เป็นก้อนต่อขั้น (2a/2b/2c/2d/2e) ให้รีวิวย้อนได้ · **ไม่ merge main**

## สิ่งที่ต้องส่งให้ผู้ตรวจ
- Migration files + diff โมเดล/harvest/backfill
- ผลรัน backfill (log/ตัวเลข) + ผล verify 2d (coverage + dashboard row counts เท่าเดิม)
- ตัวอย่าง query วิเคราะห์ (เช่น จำนวนเอกสารร่วมต่างประเทศต่อปี) เพื่อยืนยันคุณค่า

---

## ผลดำเนินงานบน dev (2026-09-03)

**สถานะ: BE-2a ถึง BE-2e เสร็จครบและผ่านการทดสอบบน dev แล้ว**  
Branch backend: `feature/scopus-benchmark-affiliation` · ยังไม่ merge `main` · ยังไม่ deploy หรือ migrate prod

### Commit แยกตาม phase

| Phase | Commit | ผลลัพธ์ |
|---|---|---|
| BE-2a | `206597b` | เพิ่ม schema/model ของ benchmark affiliation และ migration 041 |
| BE-2b | `59bd8f4` | harvest เก็บ affiliation และผูก AF-ID แรกของผู้แต่ง |
| BE-2c | `0e3150a` | เพิ่ม CLI backfill จาก `raw_json` แบบ batch/idempotent |
| BE-2d | `78c6b80` | เพิ่มชุด SQL ตรวจ coverage, isolation และ query วิเคราะห์ |
| BE-2e | `8ced36d` | หยุดเก็บ `raw_json`, เพิ่ม migration 042 เพื่อล้าง payload และ optimize |

### Baseline และ isolation ของ dashboard

- ก่อนเริ่ม: `scopus_affiliations` = **450**, `scopus_document_authors` = **3,745**
- หลัง migration, harvest, backfill, verify และ cleanup: ยังคงเป็น **450 / 3,745** เท่าเดิม
- งานนี้เขียนเฉพาะตาราง `scopus_benchmark_*`; ไม่แก้ logic หรือข้อมูลของ Scopus dashboard เดิม

### BE-2a — schema/model

- รัน migration `041_20260903_add_benchmark_affiliations.sql` บน dev สำเร็จ
- สร้าง `scopus_benchmark_affiliations` และเพิ่ม nullable/indexed `affiliation_id` ใน `scopus_benchmark_document_authors`
- ไม่ใส่ foreign key เพื่อให้ตรงกับ pattern ของ benchmark tables เดิม

### BE-2b — forward harvest

- Run **#12** ล้มเหลวด้วย HTTP 401 ก่อนเปิด VPN; ไม่มีข้อมูลที่ใช้ยืนยันผลจากรอบนี้
- หลังเปิด VPN รันปี 2026 เป็น run **#13** สำเร็จ: **221 documents**, 9 pages, 10 requests, 887 faculty links
- หลัง run #13 มี benchmark affiliations **220** แถว และ document-author links ที่มี affiliation **1,069** แถว
- Spot-check AF-ID ของคณะ: `60017165` = **413 links**, `60280609` = **44 links**

### BE-2c — backfill จาก raw_json

- ประมวลผล **2,049 documents** โดยไม่ยิง Scopus API
- สร้าง affiliations เพิ่ม **830** แถว
- ผู้แต่งที่ raw JSON มี first AF-ID **8,668** รายการ; match author links ได้ **8,668** รายการ
- อัปเดต links **7,598** แถว; หลังจบมี links ที่ผูก affiliation **8,667** แถว
- ตัวเลข 8,668 เป็นจำนวน author occurrences ที่ parser ประมวลผล ส่วน 8,667 เป็นจำนวน unique document-author rows หลัง upsert จึงต่างกัน 1 โดยไม่ใช่ missing link
- missing/error = **0**
- รันซ้ำเพื่อยืนยัน idempotency: created **0**, updated **0**, missing **0**, จำนวน linked คงเดิม **8,667**

### BE-2d — coverage และความถูกต้อง

- Documents ทั้งหมด **2,049**; มี affiliation ใน raw JSON **2,049**; ไม่มี document link ที่ตกหล่น **0**
- Author occurrences ที่คาดว่าจะผูก **8,668**, matched **8,668**, mismatch **0**, affiliation row ที่หาไม่พบ **0**; เมื่อ deduplicate ตาม document-author key เหลือ linked rows **8,667**
- Spot-check เทียบ raw JSON กับตารางใหม่ 5 links ผ่านทั้งหมด:
  - EID `2-s2.0-85216589655`: author `59535845700` → AF-ID `60017165`
  - EID `2-s2.0-85216589655`: author `56688578200` → AF-ID `60280609`
  - EID `2-s2.0-85218952032`: ผู้แต่ง 3 ราย → AF-ID `60121496`, `60103676`, `60105710`
- หลัง backfill มี benchmark affiliations รวม **1,050** แถว
- ประเทศที่พบมากสุด: Thailand 2,015 docs, India 142, Saudi Arabia 117, Pakistan 114, Japan 77
- สถาบันที่พบมากสุด: KKU (`60017165`) 1,491 docs, Faculty of Science KKU (`60280609`) 499 docs
- เก็บ query สำหรับตรวจซ้ำและวิเคราะห์ไว้ที่ backend `docs/scopus_benchmark_affiliation_verification.sql`

### BE-2e — raw_json retention cleanup

- ก่อน cleanup: raw rows **2,049**, payload **9,671,491 bytes**, table data **20,299,776 bytes**, index **507,904 bytes**
- รัน migration `042_20260903_clear_benchmark_raw_json.sql` สำเร็จ: raw rows/bytes เหลือ **0 / 0**
- หลัง `OPTIMIZE TABLE`: table data **5,783,552 bytes**, index **393,216 bytes**
- Run **#14** หลัง cleanup สำเร็จสำหรับปี 2026: **221 documents**, 9 pages, 10 requests, 887 faculty links
- หลัง run #14 `raw_json` ยังเป็น **0 แถว** และ affiliations/author links ยังทำงานปกติ
- ตรวจ comparison service ช่วง 2025–2026 สำเร็จ:
  - KKU: total **532** (2025=311, 2026=221)
  - Thailand: total **8,941** (2025=5,597, 2026=3,344)
  - Faculty CS: total **121** (2025=63, 2026=58)

### Automated verification

- `go test -buildvcs=false ./services` — ผ่าน
- `go test -buildvcs=false ./controllers -run '^$'` — ผ่าน (compile verification)
- `go build -buildvcs=false ./...` — ผ่าน
- `git diff --check` — ผ่าน

## สิ่งที่เหลือ

ไม่มี implementation phase ของ BE-2 เหลือบน dev แล้ว งานถัดไปที่ยังไม่ทำตามขอบเขตของแผนคือ:

1. ให้ผู้ตรวจ review commits และผล verification ข้างต้น
2. เมื่อผู้ใช้อนุมัติรอบ production: สำรอง XAMPP data, deploy โค้ด และรัน migration 041/042 บน prod ร่วมกับผู้ตรวจ
3. Merge เข้า `main` หลัง review/production plan ได้รับอนุมัติ — งานนี้ยังไม่ได้ merge เอง
