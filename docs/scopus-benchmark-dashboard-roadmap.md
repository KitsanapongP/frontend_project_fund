# Roadmap — หน้า Scopus Benchmark (dashboard revamp)

> เอกสารวางแผนต่อจากเฟส 1/P3/P5 (ดู `scopus-benchmark-revamp-plan.md`)
> อัปเดต: 2026-09-03 · ยังอยู่ช่วง discussion บางหัวข้อ (ทำเครื่องหมาย TBD)

## 📌 Branch ที่ทำอยู่ตอนนี้ (อัปเดต 2026-09-03) — ยังไม่ merge main ทั้งหมด
| Repo | Branch | มีอะไร | สถานะ |
|---|---|---|---|
| `frontend_project_fund` | `feature/scopus-benchmark-revamp` | เฟส 1 (P2/P1/P4/P6) + finding#2 fix + ไฟล์ plan/roadmap ทั้งหมด | รอ merge |
| `fund-management-api` | `feature/scopus-benchmark-counts-optimize` | P3 (verified faculty) + P5 (facet counts) + fix (cover_date, facet fallback, finding#1) | รอ merge |
| `fund-management-api` | `feature/scopus-benchmark-affiliation` *(จะแตกใหม่)* | BE-2 (affiliation + ลบ raw_json) แตกจาก counts-optimize | ยังไม่เริ่ม |

- Branch ที่ลบไปแล้ว: `feature/scopus-benchmark` (ทั้ง 2 repo, local+remote), `feature/scopus-benchmark-verified-faculty` (P3 เดี่ยว — ถูกกลืนใน counts-optimize)
- ลำดับ merge ที่แนะนำ: FE `revamp` + BE `counts-optimize` (ครอบ P3+P5) → แล้วค่อย `affiliation` → BE-1/BE-3/งานแยก dashboard ทีหลัง

## วิสัยทัศน์
หน้าใหม่ให้ **ผู้บริหารดูภาพรวม (เน้นรายงาน/story)** + **dashboard ให้ทีมวิจัยเจาะ** โดย **เทียบ 3 ระดับ (คณะ / KKU / Thailand)** — โฟกัสคณะเชิงลึกมีอีกหน้าอยู่แล้ว

โครง 3 โซน:
1. **โซนเทียบ 3 ระดับ** (ตัวเลขรวม — ข้อมูลพร้อม): KPI, แนวโน้ม, สัดส่วน%, YoY/CAGR
2. **โซนเจาะลึก KKU CS** (ต้องเปิด endpoint ใหม่จาก documents): Top cited, Top journals, สัดส่วน Q1–Q4, OA rate, ประเภทงาน, Top keywords, การมีส่วนร่วมของคณะ
3. **โซนรายงาน/Export**: รายงานประจำปี (PDF/print) + Excel/CSV

## สถานะข้อมูล (ณ 2026-09-03)
- **Harvest บน prod**: ดึง KKU + Thailand แล้ว ~**53,000 rows** (ปี ~2000–2026) — DB ~300MB
- **Thailand มีเอกสารระดับ document แล้ว** (ต่างจากเดิมที่มีแค่ count) → โซน 2 ขยายไป Thailand ได้ถ้าต้องการ แต่ค่ามาก/คุณค่าต่อ story น้อย — พิจารณาทีหลัง
- **CiteScore (`scopus_source_metrics`)**: coverage **บางส่วน** — ~47% ของเอกสาร / ~22% ของวารสาร (วารสาร volume สูง cover แล้ว) ตาราง 2,870 แถว ปี 2011–2026, quartile ครบในวารสารที่ cover (Q1 72 / Q2 79 / Q3 65 / Q4 37)

---

## งาน Backend — data infrastructure (confirmed)

### BE-1 · Citation refresh แบบเบา ✅ ใส่ roadmap แล้ว
**ปัญหา:** ตอนนี้ไม่มีทางลัดอัปเดต citation — การอัปเดต `citedby_count` ต้อง re-harvest เต็ม (COMPLETE, 25/เพจ ≈ **2,120 requests** สำหรับ 53k docs) เขียน raw_json/author ใหม่ทั้งหมด เปลืองมาก
**ทำ:** endpoint/CLI ใหม่ที่:
- ใช้ **STANDARD view, count=200/เพจ** อ่านแค่ `eid` + `citedby_count`
- UPDATE เฉพาะคอลัมน์ citation ของ row ที่มีอยู่ (match by EID) ไม่แตะ abstract/author/raw_json
- ยิงต่อ scope query เดิม → **53,000 ÷ 200 ≈ 265 requests** (ถูกลง ~8 เท่า, เร็วกว่ามาก)
- ไม่เพิ่มเอกสารใหม่ (นั่นเป็นหน้าที่ full harvest); แค่รีเฟรชตัวเลขของชุดที่ harvest แล้ว
- บันทึกเป็น run แยกประเภท (เช่น `run_type = "citation_refresh"`) ให้ประวัติแยกจาก harvest
**ใช้งาน:** manual รายไตรมาส (บ่อยกว่า full harvest)
**ขอบเขต:** backend ล้วน — แตก branch แยกใน `fund-management-api`

### BE-2 · เก็บ affiliation ของ benchmark ก่อน แล้วค่อยลบ raw_json ✅ (ตัดสินแล้ว: เก็บ affiliation ก่อน)
**เหตุผล (ตรวจโค้ดแล้ว):** `scopus_benchmark_documents.raw_json` **ไม่มีที่ไหนอ่านเลย** (ที่อ่าน raw_json คือ `scopus_documents` ของ dashboard คนละตาราง — ตัวนั้นเก็บไว้เหมือนเดิม) และเอกสารคณะก็อยู่ใน `scopus_documents` อยู่แล้ว (P3 join by eid) → เก็บใน benchmark ซ้ำเปล่า แม้แต่ของคณะ · เป็นตัวถ่วงขนาดหลักของ 300MB

**ยืนยัน field coverage (ตรวจ `buildBenchmarkDocument` + `upsertBenchmarkAuthors`):** raw_json = 1 entry ของ Scopus Search (COMPLETE) ถูก parse ลงคอลัมน์แทบครบ — bibliographic ทั้งหมด + ผู้แต่ง (id/ชื่อ/ลำดับ/is_faculty)
- **ไม่ได้เก็บ:** affiliation array ระดับเอกสาร (`afid`/`affilname`/`city`/`country`) และการผูก author↔affiliation (benchmark document_authors มีแค่ `is_faculty`) + prism:url
- **นัย:** ลบ raw_json = เสียแค่การ re-derive "สังกัด" โดยไม่ re-harvest ซึ่งฟีเจอร์ปัจจุบัน/ที่วางแผน**ไม่ใช้** → ลบได้ปลอดภัย
- ⚠️ ถ้าอนาคตจะทำ "ความร่วมมือระดับสถาบัน/ประเทศ" บนชุด benchmark ต้อง **เพิ่มคอลัมน์ affiliation + parse เก็บก่อน** ค่อยลบ (ไม่พึ่ง raw_json อยู่ดี)
**ตัดสินใจ (ผู้ใช้):** affiliation ส่งผลต่อการวิเคราะห์เยอะ (ความร่วมมือสถาบัน/ประเทศ, KKU vs ต่างสถาบัน, international collaboration) → **ต้องเก็บ affiliation ลงตาราง benchmark ก่อน แล้วค่อยลบ raw_json** ห้ามลบทิ้งเฉยๆ

**ข่าวดี:** affiliation array อยู่ใน raw_json ที่เก็บไว้แล้ว → **backfill จาก raw_json ได้เลย ไม่ต้อง re-harvest / ไม่กิน Scopus quota**

**ทำตามลำดับ (ห้ามลบ raw_json ก่อนขั้น 4 ผ่าน):**
1. **BE-2a schema** — เพิ่มตาราง `scopus_benchmark_affiliations` (`afid` unique, `name`, `city`, `country`) + คอลัมน์ `affiliation_id` ใน `scopus_benchmark_document_authors` (มิเรอร์โครง dashboard `scopus_affiliations` + `scopus_document_authors.affiliation_id` เพื่อความสม่ำเสมอ)
2. **BE-2b harvest** — parse affiliation ตอน harvest แล้วเก็บลงตารางใหม่ (นำ logic parse ของ dashboard `scopus_ingest_service` มาใช้ซ้ำได้ — struct `scopusEntry.Affiliation` + `author.afid` มีอยู่แล้ว)
3. **BE-2c backfill** — migration one-time: อ่าน `raw_json` ของ ~53k row เดิม → parse affiliation → เติมตารางใหม่ (ไม่ยิง Scopus)
4. **BE-2d verify** — ตรวจว่าทุก row ที่มี raw_json ได้ affiliation ครบ (นับ coverage) **ผ่านแล้วเท่านั้น** จึงไป 5
5. **BE-2e ลบ raw_json** — หยุด set `docModel.RawJSON` ตอน harvest + migration ล้างของเดิม: null ก่อน (reversible) แล้ว `OPTIMIZE TABLE`; drop column ทีหลังถ้ามั่นใจ
**⚠️ ก่อน migration บน prod: backup โฟลเดอร์ data ของ XAMPP MySQL ก่อนเสมอ** (prod MySQL เปราะตอน reboot/แก้ไข)
**หมายเหตุนิยาม KKU:** ตอนเก็บ afid ให้เผื่อใช้ afid เป็นตัวแบ่ง "เป็น KKU" (`60017165`/`60280609`) ให้ตรงกับ benchmark P3 — ต่างจาก dashboard ที่ยังกรองด้วยชื่อ (ดู "งานแยก" ด้านล่าง)
**ขอบเขต:** backend + migration — branch แยก

### งานแยก (นอกสโคป benchmark, จดไว้) · Dashboard KKU filter: name → afid
Dashboard (`scopus_publication_service.go` `kkuAffiliationNames`) กรอง "เป็น KKU" ด้วย **ชื่อ** 2 ค่า ซึ่งเปราะ (โค้ดเตือนเอง) และ**ต่างจาก benchmark P3 ที่ใช้ afid** `60017165`/`60280609` → ควรย้าย dashboard ไปใช้ afid ให้ทั้งระบบนิยาม KKU ตรงกัน · **เป็นการแก้ logic ของ dashboard** (ก่อนหน้านี้ผู้ใช้กำชับห้ามแตะในงาน benchmark) → ทำเป็นงาน/branch แยกต่างหาก รอเคาะ

### BE-3 · เติม CiteScore coverage (TBD — น่าจะเอา)
**ปัญหา:** quartile cover แค่ ~47% ของเอกสาร (~428 วารสารยังขาด) → กราฟ Q1–Q4 ยังไม่ครบ
**ทำ:** ชี้ระบบ CiteScore เดิม (`citescore_metrics_runs` + service) ไปดึง metric ของ source_id ที่ benchmark มีแต่ตารางยังไม่มี
**ขอบเขต:** ใช้กลไกเดิม ไม่สร้างใหม่ · รอเคาะว่าอยู่เฟสไหน

---

## งาน Frontend/Backend — dashboard (รอเคาะเฟสแรก: ก/ข/ค)
- **(ก)** โซน 2 เจาะลึก KKU ก่อน (ว้าวเยอะ, ต้องเปิด endpoint + อาจพึ่ง BE-3)
- **(ข)** โซน 1 อัปเกรดเทียบ 3 ระดับก่อน (เร็ว, ข้อมูลพร้อม)
- **(ค)** ออกแบบทั้งหน้ารวด แล้วทยอยต่อ endpoint
> ตอนออกแบบ UX/UI จริง จะใช้ skill **Impeccable** ร่วม

## ข้อควรระวังตอนออกแบบ (ให้ข้อมูลไม่หลอก)
- Citations สะสมตามเวลา + ปีปัจจุบันยังไม่ครบ → ต้อง annotate
- โซน 2 เป็นสโคป KKU CS (คณะ = subset) — ป้ายให้ชัด
- `authkeywords` เก็บเป็น JSON/bytes → ต้อง parse
- CiteScore ยัง cover ไม่ครบ (จนกว่าจะทำ BE-3) → แสดง coverage ให้ผู้ใช้รู้
