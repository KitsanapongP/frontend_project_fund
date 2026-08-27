"use client";

import { useMemo } from "react";
import { useStatusMap } from "@/app/hooks/useStatusMap";

const STYLE_BY_KEY = {
  "0": "border-amber-200 bg-amber-50 text-amber-800",
  "1": "border-green-200 bg-green-50 text-green-700",
  "2": "border-red-200 bg-red-50 text-red-700",
  "3": "border-blue-200 bg-blue-50 text-blue-700",
  "4": "border-slate-200 bg-slate-100 text-slate-700",
  "5": "border-amber-200 bg-amber-50 text-amber-800",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-green-200 bg-green-50 text-green-700",
  success: "border-green-200 bg-green-50 text-green-700",
  completed: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  failed: "border-red-200 bg-red-50 text-red-700",
  error: "border-red-200 bg-red-50 text-red-700",
  revision: "border-blue-200 bg-blue-50 text-blue-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  draft: "border-slate-200 bg-slate-100 text-slate-700",
  unknown: "border-slate-200 bg-slate-100 text-slate-600",
};

export default function StatusBadge({
  statusId,
  statusCode,
  label: labelProp,
  fallbackLabel,
  status,
  className = "",
}) {
  const { byId, isLoading } = useStatusMap();
  const statusObj = useMemo(() => {
    if (statusId == null) return undefined;
    const normalizedId = Number(statusId);
    return Number.isNaN(normalizedId) ? undefined : byId?.[normalizedId];
  }, [byId, statusId]);
  const code = statusCode ?? statusObj?.status_code;
  const styleKey = String(code ?? status ?? "unknown").trim().toLowerCase();
  const label =
    labelProp ??
    status ??
    statusObj?.status_name ??
    fallbackLabel ??
    (code != null ? `สถานะ ${code}` : isLoading ? "กำลังโหลด…" : "ไม่ทราบสถานะ");

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${STYLE_BY_KEY[styleKey] || STYLE_BY_KEY.unknown} ${className}`}
    >
      {label}
    </span>
  );
}
