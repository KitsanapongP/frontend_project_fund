import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FUND_210_HINT,
  getFundCondition,
  getFundCode,
  getFundDisplayHint,
  getSubmissionFundStatus,
  isFundOpenForApplications,
} from '../fund_availability.mjs';

test('fund availability treats active or legacy missing status as open', () => {
  assert.equal(isFundOpenForApplications({ status: 'active' }), true);
  assert.equal(isFundOpenForApplications({ status: 'disable' }), false);
  assert.equal(isFundOpenForApplications({}), true);
});

test('2.10 hint is keyed by subcategory code, not its database name', () => {
  assert.equal(getFundDisplayHint({ subcategory_code: '2.10', subcategory_name: 'renamed' }), FUND_210_HINT);
  assert.equal(getFundDisplayHint({ subcategory_code: '2.2', subcategory_name: '2.10 similar name' }), '');
});

test('fund code falls back to an exact numeric name prefix when the API omits code', () => {
  assert.equal(getFundCode({ subcategory_name: '2.10 ชื่อทุน' }), '2.10');
  assert.equal(getFundDisplayHint({ subcategory_name: '2.10 ชื่อทุน' }), FUND_210_HINT);
  assert.equal(getFundDisplayHint({ subcategory_name: 'ทุนหมายเลข 2.10' }), '');
});

test('submission fund status resolves nested API shapes', () => {
  assert.equal(getSubmissionFundStatus({ subcategory: { status: 'disable' } }), 'disable');
  assert.equal(getSubmissionFundStatus({ FundApplicationDetail: { Subcategory: { Status: 'active' } } }), 'active');
});

test('fund condition ignores null-like and whitespace-only values', () => {
  assert.equal(getFundCondition({ fund_condition: null }), '');
  assert.equal(getFundCondition({ fund_condition: '   ' }), '');
  assert.equal(getFundCondition({ fund_condition: 'null' }), '');
  assert.equal(getFundCondition({ fund_condition: ' เงื่อนไขจริง ' }), 'เงื่อนไขจริง');
});
