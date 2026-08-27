"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/app/utils/format";

const STAGE_DEFINITIONS = [
  {
    key: "draft",
    label: "ร่างคำร้อง",
    description: "ยังไม่ส่งเข้าสู่ระบบ",
    barClassName: "bg-slate-500",
  },
  {
    key: "dept_review",
    label: "รอหัวหน้าสาขา",
    description: "รอการพิจารณาจากหัวหน้าสาขา",
    barClassName: "bg-amber-500",
  },
  {
    key: "admin_review",
    label: "รอผู้ดูแล",
    description: "รอผู้ดูแลตรวจสอบ",
    barClassName: "bg-blue-600",
  },
  {
    key: "needs_revision",
    label: "ขอข้อมูลเพิ่มเติม",
    description: "แจ้งให้ผู้ยื่นแก้ไขข้อมูล",
    barClassName: "bg-amber-600",
  },
  {
    key: "approved",
    label: "อนุมัติแล้ว",
    description: "ผ่านการอนุมัติเรียบร้อย",
    barClassName: "bg-green-600",
  },
  {
    key: "rejected",
    label: "ไม่อนุมัติ",
    description: "ถูกปฏิเสธ",
    barClassName: "bg-red-600",
  },
  {
    key: "closed",
    label: "ปิดคำร้อง",
    description: "ดำเนินการเสร็จสิ้น",
    barClassName: "bg-slate-700",
  },
];

const TYPE_OPTIONS = [
  { key: "overall", label: "ทั้งหมด" },
  { key: "fund_application", label: "ทุนวิจัย" },
  { key: "publication_reward", label: "เงินรางวัลตีพิมพ์" },
];

const OTHER_STAGE = {
  key: "other",
  label: "สถานะอื่น ๆ",
  description: "สถานะที่ไม่ได้อยู่ในขั้นตอนหลัก",
  barClassName: "bg-slate-400",
};

function normalizeBreakdown(rawBreakdown = {}) {
  const safeBreakdown = typeof rawBreakdown === "object" && rawBreakdown !== null
    ? rawBreakdown
    : {};

  const typeKeys = new Set([
    ...Object.keys(safeBreakdown),
    ...TYPE_OPTIONS.map((option) => option.key),
  ]);

  const result = {};

  typeKeys.forEach((typeKey) => {
    const entry = safeBreakdown[typeKey] || {};
    const stageArray = Array.isArray(entry.stages) ? entry.stages : [];
    const stageMap = new Map(
      stageArray.map((stage) => [stage.stage || stage.key, stage])
    );

    const stagesWithCounts = STAGE_DEFINITIONS.map((definition) => {
      const data = stageMap.get(definition.key) || {};
      const count = Number(data.count ?? 0);
      const percentage = Number.isFinite(Number(data.percentage))
        ? Number(data.percentage)
        : 0;

      return {
        ...definition,
        label: data.label || definition.label,
        count,
        percentage,
      };
    });

    let total = Number(entry.total ?? 0);
    if (!Number.isFinite(total) || total <= 0) {
      total = stagesWithCounts.reduce((sum, stage) => sum + stage.count, 0);
    }

    const normalizedStages = stagesWithCounts.map((stage) => {
      const percentage = total > 0
        ? (stage.count / total) * 100
        : stage.percentage;
      return {
        ...stage,
        percentage: Number.isFinite(percentage) ? percentage : 0,
      };
    });

    const otherStage = stageArray.find((stage) => (stage.stage || stage.key) === OTHER_STAGE.key);
    if (otherStage && Number(otherStage.count ?? 0) > 0) {
      const otherCount = Number(otherStage.count ?? 0);
      const otherPercentage = total > 0
        ? (otherCount / total) * 100
        : Number(otherStage.percentage ?? 0);
      normalizedStages.push({
        ...OTHER_STAGE,
        label: otherStage.label || OTHER_STAGE.label,
        count: otherCount,
        percentage: Number.isFinite(otherPercentage) ? otherPercentage : 0,
      });
    }

    result[typeKey] = {
      total,
      stages: normalizedStages,
    };
  });

  return result;
}

export default function StatusPipeline({ breakdown = {} }) {
  const normalized = useMemo(() => normalizeBreakdown(breakdown), [breakdown]);

  const availableTypes = useMemo(() => {
    return TYPE_OPTIONS.filter(({ key }) => {
      const entry = normalized[key];
      if (!entry) return false;
      if (entry.total > 0) return true;
      return entry.stages?.some((stage) => Number(stage.count ?? 0) > 0);
    });
  }, [normalized]);

  const defaultType = availableTypes[0]?.key || TYPE_OPTIONS[0].key;
  const [activeType, setActiveType] = useState(defaultType);

  useEffect(() => {
    if (!availableTypes.some((option) => option.key === activeType)) {
      setActiveType(availableTypes[0]?.key || defaultType);
    }
  }, [activeType, availableTypes, defaultType]);

  if (!availableTypes.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        ไม่มีข้อมูลสถานะคำร้องในช่วงเวลานี้
      </p>
    );
  }

  const activeData = normalized[activeType] || { total: 0, stages: [] };
  const approvalStage = activeData.stages.find((stage) => stage.key === "approved");
  const approvalRate = approvalStage ? Number(approvalStage.percentage ?? 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">ประเภทคำร้อง</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="เลือกประเภทคำร้อง">
            {availableTypes.map((option) => {
              const isActive = option.key === activeType;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setActiveType(option.key)}
                  aria-pressed={isActive}
                  className={`min-h-11 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:text-right">
          <p className="text-sm text-slate-500">คำร้องทั้งหมด</p>
          <p className="text-3xl font-bold tabular-nums text-slate-950">
            {formatNumber(activeData.total)}
          </p>
          <p className="mt-1 text-xs font-medium text-green-700">
            อัตราการอนุมัติ {Number.isFinite(approvalRate) ? approvalRate.toFixed(1) : "0.0"}%
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {activeData.stages.map((stage) => {
          const percentage = Number.isFinite(stage.percentage) ? stage.percentage : 0;
          return (
            <div key={stage.key} className="space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">{stage.label}</span>
                  {stage.description && (
                    <span className="text-xs text-slate-500">{stage.description}</span>
                  )}
                </div>
                <span className="text-sm tabular-nums text-slate-600">
                  {formatNumber(stage.count)} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={stage.label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(Math.min(Math.max(percentage, 0), 100))}>
                <div
                  className={`h-full transition-[width] duration-300 motion-reduce:transition-none ${stage.barClassName}`}
                  style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
