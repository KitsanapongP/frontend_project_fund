// DEV-ONLY fixture data for the Scopus benchmark executive report harness.
// Pure JS (no React) so the harness page AND the evidence generator
// (scripts/gen-scopus-benchmark-evidence.mjs) import the SAME builders — that is
// what makes "screenshot == exported CSV, one dataset" true. Numbers are invented
// and clearly labelled in the harness; nothing here is live data.
//
// Fidelity rule (R5 follow-up): every level's detail is DERIVED from that year's
// official count so the fixture can never contradict itself — the citation cohort
// and the classified/doc-type denominators are always ≤ the count, doc-type shares
// never exceed 100%, and readiness reflects the count/observed relationship. When a
// harvest is incomplete (mismatch), the observed set is a strict subset of the
// count and every affected metric is marked not-ready with a reason.

const CURRENT_YEAR = new Date().getFullYear();

// Split `total` across weighted buckets into whole numbers that sum EXACTLY to
// `total` (the last bucket absorbs the rounding remainder, clamped at 0).
function distribute(total, weights) {
  const keys = Object.keys(weights);
  const sumW = keys.reduce((sum, key) => sum + weights[key], 0) || 1;
  const out = {};
  let acc = 0;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) out[key] = Math.max(0, total - acc);
    else {
      const value = Math.max(0, Math.round((weights[key] / sumW) * total));
      out[key] = value;
      acc += value;
    }
  });
  return out;
}

const emptyLevel = (reason) => {
  const reasons = reason ? [reason] : [];
  return {
    available: false,
    citations: { total: null, average: null, known_docs: 0, cohort_docs: 0, unknown_docs: 0, coverage_status: "none", denominator_policy: "known_citation_docs", updated_at: null, update_range: null, freshness_status: "unknown" },
    // A full per-metric readiness map (mirroring the BE) so a range that includes an
    // unavailable year propagates a not-ready reason for that year (§3.2).
    readiness: {
      comparison_ready: false, active_run: false, snapshot_mismatch: false, expected_docs: null, observed_docs: 0, reasons,
      metrics: {
        count: { ready: false, reasons },
        quality: { ready: false, reasons },
        oa: { ready: false, reasons },
        intl: { ready: false, reasons },
        citations: { ready: false, reasons },
      },
    },
  };
};

// Build a fully self-consistent level insight from a single official `count`
// (== the comparison-table "จำนวนผลงาน" for the same level/year). Every derived
// figure sums/relates back to the observed docs:
//   docs (observed) = count − shortfall (shortfall = 0 unless mismatch)
//   journals = docs − non-journal ; classified = journals − unclassified_journal
//   doctypes: article = journals, conference+other = non-journal (→ sum = docs)
//   citations.cohort_docs = docs ; known_docs = docs − unknown (unknown = 0 unless mismatch)
function levelFromCount(count, { oaPct, intlPct, avg, tierWeights, nonJournalPct, unclassifiedJournalPct = 0, mismatch = false }) {
  if (!Number.isFinite(count) || count <= 0) return emptyLevel("no documents for this year");

  const shortfall = mismatch ? Math.max(1, Math.round(count * 0.05)) : 0;
  const docs = count - shortfall; // observed / harvested docs — this is level.docs everywhere

  const nonJournal = Math.round(docs * nonJournalPct); // conference / book work
  const journalDocs = docs - nonJournal;
  // Journals still awaiting a CiteScore classification. Even without a full harvest
  // mismatch a level may carry some (→ its quality metric reads not-ready), so the
  // per-metric withholding path (R2-1) stays exercised with internally-consistent counts.
  const unclassifiedJournal = mismatch ? Math.max(1, Math.round(journalDocs * 0.1)) : Math.round(journalDocs * unclassifiedJournalPct);
  const classified = journalDocs - unclassifiedJournal;
  const tiers = distribute(classified, tierWeights); // { t1, q1, q2, q3, q4 } summing to classified

  const conference = Math.round(nonJournal * 0.8);
  const other = nonJournal - conference;
  const doctypes = { article: journalDocs, conference, other };

  const citeUnknown = mismatch ? Math.max(1, Math.round(docs * 0.12)) : 0;
  const knownCite = docs - citeUnknown;
  const total = Math.round(avg * knownCite);

  const oaUnknown = mismatch ? Math.max(1, Math.round(docs * 0.14)) : 0;
  const intlUnknown = mismatch ? Math.max(1, Math.round(docs * 0.08)) : 0;
  const oaKnown = docs - oaUnknown;
  const intlKnown = docs - intlUnknown;

  const mismatchReason = `harvest incomplete: count snapshot has ${count} docs but ${docs} were harvested for this year`;

  return {
    available: true,
    docs,
    oa_pct: oaPct,
    intl_pct: intlPct,
    avg_cite: avg,
    quartile: { ...tiers, unclassified: nonJournal + unclassifiedJournal, unclassified_journal: unclassifiedJournal, excluded_non_journal: nonJournal, unresolved: 0 },
    doctypes,
    oa: { known: oaKnown, positive: Math.round((oaPct / 100) * oaKnown), unknown: oaUnknown },
    intl: { known: intlKnown, positive: Math.round((intlPct / 100) * intlKnown), unknown: intlUnknown },
    citations: { total, average: avg, known_docs: knownCite, cohort_docs: docs, unknown_docs: citeUnknown, coverage_status: citeUnknown === 0 ? "complete" : "partial", denominator_policy: "known_citation_docs", updated_at: null, update_range: null, freshness_status: "unknown" },
    // Mirror BE per-metric readiness: base (count) ready = harvest complete; each
    // metric also needs its own metadata complete.
    readiness: {
      comparison_ready: !mismatch,
      active_run: false,
      snapshot_mismatch: mismatch,
      expected_docs: count,
      observed_docs: docs,
      reasons: mismatch ? [mismatchReason] : [],
      metrics: {
        count: { ready: !mismatch, reasons: mismatch ? [mismatchReason] : [] },
        quality: { ready: !mismatch && unclassifiedJournal === 0, reasons: [] },
        oa: { ready: !mismatch && oaUnknown === 0, reasons: [] },
        intl: { ready: !mismatch && intlUnknown === 0, reasons: [] },
        citations: { ready: !mismatch && citeUnknown === 0, reasons: [] },
      },
    },
  };
}

const LEVEL_CONFIG = {
  faculty: { oaPct: 55.6, intlPct: 50, avg: 8.1, tierWeights: { t1: 12, q1: 30, q2: 16, q3: 10, q4: 4 }, nonJournalPct: 0.2 },
  kku: { oaPct: 60, intlPct: 40, avg: 6.4, tierWeights: { t1: 20, q1: 70, q2: 40, q3: 30, q4: 40 }, nonJournalPct: 0.22 },
  // Thailand keeps a chunk of journals awaiting CiteScore → its quality metric reads
  // not-ready (per-metric withholding, R2-1) while its count/cohort stay consistent.
  thailand: { oaPct: 58, intlPct: 38, avg: 5.2, tierWeights: { t1: 120, q1: 700, q2: 400, q3: 380, q4: 400 }, nonJournalPct: 0.2, unclassifiedJournalPct: 0.25 },
};

// insightsFor reads the requested year's OFFICIAL counts straight out of the same
// comparison payload the table uses (`full`), so the detail can never diverge from
// the count. A level whose snapshot is not "available" for the year (blocked /
// missing / not in the dataset) renders as unavailable rather than fabricated.
export function insightsFor(year, { full, thailandMissing = false, facultyMismatch = false } = {}) {
  const row = (full?.years || []).find((entry) => Number(entry.year) === Number(year)) || null;
  const meta = full?.year_meta?.[year] || {};
  const countOf = (raw, status) => (status === "available" && Number.isFinite(Number(raw)) ? Number(raw) : null);

  const facultyCount = countOf(row?.faculty, meta?.faculty?.status);
  const uniCount = countOf(row?.university, meta?.university?.status);
  const countryCount = countOf(row?.country, meta?.country?.status);

  const faculty = levelFromCount(facultyCount, { ...LEVEL_CONFIG.faculty, mismatch: facultyMismatch });
  const kku = levelFromCount(uniCount, LEVEL_CONFIG.kku);
  const thailand = thailandMissing || countryCount === null
    ? emptyLevel("no Thailand documents for this year")
    : levelFromCount(countryCount, LEVEL_CONFIG.thailand);

  const fq = faculty.available ? faculty.quartile : null;
  const classified = fq ? Number(fq.t1) + Number(fq.q1) + Number(fq.q2) + Number(fq.q3) + Number(fq.q4) : 0;
  const quartile_coverage = { classified, total: faculty.available ? faculty.docs : 0 };

  return {
    year,
    levels: { faculty, kku, thailand },
    quartile_coverage,
    scope: { subject_area: "COMP", faculty_scope_id: 3, university_scope_id: 1, country_scope_id: 2 },
  };
}

// Aggregate a level across the years of a range the same way the BE does
// (aggregateRangeLevel): pool numerators/denominators and re-derive the rates, never
// average per-year percentages. Only the fields the report reads are aggregated.
function aggregateFixtureLevel(perYear, years) {
  const metricNames = ["count", "quality", "intl", "oa", "citations"];
  const ready = Object.fromEntries(metricNames.map((m) => [m, true]));
  const reasons = Object.fromEntries(metricNames.map((m) => [m, []]));
  const agg = {
    available: false, docs: 0,
    quartile: { t1: 0, q1: 0, q2: 0, q3: 0, q4: 0, unclassified: 0, unclassified_journal: 0, excluded_non_journal: 0, unresolved: 0 },
    doctypes: { article: 0, conference: 0, other: 0 },
    oa: { known: 0, positive: 0, unknown: 0 },
    intl: { known: 0, positive: 0, unknown: 0 },
  };
  let citTotal = 0, citKnown = 0, citCohort = 0, citHasKnown = false, observed = 0, expected = 0, expectedAny = false, anyMismatch = false;
  years.forEach((y) => {
    const lvl = perYear[y];
    if (!lvl) return;
    if (lvl.available) agg.available = true;
    agg.docs += lvl.docs || 0;
    for (const k of ["t1", "q1", "q2", "q3", "q4", "unclassified_journal", "excluded_non_journal", "unresolved"]) agg.quartile[k] += Number(lvl.quartile?.[k] || 0);
    for (const k of ["article", "conference", "other"]) agg.doctypes[k] += Number(lvl.doctypes?.[k] || 0);
    for (const k of ["known", "positive", "unknown"]) { agg.oa[k] += Number(lvl.oa?.[k] || 0); agg.intl[k] += Number(lvl.intl?.[k] || 0); }
    citCohort += Number(lvl.citations?.cohort_docs || 0);
    citKnown += Number(lvl.citations?.known_docs || 0);
    if (lvl.citations?.total != null) { citTotal += Number(lvl.citations.total); citHasKnown = true; }
    observed += Number(lvl.readiness?.observed_docs || 0);
    if (lvl.readiness?.expected_docs != null) { expected += Number(lvl.readiness.expected_docs); expectedAny = true; }
    if (lvl.readiness?.snapshot_mismatch) anyMismatch = true;
    for (const m of metricNames) {
      const mr = lvl.readiness?.metrics?.[m];
      if (mr && mr.ready === false) ready[m] = false;
      (mr?.reasons || []).forEach((r) => reasons[m].push(`${y}: ${r}`));
    }
  });
  agg.quartile.unclassified = agg.docs - (agg.quartile.t1 + agg.quartile.q1 + agg.quartile.q2 + agg.quartile.q3 + agg.quartile.q4);
  agg.oa_pct = agg.oa.known > 0 ? Math.round((10000 * agg.oa.positive) / agg.oa.known) / 100 : 0;
  agg.intl_pct = agg.intl.known > 0 ? Math.round((10000 * agg.intl.positive) / agg.intl.known) / 100 : 0;
  const unknownDocs = citCohort - citKnown;
  agg.citations = {
    total: citHasKnown ? citTotal : null,
    average: citKnown > 0 ? Math.round((100 * citTotal) / citKnown) / 100 : null,
    known_docs: citKnown, cohort_docs: citCohort, unknown_docs: unknownDocs,
    coverage_status: citCohort === 0 ? "none" : unknownDocs === 0 ? "complete" : "partial",
    denominator_policy: "known_citation_docs", updated_at: null, update_range: null, freshness_status: "unknown",
  };
  agg.avg_cite = agg.citations.average || 0;
  agg.readiness = {
    comparison_ready: ready.count, active_run: false, snapshot_mismatch: anyMismatch,
    expected_docs: expectedAny ? expected : null, observed_docs: observed, reasons: reasons.count,
    metrics: Object.fromEntries(metricNames.map((m) => [m, { ready: ready[m], reasons: reasons[m] }])),
  };
  if (!agg.available) return emptyLevel(reasons.count[0] || null);
  return agg;
}

export function insightsRangeFor(yearFrom, yearTo, opts = {}) {
  const years = {};
  const perYear = { faculty: {}, kku: {}, thailand: {} };
  const list = [];
  for (let y = yearFrom; y <= yearTo; y += 1) {
    const iy = insightsFor(y, opts);
    years[y] = iy;
    list.push(y);
    perYear.faculty[y] = iy.levels.faculty;
    perYear.kku[y] = iy.levels.kku;
    perYear.thailand[y] = iy.levels.thailand;
  }
  const levels = {
    faculty: aggregateFixtureLevel(perYear.faculty, list),
    kku: aggregateFixtureLevel(perYear.kku, list),
    thailand: aggregateFixtureLevel(perYear.thailand, list),
  };
  const fq = levels.faculty.available ? levels.faculty.quartile : null;
  const classified = fq ? Number(fq.t1) + Number(fq.q1) + Number(fq.q2) + Number(fq.q3) + Number(fq.q4) : 0;
  return {
    year_from: yearFrom, year_to: yearTo, years, levels,
    quartile_coverage: { classified, total: levels.faculty.available ? levels.faculty.docs : 0 },
    scope: { subject_area: "COMP", faculty_scope_id: 3, university_scope_id: 1, country_scope_id: 2 },
  };
}

function makeComparison({ latestEnded, thailandMissing = false, currentYtd = false } = {}) {
  const years = [];
  const yearMeta = {};
  const availableFaculty = [];
  const availableUni = [];
  const availableCountry = [];
  const start = CURRENT_YEAR - 12;
  const snapAt = "2026-09-03T20:10:00Z";
  for (let y = start; y <= CURRENT_YEAR; y += 1) {
    const grow = y - start;
    const faculty = 30 + grow * 4;
    const university = 150 + grow * 14;
    const country = 1400 + grow * 140;
    const isCurrent = y === CURRENT_YEAR;
    const facultyBlocked = isCurrent; // current year faculty not ready (YTD)
    const thailandHere = thailandMissing ? false : true;
    years.push({
      year: y,
      faculty: facultyBlocked ? null : faculty,
      university,
      country: thailandHere ? country : 0,
    });
    yearMeta[y] = {
      faculty: { status: facultyBlocked ? "blocked" : "available", snapshot_exists: true, snapshot_at: snapAt, reason: facultyBlocked ? "KKU benchmark documents incomplete for this year" : "" },
      university: { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" },
      country: { status: thailandHere ? "available" : "missing", snapshot_exists: thailandHere, snapshot_at: thailandHere ? snapAt : null, reason: "" },
    };
    if (!facultyBlocked) availableFaculty.push(y);
    availableUni.push(y);
    if (thailandHere) availableCountry.push(y);
  }
  if (currentYtd) {
    // Only the current year has any data: force the cumulative selection path.
    for (let y = start; y < CURRENT_YEAR; y += 1) {
      years[y - start] = { year: y, faculty: null, university: 0, country: 0 };
      yearMeta[y] = {
        faculty: { status: "missing", snapshot_exists: false, snapshot_at: null, reason: "no faculty snapshot for this year" },
        university: { status: "missing", snapshot_exists: false, snapshot_at: null, reason: "" },
        country: { status: "missing", snapshot_exists: false, snapshot_at: null, reason: "" },
      };
    }
    yearMeta[CURRENT_YEAR].faculty = { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" };
    years[CURRENT_YEAR - start] = { year: CURRENT_YEAR, faculty: 26, university: 150, country: thailandMissing ? 0 : 1600 };
  }
  return {
    years,
    faculty_metric: { ready: true, employment_date_complete: false, faculty_with_scopus_id: 41, employment_date_set: 1, employment_date_missing: 40, benchmark_years_missing: [CURRENT_YEAR] },
    year_meta: yearMeta,
    available_years: { faculty: availableFaculty, university: availableUni, country: availableCountry },
    report_scope: { subject_area: "COMP", faculty_subject_area: "COMP", university_subject_area: "COMP", country_subject_area: "COMP", consistent: true, faculty_scope_id: 3, university_scope_id: 1, country_scope_id: 2 },
  };
}

// Only an OLD snapshot year exists (older than the default 15-year window), to
// exercise the R2-4 bootstrap: available_years advertises it, but the first
// windowed read returns no year_meta for it.
function makeOldOnly() {
  const OLD = CURRENT_YEAR - 16;
  const snapAt = "2016-05-01T00:00:00Z";
  return {
    years: [{ year: OLD, faculty: 20, university: 90, country: 800 }],
    faculty_metric: { ready: true, employment_date_complete: false, faculty_with_scopus_id: 41, employment_date_set: 1, employment_date_missing: 40, benchmark_years_missing: [] },
    year_meta: {
      [OLD]: {
        faculty: { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" },
        university: { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" },
        country: { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" },
      },
    },
    available_years: { faculty: [OLD], university: [OLD], country: [OLD] },
    report_scope: { subject_area: "COMP", faculty_subject_area: "COMP", university_subject_area: "COMP", country_subject_area: "COMP", consistent: true, faculty_scope_id: 3, university_scope_id: 1, country_scope_id: 2 },
  };
}

// R4-1: the recent snapshot year is faculty-BLOCKED while an older ended year is
// faculty-READY (and older than the default window). available_years lists both
// (snapshot existence), so the default must load down to the old year and pick it
// by READINESS, not pick the recent blocked year.
function makeBlockedNew() {
  const OLD = CURRENT_YEAR - 16; // faculty-ready, outside default window
  const RECENT = CURRENT_YEAR - 1; // faculty-blocked, inside window
  const snapAt = "2016-05-01T00:00:00Z";
  const recentAt = "2026-09-03T20:10:00Z";
  return {
    years: [
      { year: OLD, faculty: 40, university: 180, country: 1600 },
      { year: RECENT, faculty: null, university: 305, country: 3050 },
      { year: CURRENT_YEAR, faculty: null, university: 150, country: 1600 },
    ],
    faculty_metric: { ready: true, employment_date_complete: false, faculty_with_scopus_id: 41, employment_date_set: 1, employment_date_missing: 40, benchmark_years_missing: [RECENT] },
    year_meta: {
      [OLD]: {
        faculty: { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" },
        university: { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" },
        country: { status: "available", snapshot_exists: true, snapshot_at: snapAt, reason: "" },
      },
      [RECENT]: {
        faculty: { status: "blocked", snapshot_exists: true, snapshot_at: recentAt, reason: "KKU benchmark documents incomplete for this year" },
        university: { status: "available", snapshot_exists: true, snapshot_at: recentAt, reason: "" },
        country: { status: "available", snapshot_exists: true, snapshot_at: recentAt, reason: "" },
      },
      [CURRENT_YEAR]: {
        faculty: { status: "missing", snapshot_exists: false, snapshot_at: null, reason: "no faculty snapshot for this year" },
        university: { status: "available", snapshot_exists: true, snapshot_at: recentAt, reason: "" },
        country: { status: "available", snapshot_exists: true, snapshot_at: recentAt, reason: "" },
      },
    },
    // snapshot EXISTENCE (includes the blocked RECENT year) — NOT readiness.
    available_years: { faculty: [RECENT, OLD], university: [CURRENT_YEAR, RECENT, OLD], country: [CURRENT_YEAR, RECENT, OLD] },
    report_scope: { subject_area: "COMP", faculty_subject_area: "COMP", university_subject_area: "COMP", country_subject_area: "COMP", consistent: true, faculty_scope_id: 3, university_scope_id: 1, country_scope_id: 2 },
  };
}

// Window a full comparison payload to the requested [year_from, year_to] like the
// real API (years + year_meta filtered; available_years stays complete). This makes
// the harness honour requested ranges so R2-4 (widen-on-demand) is real.
export function windowComparison(full, { year_from, year_to } = {}) {
  const from = year_from ?? CURRENT_YEAR - 14;
  const to = year_to ?? CURRENT_YEAR;
  const years = full.years.filter((row) => Number(row.year) >= from && Number(row.year) <= to);
  const year_meta = {};
  for (const key of Object.keys(full.year_meta)) {
    if (Number(key) >= from && Number(key) <= to) year_meta[key] = full.year_meta[key];
  }
  return { ...full, years, year_meta };
}

// Build the FULL (unwindowed) comparison payload for a scenario. Exposed so the
// evidence generator can reproduce exactly what the harness renders/exports.
export function buildFull(scenario) {
  const thailandMissing = scenario === "partial";
  const currentYtd = scenario === "ytd";
  const full = scenario === "oldonly" ? makeOldOnly() : scenario === "blockednew" ? makeBlockedNew() : makeComparison({ thailandMissing, currentYtd });
  if (scenario === "scopebad") {
    full.report_scope = { ...full.report_scope, country_subject_area: "MEDI", consistent: false };
  }
  return full;
}

export function buildApi(scenario) {
  const thailandMissing = scenario === "partial";
  const full = buildFull(scenario);
  return {
    comparison: (params = {}) => Promise.resolve({ success: true, data: windowComparison(full, params) }),
    insights: ({ year, year_from, year_to } = {}) => {
      if (scenario === "error") return Promise.reject(new Error("จำลองข้อผิดพลาดของ insights (fixture)"));
      const opts = { full, thailandMissing, facultyMismatch: scenario === "mismatch" };
      if (year_from != null && year_to != null) {
        return Promise.resolve({ success: true, data: insightsRangeFor(Number(year_from), Number(year_to), opts) });
      }
      return Promise.resolve({ success: true, data: insightsFor(year, opts) });
    },
  };
}

export const SCENARIOS = [
  ["normal", "ปกติ (หลายปี)"],
  ["partial", "ขาดประเทศไทย"],
  ["ytd", "ปีปัจจุบัน (สะสม)"],
  ["mismatch", "คณะยังเทียบไม่ได้"],
  ["scopebad", "ขอบเขตไม่ตรง"],
  ["oldonly", "มีเฉพาะปีเก่า"],
  ["blockednew", "ปีใหม่ blocked/ปีเก่าพร้อม"],
  ["error", "insights ผิดพลาด"],
];

export { CURRENT_YEAR };
