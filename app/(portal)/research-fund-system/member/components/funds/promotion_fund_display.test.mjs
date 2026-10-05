import assert from 'node:assert/strict';
import test from 'node:test';
import {
  matchesPromotionFundSearch,
  mergePublicationRewardRows,
  PUBLICATION_REWARD_DISPLAY_NAME,
} from './promotion_fund_display.mjs';

const first = {
  subcategory_id: 52,
  subcategory_code: '2.2',
  subcategory_name: '2.2 เงินรางวัล (กรณีเป็นผู้แต่งชื่อแรก)',
  form_type: 'publication_reward',
  status: 'active',
  budget_count: 7,
};
const corresponding = {
  subcategory_id: 53,
  subcategory_code: '2.3',
  subcategory_name: '2.3 เงินรางวัล (กรณีเป็นผู้ประพันธ์บรรณกิจ)',
  form_type: 'publication_reward',
  status: 'active',
  budget_count: 7,
};

test('combines the two publication entries only in the display list', () => {
  const categories = [{ category_id: 24, subcategories: [first, corresponding, { subcategory_id: 54, subcategory_name: '2.4 อื่น ๆ' }] }];
  const result = mergePublicationRewardRows(categories);
  const [display, other] = result[0].subcategories;

  assert.equal(display.subcategory_name, PUBLICATION_REWARD_DISPLAY_NAME);
  assert.equal(display.subcategory_id, 52);
  assert.equal(display.is_publication_reward_highlight, true);
  assert.equal(other.subcategory_id, 54);
  assert.equal(categories[0].subcategories.length, 3);
  assert.equal(matchesPromotionFundSearch(display, 'ผู้ประพันธ์บรรณกิจ'), true);
});

test('uses the open source fund for the combined action', () => {
  const result = mergePublicationRewardRows([{ subcategories: [{ ...first, status: 'disable' }, corresponding] }]);
  assert.equal(result[0].subcategories[0].subcategory_id, 53);
  assert.equal(result[0].subcategories[0].status, 'active');
});

test('keeps a single visible author fund unchanged', () => {
  const result = mergePublicationRewardRows([{ subcategories: [corresponding] }]);
  assert.equal(result[0].subcategories[0], corresponding);
});
