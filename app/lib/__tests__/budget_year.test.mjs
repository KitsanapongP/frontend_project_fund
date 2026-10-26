import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveActiveBudgetYear, selectApplicationBudgetYear } from '../budget_year.mjs';

const years = [{ year_id: 9, year: '2569' }, { year_id: 10, year: '2570' }, { year_id: 11, year: '2571' }];

test('preparing a later year does not activate it; one system setting selects both ID and label', () => {
  assert.deepEqual(resolveActiveBudgetYear({ current_year: '2570', year_id: 10 }, years), years[1]);
  assert.deepEqual(resolveActiveBudgetYear({ data: { current_year: '2569', year_id: 9 } }, years), years[0]);
});

test('missing/inconsistent active year fails without silently choosing latest or calendar year', () => {
  for (const payload of [null, {}, { current_year: '2570' }, { current_year: '2570', year_id: 11 }, { current_year: '2572', year_id: 12 }]) {
    assert.throws(() => resolveActiveBudgetYear(payload, years));
  }
});

test('new requests follow activation, existing requests and drafts retain their saved year', () => {
  const active = resolveActiveBudgetYear({ current_year: '2570', year_id: 10 }, years);
  assert.equal(selectApplicationBudgetYear(active, null).year, '2570');
  assert.equal(selectApplicationBudgetYear(active, years[0]).year, '2569');
  assert.equal(selectApplicationBudgetYear(active, { year_id: 8, year: '2568' }).year, '2568');
});
