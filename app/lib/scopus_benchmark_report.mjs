// Pure, deterministic helpers for the Scopus benchmark executive report.
// Rendering-free so they can be unit tested (handoff §8, §10.3). No value is ever
// invented: unusable inputs return null / "unknown" rather than 0 or a guess.

// ── value guards ────────────────────────────────────────────────────────────

// isUsable is the single gate every formula and sentence must pass a value
// through: null / undefined / NaN / non-finite are NOT usable, and (unlike the
// old code) a real 0 IS usable (§4 "ค่า 0 ที่มี snapshot เป็นปีที่มีข้อมูล").
export function isUsable(value) {
  return typeof value === "number" ? Number.isFinite(value) : value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
}

const toNumber = (value) => (isUsable(value) ? Number(value) : null);

// ── formatting ──────────────────────────────────────────────────────────────

export function formatCount(value) {
  const n = toNumber(value);
  return n === null ? "–" : n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

export function formatPct(value, digits = 1) {
  const n = toNumber(value);
  return n === null ? "–" : `${n.toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function formatDecimal(value, digits = 1) {
  const n = toNumber(value);
  return n === null ? "–" : n.toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// Signed percentage-point delta, e.g. "+5.0 จุดเปอร์เซ็นต์". Rounded difference of
// exactly 0.0 is stated as "near-equal" rather than a spurious 0 (§8).
export function formatPoints(value, digits = 1) {
  const n = toNumber(value);
  if (n === null) return "–";
  const rounded = Number(n.toFixed(digits));
  if (rounded === 0) return "ใกล้เคียงกันเมื่อปัดทศนิยม 1 ตำแหน่ง";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded).toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits })} จุดเปอร์เซ็นต์`;
}

// ── metric math (§8) ─────────────────────────────────────────────────────────

export function shareOf(part, whole) {
  const p = toNumber(part);
  const w = toNumber(whole);
  if (p === null || w === null || w <= 0) return null;
  return (p / w) * 100;
}

// High-tier share = (T1 + Q1-exclusive + Q2) / all classified journals × 100.
// T1 is already carved out of Q1 by the API, so it is added, not double counted.
export function highTierShare(quartile) {
  if (!quartile) return null;
  const t1 = Number(quartile.t1 || 0);
  const classified = t1 + Number(quartile.q1 || 0) + Number(quartile.q2 || 0) + Number(quartile.q3 || 0) + Number(quartile.q4 || 0);
  if (classified <= 0) return null;
  return ((t1 + Number(quartile.q1 || 0) + Number(quartile.q2 || 0)) / classified) * 100;
}

// observedRate is the SINGLE source of truth for OA / international rates used by
// the KPI, the comparison table AND the CSV (R2-2) — so the exported file always
// matches the screen. The rate is positive/known (unknown docs are excluded from
// the denominator, never counted as negative — §8). Falls back to the legacy
// docs-denominator rate only when coverage counts are absent.
export function observedRate(level, which) {
  if (!level?.available) return { value: null, positive: null, known: null, unknown: null, policy: "known" };
  const cov = level[which];
  if (cov && isUsable(cov.known)) {
    return {
      value: cov.known > 0 ? (Number(cov.positive || 0) / cov.known) * 100 : null,
      positive: Number(cov.positive || 0),
      known: Number(cov.known),
      unknown: Number(cov.unknown || 0),
      policy: "known",
    };
  }
  const legacy = which === "oa" ? level.oa_pct : level.intl_pct;
  return { value: isUsable(legacy) ? Number(legacy) : null, positive: null, known: null, unknown: null, policy: "all_docs" };
}

// metricReady reports whether a level's specific metric may take part in a
// comparison (per-metric readiness, not one boolean — R2-1). Unknown/absent
// readiness is treated as NOT ready.
export function metricReady(level, metric) {
  return !!(level?.available && level?.readiness?.metrics?.[metric]?.ready);
}

// canCompareMetric is true only when BOTH sides are ready for that metric.
export function canCompareMetric(faculty, kku, metric) {
  return metricReady(faculty, metric) && metricReady(kku, metric);
}

// ── shared metric hint text (§5) ──────────────────────────────────────────────
// These strings are the single source of the KPI/table hints and the printed notes,
// so every surface explains a metric the same way (a tooltip does not print — §5).

export const HINT_T1Q2 =
  "คำนวณจากจำนวนผลงานในวารสารกลุ่ม T1, Q1 และ Q2 หารด้วยจำนวนผลงานวารสารที่ระบุกลุ่มได้ทั้งหมด (T1, Q1, Q2, Q3 และ Q4) โดย T1 แยกจาก Q1 ไม่นับซ้ำ และไม่นำผลงานวารสารที่ยังระบุกลุ่มไม่ได้มาคิดสัดส่วน";

export const HINT_INTL =
  "พิจารณาจากประเทศในข้อมูลสังกัดผู้เขียน (affiliation) โดยนับผลงานที่พบสังกัดในประเทศอื่นนอกประเทศไทยอย่างน้อยหนึ่งแห่ง เทียบกับผลงานที่มีข้อมูลประเทศของสังกัดอย่างน้อยหนึ่งรายการ ผลงานที่ไม่มีข้อมูลประเทศไม่นำมาคิดสัดส่วน ทั้งนี้เป็นประเทศของสังกัด ไม่ใช่สัญชาติผู้เขียน";

// highTierDenom returns the numerator (T1+Q1+Q2) and denominator (all classified) of
// the high-tier share, or null when no journal is classified. Never binds a fixed
// total (§5 — the "36" must come from the data, not a constant).
export function highTierDenom(quartile) {
  if (!quartile) return null;
  const t1 = Number(quartile.t1 || 0);
  const q1 = Number(quartile.q1 || 0);
  const q2 = Number(quartile.q2 || 0);
  const classified = t1 + q1 + q2 + Number(quartile.q3 || 0) + Number(quartile.q4 || 0);
  if (classified <= 0) return null;
  return { numerator: t1 + q1 + q2, denominator: classified };
}

// highTierDenomText: e.g. "34 จาก 36 ผลงานวารสารที่จัดกลุ่มได้".
export function highTierDenomText(quartile) {
  const d = highTierDenom(quartile);
  if (!d) return "ยังไม่มีวารสารที่จัดกลุ่มได้";
  return `${formatCount(d.numerator)} จาก ${formatCount(d.denominator)} ผลงานวารสารที่จัดกลุ่มได้`;
}

// intlDenomText: e.g. "30 จาก 58 ผลงานที่มีข้อมูลประเทศสังกัด" with the unknown note
// appended when some documents carry no affiliation country. Falls back to the legacy
// docs-denominator phrasing only when coverage counts are absent (§5 fallback).
export function intlDenomText(level) {
  if (!level?.available) return "ยังไม่มีข้อมูล";
  const r = observedRate(level, "intl");
  if (r.known === null) return `จาก ${formatCount(level.docs)} ผลงาน (observed)`;
  let text = `${formatCount(r.positive)} จาก ${formatCount(r.known)} ผลงานที่มีข้อมูลประเทศสังกัด`;
  if (r.unknown > 0) text += ` · อีก ${formatCount(r.unknown)} ผลงานไม่มีข้อมูลประเทศสังกัด จึงไม่นำมาคิดสัดส่วน`;
  return text;
}

// ── refresh lifecycle (§6 / R1) ──────────────────────────────────────────────

// refreshSettled decides whether a "รีเฟรช" may clear the stale warning: ONLY when
// BOTH required reads of the SAME refresh (comparison AND insights) have succeeded. A
// failed read leaves stale in place so a half-refreshed report is never presented as
// fully up to date. Pure, so the rule is unit-tested without a DOM.
export function refreshSettled(loaded) {
  return !!(loaded && loaded.comparison && loaded.insights);
}

// The refresh tracker is a small pure state machine (§6/R1, R1.1) so the async
// ordering — insights of range A succeeds, the user applies range B, B's insights
// fails — can be unit-tested without a browser. It is bound to a range key: whenever
// the applied range changes while a refresh is pending, the RANGE-SPECIFIC insights
// success is invalidated, so only the CURRENT range's insights can clear stale. The
// comparison read is window-scoped, not range-scoped, so it is not invalidated by a
// range change within the same window (the reviewer's exact scenario).
export function newRefreshTracker() {
  return { pending: false, comparison: false, insights: false, rangeKey: null };
}

export function armRefresh(rangeKey) {
  return { pending: true, comparison: false, insights: false, rangeKey };
}

// invalidateRefreshRange drops the range-specific (insights) success when the applied
// range changes mid-refresh, so a stale success from the previous range can never
// combine with a later comparison success to clear stale (R1.1).
export function invalidateRefreshRange(tracker, rangeKey) {
  if (!tracker?.pending) return tracker;
  if (tracker.rangeKey === rangeKey) return tracker;
  return { ...tracker, insights: false, rangeKey };
}

// advanceRefresh marks one read of the current refresh as loaded and reports whether
// stale may now be cleared (both reads of the current context succeeded).
export function advanceRefresh(tracker, stream) {
  if (!tracker?.pending) return { tracker, cleared: false };
  const next = { ...tracker, [stream]: true };
  if (refreshSettled(next)) return { tracker: { ...next, pending: false }, cleared: true };
  return { tracker: next, cleared: false };
}

// ── range aggregation over comparison rows (§3.2) ────────────────────────────

// aggregateRangeCounts sums a level's per-year snapshot counts across an inclusive
// [yearFrom, yearTo] window — but ONLY when EVERY year of the range is "available"
// for that level. A single missing/blocked year makes the whole-range count null and
// records the offending years, so a partial sum is never shown as a full-range total
// (§3.2). A real zero-snapshot ("available") year legitimately contributes 0.
export function aggregateRangeCounts(rows, yearMeta, yearFrom, yearTo) {
  const rowByYear = new Map((Array.isArray(rows) ? rows : []).map((r) => [Number(r.year), r]));
  // rows use faculty/university/country; year_meta uses the same three keys.
  const levels = { faculty: "faculty", university: "university", country: "country" };
  const out = { faculty: null, university: null, country: null, missing: { faculty: [], university: [], country: [] } };
  for (const [levelKey, metaKey] of Object.entries(levels)) {
    let sum = 0;
    let complete = true;
    for (let year = yearFrom; year <= yearTo; year += 1) {
      const status = yearMeta?.[year]?.[metaKey]?.status;
      const row = rowByYear.get(year);
      if (status === "available" && row && isUsable(row[levelKey])) {
        sum += Number(row[levelKey]);
      } else {
        complete = false;
        out.missing[levelKey].push(year);
      }
    }
    out[levelKey] = complete ? sum : null;
  }
  return out;
}

// buildRangeFindings returns 0–2 descriptive sentences for a multi-year report. It
// intentionally carries NO year-over-year / growth statements (§3.2 hides YoY in
// range mode); it states the range total (or why it cannot be totalled) and, when
// both sides are ready, the คณะ-vs-KKU high-tier relationship over the range.
export function buildRangeFindings({
  yearFrom,
  yearTo,
  includesCurrentYear = false,
  facultyCount = null,
  facultyMissingYears = [],
  faculty = null,
  kku = null,
  scopeConsistent = true,
}) {
  const findings = [];
  const label = `${yearFrom}–${yearTo}`;

  if (Array.isArray(facultyMissingYears) && facultyMissingYears.length) {
    findings.push(`ยังรวมจำนวนผลงานคณะทั้งช่วง ${label} ไม่ได้ เพราะข้อมูลปี ${facultyMissingYears.join(", ")} ยังไม่พร้อม`);
  } else if (isUsable(facultyCount)) {
    findings.push(
      `ผลงานคณะรวมช่วง ${label}: ${formatCount(facultyCount)} ผลงาน` +
        (includesCurrentYear ? ` (รวมปี ${yearTo} ที่ยังไม่ครบปี)` : ""),
    );
  }

  if (findings.length < 2 && scopeConsistent && faculty && kku && canCompareMetric(faculty, kku, "quality")) {
    const htFaculty = highTierShare(faculty.quartile);
    const htKku = highTierShare(kku.quartile);
    if (htFaculty !== null && htKku !== null) {
      const diff = htFaculty - htKku;
      if (Number(diff.toFixed(1)) === 0) {
        findings.push(`สัดส่วนผลงานในวารสารกลุ่ม T1–Q2 ของคณะ (${formatPct(htFaculty)}) ใกล้เคียง KKU (${formatPct(htKku)}) ในช่วง ${label}`);
      } else {
        findings.push(`สัดส่วนผลงานในวารสารกลุ่ม T1–Q2 ของคณะ ${formatPct(htFaculty)} เทียบ KKU ${formatPct(htKku)} ในช่วง ${label} (ต่าง ${formatPoints(Math.abs(diff)).replace("+", "")})`);
      }
    }
  }

  return findings.slice(0, 2);
}

// growthInfo describes a year-over-year count change without ever producing
// Infinity or a false "decline" (§8). Only meaningful for an ended year.
export function growthInfo(current, previous) {
  const cur = toNumber(current);
  const prev = toNumber(previous);
  if (cur === null || prev === null) return { status: "unknown" };
  const delta = cur - prev;
  if (prev > 0) return { status: "pct", delta, pct: (delta / prev) * 100 };
  if (cur > 0) return { status: "from_zero", delta };
  return { status: "flat", delta: 0 };
}

// ── report-year selection (§4) ───────────────────────────────────────────────

const levelStatus = (meta, level) => meta?.[level]?.status;

// selectReportYear picks the default report year from per-year/per-level snapshot
// metadata. Preference: latest ENDED year the faculty is ready for → latest ended
// year with a KKU/country snapshot (faculty not yet ready) → the current year as
// cumulative data → null (empty state). It never falls back to fabricated data.
export function selectReportYear(yearMeta, currentYear) {
  const years = Object.keys(yearMeta || {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
  const ended = years.filter((year) => year < currentYear);

  for (const year of ended) {
    if (levelStatus(yearMeta[year], "faculty") === "available") {
      return { year, state: "faculty_ready", isCurrentYear: false };
    }
  }
  for (const year of ended) {
    const meta = yearMeta[year];
    if (levelStatus(meta, "university") === "available" || levelStatus(meta, "country") === "available") {
      return { year, state: "faculty_not_ready", isCurrentYear: false };
    }
  }
  if (years.includes(currentYear)) {
    const meta = yearMeta[currentYear];
    if (["faculty", "university", "country"].some((level) => levelStatus(meta, level) === "available")) {
      return { year: currentYear, state: "current_cumulative", isCurrentYear: true };
    }
  }
  return null;
}

// resolveBootstrapFloor returns the EARLIEST ended year that must be loaded so the
// default selection is correct — NOT the year to select (R4-1). available_years is
// snapshot EXISTENCE (it includes blocked years), so it can only tell us how far
// back to read; readiness is then read from the loaded year_meta and the actual
// pick is left to selectReportYear. Loading down to the earliest ended snapshot year
// (one wider GET, never a per-year probe) guarantees every candidate's real faculty
// status is known, so a recent BLOCKED year never hides an older faculty-READY year.
// Returns null when no ended snapshot exists (nothing to widen for).
export function resolveBootstrapFloor(availableYears, currentYear) {
  const union = [
    ...(availableYears?.faculty || []),
    ...(availableYears?.university || []),
    ...(availableYears?.country || []),
  ]
    .map(Number)
    .filter((y) => Number.isFinite(y) && y < currentYear);
  return union.length ? Math.min(...union) : null;
}

// ── deterministic key findings (§8, max 2) ───────────────────────────────────

function facultyCountSentence(info, current, previous) {
  const cur = formatCount(current);
  switch (info.status) {
    case "pct":
      if (info.delta > 0) return `ผลงานคณะเพิ่ม ${formatCount(info.delta)} ผลงาน (${formatPct(info.pct)}) จาก ${formatCount(previous)} เป็น ${cur} ผลงาน`;
      if (info.delta < 0) return `ผลงานคณะลดลง ${formatCount(Math.abs(info.delta))} ผลงาน (${formatPct(info.pct)}) จาก ${formatCount(previous)} เป็น ${cur} ผลงาน`;
      return `ผลงานคณะไม่เปลี่ยนแปลงจากปีก่อน (${cur} ผลงาน)`;
    case "from_zero":
      return `ผลงานคณะเพิ่มจาก 0 เป็น ${cur} ผลงาน`;
    case "flat":
      return `ผลงานคณะไม่เปลี่ยนแปลงจากปีก่อน (${cur} ผลงาน)`;
    default:
      return null;
  }
}

// buildFindings returns 0–2 plain descriptive sentences. It states mathematical
// relationships only — never praise, causal claims about research, or a gap it
// cannot support with comparable, ready data.
export function buildFindings({
  isCurrentYear,
  reportYear,
  facultyCount,
  prevFacultyCount,
  kkuCount,
  prevKkuCount,
  facultyReady = true,
  faculty = null,
  kku = null,
}) {
  const findings = [];

  if (isCurrentYear) {
    if (isUsable(facultyCount)) {
      findings.push(`ข้อมูลสะสมปี ${reportYear}: ผลงานคณะ ${formatCount(facultyCount)} ผลงาน (ยังไม่ครบปี จึงไม่เทียบกับปีก่อนแบบเต็มปี)`);
    } else {
      findings.push(`ข้อมูลสะสมปี ${reportYear}: ยังไม่มีตัวเลขผลงานคณะที่พร้อมแสดง`);
    }
  } else if (!facultyReady || !isUsable(facultyCount)) {
    findings.push(`ยังไม่มีตัวเลขผลงานคณะที่พร้อมสำหรับปี ${reportYear} (ข้อมูลคณะยังไม่พร้อมเปรียบเทียบ)`);
  } else {
    const info = growthInfo(facultyCount, prevFacultyCount);
    const shareNow = shareOf(facultyCount, kkuCount);
    const sharePrev = shareOf(prevFacultyCount, prevKkuCount);
    const shareDelta = shareNow !== null && sharePrev !== null ? shareNow - sharePrev : null;

    // Rule 1: faculty grew but its share of KKU shrank — a mathematical relation.
    if (info.status === "pct" && info.delta > 0 && shareDelta !== null && Number(shareDelta.toFixed(1)) < 0) {
      findings.push(
        `ผลงานคณะเพิ่ม ${formatCount(info.delta)} ผลงาน (${formatPct(info.pct)}) แต่สัดส่วนต่อ KKU ลด ${formatPoints(Math.abs(shareDelta)).replace("+", "")} เนื่องจากจำนวนผลงาน KKU เติบโตเร็วกว่า`,
      );
    } else {
      const sentence = facultyCountSentence(info, facultyCount, prevFacultyCount);
      if (sentence) findings.push(sentence);
    }
  }

  // Rule 3: high-tier journal comparison vs KKU, only when the QUALITY metric is
  // ready on both sides (harvest complete AND all journals classified) — R2-1.
  if (findings.length < 2 && faculty && kku) {
    const htFaculty = highTierShare(faculty?.quartile);
    const htKku = highTierShare(kku?.quartile);
    if (canCompareMetric(faculty, kku, "quality") && htFaculty !== null && htKku !== null) {
      const diff = htFaculty - htKku;
      if (Number(diff.toFixed(1)) === 0) {
        findings.push(`สัดส่วนผลงานในวารสารกลุ่ม T1–Q2 ของคณะ (${formatPct(htFaculty)}) ใกล้เคียง KKU (${formatPct(htKku)}) เมื่อปัดทศนิยม 1 ตำแหน่ง`);
      } else {
        findings.push(`สัดส่วนผลงานในวารสารกลุ่ม T1–Q2 ของคณะ ${formatPct(htFaculty)} เทียบ KKU ${formatPct(htKku)} (ต่าง ${formatPoints(Math.abs(diff)).replace("+", "")})`);
      }
    }
  }

  return findings.slice(0, 2);
}

// ── CSV builders (§7) ────────────────────────────────────────────────────────

const csvCell = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csvLine = (cells) => cells.map(csvCell).join(",");

// normalizeReportRow blanks a level's count (→ null) whenever that level's snapshot
// is not "available" in year_meta, so a missing snapshot is never read as a real 0
// in any surface (table, CSV, share). A real zero snapshot (status "available")
// stays 0. Used by the comparison table and both CSV exports (R4).
export function normalizeReportRow(row, meta) {
  const pick = (value, status) => (status === "available" && isUsable(value) ? Number(value) : null);
  return {
    year: row?.year,
    faculty: pick(row?.faculty, meta?.faculty?.status),
    university: pick(row?.university, meta?.university?.status),
    country: pick(row?.country, meta?.country?.status),
  };
}

// Year-by-year counts CSV. Missing values are blank (never 0), always carry a
// per-level status, and record the per-year/per-level snapshot date (not one
// report-year date for every row — R8).
// scopeConsistent: true when all three scopes are the same subject and it is COMP.
// When false the file must NOT carry cross-scope comparison values (share/gap), and
// must record each level's subject so the exported file is self-explaining (R3-1).
function scopeIsConsistent(scope) {
  return scope?.consistent !== false;
}
function scopeHeaderLines(scope) {
  const lines = [
    csvLine([`# ขอบเขต: คณะ=${scope?.faculty_subject_area || scope?.subject_area || "COMP"} · KKU=${scope?.university_subject_area || scope?.subject_area || "COMP"} · ประเทศไทย=${scope?.country_subject_area || scope?.subject_area || "COMP"}`]),
    // Explicit machine-readable flag: scope_consistent is SEPARATE from the per-metric
    // data "พร้อมเทียบ" columns below (those are data readiness, not scope) — R4 note.
    csvLine([`# scope_consistent: ${scopeIsConsistent(scope)}`]),
  ];
  if (!scopeIsConsistent(scope)) {
    lines.push(csvLine([`# คำเตือน: ขอบเขตสามระดับไม่ตรงกัน — งดค่าที่ใช้เปรียบเทียบ (สัดส่วนคณะ/KKU และ gap) แสดงเฉพาะค่าที่สังเกตได้`]));
  }
  return lines;
}

export function buildYearlyCsv({ rows, yearMeta, scope }) {
  const consistent = scopeIsConsistent(scope);
  const lines = [...scopeHeaderLines(scope)];
  lines.push(csvLine([`# สร้างรายงานเมื่อ: ${new Date().toISOString()}`]));
  lines.push(csvLine([`# ช่วงปี: ${rows.length ? `${rows[0].year}–${rows[rows.length - 1].year}` : "-"} (ตามช่วงที่แสดงบนหน้า)`]));
  lines.push(csvLine(["year", "faculty", "faculty_status", "faculty_updated", "kku", "kku_status", "kku_updated", "thailand", "thailand_status", "thailand_updated", "faculty_kku_pct"]));
  for (const row of rows) {
    const meta = yearMeta?.[row.year] || {};
    const norm = normalizeReportRow(row, meta);
    // Share is a cross-scope comparison — omit it entirely when scope is inconsistent.
    const share = consistent ? shareOf(norm.faculty, norm.university) : null;
    lines.push(
      csvLine([
        row.year,
        norm.faculty === null ? "" : norm.faculty,
        meta.faculty?.status || "",
        meta.faculty?.snapshot_at || "",
        norm.university === null ? "" : norm.university,
        meta.university?.status || "",
        meta.university?.snapshot_at || "",
        norm.country === null ? "" : norm.country,
        meta.country?.status || "",
        meta.country?.snapshot_at || "",
        share === null ? "" : share.toFixed(1),
      ]),
    );
  }
  return lines.join("\n");
}

// Report-year comparison CSV: the on-screen comparison table plus citations, with
// visible numerators/denominators, coverage, per-level status/readiness and
// citation freshness so a partial/observed subset never reads as complete (R8).
export function buildComparisonCsv({ reportYear, yearFrom, yearTo, row, meta, insights, scope, counts: countsOverride }) {
  const levels = ["faculty", "kku", "thailand"];
  const label = { faculty: "คณะ", kku: "มหาวิทยาลัยขอนแก่น", thailand: "ประเทศไทย" };
  // Range mode: an explicit aggregate `counts` (null when a year is missing/blocked)
  // and a period label replace the single-year normalizeReportRow counts. All other
  // rows come from insights.levels, whose aggregate shape is identical (§4.3).
  const isRange = isUsable(yearFrom) && isUsable(yearTo) && Number(yearFrom) !== Number(yearTo);
  const periodLabel = isRange ? `${yearFrom}–${yearTo}` : String(reportYear);
  const norm = normalizeReportRow(row, meta);
  const counts = countsOverride || { faculty: norm.faculty, kku: norm.university, thailand: norm.country };
  const metaByLevel = { faculty: meta?.faculty, kku: meta?.university, thailand: meta?.country };
  const lines = [csvLine([`# เปรียบเทียบ${isRange ? "ช่วงปี" : "ปี"} ${periodLabel}`]), ...scopeHeaderLines(scope)];
  lines.push(csvLine([`# สร้างรายงานเมื่อ: ${new Date().toISOString()}`]));
  lines.push(csvLine(["metric", ...levels.map((l) => label[l])]));

  const readyOf = (l, metric) => (insights?.levels?.[l]?.readiness?.metrics?.[metric] ? String(!!insights.levels[l].readiness.metrics[metric].ready) : "");

  lines.push(csvLine(["จำนวนผลงาน", ...levels.map((l) => (counts[l] === null ? "" : counts[l]))]));
  lines.push(csvLine(["สถานะข้อมูล (snapshot)", ...levels.map((l) => metaByLevel[l]?.status || "")]));
  lines.push(csvLine(["harvest พร้อมเทียบ (count_ready)", ...levels.map((l) => readyOf(l, "count"))]));

  const htRow = ["สัดส่วน T1–Q2 (%)"];
  const htDenomRow = ["T1–Q2 ตัวตั้ง/ตัวหาร (classified)"];
  const htReadyRow = ["T1–Q2 พร้อมเทียบ"];
  // OA/intl values here are positive/known — IDENTICAL to what the report shows on
  // screen (R2-2), with the known denominator and unknown count spelled out.
  const intlRow = ["ความร่วมมือต่างประเทศ (%, positive/known)"];
  const intlDenomRow = ["ความร่วมมือต่างประเทศ known/unknown"];
  const intlReadyRow = ["ความร่วมมือต่างประเทศ พร้อมเทียบ"];
  const oaRow = ["Open Access (%, positive/known)"];
  const oaDenomRow = ["Open Access known/unknown"];
  const oaReadyRow = ["Open Access พร้อมเทียบ"];
  const citeTotalRow = ["การอ้างอิงสะสมรวม (ครั้ง)"];
  const citeAvgRow = ["การอ้างอิงเฉลี่ย/ผลงาน (หาร known)"];
  const citeCovRow = ["ผลงานที่มีข้อมูลการอ้างอิง (known/cohort)"];
  const citeFreshRow = ["citation freshness"];

  for (const l of levels) {
    const level = insights?.levels?.[l];
    const q = level?.quartile;
    const ht = highTierShare(q);
    htRow.push(ht === null ? "" : ht.toFixed(1));
    if (q) {
      const classified = Number(q.t1 || 0) + Number(q.q1 || 0) + Number(q.q2 || 0) + Number(q.q3 || 0) + Number(q.q4 || 0);
      htDenomRow.push(classified > 0 ? `${Number(q.t1 || 0) + Number(q.q1 || 0) + Number(q.q2 || 0)}/${classified}` : "");
    } else htDenomRow.push("");
    htReadyRow.push(readyOf(l, "quality"));
    const intl = observedRate(level, "intl");
    const oa = observedRate(level, "oa");
    intlRow.push(intl.value === null ? "" : intl.value.toFixed(1));
    oaRow.push(oa.value === null ? "" : oa.value.toFixed(1));
    intlDenomRow.push(intl.known === null ? `docs=${level?.available ? level.docs : ""}` : `${intl.known}/${intl.unknown}`);
    oaDenomRow.push(oa.known === null ? `docs=${level?.available ? level.docs : ""}` : `${oa.known}/${oa.unknown}`);
    intlReadyRow.push(readyOf(l, "intl"));
    oaReadyRow.push(readyOf(l, "oa"));
    const c = level?.citations;
    citeTotalRow.push(c && c.total !== null && c.total !== undefined ? c.total : "");
    citeAvgRow.push(c && c.average !== null && c.average !== undefined ? Number(c.average).toFixed(1) : "");
    citeCovRow.push(c ? `${c.known_docs}/${c.cohort_docs} (${c.coverage_status})` : "");
    citeFreshRow.push(c ? c.freshness_status || "unknown" : "");
  }
  [htRow, htDenomRow, htReadyRow, intlRow, intlDenomRow, intlReadyRow, oaRow, oaDenomRow, oaReadyRow, citeTotalRow, citeAvgRow, citeCovRow, citeFreshRow].forEach((r) => lines.push(csvLine(r)));
  lines.push(csvLine([`# OA/intl เป็นอัตราจากเอกสารที่ทราบสถานะ (positive/known) เอกสารที่ไม่ทราบไม่ถูกนับเป็นตัวหาร; “พร้อมเทียบ”=false เมื่อยังมี unknown/ข้อมูลไม่ครบ`]));
  lines.push(csvLine([`# การอ้างอิงเป็นยอดสะสม ณ ครั้งที่อัปเดต ไม่ใช่การอ้างอิงที่เกิดใน${isRange ? "ช่วงปี" : "ปี"} ${periodLabel} · ไม่ทราบวันที่อัปเดตการอ้างอิง · สามระดับทับซ้อนกัน ห้ามรวมยอด`]));
  return lines.join("\n");
}
