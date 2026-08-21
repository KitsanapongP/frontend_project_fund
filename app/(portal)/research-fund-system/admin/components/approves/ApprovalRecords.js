// app/admin/components/approves/ApprovalRecords.js
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { FileCheck, FileText, Filter } from 'lucide-react';

import PageLayout from '../common/PageLayout';
import Card from '../common/Card';
import StatusBadge from '@/app/(portal)/research-fund-system/admin/components/common/StatusBadge';
import { useStatusMap } from '@/app/hooks/useStatusMap';
import { toast } from 'react-hot-toast';

import adminAPI from '@/app/lib/admin_api';
import apiClient from '@/app/lib/api';
import { systemConfigAPI } from '@/app/lib/system_config_api';

// =========================
// Helpers
// =========================
const fmtTHB0 = (n) =>
  typeof n === 'number' && !Number.isNaN(n)
    ? n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '-';

const ApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });
const CHART_PALETTE = ['#2563eb', '#16a34a', '#f59e0b', '#db2777', '#0d9488', '#7c3aed', '#ea580c', '#0891b2'];

const NORMALIZED_PREFIX_MAP = {
  'อาจารย์': 'อ.',
  'อ.': 'อ.',
  'ผศ': 'ผศ.',
  'ผศ.': 'ผศ.',
  'ผู้ช่วยศาสตราจารย์': 'ผศ.',
  'รศ': 'รศ.',
  'รศ.': 'รศ.',
  'รองศาสตราจารย์': 'รศ.',
  'ศ': 'ศ.',
  'ศ.': 'ศ.',
  'ศาสตราจารย์': 'ศ.',
  'ดร': 'ดร.',
  'ดร.': 'ดร.',
  'ผศ.ดร': 'ผศ.ดร.',
  'ผศ.ดร.': 'ผศ.ดร.',
  'รศ.ดร': 'รศ.ดร.',
  'รศ.ดร.': 'รศ.ดร.',
  'ศ.ดร': 'ศ.ดร.',
  'ศ.ดร.': 'ศ.ดร.',
};

const normalizeAcademicPrefix = (raw) => {
  const normalized = String(raw || '').trim().replace(/\s+/g, '');
  if (!normalized) return '';
  return NORMALIZED_PREFIX_MAP[normalized] || String(raw || '').trim().replace(/\s+/g, ' ');
};

const normalizeYear = (y) => {
  if (typeof y === 'number' || typeof y === 'string') {
    const num = Number(y);
    return { id: num, label: String(num) };
  }
  const id = Number(y.year_id ?? y.id ?? y.year);
  const label = String(y.year ?? y.year_th ?? y.name ?? id);
  return { id, label };
};

const normalizeUser = (u) => {
  const id = u.user_id ?? u.id ?? u.uid ?? null;
  const prefix = normalizeAcademicPrefix(u.prefix ?? u.user_prefix ?? u.title);
  const fname = u.user_fname ?? u.first_name ?? '';
  const lname = u.user_lname ?? u.last_name ?? '';
  const baseName = (u.name ?? `${fname} ${lname}`)?.trim();
  const name = `${prefix ? `${prefix} ` : ''}${baseName}`.trim();
  const roleId = Number(u.role_id ?? u.role?.id ?? u.roleId ?? 0);
  return {
    user_id: id != null ? Number(id) : null,
    display_name: name || (u.email ? String(u.email) : `ผู้ใช้ #${id}`),
    role_id: roleId,
    delete_at: u.delete_at ?? null,
  };
};

// คืนค่าเป็นอาร์เรย์ถ้าเป็นไปได้ มิฉะนั้น []
function asArray(maybe) {
  if (Array.isArray(maybe)) return maybe;
  return [];
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

// ประกอบชื่อ "ทุนย่อย" + "เงื่อนไขย่อย" ตามรูปแบบใหม่
function buildBudgetLabel(source = {}) {
  const baseName = stripBudgetCodeText(
    source.subcategory_name ||
      source.SubcategoryName ||
      source.subcategory_budget_name ||
      source.SubcategoryBudgetName ||
      source.label ||
      source.name ||
      source.budget_name ||
      'ทุนย่อย'
  );

  const rawCondition = stripBudgetCodeText(
    source.fund_description ||
      source.FundDescription ||
      source.fund_condition ||
      source.subcategory_budget_label ||
      source.SubcategoryBudgetLabel ||
      ''
  );

  const name = String(baseName || '').trim();
  const condition = String(rawCondition || '').trim();

  if (condition && condition !== name) {
    return `${name} ${condition}`.trim();
  }
  return name || 'ทุนย่อย';
}

// ลบข้อความ "งบ #xxx" ที่ต่อท้ายหมวดทุน
function stripBudgetCode(name) {
  const safe = String(name ?? '').trim();
  if (!safe) return '-';
  return safe.replace(/\s*งบ\s*#?\s*\d+\s*$/i, '').trim() || safe;
}

// เวอร์ชันไม่คืนค่า '-' สำหรับกรณีข้อความว่าง ใช้ทำความสะอาด label
function stripBudgetCodeText(text) {
  const safe = String(text ?? '').trim();
  if (!safe) return '';
  return safe.replace(/\s*งบ\s*#?\s*\d+\s*$/i, '').trim();
}

// แปลง rows ดิบ → โครงหมวดหมู่
function groupRowsToCategories(rows) {
  const list = asArray(rows);
  if (list.length === 0) return [];

  const map = new Map();
  for (const r of list) {
    const categoryId = r.category_id ?? r.CategoryID ?? r.categoryId ?? null;
    const categoryName = stripBudgetCode(
      r.category_name ?? r.CategoryName ?? r.category ?? '-'
    );
    const catKey = `${categoryId}::${categoryName}`;

    if (!map.has(catKey)) {
      map.set(catKey, {
        categoryId,
        categoryName,
        items: [],
        total: 0,
      });
    }

    const label = buildBudgetLabel({
      subcategory_name: r.subcategory_name ?? r.SubcategoryName,
      fund_description: r.fund_description ?? r.FundDescription,
      fund_condition: r.fund_condition ?? r.FundCondition,
      subcategory_budget_label: r.subcategory_budget_label ?? r.SubcategoryBudgetLabel,
      subcategory_budget_name: r.subcategory_budget_name ?? r.SubcategoryBudgetName,
      label: r.label ?? r.Label,
      name: r.name ?? r.Name,
      budget_name: r.budget_name ?? r.BudgetName,
    });

    const amount = Number(
      r.approved_amount ??
        r.total_approved_amount ??
        r.TotalApprovedAmount ??
        r.amount ??
        0
    ) || 0;

    const cat = map.get(catKey);
    cat.items.push({ label, amount });
    cat.total += amount;
  }
  return Array.from(map.values());
}

// =========================
export default function ApprovalRecords() {
  const { statuses } = useStatusMap();
  const approvedStatus = useMemo(
    () => statuses?.find((status) => status.status_code === 'approved'),
    [statuses]
  );

  // meta
  const [years, setYears] = useState([]);     // [{id,label}]
  const [users, setUsers] = useState([]);     // normalized users
  const [loadingMeta, setLoadingMeta] = useState(true);

  // filters
  const [yearId, setYearId] = useState(null);
  const [yearLabel, setYearLabel] = useState('');
  const [userId, setUserId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [chartType, setChartType] = useState('bar');

  // data
  const [categories, setCategories] = useState([]); // [{categoryId,categoryName,items:[{label,amount}], total}]
  const [loadingData, setLoadingData] = useState(false);

  // ---------- Load years & users ----------
  useEffect(() => {
    let alive = true;

    async function loadMeta() {
      setLoadingMeta(true);
      try {
        const [yearsRes, currentYearRes, usersRes] = await Promise.all([
          adminAPI.getYears(), // GET /admin/years
          systemConfigAPI.getCurrentYear().catch((err) => {
            console.error('โหลด current year ไม่สำเร็จ', err);
            return null;
          }),
          apiClient.get('/users', { page_size: 1000 }), // GET /users
        ]);

        const yearListRaw = Array.isArray(yearsRes) ? yearsRes : yearsRes?.years || yearsRes?.data || [];
        const userListRaw = Array.isArray(usersRes) ? usersRes : usersRes?.users || usersRes?.data || [];

        const yearList = yearListRaw.map(normalizeYear);
        const allUsers = userListRaw.map(normalizeUser);

        // แสดงทุกคน ยกเว้น admin (role_id=3) และไม่เอาที่ soft-delete
        const visibleUsers = allUsers
          .filter((u) => u.user_id != null)
          .filter((u) => u.role_id !== 3)
          .filter((u) => !u.delete_at)
          .sort((a, b) => (a.display_name || '').localeCompare(b.display_name || '', 'th'));

        if (!alive) return;

        setYears(yearList);
        setUsers(visibleUsers);

        const currentYearValue =
          currentYearRes?.current_year ?? currentYearRes?.data?.current_year ?? null;
        const defaultYear = yearList.find(
          (y) =>
            (currentYearValue != null &&
              (String(y.label) === String(currentYearValue) || y.id === Number(currentYearValue))) ||
            false
        );

        // defaults
        if (!yearId && yearList.length) {
          const chosen = defaultYear ?? yearList[0];
          setYearId(chosen.id);
          setYearLabel(chosen.label);
        }
        if (!userId && visibleUsers.length) {
          setUserId(visibleUsers[0].user_id);
        }
      } catch (err) {
        console.error(err);
        toast.error('โหลดปี/ผู้ใช้ไม่สำเร็จ');
      } finally {
        if (alive) setLoadingMeta(false);
      }
    }

    loadMeta();
    return () => { alive = false; };
  }, []); // load once

  // ---------- Load totals on filters change ----------
  useEffect(() => {
    if (!userId || !yearId) return;

    let alive = true;

    async function loadTotals() {
      setLoadingData(true);
      try {
        const params = {
          user_id: userId,
          teacher_id: userId,   // เผื่อฝั่ง BE ใช้ key นี้
          year_id: yearId,
          year: Number(yearLabel) || undefined, // เผื่อฝั่ง BE รับเป็นปี พ.ศ.
          sort: 'category_name',
          dir: 'ASC',
        };

        const res = await adminAPI.getApprovalTotals(params); // /admin/approval-records/totals

        // ----- คลาย payload ให้รองรับหลายรูปแบบ -----
        const payload = res?.data ?? res ?? {};
        let cats = [];

        // (A) categories พร้อมใช้
        const catsA = payload?.categories ?? payload?.data?.categories;
        if (Array.isArray(catsA)) {
          cats = catsA.map((c) => ({
            categoryId: c.categoryId ?? c.category_id ?? null,
            categoryName: stripBudgetCode(
              c.categoryName ?? c.category_name ?? '-'
            ),
            items: asArray(c.items).map((it) => ({
              label: buildBudgetLabel({
                subcategory_name: it.subcategory_name ?? it.SubcategoryName,
                fund_description: it.fund_description ?? it.FundDescription,
                fund_condition: it.fund_condition ?? it.FundCondition,
                subcategory_budget_label: it.subcategory_budget_label ?? it.SubcategoryBudgetLabel,
                subcategory_budget_name: it.subcategory_budget_name ?? it.SubcategoryBudgetName,
                label: it.label ?? it.Label,
                name: it.name ?? it.Name,
                budget_name: it.budget_name ?? it.BudgetName,
              }),
              amount: Number(it.amount ?? it.total ?? 0) || 0,
            })),
            total:
              Number(c.total ?? 0) ||
              asArray(c.items).reduce((s, it) => s + (Number(it.amount) || 0), 0),
          }));
        } else {
          // (B) ไม่มี categories → ลองหาชุด rows
          const rowsCandidate = firstNonEmptyArray(
            payload?.rows,
            payload?.data?.rows,
            payload?.records,
            payload?.data?.records,
            Array.isArray(payload) ? payload : null,
            payload?.data
          );

          cats = groupRowsToCategories(rowsCandidate);
        }

        if (!alive) return;
        setCategories(cats);
      } catch (e) {
        console.error(e);
        toast.error('โหลดข้อมูลสรุปอนุมัติไม่สำเร็จ');
        setCategories([]);
      } finally {
        if (alive) setLoadingData(false);
      }
    }

    loadTotals();
    return () => { alive = false; };
  }, [userId, yearId, yearLabel]);

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
      yaxis: { labels: { formatter: (value) => fmtTHB0(Number(value) || 0) } },
      dataLabels: { enabled: false },
      colors: CHART_PALETTE,
      tooltip: { y: { formatter: (value) => `${fmtTHB0(Number(value) || 0)} บาท` } },
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
      tooltip: { y: { formatter: (value) => `${fmtTHB0(Number(value) || 0)} บาท` } },
    }),
    [categoryLabels]
  );

  const grandTotal = useMemo(
    () => filteredCategories.reduce((s, c) => s + (Number(c.total) || 0), 0),
    [filteredCategories]
  );

  const selectedUser = users.find((u) => String(u.user_id) === String(userId));

  return (
    <PageLayout
      title="บันทึกข้อมูลการอนุมัติทุน"
      subtitle="รวมรายการคำร้องที่ได้รับการอนุมัติแล้ว"
      icon={FileCheck}
      breadcrumbs={[
        { label: 'หน้าแรก', href: '/research-fund-system/admin' },
        { label: 'บันทึกข้อมูลการอนุมัติทุน' },
      ]}
    >
      {/* ตัวกรอง */}
      <div className="mb-6">
        <Card title="ตัวกรอง (Filters)" icon={Filter} collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* ผู้ใช้ (ยกเว้น Admin) */}
            <div className="space-y-2">
              <label className="block text-ml font-medium text-gray-700">ผู้ใช้</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-ml"
                value={userId ?? ''}
                disabled={loadingMeta || !users.length}
                onChange={(e) => setUserId(Number(e.target.value))}
              >
                {users.length === 0 ? (
                  <option value="">{loadingMeta ? 'กำลังโหลด…' : '— ไม่มีข้อมูล —'}</option>
                ) : (
                  users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.display_name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* ปีงบประมาณ (พ.ศ.) */}
            <div className="space-y-2">
              <label className="block text-ml font-medium text-gray-700">ปีงบประมาณ (พ.ศ.)</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-ml"
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
              <label className="block text-ml font-medium text-gray-700">หมวดทุน</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-ml"
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
              <label className="block text-ml font-medium text-gray-700">ชื่อทุน</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-ml"
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

      {/* ผลการอนุมัติ */}
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
        {/* ตารางตามหมวดทุน */}
        {loadingData ? (
          <div className="py-16 text-center text-sm text-gray-500">กำลังโหลดข้อมูล…</div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">ไม่พบบันทึกการอนุมัติ</div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-gray-700">กราฟเปรียบเทียบยอดอนุมัติรายหมวด</div>
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
                      className={`rounded-md border px-3 py-1 text-xs ${chartType === item.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700'}`}
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
                <div className="overflow-hidden rounded-md border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-ml font-medium text-gray-700">ชื่อทุน</th>
                        <th className="px-4 py-3 text-right text-ml font-medium text-gray-700 w-48">จำนวนเงิน (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {cat.items?.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 text-ml">{it.label}</td>
                          <td className="px-4 py-3 text-ml text-right">
                            {typeof it.amount === 'number' ? fmtTHB0(it.amount) : <span className="text-gray-400 italic">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* รวมต่อหมวด */}
                <div className="flex justify-end">
                  <div className="bg-gray-50 rounded px-4 py-2 text-ml">
                    <span className="text-gray-600">รวมหมวด:</span>
                    <span className="ml-2 font-medium">
                      {fmtTHB0(cat.items?.reduce((s, it) => s + (Number(it.amount) || 0), 0))} บาท
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* สรุปผลรวม (อยู่ล่างสุดของการ์ด) */}
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-base md:text-lg text-gray-700">
            ยอดเงินที่อาจารย์{' '}
            <span className="font-semibold text-gray-900">
              {selectedUser?.display_name || '—'}
            </span>{' '}
            ได้รับอนุมัติให้เบิกในปีงบประมาณ{' '}
            <span className="font-semibold text-gray-900">{yearLabel || '—'}</span>
          </div>
          <div className="text-right">
            <div className="text-sm md:text-base text-gray-500">รวมทั้งสิ้น</div>
            <div className="text-3xl md:text-4xl font-extrabold">
              {fmtTHB0(grandTotal)} บาท
            </div>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
