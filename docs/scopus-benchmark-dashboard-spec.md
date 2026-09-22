# สเปก + แผน — หน้า Scopus Benchmark Dashboard (revamp เต็มรูปแบบ)

> เอกสารสั่งงานสำหรับ agent ที่จะลงมือ · ผู้ตรวจ (Claude อีกตัว) ใช้ไฟล์นี้เป็นเกณฑ์รีวิว
> เขียน: 2026-09-04 · ต่อยอดจาก roadmap `scopus-benchmark-dashboard-roadmap.md`

## บริบท (สถานะปัจจุบัน)
- หน้า `/admin/scopus-benchmark` deploy แล้ว (P1/P2/P4/P6 + P3 verified faculty + P5 facet counts + BE-2 affiliation) — main ทั้ง FE/BE เป็นล่าสุด
- ตาราง benchmark มีครบ: `scopus_benchmark_documents/authors/document_authors(+affiliation_id)/document_scopes/affiliations/count_snapshots`
- **Mockup ดีไซน์ที่ผ่านการเห็นชอบ (visual reference):** https://claude.ai/code/artifact/d43b8921-4214-4544-be2f-27ef718d1757
- **Design system:** ใช้ Academic Modern ของโปรเจกต์ (`.claude/skills/impeccable` DESIGN.md) — slate + accent น้ำเงิน `#2563eb`, Sarabun, การ์ดแบน 1px เงาเฉพาะ hover, จังหวะ 8px, tabular-nums · **ต้องแปลง mockup เป็น Tailwind/สไตล์ของโปรเจกต์ ไม่ก็อป inline CSS ดิบ**

## ขอบเขตการรัน (สำคัญ)
- โค้ด + เทสให้เสร็จบน local รันกับ **DB ทดสอบ** (`.env` = remote 147.50.227.17) เท่านั้น · **ห้าม deploy/migrate prod** (deploy ทำกับผู้ตรวจอีกรอบ)
- **ห้ามแตะ/เขียนตาราง dashboard** `scopus_documents/scopus_authors/scopus_document_authors/scopus_affiliations/scopus_source_metrics` — **อ่านได้ ไม่เขียน**
- **ไม่ merge main เอง** รอผู้ตรวจ

## หมายเหตุข้อมูลจริง (ทดสอบแล้วบน dev)
- Deep-dive ระดับ document มีจริง: **KKU (ทุกปี)** + **Thailand (2026 เท่านั้นบน dev)** + คณะ (subset is_faculty ใน KKU)
- Endpoint ต้อง **รองรับกรณี Thailand ไม่มีข้อมูลของปีนั้น** (คืน available:false) แล้ว UI ลดเหลือ คณะ vs KKU ได้อย่างสง่างาม
- CiteScore (`scopus_source_metrics`) coverage ~47% → ต้องรายงาน coverage ให้ UI แสดง

---

## ส่วนที่ 1 — Backend (branch `feature/scopus-benchmark-insights` แตกจาก main)

**ไม่มี migration** (อ่านตารางที่มีอยู่). เพิ่ม read-only service + endpoints.

### Endpoint A (มีอยู่แล้ว ไม่แก้): `GET /admin/scopus/benchmark/comparison`
คืน `years[]` (faculty/university/country ต่อปี) + `faculty_metric` — ใช้ทำ **KPI, กราฟแนวโน้ม 3 ระดับ, สัดส่วน%, participation** (participation = faculty/university ต่อปี คำนวณฝั่ง FE)

### Endpoint B (ใหม่): `GET /admin/scopus/benchmark/insights?year=YYYY`
Deep-dive ต่อระดับสำหรับปีที่เลือก. ระดับ = faculty (is_faculty ⊂ scope1) / kku (scope1) / thailand (scope2).
Response:
```json
{ "success": true, "data": {
  "year": 2026,
  "levels": {
    "faculty":  { "available": true, "docs": 59,   "oa_pct": 53, "intl_pct": 53, "avg_cite": 0.83,
                  "quartile": {"q1":27,"q2":8,"q3":2,"q4":13,"unclassified":9},
                  "doctypes": {"article":37,"conference":12,"other":10} },
    "kku":      { "available": true, "docs": 221, ... },
    "thailand": { "available": true, "docs": 3344, ... }
  },
  "quartile_coverage": { "classified": 1213, "total": 3624 }
}}
```
ถ้า scope นั้นไม่มี document ของปี → `{ "available": false }`

**นิยาม/สูตร (ทดสอบแล้ว — reuse):**
- ระดับ = join `scopus_benchmark_document_scopes bds` (scope_id 1=KKU, 2=Thailand) → `scopus_benchmark_documents d`; faculty = scope1 + `EXISTS(document_authors da WHERE da.document_id=d.id AND da.is_faculty=1)`
- `oa_pct` = 100 × SUM(openaccess_flag=1)/COUNT(*)
- `avg_cite` = AVG(citedby_count)
- `intl_pct` = % ของ doc ที่ `EXISTS(document_authors da JOIN benchmark_affiliations a ON a.id=da.affiliation_id WHERE da.document_id=d.id AND a.country NOT IN ('', 'Thailand') AND a.country IS NOT NULL)`
- `quartile` = join `scopus_source_metrics m ON m.source_id=d.source_id AND m.doc_type='all' AND m.metric_year = (SELECT MAX(metric_year) ... per source)`; นับตาม `cite_score_quartile` (Q1–Q4), ที่ไม่มี = unclassified
- `doctypes` = จับ `subtype_description`: Article / Conference Paper → conference / ที่เหลือ → other
- ทั้งหมด **filter `bds.pub_year = ?`**

### Endpoint C (ใหม่, เล็ก): `GET /admin/scopus/benchmark/top-journals?limit=8`
วารสารที่ผลงาน **KKU (scope1, ทุกปี)** ตีพิมพ์บ่อยสุด: `[{name, docs, avg_cite}]` (group by publication_name). *(context panel — priority ต่ำ ถ้าจะรวมใน insights ก็ได้)*

**ผ่าน:** `go build ./...` + `go test ./services` เขียว; ยิง endpoint จริงบน dev ได้ผลตรงกับ mockup (faculty Q1+Q2 70% / KKU 65% / Thailand 67%; intl 53/39/38; OA 53/57/55) · ไม่เขียนตาราง dashboard (row count เท่าเดิม)

---

## ส่วนที่ 2 — Frontend (branch `feature/scopus-benchmark-dashboard` แตกจาก main)

แทนที่ **แท็บ "ผลเปรียบเทียบ"** ใน `AdminScopusBenchmark.js` ด้วย dashboard เต็ม (เก็บแท็บ "ตั้งค่า & ดึงข้อมูล" เดิมไว้ทั้งหมด — เป็นฝั่ง operational)

**API client (`app/lib/api.js`):** เพิ่ม `scopusBenchmarkAPI.insights({year})` และ `topJournals({limit})`

**โครงหน้า (ตาม mockup — เรียงจากบนลงล่าง):**
1. **Lead band** — พาดหัว insight + 2 standout (Q1+Q2 / ความร่วมมือต่างชาติ) มินิบาร์ คณะ/KKU/Thailand ไฮไลต์คณะ + บรรทัด takeaway (จาก insights ปีล่าสุดที่มีข้อมูล)
2. **KPI 4 ตัว** — คณะ/KKU/Thailand (ปีล่าสุด จาก comparison) + สัดส่วนคณะ/KKU · มี YoY delta
3. **แนวโน้มรายปี** (2fr) — 3 เส้น count/share สลับได้ + **year filter (dropdown + preset)** ขับกราฟ time-series · **(1fr) คุณภาพวารสาร** 3 แถบ (คณะ/KKU/Thailand ปีที่เลือก)
4. **thirds 3-level (ปีที่เลือก):** Open Access · ความร่วมมือต่างชาติ · ประเภทผลงาน
5. **split:** วารสารเด่น (KKU) · การมีส่วนร่วมของคณะ (คณะ÷KKU รายปี จาก comparison)
6. **แถบรายงาน/Export**
- **ทุก panel + KPI มีไอคอน info (ⓘ) + tooltip** อธิบาย "คืออะไร/เทียบอะไร" (วาด SVG ไม่ใช้ emoji; hover + keyboard focus)

**พฤติกรรม/สถานะ:**
- Year filter (dropdown from/to + preset "5 ปีล่าสุด/10 ปี") ขับ **กราฟแนวโน้ม + participation**; ส่วน deep-dive (quartile/OA/intl/doctypes) ผูกกับ **ปีเดียว** (ปีล่าสุดของช่วง หรือ dropdown แยก) → เรียก `insights?year=`
- **Thailand ไม่มีข้อมูลปีนั้น** (`available:false`) → deep-dive ลดเหลือ คณะ vs KKU + ป้ายเล็กบอก "Thailand ยังไม่มีข้อมูลปีนี้"
- แสดง **coverage CiteScore** (เช่น "อิงวารสารที่มีค่า CiteScore X%")
- states: loading (skeleton), error, empty (ยังไม่มีข้อมูล → ชี้ไปแท็บตั้งค่า)
- **bilingual-safe**, responsive (คอลัมน์ยุบ), ปี 2026 ป้าย "ข้อมูลบางส่วน"

**ผ่าน:** `next build` ผ่าน; หน้าเปิดได้ login admin; lead/KPI/กราฟ 3 ระดับ/tooltip ครบและตรงข้อมูล insights จริง; year filter ใช้เมาส์ได้และกราฟขยับ; เคส Thailand-missing ไม่พัง

---

## ลำดับ + ข้อกำหนด
1. **BE ก่อน** (endpoint B/C) → ยืนยัน response ด้วยข้อมูล dev จริง
2. **FE** ต่อ endpoint จริง (ไม่ mock)
3. commit เป็นก้อนต่อส่วน · **ไม่ merge main** · ส่งผู้ตรวจพร้อม: diff, ผลยิง endpoint จริง, screenshot หน้า, ยืนยัน dashboard tables ไม่ถูกแตะ
4. งานแยก (ไม่รวมรอบนี้): **BE-3 CiteScore top-up**, **BE-1 citation refresh**, harvest Thailand ปีอื่นเพิ่ม (ถ้าจะให้ deep-dive หลายปี)

## Design tokens (จาก DESIGN.md — ใช้อ้างอิง)
accent `#2563eb` / deep `#1d4ed8` · ink `#0f172a` slate `#334155` muted `#64748b` · border `#cbd5e1`/`#e2e8f0` · canvas `#f5f7fb` surface `#fff` subtle `#f1f5f9` · series: คณะ=accent, KKU=sky `#0ea5e9`, Thailand=slate `#94a3b8` · quartile ramp น้ำเงิน→เทา · semantic green `#16a34a` (คณะนำ/positive) · Sarabun · radius 8px · metric 36px/700
