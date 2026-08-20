// app/admin/submissions/components/SubmissionFilters.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { adminAPI } from '../../../../../lib/admin_api';
import { useStatusMap } from '@/app/hooks/useStatusMap';

export default function SubmissionFilters({ filters, onFilterChange, onSearch, selectedYear = '' }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const { statuses, isLoading: statusLoading, getLabelById } = useStatusMap();

  const statusOptions = useMemo(() => {
    if (!Array.isArray(statuses)) return [];
    return statuses.filter((status) => {
      const name = (status?.status_name || status?.StatusName || '').trim();
      const code = String(status?.status_code || status?.StatusCode || '')
        .trim()
        .toLowerCase();
      if (!name && !code) return true;
      if (name === 'ร่าง') return false;
      if (code === 'draft') return false;
      return true;
    });
  }, [statuses]);

  // Fetch categories whenever year changes
  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      if (!selectedYear) {
        setCategories([]);
        setSubcategories([]);
        return;
      }

      try {
        const list = await fetchCategories(selectedYear);
        if (!cancelled) {
          setCategories(list);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading categories for year:', selectedYear, error);
          setCategories([]);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  // ✅ Keep local input in sync when parent filters.search changes
  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!selectedYear) {
      setSubcategories([]);
      return;
    }

    if (filters.category) {
      fetchSubcategories(filters.category);
    } else {
      setSubcategories([]);
    }
  }, [filters.category, selectedYear]);

  const toStringId = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    return '';
  };

  const normalizeCategoryOption = (raw) => {
    if (!raw || typeof raw !== 'object') return null;

    const id =
      raw.category_id ??
      raw.id ??
      raw.CategoryID ??
      raw.CategoryId ??
      raw.categoryId ??
      raw.categoryID;

    const normalizedId = toStringId(id);
    if (!normalizedId) return null;

    const name =
      raw.category_name ??
      raw.name ??
      raw.CategoryName ??
      raw.label ??
      raw.Category ??
      '';

    return {
      ...raw,
      category_id: normalizedId,
      category_name: name || `หมวดทุน ${normalizedId}`,
    };
  };

  const normalizeSubcategoryOption = (raw) => {
    if (!raw || typeof raw !== 'object') return null;

    const id =
      raw.subcategory_id ??
      raw.id ??
      raw.SubcategoryID ??
      raw.SubcategoryId ??
      raw.subcategoryId ??
      raw.subcategoryID;

    const normalizedId = toStringId(id);
    if (!normalizedId) return null;

    const name =
      raw.subcategory_name ??
      raw.name ??
      raw.SubcategoryName ??
      raw.label ??
      raw.Subcategory ??
      '';

    return {
      ...raw,
      subcategory_id: normalizedId,
      subcategory_name: name || `ประเภททุน ${normalizedId}`,
    };
  };

  const dedupeOptions = (items, normalize, idKey) => {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    const result = [];

    items.forEach((raw) => {
      const normalized = normalize(raw);
      if (!normalized) return;

      const key = normalized[idKey];
      if (!key || seen.has(key)) return;

      seen.add(key);
      result.push(normalized);
    });

    return result;
  };

  const fetchCategories = async (yearId) => {
    try {
      // ใช้ adminAPI สำหรับ categories (admin endpoint)
      const response = await adminAPI.getCategories(yearId);

      if (response && Array.isArray(response)) {
        return dedupeOptions(response, normalizeCategoryOption, 'category_id');
      }

      if (response && response.categories) {
        return dedupeOptions(response.categories, normalizeCategoryOption, 'category_id');
      } else {
        // เรียกข้อมูลจากตาราง fund_categories
        console.warn('Using categories from database structure');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }

    return [];
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      // ใช้ adminAPI สำหรับ subcategories (admin endpoint)
      const response = await adminAPI.getSubcategories(categoryId);
      
      if (response && Array.isArray(response)) {
        setSubcategories(dedupeOptions(response, normalizeSubcategoryOption, 'subcategory_id'));
      } else if (response && response.subcategories) {
        setSubcategories(dedupeOptions(response.subcategories, normalizeSubcategoryOption, 'subcategory_id'));
      } else {

      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  // Handle search submit (still supported for Enter key)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Handle filter change
  const handleChange = (field, value) => {
    // If changing category, reset subcategory
    if (field === 'category') {
      onFilterChange({ [field]: value, subcategory: '' });
    } else {
      onFilterChange({ [field]: value });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    onFilterChange({ category: '', subcategory: '', status: '' });
    onSearch('');
  };

  const hasActiveFilters = Boolean(
    filters.category || filters.subcategory || filters.status || filters.search
  );

  const fieldClassName =
    'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500';

  const filterChipClassName =
    'inline-flex min-h-9 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 pl-3 pr-1 text-sm font-medium text-blue-800';

  const dismissButtonClassName =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

  return (
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-5 sm:px-5" aria-label="ตัวกรองรายการคำร้อง">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h2 className="font-semibold text-slate-900">ค้นหาและกรองคำร้อง</h2>
          <p className="mt-1 text-sm text-slate-500">เลือกเงื่อนไขเพื่อค้นหารายการที่ต้องดำเนินการ</p>
        </div>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:mt-0"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            ล้างตัวกรองทั้งหมด
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700">
            หมวดทุน (ทุนหลัก)
          </label>
          <select
            id="category"
            name="category"
            value={filters.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            disabled={!selectedYear}
            className={fieldClassName}
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
          <label htmlFor="subcategory" className="mb-2 block text-sm font-medium text-slate-700">
            ประเภททุน (ทุนย่อย)
          </label>
          <select
            id="subcategory"
            name="subcategory"
            value={filters.subcategory || ''}
            onChange={(e) => handleChange('subcategory', e.target.value)}
            disabled={!filters.category}
            className={fieldClassName}
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
          <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-700">
            สถานะ
          </label>
          <select
            id="status"
            name="status"
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className={fieldClassName}
            disabled={statusLoading && statusOptions.length === 0}
          >
            <option value="">ทั้งหมด</option>
            {statusOptions.map((status) => (
                <option
                  key={status.application_status_id}
                  value={status.application_status_id}
                >
                  {status.status_name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label htmlFor="search" className="mb-2 block text-sm font-medium text-slate-700">
            ค้นหา
          </label>
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                // ✅ Live search on each keystroke
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchTerm(val);
                  onSearch(val);
                }}
                placeholder="เลขที่คำร้อง, ชื่อเรื่อง, ผู้ยื่น..."
                className={`${fieldClassName} pl-9`}
              />
            </div>
          </form>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="mr-1 text-sm font-medium text-slate-700">ตัวกรองที่เลือก</span>

            {filters.category && (
              <span className={filterChipClassName}>
                หมวด: {categories.find(c => c.category_id.toString() === filters.category)?.category_name || filters.category}
                <button
                  type="button"
                  onClick={() => handleChange('category', '')}
                  className={dismissButtonClassName}
                  aria-label="ล้างตัวกรองหมวดทุน"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            )}

            {filters.subcategory && (
              <span className={filterChipClassName}>
                ประเภท: {subcategories.find(s => s.subcategory_id.toString() === filters.subcategory)?.subcategory_name || filters.subcategory}
                <button
                  type="button"
                  onClick={() => handleChange('subcategory', '')}
                  className={dismissButtonClassName}
                  aria-label="ล้างตัวกรองประเภททุน"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className={filterChipClassName}>
                สถานะ: {getLabelById(filters.status) || filters.status}
                <button
                  type="button"
                  onClick={() => handleChange('status', '')}
                  className={dismissButtonClassName}
                  aria-label="ล้างตัวกรองสถานะ"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            )}

            {filters.search && (
              <span className={filterChipClassName}>
                ค้นหา: "{filters.search}"
                <button
                  type="button"
                  onClick={() => { setSearchTerm(''); onSearch(''); }}
                  className={dismissButtonClassName}
                  aria-label="ล้างคำค้นหา"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
