"use client";

import { useEffect, useMemo, useState } from "react";
import { publicationsAPI, usersAPI, thaiJOImportAPI } from "@/app/lib/api";
import PageLayout from "../../common/PageLayout";

const MESSAGE_TONE_STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

const MESSAGE_TONE_ICONS = {
  success: "✔",
  error: "✖",
  warning: "⚠",
  info: "ℹ",
};

const manualSummaryItems = [
  { key: "documents_fetched", label: "ดึงข้อมูลบทความ" },
  { key: "documents_created", label: "บทความเพิ่มใหม่" },
  { key: "documents_updated", label: "บทความอัปเดต" },
  { key: "documents_failed", label: "บทความผิดพลาด" },
  { key: "authors_created", label: "ผู้เขียนเพิ่มใหม่" },
  { key: "authors_updated", label: "ผู้เขียนอัปเดต" },
  { key: "journals_created", label: "วารสารเพิ่มใหม่" },
  { key: "journals_updated", label: "วารสารอัปเดต" },
  { key: "document_authors_inserted", label: "ลิงก์ผู้เขียนเพิ่มใหม่" },
  { key: "document_authors_updated", label: "ลิงก์ผู้เขียนอัปเดต" },
  { key: "rejected_hits", label: "รายการถูกตัดทิ้ง" },
];

const batchSummaryItems = [
  { key: "users_processed", label: "ผู้ใช้งานที่ประมวลผล" },
  { key: "users_with_errors", label: "ผู้ใช้ที่ผิดพลาด" },
  ...manualSummaryItems,
];

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadge(statusText) {
  const normalized = (statusText || "").toLowerCase();
  if (["success", "completed", "done"].includes(normalized)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["failed", "error"].includes(normalized)) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (["running", "in_progress", "in-progress"].includes(normalized)) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function isRunningStatus(statusText) {
  const normalized = (statusText || "").toLowerCase();
  return ["running", "in_progress", "in-progress"].includes(normalized);
}

function isStaleRunning(startedAt) {
  if (!startedAt) return false;
  const d = new Date(startedAt);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() > 2 * 60 * 60 * 1000;
}

function isBlockingBatchRun(run) {
  if (!isRunningStatus(run?.status)) return false;
  return !isStaleRunning(run?.started_at);
}

function SummaryGrid({ summary, items }) {
  if (!summary) return null;
  return (
    <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ key, label }) => (
        <div key={key} className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-900">
            {Number(summary?.[key] ?? 0).toLocaleString("th-TH")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function AdminThaiJOImport() {
  const [userQuery, setUserQuery] = useState("");
  const [userHits, setUserHits] = useState([]);
  const [userId, setUserId] = useState("");
  const [thaiJOAuthorId, setThaiJOAuthorId] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);

  const [searching, setSearching] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualAction, setManualAction] = useState("");
  const [batchRunning, setBatchRunning] = useState(false);

  const [msg, setMsg] = useState("");
  const [msgTone, setMsgTone] = useState("info");

  const [lastManualSummary, setLastManualSummary] = useState(null);
  const [lastBatchSummary, setLastBatchSummary] = useState(null);

  const [batchRuns, setBatchRuns] = useState([]);
  const [batchRunsLoading, setBatchRunsLoading] = useState(false);
  const [batchRunsError, setBatchRunsError] = useState("");
  const [batchRunsPagination, setBatchRunsPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 0,
    total_count: 0,
    has_next: false,
    has_prev: false,
  });
  const [batchRunsPage, setBatchRunsPage] = useState(1);
  const [batchUserIds, setBatchUserIds] = useState("");
  const [batchLimit, setBatchLimit] = useState("");

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [jobsPagination, setJobsPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 0,
    total_count: 0,
    has_next: false,
    has_prev: false,
  });
  const [jobsPage, setJobsPage] = useState(1);

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsPagination, setRequestsPagination] = useState({
    current_page: 1,
    per_page: 10,
    total_pages: 0,
    total_count: 0,
    has_next: false,
    has_prev: false,
  });
  const [requestsPage, setRequestsPage] = useState(1);

  const selectedUser = useMemo(
    () => userHits.find((hit) => String(hit.user_id) === String(userId)) || null,
    [userHits, userId]
  );

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === String(selectedJobId)) || null,
    [jobs, selectedJobId]
  );

  const hasBatchRunRunning = useMemo(
    () => batchRuns.some((run) => isBlockingBatchRun(run)),
    [batchRuns]
  );

  const disableManualActions = manualBusy || batchRunning;
  const disableSearchButton = !userQuery.trim() || searching || disableManualActions;
  const disableBatchButton = batchRunning || manualBusy || hasBatchRunRunning;

  useEffect(() => {
    fetchJobs(1);
    fetchBatchRuns(1);
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      fetchRequests(selectedJobId, 1);
    }
  }, [selectedJobId]);

  async function fetchJobs(page = 1) {
    setJobsLoading(true);
    setJobsError("");
    try {
      const res = await thaiJOImportAPI.listJobs({ page });
      const items = Array.isArray(res?.data) ? res.data : [];
      setJobs(items);
      if (items.length > 0) {
        const stillExists = items.some((job) => String(job.id) === String(selectedJobId));
        if (!selectedJobId || !stillExists) {
          setSelectedJobId(items[0].id);
        }
      }
      const paginationRaw = res?.pagination || {};
      const normalized = {
        current_page: paginationRaw.current_page ?? page,
        per_page: paginationRaw.per_page ?? 10,
        total_pages: paginationRaw.total_pages ?? paginationRaw.totalPages ?? 0,
        total_count: paginationRaw.total_count ?? paginationRaw.totalCount ?? items.length,
        has_next: paginationRaw.has_next ?? false,
        has_prev: paginationRaw.has_prev ?? false,
      };
      setJobsPagination(normalized);
      setJobsPage(normalized.current_page);
    } catch (error) {
      setJobsError(error?.message || "ไม่สามารถโหลดประวัติการเรียก ThaiJO API ได้");
    } finally {
      setJobsLoading(false);
    }
  }

  async function fetchBatchRuns(page = 1) {
    setBatchRunsLoading(true);
    setBatchRunsError("");
    try {
      const res = await thaiJOImportAPI.listBatchRuns({ page });
      const items = Array.isArray(res?.data) ? res.data : [];
      setBatchRuns(items);
      setLastBatchSummary(items[0] || null);
      const paginationRaw = res?.pagination || {};
      const normalized = {
        current_page: paginationRaw.current_page ?? page,
        per_page: paginationRaw.per_page ?? 10,
        total_pages: paginationRaw.total_pages ?? paginationRaw.totalPages ?? 0,
        total_count: paginationRaw.total_count ?? paginationRaw.totalCount ?? items.length,
        has_next: paginationRaw.has_next ?? false,
        has_prev: paginationRaw.has_prev ?? false,
      };
      setBatchRunsPagination(normalized);
      setBatchRunsPage(normalized.current_page);
      return items;
    } catch (error) {
      setBatchRuns([]);
      setLastBatchSummary(null);
      setBatchRunsError(error?.message || "ไม่สามารถโหลดประวัติ Batch ได้");
      return [];
    } finally {
      setBatchRunsLoading(false);
    }
  }

  async function fetchRequests(jobId, page = 1) {
    if (!jobId) return;
    setRequestsLoading(true);
    try {
      const res = await thaiJOImportAPI.listRequests(jobId, { page });
      const items = Array.isArray(res?.data) ? res.data : [];
      setRequests(items);
      const paginationRaw = res?.pagination || {};
      const normalized = {
        current_page: paginationRaw.current_page ?? page,
        per_page: paginationRaw.per_page ?? 10,
        total_pages: paginationRaw.total_pages ?? paginationRaw.totalPages ?? 0,
        total_count: paginationRaw.total_count ?? paginationRaw.totalCount ?? items.length,
        has_next: paginationRaw.has_next ?? false,
        has_prev: paginationRaw.has_prev ?? false,
      };
      setRequestsPagination(normalized);
      setRequestsPage(normalized.current_page);
    } catch (error) {
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }

  async function searchUsers() {
    if (!userQuery.trim()) return;
    setSearching(true);
    setMsg("");
    try {
      const res = await usersAPI.search(userQuery.trim());
      const hits = Array.isArray(res?.data) ? res.data : [];
      setUserHits(hits);
      if (!hits.length) {
        setMsg("ไม่พบผู้ใช้ที่ตรงคำค้น");
        setMsgTone("warning");
      }
    } catch (error) {
      setMsg(error?.message || "ค้นหาไม่สำเร็จ");
      setMsgTone("error");
    } finally {
      setSearching(false);
    }
  }

  function onSelectUser(nextUserId) {
    setUserId(nextUserId);
    const hit = userHits.find((item) => String(item.user_id) === String(nextUserId));
    setThaiJOAuthorId(hit?.thaijo_author_id || "");
    setSyncEnabled(Boolean(hit?.thaijo_sync_enabled));
  }

  async function saveThaiJOAuthorId() {
    if (!userId) {
      setMsg("กรุณาเลือก User ID ก่อน");
      setMsgTone("warning");
      return;
    }
    if (!thaiJOAuthorId.trim()) {
      setMsg("กรุณากรอก ThaiJO Author ID");
      setMsgTone("warning");
      return;
    }
    setManualBusy(true);
    setManualAction("save-id");
    setMsg("");
    try {
      await usersAPI.setThaiJOAuthorId(userId, thaiJOAuthorId.trim());
      setUserHits((prev) =>
        prev.map((hit) =>
          String(hit.user_id) === String(userId)
            ? { ...hit, thaijo_author_id: thaiJOAuthorId.trim() }
            : hit
        )
      );
      setMsg(`บันทึก ThaiJO Author ID (${thaiJOAuthorId.trim()}) เรียบร้อย`);
      setMsgTone("success");
    } catch (error) {
      setMsg(error?.message || "บันทึก ThaiJO Author ID ไม่สำเร็จ");
      setMsgTone("error");
    } finally {
      setManualBusy(false);
      setManualAction("");
    }
  }

  async function saveThaiJOSyncEnabled() {
    if (!userId) {
      setMsg("กรุณาเลือก User ID ก่อน");
      setMsgTone("warning");
      return;
    }
    setManualBusy(true);
    setManualAction("save-sync");
    setMsg("");
    try {
      await usersAPI.setThaiJOSyncEnabled(userId, syncEnabled);
      setUserHits((prev) =>
        prev.map((hit) =>
          String(hit.user_id) === String(userId)
            ? { ...hit, thaijo_sync_enabled: syncEnabled }
            : hit
        )
      );
      setMsg(`อัปเดตสถานะ ThaiJO Sync เป็น ${syncEnabled ? "เปิด" : "ปิด"} เรียบร้อย`);
      setMsgTone("success");
    } catch (error) {
      setMsg(error?.message || "อัปเดตสถานะ ThaiJO Sync ไม่สำเร็จ");
      setMsgTone("error");
    } finally {
      setManualBusy(false);
      setManualAction("");
    }
  }

  async function importManual() {
    if (!userId) {
      setMsg("กรุณาเลือกผู้ใช้ก่อน");
      setMsgTone("warning");
      return;
    }
    setManualBusy(true);
    setManualAction("import");
    setMsg("");
    try {
      const summary = await publicationsAPI.importThaiJOForUser(userId);
      setLastManualSummary(summary);
      setMsg("นำเข้าจาก ThaiJO สำเร็จ");
      setMsgTone("success");
      fetchJobs(1);
    } catch (error) {
      setMsg(error?.message || "นำเข้าไม่สำเร็จ");
      setMsgTone("error");
    } finally {
      setManualBusy(false);
      setManualAction("");
    }
  }

  async function importBatch() {
    setBatchRunning(true);
    setMsg("");
    try {
      const latestRuns = await fetchBatchRuns(1);
      const running = latestRuns.some((run) => isBlockingBatchRun(run));
      if (running) {
        setMsg("มี ThaiJO Batch Import ที่กำลังรันอยู่แล้ว กรุณารอให้เสร็จก่อน");
        setMsgTone("warning");
        return;
      }

      const payload = {};
      if (batchUserIds.trim()) {
        payload.user_ids = batchUserIds
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .join(",");
      }
      if (batchLimit.trim()) {
        payload.limit = batchLimit.trim();
      }
      const summary = await publicationsAPI.importThaiJOBatch(payload);
      setLastBatchSummary(summary);
      setMsg("เริ่มรัน ThaiJO Batch Import แล้ว ติดตามผลได้จากประวัติการรัน");
      setMsgTone("success");
      fetchBatchRuns(1);
      fetchJobs(1);
    } catch (error) {
      setMsg(error?.message || "ThaiJO Batch Import ไม่สำเร็จ");
      setMsgTone("error");
    } finally {
      setBatchRunning(false);
    }
  }

  function goToJobsPage(page) {
    if (page < 1) return;
    setJobsPage(page);
    fetchJobs(page);
  }

  function goToRequestsPage(page) {
    if (!selectedJobId || page < 1) return;
    setRequestsPage(page);
    fetchRequests(selectedJobId, page);
  }

  function goToBatchRunsPage(page) {
    if (page < 1) return;
    setBatchRunsPage(page);
    fetchBatchRuns(page);
  }

  return (
    <PageLayout
      title="นำเข้าผลงานวิชาการ (ThaiJO)"
      subtitle="จัดการ ThaiJO Author ID, สถานะ Sync และนำเข้าข้อมูลงานวิจัยตาม flow ThaiJO"
      breadcrumbs={[
        { label: "หน้าแรก", href: "/research-fund-system/admin" },
        { label: "นำเข้าผลงานวิชาการ (ThaiJO)" },
      ]}
    >
      <div className="space-y-6">
        {msg ? (
          <div className={`rounded-lg border px-4 py-3 text-sm ${MESSAGE_TONE_STYLES[msgTone] || MESSAGE_TONE_STYLES.info}`}>
            <span className="mr-2 font-semibold">{MESSAGE_TONE_ICONS[msgTone] || MESSAGE_TONE_ICONS.info}</span>
            {msg}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">ThaiJO Manual Import</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">นำเข้าแบบรายบุคคล</div>
          <p className="mt-2 text-sm text-slate-600">
            ค้นหาผู้ใช้, ตั้งค่า ThaiJO Author ID และสถานะ Sync จากนั้นสั่ง Import รายบุคคลได้ทันที
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="ค้นหาผู้ใช้ (ชื่อหรืออีเมล)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            />
            <button
              type="button"
              onClick={searchUsers}
              disabled={disableSearchButton}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searching ? "กำลังค้นหา..." : "ค้นหา"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              value={userId}
              onChange={(e) => onSelectUser(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            >
              <option value="">เลือกผู้ใช้</option>
              {userHits.map((hit) => (
                <option key={hit.user_id} value={hit.user_id}>
                  {hit.user_id} - {hit.name || "(ไม่มีชื่อ)"} ({hit.email || "-"})
                </option>
              ))}
            </select>
            <input
              value={thaiJOAuthorId}
              onChange={(e) => setThaiJOAuthorId(e.target.value)}
              placeholder="ThaiJO Author ID (เช่น social13-971)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              เปิดใช้งาน ThaiJO Sync สำหรับผู้ใช้นี้
            </label>
            <button
              type="button"
              onClick={saveThaiJOSyncEnabled}
              disabled={disableManualActions || !userId}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {manualAction === "save-sync" && manualBusy ? "กำลังบันทึก..." : "บันทึกสถานะ Sync"}
            </button>
          </div>

          {selectedUser ? (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              ผู้ใช้ที่เลือก: <span className="font-semibold text-slate-800">{selectedUser.name || "-"}</span> ({selectedUser.email || "-"})
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveThaiJOAuthorId}
              disabled={disableManualActions || !userId}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {manualAction === "save-id" && manualBusy ? "กำลังบันทึก..." : "บันทึก ThaiJO Author ID"}
            </button>
            <button
              type="button"
              onClick={importManual}
              disabled={disableManualActions || !userId}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {manualAction === "import" && manualBusy ? "กำลังนำเข้า..." : "Import รายบุคคล"}
            </button>
          </div>

          <SummaryGrid summary={lastManualSummary} items={manualSummaryItems} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">ThaiJO Batch Import</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">นำเข้าแบบกลุ่ม</div>
          <p className="mt-2 text-sm text-slate-600">
            รองรับการรันเฉพาะ user_ids ที่กำหนด หรือปล่อยว่างเพื่อใช้ผู้ใช้ที่เปิด Sync เท่านั้น
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              value={batchUserIds}
              onChange={(e) => setBatchUserIds(e.target.value)}
              placeholder="ระบุ user_ids คั่นด้วย , (ไม่บังคับ)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            />
            <input
              value={batchLimit}
              onChange={(e) => setBatchLimit(e.target.value)}
              placeholder="จำกัดจำนวนผู้ใช้ (ไม่บังคับ)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            />
          </div>

          {hasBatchRunRunning ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              มี Batch Import ที่กำลังรันอยู่ ปุ่มเริ่มใหม่จะถูกปิดไว้เพื่อป้องกันการรันซ้ำ
            </div>
          ) : null}

          <div className="mt-5">
            <button
              type="button"
              onClick={importBatch}
              disabled={disableBatchButton}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {batchRunning ? "กำลังรัน..." : "เริ่ม Batch Import"}
            </button>
          </div>

          <SummaryGrid summary={lastBatchSummary} items={batchSummaryItems} />

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">เริ่มรัน</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">สถานะ</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Users</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Fetched</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Rejected</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {batchRunsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">กำลังโหลด...</td>
                  </tr>
                ) : batchRuns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">ยังไม่มีประวัติ Batch Run</td>
                  </tr>
                ) : (
                  batchRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="px-3 py-2 text-slate-700">{formatDateTime(run.started_at)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadge(run.status)}`}>
                          {run.status || "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700">{Number(run.users_processed ?? 0).toLocaleString("th-TH")}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{Number(run.documents_fetched ?? 0).toLocaleString("th-TH")}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{Number(run.rejected_hits ?? 0).toLocaleString("th-TH")}</td>
                      <td className="px-3 py-2 text-slate-600">{run.error_message || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {batchRunsError ? <div className="mt-2 text-sm text-rose-600">{batchRunsError}</div> : null}
            <div className="mt-3 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => goToBatchRunsPage(batchRunsPage - 1)}
                disabled={!batchRunsPagination.has_prev}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <span className="text-slate-600">หน้า {batchRunsPagination.current_page || 1}</span>
              <button
                type="button"
                onClick={() => goToBatchRunsPage(batchRunsPage + 1)}
                disabled={!batchRunsPagination.has_next}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">ThaiJO API Jobs</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">ประวัติงานนำเข้า</div>
            <div className="mt-4 space-y-2">
              {jobsLoading ? (
                <div className="text-sm text-slate-500">กำลังโหลด...</div>
              ) : jobs.length === 0 ? (
                <div className="text-sm text-slate-500">ยังไม่มีประวัติงาน</div>
              ) : (
                jobs.map((job) => (
                  <button
                    type="button"
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      String(selectedJobId) === String(job.id)
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-800">Job #{job.id}</div>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadge(job.status)}`}>
                        {job.status || "-"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">เริ่ม: {formatDateTime(job.started_at)}</div>
                    <div className="mt-1 text-xs text-slate-600 line-clamp-1">{job.search_name || job.query_string || "-"}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      author_selection_reason: <span className="font-medium text-slate-700">{job.author_selection_reason || "-"}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            {jobsError ? <div className="mt-2 text-sm text-rose-600">{jobsError}</div> : null}
            <div className="mt-3 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => goToJobsPage(jobsPage - 1)}
                disabled={!jobsPagination.has_prev}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <span className="text-slate-600">หน้า {jobsPagination.current_page || 1}</span>
              <button
                type="button"
                onClick={() => goToJobsPage(jobsPage + 1)}
                disabled={!jobsPagination.has_next}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">ThaiJO API Requests</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              รายการเรียก API {selectedJob ? `(Job #${selectedJob.id})` : ""}
            </div>
            {selectedJob ? (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                author_selection_reason: <span className="font-semibold text-slate-800">{selectedJob.author_selection_reason || "-"}</span>
              </div>
            ) : null}
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">เวลา</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">Endpoint</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">Status</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">Time (ms)</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">กำลังโหลด...</td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">ยังไม่มี request log</td>
                    </tr>
                  ) : (
                    requests.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2 text-slate-700">{formatDateTime(row.created_at)}</td>
                        <td className="px-3 py-2 text-slate-700">{row.endpoint || "-"}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.response_status ?? "-"}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.response_time_ms ?? "-"}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{row.items_returned ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => goToRequestsPage(requestsPage - 1)}
                disabled={!requestsPagination.has_prev}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>
              <span className="text-slate-600">หน้า {requestsPagination.current_page || 1}</span>
              <button
                type="button"
                onClick={() => goToRequestsPage(requestsPage + 1)}
                disabled={!requestsPagination.has_next}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
