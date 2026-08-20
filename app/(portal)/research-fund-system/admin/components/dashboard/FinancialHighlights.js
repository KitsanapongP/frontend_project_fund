"use client";

import { useMemo } from "react";
import { formatCurrency, formatNumber } from "@/app/utils/format";

const TYPE_LABELS = {
  fund_application: "ทุนวิจัย",
  publication_reward: "เงินรางวัลตีพิมพ์",
};

function normaliseFinancialData(data = {}, overview = {}) {
  const totalRequested = Number(data.total_requested ?? 0);
  const totalApproved = Number(data.total_approved ?? 0);
  const totalPending = Number(data.total_pending ?? 0);
  const totalRejected = Number(data.total_rejected ?? 0);
  const approvalRate = Number.isFinite(Number(data.approval_rate))
    ? Number(data.approval_rate)
    : Number(overview.approval_rate ?? 0);

  const totalCount = Number(data.total_count ?? overview.total_applications ?? 0);
  const approvedCount = Number(data.approved_count ?? overview.approved_count ?? 0);
  const pendingCount = Number(data.pending_count ?? overview.pending_count ?? 0);
  const rejectedCount = Number(data.rejected_count ?? overview.rejected_count ?? 0);

  const types = Object.entries(TYPE_LABELS).map(([key, label]) => {
    const entry = data[key] || {};
    const requested = Number(entry.requested ?? 0);
    const approved = Number(entry.approved ?? 0);
    const pending = Number(entry.pending ?? 0);
    const rejected = Number(entry.rejected ?? 0);
    const total = Number(entry.total_count ?? 0);
    const approvedTotal = Number(entry.approved_count ?? 0);
    const pendingTotal = Number(entry.pending_count ?? 0);
    const rejectedTotal = Number(entry.rejected_count ?? 0);
    const typeApprovalRate = Number.isFinite(Number(entry.approval_rate))
      ? Number(entry.approval_rate)
      : total > 0
        ? (approvedTotal / total) * 100
        : 0;

    return {
      key,
      label,
      requested,
      approved,
      pending,
      rejected,
      total,
      approvedTotal,
      pendingTotal,
      rejectedTotal,
      approvalRate: typeApprovalRate,
    };
  });

  const hasData = totalCount > 0 || totalRequested > 0 || totalApproved > 0;

  return {
    totals: {
      requested: totalRequested,
      approved: totalApproved,
      pending: totalPending,
      rejected: totalRejected,
      approvalRate,
      totalCount,
      approvedCount,
      pendingCount,
      rejectedCount,
      hasData,
    },
    types,
  };
}

export default function FinancialHighlights({ data = {}, overview = {} }) {
  const normalised = useMemo(
    () => normaliseFinancialData(data, overview),
    [data, overview]
  );

  if (!normalised.totals.hasData) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        ยังไม่มีข้อมูลทางการเงินเพียงพอสำหรับการวิเคราะห์
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 sm:grid-cols-2">
        <div className="p-4 sm:border-r sm:border-slate-200">
          <dt className="text-xs font-medium text-slate-600">ยอดคำร้องทั้งหมด</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-950">
            {formatCurrency(normalised.totals.requested)}
          </dd>
          <p className="mt-1 text-xs text-slate-500">
            อนุมัติแล้ว {formatCurrency(normalised.totals.approved)}
          </p>
        </div>
        <div className="border-t border-slate-200 p-4 sm:border-t-0">
          <dt className="text-xs font-medium text-green-700">อัตราการอนุมัติรวม</dt>
          <dd className="mt-1 text-2xl font-bold tabular-nums text-green-800">
            {normalised.totals.approvalRate.toFixed(1)}%
          </dd>
          <p className="mt-1 text-xs text-green-700">
            จาก {formatNumber(normalised.totals.totalCount)} คำร้องในระบบ
          </p>
        </div>
      </dl>

      <dl className="grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="py-3 sm:px-4 sm:first:pl-0">
          <dt className="text-xs font-medium text-amber-700">รอดำเนินการ</dt>
          <dd className="mt-1 font-semibold tabular-nums text-amber-800">{formatCurrency(normalised.totals.pending)}</dd>
          <p className="text-xs text-amber-700">{formatNumber(normalised.totals.pendingCount)} รายการ</p>
        </div>
        <div className="py-3 sm:px-4">
          <dt className="text-xs font-medium text-red-700">ไม่อนุมัติ</dt>
          <dd className="mt-1 font-semibold tabular-nums text-red-800">{formatCurrency(normalised.totals.rejected)}</dd>
          <p className="text-xs text-red-700">{formatNumber(normalised.totals.rejectedCount)} รายการ</p>
        </div>
        <div className="py-3 sm:px-4 sm:last:pr-0">
          <dt className="text-xs font-medium text-green-700">อนุมัติแล้ว</dt>
          <dd className="mt-1 font-semibold tabular-nums text-green-800">{formatCurrency(normalised.totals.approved)}</dd>
          <p className="text-xs text-green-700">{formatNumber(normalised.totals.approvedCount)} รายการ</p>
        </div>
      </dl>

      <div className="divide-y divide-slate-200">
        {normalised.types.map((type) => (
          <section key={type.key} className="py-5 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{type.label}</h3>
                <p className="text-xs text-slate-500">คำร้องทั้งหมด {formatNumber(type.total)} รายการ</p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-500">อัตราการอนุมัติ</p>
                <p className="font-semibold tabular-nums text-green-700">
                  {Number.isFinite(type.approvalRate) ? type.approvalRate.toFixed(1) : "0.0"}%
                </p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs text-slate-500">ยอดคำร้อง</dt>
                <dd className="font-semibold tabular-nums text-slate-900">{formatCurrency(type.requested)}</dd>
              </div>
              <div>
                <dt className="text-xs text-green-700">ยอดอนุมัติ</dt>
                <dd className="font-semibold tabular-nums text-green-800">{formatCurrency(type.approved)}</dd>
              </div>
              <div>
                <dt className="text-xs text-amber-700">รอดำเนินการ</dt>
                <dd className="font-semibold tabular-nums text-amber-800">{formatCurrency(type.pending)}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs leading-6 text-slate-600">
              อนุมัติ {formatNumber(type.approvedTotal)} รายการ · รอดำเนินการ {formatNumber(type.pendingTotal)} รายการ · ไม่อนุมัติ {formatNumber(type.rejectedTotal)} รายการ
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
