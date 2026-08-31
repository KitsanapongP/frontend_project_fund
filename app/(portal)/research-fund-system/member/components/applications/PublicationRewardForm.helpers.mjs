export const shouldDisableSubmitButton = ({
  loading,
  saving,
  subcategoryId,
  subcategoryBudgetId,
  declarations,
  authorNameList,
  signature,
}) => {
  const hasAuthorNames = (authorNameList || '').trim().length > 0;
  const hasSignature = (signature || '').trim().length > 0;

  return (
    loading ||
    saving ||
    !subcategoryId ||
    !subcategoryBudgetId ||
    !declarations?.confirmNoPreviousFunding ||
    !declarations?.agreeToRegulations ||
    !hasAuthorNames ||
    !hasSignature
  );
};

export const getAuthorSubmissionFields = (formData = {}) => {
  const authorNameList = (formData.author_name_list || '').trim();
  const signature = (formData.signature || '').trim();

  return {
    author_name_list: authorNameList,
    signature,
  };
};

const AUTHOR_NAME_PART_PATTERN = /^(?=.*\p{L})[\p{L}\p{M}.'’-]+$/u;

export const validateAuthorNameList = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) return '';

  const authors = normalizedValue.split(',');
  if (authors.some((author) => !author.trim())) {
    return 'กรุณากรอกรายชื่อผู้แต่งให้ครบ และคั่นแต่ละชื่อด้วย comma (,)';
  }

  const hasInvalidAuthor = authors.some((author) => {
    const nameParts = author.trim().split(/\s+/).filter(Boolean);
    return (
      nameParts.length < 2 ||
      nameParts.some((part) => !AUTHOR_NAME_PART_PATTERN.test(part))
    );
  });

  return hasInvalidAuthor
    ? 'กรุณากรอกเฉพาะชื่อและนามสกุลจริง โดยคั่นแต่ละคนด้วย comma (,)'
    : '';
};

export const calculatePublicationRequestAmounts = ({
  hasReceivedReward = false,
  configuredReward = 0,
  revisionFee = 0,
  publicationFee = 0,
  externalFunding = 0,
} = {}) => {
  const toAmount = (value) => {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const rewardAmount = hasReceivedReward ? 0 : toAmount(configuredReward);
  const totalAmount = rewardAmount
    + toAmount(revisionFee)
    + toAmount(publicationFee)
    - toAmount(externalFunding);

  return { rewardAmount, totalAmount };
};

export const validatePriorRewardRevisionFee = ({ hasReceivedReward = false, revisionFee = 0 } = {}) => {
  if (!hasReceivedReward) return '';
  return Number.parseFloat(revisionFee) > 0
    ? ''
    : 'กรุณากรอกค่าปรับปรุงบทความมากกว่า 0 บาท สำหรับผู้ที่เคยขอเงินรางวัลแล้ว';
};
