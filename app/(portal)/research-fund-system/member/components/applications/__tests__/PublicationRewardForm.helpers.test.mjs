import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldDisableSubmitButton,
  getAuthorSubmissionFields,
  calculatePublicationRequestAmounts,
  validatePriorRewardRevisionFee,
} from '../PublicationRewardForm.helpers.mjs';

test('shouldDisableSubmitButton enforces declarations and required author fields before enabling submit', () => {
  const baseState = {
    loading: false,
    saving: false,
    subcategoryId: 10,
    subcategoryBudgetId: 20,
    declarations: {
      confirmNoPreviousFunding: false,
      agreeToRegulations: false,
    },
    authorNameList: '',
    signature: '',
  };

  assert.equal(shouldDisableSubmitButton(baseState), true);

  const withAuthors = {
    ...baseState,
    authorNameList: 'Alice, Bob',
  };
  assert.equal(shouldDisableSubmitButton(withAuthors), true);

  const withSignature = {
    ...baseState,
    authorNameList: 'Alice, Bob',
    signature: '  ',
    declarations: {
      confirmNoPreviousFunding: true,
      agreeToRegulations: false,
    },
  };
  assert.equal(shouldDisableSubmitButton(withSignature), true);

  const oneChecked = {
    ...baseState,
    authorNameList: 'Alice, Bob',
    signature: 'Professor Example',
    declarations: {
      confirmNoPreviousFunding: true,
      agreeToRegulations: false,
    },
  };
  assert.equal(shouldDisableSubmitButton(oneChecked), true);

  const bothChecked = {
    ...baseState,
    authorNameList: 'Alice, Bob',
    signature: 'Professor Example',
    declarations: {
      confirmNoPreviousFunding: true,
      agreeToRegulations: true,
    },
  };
  assert.equal(shouldDisableSubmitButton(bothChecked), false);
});

test('getAuthorSubmissionFields maps trimmed author fields for submission payload', () => {
  const populated = getAuthorSubmissionFields({
    author_name_list: '  Author One, Author Two  ',
    signature: '  Dr. Example  ',
  });

  assert.equal(populated.author_name_list, 'Author One, Author Two');
  assert.equal(populated.signature, 'Dr. Example');

  const empty = getAuthorSubmissionFields();
  assert.equal(empty.author_name_list, '');
  assert.equal(empty.signature, '');
});

test('calculatePublicationRequestAmounts excludes a previously requested reward', () => {
  assert.deepEqual(calculatePublicationRequestAmounts({
    hasReceivedReward: false,
    configuredReward: 10000,
    revisionFee: 2000,
    publicationFee: 3000,
    externalFunding: 1000,
  }), { rewardAmount: 10000, totalAmount: 14000 });

  assert.deepEqual(calculatePublicationRequestAmounts({
    hasReceivedReward: true,
    configuredReward: 10000,
    revisionFee: 2000,
    publicationFee: 3000,
    externalFunding: 1000,
  }), { rewardAmount: 0, totalAmount: 4000 });
});

test('validatePriorRewardRevisionFee requires a positive editing fee conditionally', () => {
  assert.equal(validatePriorRewardRevisionFee({ hasReceivedReward: false, revisionFee: 0 }), '');
  assert.match(validatePriorRewardRevisionFee({ hasReceivedReward: true, revisionFee: 0 }), /ค่าปรับปรุงบทความ/);
  assert.equal(validatePriorRewardRevisionFee({ hasReceivedReward: true, revisionFee: 1 }), '');
});
