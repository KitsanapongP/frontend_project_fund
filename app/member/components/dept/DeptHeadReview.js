"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Eye, RefreshCcw } from "lucide-react";
import PageLayout from "../common/PageLayout";
import Card from "../common/Card";
import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";
import { deptHeadAPI } from "@/app/lib/dept_head_api";

// Reuse the same lookup APIs used by the admin page
import defaultAdminApis, { commonAPI } from "@/app/lib/admin_submission_api";

// Detail pages for department-head workflow
import PublicationSubmissionDetailsDept from "./details/PublicationSubmissionDetailsDept";
import GeneralSubmissionDetailsDept from "./details/GeneralSubmissionDetailsDept";

/** ---------------- Utils ---------------- **/
const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

/** batch detail fetcher (with simple concurrency) */
async function fetchDetailsForRows(rows, { concurrency = 6 } = {}) {
  const ids = rows.map((r) => r.submission_id || r.id).filter(Boolean);
  const results = new Map();
  let idx = 0;
  async function worker() {
    while (idx < ids.length) {
      const my = ids[idx++];
      try {
        const detail = await deptHeadAPI.getSubmissionDetails(my);
        results.set(my, detail);
      } catch (e) {
        results.set(my, null);
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, ids.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/** --- cached lookup maps from commonAPI categories/subcategories --- */
const _catMap = new Map();
const _subMap = new Map();
let _lookupsLoaded = false;

async function ensureLookupsLoaded() {
  if (_lookupsLoaded) return;
  try {
    const [cats, subs] = await Promise.all([
      commonAPI.getCategories(),       // GET /api/v1/categories
      commonAPI.getSubcategories(),    // GET /api/v1/subcategories
    ]);
    const catList = cats?.categories || cats?.data || cats?.items || cats || [];
    const subList = subs?.subcategories || subs?.data || subs?.items || subs || [];

    for (const c of catList) {
      const id = c.category_id ?? c.id;
      const name = c.category_name ?? c.name ?? "-";
      if (id != null) _catMap.set(String(id), name);
    }
    for (const s of subList) {
      const id = s.subcategory_id ?? s.id;
      const name = s.subcategory_name ?? s.name ?? "-";
      if (id != null) _subMap.set(String(id), name);
    }
    _lookupsLoaded = true;
  } catch (e) {
    _lookupsLoaded = true;
  }
}

const inferSubmissionTypeFromNumber = (submissionNumber) => {
  const normalized = String(submissionNumber || "").trim().toUpperCase();
  if (normalized.startsWith("PR")) return "publication_reward";
  if (normalized.startsWith("FA")) return "fund_application";
  return "";
};

/** Pick the detail component based on submission type. */
function pickDetailsComponentBySubmissionType(submissionType, submissionNumber) {
  const normalizedType = String(submissionType || "").trim().toLowerCase();
  const inferredType = inferSubmissionTypeFromNumber(submissionNumber);
  const t = normalizedType || inferredType;

  if (t === "publication_reward") return "publication";
  if (t === "fund_application") return "general";
  // Fallback to general details view
  return "general";
}

function extractSubmissionTypeFromPayload(payload) {
  const detailType = payload?.details?.type;
  const submissionType = payload?.submission?.submission_type || payload?.submission_type;
  const normalizedDetailType = String(detailType || "").trim().toLowerCase();
  if (normalizedDetailType) return normalizedDetailType;
  const normalizedSubmissionType = String(submissionType || "").trim().toLowerCase();
  if (normalizedSubmissionType) return normalizedSubmissionType;
  return "";
}

/** Build normalized rows by combining list data with detail payloads. */
async function hydrateRows(listRows, detailMap) {
  await ensureLookupsLoaded();

  const out = await Promise.all((listRows || []).map(async (item) => {
    // Build a stable id using detail payload first, then list item
    const tentativeId = item?.submission_id ?? item?.id;
    const detail = detailMap?.get(tentativeId);
    const sub = detail?.submission || item;
    const id =
      sub?.submission_id ??
      item?.submission_id ??
      sub?.id ??
      item?.id;

    // Resolve applicant from submission_users when sub.user is missing
    const users = detail?.submission_users || [];
    const owner = users.find(u => u?.role === "owner" && u?.is_primary) || users.find(u => u?.role === "owner");
    const applicantRole = users.find(u => u?.role === "applicant");
    const anyUser = owner || applicantRole || users[0] || null;
    const userFromDetail = sub?.user || anyUser?.user || null;
    const applicantName =
      anyUser?.user?.full_name ||
      (userFromDetail ? `${userFromDetail.user_fname || ""} ${userFromDetail.user_lname || ""}`.trim() : null) ||
      item.applicant_name ||
      "-";

    // Resolve category/subcategory labels from details first, then lookup maps
    const catId = String(sub?.category_id ?? item?.category_id ?? "");
    const subId = String(sub?.subcategory_id ?? item?.subcategory_id ?? "");
    const catName =
      detail?.details?.data?.category?.category_name ||
      item.category_name || item.category?.category_name ||
      (_catMap.get(catId) || "-");
    const subName =
      detail?.details?.data?.subcategory?.subcategory_name ||
      item.subcategory_name || item.subcategory?.subcategory_name ||
      (_subMap.get(subId) || "-");

    // Use backend status label; fall back to status code when needed
    const code = String(
      sub?.status?.status_code ??
      sub?.status_code ??
      item?.status?.status_code ??
      item?.status_code ??
      ""
    ) || "";
    const statusLabel =
      sub?.status?.status_name ||
      item?.status?.status_name ||
      (code ? `สถานะ ${code}` : "ไม่ทราบสถานะ");

    const row = {
      id,
      submission_number: sub?.submission_number || item.submission_number || item.request_number || "-",
      category: catName,
      subcategory: subName,
      applicant: applicantName,
      submitted_at: sub?.submitted_at || item.submitted_at || item.created_at,
      status: statusLabel,
      status_code: code,
      submission_type: sub?.submission_type || item?.submission_type || "",
      raw: sub,
    };

    return row;
  }));

  return out;
}

/** ---------------- Component ---------------- **/
export default function DeptHeadReview() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);
  const [error, setError] = useState(null);

  // Detail mode state
  const [viewing, setViewing] = useState(null); // { id, submission_number, submission_type }

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load pending review submissions
      const listRes = await deptHeadAPI.getPendingReviews({ status_code: "5" });
      const listRows = listRes?.submissions || listRes?.data || [];

      const detailMap = await fetchDetailsForRows(listRows);
      const normalized = await hydrateRows(listRows, detailMap);

      const filtered = (normalized || []).filter((row) => {
        const label = (row?.status || '').trim();
        const code = String(row?.status_code || '')
          .trim()
          .toLowerCase();
        if (!label && !code) return true;
        if (label === 'ร่าง') return false;
        if (code === 'draft') return false;
        return true;
      });

      setRows(filtered);
    } catch (e) {
      setError(e?.message || "ไม่สามารถโหลดรายการคำร้องได้");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { header: "เลขคำร้อง", accessor: "submission_number" },
      { header: "ประเภททุน", accessor: "category" },
      {
        header: "หมวด/ทุนย่อย",
        accessor: "subcategory",
        // Truncate long text but keep full value in title
        render: (value) => (
          <span
            className="block max-w-[18rem] md:max-w-[28rem] truncate"
            title={value || "-"}
          >
            {value || "-"}
          </span>
        ),
      },
      { header: "ผู้ยื่นคำร้อง", accessor: "applicant" },
      {
        header: "วันที่ยื่น",
        accessor: "submitted_at",
        render: (value) => (
          <span className="text-gray-600">{formatDate(value)}</span>
        ),
      },
      {
        header: "สถานะ",
        accessor: "status",
        render: (value, row) => (
          <StatusBadge status={value} statusCode={row.status_code} />
        ),
      },
      {
        header: "ดำเนินการ",
        accessor: "actions",
        render: (_, row) => (
          <button
            onClick={async () => {
              const sid =
                row.raw?.submission_id ??
                row.raw?.SubmissionID ??
                row.id;
              const fallbackType =
                row.raw?.submission_type ||
                row.raw?.SubmissionType ||
                row.submission_type;

              let payloadType = "";
              setOpeningId(sid);
              try {
                const detailPayload = await deptHeadAPI.getSubmissionDetails(sid);
                payloadType = extractSubmissionTypeFromPayload(detailPayload);
              } catch (e) {
                payloadType = "";
              } finally {
                setOpeningId(null);
              }

              setViewing({
                id: sid,
                submission_number: row.submission_number,
                submission_type: payloadType || fallbackType,
              });
            }}
            disabled={openingId === (row.raw?.submission_id ?? row.raw?.SubmissionID ?? row.id)}
            className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            {openingId === (row.raw?.submission_id ?? row.raw?.SubmissionID ?? row.id) ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Eye size={16} />
            )}
            {openingId === (row.raw?.submission_id ?? row.raw?.SubmissionID ?? row.id)
              ? 'กำลังเปิด...'
              : 'ดูรายละเอียด'}
          </button>
        ),
      },
    ],
    []
  );

  // Render the correct details screen by submission type
  const renderViewer = () => {
    if (!viewing) return null;

    // Close detail view and refresh list
    const handleBack = () => {
      setViewing(null);
      load();
    };

    const which = pickDetailsComponentBySubmissionType(
      viewing.submission_type,
      viewing.submission_number
    );
    if (which === "publication") {
      return (
        <PublicationSubmissionDetailsDept
          submissionId={viewing.id}
          onBack={handleBack}
        />
      );
    }
    return (
      <GeneralSubmissionDetailsDept
        submissionId={viewing.id}
        onBack={handleBack}
      />
    );
  };

  // Show detail view instead of the table when a row is selected
  if (viewing) {
    return renderViewer();
  }

  return (
    <PageLayout
      title="พิจารณาคำร้องของหัวหน้าสาขา"
      subtitle="ตรวจสอบรายละเอียดคำร้องและบันทึกผลการพิจารณา"
      icon={ClipboardList}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/member" },
        { label: "พิจารณาคำร้องของหัวหน้าสาขา" },
      ]}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              รายการคำร้องที่รอการตรวจสอบ
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="px-3 py-1 text-sm rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <RefreshCcw size={16}/>
            </button>
          </div>
        </div>
      </div>

      <Card collapsible={false}>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-600">
            <Loader2 className="animate-spin mr-2" />
            กำลังโหลดข้อมูล...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600">{error}</div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            emptyMessage="ไม่มีคำร้องที่รอพิจารณา"
          />
        )}
      </Card>
    </PageLayout>
  );
}
