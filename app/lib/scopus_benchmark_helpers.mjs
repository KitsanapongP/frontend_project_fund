export function latestPositiveMetric(rows = [], metric) {
  if (!Array.isArray(rows) || !metric) return null;

  return rows.reduce((latest, row) => {
    const year = Number(row?.year);
    const value = Number(row?.[metric]);
    if (!Number.isFinite(year) || !Number.isFinite(value) || value <= 0) return latest;
    if (latest && latest.year >= year) return latest;
    return { year, value };
  }, null);
}

function clampYear(value, fallback, minYear, maxYear) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(maxYear, Math.max(minYear, Math.trunc(numeric)));
}

export function normalizeYearRange(
  yearFrom,
  yearTo,
  changedField = "from",
  minYear = 1900,
  maxYear = new Date().getFullYear() + 1,
) {
  let normalizedFrom = clampYear(yearFrom, minYear, minYear, maxYear);
  let normalizedTo = clampYear(yearTo, maxYear, minYear, maxYear);

  if (normalizedFrom > normalizedTo) {
    if (changedField === "to") normalizedFrom = normalizedTo;
    else normalizedTo = normalizedFrom;
  }

  return { yearFrom: normalizedFrom, yearTo: normalizedTo };
}
