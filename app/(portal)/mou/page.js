"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  List, FileText, Plus, Search, Activity, Edit3,
  ChevronLeft, ChevronRight, Filter, X, FileSignature,
  Calendar, Clock, Bookmark, Layers,
  AlertCircle, RefreshCw, Key, ChevronDown,
  Building2, Globe, Tags, MapPin, Settings
} from "lucide-react";
import { mouAPI } from "../../lib/mou_api";
import MouLayout from "./components/MouLayout";

function statusClass(name) {
  const value = (name || "").toLowerCase();
  if (value.includes("active") || value.includes("มีผล") || value.includes("มีผลบังคับ")) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300";
  if (value.includes("ใกล้") || value.includes("ใกล้หมด")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-300";
  if (value.includes("หมด") || value.includes("หมดอายุ")) return "bg-red-50 text-red-700 ring-1 ring-red-300";
  if (value.includes("รอดำเนินการ")) return "bg-blue-50 text-blue-700 ring-1 ring-blue-300";
  return "bg-gray-50 text-gray-600 ring-1 ring-gray-300";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH");
}

function daysUntilEnd(endDate) {
  if (!endDate) return null;
  const now = new Date();
  const end = new Date(endDate);
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function Select({ value, onChange, options, placeholder = "เลือก", name, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const portalRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected ? selected.label : placeholder;

  const filtered = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && portalRef.current && !portalRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    if (searchable && inputRef.current) inputRef.current.focus();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, searchable, updatePos]);

  const select = useCallback(
    (val) => {
      onChange({ target: { name, value: val } });
      setOpen(false);
      setQuery("");
    },
    [name, onChange]
  );

  const onKeyDown = (e) => {
    if (searchable) {
      if (e.key === "ArrowDown" && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
        return;
      }
      if (!open) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIdx((i) => (i < filtered.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIdx((i) => (i > 0 ? i - 1 : filtered.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIdx >= 0 && filtered[focusedIdx]) {
            select(filtered[focusedIdx].value);
          } else {
            setOpen(false);
            setQuery("");
          }
          break;
      }
      return;
    }
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocusedIdx(0);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIdx((i) => (i < options.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIdx((i) => (i > 0 ? i - 1 : options.length - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIdx >= 0 && options[focusedIdx]) select(options[focusedIdx].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ target: { name, value: val } });
    if (!open) setOpen(true);
  };

  const toggle = () => setOpen((o) => !o);

  return (
    <div ref={ref} className="csWrap" onKeyDown={onKeyDown}>
      {searchable ? (
        <div ref={triggerRef} className={`csBtn${open ? " open" : ""}${value ? " hasVal" : ""}`} style={{ padding: 0, overflow: "hidden", alignItems: "stretch" }}>
          <input ref={inputRef} type="text" className="csInput" value={query || displayLabel} onChange={handleInputChange} onFocus={() => setOpen(true)} placeholder={placeholder} />
          <div style={{ display: "flex", alignItems: "center", paddingRight: 8, cursor: "pointer" }} onClick={toggle}>
            <ChevronDown size={18} className={`csArrow${open ? " open" : ""}`} />
          </div>
        </div>
      ) : (
        <button ref={triggerRef} type="button" className={`csBtn${open ? " open" : ""}${value ? " hasVal" : ""}`} onClick={toggle} aria-haspopup="listbox" aria-expanded={open}>
          <span className="csLabel">{displayLabel}</span>
          <ChevronDown size={18} className={`csArrow${open ? " open" : ""}`} />
        </button>
      )}
      {open && typeof document !== "undefined" && createPortal(
        <ul ref={portalRef} className="csDropdownPortal" role="listbox" style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}>
          {filtered.length === 0 ? (
            <li className="csOpt" style={{ color: "#9ca3af", cursor: "default", textAlign: "center" }}>ไม่มีรายการ</li>
          ) : (
            filtered.map((opt, idx) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={String(value) === String(opt.value)}
                className={`csOpt${String(value) === String(opt.value) ? " sel" : ""}${idx === focusedIdx ? " foc" : ""}`}
                onClick={() => select(opt.value)}
                onMouseEnter={() => setFocusedIdx(idx)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}

export default function MouPage() {
  const router = useRouter();

  const [mous, setMous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    mou_code: "",
    title: "",
    partner_name: "",
    country: "",
    status: "",
    mouType: "",
    level: "",
    is_international: "",
  });
  const [mouTypes, setMouTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statsData, setStatsData] = useState({ active: 0, nearExpiry: 0, expired: 0 });
  const limit = 10;

  const loadMous = async (p = page, filterOverrides) => {
    setLoading(true);
    try {
      const activeFilters = filterOverrides || filters;
      const response = await mouAPI.getMous({ ...activeFilters, page: p, limit });
      setMous(response.data || []);
      const total = response.total || 0;
      setTotalRecords(total);
      setTotalPages(Math.ceil(total / limit) || 1);
      setStatsData({ active: response.active_count || 0, nearExpiry: response.near_expiry_count || 0, expired: response.expired_count || 0 });
      setError("");
    } catch (err) {
      console.error("Error loading MOUs:", err);
      setError("ไม่สามารถโหลดข้อมูล MOU ได้");
      setMous([]);
      setStatsData({ active: 0, nearExpiry: 0, expired: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [typesResponse, statusesResponse, levelsResponse] = await Promise.all([
        mouAPI.getMouTypes(),
        mouAPI.getMouStatuses(),
        mouAPI.getMouLevels(),
      ]);
      setMouTypes(typesResponse || []);
      setStatuses(statusesResponse || []);
      setLevels(levelsResponse || []);
    } catch (err) {
      console.error("Error loading reference data:", err);
    }
  };

  useEffect(() => {
    loadMous(1);
    loadReferenceData();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    const empty = { mou_code: "", title: "", partner_name: "", country: "", status: "", mouType: "", level: "", is_international: "" };
    setFilters(empty);
    setPage(1);
    loadMous(1, empty);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const handleRowClick = (id, e) => {
    if (e.target.closest(".rowActions, a, button, select, input, textarea")) return;
    router.push(`/mou/show_detail_mou/${id}`);
  };

  const stats = useMemo(() => {
    return { total: totalRecords, active: statsData.active, nearExpiry: statsData.nearExpiry, expired: statsData.expired };
  }, [totalRecords, statsData]);

  const statCards = [
    { key: "total", label: "MOU ทั้งหมด", value: stats.total, icon: FileSignature, color: "blue", gradient: "from-blue-500 to-blue-600" },
    { key: "active", label: "มีผลบังคับใช้", value: stats.active, icon: Bookmark, color: "green", gradient: "from-green-500 to-green-600" },
    { key: "nearExpiry", label: "ใกล้หมดอายุ", value: stats.nearExpiry, icon: Clock, color: "amber", gradient: "from-amber-500 to-amber-600" },
    { key: "expired", label: "หมดอายุแล้ว", value: stats.expired, icon: AlertCircle, color: "red", gradient: "from-red-500 to-red-600" },
  ];

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pageBtn ${page === i ? "active" : ""}`}
          onClick={() => { setPage(i); loadMous(i); }}
        >
          {i}
        </button>
      );
    }
    return (
      <div className="pagination">
        <button
          className={`pageBtn ${page <= 1 ? "disabled" : ""}`}
          disabled={page <= 1}
          onClick={() => { if (page > 1) { const p = page - 1; setPage(p); loadMous(p); }}}
        >
          <ChevronLeft size={16} />
        </button>
        {startPage > 1 && <span className="pageBtn disabled">...</span>}
        {pages}
        {endPage < totalPages && <span className="pageBtn disabled">...</span>}
        <button
          className={`pageBtn ${page >= totalPages ? "disabled" : ""}`}
          disabled={page >= totalPages}
          onClick={() => { if (page < totalPages) { const p = page + 1; setPage(p); loadMous(p); }}}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <MouLayout subtitle="รายการ MOU">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: .5; }
          50% { opacity: .8; }
        }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out both; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out both; }
        .animate-slideDown { animation: slideDown 0.3s ease-out both; }
        .skeleton {
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: pulse 1.5s ease-in-out infinite;
          border-radius: 4px;
        }
        .mou-root .statCard:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15);
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .statCard { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); cursor: default; }
        .field label { font-weight: 600 !important; color: #374151 !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; flex-wrap: wrap !important; font-size: 14px !important; }
        .csWrap { position: relative; width: 100%; }
        .csBtn {
          width: 100%; min-height: 42px; border: 1px solid #d1d5db; border-radius: 8px;
          background: #fff; color: #9ca3af; padding: 8px 12px 8px 14px; font-size: 14px;
          outline: none; cursor: pointer; display: flex; align-items: center;
          justify-content: space-between; gap: 8px; text-align: left; font-family: inherit;
          line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .csBtn:hover { border-color: #a78bfa; background: #fafafa; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .csBtn.open, .csBtn:focus-visible { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12), 0 1px 2px rgba(0,0,0,0.04); }
        .csBtn.hasVal { color: #111827; }
        .csLabel { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .csInput { flex: 1; border: none; outline: none; background: transparent; padding: 8px 14px; font-size: 14px; font-family: inherit; color: #111827; min-width: 0; }
        .csArrow { flex-shrink: 0; color: #9ca3af; transition: transform 0.25s ease; }
        .csArrow.open { transform: rotate(180deg); }
        .csDropdownPortal {
          max-height: 240px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 10px;
          background: #fff; box-shadow: 0 8px 28px rgba(0,0,0,0.13); padding: 4px;
          animation: csIn 0.2s ease-out; transform-origin: top center;
        }
        @keyframes csIn {
          from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        .csOpt {
          padding: 8px 12px; font-size: 14px; cursor: pointer; border-radius: 6px;
          list-style: none; color: #111827; transition: background 0.15s ease, color 0.15s ease;
        }
        .csOpt:hover, .csOpt.foc, .csDropdownPortal .csOpt:hover, .csDropdownPortal .csOpt.foc { background: #eff6ff; color: #2563eb; }
        .csOpt.sel, .csDropdownPortal .csOpt.sel { background: #2563eb; color: #fff; font-weight: 500; }
        .csOpt.sel:hover, .csDropdownPortal .csOpt.sel:hover { background: #1d4ed8; }
        .csDropdownPortal::-webkit-scrollbar { width: 4px; }
        .csDropdownPortal::-webkit-scrollbar-track { background: transparent; }
        .csDropdownPortal::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>

      {/* Page Title */}
      <div className="flex items-center justify-between animate-fadeInUp" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
            <List size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ margin: 0, lineHeight: 1.2 }}>
              รายการ MOU
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">จัดการบันทึกข้อตกลงความร่วมมือทั้งหมด</p>
          </div>
        </div>
        <Link className="btn primary inline-flex items-center gap-2" href="/mou/add_mou">
          <Plus size={18} />
          เพิ่ม MOU ใหม่
        </Link>
      </div>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-24 mt-4 mb-6"></div>

      {error && (
        <div className="panel animate-slideDown" style={{ color: "#dc2626", marginBottom: "18px", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="statsGrid animate-fadeInUp" style={{ animationDelay: "80ms", marginBottom: "14px" }}>
        {statCards.map((stat, idx) => {
          const colorMap = {
            blue: { text: "text-blue-600", bg: "bg-blue-50" },
            green: { text: "text-green-600", bg: "bg-green-50" },
            amber: { text: "text-amber-600", bg: "bg-amber-50" },
            red: { text: "text-red-600", bg: "bg-red-50" },
          };
          const c = colorMap[stat.color];
          return (
            <div key={stat.key} className="statCard">
              <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center mr-3`}>
                <stat.icon size={20} className={c.text} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-gray-900 leading-none">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="panel searchPanel animate-fadeInUp" style={{ animationDelay: "150ms", marginBottom: "14px" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter size={16} className="text-blue-500" />
            ค้นหาและกรอง
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button type="button" className="btn small text-red-600 border-red-200 hover:bg-red-50 inline-flex items-center gap-1.5" onClick={clearFilters}>
                <X size={14} />
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

            <div className="filterGrid">
              <div className="field">
                <label><FileText size={13} />ชื่อ MOU</label>
                <input type="text" name="title" placeholder="ค้นหาชื่อ MOU" value={filters.title} onChange={handleFilterChange} />
              </div>
              <div className="field">
                <label><Key size={13} />รหัส MOU</label>
                <input type="text" name="mou_code" placeholder="ค้นหารหัส MOU" value={filters.mou_code} onChange={handleFilterChange} />
              </div>
              <div className="field">
                <label><Building2 size={13} />หน่วยงาน</label>
                <input type="text" name="partner_name" placeholder="ค้นหาหน่วยงาน" value={filters.partner_name} onChange={handleFilterChange} />
              </div>
              <div className="field">
                <label><MapPin size={13} />ประเทศ</label>
                <div className="searchRow">
                  <input type="text" name="country" placeholder="ค้นหาประเทศ" value={filters.country} onChange={handleFilterChange} />
                  <button type="button" className="btn primary searchBtn" onClick={() => { setPage(1); loadMous(1); }}>
                    <Search size={15} />
                    ค้นหา
                  </button>
                </div>
              </div>
            </div>
            <div className="filterBreak" style={{ marginTop: 12 }}>
              <div className="field">
                <label><Bookmark size={13} />สถานะ</label>
                <Select name="status" value={filters.status} onChange={handleFilterChange} placeholder="สถานะทั้งหมด" options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
              </div>
              <div className="field">
                <label><Layers size={13} />ระดับ</label>
                <Select name="level" value={filters.level} onChange={handleFilterChange} placeholder="ระดับทั้งหมด" options={levels.map((level) => ({ value: level, label: level === "university" ? "มหาวิทยาลัย" : level === "faculty" ? "คณะ" : level }))} />
              </div>
              <div className="field">
                <label><Tags size={13} />ประเภท MOU</label>
                <Select name="mouType" value={filters.mouType} onChange={handleFilterChange} placeholder="ประเภท MOU ทั้งหมด" options={mouTypes.map((type) => ({ value: type.id, label: type.name }))} />
              </div>
              <div className="field">
                <label><Globe size={13} />ขอบเขต</label>
                <Select name="is_international" value={filters.is_international} onChange={handleFilterChange} placeholder="ขอบเขตทั้งหมด" options={[
                  { value: "true", label: "ต่างประเทศ" },
                  { value: "false", label: "ในประเทศ" },
                ]} />
              </div>
            </div>
          </div>

      {/* Cards */}
      {loading ? (
        <div className="card tableCard animate-fadeInUp" style={{ animationDelay: "200ms", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} style={{ padding: "14px 16px", opacity: 0.7, border: "1px solid var(--mou-line)", borderRadius: 8, background: "var(--mou-surface)" }}>
              <div className="skeleton" style={{ height: 20, width: "30%", marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 16, width: "70%", marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 14, width: "50%", marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: "40%" }} />
            </div>
          ))}
        </div>
      ) : mous.length === 0 ? (
        <div className="card tableCard animate-fadeInUp" style={{ animationDelay: "200ms", padding: "24px" }}>
          <div className="flex flex-col items-center py-16 text-gray-400">
            <p className="text-lg font-medium text-gray-500 mb-1">ไม่มีข้อมูล MOU</p>
            <p className="text-sm text-gray-400 mb-5">ยังไม่มีบันทึกข้อตกลงความร่วมมือในระบบ</p>
            <Link className="btn primary inline-flex items-center gap-2" href="/mou/add_mou">
              <Plus size={18} />
              เพิ่ม MOU
            </Link>
          </div>
        </div>
      ) : (
        <div className="card tableCard animate-fadeInUp" style={{ animationDelay: "200ms", padding: 0, overflow: "hidden", background: "#f9fafb" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid var(--mou-line)", background: "var(--mou-surface)" }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>ผลลัพธ์การค้นหา <span style={{ fontWeight: 400, color: "#6b7280" }}>{totalRecords} รายการ</span></span>
            <button type="button" onClick={() => loadMous(page)} style={{ fontSize: 12, color: "#6b7280", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 4 }}>
              <RefreshCw size={12} />รีเฟรช
            </button>
          </div>
          <div className="colHeaders" style={{ display: "grid", gridTemplateColumns: "110px 1fr 100px 105px 105px 120px 160px", gap: 4, padding: "8px 24px", background: "#f9fafb", borderBottom: "1px solid var(--mou-line)", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Key size={11} />รหัส MOU</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, paddingRight: 12 }}><FileText size={11} />ชื่อ MOU / หน่วยงาน</span>
            <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Layers size={11} />ระดับ</span>
            <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันเริ่มต้น</span>
            <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันสิ้นสุด</span>
            <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Bookmark size={11} />สถานะ</span>
            <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Settings size={11} />จัดการ</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 4px" }}>
            {mous.map((mou, idx) => (
              <div key={mou.id} className="mouRow" style={{ display: "grid", gridTemplateColumns: "110px 1fr 100px 105px 105px 120px 160px", gap: 4, alignItems: "center", padding: "16px 20px", border: "1px solid var(--mou-line)", borderRadius: 8, background: "var(--mou-surface)", cursor: "pointer", animation: `fadeInUp 0.3s ease-out ${idx * 0.04}s both`, transition: "box-shadow 0.15s ease, background 0.15s ease" }} onClick={(e) => handleRowClick(mou.id, e)} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.background = "#eff6ff"; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "var(--mou-surface)"; }}>
                <span style={{ textAlign: "center", padding: "2px 10px", borderRadius: 5, background: "var(--mou-primary-soft)", color: "var(--mou-primary)", fontSize: 12, whiteSpace: "nowrap" }}>{mou.mou_code}</span>
                <div style={{ minWidth: 0, paddingRight: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mou.title}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mou.partners?.[0]?.partner_org || "-"}</div>
                </div>
                <span style={{ fontSize: 13, color: "#374151", textAlign: "center" }}>
                  {mou.level === "university" ? "มหาวิทยาลัย" : mou.level === "faculty" ? "คณะ" : mou.level || "-"}
                </span>
                <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{formatDate(mou.start_date)}</span>
                <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{mou.end_date ? formatDate(mou.end_date) : "-"}</span>
                <span style={{ textAlign: "center" }}><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(mou.status?.name)}`}>{mou.status?.name || "-"}</span></span>
                <div className="rowActions" style={{ textAlign: "center", display: "flex", gap: 4, justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
                  <Link className="btn small" href={`/mou/add_activity_mou?mou_id=${mou.id}`} style={{ fontSize: 12, padding: "4px 8px" }}>
                    <Activity size={13} /> เพิ่มกิจกรรม
                  </Link>
                  <Link className="btn small" href={`/mou/admin_edit_mou/${mou.id}`} style={{ fontSize: 12, padding: "4px 8px" }}>
                    <Edit3 size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {renderPagination()}
        </div>
      )}
    </MouLayout>
  );
}
