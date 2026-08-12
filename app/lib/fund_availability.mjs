export const FUND_210_HINT = '* ผู้ขอทุนสามารถยื่นขอทุนนี้ได้ ที่รายการทุนที่ 2.2 หรือ 2.3';

export function normalizeFundStatus(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function isFundOpenForApplications(fund) {
  const status = normalizeFundStatus(fund?.status ?? fund?.subcategory_status);
  return status === '' || status === 'active';
}

export function getFundCode(fund) {
  const explicitCode = String(fund?.subcategory_code ?? fund?.subcategoryCode ?? '').trim();
  if (explicitCode) return explicitCode.toLowerCase();

  const name = String(fund?.subcategory_name ?? fund?.subcategorie_name ?? '').trim();
  const prefixMatch = name.match(/^([0-9]+[.][0-9]+)(?:\s|$)/);
  return prefixMatch?.[1]?.toLowerCase() ?? '';
}

export function getFundDisplayHint(fund) {
  const code = getFundCode(fund);
  return code === '2.10' ? FUND_210_HINT : '';
}

export function getFundCondition(fund) {
  const condition = String(fund?.fund_condition ?? '').trim();
  const normalized = condition.toLowerCase();
  return normalized === 'null' || normalized === 'undefined' ? '' : condition;
}

export function getSubmissionFundStatus(submission) {
  return normalizeFundStatus(
    submission?.subcategory?.status ??
      submission?.Subcategory?.status ??
      submission?.Subcategory?.Status ??
      submission?.fund_application_detail?.subcategory?.status ??
      submission?.FundApplicationDetail?.Subcategory?.Status ??
      submission?.fund_status,
  );
}
