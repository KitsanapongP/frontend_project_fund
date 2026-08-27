"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { adminAPI } from "../../../../../lib/admin_api";

const normalizeId = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const normalizeCategory = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const id =
    raw.category_id ??
    raw.id ??
    raw.CategoryID ??
    raw.CategoryId ??
    raw.categoryId ??
    raw.categoryID;
  const normalizedId = normalizeId(id);
  if (!normalizedId) return null;
  const name =
    raw.category_name ??
    raw.name ??
    raw.CategoryName ??
    raw.label ??
    raw.Category ??
    "";
  return {
    ...raw,
    category_id: normalizedId,
    category_name: name || `หมวดทุน ${normalizedId}`,
  };
};

const normalizeSubcategory = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  const id =
    raw.subcategory_id ??
    raw.id ??
    raw.SubcategoryID ??
    raw.SubcategoryId ??
    raw.subcategoryId ??
    raw.subcategoryID;
  const normalizedId = normalizeId(id);
  if (!normalizedId) return null;
  const name =
    raw.subcategory_name ??
    raw.name ??
    raw.SubcategoryName ??
    raw.label ??
    raw.Subcategory ??
    "";
  return {
    ...raw,
    subcategory_id: normalizedId,
    subcategory_name: name || `ประเภททุน ${normalizedId}`,
  };
};

const dedupeOptions = (items, normalize, key) => {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  const result = [];

  items.forEach((raw) => {
    const normalized = normalize(raw);
    if (!normalized) return;
    const id = normalized[key];
    if (!id || seen.has(id)) return;
    seen.add(id);
    result.push(normalized);
  });

  return result;
};

export default function SubmissionExportModal({
  open,
  onClose,
  onConfirm,
  initialFilters,
  selectedYear,
  selectedYearLabel,
  statuses = [],
  statusLoading = false,
  isExporting = false,
}) {
  const [localFilters, setLocalFilters] = useState(() => initialFilters);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalFilters(initialFilters);
    }
  }, [open, initialFilters]);

  useEffect(() => {
    if (!open) return;
    if (!selectedYear) {
      setCategories([]);
      setSubcategories([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoadingCategories(true);
      try {
        const response = await adminAPI.getCategories(selectedYear);
        if (cancelled) return;
        if (Array.isArray(response)) {
          setCategories(dedupeOptions(response, normalizeCategory, "category_id"));
        } else if (response?.categories) {
          setCategories(dedupeOptions(response.categories, normalizeCategory, "category_id"));
        } else {
          setCategories([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load categories for export modal", error);
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [open, selectedYear]);

  useEffect(() => {
    if (!open) return;
    if (!localFilters.category) {
      setSubcategories([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoadingSubcategories(true);
      try {
        const response = await adminAPI.getSubcategories(localFilters.category);
        if (cancelled) return;
        if (Array.isArray(response)) {
          setSubcategories(dedupeOptions(response, normalizeSubcategory, "subcategory_id"));
        } else if (response?.subcategories) {
          setSubcategories(dedupeOptions(response.subcategories, normalizeSubcategory, "subcategory_id"));
        } else {
          setSubcategories([]);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load subcategories for export modal", error);
          setSubcategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSubcategories(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, localFilters.category]);

  const statusOptions = useMemo(() => {
    if (!Array.isArray(statuses)) return [];
    return statuses.filter((status) => {
      const name = (status?.status_name || status?.StatusName || "").trim();
      const code = String(status?.status_code || status?.StatusCode || "")
        .trim()
        .toLowerCase();
      if (!name && !code) return true;
      if (name === "ร่าง") return false;
      if (code === "draft") return false;
      return true;
    });
  }, [statuses]);

  const handleChange = (field, value) => {
    setLocalFilters((prev) => {
      if (field === "category") {
        return { ...prev, category: value, subcategory: "" };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onConfirm(localFilters);
  };

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isExporting) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExporting, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60"
        aria-hidden="true"
        onClick={isExporting ? undefined : onClose}
      />
      <section
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submission-export-title"
        aria-describedby="submission-export-description"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="submission-export-title" className="text-lg font-semibold text-slate-900">ส่งออกคำร้อง</h2>
            <p id="submission-export-description" className="mt-1 text-sm text-slate-500">
              เลือกตัวกรองสำหรับไฟล์ส่งออกก่อนดาวน์โหลด (.xlsx)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="ปิดหน้าต่างเลือกตัวกรอง"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="export-category" className="mb-2 block text-sm font-medium text-slate-700">
                หมวดทุน (ทุนหลัก)
              </label>
              <select
                id="export-category"
                value={localFilters.category || ""}
                onChange={(e) => handleChange("category", e.target.value)}
                disabled={!selectedYear || loadingCategories}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">ทั้งหมด</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="export-subcategory" className="mb-2 block text-sm font-medium text-slate-700">
                ประเภททุน (ทุนย่อย)
              </label>
              <select
                id="export-subcategory"
                value={localFilters.subcategory || ""}
                onChange={(e) => handleChange("subcategory", e.target.value)}
                disabled={!localFilters.category || loadingSubcategories}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">ทั้งหมด</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                    {subcategory.subcategory_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="export-status" className="mb-2 block text-sm font-medium text-slate-700">สถานะ</label>
              <select
                id="export-status"
                value={localFilters.status || ""}
                onChange={(e) => handleChange("status", e.target.value)}
                disabled={statusLoading && statusOptions.length === 0}
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">ทั้งหมด</option>
                {statusOptions.map((status) => (
                  <option key={status.application_status_id} value={status.application_status_id}>
                    {status.status_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="export-search" className="mb-2 block text-sm font-medium text-slate-700">ค้นหา</label>
              <input
                id="export-search"
                type="text"
                value={localFilters.search || ""}
                onChange={(e) => handleChange("search", e.target.value)}
                placeholder="เลขที่คำร้อง, ชื่อเรื่อง, ผู้ยื่น..."
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-medium">
              ปีงบประมาณ: {selectedYearLabel || (selectedYear ? String(selectedYear) : "ทุกปี")}
            </p>
            <p className="mt-1 text-blue-800">
              ระบบจะใช้ตัวกรองเดียวกับหน้ารายการและส่งออกเฉพาะคำร้องที่ตรงกับเงื่อนไข
            </p>
          </div>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              ส่งออกไฟล์ Excel
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
