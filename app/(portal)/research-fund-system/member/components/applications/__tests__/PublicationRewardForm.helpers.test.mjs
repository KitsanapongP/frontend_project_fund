import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldDisableSubmitButton,
  buildExtractedPaperFormData,
  getExactBenchmarkDOIMatches,
  getPaperMatchStatusMessage,
  getAuthorSubmissionFields,
  calculatePublicationRequestAmounts,
  validateAuthorNameList,
  validatePriorRewardRevisionFee,
} from '../PublicationRewardForm.helpers.mjs';

test('benchmark DOI check ignores title matches and prior reward applications', () => {
  const matches = getExactBenchmarkDOIMatches([
    { source: 'publication_reward_details', match_type: 'doi_exact', id: 1 },
    { source: 'scopus_benchmark_documents', match_type: 'title_exact', id: 2 },
    { source: 'scopus_benchmark_documents', match_type: 'doi_exact', id: 3 },
  ]);
  assert.deepEqual(matches.map((item) => item.id), [3]);
  assert.deepEqual(getExactBenchmarkDOIMatches(null), []);
});

test('PDF source messages distinguish a database match from OCR without blocking the application', () => {
  assert.match(getPaperMatchStatusMessage({ kind: 'found', doi: '10.example/paper' }), /พบ DOI.*ฐานข้อมูลบทความ Scopus ที่จัดเก็บในระบบ/);
  const missing = getPaperMatchStatusMessage({ kind: 'not_found', doi: '10.example/other', ocrUsed: true });
  assert.match(missing, /ไม่พบข้อมูลของบทความนี้ในระบบ/);
  assert.match(missing, /ระบบ OCR/);
  assert.match(missing, /ยังสามารถยื่นขอทุน/);
  assert.match(getPaperMatchStatusMessage({ kind: 'unavailable', doi: '10.example/other' }), /ขณะนี้ไม่สามารถตรวจสอบ DOI/);
});

test('PDF metadata fills publication fields and clears analysis from a previously selected paper', () => {
  const previous = {
    article_title: 'Old paper', doi: '10.old/paper', journal_name: 'Old journal',
    author_name_list: 'Old Author', journal_year: '2020', abstract: 'Old abstract',
    journal_issue: '', journal_pages: '', journal_month: '', journal_url: '',
    abstract_summary_th: 'Old summary', paper_category_id: 3,
    classification_confidence: 'High', scopus_benchmark_document_id: 9,
    reward_amount: 1000,
  };
  const metadata = {
    title: 'New paper', doi: '10.1234/paper', journal_name: 'New journal',
    authors: ['Alice Smith', 'Bob Jones'], publication_year: 2024, abstract: 'New abstract',
    volume_issue: 'Vol. 6', page_numbers: '38421-38436', publication_month: '07',
  };
  const result = buildExtractedPaperFormData(previous, metadata, metadata.title, metadata.doi, 12);
  assert.equal(result.article_title, 'New paper');
  assert.equal(result.doi, '10.1234/paper');
  assert.equal(result.journal_name, 'New journal');
  assert.equal(result.author_name_list, 'Alice Smith, Bob Jones');
  assert.equal(result.journal_year, '2024');
  assert.equal(result.journal_issue, 'Vol. 6');
  assert.equal(result.journal_pages, '38421-38436');
  assert.equal(result.journal_month, '07');
  assert.equal(result.journal_url, 'https://doi.org/10.1234/paper');
  assert.equal(result.abstract, 'New abstract');
  assert.equal(result.scopus_benchmark_document_id, 12);
  assert.equal(result.abstract_summary_th, '');
  assert.equal(result.paper_category_id, null);
  assert.equal(result.classification_confidence, null);
  assert.equal(result.reward_amount, 1000);
});

test('PDF metadata without DOI keeps the DOI already entered in the form', () => {
  const result = buildExtractedPaperFormData(
    { doi: '10.manual/paper', journal_name: 'Entered journal', author_name_list: 'Entered Author', journal_year: '2022' },
    { authors: [] },
    'Paper title',
    '',
    null,
  );
  assert.equal(result.doi, '10.manual/paper');
  assert.equal(result.journal_name, 'Entered journal');
  assert.equal(result.author_name_list, 'Entered Author');
  assert.equal(result.journal_year, '2022');
  assert.equal(result.scopus_benchmark_document_id, null);
});

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

test('validateAuthorNameList accepts comma-separated Thai and English full names', () => {
  assert.equal(
    validateAuthorNameList('สมชาย ใจดี, สมหญิง รักเรียน, มานะ ขยันดี'),
    '',
  );
  assert.equal(validateAuthorNameList('กิตติพงษ์ พรพรรณ, สุภวิชญ์ จำรัส'), '');
});

test('validateAuthorNameList rejects non-name values and invalid separators', () => {
  assert.match(validateAuthorNameList('Kitsanapong'), /ชื่อและนามสกุล/);
  assert.match(validateAuthorNameList('Anan Srisuk; Nattaya Wongchai'), /comma/);
  assert.match(validateAuthorNameList('Anan Srisuk123'), /ชื่อและนามสกุล/);
  assert.match(validateAuthorNameList('name@example.com'), /ชื่อและนามสกุล/);
  assert.match(validateAuthorNameList('Anan Srisuk,'), /คั่นแต่ละชื่อ/);
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
