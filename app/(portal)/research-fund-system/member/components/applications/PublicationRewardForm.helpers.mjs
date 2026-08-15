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
