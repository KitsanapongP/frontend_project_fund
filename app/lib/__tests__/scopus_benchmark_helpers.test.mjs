import test from 'node:test';
import assert from 'node:assert/strict';
import { latestPositiveMetric, normalizeYearRange } from '../scopus_benchmark_helpers.mjs';

test('latestPositiveMetric selects the latest positive value for one metric', () => {
  const rows = [
    { year: 2026, faculty: 0, university: 214 },
    { year: 2024, faculty: 52, university: 231 },
    { year: 2025, faculty: 63, university: 311 },
  ];

  assert.deepEqual(latestPositiveMetric(rows, 'faculty'), { year: 2025, value: 63 });
  assert.deepEqual(latestPositiveMetric(rows, 'university'), { year: 2026, value: 214 });
});

test('latestPositiveMetric ignores missing, invalid, and non-positive values', () => {
  const rows = [
    { year: 2024, country: null },
    { year: 2025, country: 'not-a-number' },
    { year: 2026, country: -1 },
  ];

  assert.equal(latestPositiveMetric(rows, 'country'), null);
  assert.equal(latestPositiveMetric(null, 'country'), null);
  assert.equal(latestPositiveMetric(rows), null);
});

test('normalizeYearRange clamps years to the supported range', () => {
  assert.deepEqual(normalizeYearRange(100, 3000, 'from', 1900, 2027), {
    yearFrom: 1900,
    yearTo: 2027,
  });
});

test('normalizeYearRange keeps the edited boundary and moves the other boundary', () => {
  assert.deepEqual(normalizeYearRange(2026, 2025, 'from', 1900, 2027), {
    yearFrom: 2026,
    yearTo: 2026,
  });
  assert.deepEqual(normalizeYearRange(2026, 2024, 'to', 1900, 2027), {
    yearFrom: 2024,
    yearTo: 2024,
  });
});
