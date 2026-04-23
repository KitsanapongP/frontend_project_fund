import React from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Layers,
  PlusCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { targetRolesUtils } from "@/app/lib/target_roles_utils";
import StatusBadge from "@/app/(portal)/(research-fund-system)/admin/components/settings/StatusBadge";
import SettingsSectionCard from "@/app/(portal)/(research-fund-system)/admin/components/settings/common/SettingsSectionCard";
import SettingsModal from "@/app/(portal)/(research-fund-system)/admin/components/settings/common/SettingsModal";

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "ไม่จำกัด";
  const number = Number(value);
  if (Number.isNaN(number)) return "-";
  return `${number.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} บาท`;
};

const formatAllocatedAmount = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return formatCurrency(value);
};

const formatGrantCount = (value) => {
  if (value === null || value === undefined || Number(value) === 0) {
    return "ไม่จำกัด";
  }
  if (Number.isNaN(Number(value))) {
    return "-";
  }
  return `${Number(value).toLocaleString()} ครั้ง`;
};

const getSelectedYearValue = (selectedYear) => {
  if (!selectedYear) return "";
  if (selectedYear.year_id) return selectedYear.year_id;
  if (selectedYear.year) return selectedYear.year;
  return selectedYear;
};

const getSelectedYearDisplay = (selectedYear, years = []) => {
  if (!selectedYear) return "";
  if (selectedYear.year) return selectedYear.year;
  if (selectedYear.year_id) {
    const match = years.find((y) => y.year_id === selectedYear.year_id);
    if (match?.year) {
      return match.year;
    }
  }
  return selectedYear;
};

const describeTargetRoles = (targetRoles) =>
  targetRolesUtils.formatTargetRolesForDisplay(targetRoles);

const normalizeScope = (scope) => String(scope || "").toLowerCase();

const resolveBudgetOrder = (budget = {}) => {
  const candidates = [
    budget.display_order,
    budget.sort_order,
    budget.sequence,
    budget.order,
    budget.order_index,
  ];

  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") continue;
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) return numeric;
  }

  return budget.subcategory_budget_id ?? 0;
};

const categorizeBudgets = (budgets = []) => {
  const normalized = Array.isArray(budgets) ? budgets : [];
  const overall = normalized.find(
    (budget) => normalizeScope(budget.record_scope) === "overall"
  );
  const rules = normalized
    .filter((budget) => normalizeScope(budget.record_scope) !== "overall")
    .sort((a, b) => resolveBudgetOrder(a) - resolveBudgetOrder(b));
  return { overall, rules };
};

const hasBudgetRecord = (budget) => {
  if (!budget || typeof budget !== "object") return false;

  const identifiers = ["subcategory_budget_id", "budget_id"];
  if (identifiers.some((key) => budget[key] !== undefined && budget[key] !== null)) {
    return true;
  }

  const informativeFields = [
    "max_amount_per_grant",
    "max_amount_per_year",
    "max_grants",
    "allocated_amount",
    "fund_description",
  ];

  return informativeFields.some((field) => {
    const value = budget[field];
    if (value === undefined || value === null) return false;
    if (typeof value === "string") {
      return value.trim() !== "";
    }
    return true;
  });
};

const FundManagementTab = ({
  selectedYear,
  years = [],
  categories = [],
  searchTerm = "",
  expandedCategories = {},
  expandedSubcategories = {},
  onYearChange,
  onSearchChange,
  onToggleCategory,
  onToggleSubcategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  onToggleCategoryStatus,
  onToggleSubcategoryStatus,
  onToggleBudgetStatus,
  onCopyToNewYear,
  onRefresh,
  isRefreshing = false,
}) => {
  const selectedYearDisplay = getSelectedYearDisplay(selectedYear, years);
  const selectedYearNumber = React.useMemo(() => {
    const parsed = Number(selectedYearDisplay);
    return Number.isFinite(parsed) ? parsed : null;
  }, [selectedYearDisplay]);

  const nextYear = React.useMemo(() => {
    if (!selectedYearNumber) return null;
    return selectedYearNumber + 1;
  }, [selectedYearNumber]);

  const hasFundData = React.useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return false;
    }

    const hasSubcategory = categories.some(
      (category) => Array.isArray(category.subcategories) && category.subcategories.length > 0
    );

    return hasSubcategory || categories.length > 0;
  }, [categories]);

  const existingYears = React.useMemo(() => {
    return years
      .map((year) => {
        const value = year?.year ?? year;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((value) => value !== null);
  }, [years]);

  const copyDisabledReason = React.useMemo(() => {
    if (!selectedYear) return "กรุณาเลือกปีงบประมาณก่อน";
    if (!hasFundData) return "ปีที่เลือกยังไม่มีข้อมูลทุน";
    return null;
  }, [selectedYear, hasFundData]);

  const availableExistingYears = React.useMemo(() => {
    return Array.isArray(years)
      ? years.filter((year) => {
          if (!year || typeof year !== "object") return false;
          const yearId = year.year_id;
          if (yearId === undefined || yearId === null) return false;
          if (!selectedYear) return true;

          if (selectedYear.year_id !== undefined && selectedYear.year_id !== null) {
            if (`${yearId}` === `${selectedYear.year_id}`) return false;
          }

          if (selectedYear.year !== undefined && selectedYear.year !== null) {
            if (year.year !== undefined && year.year !== null && `${year.year}` === `${selectedYear.year}`) {
              return false;
            }
          }

          return true;
        })
      : [];
  }, [years, selectedYear]);

  const hasExistingTargets = availableExistingYears.length > 0;

  const [copyModalOpen, setCopyModalOpen] = React.useState(false);
  const [copyMode, setCopyMode] = React.useState("new");
  const [copyNewYear, setCopyNewYear] = React.useState(nextYear?.toString() || "");
  const [copyExistingYearId, setCopyExistingYearId] = React.useState("");
  const [copyError, setCopyError] = React.useState("");

  const resetCopyState = React.useCallback(() => {
    setCopyMode("new");
    setCopyNewYear(nextYear?.toString() || "");
    setCopyExistingYearId(
      hasExistingTargets && availableExistingYears[0]?.year_id
        ? `${availableExistingYears[0].year_id}`
        : ""
    );
    setCopyError("");
  }, [availableExistingYears, hasExistingTargets, nextYear]);

  const openCopyModal = () => {
    if (copyDisabledReason || !onCopyToNewYear) return;
    resetCopyState();
    setCopyModalOpen(true);
  };

  const closeCopyModal = () => {
    setCopyModalOpen(false);
    setCopyError("");
  };

  const handleConfirmCopy = (event) => {
    event?.preventDefault();
    setCopyError("");

    if (!onCopyToNewYear) return;

    if (copyMode === "existing") {
      if (!hasExistingTargets) {
        setCopyError("ยังไม่มีปีปลายทางให้เลือก");
        return;
      }

      if (!copyExistingYearId) {
        setCopyError("กรุณาเลือกปีที่ต้องการเพิ่มข้อมูล");
        return;
      }

      const targetYear = availableExistingYears.find(
        (year) => `${year.year_id}` === `${copyExistingYearId}`
      );
      const displayYear = targetYear?.year ?? targetYear?.year_id ?? copyExistingYearId;

      onCopyToNewYear(selectedYear, {
        mode: "existing",
        yearId: copyExistingYearId,
        year: displayYear,
      });
      setCopyModalOpen(false);
      return;
    }

    const yearValue = (copyNewYear || "").trim();
    if (!yearValue) {
      setCopyError("กรุณาระบุปีปลายทาง");
      return;
    }
    if (!/^\d{4}$/.test(yearValue)) {
      setCopyError("กรุณาระบุปี พ.ศ. 4 หลัก");
      return;
    }
    const numeric = Number(yearValue);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setCopyError("ปีปลายทางไม่ถูกต้อง");
      return;
    }
    if (existingYears.includes(numeric)) {
      setCopyError("ปีนี้มีอยู่แล้วในระบบ");
      return;
    }

    onCopyToNewYear(selectedYear, {
      mode: "new",
      year: yearValue,
    });
    setCopyModalOpen(false);
  };

  const filteredCategories = React.useMemo(() => {
    const keyword = (searchTerm || "").toLowerCase().trim();
    if (!keyword) return categories;

    return categories
      .map((category) => {
        const matchedCategory = category.category_name?.toLowerCase().includes(keyword);
        const filteredSubcategories = (category.subcategories || []).filter((sub) => {
          const baseMatch =
            sub.subcategory_name?.toLowerCase().includes(keyword) ||
            sub.fund_condition?.toLowerCase().includes(keyword);

          if (baseMatch) return true;

          return (sub.budgets || []).some((budget) => {
            const desc = budget.fund_description?.toLowerCase() || "";
            const level = budget.level?.toLowerCase() || "";
            const scope = String(budget.record_scope || "").toLowerCase();
            return (
              desc.includes(keyword) ||
              level.includes(keyword) ||
              scope.includes(keyword)
            );
          });
        });

        if (matchedCategory || filteredSubcategories.length > 0) {
          return {
            ...category,
            subcategories: filteredSubcategories,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [categories, searchTerm]);

  const confirmDeleteCategory = async (category) => {
    const subcategories = Array.isArray(category.subcategories)
      ? category.subcategories
      : [];
    const subCount = subcategories.length;
    const budgetCount = subcategories.reduce((total, sub) => {
      const budgets = Array.isArray(sub.budgets) ? sub.budgets : [];
      const visibleBudgets = budgets.filter((budget) => hasBudgetRecord(budget));
      return total + visibleBudgets.length;
    }, 0);

    const messageLines = [
      `ต้องการลบหมวดหมู่ "<strong>${category.category_name || "-"}</strong>" หรือไม่?`,
    ];

    if (subCount > 0) {
      messageLines.push(
        `หมวดหมู่นี้มีทุนย่อย ${subCount.toLocaleString()} รายการ ระบบจะลบทุนย่อยที่เกี่ยวข้องทั้งหมดด้วย`
      );
    }

    if (budgetCount > 0) {
      messageLines.push(
        `เงื่อนไขงบประมาณจำนวน ${budgetCount.toLocaleString()} รายการจะถูกลบถาวร`
      );
    }

    messageLines.push("การลบนี้ไม่สามารถย้อนกลับได้");

    const res = await Swal.fire({
      title: "ยืนยันการลบหมวดหมู่?",
      html: messageLines.join("<br/>"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
      focusCancel: true,
    });

    if (res.isConfirmed && onDeleteCategory) {
      onDeleteCategory(category);
    }
  };

  const confirmDeleteSubcategory = async (subcategory, category) => {
    const { overall, rules } = categorizeBudgets(subcategory?.budgets);
    const hasOverallBudget = hasBudgetRecord(overall);
    const ruleBudgets = (Array.isArray(rules) ? rules : []).filter((budget) =>
      hasBudgetRecord(budget)
    );
    const budgetsCount = ruleBudgets.length + (hasOverallBudget ? 1 : 0);

    const messageLines = [
      `ต้องการลบทุนย่อย "<strong>${subcategory.subcategory_name || "-"}</strong>" หรือไม่?`,
    ];

    if (budgetsCount > 0) {
      messageLines.push("ระบบจะลบเงื่อนไขหลักและเงื่อนไขรองทั้งหมดของทุนนี้ด้วย");
    }

    messageLines.push("การลบนี้ไม่สามารถย้อนกลับได้");

    const res = await Swal.fire({
      title: "ยืนยันการลบทุนย่อย?",
      html: messageLines.join("<br/>"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
      focusCancel: true,
    });

    if (res.isConfirmed && onDeleteSubcategory) {
      onDeleteSubcategory(subcategory, category);
    }
  };

  const confirmDeleteBudget = async (budget, subcategory) => {
    const scope = String(budget.record_scope || "").toLowerCase();

    let messageLines = [];

    if (scope === "overall") {
      const fundName =
        (typeof subcategory?.subcategory_name === "string"
          ? subcategory.subcategory_name.trim()
          : "") || "-";

      messageLines = [
        `ต้องการลบเงื่อนไขหลักของ "<strong>${fundName}</strong>" หรือไม่?`,
        "การลบนี้ไม่สามารถย้อนกลับได้",
      ];
    } else {
      const candidateLabels = [budget.fund_description, budget.level]
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value && value !== "-" && !/undefined/i.test(value));

      const fallbackLabel = budget.subcategory_budget_id
        ? `เงื่อนไขรอง #${budget.subcategory_budget_id}`
        : "เงื่อนไขรอง";

      const label = candidateLabels[0] || fallbackLabel;

      messageLines = [
        `ต้องการลบเงื่อนไขรอง "<strong>${label}</strong>" หรือไม่?`,
        "การลบนี้ไม่สามารถย้อนกลับได้",
      ];
    }

    const res = await Swal.fire({
      title: "ยืนยันการลบเงื่อนไขงบประมาณ?",
      html: messageLines.join("<br/>"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
    });

    if (res.isConfirmed && onDeleteBudget) {
      onDeleteBudget(budget, subcategory);
    }
  };

  return (
    <>
      <SettingsSectionCard
        icon={Layers}
        iconBgClass="bg-indigo-100"
        iconColorClass="text-indigo-600"
        title="จัดการทุน"
        description="เพิ่ม/แก้ไข หมวดหมู่ ทุนย่อย และเงื่อนไขงบประมาณตามโครงสร้างใหม่"
        actions={
          <>
            <button
              type="button"
              onClick={() => onRefresh?.()}
              disabled={!onRefresh || isRefreshing}
              aria-busy={isRefreshing}
              className={`inline-flex items-center gap-2 rounded-lg border border-green-200 px-4 py-2 text-sm font-medium text-green-600 transition ${
                isRefreshing ? "cursor-wait opacity-70" : "hover:bg-green-50"
              }`}
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : undefined} />
              {isRefreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
            </button>
            <button
              type="button"
              onClick={openCopyModal}
              disabled={Boolean(copyDisabledReason) || !onCopyToNewYear}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
            >
              <Copy size={16} />
              คัดลอกไปยังปีอื่น
            </button>
          </>
        }
        contentClassName="space-y-6"
      >
      <div className="flex flex-col gap-1 rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-blue-900 shadow-sm">
        <p className="font-medium">
          {selectedYear
            ? `กำลังตั้งค่าทุนสำหรับปี พ.ศ. ${selectedYearDisplay}`
            : "เลือกปีงบประมาณจากบัตรด้านบนเพื่อเริ่มจัดการทุน"}
        </p>
        <p className="text-xs text-blue-700">
          จัดลำดับและแก้ไขปีงบประมาณได้จากส่วน "จัดการปีงบประมาณ" ด้านบนก่อนเพิ่มหมวดหมู่หรือทุนย่อย
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">ปีงบประมาณ</label>
          <select
            value={getSelectedYearValue(selectedYear)}
            onChange={(event) => onYearChange?.(event.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map((year) => {
              const value = year.year_id || year.year || year;
              const display = year.year || year;
              return (
                <option key={value} value={value}>
                  พ.ศ. {display}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="ค้นหาหมวดหมู่หรือทุนย่อย"
              className="pl-9 pr-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72"
            />
          </div>

          <button
            type="button"
            onClick={onAddCategory}
            disabled={!selectedYear}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            <PlusCircle size={16} />
            เพิ่มหมวดหมู่
          </button>
        </div>
      </div>

      {!selectedYear ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <div className="text-4xl mb-2">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">กรุณาเลือกปีงบประมาณ</h3>
          <p className="text-gray-600">เลือกปีงบประมาณจากบัตรด้านบนเพื่อจัดการโครงสร้างทุน</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <div className="text-4xl mb-2">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบรายการที่ตรงกับการค้นหา</h3>
          <p className="text-gray-600">ลองเปลี่ยนคำค้นหาหรือเพิ่มหมวดหมู่ใหม่</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredCategories.map((category) => {
            const categoryExpanded = expandedCategories?.[category.category_id];
            const subcategories = category.subcategories || [];

            return (
              <div key={category.category_id} className="border border-gray-200 rounded-xl">
                <div className="flex flex-wrap gap-3 items-center justify-between px-5 py-4 bg-gray-50 rounded-t-xl">
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left"
                    onClick={() => onToggleCategory?.(category.category_id)}
                  >
                    {categoryExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <div>
                      <p className="text-base font-semibold text-gray-900">{category.category_name}</p>
                      <p className="text-sm text-gray-500">
                        {subcategories.length > 0
                          ? `${subcategories.length} ทุนย่อย`
                          : "ยังไม่มีทุนย่อย"}
                      </p>
                    </div>
                  </button>
                  <div className="flex flex-wrap gap-2 items-center justify-end ml-auto">
                    <StatusBadge
                      status={category.status}
                      interactive
                      onChange={(next) => onToggleCategoryStatus?.(category, next)}
                      activeLabel="เปิดใช้งาน"
                      inactiveLabel="ปิดใช้งาน"
                    />
                    <button
                      type="button"
                      onClick={() => onEditCategory?.(category)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                    >
                      <Edit size={16} className="inline mr-1" /> แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteCategory(category)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} className="inline mr-1" /> ลบ
                    </button>
                  </div>
                </div>

                {categoryExpanded && (
                  <div className="px-5 py-4 space-y-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onAddSubcategory?.(category)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg mr-1 inline-flex items-center gap-1"
                      >
                        <Plus size={14} /> เพิ่มทุนย่อย
                      </button>
                    </div>

                    {subcategories.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center text-sm text-gray-500">
                        ยังไม่มีทุนย่อยในหมวดหมู่นี้ คลิก "เพิ่มทุนย่อย" เพื่อสร้างทุนใหม่
                      </div>
                    ) : (
                      <div className="space-y-4">
                    {subcategories.map((subcategory) => {
                      const subExpanded = expandedSubcategories?.[subcategory.subcategory_id];
                      const { overall, rules } = categorizeBudgets(subcategory.budgets);
                      const hasOverallBudget = hasBudgetRecord(overall);
                      const visibleRules = (Array.isArray(rules) ? rules : []).filter((rule) =>
                        hasBudgetRecord(rule)
                      );
                      const targetRoleLabel = describeTargetRoles(subcategory.target_roles);
                      const normalizedTargetRoles = targetRoleLabel || "ทุกบทบาท";
                      const overallSummaryText = overall
                        ? `วงเงินรวมต่อปี: ${formatCurrency(overall.max_amount_per_year)} | จำนวนครั้งรวม: ${formatGrantCount(
                            overall.max_grants
                          )}`
                        : "ยังไม่กำหนดวงเงินรวม";
                      const overallSecondarySummary = overall
                        ? [
                            `วงเงินต่อครั้งค่าเริ่มต้น: ${
                              overall.max_amount_per_grant
                                ? formatCurrency(overall.max_amount_per_grant)
                                : "ไม่กำหนด"
                            }`,
                            overall.allocated_amount !== undefined &&
                            overall.allocated_amount !== null &&
                            overall.allocated_amount !== ""
                              ? `งบประมาณที่จัดสรร: ${formatAllocatedAmount(overall.allocated_amount)}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" | ")
                        : null;
                      const summaryLines = [
                        subcategory.fund_condition?.trim() || "ไม่มีเงื่อนไขเพิ่มเติม",
                        `กลุ่มเป้าหมาย: ${normalizedTargetRoles}`,
                        overallSummaryText,
                        overallSecondarySummary,
                        `มี ${visibleRules.length.toLocaleString()} ระดับ`,
                      ].filter(Boolean);

                      return (
                        <div key={subcategory.subcategory_id} className="border border-gray-200 rounded-lg">
                          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                            <button
                              type="button"
                              className="flex items-center gap-3 text-left text-gray-900 sm:flex-1"
                              onClick={() => onToggleSubcategory?.(subcategory.subcategory_id)}
                            >
                              {subExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <div>
                                <p className="font-medium text-gray-900">{subcategory.subcategory_name}</p>
                              </div>
                            </button>
                            <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
                              <StatusBadge
                                status={subcategory.status}
                                interactive
                                onChange={(next) => onToggleSubcategoryStatus?.(subcategory, category, next)}
                                activeLabel="เปิดใช้งาน"
                                inactiveLabel="ปิดใช้งาน"
                                className="shrink-0"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onEditSubcategory?.(subcategory, category)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                >
                                  <Edit size={16} className="inline mr-1" /> แก้ไข
                                </button>
                                <button
                                  type="button"
                                  onClick={() => confirmDeleteSubcategory(subcategory, category)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2 size={16} className="inline mr-1" /> ลบ
                                </button>
                              </div>
                            </div>
                              </div>

                              {subExpanded && (
                                <div className="px-4 pb-4 space-y-4">
                                  <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                                    <p className="text-sm font-semibold text-gray-900 mb-2">รายละเอียดทุน</p>
                                    <div className="space-y-1">
                                      {summaryLines.map((line, index) => (
                                        <p
                                          key={`${subcategory.subcategory_id}-summary-${index}`}
                                          className="text-sm text-gray-700"
                                        >
                                          {line}
                                        </p>
                                      ))}
                                    </div>
                                  </div>

                                  {hasOverallBudget && (
                                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                                        <div className="flex flex-1 items-start gap-3">
                                          <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                                            <Layers size={18} />
                                          </div>
                                          <div>
                                            <p className="font-semibold text-indigo-900">เงื่อนไขหลัก</p>
                                            <p className="text-sm text-indigo-700 mt-0.5">
                                              {overall.fund_description?.trim() || "ยังไม่มีคำอธิบายเงื่อนไข"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
                                          <StatusBadge
                                            status={overall.status}
                                            interactive
                                            onChange={(next) =>
                                              onToggleBudgetStatus?.(overall, subcategory, category, next)
                                            }
                                            activeLabel="เปิดใช้งาน"
                                            inactiveLabel="ปิดใช้งาน"
                                          />
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => onEditBudget?.(overall, subcategory)}
                                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                            >
                                              <Edit size={14} className="inline mr-1" /> แก้ไข
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => confirmDeleteBudget(overall, subcategory)}
                                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                            >
                                              <Trash2 size={14} className="inline mr-1" /> ลบ
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-4">
                                        <div>
                                          <p className="text-xs text-gray-500">วงเงินรวมต่อปี</p>
                                          <p className="font-medium">{formatCurrency(overall.max_amount_per_year)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">จำนวนครั้งรวม</p>
                                          <p className="font-medium">{formatGrantCount(overall.max_grants)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">วงเงินต่อครั้งค่าเริ่มต้น</p>
                                          <p className="font-medium">{formatCurrency(overall.max_amount_per_grant)}</p>
                                        </div>
                                        <div>
                                          <p className="text-xs text-gray-500">งบประมาณที่จัดสรร</p>
                                          <p className="font-medium">{formatAllocatedAmount(overall.allocated_amount)}</p>
                                        </div>
                                      </div>

                                      {overall.comment && (
                                        <p className="mt-3 text-sm text-gray-600">
                                          <span className="font-medium text-gray-700">หมายเหตุ:</span> {overall.comment}
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-semibold text-gray-700">เงื่อนไขรองของทุนย่อย</h4>
                                    <button
                                      type="button"
                                      onClick={() => onAddBudget?.(subcategory, category)}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100"
                                    >
                                      <Plus size={14} /> เพิ่มเงื่อนไขรอง
                                    </button>
                                  </div>

                                  <div className="space-y-3">
                                    {visibleRules.length > 0 ? (
                                      visibleRules.map((rule, ruleIndex) => {
                                        const normalizedDescription = (rule.fund_description || "").trim();
                                        const normalizedLevel = (rule.level || "").trim();
                                        const fallbackIdentifier = rule.subcategory_budget_id
                                          ? `เงื่อนไขรอง #${rule.subcategory_budget_id}`
                                          : rule.order_index
                                          ? `เงื่อนไขรอง #${rule.order_index}`
                                          : `เงื่อนไขรอง #${ruleIndex + 1}`;
                                        const ruleTitle = normalizedDescription || normalizedLevel || fallbackIdentifier;
                                        const showLevelSubtitle = Boolean(
                                          normalizedLevel && normalizedLevel !== ruleTitle
                                        );
                                        const ruleKey =
                                          rule.subcategory_budget_id ??
                                          rule.order_index ??
                                          `${subcategory.subcategory_id}-rule-${ruleIndex}`;

                                        return (
                                          <div key={ruleKey} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex flex-wrap gap-3 items-start">
                                              <div className="flex-1 min-w-[220px]">
                                                <div className="flex items-start gap-2 text-gray-700">
                                                  <Layers size={16} className="mt-1" />
                                                  <div>
                                                    <p className="font-semibold text-gray-900">{ruleTitle}</p>
                                                    {showLevelSubtitle && (
                                                      <p className="text-xs text-gray-500 mt-0.5">กลุ่ม/ระดับ: {normalizedLevel}</p>
                                                    )}
                                                  </div>
                                                </div>
                                                <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm text-gray-700">
                                                  <div>
                                                    <p className="text-xs text-gray-500">วงเงินต่อครั้ง</p>
                                                    <p className="font-medium">{formatCurrency(rule.max_amount_per_grant)}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-gray-500">จำนวนครั้งสูงสุด</p>
                                                    <p className="font-medium">{formatGrantCount(rule.max_grants)}</p>
                                                  </div>
                                                </div>
                                                {rule.max_amount_per_year !== null && rule.max_amount_per_year !== undefined && (
                                                  <p className="mt-2 text-sm text-gray-600">
                                                    <span className="font-medium text-gray-700">วงเงินต่อปี:</span>{' '}
                                                    {formatCurrency(rule.max_amount_per_year)}
                                                  </p>
                                                )}
                                                {rule.comment && (
                                                  <p className="mt-2 text-sm text-gray-600">
                                                    <span className="font-medium text-gray-700">หมายเหตุ:</span> {rule.comment}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex flex-col gap-2 items-end ml-auto">
                                                <StatusBadge
                                                  status={rule.status}
                                                  interactive
                                                  onChange={(next) =>
                                                    onToggleBudgetStatus?.(rule, subcategory, category, next)
                                                  }
                                                  activeLabel="เปิดใช้งาน"
                                                  inactiveLabel="ปิดใช้งาน"
                                                />
                                                <div className="flex gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => onEditBudget?.(rule, subcategory)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                                  >
                                                    <Edit size={14} className="inline mr-1" /> แก้ไข
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => confirmDeleteBudget(rule, subcategory)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                                                  >
                                                    <Trash2 size={14} className="inline mr-1" /> ลบ
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-600">
                                        ยังไม่มีเงื่อนไขรอง สามารถเพิ่มเงื่อนไขรองเพื่อกำหนดเพดานต่อครั้งเฉพาะเงื่อนไขได้
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </SettingsSectionCard>

      <SettingsModal
        open={copyModalOpen}
        onClose={closeCopyModal}
        size="lg"
        bodyClassName="max-h-[75vh] overflow-y-auto px-6 py-6"
        footerClassName="flex items-center justify-end gap-3 px-6 py-4"
        headerContent={
          <div className="flex items-center gap-3 text-gray-700">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Copy size={18} />
            </span>
            <div>
              <p className="text-base font-semibold text-gray-900">คัดลอกโครงสร้างทุน</p>
              <p className="text-sm text-gray-500">นำโครงสร้างทุนจากปีที่เลือกไปยังปีใหม่หรือปีที่มีอยู่</p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleConfirmCopy} className="space-y-5">
          <div className="space-y-4">
            <div
              className={`rounded-xl border p-4 transition ${
                copyMode === "new" ? "border-blue-200 bg-blue-50/60" : "border-gray-200"
              }`}
            >
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="copy-mode"
                  value="new"
                  checked={copyMode === "new"}
                  onChange={() => setCopyMode("new")}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">คัดลอกไปปีใหม่</p>
                  <p className="text-sm text-gray-600">ระบบจะสร้างปีงบประมาณใหม่ตามปีที่ระบุ</p>
                </div>
              </label>
              <input
                type="number"
                value={copyNewYear}
                onChange={(event) => setCopyNewYear(event.target.value)}
                placeholder="เช่น 2569"
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={copyMode !== "new"}
              />
            </div>

            <div
              className={`rounded-xl border p-4 transition ${
                copyMode === "existing" ? "border-blue-200 bg-blue-50/60" : "border-gray-200"
              } ${!hasExistingTargets ? "opacity-60" : ""}`}
            >
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="copy-mode"
                  value="existing"
                  checked={copyMode === "existing"}
                  onChange={() => setCopyMode("existing")}
                  className="mt-1"
                  disabled={!hasExistingTargets}
                />
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">เพิ่มไปยังปีที่มีอยู่</p>
                  <p className="text-sm text-gray-600">นำโครงสร้างทุนไปเพิ่มในปีที่เลือก</p>
                </div>
              </label>
              <select
                value={copyExistingYearId}
                onChange={(event) => setCopyExistingYearId(event.target.value)}
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                disabled={!hasExistingTargets || copyMode !== "existing"}
              >
                <option value="">เลือกปีปลายทาง</option>
                {availableExistingYears.map((year) => (
                  <option key={year.year_id} value={year.year_id}>
                    {year.year ? `พ.ศ. ${year.year}` : `ID ${year.year_id}`}
                  </option>
                ))}
              </select>
              {!hasExistingTargets ? (
                <p className="mt-2 text-sm text-gray-500">ยังไม่มีปีปลายทางให้เลือก</p>
              ) : null}
            </div>
          </div>

          {copyError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{copyError}</div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={closeCopyModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Copy size={16} />
              คัดลอก
            </button>
          </div>
        </form>
      </SettingsModal>
    </>
  );
};

export default FundManagementTab;