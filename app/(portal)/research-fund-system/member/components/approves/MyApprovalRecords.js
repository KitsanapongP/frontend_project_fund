'use client';

import { RESEARCH_FUND_PAGE_ICONS } from '@/app/lib/research_fund_menu_presentation';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileText, Filter } from 'lucide-react';

import PageLayout from '../common/PageLayout';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import { useStatusMap } from '@/app/hooks/useStatusMap';
import { toast } from 'react-hot-toast';

import apiClient from '@/app/lib/api';
import { memberAPI } from '@/app/lib/member_api';
import { systemConfigAPI } from '@/app/lib/system_config_api';
import { systemAPI } from '@/app/lib/api';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const CHART_PALETTE = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#0f766e', '#15803d', '#64748b'];

const fmtTHB2 = (n) =>
  typeof n === 'number' && !Number.isNaN(n)
    ? n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '-';

const normalizeYear = (y) => {
  if (typeof y === 'number' || typeof y === 'string') {
    const num = Number(y);
    return { id: num, label: String(num) };
  }
  const id = Number(y.year_id ?? y.id ?? y.year);
  const label = String(y.year ?? y.year_th ?? y.name ?? id);
  return { id, label };
};

function asArray(maybe) {
  return Array.isArray(maybe) ? maybe : [];
}

function firstNonEmptyArray(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value;
  }
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function stripBudgetCodeText(text) {
  const safe = String(text ?? '').trim();
  if (!safe) return '';
  return safe.replace(/\s*งบ\s*#?\s*\d+\s*$/i, '').trim();
}

function stripBudgetCode(name) {
  const safe = String(name ?? '').trim();
  if (!safe) return '-';
  return safe.replace(/\s*งบ\s*#?\s*\d+\s*$/i, '').trim() || safe;
}

function buildBudgetLabel(source = {}) {
  const baseName = stripBudgetCodeText(
    source.subcategory_name || source.SubcategoryName || source.subcategory_budget_name || source.label || 'ทุนย่อย'
  );
  const rawCondition = stripBudgetCodeText(
    source.fund_description || source.FundDescription || source.fund_condition || source.subcategory_budget_label || ''
  );
  const name = String(baseName || '').trim();
  const condition = String(rawCondition || '').trim();
  if (condition && condition !== name) return `${name} ${condition}`.trim();
  return name || 'ทุนย่อย';
}

function groupRowsToCategories(rows) {
  const list = asArray(rows);
  const map = new Map();
  for (const r of list) {
    const categoryId = r.category_id ?? r.CategoryID ?? null;
    const categoryName = stripBudgetCode(r.category_name ?? r.CategoryName ?? r.category ?? '-');
    const catKey = `${categoryId}::${categoryName}`;
    if (!map.has(catKey)) {
      map.set(catKey, { categoryId, categoryName, items: [], total: 0 });
    }
    const label = buildBudgetLabel(r);
    const amount = Number(r.approved_amount ?? r.total_approved_amount ?? 0) || 0;
    const cat = map.get(catKey);
    cat.items.push({ label, amount });
    cat.total += amount;
  }
  return Array.from(map.values());
}

export default function MyApprovalRecords() {
  const { statuses } = useStatusMap();
  const approvedStatus = useMemo(
    () => statuses?.find((status) => status.status_code === 'approved'),
    [statuses]
  );

  const [years, setYears] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [yearId, setYearId] = useState(null);
  const [yearLabel, setYearLabel] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [chartType, setChartType] = useState('bar');
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadMeta() {
      setLoadingMeta(true);
      try {
        const [yearsRes, currentYearRes] = await Promise.all([
          systemAPI.getYears(),
          systemConfigAPI.getCurrentYear().catch(() => null),
        ]);
        const yearListRaw = Array.isArray(yearsRes) ? yearsRes : yearsRes?.years || yearsRes?.data || [];
        const yearList = yearListRaw.map(normalizeYear);
        if (!alive) return;
        setYears(yearList);

        const currentYearValue = currentYearRes?.current_year ?? currentYearRes?.data?.current_year ?? null;
        const defaultYear = yearList.find(
          (y) =>
            currentYearValue != null &&
            (String(y.label) === String(currentYearValue) || y.id === Number(currentYearValue))
        );
        if (!yearId && yearList.length) {
          const chosen = defaultYear ?? yearList[0];
          setYearId(chosen.id);
          setYearLabel(chosen.label);
        }
      } catch (err) {
        console.error(err);
        toast.error('โหลดปีงบประมาณไม่สำเร็จ');
      } finally {
        if (alive) setLoadingMeta(false);
      }
    }
    loadMeta();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!yearId) return;
    let alive = true;

    async function loadTotals() {
      setLoadingData(true);
      try {
        const res = await memberAPI.getMyApprovalTotals({
          year_id: yearId,
          year: Number(yearLabel) || undefined,
          sort: 'category_name',
          dir: 'ASC',
        });

        const payload = res?.data ?? res ?? {};
        const rows = firstNonEmptyArray(
          payload?.rows,
          payload?.data?.rows,
          payload?.records,
          payload?.data?.records,
          Array.isArray(payload) ? payload : null
        );

        if (!alive) return;
        setCategories(groupRowsToCategories(rows));
      } catch (err) {
        console.error(err);
        toast.error('โหลดข้อมูลอนุมัติไม่สำเร็จ');
        if (alive) setCategories([]);
      } finally {
        if (alive) setLoadingData(false);
      }
    }

    loadTotals();
    return () => {
      alive = false;
    };
  }, [yearId, yearLabel]);

  const filteredCategories = useMemo(() => {
    return categories
      .filter((cat) => categoryFilter === 'all' || String(cat.categoryId) === categoryFilter)
      .map((cat) => ({
        ...cat,
        items: (cat.items || []).filter((it) => budgetFilter === 'all' || it.label === budgetFilter),
      }))
      .filter((cat) => (cat.items || []).length > 0)
      .map((cat) => ({
        ...cat,
        total: (cat.items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      }));
  }, [categories, categoryFilter, budgetFilter]);

  const categoryOptions = useMemo(
    () => categories.map((cat) => ({ id: String(cat.categoryId), label: cat.categoryName })),
    [categories]
  );

  const budgetOptions = useMemo(() => {
    const labels = new Set();
    categories
      .filter((cat) => categoryFilter === 'all' || String(cat.categoryId) === categoryFilter)
      .forEach((cat) => {
        (cat.items || []).forEach((item) => {
          if (item?.label) labels.add(item.label);
        });
      });
    return Array.from(labels).sort((a, b) => a.localeCompare(b, 'th'));
  }, [categories, categoryFilter]);

  useEffect(() => {
    if (budgetFilter !== 'all' && !budgetOptions.includes(budgetFilter)) {
      setBudgetFilter('all');
    }
  }, [budgetFilter, budgetOptions]);

  const chartSeries = useMemo(
    () => [{ name: 'ยอดอนุมัติ', data: filteredCategories.map((cat) => Number(cat.total) || 0) }],
    [filteredCategories]
  );

  const donutSeries = useMemo(
    () => filteredCategories.map((cat) => Number(cat.total) || 0),
    [filteredCategories]
  );

  const categoryLabels = useMemo(
    () => filteredCategories.map((cat) => cat.categoryName),
    [filteredCategories]
  );

  const chartOptions = useMemo(
    () => ({
      chart: { toolbar: { show: false }, fontFamily: 'var(--font-ui)' },
      xaxis: { categories: categoryLabels },
      yaxis: { labels: { formatter: (value) => fmtTHB2(Number(value) || 0) } },
      dataLabels: { enabled: false },
      colors: CHART_PALETTE,
      tooltip: { y: { formatter: (value) => `${fmtTHB2(Number(value) || 0)} บาท` } },
      stroke: { curve: 'smooth', width: 0 },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: chartType === 'bar-horizontal',
          distributed: true,
        },
      },
      grid: { borderColor: '#e5e7eb' },
    }),
    [categoryLabels, chartType]
  );

  const donutOptions = useMemo(
    () => ({
      chart: { fontFamily: 'var(--font-ui)' },
      labels: categoryLabels,
      colors: CHART_PALETTE,
      legend: { position: 'bottom' },
      dataLabels: { formatter: (val) => `${val.toFixed(1)}%` },
      tooltip: { y: { formatter: (value) => `${fmtTHB2(Number(value) || 0)} บาท` } },
    }),
    [categoryLabels]
  );

  const grandTotal = useMemo(
    () => filteredCategories.reduce((sum, cat) => sum + (Number(cat.total) || 0), 0),
    [filteredCategories]
  );

  const currentUser = apiClient.getUser?.() || {};
  const currentUserName = `${currentUser.prefix ? `${currentUser.prefix} ` : ''}${currentUser.user_fname || ''} ${currentUser.user_lname || ''}`.trim() || 'ของฉัน';

  return (
    <PageLayout
      title="บันทึกข้อมูลการอนุมัติทุน"
      subtitle="รวมรายการคำร้องที่ได้รับการอนุมัติแล้ว (เฉพาะของตนเอง)"
      icon={RESEARCH_FUND_PAGE_ICONS.approvalRecords}
      breadcrumbs={[
        { label: 'หน้าแรก', href: '/research-fund-system/member' },
        { label: 'บันทึกข้อมูลการอนุมัติทุน' },
      ]}
    >
      <div className="mb-6">
        <Card title="ตัวกรอง" icon={Filter} collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">ปีงบประมาณ (พ.ศ.)</label>
              <select
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={yearId ?? ''}
                disabled={loadingMeta || !years.length}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const found = years.find((y) => y.id === id);
                  setYearId(id);
                  setYearLabel(found?.label ?? '');
                }}
              >
                {years.length === 0 ? (
                  <option value="">{loadingMeta ? 'กำลังโหลด…' : '— ไม่มีข้อมูล —'}</option>
                ) : (
                  years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">หมวดทุน</label>
              <select
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setBudgetFilter('all');
                }}
                disabled={loadingData || !categoryOptions.length}
              >
                <option value="all">ทุกหมวดทุน</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">ชื่อทุน</label>
              <select
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                disabled={loadingData || !budgetOptions.length}
              >
                <option value="all">ทุกทุนย่อย/งบประมาณ</option>
                {budgetOptions.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Card
        icon={FileText}
        collapsible={false}
        title={
          <div className="flex items-center gap-3">
            <span>ผลการอนุมัติทุน</span>
            <StatusBadge
              statusId={approvedStatus?.application_status_id}
              fallbackLabel={approvedStatus?.status_name || 'อนุมัติ'}
            />
          </div>
        }
        headerClassName="items-center"
      >
        {loadingData ? (
          <div className="py-16 text-center text-sm text-slate-500">กำลังโหลดข้อมูล…</div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">ไม่พบบันทึกการอนุมัติ</div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-700">กราฟเปรียบเทียบยอดอนุมัติรายหมวด</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'bar', label: 'แท่งแนวตั้ง' },
                    { id: 'bar-horizontal', label: 'แท่งแนวนอน' },
                    { id: 'donut', label: 'โดนัท' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setChartType(item.id)}
                      className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${chartType === item.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-blue-700 hover:border-blue-200 hover:bg-blue-50'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {chartType === 'donut' ? (
                <ApexChart type="donut" height={320} series={donutSeries} options={donutOptions} />
              ) : (
                <ApexChart
                  type="bar"
                  height={300}
                  series={chartSeries}
                  options={chartOptions}
                />
              )}
            </div>

            {filteredCategories.map((cat) => (
              <div key={cat.categoryId ?? cat.categoryName} className="space-y-3">
                <div className="font-bold">{cat.categoryName}</div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[36rem]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">ชื่อทุน</th>
                        <th className="w-48 px-4 py-3 text-right text-sm font-medium text-slate-700">จำนวนเงิน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {cat.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-sm">{it.label}</td>
                          <td className="px-4 py-3 text-right text-sm tabular-nums">{fmtTHB2(it.amount)}฿</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    <span className="text-slate-600">รวมหมวด:</span>
                    <span className="ml-2 font-semibold tabular-nums text-slate-900">{fmtTHB2(cat.total)}฿</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="text-base md:text-lg text-slate-700">
            ยอดเงินที่อาจารย์ <span className="font-semibold text-slate-900">{currentUserName}</span> ได้รับอนุมัติให้เบิกในปีงบประมาณ{' '}
            <span className="font-semibold text-slate-900">{yearLabel || '—'}</span>
          </div>
          <div className="text-right">
            <div className="text-sm md:text-base text-slate-500">รวมทั้งสิ้น</div>
            <div className="text-3xl font-semibold tabular-nums text-blue-700 md:text-4xl">{fmtTHB2(grandTotal)}฿</div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
