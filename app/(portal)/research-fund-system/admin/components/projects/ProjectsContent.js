"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Layers,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  RefreshCcw,
  CalendarDays,
  Paperclip,
  Save,
  Loader2,
  UserPlus,
  UserCog,
  Search,
  X,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";
import PageLayout from "@/app/(portal)/research-fund-system/admin/components/common/PageLayout";
import adminAPI from "@/app/lib/admin_api";
import apiClient from "@/app/lib/api";
import { getSignedFileUrl } from "@/app/lib/file_access";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2800,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

const confirmDestructiveAction = async ({ title, text, confirmText }) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    iconColor: "#d97706",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: "rounded-xl",
      title: "text-xl font-semibold text-slate-900",
      htmlContainer: "text-sm text-slate-600",
      actions: "gap-2",
      confirmButton:
        "inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-5 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
      cancelButton:
        "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
    },
  });

  return result.isConfirmed;
};

const normalizeText = (value) =>
  (value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const initialProjectForm = {
  project_name: "",
  type_id: "",
  event_date: "",
  plan_id: "",
  budget_amount: "",
  participants: "",
  beneficiaries_count: "",
  notes: "",
  attachment: null,
};

const initialMemberForm = {
  user_id: "",
  duty: "",
  workload_hours: "",
  notes: "",
};

const MAX_BUDGET_AMOUNT = 9999999999.99;
const budgetAmountPattern = /^(?:\d{1,10})(?:\.\d{1,2})?$/;
const workloadInputPattern = /^\d*(?:\.\d{0,2})?$/;

const normalizeBudgetInputValue = (rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return "";
  }

  const stringValue = rawValue.toString();
  if (stringValue === "") {
    return "";
  }

  const cleaned = stringValue.replace(/[^0-9.]/g, "");
  if (cleaned === "") {
    return "";
  }

  const firstDotIndex = cleaned.indexOf(".");
  const hasDot = firstDotIndex !== -1;
  const hasTrailingDot =
    hasDot && (stringValue.endsWith(".") || cleaned.endsWith("."));

  let integerPart = hasDot ? cleaned.slice(0, firstDotIndex) : cleaned;
  let decimalRaw = hasDot
    ? cleaned.slice(firstDotIndex + 1).replace(/\./g, "")
    : "";

  if (integerPart === "" && hasDot) {
    integerPart = "0";
  }

  if (integerPart !== "") {
    const stripped = integerPart.replace(/^0+(?=\d)/, "");
    integerPart = stripped.length > 0 ? stripped : "0";
  }

  integerPart = integerPart.slice(0, 10);
  decimalRaw = decimalRaw.slice(0, 2);

  if (integerPart === "" && decimalRaw.length === 0 && !hasTrailingDot) {
    return "";
  }

  const integerOutput = integerPart === "" ? "0" : integerPart;

  if (decimalRaw.length > 0) {
    return `${integerOutput}.${decimalRaw}`;
  }

  if (hasTrailingDot) {
    return `${integerOutput}.`;
  }

  return integerPart;
};

const formatWorkloadHours = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0 ชม.";
  }

  const fractionDigits = Number.isInteger(numeric) ? 0 : 2;
  return `${numeric.toLocaleString("th-TH", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  })} ชม.`;
};

const buildUserDisplayName = (user) => {
  if (!user || typeof user !== "object") {
    return "-";
  }

  const prefix = (user.prefix ?? user.Prefix ?? "").toString().trim();
  const firstName = (user.user_fname ?? user.UserFname ?? "").toString().trim();
  const lastName = (user.user_lname ?? user.UserLname ?? "").toString().trim();
  const baseName = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (prefix && baseName) {
    return `${prefix}${baseName}`;
  }

  if (prefix) {
    return prefix;
  }

  if (baseName) {
    return baseName;
  }

  const email = (user.email ?? user.Email ?? "").toString().trim();
  return email || "-";
};

const getUserPositionLabel = (user) => {
  if (!user || typeof user !== "object") {
    return "";
  }

  return (
    (user.manage_position ?? user.ManagePosition ?? "").toString().trim() ||
    (user.position_title ?? user.PositionTitle ?? "").toString().trim() ||
    (user.position?.position_name ??
      user.Position?.position_name ??
      user.Position?.PositionName ??
      "").toString().trim()
  );
};

const normalizeWorkloadInputValue = (rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return "";
  }

  const stringValue = rawValue.toString();
  if (stringValue === "") {
    return "";
  }

  const cleaned = stringValue.replace(/[^0-9.]/g, "");
  if (cleaned === "") {
    return "";
  }

  const firstDotIndex = cleaned.indexOf(".");
  if (firstDotIndex === -1) {
    return cleaned;
  }

  const integerPart = cleaned.slice(0, firstDotIndex) || "0";
  const decimalRaw = cleaned.slice(firstDotIndex + 1).replace(/\./g, "");
  const decimalPart = decimalRaw.slice(0, 2);
  const hasTrailingDot = stringValue.endsWith(".");

  if (decimalPart.length === 0 && hasTrailingDot) {
    return `${integerPart}.`;
  }

  if (decimalPart.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalPart}`;
};

const normalizeProjectMemberCandidate = (user) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const rawId = user.user_id ?? user.UserID;
  const parsedId = Number(rawId);
  if (!Number.isFinite(parsedId) || parsedId <= 0) {
    return null;
  }

  const prefix = (user.prefix ?? user.Prefix ?? "").toString().trim();
  const firstName = (user.user_fname ?? user.UserFname ?? "").toString().trim();
  const lastName = (user.user_lname ?? user.UserLname ?? "").toString().trim();
  const baseName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const displayName = prefix && baseName ? `${prefix}${baseName}` : prefix || baseName || `${parsedId}`;

  const managePosition = (user.manage_position ?? user.ManagePosition ?? "").toString().trim();
  const positionTitle =
    (user.position_title ?? user.PositionTitle ?? "").toString().trim() ||
    (user.position_en ?? user.PositionEn ?? "").toString().trim() ||
    (user.position?.position_name ??
      user.Position?.position_name ??
      user.Position?.PositionName ??
      "").toString().trim();

  return {
    user_id: parsedId,
    prefix,
    user_fname: firstName,
    user_lname: lastName,
    email: (user.email ?? user.Email ?? "").toString(),
    role_id: Number(user.role_id ?? user.RoleID ?? 0) || 0,
    manage_position: managePosition,
    position_title: positionTitle,
    role: user.role ?? user.Role ?? null,
    position: user.position ?? user.Position ?? null,
    display_name: displayName,
  };
};

const getMemberUser = (member) => member?.user ?? member?.User ?? null;

const getMemberUserId = (member) => {
  const directId = Number(member?.user_id ?? member?.UserID);
  if (Number.isFinite(directId) && directId > 0) {
    return directId;
  }

  const nested = getMemberUser(member);
  const nestedId = Number(nested?.user_id ?? nested?.UserID);
  return Number.isFinite(nestedId) && nestedId > 0 ? nestedId : null;
};

function formatCurrency(value) {
  const number = Number(value || 0);
  return `${new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number)}฿`;
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    return dateString;
  }
}

function scrollToProjectEditor() {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    const editor = document.getElementById("project-editor");
    if (!editor) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    editor.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
}

function ProjectsTable({
  projects,
  onEdit,
  onDelete,
  emptyMessage = "ยังไม่มีข้อมูลโครงการ",
}) {
  if (!projects.length) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
          <Briefcase size={22} aria-hidden="true" />
        </div>
        <p className="text-base font-semibold text-slate-900">{emptyMessage}</p>
        <p className="mt-1 max-w-md text-sm text-slate-500">
          ลองเปลี่ยนคำค้นหาหรือตัวกรอง หรือเพิ่มโครงการใหม่เพื่อเริ่มบันทึกข้อมูล
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">ชื่อโครงการ / แผนงบประมาณ</th>
              <th className="px-4 py-3 text-left">ประเภท / วันที่จัด</th>
              <th className="px-4 py-3 text-center">งบประมาณ</th>
              <th className="px-4 py-3 text-center">จำนวนผู้เข้าร่วม</th>
              <th className="px-4 py-3 text-center">ผู้ได้รับประโยชน์</th>
              <th className="w-64 px-4 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {projects.map((project) => (
              <tr key={project.project_id} className="transition-colors hover:bg-blue-50/60">
                <td className="px-4 py-4 align-top">
                  <div className="max-w-sm font-semibold text-slate-900" title={project.project_name}>
                    {project.project_name}
                  </div>
                  <div className="mt-1.5 flex max-w-sm min-w-0 items-center gap-1.5 text-xs text-slate-500">
                    <Wallet size={14} className="shrink-0 text-slate-400" aria-hidden="true" />
                    <span className="truncate">
                      {project.budget_plan?.name_th || project.budget_plan?.name_en || "ไม่ระบุแผนงบประมาณ"}
                    </span>
                  </div>
                  {project.notes ? (
                    <p className="mt-1 max-w-sm truncate text-xs text-slate-500" title={project.notes}>
                      {project.notes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex max-w-xs min-w-0 items-center gap-1.5 text-slate-700">
                    <Layers size={15} className="shrink-0 text-blue-600" aria-hidden="true" />
                    <span className="truncate">
                      {project.type?.name_th || project.type?.name_en || "ไม่ระบุประเภท"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays size={14} className="text-amber-600" aria-hidden="true" />
                    {formatDate(project.event_date)}
                  </div>
                </td>
                <td className="px-4 py-4 text-right align-top font-semibold tabular-nums text-slate-900">
                  {formatCurrency(project.budget_amount)}
                </td>
                <td className="px-4 py-4 text-right align-top tabular-nums">
                  {typeof project.participants === "number"
                    ? project.participants.toLocaleString("th-TH")
                    : project.participants || "-"}
                </td>
                <td className="px-4 py-4 text-right align-top tabular-nums">
                  {typeof project.beneficiaries_count === "number"
                    ? project.beneficiaries_count.toLocaleString("th-TH")
                    : project.beneficiaries_count || "-"}
                </td>
                <td className="w-64 px-4 py-3 align-top">
                  <div className="flex flex-nowrap items-center justify-center gap-1">
                    {project.attachments?.length ? (
                      <button
                        type="button"
                        onClick={() => openSignedAttachment(project.attachments[0])}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                        ดูไฟล์
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onEdit(project)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Pencil size={16} aria-hidden="true" />
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(project)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 xl:hidden">
        {projects.map((project) => (
          <article key={project.project_id} className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                <Briefcase size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-slate-900">{project.project_name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {project.type?.name_th || project.type?.name_en || "ไม่ระบุประเภท"}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500">วันที่จัด</dt>
                <dd className="mt-0.5 text-slate-800">{formatDate(project.event_date)}</dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-slate-500">งบประมาณ</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-slate-900">
                  {formatCurrency(project.budget_amount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">ผู้เข้าร่วม</dt>
                <dd className="mt-0.5 tabular-nums text-slate-800">
                  {project.participants?.toLocaleString?.("th-TH") || project.participants || "-"}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-slate-500">ผู้ได้รับประโยชน์</dt>
                <dd className="mt-0.5 tabular-nums text-slate-800">
                  {project.beneficiaries_count?.toLocaleString?.("th-TH") || project.beneficiaries_count || "-"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap justify-end gap-1 border-t border-slate-100 pt-3">
              {project.attachments?.length ? (
                <button
                  type="button"
                  onClick={() => openSignedAttachment(project.attachments[0])}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <ExternalLink size={16} aria-hidden="true" /> ดูไฟล์
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-blue-600 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Pencil size={16} aria-hidden="true" /> แก้ไข
              </button>
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Trash2 size={16} aria-hidden="true" /> ลบ
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ProjectFormMembersSection({
  memberOptions = [],
  allCandidates = [],
  form = initialMemberForm,
  members = [],
  onFormChange = () => {},
  onSubmit = () => {},
  onEdit = () => {},
  onRemove = () => {},
  onCancelEdit = () => {},
  editingIndex = null,
  disabled = false,
  loading = false,
  deleteLoadingIds = new Set(),
  saving = false,
}) {
  const totalWorkload = members.reduce((sum, member) => {
    const value = Number(member?.workload_hours ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const selectedCandidateId = Number(form?.user_id ?? 0);
  const selectedCandidate = Number.isFinite(selectedCandidateId)
    ? allCandidates.find((candidate) => candidate.user_id === selectedCandidateId)
    : null;

  const isEditing = typeof editingIndex === "number" && editingIndex >= 0;
  const disableAddButton =
    disabled || loading || saving || (!isEditing && memberOptions.length === 0);
  const highlightClass = isEditing
    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
    : "";
  const panelHighlightClass = isEditing
    ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200"
    : "border-slate-200 bg-white";
  const deleteSet =
    deleteLoadingIds instanceof Set
      ? deleteLoadingIds
      : new Set(Array.isArray(deleteLoadingIds) ? deleteLoadingIds : []);
  const actionsDisabled = disabled || loading || saving;

  const handleChange = (field) => (event) => {
    onFormChange(field, event.target.value);
  };

  const resolveMemberCandidate = (member) => {
    if (!member) return null;
    if (member.candidate) return member.candidate;

    const memberId = Number(member.user_id);
    if (!Number.isFinite(memberId)) return null;
    return allCandidates.find((candidate) => candidate.user_id === memberId) || null;
  };

  return (
    <div className="md:col-span-2">
      <div
        className={`rounded-xl border ${panelHighlightClass}`}
      >
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                <UserCog size={17} aria-hidden="true" />
              </span>
              <span>ผู้ร่วมโครงการ</span>
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              เพิ่มรายชื่อบุคลากรเพื่อบันทึกพร้อมโครงการ ระบบจะจัดเรียงตามลำดับการเพิ่ม
            </p>
          </div>
          <div className="w-fit rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium tabular-nums text-slate-600">
            รวมภาระงาน {formatWorkloadHours(totalWorkload)}
          </div>
        </div>

        <div className="space-y-4 px-4 py-5 [&_input]:min-h-11 [&_input]:rounded-lg [&_input]:border-slate-300 [&_input]:text-slate-900 [&_input]:focus:border-blue-500 [&_input]:focus:ring-blue-500 [&_label]:mb-2 [&_label]:text-sm [&_label]:font-medium [&_label]:text-slate-700 [&_select]:min-h-11 [&_select]:rounded-lg [&_select]:border-slate-300 [&_select]:text-slate-900 [&_select]:focus:border-blue-500 [&_select]:focus:ring-blue-500">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ผู้ร่วมโครงการ
              </label>
              <select
                name="user_id"
                value={form?.user_id ?? ""}
                onChange={handleChange("user_id")}
                disabled={disableAddButton}
                className={`w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400 ${highlightClass}`}
              >
                <option value="">เลือกบุคลากร</option>
                {memberOptions.map((candidate) => (
                  <option key={candidate.user_id} value={candidate.user_id}>
                    {candidate.display_name}
                    {candidate.position_title ? ` — ${candidate.position_title}` : ""}
                  </option>
                ))}
              </select>
              {!disabled && !loading && !saving && !isEditing && memberOptions.length === 0 ? (
                <p className="mt-1 text-xs text-amber-600">
                  {allCandidates.length === 0
                    ? "ยังไม่มีรายชื่อบุคลากรที่สามารถเลือกได้"
                    : "บุคลากรถูกเลือกครบแล้ว หากต้องการแก้ไขกรุณาลบหรือแก้ไขรายการเดิม"}
                </p>
              ) : null}
              {selectedCandidate?.position_title ? (
                <p className="mt-1 text-xs text-gray-500">
                  ตำแหน่ง: {selectedCandidate.position_title}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หน้าที่ภายในโครงการ
              </label>
              <input
                type="text"
                name="duty"
                value={form?.duty ?? ""}
                onChange={handleChange("duty")}
                maxLength={255}
                placeholder="เช่น ผู้รับผิดชอบหลัก"
                disabled={disabled}
                className={`w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400 ${highlightClass}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ภาระงาน (ชม.)
              </label>
              <input
                type="number"
                name="workload_hours"
                value={form?.workload_hours ?? ""}
                onChange={handleChange("workload_hours")}
                min="0"
                step="0.01"
                placeholder="เช่น 6"
                disabled={disabled}
                className={`w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400 ${highlightClass}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ (ถ้ามี)
              </label>
              <input
                type="text"
                name="notes"
                value={form?.notes ?? ""}
                onChange={handleChange("notes")}
                maxLength={255}
                placeholder="รายละเอียดเพิ่มเติม"
                disabled={disabled}
                className={`w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 disabled:bg-gray-100 disabled:text-gray-400 ${highlightClass}`}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {isEditing
                ? "กำลังแก้ไขข้อมูลผู้ร่วมโครงการในฟอร์ม"
                : "สามารถเพิ่มได้หลายคนก่อนบันทึกโครงการ"}
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="min-h-11 rounded-lg border border-slate-300 px-4 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionsDisabled}
                  >
                    ยกเลิกแก้ไข
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={actionsDisabled}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        บันทึกการแก้ไข
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={disableAddButton}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      เพิ่มผู้ร่วมโครงการ
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                กำลังโหลดผู้ร่วมโครงการ...
              </div>
            ) : members.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                ยังไม่มีผู้ร่วมโครงการในแบบฟอร์ม
              </div>
            ) : (
              <>
              <table className="hidden min-w-full divide-y divide-slate-200 text-sm md:table">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left">ลำดับ</th>
                    <th className="px-4 py-3 text-left">ชื่อบุคลากร</th>
                    <th className="px-4 py-3 text-left">หน้าที่</th>
                    <th className="px-4 py-3 text-left">ภาระงาน</th>
                    <th className="px-4 py-3 text-left">หมายเหตุ</th>
                    <th className="px-4 py-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.map((member, index) => {
                    const snapshot = resolveMemberCandidate(member);
                    const name = snapshot?.display_name ?? `ผู้ใช้ #${member.user_id}`;
                    const position = snapshot?.position_title ?? "";
                    const workloadLabel = formatWorkloadHours(
                      member.workload_hours ?? 0
                    );
                    const notesValue = member.notes?.trim?.() ?? member.notes ?? "";
                    const isActive = isEditing && editingIndex === index;
                    const orderLabel =
                      member.display_order ?? member.DisplayOrder ?? index + 1;
                    const memberIdRaw =
                      member.member_id ?? member.MemberID ?? member.memberId;
                    const memberId = Number(memberIdRaw);
                    const isDeleting =
                      Number.isFinite(memberId) && deleteSet.has(memberId);

                    const rowKey =
                      Number.isFinite(memberId) && memberId > 0
                        ? `member-${memberId}`
                        : `${member.user_id}-${index}`;

                    return (
                      <tr
                        key={rowKey}
                        className={isActive ? "bg-blue-50" : "bg-white hover:bg-slate-50"}
                      >
                        <td className="px-4 py-3 text-slate-600">{orderLabel}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{name}</div>
                          {position ? (
                            <div className="mt-1 text-xs text-slate-500">{position}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{member.duty || "-"}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">{workloadLabel}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {notesValue ? notesValue : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => onEdit(index, member)}
                              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={actionsDisabled}
                            >
                              <Pencil size={16} /> แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemove(index, member)}
                              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={actionsDisabled || isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  กำลังลบ...
                                </>
                              ) : (
                                <>
                                  <Trash2 size={16} /> ลบ
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="divide-y divide-slate-200 md:hidden">
                {members.map((member, index) => {
                  const snapshot = resolveMemberCandidate(member);
                  const name = snapshot?.display_name ?? `ผู้ใช้ #${member.user_id}`;
                  const position = snapshot?.position_title ?? "";
                  const notesValue = member.notes?.trim?.() ?? member.notes ?? "";
                  const memberId = Number(member.member_id ?? member.MemberID ?? member.memberId);
                  const isDeleting = Number.isFinite(memberId) && deleteSet.has(memberId);
                  const rowKey = Number.isFinite(memberId) && memberId > 0
                    ? `member-card-${memberId}`
                    : `member-card-${member.user_id}-${index}`;

                  return (
                    <article key={rowKey} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{name}</p>
                          {position ? <p className="mt-0.5 text-xs text-slate-500">{position}</p> : null}
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-slate-500">
                          {formatWorkloadHours(member.workload_hours ?? 0)}
                        </span>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex gap-2">
                          <dt className="w-20 shrink-0 text-slate-500">หน้าที่</dt>
                          <dd className="text-slate-800">{member.duty || "-"}</dd>
                        </div>
                        {notesValue ? (
                          <div className="flex gap-2">
                            <dt className="w-20 shrink-0 text-slate-500">หมายเหตุ</dt>
                            <dd className="text-slate-800">{notesValue}</dd>
                          </div>
                        ) : null}
                      </dl>
                      <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
                        <button
                          type="button"
                          onClick={() => onEdit(index, member)}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                          disabled={actionsDisabled}
                        >
                          <Pencil size={16} /> แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemove(index, member)}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-red-600 hover:bg-red-50 disabled:opacity-60"
                          disabled={actionsDisabled || isDeleting}
                        >
                          {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          {isDeleting ? "กำลังลบ..." : "ลบ"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildAttachmentUrl(attachment) {
  if (!attachment) {
    return "#";
  }

  const storedPath =
    attachment.stored_path ||
    attachment.storedPath ||
    attachment.StoredPath ||
    "";
  if (!storedPath) {
    return "#";
  }

  const normalizedPath = storedPath.startsWith("/uploads/")
    ? storedPath
    : `/uploads/${storedPath.replace(/^\/+/, "")}`;

  const base = (apiClient?.baseURL || "").replace(/\/?api\/v1$/, "");
  const fallbackBase =
    base || (typeof window !== "undefined" ? window.location.origin : "");

  try {
    return fallbackBase
      ? new URL(normalizedPath, fallbackBase).href
      : normalizedPath;
  } catch (error) {
    if (fallbackBase) {
      return `${fallbackBase.replace(/\/$/, "")}${normalizedPath}`;
    }
    return normalizedPath;
  }
}

// Open an attachment via a short-lived signed URL (the old /uploads path now
// requires a signature). A blank tab is opened synchronously so the popup is not
// blocked, then navigated once the signed URL resolves.
async function openSignedAttachment(attachment) {
  const rawUrl = buildAttachmentUrl(attachment);
  if (!rawUrl || rawUrl === "#") return;
  const win = typeof window !== "undefined" ? window.open("", "_blank") : null;
  if (win) win.opener = null;
  const signed = await getSignedFileUrl(rawUrl);
  if (signed) {
    if (win) {
      win.location.href = signed;
    } else if (typeof window !== "undefined") {
      window.open(signed, "_blank", "noopener,noreferrer");
    }
  } else if (win) {
    win.close();
  }
}

function ProjectForm({
  open,
  formData,
  types,
  plans,
  onClose,
  onChange,
  onFileChange,
  onClearAttachment,
  onSubmit,
  saving,
  isEditing,
  fileInputKey,
  attachmentFile,
  existingAttachment,
  memberCandidates = [],
  availableMemberCandidates = [],
  draftMembers = [],
  draftMemberForm = initialMemberForm,
  onDraftMemberChange = () => {},
  onDraftMemberSubmit = () => {},
  onDraftMemberEdit = () => {},
  onDraftMemberRemove = () => {},
  draftMemberEditingIndex = null,
  onDraftMemberCancel = () => {},
  editMembersPanel = null,
}) {
  if (!open) return null;

  const disableTypeSelect = types.length === 0;
  const disablePlanSelect = plans.length === 0;
  const selectedTypeInactive =
    isEditing &&
    formData.type_id &&
    types.some(
      (type) =>
        type.type_id === Number(formData.type_id) && type.is_active === false
    );
  const selectedPlanInactive =
    isEditing &&
    formData.plan_id &&
    plans.some(
      (plan) =>
        plan.plan_id === Number(formData.plan_id) && plan.is_active === false
    );

  return (
    <section id="project-editor" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
            <Pencil size={18} aria-hidden="true" />
          </div>
          <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditing ? "แก้ไขโครงการ" : "เพิ่มโครงการใหม่"}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            กรอกข้อมูลให้ครบถ้วนตามฟิลด์ที่กำหนดไว้
          </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="ปิดแบบฟอร์มโครงการ"
        >
          <X size={16} aria-hidden="true" />
          ปิดแบบฟอร์ม
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-5 p-4 sm:p-6 md:grid-cols-2 [&_input:not([type='file'])]:min-h-11 [&_input:not([type='file'])]:rounded-lg [&_input:not([type='file'])]:border-slate-300 [&_input:not([type='file'])]:text-slate-900 [&_input:not([type='file'])]:focus:border-blue-500 [&_input:not([type='file'])]:focus:ring-blue-500 [&_label]:mb-2 [&_label]:text-sm [&_label]:font-medium [&_label]:text-slate-700 [&_select]:min-h-11 [&_select]:rounded-lg [&_select]:border-slate-300 [&_select]:text-slate-900 [&_select]:focus:border-blue-500 [&_select]:focus:ring-blue-500 [&_textarea]:rounded-lg [&_textarea]:border-slate-300 [&_textarea]:text-slate-900 [&_textarea]:focus:border-blue-500 [&_textarea]:focus:ring-blue-500"
      >
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ชื่อโครงการ
          </label>
          <input
            type="text"
            name="project_name"
            value={formData.project_name}
            onChange={onChange}
            required
            className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            placeholder="ระบุชื่อโครงการ"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ประเภทโครงการ
          </label>
          <select
            name="type_id"
            value={formData.type_id}
            onChange={onChange}
            required
            disabled={disableTypeSelect}
            className={`w-full rounded-md border focus:border-blue-500 focus:ring-blue-500 px-3 py-2 ${
              disableTypeSelect
                ? "bg-gray-100 cursor-not-allowed border-gray-200"
                : "border-gray-300"
            }`}
          >
            <option value="">-- เลือกประเภท --</option>
            {types.map((type) => (
              <option key={type.type_id} value={type.type_id}>
                {type.name_th || type.name_en}
                {type.is_active ? "" : " (ปิดใช้งาน)"}
              </option>
            ))}
          </select>
          {disableTypeSelect ? (
            <p className="mt-2 text-xs text-red-700">
              ไม่มีประเภทโครงการที่เปิดใช้งาน กรุณาเปิดใช้งานก่อนบันทึกโครงการ
            </p>
          ) : null}
          {selectedTypeInactive ? (
            <p className="mt-2 text-xs text-amber-700">
              ประเภทที่เลือกถูกปิดใช้งานอยู่ หากต้องการเปลี่ยนกรุณาเลือกประเภทที่เปิดใช้งาน
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            วันที่จัดกิจกรรม
          </label>
          <input
            type="date"
            name="event_date"
            value={formData.event_date}
            onChange={onChange}
            required
            className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            แผนงบประมาณ
          </label>
          <select
            name="plan_id"
            value={formData.plan_id}
            onChange={onChange}
            required
            disabled={disablePlanSelect}
            className={`w-full rounded-md border focus:border-blue-500 focus:ring-blue-500 px-3 py-2 ${
              disablePlanSelect
                ? "bg-gray-100 cursor-not-allowed border-gray-200"
                : "border-gray-300"
            }`}
          >
            <option value="">-- เลือกแผนงบประมาณ --</option>
            {plans.map((plan) => (
              <option key={plan.plan_id} value={plan.plan_id}>
                {plan.name_th || plan.name_en}
                {plan.is_active ? "" : " (ปิดใช้งาน)"}
              </option>
            ))}
          </select>
          {disablePlanSelect ? (
            <p className="mt-2 text-xs text-red-700">
              ไม่มีแผนงบประมาณที่เปิดใช้งาน กรุณาเปิดใช้งานก่อนบันทึกโครงการ
            </p>
          ) : null}
          {selectedPlanInactive ? (
            <p className="mt-2 text-xs text-amber-700">
              แผนงบประมาณที่เลือกถูกปิดใช้งานอยู่ หากต้องการเปลี่ยนกรุณาเลือกแผนที่เปิดใช้งาน
            </p>
          ) : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            งบประมาณ (บาท)
          </label>
          <input
            type="number"
            name="budget_amount"
            value={formData.budget_amount}
            onChange={onChange}
            min="0"
            step="0.01"
            max={MAX_BUDGET_AMOUNT}
            required
            className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            placeholder="เช่น 50000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนผู้เข้าร่วม (คน)
          </label>
          <input
            type="number"
            name="participants"
            value={formData.participants}
            onChange={onChange}
            min="0"
            className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            placeholder="เช่น 120"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หน่วยงาน/ชุมชนที่ได้รับประโยชน์ (แห่ง)
          </label>
          <input
            type="number"
            name="beneficiaries_count"
            value={formData.beneficiaries_count}
            onChange={onChange}
            min="0"
            className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            placeholder="เช่น 10"
          />
        </div>

        {isEditing ? (
          editMembersPanel ? (
            <div className="md:col-span-2">{editMembersPanel}</div>
          ) : null
        ) : (
          <ProjectFormMembersSection
            memberOptions={availableMemberCandidates}
            allCandidates={memberCandidates}
            form={draftMemberForm}
            members={draftMembers}
            onFormChange={onDraftMemberChange}
            onSubmit={onDraftMemberSubmit}
            onEdit={onDraftMemberEdit}
            onRemove={onDraftMemberRemove}
            onCancelEdit={onDraftMemberCancel}
            editingIndex={draftMemberEditingIndex}
            disabled={saving}
          />
        )}

        <div className="md:col-span-2">
          <label htmlFor="project-attachment" className="block text-sm font-medium text-gray-700 mb-1">
            ไฟล์แนบโครงการ (สูงสุด 1 ไฟล์)
          </label>
          <div className="relative flex min-h-14 flex-col gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30 sm:flex-row sm:items-center">
            <input
              key={fileInputKey}
              id="project-attachment"
              type="file"
              name="attachment"
              onChange={onFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              disabled={saving}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
              aria-hidden="true"
              className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-medium text-blue-700 ${
                saving ? "opacity-60" : ""
              }`}
            >
              เลือกไฟล์
            </span>
            <span className="min-w-0 truncate px-1 text-sm text-slate-600">
              {attachmentFile?.name || "ยังไม่ได้เลือกไฟล์"}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            รองรับ PDF, Word, Excel และรูปภาพ ขนาดตามที่ระบบกำหนด
          </p>
          {attachmentFile ? (
            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-sm text-blue-800 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip size={16} />
                <span className="truncate">{attachmentFile.name}</span>
              </span>
              <button
                type="button"
                onClick={onClearAttachment}
                disabled={saving}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ล้างไฟล์
              </button>
            </div>
          ) : existingAttachment ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <Paperclip size={16} className="text-slate-400" />
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openSignedAttachment(existingAttachment);
                  }}
                  className="truncate text-blue-600 hover:underline cursor-pointer"
                  title={existingAttachment.original_name || existingAttachment.stored_path}
                >
                  ไฟล์ที่บันทึกล่าสุด: {existingAttachment.original_name || existingAttachment.stored_path}
                </a>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                การเลือกไฟล์ใหม่จะทับไฟล์เดิมโดยอัตโนมัติ
              </p>
            </div>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมายเหตุ / รายละเอียดเพิ่มเติม
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={onChange}
            rows={3}
            className="w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            placeholder="ข้อมูลเพิ่มเติมที่ต้องการบันทึก"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end md:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCcw size={16} className="animate-spin" />
                บันทึกข้อมูล...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={16} />
                {isEditing ? "อัปเดตข้อมูล" : "บันทึกโครงการ"}
              </span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function ProjectsContent() {
  const [loading, setLoading] = useState(true);
  const [savingProject, setSavingProject] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState("");
  const [budgetPlanFilter, setBudgetPlanFilter] = useState("");

  const [projects, setProjects] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [budgetPlans, setBudgetPlans] = useState([]);

  const [projectForm, setProjectForm] = useState(() => ({
    ...initialProjectForm,
  }));
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectFileKey, setProjectFileKey] = useState(0);

  const [memberCandidates, setMemberCandidates] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectDraftMembers, setProjectDraftMembers] = useState([]);
  const [projectDraftMemberForm, setProjectDraftMemberForm] =
    useState(initialMemberForm);
  const [projectDraftEditingIndex, setProjectDraftEditingIndex] =
    useState(null);
  const [memberForm, setMemberForm] = useState(initialMemberForm);
  const [editingMember, setEditingMember] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingMember, setSavingMember] = useState(false);
  const [memberDeleteLoading, setMemberDeleteLoading] = useState(() => new Set());

  const projectTypeOptions = useMemo(() => {
    const selectedTypeId = editingProject?.type_id;
    return projectTypes.filter((type) =>
      type.is_active || type.type_id === selectedTypeId
    );
  }, [projectTypes, editingProject]);

  const budgetPlanOptions = useMemo(() => {
    const selectedPlanId = editingProject?.plan_id;
    return budgetPlans.filter((plan) =>
      plan.is_active || plan.plan_id === selectedPlanId
    );
  }, [budgetPlans, editingProject]);

  const filteredProjects = useMemo(() => {
    const query = normalizeText(projectSearch);
    const selectedType = Number(projectTypeFilter);
    const selectedPlan = Number(budgetPlanFilter);

    return projects.filter((project) => {
      if (
        projectTypeFilter &&
        Number(project.type_id ?? project.type?.type_id) !== selectedType
      ) {
        return false;
      }
      if (
        budgetPlanFilter &&
        Number(project.plan_id ?? project.budget_plan?.plan_id) !== selectedPlan
      ) {
        return false;
      }
      if (!query) {
        return true;
      }

      return [
        project.project_name,
        project.type?.name_th,
        project.type?.name_en,
        project.budget_plan?.name_th,
        project.budget_plan?.name_en,
        project.notes,
      ].some((value) => normalizeText(value).includes(query));
    });
  }, [budgetPlanFilter, projectSearch, projectTypeFilter, projects]);

  const hasProjectFilters = Boolean(
    projectSearch || projectTypeFilter || budgetPlanFilter
  );

  const availableMemberCandidates = useMemo(() => {
    if (!memberCandidates.length) {
      return [];
    }

    const usedIds = new Set(
      projectMembers
        .map((member) => getMemberUserId(member))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    if (editingMember) {
      const editingId = getMemberUserId(editingMember);
      if (Number.isFinite(editingId) && editingId > 0) {
        usedIds.delete(editingId);
      }
    }

    return memberCandidates.filter((candidate) =>
      Number.isFinite(candidate.user_id) && candidate.user_id > 0 && !usedIds.has(candidate.user_id)
    );
  }, [memberCandidates, projectMembers, editingMember]);

  const projectMemberRows = useMemo(() => {
    if (!Array.isArray(projectMembers) || projectMembers.length === 0) {
      return [];
    }

    return projectMembers.map((member) => {
      const userId = getMemberUserId(member);
      const user = getMemberUser(member);
      const candidateFromList = memberCandidates.find(
        (candidate) => candidate.user_id === userId
      );

      const rawDisplayName = candidateFromList?.display_name ?? buildUserDisplayName(user);
      const displayName = rawDisplayName && rawDisplayName !== "-"
        ? rawDisplayName
        : Number.isFinite(userId) && userId > 0
        ? `ผู้ใช้ #${userId}`
        : "-";
      const positionTitle =
        candidateFromList?.position_title ?? getUserPositionLabel(user) ?? "";
      const workloadValue = Number(
        member?.workload_hours ?? member?.WorkloadHours ?? 0
      );

      return {
        member_id: member?.member_id ?? member?.MemberID ?? null,
        user_id: Number.isFinite(userId) ? userId : null,
        duty: member?.duty ?? member?.Duty ?? "",
        workload_hours: Number.isFinite(workloadValue) ? workloadValue : 0,
        notes: member?.notes ?? member?.Notes ?? "",
        display_order: member?.display_order ?? member?.DisplayOrder ?? null,
        candidate:
          displayName && displayName !== "-"
            ? {
                user_id: Number.isFinite(userId) ? userId : null,
                display_name: displayName,
                position_title: positionTitle,
              }
            : positionTitle
            ? {
                user_id: Number.isFinite(userId) ? userId : null,
                display_name: displayName,
                position_title: positionTitle,
              }
            : null,
      };
    });
  }, [projectMembers, memberCandidates]);

  const availableDraftMemberCandidates = useMemo(() => {
    if (!memberCandidates.length) {
      return [];
    }

    const usedIds = new Set(
      projectDraftMembers
        .map((member) => Number(member?.user_id))
        .filter((id) => Number.isFinite(id) && id > 0)
    );

    if (
      typeof projectDraftEditingIndex === "number" &&
      projectDraftEditingIndex >= 0
    ) {
      const editingMember = projectDraftMembers[projectDraftEditingIndex];
      const editingId = Number(editingMember?.user_id);
      if (Number.isFinite(editingId) && editingId > 0) {
        usedIds.delete(editingId);
      }
    }

    return memberCandidates.filter(
      (candidate) =>
        Number.isFinite(candidate.user_id) &&
        candidate.user_id > 0 &&
        !usedIds.has(candidate.user_id)
    );
  }, [memberCandidates, projectDraftMembers, projectDraftEditingIndex]);

  const editingMemberIndex = useMemo(() => {
    if (!editingMember) {
      return null;
    }

    const editingId =
      editingMember?.member_id ?? editingMember?.MemberID ?? editingMember?.memberId ?? null;
    if (editingId !== null && editingId !== undefined) {
      const indexById = projectMembers.findIndex(
        (member) =>
          (member?.member_id ?? member?.MemberID ?? member?.memberId ?? null) ===
          editingId
      );
      if (indexById !== -1) {
        return indexById;
      }
    }

    const fallbackIndex = projectMembers.findIndex((member) => member === editingMember);
    return fallbackIndex === -1 ? null : fallbackIndex;
  }, [editingMember, projectMembers]);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCandidates = async () => {
      try {
        const users = await adminAPI.getProjectMemberCandidates();
        if (!isMounted) return;

        const normalized = Array.isArray(users)
          ? users.map(normalizeProjectMemberCandidate).filter(Boolean)
          : [];

        const collator = new Intl.Collator("th-TH", { sensitivity: "base" });
        normalized.sort((a, b) => collator.compare(a.display_name, b.display_name));
        setMemberCandidates(normalized);
      } catch (error) {
        if (!isMounted) return;
        console.error(error);
        Toast.fire({
          icon: "error",
          title: error?.message || "ไม่สามารถโหลดรายชื่อบุคลากรได้",
        });
      }
    };

    fetchCandidates();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [projectList, typeList, planList] = await Promise.all([
        adminAPI.getProjects(),
        adminAPI.getProjectTypes(),
        adminAPI.getProjectBudgetPlans(),
      ]);
      setProjects(projectList);
      setProjectTypes(typeList);
      setBudgetPlans(planList);
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: "ไม่สามารถโหลดข้อมูลได้" });
    } finally {
      setLoading(false);
    }
  };

  const loadProjectMembers = async (projectId) => {
    if (!projectId) {
      setProjectMembers([]);
      setMemberDeleteLoading(new Set());
      return;
    }

    setLoadingMembers(true);
    try {
      const members = await adminAPI.getProjectMembers(projectId);
      const normalized = Array.isArray(members) ? members : [];
      setProjectMembers(normalized);
      setMemberDeleteLoading(new Set());

      setProjects((prev) =>
        prev.map((project) => {
          const id = project.project_id ?? project.projectId ?? project.ProjectID;
          if (id === projectId) {
            return { ...project, members: normalized };
          }
          return project;
        })
      );

      setEditingProject((prev) =>
        prev ? { ...prev, members: normalized } : prev
      );
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: error?.message || "ไม่สามารถโหลดผู้ร่วมโครงการได้",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const resetProjectForm = () => {
    setProjectForm({ ...initialProjectForm });
    setEditingProject(null);
    setShowProjectForm(false);
    setProjectFileKey((key) => key + 1);
    setProjectMembers([]);
    setProjectDraftMembers([]);
    setProjectDraftMemberForm(initialMemberForm);
    setProjectDraftEditingIndex(null);
    setMemberForm(initialMemberForm);
    setEditingMember(null);
    setMemberDeleteLoading(new Set());
  };

  const handleDraftMemberFormChange = (field, value) => {
    if (field === "workload_hours") {
      const normalized = normalizeWorkloadInputValue(value);
      if (normalized === "" || workloadInputPattern.test(normalized)) {
        setProjectDraftMemberForm((prev) => ({
          ...prev,
          [field]: normalized,
        }));
      }
      return;
    }

    setProjectDraftMemberForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetDraftMemberState = () => {
    setProjectDraftMemberForm(initialMemberForm);
    setProjectDraftEditingIndex(null);
  };

  const handleSubmitDraftMember = () => {
    const userId = Number(projectDraftMemberForm.user_id);
    if (!Number.isFinite(userId) || userId <= 0) {
      Toast.fire({ icon: "warning", title: "กรุณาเลือกบุคลากร" });
      return;
    }

    const duty = (projectDraftMemberForm.duty ?? "").trim();
    if (!duty) {
      Toast.fire({ icon: "warning", title: "กรุณาระบุหน้าที่" });
      return;
    }
    if (Array.from(duty).length > 255) {
      Toast.fire({
        icon: "warning",
        title: "หน้าที่ต้องไม่เกิน 255 ตัวอักษร",
      });
      return;
    }

    const workloadInput = (projectDraftMemberForm.workload_hours ?? "")
      .toString()
      .trim();
    const workloadNumber = workloadInput === "" ? 0 : Number(workloadInput);
    if (!Number.isFinite(workloadNumber) || workloadNumber < 0) {
      Toast.fire({
        icon: "warning",
        title: "กรุณาระบุชั่วโมงภาระงานให้ถูกต้อง",
      });
      return;
    }
    if (workloadNumber > 9999.99) {
      Toast.fire({
        icon: "warning",
        title: "จำนวนชั่วโมงต้องไม่เกิน 9,999.99",
      });
      return;
    }

    const normalizedHours = Math.round(workloadNumber * 100) / 100;

    const notesInput = (projectDraftMemberForm.notes ?? "").trim();
    if (Array.from(notesInput).length > 255) {
      Toast.fire({
        icon: "warning",
        title: "หมายเหตุต้องไม่เกิน 255 ตัวอักษร",
      });
      return;
    }

    const duplicateIndex = projectDraftMembers.findIndex(
      (member, index) =>
        Number(member.user_id) === userId && index !== projectDraftEditingIndex
    );
    if (duplicateIndex !== -1) {
      Toast.fire({
        icon: "warning",
        title: "มีการเลือกผู้ใช้นี้ในรายการแล้ว",
      });
      return;
    }

    const candidate = memberCandidates.find(
      (entry) => entry.user_id === userId
    );
    if (!candidate) {
      Toast.fire({
        icon: "warning",
        title: "ไม่พบข้อมูลบุคลากรที่เลือก",
      });
      return;
    }

    const entry = {
      user_id: userId,
      duty,
      workload_hours: normalizedHours,
      notes: notesInput,
      candidate: {
        user_id: candidate.user_id,
        display_name: candidate.display_name,
        position_title: candidate.position_title,
      },
    };

    setProjectDraftMembers((prev) => {
      const next = [...prev];
      if (
        typeof projectDraftEditingIndex === "number" &&
        projectDraftEditingIndex >= 0 &&
        projectDraftEditingIndex < next.length
      ) {
        next[projectDraftEditingIndex] = entry;
      } else {
        next.push(entry);
      }
      return next;
    });

    Toast.fire({
      icon: "success",
      title:
        typeof projectDraftEditingIndex === "number" &&
        projectDraftEditingIndex >= 0
          ? "อัปเดตรายการผู้ร่วมโครงการแล้ว"
          : "เพิ่มผู้ร่วมโครงการในฟอร์มแล้ว",
    });

    resetDraftMemberState();
  };

  const handleEditDraftMember = (index) => {
    const target = projectDraftMembers[index];
    if (!target) return;

    setProjectDraftEditingIndex(index);
    setProjectDraftMemberForm({
      user_id: target.user_id?.toString() ?? "",
      duty: target.duty ?? "",
      workload_hours:
        target.workload_hours === null ||
        target.workload_hours === undefined
          ? ""
          : target.workload_hours.toString(),
      notes: target.notes ?? "",
    });
  };

  const handleRemoveDraftMember = (index) => {
    setProjectDraftMembers((prev) =>
      prev.filter((_, memberIndex) => memberIndex !== index)
    );

    setProjectDraftEditingIndex((prev) => {
      if (typeof prev !== "number") {
        return prev;
      }
      if (prev === index) {
        setProjectDraftMemberForm(initialMemberForm);
        return null;
      }
      if (prev > index) {
        return prev - 1;
      }
      return prev;
    });

    Toast.fire({ icon: "success", title: "ลบผู้ร่วมโครงการออกจากฟอร์มแล้ว" });
  };

  const handleCancelDraftMemberEdit = () => {
    if (
      typeof projectDraftEditingIndex === "number" &&
      projectDraftEditingIndex >= 0
    ) {
      Toast.fire({ icon: "info", title: "ยกเลิกการแก้ไขแล้ว" });
    }
    resetDraftMemberState();
  };

  const handleProjectChange = (event) => {
    const { name, value } = event.target;

    if (name === "budget_amount") {
      const normalized = normalizeBudgetInputValue(value);
      setProjectForm((prev) => ({
        ...prev,
        [name]: normalized,
      }));
      return;
    }

    setProjectForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProjectFileChange = (event) => {
    const file = event.target?.files?.[0] ?? null;
    setProjectForm((prev) => ({
      ...prev,
      attachment: file,
    }));
  };

  const handleClearProjectAttachment = () => {
    setProjectForm((prev) => ({
      ...prev,
      attachment: null,
    }));
    setProjectFileKey((key) => key + 1);
  };

  const handleSubmitProject = async (event) => {
    event.preventDefault();

    if (
      !editingProject &&
      typeof projectDraftEditingIndex === "number" &&
      projectDraftEditingIndex >= 0
    ) {
      Toast.fire({
        icon: "warning",
        title: "กรุณาบันทึกหรือยกเลิกการแก้ไขผู้ร่วมโครงการในฟอร์ม",
      });
      return;
    }

    if (!projectForm.project_name || !projectForm.type_id || !projectForm.plan_id || !projectForm.event_date) {
      Toast.fire({ icon: "warning", title: "กรุณากรอกข้อมูลให้ครบถ้วน" });
      return;
    }

    const normalizedProjectName = normalizeText(projectForm.project_name);
    const projectId = editingProject?.project_id ?? null;
    const duplicateProject = projects.some(
      (project) =>
        normalizeText(project.project_name) === normalizedProjectName &&
        (project.project_id ?? null) !== projectId
    );

    if (duplicateProject) {
      Toast.fire({ icon: "warning", title: "ชื่อโครงการซ้ำกัน" });
      return;
    }

    if (!editingProject && !projectForm.attachment) {
      Toast.fire({ icon: "warning", title: "กรุณาเลือกไฟล์แนบ" });
      return;
    }

    const typeId = Number(projectForm.type_id);
    const planId = Number(projectForm.plan_id);
    const participantsValue = projectForm.participants
      ? Number(projectForm.participants)
      : 0;
    const beneficiariesValue = projectForm.beneficiaries_count
      ? Number(projectForm.beneficiaries_count)
      : 0;
    const budgetString = projectForm.budget_amount
      ? projectForm.budget_amount.toString().trim()
      : "";
    const budgetValue = Number(budgetString);

    if (Number.isNaN(typeId) || Number.isNaN(planId)) {
      Toast.fire({ icon: "warning", title: "การเลือกประเภทหรือแผนงบประมาณไม่ถูกต้อง" });
      return;
    }

    if (!budgetString) {
      Toast.fire({ icon: "warning", title: "กรุณาระบุงบประมาณโครงการ" });
      return;
    }

    if (!budgetAmountPattern.test(budgetString)) {
      Toast.fire({
        icon: "warning",
        title: "งบประมาณต้องไม่เกิน 10 หลัก และทศนิยมไม่เกิน 2 ตำแหน่ง",
      });
      return;
    }

    if (!Number.isFinite(budgetValue)) {
      Toast.fire({ icon: "warning", title: "งบประมาณไม่ถูกต้อง" });
      return;
    }

    if (budgetValue < 0 || budgetValue > MAX_BUDGET_AMOUNT) {
      Toast.fire({
        icon: "warning",
        title: "งบประมาณต้องอยู่ในช่วง 0 - 9,999,999,999.99",
      });
      return;
    }

    if (participantsValue < 0) {
      Toast.fire({ icon: "warning", title: "จำนวนผู้เข้าร่วมต้องมากกว่าหรือเท่ากับ 0" });
      return;
    }

    if (beneficiariesValue < 0) {
      Toast.fire({
        icon: "warning",
        title: "จำนวนหน่วยงาน/ชุมชนที่ได้รับประโยชน์ต้องมากกว่าหรือเท่ากับ 0",
      });
      return;
    }

    const formPayload = new FormData();
    formPayload.append("project_name", projectForm.project_name.trim());
    formPayload.append("type_id", typeId.toString());
    formPayload.append("event_date", projectForm.event_date);
    formPayload.append("plan_id", planId.toString());
    formPayload.append("budget_amount", budgetString);
    formPayload.append("participants", participantsValue.toString());
    formPayload.append("beneficiaries_count", beneficiariesValue.toString());
    formPayload.append("notes", projectForm.notes ? projectForm.notes.trim() : "");

    if (projectForm.attachment) {
      formPayload.append("attachment", projectForm.attachment);
    }

    if (!editingProject && projectDraftMembers.length > 0) {
      const membersPayload = projectDraftMembers.map((member, index) => ({
        user_id: Number(member.user_id),
        duty: member.duty,
        workload_hours: Number(member.workload_hours ?? 0),
        notes: member.notes ?? "",
        display_order: index + 1,
      }));
      formPayload.append("members", JSON.stringify(membersPayload));
    }

    try {
      setSavingProject(true);
      if (editingProject) {
        await adminAPI.updateProject(editingProject.project_id, formPayload);
        Toast.fire({ icon: "success", title: "อัปเดตข้อมูลโครงการเรียบร้อย" });
      } else {
        await adminAPI.createProject(formPayload);
        Toast.fire({ icon: "success", title: "บันทึกโครงการใหม่เรียบร้อย" });
      }
      await loadAll();
      resetProjectForm();
    } catch (error) {
      if (error?.status === 409) {
        Toast.fire({ icon: "warning", title: "ชื่อโครงการซ้ำกัน" });
      } else {
        console.error(error);
        Toast.fire({ icon: "error", title: error.message || "บันทึกข้อมูลไม่สำเร็จ" });
      }
    } finally {
      setSavingProject(false);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setProjectForm({
      project_name: project.project_name || "",
      type_id: project.type_id?.toString() || "",
      event_date: project.event_date || "",
      plan_id: project.plan_id?.toString() || "",
      budget_amount:
        project.budget_amount === null || project.budget_amount === undefined
          ? ""
          : normalizeBudgetInputValue(project.budget_amount),
      participants: project.participants?.toString() || "",
      beneficiaries_count: project.beneficiaries_count?.toString() || "",
      notes: project.notes || "",
      attachment: null,
    });
    setProjectFileKey((key) => key + 1);
    setMemberForm(initialMemberForm);
    setEditingMember(null);
    setMemberDeleteLoading(new Set());

    const existingMembers = Array.isArray(project.members)
      ? project.members
      : [];
    setProjectMembers(existingMembers);
    setProjectDraftMembers([]);
    setProjectDraftMemberForm(initialMemberForm);
    setProjectDraftEditingIndex(null);

    const projectId = Number(
      project.project_id ?? project.projectId ?? project.ProjectID
    );
    if (Number.isFinite(projectId) && projectId > 0) {
      loadProjectMembers(projectId);
    }

    setShowProjectForm(true);
    scrollToProjectEditor();
  };

  const handleMemberFormChange = (field, value) => {
    if (field === "workload_hours") {
      const normalized = normalizeWorkloadInputValue(value);
      if (normalized === "" || workloadInputPattern.test(normalized)) {
        setMemberForm((prev) => ({
          ...prev,
          [field]: normalized,
        }));
      }
      return;
    }

    setMemberForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetMemberFormState = () => {
    setMemberForm(initialMemberForm);
    setEditingMember(null);
  };

  const updateMemberDeleteLoading = (memberId, isLoading) => {
    setMemberDeleteLoading((prev) => {
      const next = new Set(prev);
      if (isLoading) {
        next.add(memberId);
      } else {
        next.delete(memberId);
      }
      return next;
    });
  };

  const handleSubmitMember = async (event) => {
    event.preventDefault();

    if (!editingProject) {
      Toast.fire({ icon: "warning", title: "กรุณาเลือกโครงการก่อน" });
      return;
    }

    const projectId = Number(
      editingProject.project_id ??
        editingProject.projectId ??
        editingProject.ProjectID
    );
    if (!Number.isFinite(projectId) || projectId <= 0) {
      Toast.fire({ icon: "warning", title: "ไม่พบรหัสโครงการที่ถูกต้อง" });
      return;
    }

    const userId = Number(memberForm.user_id);
    if (!Number.isFinite(userId) || userId <= 0) {
      Toast.fire({ icon: "warning", title: "กรุณาเลือกบุคลากร" });
      return;
    }

    const duty = memberForm.duty.trim();
    if (!duty) {
      Toast.fire({ icon: "warning", title: "กรุณาระบุหน้าที่" });
      return;
    }
    if (Array.from(duty).length > 255) {
      Toast.fire({ icon: "warning", title: "หน้าที่ต้องไม่เกิน 255 ตัวอักษร" });
      return;
    }

    const workloadInput = (memberForm.workload_hours ?? "").toString().trim();
    const workloadNumber = workloadInput === "" ? 0 : Number(workloadInput);
    if (!Number.isFinite(workloadNumber) || workloadNumber < 0) {
      Toast.fire({ icon: "warning", title: "กรุณาระบุชั่วโมงภาระงานให้ถูกต้อง" });
      return;
    }
    if (workloadNumber > 9999.99) {
      Toast.fire({ icon: "warning", title: "จำนวนชั่วโมงต้องไม่เกิน 9,999.99" });
      return;
    }

    const normalizedHours = Math.round(workloadNumber * 100) / 100;

    const notesInput = (memberForm.notes ?? "").trim();
    if (Array.from(notesInput).length > 255) {
      Toast.fire({ icon: "warning", title: "หมายเหตุต้องไม่เกิน 255 ตัวอักษร" });
      return;
    }

    const payload = {
      user_id: userId,
      duty,
      workload_hours: normalizedHours,
      notes: notesInput,
    };

    try {
      setSavingMember(true);
      const existingMemberId =
        editingMember?.member_id ?? editingMember?.MemberID;

      if (existingMemberId) {
        await adminAPI.updateProjectMember(
          projectId,
          existingMemberId,
          payload
        );
        Toast.fire({ icon: "success", title: "อัปเดตข้อมูลผู้ร่วมโครงการแล้ว" });
      } else {
        await adminAPI.createProjectMember(projectId, payload);
        Toast.fire({ icon: "success", title: "เพิ่มผู้ร่วมโครงการเรียบร้อย" });
      }
      resetMemberFormState();
      await loadProjectMembers(projectId);
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: error?.message || "ไม่สามารถบันทึกข้อมูลผู้ร่วมโครงการได้",
      });
    } finally {
      setSavingMember(false);
    }
  };

  const handleEditMember = (member) => {
    const userId = getMemberUserId(member);
    const rawHours = Number(
      member?.workload_hours ?? member?.WorkloadHours ?? 0
    );
    setEditingMember(member);
    setMemberForm({
      user_id: Number.isFinite(userId) && userId > 0 ? String(userId) : "",
      duty: member?.duty ?? member?.Duty ?? "",
      workload_hours: Number.isFinite(rawHours) ? String(rawHours) : "",
      notes: member?.notes ?? member?.Notes ?? "",
    });
  };

  const handleCancelMemberEdit = () => {
    resetMemberFormState();
  };

  const handleDeleteMember = async (member) => {
    if (!editingProject) {
      return;
    }

    const memberId = Number(member?.member_id ?? member?.MemberID);
    const projectId = Number(
      editingProject.project_id ??
        editingProject.projectId ??
        editingProject.ProjectID
    );

    if (!Number.isFinite(memberId) || memberId <= 0 || !Number.isFinite(projectId) || projectId <= 0) {
      Toast.fire({ icon: "warning", title: "ไม่สามารถลบผู้ร่วมโครงการได้" });
      return;
    }

    const name = buildUserDisplayName(getMemberUser(member));
    const confirmed = await confirmDestructiveAction({
      title: "ยืนยันการลบผู้ร่วมโครงการ",
      text: `ต้องการลบผู้ร่วมโครงการ "${name}" หรือไม่?`,
      confirmText: "ลบผู้ร่วมโครงการ",
    });

    if (!confirmed) {
      return;
    }

    updateMemberDeleteLoading(memberId, true);
    try {
      await adminAPI.deleteProjectMember(projectId, memberId);
      Toast.fire({ icon: "success", title: "ลบผู้ร่วมโครงการแล้ว" });
      if (
        editingMember &&
        (editingMember.member_id ?? editingMember.MemberID) === memberId
      ) {
        resetMemberFormState();
      }
      await loadProjectMembers(projectId);
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: error?.message || "ไม่สามารถลบผู้ร่วมโครงการได้",
      });
    } finally {
      updateMemberDeleteLoading(memberId, false);
    }
  };

  const resolveMemberByIndex = (index, memberRow) => {
    if (!Array.isArray(projectMembers) || projectMembers.length === 0) {
      return null;
    }

    if (typeof index === "number" && index >= 0 && index < projectMembers.length) {
      return projectMembers[index];
    }

    if (memberRow) {
      const rowMemberId = Number(
        memberRow?.member_id ?? memberRow?.MemberID ?? memberRow?.memberId
      );
      if (Number.isFinite(rowMemberId) && rowMemberId > 0) {
        const matchById = projectMembers.find(
          (entry) =>
            Number(entry?.member_id ?? entry?.MemberID ?? entry?.memberId ?? 0) ===
            rowMemberId
        );
        if (matchById) {
          return matchById;
        }
      }

      const rowUserId = Number(memberRow?.user_id);
      if (Number.isFinite(rowUserId) && rowUserId > 0) {
        const matchByUser = projectMembers.find(
          (entry) => getMemberUserId(entry) === rowUserId
        );
        if (matchByUser) {
          return matchByUser;
        }
      }
    }

    return null;
  };

  const handleEditMemberAtIndex = (index, memberRow) => {
    const target = resolveMemberByIndex(index, memberRow);
    if (target) {
      handleEditMember(target);
    }
  };

  const handleDeleteMemberAtIndex = (index, memberRow) => {
    const target = resolveMemberByIndex(index, memberRow);
    if (target) {
      handleDeleteMember(target);
    }
  };

  const handleCreateProject = () => {
    setShowProjectForm(true);
    setEditingProject(null);
    setProjectForm({ ...initialProjectForm });
    setProjectFileKey((key) => key + 1);
    setProjectMembers([]);
    setProjectDraftMembers([]);
    setProjectDraftMemberForm(initialMemberForm);
    setProjectDraftEditingIndex(null);
    setMemberForm(initialMemberForm);
    setEditingMember(null);
    setMemberDeleteLoading(new Set());
    scrollToProjectEditor();
  };

  const handleDeleteProject = async (project) => {
    const confirmed = await confirmDestructiveAction({
      title: "ยืนยันการลบโครงการ",
      text: `ต้องการลบโครงการ "${project.project_name}" หรือไม่?`,
      confirmText: "ลบโครงการ",
    });

    if (!confirmed) return;

    try {
      await adminAPI.deleteProject(project.project_id);
      Toast.fire({ icon: "success", title: "ลบโครงการเรียบร้อย" });
      await loadAll();
    } catch (error) {
      console.error(error);
      Toast.fire({ icon: "error", title: error.message || "ไม่สามารถลบโครงการได้" });
    }
  };

  return (
    <PageLayout
      title="จัดการโครงการ"
      subtitle="สร้าง แก้ไข และติดตามข้อมูลโครงการ"
      icon={Briefcase}
      loading={loading}
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/research-fund-system/admin" },
        { label: "จัดการโครงการ" },
      ]}
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
              <Briefcase size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">รายการโครงการ</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                มีข้อมูลทั้งหมด {projects.length.toLocaleString("th-TH")} รายการ
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
              รีเฟรช
            </button>
            <button
              type="button"
              onClick={handleCreateProject}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <Plus size={17} aria-hidden="true" />
              เพิ่มโครงการ
            </button>
          </div>
        </section>

        <ProjectForm
          open={showProjectForm}
          formData={projectForm}
          types={projectTypeOptions}
          plans={budgetPlanOptions}
          onClose={resetProjectForm}
          onChange={handleProjectChange}
          onFileChange={handleProjectFileChange}
          onClearAttachment={handleClearProjectAttachment}
          onSubmit={handleSubmitProject}
          saving={savingProject}
          isEditing={!!editingProject}
          fileInputKey={projectFileKey}
          attachmentFile={projectForm.attachment}
          existingAttachment={editingProject?.attachments?.[0] || null}
          memberCandidates={memberCandidates}
          availableMemberCandidates={availableDraftMemberCandidates}
          draftMembers={projectDraftMembers}
          draftMemberForm={projectDraftMemberForm}
          onDraftMemberChange={handleDraftMemberFormChange}
          onDraftMemberSubmit={handleSubmitDraftMember}
          onDraftMemberEdit={handleEditDraftMember}
          onDraftMemberRemove={handleRemoveDraftMember}
          draftMemberEditingIndex={projectDraftEditingIndex}
          onDraftMemberCancel={handleCancelDraftMemberEdit}
          editMembersPanel={showProjectForm && editingProject ? (
            <ProjectFormMembersSection
              memberOptions={availableMemberCandidates}
              allCandidates={memberCandidates}
              form={memberForm}
              members={projectMemberRows}
              onFormChange={handleMemberFormChange}
              onSubmit={handleSubmitMember}
              onEdit={handleEditMemberAtIndex}
              onRemove={handleDeleteMemberAtIndex}
              onCancelEdit={handleCancelMemberEdit}
              editingIndex={editingMemberIndex}
              disabled={savingMember || loadingMembers}
              loading={loadingMembers}
              deleteLoadingIds={memberDeleteLoading}
              saving={savingMember}
            />
          ) : null}
        />

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(12rem,0.75fr)_minmax(12rem,0.75fr)_auto] lg:items-end">
              <div>
                <label htmlFor="project-search" className="mb-2 block text-sm font-medium text-slate-700">
                  ค้นหาโครงการ
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                  <input
                    id="project-search"
                    type="search"
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value)}
                    placeholder="ชื่อโครงการ ประเภท หรือแผนงบประมาณ"
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="project-type-filter" className="mb-2 block text-sm font-medium text-slate-700">
                  ประเภทโครงการ
                </label>
                <select
                  id="project-type-filter"
                  value={projectTypeFilter}
                  onChange={(event) => setProjectTypeFilter(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">ทั้งหมด</option>
                  {projectTypes.map((type) => (
                    <option key={type.type_id} value={type.type_id}>
                      {type.name_th || type.name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="budget-plan-filter" className="mb-2 block text-sm font-medium text-slate-700">
                  แผนงบประมาณ
                </label>
                <select
                  id="budget-plan-filter"
                  value={budgetPlanFilter}
                  onChange={(event) => setBudgetPlanFilter(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">ทั้งหมด</option>
                  {budgetPlans.map((plan) => (
                    <option key={plan.plan_id} value={plan.plan_id}>
                      {plan.name_th || plan.name_en}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProjectSearch("");
                  setProjectTypeFilter("");
                  setBudgetPlanFilter("");
                }}
                disabled={!hasProjectFilters}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} aria-hidden="true" />
                ล้างตัวกรอง
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
            <h2 className="text-base font-semibold text-slate-900">ผลการค้นหา</h2>
            <p className="text-sm tabular-nums text-slate-500">
              พบ {filteredProjects.length.toLocaleString("th-TH")} รายการ
            </p>
          </div>

          <ProjectsTable
            projects={filteredProjects}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            emptyMessage={hasProjectFilters ? "ไม่พบโครงการที่ตรงกับตัวกรอง" : "ยังไม่มีข้อมูลโครงการ"}
          />
        </section>
      </div>
    </PageLayout>
  );
}
