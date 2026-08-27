"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import { formatCurrency, formatNumber } from "@/app/utils/format";

function parseNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function parseInteger(value) {
  const numeric = parseNumber(value);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
}

function buildQuotaEntries(summary = [], usageRows = []) {
  const entries = new Map();

  const normalize = (item) => {
    if (!item) return null;

    const yearId = parseInteger(item.year_id ?? item.yearId);
    const subcategoryId = parseInteger(item.subcategory_id ?? item.subcategoryId);
    const userId = parseInteger(item.user_id ?? item.userId);

    const categoryName = item.category_name ?? item.categoryName ?? "-";
    const subcategoryName = item.subcategory_name ?? item.subcategoryName ?? "-";
    const userName = item.user_name ?? item.userName ?? "-";

    const allocatedAmount = parseNumber(item.allocated_amount ?? item.allocatedAmount ?? item.max_amount_per_year ?? 0);
    const usedAmount = parseNumber(item.used_amount ?? item.usedAmount);
    const remainingBudgetRaw = item.remaining_budget ?? item.remainingBudget;
    const remainingBudget = remainingBudgetRaw !== undefined
      ? parseNumber(remainingBudgetRaw)
      : allocatedAmount - usedAmount;

    const maxGrants = parseNumber(item.max_grants ?? item.maxGrants);
    const usedGrants = parseNumber(item.used_grants ?? item.usedGrants);
    const remainingGrantsRaw = item.remaining_grants ?? item.remainingGrants;
    const remainingGrants = remainingGrantsRaw !== undefined
      ? parseNumber(remainingGrantsRaw)
      : Math.max(maxGrants - usedGrants, 0);

    const usagePercent = allocatedAmount > 0
      ? Math.min((usedAmount / allocatedAmount) * 100, 999)
      : 0;

    const keyParts = [yearId || "all", subcategoryId || subcategoryName || "-", userId || userName || "-"];

    return {
      key: keyParts.join(":"),
      yearId,
      subcategoryId,
      userId,
      categoryName,
      subcategoryName,
      userName,
      allocatedAmount,
      usedAmount,
      remainingBudget: remainingBudget < 0 ? 0 : remainingBudget,
      maxGrants,
      usedGrants,
      remainingGrants,
      usagePercent,
    };
  };

  const usageList = Array.isArray(usageRows) ? usageRows : [];
  usageList.forEach((item) => {
    const normalized = normalize(item);
    if (normalized) {
      entries.set(normalized.key, normalized);
    }
  });

  const summaryList = Array.isArray(summary) ? summary : [];
  summaryList.forEach((item) => {
    const normalized = normalize(item);
    if (!normalized) return;

    const existing = entries.get(normalized.key);
    if (existing) {
      entries.set(normalized.key, {
        ...existing,
        ...normalized,
        usedGrants: Math.max(existing.usedGrants, normalized.usedGrants),
        usedAmount: Math.max(existing.usedAmount, normalized.usedAmount),
        remainingGrants: Math.min(existing.remainingGrants, normalized.remainingGrants),
        remainingBudget: Math.min(existing.remainingBudget, normalized.remainingBudget),
      });
    } else {
      entries.set(normalized.key, normalized);
    }
  });

  return Array.from(entries.values());
}

function buildUserGroups(entries = []) {
  const groups = new Map();

  entries.forEach((entry) => {
    const key = entry.userId || entry.userName;
    if (!key) return;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        userId: entry.userId,
        userName: entry.userName,
        rows: [],
      });
    }

    const group = groups.get(key);
    group.rows.push(entry);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    rows: group.rows.sort((a, b) => b.usedAmount - a.usedAmount),
  }));
}

export default function EligibilitySummary({ summary = [], usageRows = [] }) {
  const normalized = useMemo(
    () => buildQuotaEntries(summary, usageRows).sort((a, b) => b.usedAmount - a.usedAmount),
    [summary, usageRows]
  );

  const userGroups = useMemo(
    () =>
      buildUserGroups(normalized).sort((a, b) => {
        const aName = a.userName || "";
        const bName = b.userName || "";
        return aName.localeCompare(bName, "th");
      }),
    [normalized]
  );

  const [query, setQuery] = useState("");
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());

  const handleToggle = useCallback((key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return userGroups;
    return userGroups.filter((group) =>
      (group.userName || "").toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, userGroups]);

  if (!userGroups.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        ยังไม่มีข้อมูลการใช้งานสิทธิ์ในปีนี้
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <label htmlFor="dashboard-eligibility-search" className="sr-only">ค้นหาชื่อผู้ใช้</label>
          <input
            id="dashboard-eligibility-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้..."
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <p className="text-sm text-slate-500" aria-live="polite">
          พบ {formatNumber(filteredGroups.length)} ผู้ใช้
        </p>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 py-8 text-center text-sm text-slate-500">
          ไม่พบผู้ใช้ที่ตรงกับคำค้นหา
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {filteredGroups.map((group) => {
            const isExpanded = expandedKeys.has(group.key);

            return (
              <div
                key={group.key}
                className="overflow-hidden py-1 first:pt-0 last:pb-0"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(group.key)}
                  className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-expanded={isExpanded}
                  aria-controls={`${group.key}-details`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{group.userName}</p>
                      <p className="text-xs text-slate-500">ใช้สิทธิ์ {formatNumber(group.rows.length)} ทุน</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {isExpanded ? "ย่อรายละเอียด" : "ขยายรายละเอียด"}
                  </div>
                </button>

                {isExpanded && (
                  <div
                    id={`${group.key}-details`}
                    className="rounded-lg bg-slate-50 px-3 py-4"
                  >
                    <div className="divide-y divide-slate-200">
                      {group.rows.map((row) => {
                        const grantLabel = row.maxGrants > 0
                          ? `${formatNumber(row.usedGrants)} / ${formatNumber(row.maxGrants)}`
                          : formatNumber(row.usedGrants);

                        return (
                          <div
                            key={row.key}
                            className="py-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{row.subcategoryName}</p>
                                <p className="text-xs text-slate-500">{row.categoryName}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm sm:flex sm:items-center sm:gap-6">
                                <div>
                                  <p className="font-semibold tabular-nums text-blue-700">{grantLabel}</p>
                                  <p className="text-xs text-slate-500">ใช้สิทธิ์</p>
                                </div>
                                <div>
                                  <p className="font-semibold tabular-nums text-slate-900">{formatCurrency(row.allocatedAmount)}</p>
                                  <p className="text-xs text-slate-500">สิทธิ์รวม</p>
                                </div>
                                <div>
                                  <p className="font-semibold tabular-nums text-blue-700">{formatCurrency(row.usedAmount)}</p>
                                  <p className="text-xs text-slate-500">งบที่ใช้ไป</p>
                                </div>
                                <div>
                                  <p className="font-semibold tabular-nums text-slate-700">{formatCurrency(row.remainingBudget)}</p>
                                  <p className="text-xs text-slate-500">งบคงเหลือ</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
