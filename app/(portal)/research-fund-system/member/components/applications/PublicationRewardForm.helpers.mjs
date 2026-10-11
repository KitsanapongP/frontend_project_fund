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

const doiArticleURL = (doi, fallback) => {
  const canonical = String(doi || '').trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
  return /^10\.\d{4,9}\//i.test(canonical) ? `https://doi.org/${canonical}` : fallback;
};

export const buildExtractedPaperFormData = (previous, metadata, title, doi, matchedBenchmarkId) => ({
  ...previous,
  article_title: title,
  doi: doi || previous.doi,
  journal_name: metadata?.journal_name || previous.journal_name,
  journal_issue: metadata?.volume_issue || previous.journal_issue,
  journal_pages: metadata?.page_numbers || previous.journal_pages,
  journal_month: metadata?.publication_month || previous.journal_month,
  journal_url: doiArticleURL(doi, previous.journal_url),
  author_name_list: Array.isArray(metadata?.authors) && metadata.authors.length > 0
    ? metadata.authors.join(', ')
    : previous.author_name_list,
  journal_year: metadata?.publication_year ? String(metadata.publication_year) : previous.journal_year,
  abstract: metadata?.abstract || previous.abstract,
  abstract_summary_th: '',
  paper_category_id: null,
  paper_category_name: '',
  classification_confidence: null,
  classification_model: '',
  classification_taxonomy_version: '',
  scopus_benchmark_document_id: matchedBenchmarkId,
});

export const getExactBenchmarkDOIMatches = (candidates = []) => (
  Array.isArray(candidates)
    ? candidates.filter((item) =>
      item?.source === 'scopus_benchmark_documents' && item?.match_type === 'doi_exact'
    )
    : []
);

export const getPaperMatchStatusMessage = ({ kind, doi, ocrUsed } = {}) => {
  const pdfSource = ocrUsed ? 'ระบบ OCR' : 'การอ่านข้อความใน PDF';
  switch (kind) {
    case 'found':
      return `พบ DOI ${doi} ในฐานข้อมูลบทความ Scopus ที่จัดเก็บในระบบ ข้อมูลที่นำเข้าในแบบฟอร์มได้จาก${pdfSource} โปรดตรวจสอบความถูกต้องก่อนบันทึก`;
    case 'not_found':
      return `ไม่พบข้อมูลของบทความนี้ในระบบ จึงใช้ข้อมูลจาก${ocrUsed ? 'ไฟล์ PDF ผ่านระบบ OCR แทน' : 'การอ่านข้อความใน PDF แทน'} โดยท่านยังสามารถยื่นขอทุนได้ตามปกติ`;
    case 'no_doi':
      return `ไม่พบ DOI ในไฟล์ PDF จึงไม่สามารถตรวจสอบกับฐานข้อมูลบทความ Scopus ที่จัดเก็บในระบบได้ ข้อมูลที่นำเข้าในแบบฟอร์มได้จาก${pdfSource} ผู้ยื่นคำร้องยังสามารถยื่นขอทุนเพื่อรับการพิจารณาได้`;
    case 'multiple':
      return `พบ DOI ${doi} มากกว่าหนึ่งรายการในฐานข้อมูลบทความ Scopus ที่จัดเก็บในระบบ จึงยังไม่สามารถเชื่อมโยงกับรายการใดได้ ข้อมูลที่นำเข้าในแบบฟอร์มได้จาก${pdfSource} ผู้ยื่นคำร้องยังสามารถยื่นขอทุนเพื่อรับการพิจารณาได้`;
    case 'unavailable':
      return `ขณะนี้ไม่สามารถตรวจสอบ DOI ${doi} กับฐานข้อมูลบทความ Scopus ที่จัดเก็บในระบบได้ ข้อมูลที่นำเข้าในแบบฟอร์มได้จาก${pdfSource} ผู้ยื่นคำร้องยังสามารถยื่นขอทุนเพื่อรับการพิจารณาได้`;
    default:
      return '';
  }
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
