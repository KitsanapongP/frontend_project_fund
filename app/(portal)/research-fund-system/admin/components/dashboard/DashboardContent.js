"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CircleDollarSign,
  PieChart,
  RefreshCcw,
  ShieldCheck,
  BadgeCheck,
  ListChecks,
  CalendarClock,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Download,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import PageLayout from "../common/PageLayout";
import Card from "../common/Card";
import SimpleCard from "../common/SimpleCard";
import MonthlyChart from "./MonthlyChart";
import adminAPI from "../../../../../lib/admin_api";
import { useAuth } from "@/app/contexts/AuthContext";
import EligibilitySummary from "./EligibilitySummary";
import StatusPipeline from "./StatusPipeline";
import FinancialHighlights from "./FinancialHighlights";
import UpcomingDeadlines from "./UpcomingDeadlines";
import {
  formatCurrency,
  formatNumber,
  formatThaiDateFromBEString,
  formatThaiDateTime,
} from "@/app/utils/format";

const MAX_PENDING_DISPLAY = 5;

const SCOPE_LABELS = {
  all: "ทั้งหมด",
  current_year: "ปีปัจจุบัน",
  year: "เลือกปี",
  installment: "ตามรอบการพิจารณา",
};

function buildScopeDescription(filters, options) {
  const years = Array.isArray(options?.years) ? options.years : [];
  const yearLabel = years.find((item) => String(item.year) === String(filters?.year))?.year || filters?.year;
  switch (filters?.scope) {
    case "all":
      return "ช่วงข้อมูล: ทั้งหมด";
    case "year":
      return yearLabel ? `ช่วงข้อมูล: ปี ${yearLabel}` : "ช่วงข้อมูล: เลือกปี";
    case "installment": {
      const installment = filters?.installment ? `รอบที่ ${filters.installment}` : "ทุกช่วง";
      return yearLabel
        ? `ช่วงข้อมูล: ${installment} ของปี ${yearLabel}`
        : `ช่วงข้อมูล: ${installment}`;
    }
    case "current_year": {
      const current = options?.current_year;
      return current ? `ช่วงข้อมูล: ปีปัจจุบัน (${current})` : "ช่วงข้อมูล: ปีปัจจุบัน";
    }
    default:
      return null;
  }
}

function getInstallmentsForYear(year, options) {
  const yearKey = String(year || "");
  if (!options?.installments || !yearKey) return [];
  return Array.isArray(options.installments[yearKey]) ? options.installments[yearKey] : [];
}

function normalizeServerFilter(selected, fallback = {}) {
  if (!selected || typeof selected !== "object") {
    return null;
  }
  const scope = selected.scope || fallback.scope || "current_year";
  const normalized = { scope };
  if (selected.year) {
    normalized.year = String(selected.year);
  } else if (fallback.year) {
    normalized.year = fallback.year;
  }
  if (selected.installment !== undefined && selected.installment !== null) {
    normalized.installment = String(selected.installment);
  } else if (fallback.installment) {
    normalized.installment = fallback.installment;
  }
  return normalized;
}

function normalizeFilterForScope(filters, options) {
  const normalized = { scope: filters.scope || "current_year" };
  if (normalized.scope === "year" || normalized.scope === "installment") {
    const fallbackYear = filters.year || options?.current_year || (Array.isArray(options?.years) && options.years.length > 0 ? options.years[0].year : "");
    normalized.year = fallbackYear ? String(fallbackYear) : "";
  }
  if (normalized.scope === "installment") {
    const availableInstallments = getInstallmentsForYear(normalized.year, options);
    const firstInstallment = availableInstallments[0]?.installment;
    const targetInstallment = filters.installment || (firstInstallment !== undefined ? String(firstInstallment) : "");
    normalized.installment = targetInstallment;
  }
  return normalized;
}

function areFiltersEqual(a = {}, b = {}) {
  return (
    a.scope === b.scope &&
    String(a.year || "") === String(b.year || "") &&
    String(a.installment || "") === String(b.installment || "")
  );
}

function FilterControls({ filters, options, onScopeChange, onYearChange, onInstallmentChange, disabled }) {
  const scopes = useMemo(() => (Array.isArray(options?.scopes) ? options.scopes : []), [options]);
  const years = useMemo(() => (Array.isArray(options?.years) ? options.years : []), [options]);
  const installments = useMemo(
    () => getInstallmentsForYear(filters?.year, options),
    [filters?.year, options]
  );

  const showYearSelect = filters.scope === "year" || filters.scope === "installment";
  const showInstallmentSelect = filters.scope === "installment";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white pl-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <label htmlFor="dashboard-scope" className="sr-only">เลือกช่วงข้อมูล</label>
        <select
          id="dashboard-scope"
          value={filters.scope}
          onChange={onScopeChange}
          disabled={disabled}
          className="min-h-11 min-w-36 rounded-r-lg border-0 bg-transparent py-2 pl-0 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {scopes.map((scope) => (
            <option key={scope} value={scope}>
              {SCOPE_LABELS[scope] || scope}
            </option>
          ))}
        </select>
      </div>

      {showYearSelect && (
        <div>
          <label htmlFor="dashboard-year" className="sr-only">เลือกปีงบประมาณ</label>
          <select
            id="dashboard-year"
            value={filters.year || ""}
            onChange={onYearChange}
            disabled={disabled || !years.length}
            className="min-h-11 min-w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {years.map((year) => (
              <option key={year.year_id ?? year.year} value={year.year}>
                ปี {year.year}
              </option>
            ))}
          </select>
        </div>
      )}

      {showInstallmentSelect && (
        <div>
          <label htmlFor="dashboard-installment" className="sr-only">เลือกรอบการพิจารณา</label>
          <select
            id="dashboard-installment"
            value={filters.installment || ""}
            onChange={onInstallmentChange}
            disabled={disabled || !installments.length}
            className="min-h-11 min-w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {installments.map((item) => (
              <option key={`${item.installment}-${item.name}`} value={item.installment}>
                {item.name || `รอบที่ ${item.installment}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function OverviewCards({ overview, currentDate, scopeDescription }) {
  const cards = useMemo(() => {
    const totalApplications = Number(overview?.total_applications ?? 0);
    const pending = Number(overview?.pending_count ?? 0);
    const totalUsers = Number(overview?.total_users ?? 0);
    const usedBudget = Number(overview?.used_budget ?? overview?.total_approved_amount ?? 0);
    const totalBudget = Number(overview?.total_budget ?? overview?.total_requested_amount ?? 0);
    const approvalRate = Number(overview?.approval_rate ?? 0);

    return [
      {
        label: "คำร้องทั้งหมด",
        value: formatNumber(totalApplications),
        icon: FileText,
        iconClassName: "border-blue-200 bg-blue-50 text-blue-700",
        valueClassName: "text-slate-950",
      },
      {
        label: "รอดำเนินการ",
        value: formatNumber(pending),
        icon: Clock,
        iconClassName: "border-amber-200 bg-amber-50 text-amber-700",
        valueClassName: "text-amber-800",
      },
      {
        label: "ผู้ใช้งานทั้งหมด",
        value: formatNumber(totalUsers),
        icon: Users,
        iconClassName: "border-slate-200 bg-slate-100 text-slate-700",
        valueClassName: "text-slate-950",
      },
      {
        label: "งบที่ใช้ไป",
        value: formatCurrency(usedBudget),
        icon: CircleDollarSign,
        iconClassName: "border-blue-200 bg-blue-50 text-blue-700",
        valueClassName: "text-slate-950",
      },
      {
        label: "งบประมาณประจำปี",
        value: formatCurrency(totalBudget),
        icon: PieChart,
        iconClassName: "border-slate-200 bg-slate-100 text-slate-700",
        valueClassName: "text-slate-950",
      },
      {
        label: "อัตราการอนุมัติ",
        value: Number.isFinite(approvalRate) ? `${approvalRate.toFixed(1)}%` : "-",
        icon: BadgeCheck,
        iconClassName: "border-green-200 bg-green-50 text-green-700",
        valueClassName: "text-green-800",
      },
    ];
  }, [overview]);

  return (
    <section className="space-y-4" aria-label="ภาพรวมข้อมูลสำคัญ">
      {(currentDate || scopeDescription) && (
        <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {currentDate && (
            <span>
              อัปเดตล่าสุด <span className="font-semibold text-slate-800">{currentDate}</span>
            </span>
          )}
          {scopeDescription && (
            <span className="text-slate-500">{scopeDescription}</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="flex min-h-32 min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${card.iconClassName}`}>
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="mt-5 min-w-0">
              <p className={`break-words text-xl font-bold tabular-nums sm:text-2xl ${card.valueClassName}`}>{card.value}</p>
              <p className="mt-1 text-sm text-slate-600">{card.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryBudgetTable({ categories = [] }) {
  const [expanded, setExpanded] = useState({});

  if (!categories.length) {
    return <p className="py-8 text-center text-sm text-slate-500">ไม่มีข้อมูลการใช้งบประมาณตามหมวดหมู่</p>;
  }

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="divide-y divide-slate-200">
      {categories.map((category) => {
        const key = `${category.category_id}-${category.year}`;
        const usedAmount = Number(category?.used_amount ?? category?.approved_amount ?? 0);
        const allocated = Number(category?.allocated_budget ?? 0);
        const remaining = Number(category?.remaining_budget ?? Math.max(allocated - usedAmount, 0));
        const totalApplications = Number(category?.total_applications ?? 0);
        const approvedApplications = Number(category?.approved_applications ?? 0);
        const utilization = allocated > 0 ? Math.min((usedAmount / allocated) * 100, 999) : 0;
        const subcategories = Array.isArray(category?.subcategories) ? category.subcategories : [];
        const isExpanded = !!expanded[key];

        return (
          <div
            key={key}
            className="overflow-hidden py-1 first:pt-0 last:pb-0"
          >
            <button
              type="button"
              onClick={() => toggle(key)}
              className="flex min-h-16 w-full flex-col gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:flex-row sm:items-center sm:justify-between"
              aria-expanded={isExpanded}
              aria-controls={`${key}-budget-details`}
            >
              <div className="min-w-0">
                <p className="text-base font-semibold text-slate-900">{category.category_name}</p>
                <p className="mt-0.5 text-xs text-slate-500">ปีงบประมาณ {category.year}</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600 sm:w-auto sm:grid-cols-4 sm:gap-6">
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-slate-900">{formatNumber(totalApplications)}</p>
                  <p className="text-xs text-slate-500">คำร้องทั้งหมด</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-blue-700">{formatCurrency(usedAmount)}</p>
                  <p className="text-xs text-slate-500">ใช้ไป</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-slate-800">{formatCurrency(allocated)}</p>
                  <p className="text-xs text-slate-500">งบที่จัดสรร</p>
                </div>
                <div className="flex items-center justify-end gap-3 text-right">
                  <div>
                    <p className="font-semibold tabular-nums text-slate-800">{utilization.toFixed(1)}%</p>
                    <p className="text-xs text-slate-500">การใช้จ่าย</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                </div>
              </div>
            </button>

            <div className="px-3 pb-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>อนุมัติแล้ว {formatNumber(approvedApplications)} รายการ</span>
                <span>คงเหลืองบ {formatCurrency(remaining)}</span>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={`การใช้งบของ ${category.category_name}`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.min(Math.round(utilization), 100)}>
                <div
                  className="h-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none"
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
            </div>

            {isExpanded && subcategories.length > 0 && (
              <div id={`${key}-budget-details`} className="overflow-x-auto border-t border-slate-200 bg-slate-50">
                <table className="min-w-[720px] w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-600">
                      <th className="py-2 pl-4 pr-3 font-medium">ทุนย่อย</th>
                      <th className="py-2 px-3 font-medium text-center">คำร้องทั้งหมด</th>
                      <th className="py-2 px-3 font-medium text-right">อนุมัติแล้ว</th>
                      <th className="py-2 px-3 font-medium text-right">งบที่จัดสรร</th>
                      <th className="py-2 px-4 font-medium text-right">ใช้ไป</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {subcategories.map((item) => {
                      const subAllocated = Number(item?.allocated_amount ?? 0);
                      const subUsed = Number(item?.used_amount ?? item?.approved_amount ?? 0);
                      return (
                        <tr key={item.subcategory_id} className="text-slate-700 hover:bg-slate-50">
                          <td className="py-2 pl-4 pr-3">
                            <p className="font-medium text-slate-900">{item.subcategory_name || "-"}</p>
                            <p className="text-xs text-slate-500">
                              เหลือสิทธิ์ {formatNumber(item.remaining_grant ?? 0)} / {formatNumber(item.max_grants ?? 0)}
                            </p>
                          </td>
                          <td className="py-2 px-3 text-center">{formatNumber(item.total_applications ?? 0)}</td>
                          <td className="py-2 px-3 text-right font-medium text-green-700">{formatNumber(item.approved_applications ?? 0)}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(subAllocated)}</td>
                          <td className="py-2 px-4 text-right font-medium text-blue-700">{formatCurrency(subUsed)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PendingApplicationsList({ applications = [] }) {
  if (!applications.length) {
    return <p className="py-8 text-center text-sm text-slate-500">ไม่มีคำร้องที่รอดำเนินการ</p>;
  }

  return (
    <div className="divide-y divide-slate-200">
      {applications.slice(0, MAX_PENDING_DISPLAY).map((app) => {
        const amount = formatCurrency(app?.requested_amount ?? app?.amount ?? 0);
        const submittedAt = formatThaiDateTime(app?.submitted_at);
        const key = app?.application_id ?? app?.submission_id ?? app?.application_number ?? submittedAt;

        return (
          <div
            key={key}
            className="px-1 py-4 first:pt-0 last:pb-0"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {app?.project_title || app?.title || "-"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">เลขที่คำร้อง: {app?.application_number || "-"}</p>
                {app?.category_name && (
                  <p className="mt-1 text-xs text-slate-500">หมวด: {app.category_name}</p>
                )}
              </div>
              <div className="whitespace-nowrap text-xs text-slate-500">{submittedAt}</div>
            </div>

            <div className="mt-3 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-700">{app?.applicant_name || "ไม่ระบุผู้ยื่น"}</p>
                {app?.subcategory_name && (
                  <p className="text-xs text-slate-500">{app.subcategory_name}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-blue-700">{amount}</p>
                <p className="text-xs text-slate-500">วงเงินที่ขอ</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900" role="alert">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">โหลดข้อมูลแดชบอร์ดไม่สำเร็จ</p>
        <p className="mt-1 text-sm text-red-800">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          ลองโหลดอีกครั้ง
        </button>
      </div>
    </div>
  );
}

export default function DashboardContent({ onNavigate, basePath = "/admin" }) {
  const { user } = useAuth();
  const rawRole = user?.role_id ?? user?.role;
  const normalizedRole = typeof rawRole === "string" ? rawRole.toLowerCase() : rawRole;
  const numericRole = Number(rawRole);
  const isExecutive = normalizedRole === 5 || normalizedRole === "executive" || numericRole === 5;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState({ scope: "current_year", year: "", installment: "" });
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const buildQueryParams = useCallback((params) => {
    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );
  }, []);

  const loadDashboard = useCallback(async ({ silent = false, targetFilters } = {}) => {
    const params = targetFilters || filtersRef.current;
    const query = buildQueryParams(params);

    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await adminAPI.getSystemStats(query);
      const payload = response?.stats || response || {};
      setStats(payload);

      const serverFilter = normalizeServerFilter(payload?.selected_filter, params);
      if (serverFilter) {
        const next = normalizeFilterForScope(serverFilter, payload?.filter_options || {});
        if (!areFiltersEqual(filtersRef.current, next)) {
          setFilters(next);
        }
      }
    } catch (err) {
      console.error("Error fetching admin dashboard stats:", err);
      setError(err?.message || "ไม่สามารถโหลดข้อมูลได้ในขณะนี้");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [buildQueryParams]);

  const handleExportAllData = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminAutoExport", "1");
    }

    if (onNavigate) {
      onNavigate("applications-list");
    } else if (typeof window !== "undefined") {
      window.location.href = "/research-fund-system/admin/applications-list";
    }
  }, [onNavigate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const filterOptions = stats?.filter_options || {};
  const scopeDescription = buildScopeDescription(filters, filterOptions);

  const overview = stats?.overview ?? {};
  const categoryBudgets = useMemo(
    () => (Array.isArray(stats?.category_budgets) ? stats.category_budgets : []),
    [stats]
  );
  const pendingApplications = useMemo(
    () => (Array.isArray(stats?.pending_applications) ? stats.pending_applications : []),
    [stats]
  );

  const trendBreakdown = useMemo(() => {
    const base = stats?.trend_breakdown && typeof stats.trend_breakdown === "object"
      ? stats.trend_breakdown
      : {};
    const fallbackMonthly = Array.isArray(stats?.monthly_trends)
      ? { monthly: stats.monthly_trends }
      : {};
    return { ...fallbackMonthly, ...base };
  }, [stats]);

  const statusBreakdown = useMemo(
    () => (stats?.status_breakdown && typeof stats.status_breakdown === "object"
      ? stats.status_breakdown
      : {}),
    [stats]
  );

  const financialOverview = useMemo(
    () => (stats?.financial_overview && typeof stats.financial_overview === "object"
      ? stats.financial_overview
      : {}),
    [stats]
  );

  const upcomingPeriods = useMemo(
    () => (Array.isArray(stats?.upcoming_periods) ? stats.upcoming_periods : []),
    [stats]
  );

  const quotaSummary = useMemo(
    () => (Array.isArray(stats?.quota_summary) ? stats.quota_summary : []),
    [stats]
  );

  const quotaUsageViewRows = useMemo(
    () => (Array.isArray(stats?.quota_usage_view_rows) ? stats.quota_usage_view_rows : []),
    [stats]
  );

  const currentDate = stats?.current_date
    ? formatThaiDateFromBEString(stats.current_date)
    : null;

  const handleRefresh = () => loadDashboard({ silent: true });

  const handleScopeChange = (event) => {
    const nextFilters = normalizeFilterForScope(
      { scope: event.target.value, year: filters.year, installment: filters.installment },
      filterOptions
    );
    setFilters(nextFilters);
    loadDashboard({ targetFilters: nextFilters });
  };

  const handleYearChange = (event) => {
    const nextFilters = normalizeFilterForScope(
      { ...filters, year: event.target.value },
      filterOptions
    );
    setFilters(nextFilters);
    loadDashboard({ targetFilters: nextFilters });
  };

  const handleInstallmentChange = (event) => {
    const nextFilters = { ...filters, installment: event.target.value };
    setFilters(nextFilters);
    loadDashboard({ targetFilters: nextFilters });
  };

  return (
    <PageLayout
      title="แดชบอร์ดผู้ดูแลระบบ"
      subtitle="ภาพรวมการดำเนินงานและการใช้งบประมาณของระบบ"
      icon={LayoutDashboard}
      loading={loading}
      breadcrumbs={[
        { label: "หน้าแรก", href: basePath },
        { label: "แดชบอร์ดผู้ดูแลระบบ" },
      ]}
      actions={(
        <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <FilterControls
            filters={filters}
            options={filterOptions}
            onScopeChange={handleScopeChange}
            onYearChange={handleYearChange}
            onInstallmentChange={handleInstallmentChange}
            disabled={loading && !isRefreshing}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {!isExecutive && (
              <button
                type="button"
                onClick={() => onNavigate?.("applications-list")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                จัดการคำร้อง
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
            {!isExecutive && (
              <button
                type="button"
                onClick={handleExportAllData}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                ส่งออกข้อมูลทั้งหมด
              </button>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
              {isRefreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
            </button>
          </div>
        </div>
      )}
    >
      {error ? (
          <ErrorState message={error} onRetry={handleRefresh} />
      ) : (
        <div className="space-y-8">
          <OverviewCards
            overview={overview}
            currentDate={currentDate}
            scopeDescription={scopeDescription}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SimpleCard
              title="สถานะคำร้องทั้งระบบ"
              icon={ListChecks}
              className="xl:col-span-2"
            >
              <StatusPipeline breakdown={statusBreakdown} />
            </SimpleCard>

            <SimpleCard
              title="กำหนดปิดรอบทุนที่กำลังมาถึง"
              icon={CalendarClock}
            >
              <UpcomingDeadlines periods={upcomingPeriods} />
            </SimpleCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SimpleCard
              title="แนวโน้มการยื่นคำร้อง"
              icon={TrendingUp}
              className="xl:col-span-2"
            >
              <MonthlyChart breakdown={trendBreakdown} defaultMode="monthly" />
            </SimpleCard>

            <SimpleCard
              title="สถานะการเงินและการอนุมัติ"
              icon={CircleDollarSign}
            >
              <FinancialHighlights data={financialOverview} overview={overview} />
            </SimpleCard>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <SimpleCard
              title="หมวดหมู่การใช้งบสูงสุด"
              icon={CircleDollarSign}
              className="2xl:col-span-3"
              action={(
                <button
                  type="button"
                  onClick={() => onNavigate?.("fund-settings")}
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  จัดการงบประมาณ
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            >
              <CategoryBudgetTable categories={categoryBudgets} />
            </SimpleCard>

            <SimpleCard
              title="สิทธิ์และโควตาการใช้ทุน"
              icon={ShieldCheck}
              className="2xl:col-span-3"
            >
              <EligibilitySummary summary={quotaSummary} usageRows={quotaUsageViewRows} />
            </SimpleCard>
          </div>

          <Card
            title="คำร้องที่รอดำเนินการ"
            collapsible={false}
            className="2xl:col-span-3"
            action={
              pendingApplications.length > MAX_PENDING_DISPLAY && (
                <button
                  type="button"
                  onClick={() => onNavigate?.("applications-list")}
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  ดูทั้งหมด {formatNumber(pendingApplications.length)} รายการ
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )
            }
          >
            <PendingApplicationsList applications={pendingApplications} />
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
