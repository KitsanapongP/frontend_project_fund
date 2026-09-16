# Scopus Benchmark — agreed FE/BE response contract (executive redesign)

วันที่ตกลง: 2026-09-14 · ผู้ implement: agent · อ้างอิง handoff §9 A/B/D และ §4/§5 E2

ข้อกำหนดทั้งหมด **additive** — คง field เดิมเพื่อ backward compatibility ไม่เปลี่ยนความหมายของ field เดิมโดยเงียบ property ใหม่ทั้งหมดต่อท้าย ไม่ลบของเดิม

## 1. GET /api/v1/admin/scopus/benchmark/comparison?year_from&year_to (หรือ years_back)

เดิมส่ง `data.years[]`, `data.faculty_metric`, `data.faculty_scope`, `data.university_scope`, `data.country_scope` — **คงไว้ทั้งหมด**

เพิ่มใน `data`:

```jsonc
"report_scope": {
  "subject_area": "COMP",
  "faculty_scope_id": 3, "university_scope_id": 1, "country_scope_id": 2
},
"available_years": {            // ปีที่ "มี snapshot" แยกต่อระดับ (รวม zero จริง)
  "faculty": [2020, 2021, ...], // faculty = ปีที่มี snapshot (ยังไม่การันตี readiness)
  "university": [...],
  "country": [...]
},
"year_meta": {                  // สถานะรายปี×ระดับ ในช่วงที่ query
  "2025": {
    "faculty":    { "status": "available|missing|blocked", "snapshot_exists": true, "snapshot_at": "2026-09-03T20:10:00Z"|null, "reason": "" },
    "university": { "status": "available|missing",          "snapshot_exists": true, "snapshot_at": ..., "reason": "" },
    "country":    { "status": "available|missing",          "snapshot_exists": true, "snapshot_at": ..., "reason": "" }
  },
  ...
}
```

กติกา status:
- `snapshot_exists`: มีแถว count snapshot ของปี×ระดับนั้น (zero จริงก็ true)
- faculty: `blocked` เมื่อ faculty metric ไม่ ready / ปีอยู่ใน `benchmark_years_missing` / มี KKU harvest ทำงานอยู่ (คงกติกา FacultyMetricCoverage เดิม) → ในกรณีนี้ค่า `years[].faculty` เดิมจะเป็น null อยู่แล้ว; `available` เมื่อมี snapshot และผ่าน readiness; `missing` เมื่อไม่มี snapshot
- university/country: `available` เมื่อ snapshot_exists, `missing` เมื่อไม่มี (ไม่บล็อกกันข้ามระดับ)
- `available_years.faculty` = ปีที่ snapshot_exists เท่านั้น (ไม่ใช้ยืนยัน readiness — ให้ดู year_meta.status)
- scope id resolve จาก level/config ไม่ hardcode 1/2

FE ใช้ `year_meta` เลือก reportYear (ปี < ปีปัจจุบัน ล่าสุดที่ faculty=available) ตาม §4

## 2. GET /api/v1/admin/scopus/benchmark/insights?year=YYYY

เดิมแต่ละ level ส่ง `available, docs, oa_pct, intl_pct, avg_cite, quartile{t1,q1,q2,q3,q4,unclassified}, doctypes{article,conference,other}` และ top-level `quartile_coverage{classified,total}` — **คงไว้ทั้งหมด** (`avg_cite` legacy ไม่เปลี่ยนความหมาย = AVG(citedby_count) รวม NULL→0 เดิม)

**เปลี่ยนพฤติกรรมสำคัญ (ตาม §9 B):** cohort ของ level `faculty` เปลี่ยนจาก flag `is_faculty` มาใช้ **verified faculty EID selection ชุดเดียวกับ official count** (distinct EID, KKU COMP membership, matched author ผ่าน scopus_documents/authors/affiliations, AF-ID 60017165/60280609, employment date เมื่อมี) — เพื่อให้ cohort ตรงกับ KPI count `is_faculty` ยังคงเก็บใน DB แต่ไม่ใช้เป็นนิยาม faculty ของ insights

เพิ่มในแต่ละ level:

```jsonc
"citations": {
  "total": 128 | null,          // SUM(citedby_count) ของ distinct docs ที่ค่า != NULL; null เมื่อ known_docs=0
  "average": 2.4 | null,        // total / known_docs (รวมค่าศูนย์จริงในตัวหาร); null เมื่อ known_docs=0
  "known_docs": 53,             // docs ที่ citedby_count IS NOT NULL
  "cohort_docs": 72,            // distinct docs ใน cohort ปีตีพิมพ์นั้น
  "unknown_docs": 19,           // cohort_docs - known_docs
  "coverage_status": "complete|partial|none",
  "denominator_policy": "known_citation_docs",
  "updated_at": null,           // ไม่มี timestamp ที่พิสูจน์ว่าเป็นการ refresh citation จริง → null (ไม่ใช้ row_updated แทน)
  "update_range": null,
  "freshness_status": "unknown" // ผู้ใช้ตกลงใช้ข้อมูลเท่าที่มี
},
"readiness": {
  "comparison_ready": true,     // ใช้เปิด narrative/gap ได้หรือไม่
  "active_run": false,          // มี harvest ที่กระทบ level นี้อยู่
  "reasons": ["faculty metric not ready", ...]  // เหตุผลเมื่อ not ready
}
```

กติกา citation (ตาม §8/§9 D):
- known_docs=0 → total=null, average=null (ไม่ใช่ 0)
- known_docs>0 และทุกค่าเป็นศูนย์จริง → total=0, average=0
- coverage_status: `none` เมื่อ cohort_docs=0; `complete` เมื่อ unknown_docs=0 และ cohort_docs>0; `partial` เมื่อ known>0 และ unknown>0
- คำนวณจาก distinct document cohort เดียวกับ insights ไม่ join metrics (กัน duplicate) ใช้ field ที่เก็บไว้ ไม่เรียก Scopus เพิ่ม ไม่ทำ citation snapshots/backfill/yearly model
- ไม่บวกยอดสามระดับเป็น grand total (cohorts ทับซ้อน) — FE บังคับ caption

กติกา readiness (ตาม §9 B/C, per-level ไม่ใช่ boolean เดียว):
- faculty: ready = faculty metric ready และปีนี้ไม่อยู่ใน benchmark_years_missing และไม่มี KKU harvest ทำงาน
- university (kku): ready = available และไม่มี KKU harvest ทำงาน
- country (thailand): ready = available (Thailand harvest กระทบเฉพาะ Thailand)
- ไม่มี threshold coverage % ที่ตั้งเองเพื่อรับรองความเป็นตัวแทน

## 3. สิ่งที่ **ไม่** ทำในงานนี้

ไม่เพิ่ม migration, ไม่เขียนตารางหลัก scopus_*/benchmark, ไม่แตะ ingest/harvest/dashboard/research-search, ไม่ auto harvest/refresh, ไม่ deploy/merge/migrate production, ไม่สร้าง citation snapshots/backfill/yearly citation model, ไม่เพิ่ม timestamp ใหม่เพื่อสร้างภาพความสดของข้อมูล
