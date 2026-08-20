// app/admin/components/submissions/SubmissionTable.js
'use client';

import { ArrowUpDown, ChevronDown, ChevronUp, Eye, FileText } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SubmissionTable({
  submissions,
  loading,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onRefresh,
  // lookups / enrichments
  catMap = {},
  subMap = {},
  // kept for compatibility with parent props
  budgetMap = {},
  subBudgetDescMap = {},
  detailsMap = {},
  userMap = {},
}) {
  // ---------- helpers ----------
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount) => {
    const n = Number(amount ?? 0);
    if (!isFinite(n) || n <= 0) return '-';
    return `${n.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}฿`;
  };

  const handleSort = (column) => onSort(column);

  const getSortIcon = (column) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" aria-hidden="true" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-blue-600" aria-hidden="true" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-600" aria-hidden="true" />
    );
  };

  // ---- Name helpers for fixed table columns ----
  const getCategoryName = (s) =>
    s?.Category?.category_name ||
    (s?.category_id != null ? catMap[String(s.category_id)] : undefined) ||
    s?.category_name || '-';

  const getSubcategoryName = (s) =>
    s?.Subcategory?.subcategory_name ||
    s?.subcategory?.subcategory_name ||
    (s?.subcategory_id != null ? subMap[String(s.subcategory_id)] : undefined) ||
    s?.FundApplicationDetail?.Subcategory?.subcategory_name ||
    s?.fund_application_detail?.Subcategory?.subcategory_name ||
    s?.SubcategoryName ||
    s?.subcategory_name || '-';

  // ----- Normalize detail payloads -----
  const getDP = (s) => detailsMap[s.submission_id] || null;
  const getDPO = (s) =>
    getDP(s)?.details?.data ||
    getDP(s)?.data ||
    getDP(s)?.payload ||
    getDP(s) ||
    null;

  const getPRDetail = (s) => {
    const dpo = getDPO(s);
    return (
      s?.PublicationRewardDetail ||
      s?.publication_reward_detail ||
      dpo?.PublicationRewardDetail ||
      dpo?.publication_reward_detail ||
      dpo?.submission?.PublicationRewardDetail ||
      dpo?.Submission?.PublicationRewardDetail ||
      (dpo && (dpo.paper_title || dpo.total_amount || dpo.reward_amount) ? dpo : null) ||
      null
    );
  };

  const getArticleTitle = (s) => {
    const dpo = getDPO(s);

    // 1) For fund applications, prefer project title first
    const faTitle =
      s?.FundApplicationDetail?.project_title ||
      s?.fund_application_detail?.project_title ||
      dpo?.FundApplicationDetail?.project_title ||
      dpo?.project_title;
    if (faTitle) return faTitle;

    // 2) For publication rewards, support both nested and flat payload shapes
    const pr =
      s?.PublicationRewardDetail ||
      s?.publication_reward_detail ||
      dpo?.PublicationRewardDetail ||
      dpo?.publication_reward_detail ||
      dpo?.submission?.PublicationRewardDetail ||
      dpo?.Submission?.PublicationRewardDetail ||
      null;

    const fromPr =
      pr?.paper_title ||
      pr?.paperTitle ||
      pr?.article_title ||
      pr?.title_th ||
      pr?.title;

    const fromDpo =
      dpo?.paper_title ||
      dpo?.paperTitle ||
      dpo?.article_title ||
      dpo?.title_th ||
      dpo?.title;

    return fromPr || fromDpo || s?.paper_title || s?.project_title || s?.title || '-';
  };


  // Support snake_case, camelCase, and PascalCase user fields
  const pickNameFromUserObj = (u) => {
    if (!u || typeof u !== 'object') return '';
    const display =
      u.display_name || u.DisplayName || u.full_name || u.FullName || '';
    const first =
      u.user_fname || u.first_name || u.given_name ||
      u.UserFname || u.FirstName || u.GivenName ||
      u.name_th || u.name || '';
    const last =
      u.user_lname || u.last_name || u.family_name ||
      u.UserLname || u.LastName || u.FamilyName ||
      u.surname_th || u.surname || '';
    const email = u.email || u.user_email || u.Email || u.UserEmail || '';
    const username = u.username || u.UserName || '';
    const name = (display || `${first} ${last}`.trim()).trim();
    return name || email || username;
  };

  // Resolve applicant name from row, detail payload, and fallback maps
  const getAuthorName = (s) => {
    // 1) Read directly from joined row user objects
    const uRow = s?.User || s?.user || s?.applicant;
    const rowName = pickNameFromUserObj(uRow);
    if (rowName) return rowName;

    // 2) Fall back to row-specific detail payload (detailsMap)
    const dp  = getDP(s);
    const dpo = getDPO(s);
    const uDetails =
      dpo?.submission?.user || dpo?.submission?.User ||
      dpo?.user || dp?.applicant || dpo?.applicant || null;

    const nameFromDetails = pickNameFromUserObj(uDetails);
    if (nameFromDetails) return nameFromDetails;

    // 3) Fall back to userMap prepared by parent (keyed by submissions.user_id)
    if (s?.user_id && userMap[String(s.user_id)]) return userMap[String(s.user_id)];

    // 4) Handle fully flat fields from backend responses
    const flat = pickNameFromUserObj({
      user_fname: s.user_fname, user_lname: s.user_lname,
      email: s.email || s.user_email,
      UserFname: s.UserFname, UserLname: s.UserLname, Email: s.Email
    });
    if (flat) return flat;

    if (s?.applicant_name) return s.applicant_name;

    // 5) Final fallback: keep text readable instead of showing raw IDs
    return 'ไม่ระบุผู้ยื่น';
  };

  const getAmount = (s) => {
    // 1) Publication reward: derive total from detail fields
    const pr = getPRDetail(s);
    if (pr) {
      const total =
        pr.total_amount ?? pr.total_reward_amount ?? pr.net_amount ??
        ((pr.reward_amount || 0) +
         (pr.revision_fee || 0) +
         (pr.publication_fee || 0) -
         (pr.external_funding_amount || 0));
      const n = Number(total || 0);
      return isFinite(n) ? n : 0;
    }

    const flatPublicationAmount = Number(
      s?.total_amount ?? s?.total_reward_amount ?? s?.net_amount ?? s?.requested_amount
    );
    if (Number.isFinite(flatPublicationAmount) && flatPublicationAmount > 0) {
      return flatPublicationAmount;
    }

    // 2) Fund application (and others): always show requested amount
    const dpo = getDPO(s) || {};
    const fa =
      s?.FundApplicationDetail ||
      dpo?.FundApplicationDetail ||
      // Treat flat payload with requested_amount/project_title as FA detail
      (dpo && (dpo.requested_amount != null || dpo.project_title != null) ? dpo : null);

    const requested = Number(
      (fa?.requested_amount ?? s?.requested_amount ?? s?.amount ?? 0)
    );
    return isFinite(requested) ? requested : 0;
  };

  const getDisplayDate = (s) => s?.display_date || s?.submitted_at || s?.created_at;

  const makeRowKey = (s) => {
    const id = s?.submission_id ?? s?.id ?? 'na';
    const type = s?.submission_type || s?.form_type || 'general';
    const ts = s?.updated_at || s?.created_at || s?.submitted_at || '';
    return `${type}:${id}:${ts}`;
  };

  const getRowData = (submission) => ({
    amount: getAmount(submission),
    categoryName: getCategoryName(submission),
    subcategoryName: getSubcategoryName(submission),
    articleTitle: getArticleTitle(submission),
    authorName: getAuthorName(submission),
    id: submission.submission_id || submission.id,
  });

  const viewButtonClassName =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

  // ---------- UI states ----------
  if (loading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-600" aria-live="polite">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 motion-reduce:animate-none" aria-hidden="true" />
        <p className="font-medium">กำลังโหลดข้อมูลคำร้อง...</p>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">ไม่พบข้อมูลคำร้อง</h3>
        <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">ลองเปลี่ยนปีงบประมาณ ตัวกรอง หรือคำค้นหา</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-[1080px] w-full text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-600">
          <tr>
            <th scope="col" className="px-5 py-3">
              <button
                type="button"
                onClick={() => handleSort('submission_number')}
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-left font-medium transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="เรียงตามเลขที่คำร้อง"
              >
                <span>เลขที่คำร้อง</span>
                {getSortIcon('submission_number')}
              </button>
            </th>
            <th scope="col" className="w-1/5 px-5 py-3">ทุน</th>
            <th scope="col" className="w-1/4 px-5 py-3">ชื่อเรื่อง</th>
            <th scope="col" className="px-5 py-3">ผู้ยื่น</th>
            <th scope="col" className="px-5 py-3 text-center">จำนวนเงิน</th>
            <th scope="col" className="px-5 py-3 text-center">
              <button
                type="button"
                onClick={() => handleSort('status_id')}
                className="mx-auto inline-flex min-h-11 items-center gap-1 rounded-md px-1 font-medium transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="เรียงตามสถานะ"
              >
                <span>สถานะ</span>
                {getSortIcon('status_id')}
              </button>
            </th>
            <th scope="col" className="px-5 py-3">
              <button
                type="button"
                onClick={() => handleSort('created_at')}
                className="inline-flex min-h-11 items-center gap-1 rounded-md px-1 font-medium transition-colors hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="เรียงตามวันที่ส่งคำร้อง"
              >
                <span>วันที่ส่งคำร้อง</span>
                {getSortIcon('created_at')}
              </button>
            </th>
            <th scope="col" className="px-5 py-3 text-center">จัดการ</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200 bg-white">
          {submissions.map((s) => {
            const row = getRowData(s);
            return (
              <tr key={makeRowKey(s)} className="transition-colors hover:bg-blue-50/60">
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900 tabular-nums">
                  {s.submission_number || s.id || '-'}
                </td>
                <td className="px-5 py-4 text-slate-700">
                  <span className="block max-w-72 break-words font-medium text-slate-800" title={row.subcategoryName}>
                    {row.subcategoryName}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">{row.categoryName}</span>
                </td>
                <td className="px-5 py-4 text-slate-700">
                  <span title={row.articleTitle} className="line-clamp-2 break-words leading-6">
                    {row.articleTitle}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-700">{row.authorName}</td>
                <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-900 tabular-nums">
                  {formatCurrency(row.amount)}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-center">
                  <StatusBadge
                    statusId={s.status_id}
                    fallbackLabel={s.display_status || s.status?.status_name}
                  />
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500 tabular-nums">
                  {formatDate(getDisplayDate(s))}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-center">
                  <button type="button" onClick={() => onView(row.id)} className={viewButtonClassName} aria-label={`ดูรายละเอียดคำร้อง ${s.submission_number || s.id || ''}`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    ดูรายละเอียด
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <div className="divide-y divide-slate-200 lg:hidden">
        {submissions.map((submission) => {
          const row = getRowData(submission);
          return (
            <article key={makeRowKey(submission)} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-blue-700 tabular-nums">
                    {submission.submission_number || submission.id || '-'}
                  </p>
                  <h3 className="mt-1 break-words font-semibold leading-6 text-slate-900">{row.articleTitle}</h3>
                </div>
                <StatusBadge
                  statusId={submission.status_id}
                  fallbackLabel={submission.display_status || submission.status?.status_name}
                  className="self-start"
                />
              </div>

              <dl className="mt-4 grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">ผู้ยื่น</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">{row.authorName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">จำนวนเงิน</dt>
                  <dd className="mt-0.5 font-medium text-slate-900 tabular-nums">{formatCurrency(row.amount)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">หมวดทุน</dt>
                  <dd className="mt-0.5 text-slate-800">{row.categoryName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">ประเภททุน</dt>
                  <dd className="mt-0.5 text-slate-800">{row.subcategoryName}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">วันที่ส่งคำร้อง</dt>
                  <dd className="mt-0.5 text-slate-800 tabular-nums">{formatDate(getDisplayDate(submission))}</dd>
                </div>
              </dl>

              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                <button type="button" onClick={() => onView(row.id)} className={`${viewButtonClassName} w-full sm:w-auto`} aria-label={`ดูรายละเอียดคำร้อง ${submission.submission_number || submission.id || ''}`}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  ดูรายละเอียด
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
