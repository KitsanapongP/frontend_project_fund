import test from 'node:test';
import assert from 'node:assert/strict';
import { uniqueSubcategoriesById } from '../admin_fund_helpers.mjs';

test('uniqueSubcategoriesById keeps one fund row per subcategory id', () => {
  const first = { subcategory_id: 30, subcategory_name: '2.2 Fund', budget_id: 58 };
  const duplicate = { subcategory_id: 30, subcategory_name: '2.2 Fund', budget_id: 59 };
  const second = { subcategory_id: 31, subcategory_name: '2.3 Fund', budget_id: 66 };

  assert.deepEqual(uniqueSubcategoriesById([first, duplicate, second]), [first, second]);
});

test('uniqueSubcategoriesById handles invalid API payloads', () => {
  assert.deepEqual(uniqueSubcategoriesById(), []);
  assert.deepEqual(uniqueSubcategoriesById(null), []);
});
