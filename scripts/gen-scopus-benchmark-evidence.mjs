// DEV-ONLY evidence generator for the Scopus benchmark executive report harness.
//
// Runs the SAME fixture builders the harness renders (app/dev/scopus-benchmark-report/
// fixtures.mjs) through the SAME pure report lib the app exports with
// (app/lib/scopus_benchmark_report.mjs), so the regenerated CSV evidence is
// byte-for-byte what the app's export buttons would produce for that dataset —
// "screenshot == exported CSV, one dataset".
//
// It ALSO asserts fixture fidelity (R5 follow-up): for every scenario/year no level
// may show a citation cohort or classified/doc-type denominator larger than its
// official count, doc-type counts must sum to docs, and readiness must match the
// count/observed relationship. Fails loudly (exit 1) if any invariant breaks.
//
// Usage:  node scripts/gen-scopus-benchmark-evidence.mjs [--write]
//   (no flag) → check invariants + print the CSVs to stdout (dry run)
//   --write   → also overwrite the two scopebad CSVs in the evidence folder

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildFull, insightsFor, windowComparison, CURRENT_YEAR } from "../app/dev/scopus-benchmark-report/fixtures.mjs";
import { buildComparisonCsv, buildYearlyCsv, selectReportYear } from "../app/lib/scopus_benchmark_report.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const EVIDENCE_DIR = join(HERE, "..", "docs", "scopus-benchmark-executive-review-evidence");
const WRITE = process.argv.includes("--write");
const DEFAULT_WINDOW_FROM = CURRENT_YEAR - 14;

const ALL_SCENARIOS = ["normal", "partial", "ytd", "mismatch", "scopebad", "oldonly", "blockednew"];
const LEVELS = [
  ["faculty", "faculty", "faculty"],
  ["kku", "university", "university"],
  ["thailand", "country", "country"],
];

// ── fidelity invariants ───────────────────────────────────────────────────────
const failures = [];
function check(cond, message) {
  if (!cond) failures.push(message);
}

for (const scenario of ALL_SCENARIOS) {
  const full = buildFull(scenario);
  const thailandMissing = scenario === "partial";
  const facultyMismatch = scenario === "mismatch";
  for (const row of full.years) {
    const year = row.year;
    const meta = full.year_meta[year] || {};
    const insights = insightsFor(year, { full, thailandMissing, facultyMismatch });
    for (const [lvlKey, rowKey, metaKey] of LEVELS) {
      const status = meta?.[metaKey]?.status;
      const rawCount = row[rowKey];
      const count = status === "available" && Number.isFinite(Number(rawCount)) ? Number(rawCount) : null;
      const level = insights.levels[lvlKey];
      if (count === null) continue; // blocked/missing levels render unavailable — nothing to reconcile
      if (!level?.available) continue;
      const q = level.quartile || {};
      const classified = ["t1", "q1", "q2", "q3", "q4"].reduce((s, k) => s + Number(q[k] || 0), 0);
      const docSum = ["article", "conference", "other"].reduce((s, k) => s + Number(level.doctypes?.[k] || 0), 0);
      const tag = `${scenario}/${year}/${lvlKey}`;
      check(level.citations.cohort_docs <= count, `${tag}: cohort ${level.citations.cohort_docs} > count ${count}`);
      check(level.citations.known_docs <= level.citations.cohort_docs, `${tag}: known ${level.citations.known_docs} > cohort ${level.citations.cohort_docs}`);
      check(classified <= count, `${tag}: classified ${classified} > count ${count}`);
      check(docSum === level.docs, `${tag}: doctypes sum ${docSum} != docs ${level.docs}`);
      check(level.docs <= count, `${tag}: observed docs ${level.docs} > count ${count}`);
      check(classified + Number(q.unclassified_journal || 0) + Number(q.excluded_non_journal || 0) === level.docs, `${tag}: journal+nonjournal split != docs ${level.docs}`);
      const wantCountReady = !(facultyMismatch && lvlKey === "faculty");
      check(!!level.readiness.metrics.count.ready === wantCountReady, `${tag}: count.ready ${level.readiness.metrics.count.ready} expected ${wantCountReady}`);
    }
  }
}

if (failures.length) {
  console.error("FIXTURE FIDELITY: FAIL");
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`FIXTURE FIDELITY: PASS (${ALL_SCENARIOS.length} scenarios, all years, all available levels)`);

// ── regenerate scopebad CSV evidence exactly as the app export buttons do ──────
function scopebadExports() {
  const full = buildFull("scopebad");
  // The dashboard windows to DEFAULT_WINDOW_FROM..CURRENT_YEAR then picks the default year.
  const windowed = windowComparison(full, { year_from: DEFAULT_WINDOW_FROM, year_to: CURRENT_YEAR });
  const reportYear = selectReportYear(windowed.year_meta, CURRENT_YEAR)?.year;
  const scope = full.report_scope;
  const rows = [...full.years].sort((a, b) => a.year - b.year);
  const reportRow = rows.find((r) => Number(r.year) === Number(reportYear));
  const reportMeta = full.year_meta[reportYear];
  const insights = insightsFor(reportYear, { full });

  // exportComparison(): report-year comparison + citations
  const comparisonCsv = buildComparisonCsv({ reportYear, row: reportRow, meta: reportMeta, insights, scope });
  // exportYearly(): the visible trend range (default 5 years ending at reportYear)
  const trendRange = 5;
  const start = reportYear - trendRange + 1;
  const visibleRows = rows.filter((r) => Number(r.year) >= start && Number(r.year) <= reportYear);
  const yearlyCsv = buildYearlyCsv({ rows: visibleRows, yearMeta: full.year_meta, scope });
  return { reportYear, comparisonCsv, yearlyCsv };
}

const { reportYear, comparisonCsv, yearlyCsv } = scopebadExports();
console.log(`\nscopebad reportYear = ${reportYear}\n`);

const targets = [
  ["comparison-scopebad.csv", comparisonCsv],
  ["yearly-scopebad.csv", yearlyCsv],
];
for (const [name, contents] of targets) {
  if (WRITE) {
    // Prepend a UTF-8 BOM so Excel opens the Thai headers correctly (matches the
    // app's Blob download which also prepends "﻿").
    writeFileSync(join(EVIDENCE_DIR, name), "﻿" + contents, "utf8");
    console.log(`wrote ${name}`);
  } else {
    console.log(`----- ${name} -----\n${contents}\n`);
  }
}
