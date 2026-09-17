# Scopus Benchmark — API/data contract (executive report)

สัญญา response ที่ FE ใช้จริง ณ ปัจจุบัน (ตรงกับ `services/scopus_benchmark_insights.go` /
`controllers/admin_scopus_benchmark_controller.go` ฝั่ง BE และ container/ชิ้นส่วน `report/*` ฝั่ง FE).
เอกสารนี้เขียนจากพฤติกรรมโค้ด/response จริง — ไม่ใช่ contract ฉบับตกลงครั้งแรก. คู่มือฟีเจอร์: [scopus-benchmark-report.md](./scopus-benchmark-report.md).

ทุก endpoint เป็น **read-only** ในขอบเขต benchmark: ไม่เขียนตาราง `scopus_*`/benchmark, ไม่ harvest/refresh, ไม่ทำ citation snapshot/backfill.

---

## 1. GET `/api/v1/admin/scopus/benchmark/comparison?year_from=&year_to=`

> ตัวเลขในตัวอย่างทุกบล็อกเป็น **ค่าสมมติเพื่ออธิบายรูปแบบ** ไม่ใช่ข้อมูลจริง.

```jsonc
{ "success": true, "data": {
  "years": [
    { "year": YYYY,   "faculty": 58,   "university": 240, "country": 2400 },
    { "year": YYYY+1, "faculty": null, "university": 150, "country": 1600 } // faculty=null เมื่อ blocked/missing
  ],
  "year_meta": {
    "YYYY": {
      "faculty":    { "status": "available", "snapshot_exists": true, "snapshot_at": "…Z", "reason": "" },
      "university": { "status": "available", "snapshot_exists": true, "snapshot_at": "…Z", "reason": "" },
      "country":    { "status": "available", "snapshot_exists": true, "snapshot_at": "…Z", "reason": "" }
    }
    // … ทุกปีในช่วงที่ query
  },
  "available_years": { "faculty": [YYYY, YYYY-1, …], "university": […], "country": […] },
  "report_scope": {
    "consistent": true,
    "subject_area": "COMP",
    "faculty_subject_area": "COMP", "university_subject_area": "COMP", "country_subject_area": "COMP",
    "faculty_scope_id": 3, "university_scope_id": 1, "country_scope_id": 2
  },
  "faculty_metric": {
    "ready": true, "employment_date_complete": false,
    "faculty_with_scopus_id": N, "employment_date_set": N, "employment_date_missing": N,
    "benchmark_years_missing": [YYYY, YYYY-1, …]
  },
  "faculty_scope": {…}, "university_scope": {…}, "country_scope": {…} // objects เดิม คงไว้
}}
```

กติกาที่ต้องเข้าใจ:
- **`available_years` = "มี snapshot" (snapshot existence) แยกต่อระดับ รวมปีที่ faculty `blocked`** — ใช้เพียงตัดสิน "โหลดถึงปีไหน" ไม่ใช่ readiness. readiness จริงอยู่ที่ `year_meta[...].status`.
- **`year_meta[YYYY][level].status`**:
  - `available` = มี snapshot และผ่านความพร้อม
  - `blocked` = (faculty เท่านั้น) มี snapshot แต่ยังไม่พร้อม (faculty metric ไม่ ready / ปีอยู่ใน `benchmark_years_missing` / มี KKU harvest ทำงาน) → `years[].faculty` เป็น `null`
  - `missing` = ไม่มี snapshot
  - `snapshot_exists` เป็น true แม้ค่าจริงเป็น 0 (zero-snapshot คือปีที่มีข้อมูล). university/country ไม่บล็อกข้ามระดับ.
- **`report_scope.consistent`** = true เฉพาะเมื่อทั้งสามระดับเป็น subject เดียวกันและเป็น COMP; scope id resolve จาก level/config (ไม่ hardcode).

---

## 2. GET `/api/v1/admin/scopus/benchmark/insights?year=YYYY`

```jsonc
{ "success": true, "data": {
  "year": YYYY,
  "levels": {
    "faculty": {
      "available": true,
      "docs": 40,                       // observed/harvested docs ของปีนี้ (ตัวเดียวที่ share/สัดส่วนใช้)
      "oa_pct": 55.0, "intl_pct": 50.0, "avg_cite": 8.1,     // legacy rates (คงความหมายเดิม)
      "quartile": { "t1": 6, "q1": 12, "q2": 8, "q3": 4, "q4": 2,
                    "unclassified": 8, "unclassified_journal": 0, "excluded_non_journal": 8, "unresolved": 0 },
      "doctypes": { "article": 32, "conference": 6, "other": 2 },   // รวม = docs
      "oa":   { "known": 40, "positive": 22, "unknown": 0 },
      "intl": { "known": 40, "positive": 20, "unknown": 0 },
      "citations": {
        "total": 324, "average": 8.1,
        "known_docs": 40, "cohort_docs": 40, "unknown_docs": 0,
        "coverage_status": "complete",              // none|partial|complete
        "denominator_policy": "known_citation_docs",
        "updated_at": null, "update_range": null, "freshness_status": "unknown"
      },
      "readiness": {
        "comparison_ready": true, "active_run": false,
        "snapshot_mismatch": false, "expected_docs": 40, "observed_docs": 40, "reasons": [],
        "metrics": {
          "count":     { "ready": true,  "reasons": [] },
          "quality":   { "ready": true,  "reasons": [] },
          "oa":        { "ready": true,  "reasons": [] },
          "intl":      { "ready": true,  "reasons": [] },
          "citations": { "ready": true,  "reasons": [] }
        }
      }
    },
    "kku": { … },
    "thailand": { … }
  },
  "quartile_coverage": { "classified": 32, "total": 40 },
  "scope": { "subject_area": "COMP", "faculty_scope_id": 3, "university_scope_id": 1, "country_scope_id": 2 }
}}
```

ระดับที่ไม่พร้อม (เช่น country ที่มี count snapshot แต่ยังไม่ harvest) จะเป็น
`available:false`, `citations` แบบ none (`cohort_docs:0`, `total/average:null`), และ
`readiness.snapshot_mismatch:true` พร้อม `expected_docs>0, observed_docs:0` + เหตุผล.

### 2.1 citation cohort (สำคัญ — อย่าใช้สมมติฐานเก่า)
- **`citations.cohort_docs` = observed docs (ที่ harvest จริง) = `readiness.observed_docs` = `level.docs`** — **ไม่ใช่** count snapshot.
- `known_docs` = docs ที่มี `citedby_count` (≤ `cohort_docs`); `unknown_docs = cohort_docs − known_docs`.
- `total` = SUM(citedby_count) ของ known docs; `average = total/known_docs`. `known_docs=0` → `total=null, average=null` (ไม่ใช่ 0). ค่าศูนย์จริงทั้งหมด (known_docs>0) → 0.
- คำนวณจาก distinct document cohort เดียวกับ insights, ใช้ field ที่เก็บไว้ (ไม่เรียก Scopus เพิ่ม), ไม่รวมยอดสามระดับ.

### 2.2 snapshot mismatch (เกิดได้ทั้งสองทิศ — ต้องเปิดเผยเสมอ)
- `expected_docs` = count snapshot (ยอดทางการ), `observed_docs` = ที่ harvest จริง (= `docs` = `cohort_docs`).
- **`snapshot_mismatch = true` เมื่อ `expected_docs ≠ observed_docs`** ได้ทั้ง:
  - `observed < count` — harvest ยังไม่ครบสำหรับปีนั้น
  - `observed > count` — count snapshot เก่ากว่าที่ harvest ได้จริง
- ทั้งสองทิศ **ถูก disclose เสมอ** ผ่าน `readiness.metrics.count.ready=false` + reason และ FE โชว์หมายเหตุ/งดการเทียบ — ไม่เงียบ. **ห้ามสมมติว่า `cohort ≤ count`.** `cohort == count` เฉพาะระดับที่ ready (ไม่ mismatch).

### 2.3 readiness ราย metric (ไม่ใช่ boolean เดียว)
แต่ละ metric พร้อมอิสระต่อกัน — FE เปิด "ส่วนต่างคณะเทียบ KKU" ของ metric ใด ต่อเมื่อ metric นั้น ready **ทั้งสองฝั่ง**:
- `count` ready = harvest ครบ (ไม่ mismatch)
- `quality` ready = `unclassified_journal = 0` และ `unresolved = 0`
- `oa` ready = `oa.unknown = 0`
- `intl` ready = `intl.unknown = 0`
- `citations` ready = `citations.unknown_docs = 0`
ไม่มี threshold coverage % ที่ตั้งเองเพื่อรับรองความเป็นตัวแทน.

### 2.4 OA / นานาชาติ
`oa`/`intl` = `{ known, positive, unknown }` เป็น positive/known: อัตรา = `positive/known`; `unknown` ไม่อยู่ในตัวหารและไม่นับเป็นลบ. เป็นชุดตัวเลขเดียวกับที่ KPI, ตาราง และ CSV ใช้ (ค่าตรงกันทุกที่).

### 2.5 quartile / doctypes
- `quartile`: `t1,q1,q2,q3,q4` = วารสารที่จัดกลุ่มได้ (classified); `unclassified_journal` = วารสารที่ยังไม่มี CiteScore; `excluded_non_journal` = คอนเฟอเรนซ์/หนังสือ; `unresolved` = ระบุประเภทไม่ได้. `classified + unclassified_journal + excluded_non_journal (+unresolved) = docs`.
- `doctypes.article + conference + other = docs` (article ≈ journal docs; conference/other ≈ non-journal).

---

### 2.6 GET `/api/v1/admin/scopus/benchmark/insights?year_from=&year_to=` (ช่วงปี)

ฟอร์มช่วงปี (inclusive) เพิ่มเข้ามาสำหรับรายงานหลายปี. ฟอร์มปีเดียว `?year=YYYY` **คงเดิมทุกฟิลด์**
สำหรับ caller เก่า. การส่ง `year` ปนกับ `year_from`/`year_to`, ส่งช่วงไม่ครบข้าง, parse ไม่ได้,
`year_from > year_to`, อยู่นอกขอบเขต [1900, ปีปัจจุบัน+1] หรือช่วงกว้างเกิน 60 ปี → **400** (ไม่ swap เงียบ ๆ).

```jsonc
{ "success": true, "data": {
  "year_from": 2025, "year_to": 2026,      // ไม่มี top-level "year" — ช่วงไม่ใช่ปีเดียว (§4.3)
  "years": {                                // insight รายปีเต็มรูป (แต่ละคีย์ = payload แบบข้อ 2)
    "2025": { "year": 2025, "levels": {…}, "quartile_coverage": {…}, "scope": {…} },
    "2026": { "year": 2026, "levels": {…}, "quartile_coverage": {…}, "scope": {…} }
  },
  "levels": {                               // aggregate ตลอดช่วง — ตัวที่ KPI/ตาราง/CSV ใช้
    "faculty": {
      "available": true,                    // true เมื่อมี observed docs ปีใดปีหนึ่งในช่วง
      "docs": 20,                           // Σ observed docs
      "oa_pct": …, "intl_pct": 50.0, "avg_cite": …,  // re-derive จากผลรวม ไม่ใช่เฉลี่ย % รายปี (§3.2)
      "quartile": { "t1": 2, "q1": 3, "q2": 3, "q3": 1, "q4": 1, "unclassified": …, "unclassified_journal": …, "excluded_non_journal": …, "unresolved": … },
      "doctypes": { … },                    // Σ รายปี
      "oa":   { "known": 20, "positive": 8,  "unknown": 0 },   // Σ; อัตรา = positive/known
      "intl": { "known": 20, "positive": 10, "unknown": 0 },
      "citations": { … },                   // computeCitationSummary(Σcohort, Σknown, Σtotal)
      "readiness": {
        "comparison_ready": false,          // = metrics.count.ready
        "active_run": false, "snapshot_mismatch": false,
        "expected_docs": 20, "observed_docs": 20,
        "reasons": ["2026: no KKU documents for this year"],   // reason ผูกปีต้นเหตุเสมอ (§3.2)
        "metrics": {
          "count":     { "ready": false, "reasons": ["2026: …"] },  // ready เฉพาะเมื่อ "ทุกปี" ready
          "quality":   { "ready": true,  "reasons": [] },
          "oa":        { "ready": true,  "reasons": [] },
          "intl":      { "ready": true,  "reasons": [] },
          "citations": { "ready": true,  "reasons": [] }
        }
      }
    },
    "kku": { … }, "thailand": { … }
  },
  "quartile_coverage": { "classified": …, "total": … },   // Σ ของ level ที่ available
  "scope": { "subject_area": "COMP", "faculty_scope_id": …, "university_scope_id": …, "country_scope_id": … }
}}
```

กติกา aggregate (ตรงกับ `aggregateRangeLevel` — pure/testable, §4.4):
- **ทุกอัตรา (T1–Q2, intl, OA, citations avg) re-derive จากผลรวมตัวตั้ง/ตัวหาร ไม่เฉลี่ยเปอร์เซ็นต์รายปี.** เช่น intl 1/2 + 9/18 → 10/20 = 50%; 1/2 + 9/10 → 10/12 = 83.3%.
- **readiness ราย metric aggregate แบบ AND**: metric ช่วง ready ก็ต่อเมื่อ **ทุกปี** ในช่วง ready; reason แต่ละอันขึ้นต้นด้วย `"<ปี>: "`.
- `levels.*.available` = true เมื่อมี observed docs อย่างน้อยหนึ่งปี (เป็น **observed subset** — ยังไม่ยืนยันครบช่วง; ความครบดูจาก readiness).
- ยอดจำนวนผลงานช่วง (สำหรับ KPI/สัดส่วน) FE รวมเองจาก `comparison.years[]` + `year_meta` โดยเป็น **null ถ้ามีปี missing/blocked** (ไม่เอา insights `docs` มาเป็นยอดทางการ — `docs` คือ observed/harvested).

## 2.7 GET `/api/v1/admin/scopus/benchmark/documents/export?level=&year_from=&year_to=` (CSV รายการเอกสาร §10)

Read-only. คืน **CSV** (ไม่ใช่ JSON) ของรายการเอกสาร benchmark หนึ่งระดับตามช่วงปีที่ apply.
`level` = `university` (KKU) หรือ `country` (Thailand) เท่านั้น — ไม่มีระดับคณะ. `year_from`/`year_to`
บังคับทั้งคู่, integer, from ≤ to, อยู่ใน [1900, ปีปัจจุบัน+1], กว้างไม่เกิน 60 ปี — มิฉะนั้น 400.
ไม่พบเอกสาร → **404** `{success:false, error:"ไม่พบเอกสาร…"}` (ไม่คืนไฟล์ว่างที่ดูเหมือนสำเร็จ).

- หนึ่งเอกสารหนึ่งแถวเสมอ (join authors/affiliations ไม่ทำให้แถวเพิ่ม): metrics join ผูก 1 แถว
  ล่าสุดด้วย `source_metric_id`, authors เป็น `GROUP_CONCAT` subquery, affiliations query แยกแล้ว group ใน Go.
- ordering `pub_year DESC, document id ASC`; UTF-8 BOM; escape ตาม RFC4180; กัน formula injection
  (ค่าเริ่มด้วย `= + - @` เติม `'` นำหน้า); ID/ISSN/ISBN เก็บเป็นข้อความ (auto-format เป็นเรื่องของโปรแกรมที่เปิด).
- สร้างไฟล์ทั้งก้อนใน memory แล้วส่งเมื่อสำเร็จครบเท่านั้น (ไม่มี partial file); FE ใช้ `apiClient.downloadFile`
  ที่ดึงเป็น blob และ throw เมื่อ non-2xx.

### 36 คอลัมน์ (ตรงชื่อ/ลำดับกับ `EXPORT_COLUMNS` ชีต Documents หน้า search) และแหล่งข้อมูล benchmark

| # | column | benchmark source |
|---|--------|------------------|
|1|ลำดับ|running index (1..N)|
|2|scopus_id|`scopus_benchmark_documents.scopus_id`|
|3|scopus_link|`.scopus_link`|
|4|title|`.title`|
|5|authors|`GROUP_CONCAT(full_name/surname/scopus_author_id ORDER BY author_seq)` ผ่าน `benchmark_document_authors`+`benchmark_authors`|
|6|abstract|`.abstract`|
|7|aggregation_type|`.aggregation_type`|
|8|source_id|`.source_id`|
|9|publication_name|`.publication_name`|
|10|afid|primary affiliation (ตัวแรกตาม author_seq) จาก `benchmark_affiliations.afid`|
|11|name|primary `.name`|
|12|city|primary `.city`|
|13|country|primary `.country`|
|14|affiliation_url|primary `.affiliation_url`|
|15|affiliations_json|JSON array ของสังกัดทั้งหมดของเอกสาร (afid/name/city/country/affiliation_url)|
|16|issn|`.issn`|
|17|eissn|`.eissn`|
|18|isbn|`.isbn`|
|19|volume|`.volume`|
|20|issue|`.issue`|
|21|page_range|`.page_range`|
|22|article_number|`.article_number`|
|23|cover_date|`.cover_date` (รูปแบบ `YYYY-MM-DD`)|
|24|doi|`.doi`|
|25|citedby_count|`.citedby_count` (0 จริงคง 0, ไม่มีค่า=ว่าง)|
|26|authkeywords|parse `.authkeywords` JSON → `"kw1; kw2"` (unparseable → ว่าง)|
|27|fund_sponsor|`.fund_sponsor`|
|28|cite_score_status|`scopus_source_metrics.cite_score_status` (แถว metric_year ล่าสุด, doc_type='all')|
|29|cite_score_rank|`.cite_score_rank`|
|30|cite_score_percentile|`.cite_score_percentile`|
|31|journal_tier_bucket|derived จาก percentile (≥90 T1 / ≥75 Q1 / ≥50 Q2 / ≥25 Q3 / >0 Q4) — สูตรเดียวกับหน้า search|
|32|cite_score_quartile|`.cite_score_quartile` (uppercase)|
|33|publication_year|`benchmark_documents.pub_year`|
|34|eid|`.eid`|
|35|scopus_url|= `.scopus_link` (benchmark ไม่มีคอลัมน์ scopus_url แยก — mapping note)|
|36|doi_url|= `.doi` (benchmark ไม่มีคอลัมน์ doi_url แยก)|

filename: `scopus-benchmark-documents-{kku|thailand}-{from}-{to}.csv`.

## 3. GET `/api/v1/admin/scopus/benchmark/top-journals?year=YYYY`
BE มี endpoint นี้ (read-only) แต่ **รายงานผู้บริหารปัจจุบันไม่เรียกใช้** — คงไว้สำหรับส่วนขยายภายหลัง.

## 4. สิ่งที่ **ไม่** อยู่ในสัญญานี้
ไม่มี migration ใหม่, ไม่แตะ ingest/harvest/dashboard/research-search, ไม่ auto harvest/refresh,
ไม่สร้าง citation snapshot/backfill/yearly model, ไม่เพิ่ม timestamp ปลอมเพื่อสื่อความสด.
