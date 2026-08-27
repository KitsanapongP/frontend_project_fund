"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  RefreshCcw,
  CalendarDays,
  BarChart3,
  FileText,
  Clock3,
  CircleCheck,
} from "lucide-react";

import PageLayout from "../common/PageLayout";
import Card from "../common/Card";
import SimpleCard from "../common/SimpleCard";
import StatCard from "./StatCard";
import MonthlyChart from "./MonthlyChart";
import BudgetSummary from "./BudgetSummary";
import RecentApplications from "./RecentApplications";
import { dashboardAPI, apiClient } from "../../../../../lib/api";
import {
  formatCurrency,
  formatNumber,
  formatThaiDateFromBEString,
  formatThaiMonthShort,
} from "@/app/utils/format";

const normalizeDashboardStats = (apiStats = {}) => {
  const myApplications = apiStats?.my_applications ?? {};
  const budgetSummary = apiStats?.budget_summary ?? {};
  const budgetUsage = apiStats?.budget_usage ?? {};
  const monthlyStats = Array.isArray(apiStats?.monthly_stats)
    ? apiStats.monthly_stats
    : [];
  const recentApplications = Array.isArray(apiStats?.recent_applications)
    ? apiStats.recent_applications
    : [];

  const normalizedMonthly = monthlyStats.map((item) => ({
    month: formatThaiMonthShort(item?.month ?? ""),
    applications: Number(item?.applications ?? item?.total_applications ?? 0),
    approved: Number(item?.approved ?? 0),
  }));

  return {
    myApplications: {
      total: Number(myApplications?.total ?? 0),
      pending: Number(myApplications?.pending ?? 0),
      approved: Number(myApplications?.approved ?? 0),
      rejected: Number(myApplications?.rejected ?? 0),
      revision: Number(myApplications?.revision ?? 0),
      draft: Number(myApplications?.draft ?? 0),
      total_requested: Number(myApplications?.total_amount ?? myApplications?.total_requested ?? 0),
      total_approved: Number(myApplications?.approved_amount ?? myApplications?.total_approved ?? 0),
    },
    budgetUsed: {
      total: Number(budgetSummary?.total_requested ?? 0),
      thisYear: Number(budgetSummary?.total_approved ?? 0),
      remaining: Number(budgetSummary?.remaining ?? budgetUsage?.remaining_budget ?? 0),
    },
    monthlyStats: normalizedMonthly,
    recentApplications: recentApplications.map((item) => ({
      application_id: item?.submission_id ?? item?.application_id,
      application_number: item?.submission_number ?? item?.application_number,
      project_title: item?.title ?? item?.project_title,
      requested_amount: Number(item?.amount ?? item?.requested_amount ?? 0),
      subcategory_name: item?.subcategory_name ?? item?.category_name ?? "-",
      status_id: item?.status_id ?? item?.application_status_id ?? item?.status,
      status: item?.status_name ?? item?.status,
      submitted_at: item?.submitted_at ?? item?.created_at ?? null,
    })),
    budgetUsage: {
      yearBudget: Number(budgetUsage?.year_budget ?? 0),
      usedBudget: Number(budgetUsage?.used_budget ?? 0),
      remainingBudget: Number(budgetUsage?.remaining_budget ?? 0),
    },
    currentDate: apiStats?.current_date ?? null,
  };
};

function WelcomeBanner({ user, stats }) {
  const firstName = user?.user_fname ?? "";
  const lastName = user?.user_lname ?? "";
  const position = user?.position ?? "";
  const totalApplications = formatNumber(stats?.myApplications?.total ?? 0);
  const pending = formatNumber(stats?.myApplications?.pending ?? 0);
  const approvedAmount = formatCurrency(stats?.myApplications?.total_approved ?? 0);

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">ภาพรวมบัญชีของคุณ</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            สวัสดี{position ? ` ${position}` : ""} {firstName} {lastName}
          </h2>
          <p className="mt-1 text-sm text-slate-600">ติดตามคำร้องและงบประมาณล่าสุดได้จากหน้านี้</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[34rem]">
          {[
            { label: "คำร้องทั้งหมด", value: totalApplications, icon: FileText, iconClass: "bg-blue-50 text-blue-700" },
            { label: "รอดำเนินการ", value: pending, icon: Clock3, iconClass: "bg-amber-50 text-amber-700" },
            { label: "ยอดอนุมัติ", value: approvedAmount, icon: CircleCheck, iconClass: "bg-green-50 text-green-700" },
          ].map(({ label, value, icon: Icon, iconClass }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm text-slate-600">{label}</p>
              </div>
              <p className="mt-3 text-xl font-semibold tabular-nums text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BudgetUsageHighlights({ usage }) {
  const total = Number(usage?.yearBudget ?? 0);
  const used = Number(usage?.usedBudget ?? 0);
  const remaining = Math.max(Number(usage?.remainingBudget ?? total - used), 0);
  const usedPercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;

  const items = [
    { label: "งบประมาณประจำปี", value: formatCurrency(total), accent: "text-slate-900" },
    { label: "ใช้ไปแล้ว", value: formatCurrency(used), accent: "text-blue-600" },
    { label: "คงเหลือ", value: formatCurrency(remaining), accent: "text-emerald-600" },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{item.label}</span>
          <span className={`font-semibold ${item.accent}`}>{item.value}</span>
        </div>
      ))}

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>การใช้จ่าย</span>
          <span>{usedPercent.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-blue-600"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
      <p className="font-semibold mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูลแดชบอร์ด</p>
      <p className="text-sm mb-4">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
      >
        <RefreshCcw className="w-4 h-4" />
        ลองอีกครั้ง
      </button>
    </div>
  );
}

export default function DashboardContent({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboard = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await dashboardAPI.getStats();
      const payload = response?.stats || response;
      setStats(normalizeDashboardStats(payload || {}));
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err?.message || "ไม่สามารถโหลดข้อมูลได้ในขณะนี้");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setUser(apiClient.getUser());
  }, []);

  const currentDateLabel = stats?.currentDate
    ? formatThaiDateFromBEString(stats.currentDate)
    : null;

  const handleRefresh = () => loadDashboard({ silent: true });

  return (
    <PageLayout
      title="แดชบอร์ดของฉัน"
      subtitle="ติดตามสถานะคำร้องและการใช้งบประมาณส่วนบุคคล"
      icon={LayoutDashboard}
      loading={loading}
      actions={(
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate?.("applications")}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            จัดการคำร้องของฉัน
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}
          </button>
        </div>
      )}
    >
      {error ? (
        <ErrorState message={error} onRetry={handleRefresh} />
      ) : stats ? (
        <div className="space-y-6">
          <WelcomeBanner user={user} stats={stats} />

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>
                อัปเดตล่าสุด: {currentDateLabel || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span>ข้อมูลสถิติคำนวณจากคำร้องและงบประมาณในระบบ</span>
            </div>
          </div>

          <StatCard stats={stats} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <SimpleCard title="แนวโน้มการยื่นคำร้อง" icon={TrendingUp}>
              <MonthlyChart data={stats.monthlyStats} />
            </SimpleCard>

            <SimpleCard title="สรุปงบประมาณของฉัน">
              <BudgetSummary budget={stats.budgetUsed} />
            </SimpleCard>

            <SimpleCard title="สถานะการใช้งบประมาณ" icon={CalendarDays}>
              <BudgetUsageHighlights usage={stats.budgetUsage} />
            </SimpleCard>
          </div>

          <Card
            title="คำร้องล่าสุดของฉัน"
            action={
              <button
                type="button"
                onClick={() => onNavigate?.("applications")}
                className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ดูทั้งหมด →
              </button>
            }
          >
            <RecentApplications applications={stats.recentApplications} />
          </Card>
        </div>
      ) : null}
    </PageLayout>
  );
}
