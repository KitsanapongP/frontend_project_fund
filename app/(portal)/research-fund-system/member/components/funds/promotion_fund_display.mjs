import { getFundCode, getFundCondition, isFundOpenForApplications } from '../../../../../lib/fund_availability.mjs';

export const PUBLICATION_REWARD_DISPLAY_NAME = '2.2 - 2.3 เงินรางวัลการตีพิมพ์และเงินสมทบค่าธรรมเนียม (APC)';

export function matchesPromotionFundSearch(fund, searchTerm) {
  const term = String(searchTerm).toLowerCase();
  return [fund.subcategory_name, fund.fund_condition, ...(fund.search_names || [])]
    .some((value) => String(value || '').toLowerCase().includes(term));
}

export function mergePublicationRewardRows(categories) {
  return categories.map((category) => {
    if (!Array.isArray(category.subcategories)) return category;

    const publicationFund = (code) => category.subcategories.find(
      (fund) => fund.form_type === 'publication_reward' && getFundCode(fund) === code
    );
    const firstAuthorFund = publicationFund('2.2');
    const correspondingAuthorFund = publicationFund('2.3');
    if (!firstAuthorFund || !correspondingAuthorFund) return category;

    const sourceFunds = [firstAuthorFund, correspondingAuthorFund];
    const representative = sourceFunds.find(isFundOpenForApplications) || firstAuthorFund;
    const conditions = sourceFunds
      .map((fund) => ({ code: getFundCode(fund), text: getFundCondition(fund) }))
      .filter(({ text }) => text);
    const mergedCondition = conditions.length === 2 && conditions[0].text !== conditions[1].text
      ? conditions.map(({ code, text }) => `${code}: ${text}`).join('\n\n')
      : conditions[0]?.text || '';

    const displayFund = {
      ...representative,
      subcategory_name: PUBLICATION_REWARD_DISPLAY_NAME,
      subcategory_code: '2.2-2.3',
      fund_condition: mergedCondition,
      search_names: sourceFunds.map((fund) => fund.subcategory_name || ''),
      is_publication_reward_highlight: true,
    };

    return {
      ...category,
      subcategories: category.subcategories.flatMap((fund) => {
        if (fund === firstAuthorFund) return [displayFund];
        if (fund === correspondingAuthorFund) return [];
        return [fund];
      }),
    };
  });
}
