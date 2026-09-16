import test from "node:test";
import assert from "node:assert/strict";
import {
  isUsable,
  shareOf,
  highTierShare,
  growthInfo,
  selectReportYear,
  buildFindings,
  buildYearlyCsv,
  buildComparisonCsv,
  normalizeReportRow,
  observedRate,
  canCompareMetric,
  resolveBootstrapFloor,
  formatPoints,
} from "../scopus_benchmark_report.mjs";

test("isUsable treats a real zero as usable but rejects null/NaN", () => {
  assert.equal(isUsable(0), true);
  assert.equal(isUsable(12), true);
  assert.equal(isUsable(null), false);
  assert.equal(isUsable(undefined), false);
  assert.equal(isUsable(NaN), false);
  assert.equal(isUsable(""), false);
});

test("shareOf returns null when the denominator is zero or missing", () => {
  assert.equal(shareOf(10, 0), null);
  assert.equal(shareOf(10, null), null);
  assert.equal(shareOf(null, 100), null);
  assert.equal(shareOf(24, 100), 24);
});

test("highTierShare adds T1 once and returns null with no classified journals", () => {
  assert.equal(highTierShare({ t1: 1, q1: 1, q2: 2, q3: 3, q4: 3 }), 40);
  assert.equal(highTierShare({ t1: 0, q1: 0, q2: 0, q3: 0, q4: 0 }), null);
  assert.equal(highTierShare(null), null);
});

test("growthInfo never yields Infinity and never invents a decline", () => {
  assert.deepEqual(growthInfo(60, 50), { status: "pct", delta: 10, pct: 20 });
  assert.deepEqual(growthInfo(5, 0), { status: "from_zero", delta: 5 });
  assert.deepEqual(growthInfo(0, 0), { status: "flat", delta: 0 });
  assert.deepEqual(growthInfo(10, null), { status: "unknown" });
});

test("formatPoints reports a rounded-zero difference as near-equal, not 0.0", () => {
  assert.match(formatPoints(0.02), /ใกล้เคียงกัน/);
  assert.match(formatPoints(5), /\+5\.0 จุดเปอร์เซ็นต์/);
  assert.match(formatPoints(-4.4), /−4\.4 จุดเปอร์เซ็นต์/);
});

test("selectReportYear prefers the latest ended year the faculty is ready for", () => {
  const meta = {
    2026: { faculty: { status: "blocked" }, university: { status: "available" }, country: { status: "available" } },
    2025: { faculty: { status: "available" }, university: { status: "available" }, country: { status: "available" } },
    2024: { faculty: { status: "available" }, university: { status: "available" }, country: { status: "missing" } },
  };
  assert.deepEqual(selectReportYear(meta, 2026), { year: 2025, state: "faculty_ready", isCurrentYear: false });
});

test("selectReportYear falls back to KKU/country when the faculty is not ready", () => {
  const meta = {
    2025: { faculty: { status: "blocked" }, university: { status: "available" }, country: { status: "missing" } },
  };
  assert.deepEqual(selectReportYear(meta, 2026), { year: 2025, state: "faculty_not_ready", isCurrentYear: false });
});

test("selectReportYear uses the current year as cumulative when nothing ended is available", () => {
  const meta = { 2026: { faculty: { status: "available" }, university: { status: "available" }, country: { status: "missing" } } };
  assert.deepEqual(selectReportYear(meta, 2026), { year: 2026, state: "current_cumulative", isCurrentYear: true });
});

test("selectReportYear returns null when no snapshot exists", () => {
  const meta = { 2025: { faculty: { status: "missing" }, university: { status: "missing" }, country: { status: "missing" } } };
  assert.equal(selectReportYear(meta, 2026), null);
});

test("buildFindings states growth-with-shrinking-share as a mathematical relation", () => {
  const findings = buildFindings({
    isCurrentYear: false,
    reportYear: 2025,
    facultyCount: 72,
    prevFacultyCount: 60,
    kkuCount: 300,
    prevKkuCount: 240,
    facultyReady: true,
  });
  assert.equal(findings.length >= 1, true);
  assert.match(findings[0], /ผลงานคณะเพิ่ม 12 ผลงาน/);
  assert.match(findings[0], /สัดส่วนต่อ KKU ลด/);
  assert.doesNotMatch(findings.join(" "), /ยอดเยี่ยม|โดดเด่น|ดีกว่า/);
});

test("buildFindings for the current year is cumulative with no YoY", () => {
  const findings = buildFindings({ isCurrentYear: true, reportYear: 2026, facultyCount: 40 });
  assert.match(findings[0], /ข้อมูลสะสมปี 2026/);
  assert.doesNotMatch(findings.join(" "), /จากปีก่อน|%\)/);
});

test("buildFindings reports a data limitation when faculty is not ready", () => {
  const findings = buildFindings({ isCurrentYear: false, reportYear: 2025, facultyReady: false });
  assert.match(findings[0], /ยังไม่มีตัวเลขผลงานคณะที่พร้อม/);
});

test("buildFindings only compares high-tier journals when both sides are ready", () => {
  const base = { isCurrentYear: false, reportYear: 2025, facultyCount: 72, prevFacultyCount: 60, kkuCount: 300, prevKkuCount: 300, facultyReady: true };
  const faculty = { available: true, readiness: { metrics: { quality: { ready: true } } }, quartile: { t1: 5, q1: 10, q2: 5, q3: 5, q4: 5 } };
  const kkuReady = { available: true, readiness: { metrics: { quality: { ready: true } } }, quartile: { t1: 2, q1: 8, q2: 5, q3: 10, q4: 5 } };
  const kkuNotReady = { available: true, readiness: { metrics: { quality: { ready: false } } }, quartile: { t1: 2, q1: 8, q2: 5, q3: 10, q4: 5 } };

  const withGap = buildFindings({ ...base, faculty, kku: kkuReady });
  assert.equal(withGap.some((f) => /T1–Q2/.test(f)), true);

  const noGap = buildFindings({ ...base, faculty, kku: kkuNotReady });
  assert.equal(noGap.some((f) => /T1–Q2/.test(f)), false);
});

test("normalizeReportRow blanks a level whose snapshot is not available, keeps a real zero", () => {
  // R4 reviewer payload: raw legacy default-0 + missing metadata must become null.
  const norm = normalizeReportRow(
    { year: 2025, faculty: 0, university: 100, country: 0 },
    { faculty: { status: "missing" }, university: { status: "available" }, country: { status: "missing" } },
  );
  assert.equal(norm.faculty, null);
  assert.equal(norm.university, 100);
  assert.equal(norm.country, null);
  // A real zero with an available snapshot stays 0, not null.
  const zero = normalizeReportRow({ year: 2025, faculty: 0, university: 10, country: 0 }, {
    faculty: { status: "available" }, university: { status: "available" }, country: { status: "available" },
  });
  assert.equal(zero.faculty, 0);
});

test("buildYearlyCsv writes blanks (not 0) for missing snapshots with per-row dates", () => {
  const csv = buildYearlyCsv({
    rows: [
      { year: 2025, faculty: 0, university: 100, country: 0 },
      { year: 2026, faculty: null, university: 214, country: null },
    ],
    yearMeta: {
      2025: { faculty: { status: "missing" }, university: { status: "available", snapshot_at: "2026-09-03T00:00:00Z" }, country: { status: "missing" } },
      2026: { faculty: { status: "blocked" }, university: { status: "available" }, country: { status: "missing" } },
    },
    scope: { subject_area: "COMP" },
  });
  const lines = csv.split("\n");
  // R4 repro: raw 0 for faculty/country with missing status → blank, share blank, never 0.
  assert.equal(lines.find((l) => l.startsWith("2025,")), "2025,,missing,,100,available,2026-09-03T00:00:00Z,,missing,,");
  assert.equal(lines.find((l) => l.startsWith("2026,")), "2026,,blocked,,214,available,,,missing,,");
});

test("buildComparisonCsv normalizes missing counts and carries status/coverage", () => {
  const csv = buildComparisonCsv({
    reportYear: 2025,
    row: { faculty: 0, university: 300, country: 0 },
    meta: { faculty: { status: "missing" }, university: { status: "available" }, country: { status: "missing" } },
    insights: {
      levels: {
        faculty: { available: false, readiness: { comparison_ready: false, metrics: { count: { ready: false } } }, citations: { total: null, average: null, known_docs: 0, cohort_docs: 0, coverage_status: "none" } },
        kku: { available: true, docs: 300, oa_pct: 60, intl_pct: 40, oa: { known: 300, positive: 180, unknown: 0 }, intl: { known: 300, positive: 120, unknown: 0 }, readiness: { comparison_ready: true, metrics: { count: { ready: true } } }, quartile: { t1: 2, q1: 8, q2: 5, q3: 10, q4: 5 }, citations: { total: 900, average: 3, known_docs: 300, cohort_docs: 300, coverage_status: "complete", freshness_status: "unknown" } },
        thailand: { available: false, readiness: { comparison_ready: false, metrics: { count: { ready: false } } }, citations: { total: null, average: null, known_docs: 0, cohort_docs: 0, coverage_status: "none" } },
      },
    },
    scope: { subject_area: "COMP" },
  });
  // Missing faculty/country counts are blank, never 0.
  assert.match(csv, /จำนวนผลงาน,,300,/);
  assert.match(csv, /สถานะข้อมูล \(snapshot\),missing,available,missing/);
  assert.match(csv, /harvest พร้อมเทียบ \(count_ready\),false,true,false/);
  assert.match(csv, /ห้ามรวมยอด/);
});

test("observedRate uses positive/known and excludes unknown from the denominator (R2-2)", () => {
  const level = { available: true, oa_pct: 20, intl_pct: 30, oa: { known: 40, positive: 20, unknown: 60 }, intl: { known: 60, positive: 30, unknown: 40 } };
  const oa = observedRate(level, "oa");
  const intl = observedRate(level, "intl");
  assert.equal(oa.value, 50); // 20/40, NOT the legacy 20/100
  assert.equal(intl.value, 50); // 30/60, NOT 30/100
  assert.equal(oa.known, 40);
  assert.equal(oa.unknown, 60);
  // Legacy fallback (no coverage counts) uses the docs-denominator rate as-is.
  const legacy = observedRate({ available: true, oa_pct: 20 }, "oa");
  assert.equal(legacy.value, 20);
  assert.equal(legacy.known, null);
});

test("comparison CSV OA/intl match the display model (positive/known), not the legacy docs rate (R2-2)", () => {
  const csv = buildComparisonCsv({
    reportYear: 2025,
    row: { faculty: 100, university: 100, country: 100 },
    meta: { faculty: { status: "available" }, university: { status: "available" }, country: { status: "available" } },
    insights: {
      levels: {
        faculty: { available: true, docs: 100, oa_pct: 20, intl_pct: 30, oa: { known: 40, positive: 20, unknown: 60 }, intl: { known: 60, positive: 30, unknown: 40 }, readiness: { metrics: { count: { ready: true }, oa: { ready: false }, intl: { ready: false } } }, quartile: {}, citations: {} },
        kku: { available: true, docs: 100, oa_pct: 50, intl_pct: 50, oa: { known: 100, positive: 50, unknown: 0 }, intl: { known: 100, positive: 50, unknown: 0 }, readiness: { metrics: { count: { ready: true }, oa: { ready: true }, intl: { ready: true } } }, quartile: {}, citations: {} },
        thailand: { available: false, citations: {} },
      },
    },
    scope: { subject_area: "COMP" },
  });
  // faculty OA = 20/40 = 50.0 (screen model), NOT legacy 20.0; known/unknown shown.
  assert.match(csv, /Open Access[^\n]*positive\/known[^\n]*,50\.0,50\.0,/);
  assert.match(csv, /Open Access known\/unknown,40\/60,100\/0,/);
  assert.match(csv, /ต่างประเทศ[^\n]*positive\/known[^\n]*,50\.0,50\.0,/);
});

test("canCompareMetric requires both sides ready for that metric (R2-1)", () => {
  const ready = { available: true, readiness: { metrics: { quality: { ready: true } } } };
  const notReady = { available: true, readiness: { metrics: { quality: { ready: false } } } };
  assert.equal(canCompareMetric(ready, ready, "quality"), true);
  assert.equal(canCompareMetric(ready, notReady, "quality"), false);
  assert.equal(canCompareMetric(ready, { available: false }, "quality"), false);
});

test("resolveBootstrapFloor loads down to the earliest ended snapshot year, not the latest (R4-1)", () => {
  // A recent BLOCKED faculty snapshot (2025) plus an older ready one (2010): the floor
  // must be 2010 so BOTH are loaded and readiness — not snapshot existence — decides.
  assert.equal(resolveBootstrapFloor({ faculty: [2025, 2010], university: [2025, 2010] }, 2026), 2010);
  // old-only
  assert.equal(resolveBootstrapFloor({ faculty: [2010], university: [2010], country: [2010] }, 2026), 2010);
  // all recent → floor is the earliest recent ended year (widen only if before window)
  assert.equal(resolveBootstrapFloor({ faculty: [2020, 2021, 2022, 2023, 2024, 2025] }, 2026), 2020);
  // only the current year (no ended snapshot) → null (nothing to widen for)
  assert.equal(resolveBootstrapFloor({ faculty: [2026], university: [2026] }, 2026), null);
});

test("selectReportYear skips a blocked recent year for an older faculty-ready year (R4-1)", () => {
  // Once the window is widened to load both years, readiness decides: 2025 faculty is
  // blocked, 2010 is available → default must be 2010, not 2025.
  const meta = {
    2025: { faculty: { status: "blocked" }, university: { status: "available" }, country: { status: "available" } },
    2010: { faculty: { status: "available" }, university: { status: "available" }, country: { status: "available" } },
  };
  assert.deepEqual(selectReportYear(meta, 2026), { year: 2010, state: "faculty_ready", isCurrentYear: false });
});

test("selectReportYear falls back (never loops) when every faculty year is blocked (R4-1)", () => {
  const meta = {
    2025: { faculty: { status: "blocked" }, university: { status: "available" }, country: { status: "missing" } },
    2010: { faculty: { status: "blocked" }, university: { status: "available" }, country: { status: "missing" } },
  };
  // No faculty-ready year anywhere → latest ended year with a KKU snapshot (2025).
  assert.deepEqual(selectReportYear(meta, 2026), { year: 2025, state: "faculty_not_ready", isCurrentYear: false });
});

test("CSV withholds cross-scope comparison and records per-level subjects when scope is inconsistent (R3-1)", () => {
  const scope = { subject_area: "COMP", faculty_subject_area: "COMP", university_subject_area: "COMP", country_subject_area: "MEDI", consistent: false };
  const yearly = buildYearlyCsv({
    rows: [{ year: 2025, faculty: 72, university: 300, country: 3000 }],
    yearMeta: { 2025: { faculty: { status: "available" }, university: { status: "available" }, country: { status: "available" } } },
    scope,
  });
  // Per-level subjects recorded + warning; faculty_kku_pct blank (cross-scope withheld).
  assert.match(yearly, /คณะ=COMP · KKU=COMP · ประเทศไทย=MEDI/);
  assert.match(yearly, /ขอบเขตสามระดับไม่ตรงกัน/);
  assert.equal(yearly.split("\n").find((l) => l.startsWith("2025,")), "2025,72,available,,300,available,,3000,available,,");

  const comparison = buildComparisonCsv({
    reportYear: 2025,
    row: { faculty: 72, university: 300, country: 3000 },
    meta: { faculty: { status: "available" }, university: { status: "available" }, country: { status: "available" } },
    insights: { levels: { faculty: { available: true, docs: 72, quartile: {}, citations: {} }, kku: { available: true, docs: 300, quartile: {}, citations: {} }, thailand: { available: true, docs: 3000, quartile: {}, citations: {} } } },
    scope,
  });
  assert.match(comparison, /ประเทศไทย=MEDI/);
  assert.match(comparison, /ขอบเขตสามระดับไม่ตรงกัน/);
});
