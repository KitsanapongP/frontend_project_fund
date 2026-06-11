"use client";
import { useEffect, useRef, useState } from "react";
import { usePublicationSearch } from "@/app/hooks/usePublicationSearch";
import ResultList from "./ResultList";
import { Search, ChevronDown, FileSearch, FilterX, FileText, Presentation, BookOpen, Book, Award, CircleSlash, Trophy, CheckCircle2, User, Tag, Download, Sprout, Building2, Monitor, BarChart3, HeartPulse, X } from "lucide-react";

const SCOPUS_TYPES = [
  { value: "Journal", label: "Journal", icon: FileText },
  { value: "Conference Proceeding", label: "Conference Proceeding", icon: Presentation },
  { value: "Book Series", label: "Book Series", icon: BookOpen },
  { value: "Book", label: "Book", icon: Book },
];
const SCOPUS_QUALITIES = [
  { value: "Q1", label: "Q1", icon: Award },
  { value: "Q2", label: "Q2", icon: Award },
  { value: "Q3", label: "Q3", icon: Award },
  { value: "Q4", label: "Q4", icon: Award },
  { value: "N/A", label: "N/A", icon: CircleSlash },
];
const TCI_TIERS = [
  { value: "1", label: "TCI กลุ่ม 1", icon: Trophy },
  { value: "2", label: "TCI กลุ่ม 2", icon: Trophy },
  { value: "3", label: "TCI กลุ่ม 3", icon: Trophy },
  { value: "not_in_tci", label: "ไม่อยู่ใน TCI", icon: CircleSlash },
];
const SEARCH_FIELDS = [
  { value: "all", label: "ทั้งหมด", icon: Search },
  { value: "title", label: "ชื่อเรื่อง", icon: FileText },
  { value: "author", label: "ชื่อผู้เขียน", icon: User },
  { value: "keywords", label: "คำสำคัญ", icon: Tag },
  { value: "abstract", label: "บทคัดย่อ", icon: BookOpen },
];
const AI_TRACKS = [
  { id: "ag",   name: "คณะเกษตรศาสตร์",               icon: Sprout },
  { id: "cola", name: "วิทยาลัยการปกครองท้องถิ่น",     icon: Building2 },
  { id: "cp",   name: "วิทยาลัยการคอมพิวเตอร์",        icon: Monitor },
  { id: "kkbs", name: "คณะบริหารธุรกิจและการบัญชี",   icon: BarChart3 },
  { id: "md",   name: "คณะแพทยศาสตร์",               icon: HeartPulse },
];

export default function PublicationSearchPage() {
  const { tab, setTab, query, setQuery, filters, setFilters, results, total, loading, page, setPage, yearRange, sortField, setSortField, sortDirection, setSortDirection, searchField, setSearchField, advancedQueries, setAdvancedQueries } = usePublicationSearch();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isFirstRender = useRef(true);
  const dropdownRef = useRef(null);
  const [yearDropdown, setYearDropdown] = useState({ start: false, end: false });
  const yearStartRef = useRef(null);
  const yearEndRef = useRef(null);

  const anyDropdownOpen = dropdownOpen || yearDropdown.start || yearDropdown.end;

  const availableFields = SEARCH_FIELDS.filter(f => f.value !== "keywords" || tab === "teacher");
  const selectedField = availableFields.find(f => f.value === searchField) || availableFields[0];

  const defaultYearMin = useRef(null);
  const defaultYearMax = useRef(null);
  const [lastImportDates, setLastImportDates] = useState([]);
  useEffect(() => {
    fetch('/api/publications/last-import').then(r => r.json()).then(d => setLastImportDates(d.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (yearRange.min != null && yearRange.max != null) {
      const min = String(yearRange.min);
      const max = String(yearRange.max);
      if (!defaultYearMin.current) defaultYearMin.current = min;
      if (!defaultYearMax.current) defaultYearMax.current = max;
      setFilters(prev => ({
        ...prev,
        yearStart: prev.yearStart || min,
        yearEnd: prev.yearEnd || max,
      }));
    }
  }, [yearRange.min, yearRange.max]);

  const scrollToResults = () => {
    const el = document.getElementById('result-table-header');
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 120;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToResults();
  }, [page]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSearchField("all");
    setQuery("");
    setAdvancedQueries({ title: "", author: "", keywords: "", abstract: "" });
    setFilters({ sources: [], yearStart: "", yearEnd: "", quartiles: [], aggTypes: [], tciTiers: [], projectTypes: [], tracks: [] });
    setPage(1);
    defaultYearMin.current = null;
    defaultYearMax.current = null;
  };

  const selectedSource = filters.sources[0] || "";
  const yearOptions = (() => {
    if (!yearRange.min || !yearRange.max) return [];
    const years = [];
    for (let y = yearRange.max; y >= yearRange.min; y--) years.push(String(y));
    return years;
  })();

  const hasActiveFilters =
    selectedSource !== "" ||
    (defaultYearMin.current && filters.yearStart !== defaultYearMin.current) ||
    (defaultYearMax.current && filters.yearEnd !== defaultYearMax.current) ||
    (filters.aggTypes && filters.aggTypes.length > 0) ||
    (filters.quartiles && filters.quartiles.length > 0) ||
    (filters.tciTiers && filters.tciTiers.length > 0) ||
    (filters.tracks && filters.tracks.length > 0);

  const clearAll = () => {
    setFilters({
      ...filters,
      sources: [],
      tciTiers: [],
      aggTypes: [],
      quartiles: [],
      tracks: [],
      yearStart: defaultYearMin.current || "",
      yearEnd: defaultYearMax.current || "",
    });
    setQuery("");
    setAdvancedQueries({ title: "", author: "", keywords: "", abstract: "" });
    setPage(1);
    setSearchField("all");
  };

  const selectSource = (source) => {
    const currentSources = filters.sources || [];
    if (currentSources.length === 1 && currentSources[0] === source) {
      setFilters({ ...filters, sources: [] });
    } else {
      setFilters({ ...filters, sources: [source] });
    }
  };

  const toggleFilter = (key, value) => {
    const current = filters[key] || [];
    if (current.includes(value)) {
      setFilters({ ...filters, [key]: current.filter((v) => v !== value) });
    } else {
      setFilters({ ...filters, [key]: [...current, value] });
    }
  };

  function FilterGroup({ title, options, selected, onToggle, gridCols, variant }) {
    const btnSelected = variant === 'scopus'
      ? 'bg-sky-100 text-sky-700 border-sky-300'
      : variant === 'tci'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
      : 'bg-[#7F77DD]/10 text-[#7F77DD] border-[#7F77DD]/30';
    const btnHover = variant === 'scopus'
      ? 'hover:border-sky-300'
      : variant === 'tci'
      ? 'hover:border-emerald-300'
      : 'hover:border-[#7F77DD]/30';
    return (
      <div className="flex items-center gap-3 whitespace-nowrap">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0">
          {title}
        </span>
        <div className={gridCols ? "grid gap-1.5" : "flex gap-1.5"} style={gridCols ? { gridTemplateColumns: `repeat(${gridCols}, auto)` } : undefined}>
            {options.map((opt) => {
            const label = opt.label || opt;
            const value = opt.value || opt;
            const Icon = opt.icon;
            const isSelected = selected.includes(value);
            return (
              <button
                key={value}
                onClick={() => onToggle(value)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all whitespace-nowrap ${
                  isSelected
                    ? btnSelected
                    : `bg-white text-gray-400 border-gray-200 ${btnHover}`
                }`}
              >
                <span className="flex items-center gap-1">
                  {isSelected && <CheckCircle2 size={12} />}
                  {Icon && <Icon size={11} className={isSelected ? '' : 'text-gray-300'} />}
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (query) params.set("q", query);
    if (searchField) params.set("search_field", searchField);
    if (advancedQueries.title) params.set("title_query", advancedQueries.title);
    if (advancedQueries.author) params.set("author_query", advancedQueries.author);
    if (advancedQueries.keywords) params.set("keywords_query", advancedQueries.keywords);
    if (advancedQueries.abstract) params.set("abstract_query", advancedQueries.abstract);
    if (filters.yearStart) params.set("year_start", filters.yearStart);
    if (filters.yearEnd) params.set("year_end", filters.yearEnd);
    if (Array.isArray(filters.sources)) filters.sources.forEach((s) => params.append("source", s));
    if (Array.isArray(filters.quartiles)) filters.quartiles.forEach((q) => params.append("quartile", q));
    if (Array.isArray(filters.aggTypes)) filters.aggTypes.forEach((t) => params.append("agg_type", t));
    if (Array.isArray(filters.tciTiers)) filters.tciTiers.forEach((t) => params.append("tier", t));
    if (Array.isArray(filters.projectTypes)) filters.projectTypes.forEach((t) => params.append("project_type", t));
    if (Array.isArray(filters.tracks)) filters.tracks.forEach((t) => params.append("track", t));
    params.set("sort", sortField);
    params.set("order", sortDirection);
    params.set("export", "1");
    try {
      const res = await fetch(`/api/publications/search?${params.toString()}`);
      const json = await res.json();
      if (!json.success || !json.data?.length) return;

      const rows = json.data;
      const title = (v) => `"${(v || '').replace(/"/g, '""')}"`;
      const TRACK_NAMES_MAP = { 'ag': 'คณะเกษตรศาสตร์', 'cola': 'วิทยาลัยการปกครองท้องถิ่น', 'cp': 'วิทยาลัยการคอมพิวเตอร์', 'kkbs': 'คณะบริหารธุรกิจและการบัญชี', 'md': 'คณะแพทยศาสตร์' };

      const fmtLong = (d) => {
        const s = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const i = s.search(/\d{2}:\d{2}$/);
        return i !== -1 ? s.slice(0, i).trim() + ' เวลา ' + s.slice(i) : s;
      };
      const fmtShort = (d) => new Date(d.finished_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      const meta = [`# ส่งออกเมื่อ: ${fmtLong(new Date())}`];
      const hasSource = filters.sources?.length;
      const hasType = filters.aggTypes?.length;
      const hasQuartile = filters.quartiles?.length;
      const hasTier = filters.tciTiers?.length;
      const hasProjectType = filters.projectTypes?.length;
      const hasTrack = filters.tracks?.length;
      const hasYear = filters.yearStart || filters.yearEnd;
      const hasAny = hasSource || hasType || hasQuartile || hasTier || hasProjectType || hasTrack || hasYear;
      meta.push('# กรองตาม');
      if (hasAny) {
        if (hasSource) meta.push(`#  - แหล่งที่มา: ${filters.sources.map(s => ({ scopus: 'Scopus', thaijo: 'TCI-ThaiJO', ai_showcase: 'AI Showcase' }[s] || s)).join(', ')}`);
        if (hasType) meta.push(`#  - ประเภทผลงาน: ${filters.aggTypes.join(', ')}`);
        if (hasQuartile) meta.push(`#  - คุณภาพวารสาร: ${filters.quartiles.join(', ')}`);
        if (hasTier) meta.push(`#  - กลุ่ม TCI: ${filters.tciTiers.map(t => ({ '1': 'TCI กลุ่ม 1', '2': 'TCI กลุ่ม 2', '3': 'TCI กลุ่ม 3', 'not_in_tci': 'ไม่อยู่ใน TCI' }[t] || t)).join(', ')}`);
        if (hasProjectType) meta.push(`#  - ประเภทโครงงาน: ${filters.projectTypes.join(', ')}`);
        if (hasTrack) meta.push(`#  - ภาคีเครือข่าย: ${filters.tracks.map(t => TRACK_NAMES_MAP[t] || t).join(', ')}`);
        if (hasYear) meta.push(`#  - ปี: ${filters.yearStart || '...'} - ${filters.yearEnd || '...'}`);
      } else {
        meta.push('#  - แสดงข้อมูลทั้งหมด');
      }
      if (query) {
        meta.push(`#  - คำค้นหา: ${query}`);
        const fieldLabels = { all: 'ชื่อเรื่อง ชื่อผู้เขียน คำสำคัญ บทคัดย่อ', title: 'ชื่อเรื่อง', author: 'ชื่อผู้เขียน', keywords: 'คำสำคัญ', abstract: 'บทคัดย่อ' };
        if (searchField && fieldLabels[searchField]) meta.push(`#  - ค้นหาจาก: ${fieldLabels[searchField]}`);
      }
      meta.push(`# จำนวนผลลัพธ์: ${json.total} รายการ`);
      if (lastImportDates.length > 0) {
        const importStr = lastImportDates.map(d => `${d.source}: ${fmtShort(d)}`).join(', ');
        meta.push(`# อัปเดตข้อมูลล่าสุด: ${importStr}`);
      }

      meta.push('');
      let csvRows = [...meta];

      if (tab === 'teacher') {
        csvRows.push(['ลำดับ', 'ชื่อเรื่อง', 'ผู้เขียน', 'แหล่งที่มา', 'ปี', 'ประเภทผลงาน', 'คุณภาพ', 'DOI/Link'].join(','));
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          csvRows.push([
            `="${i + 1}"`,
            title(r.title),
            title((r.authors || []).join(', ')),
            r.source_name,
            r.publication_year,
            r.detail_type || '',
            r.journal_quartile || r.journal_tier || '',
            r.source_name !== 'ai_showcase' ? (r.url || '') : ''
          ].join(','));
        }
      } else {
        csvRows.push(['ลำดับ', 'ชื่อโครงงาน (ภาษาไทย)', 'ชื่อโครงงาน (ภาษาอังกฤษ)', 'ผู้จัดทำ', 'อาจารย์ที่ปรึกษา', 'บทคัดย่อ', 'ภาคีเครือข่าย', 'ปี', 'แหล่งที่มา', 'เว็บไซต์', 'โปสเตอร์'].join(','));
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          csvRows.push([
            `="${i + 1}"`,
            title(r.title),
            title(r.title_en || ''),
            title((r.authors || []).join(', ')),
            title((r.advisors || []).join(', ')),
            title(r.abstract || ''),
            TRACK_NAMES_MAP[r.track_id] || '',
            r.publication_year,
            r.source_name,
            r.url || '',
            r.poster_url || ''
          ].join(','));
        }
      }

      const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const prefix = tab === 'student' ? 'student-projects' : 'publications';
      a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      {anyDropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setDropdownOpen(false); setYearDropdown({ start: false, end: false }); }} />
      )}
      
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800 leading-tight sm:text-3xl">
            <FileSearch size={32} className="text-gray-600" />
            สืบค้นผลงาน
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          ค้นหาและสำรวจผลงานจากฐานข้อมูล
        </p>
        <div className="mt-2 h-1 bg-gradient-to-r from-[#7F77DD] to-blue-500 rounded-full w-24"></div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-full">
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg shrink-0">
                {[
                  { key: "teacher", label: "ผลงานวิชาการ" },
                  { key: "student", label: "โครงงานนักศึกษา" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleTabChange(t.key)}
                    className={`w-[140px] px-3 py-2 rounded-md text-sm font-semibold border transition-all ${
                       tab === t.key
                        ? "bg-white text-[#7F77DD] border-[#7F77DD]/20 shadow-sm"
                        : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center bg-white border-2 border-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-[#7F77DD]/30 focus-within:shadow-lg focus-within:border-[#7F77DD] focus-within:ring-4 focus-within:ring-[#7F77DD]/10 transition-all duration-300">
                    <div className="relative shrink-0" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="h-12 flex items-center gap-2 pl-5 pr-3 text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer"
                      >
                        <selectedField.icon size={14} className="text-[#7F77DD]" />
                        <span className="max-w-[80px] truncate">{selectedField.label}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 min-w-[160px] z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                          {availableFields.map((field) => {
                            const isActive = field.value === searchField;
                            return (
                              <button
                                key={field.value}
                                type="button"
                                onClick={() => { setSearchField(field.value); setDropdownOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm rounded-lg outline-none focus:outline-none focus-visible:outline-none ${
                                  isActive ? "bg-[#7F77DD]/10 text-[#7F77DD]" : "text-gray-700"
                                }`}
                              >
                                <field.icon size={14} className={isActive ? "text-[#7F77DD]" : "text-gray-400"} />
                                <span className="flex-1 text-left">{field.label}</span>
                                {isActive && <CheckCircle2 size={14} className="text-[#7F77DD]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') scrollToResults();
                    }}
                    placeholder={
                      searchField === 'all'
                        ? (tab === 'teacher' ? 'ค้นหาชื่อเรื่อง / ชื่อผู้เขียน / คำสำคัญ / บทคัดย่อ...' : 'ค้นหาชื่อเรื่อง / ชื่อผู้จัดทำ / บทคัดย่อ...')
                        : searchField === 'title' ? 'ค้นหาชื่อเรื่อง...'
                        : searchField === 'author' ? 'ค้นหาชื่อผู้เขียน...'
                        : searchField === 'keywords' ? 'ค้นหาคำสำคัญ...'
                        : 'ค้นหาบทคัดย่อ...'
                    }
                    className="flex-1 h-12 px-4 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="h-10 w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-pointer shrink-0"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={scrollToResults}
                    className="group h-10 w-10 mr-1.5 bg-[#7F77DD] hover:bg-[#9B8FC7] text-white rounded-full transition-all duration-300 flex items-center justify-center shrink-0"
                  >
                    <Search size={18} className="transition-transform duration-300 group-hover:-scale-x-100" />
                  </button>
                    </div>
                     </div>
                 </div>
             </div>
          </div>

          {/* เส้นคั่น */}
        <div className="relative">
          <div className="h-px bg-gray-100 w-full" />

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="absolute right-0 top-full mt-1 text-xs text-gray-400 hover:text-red-500 transition cursor-pointer flex items-center gap-1"
            >
              <FilterX size={14} /> ล้างตัวกรอง
            </button>
          )}
        </div>

         <div className="flex flex-wrap items-start gap-3">
          
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0">แหล่งที่มา</span>
              <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setFilters({ ...filters, sources: [] })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    filters.sources.length === 0
                      ? "bg-white text-gray-800 border-gray-200 shadow-sm"
                      : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                   }`}
                >
                   {filters.sources.length === 0 && <span className="mr-1">✓</span>}ทั้งหมด
                </button>

                {tab === "teacher" && (
                  <>
                    <button
                      onClick={() => selectSource("scopus")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                        filters.sources.length === 1 && filters.sources[0] === "scopus"
                          ? "bg-white text-sky-700 border-sky-300 shadow-sm"
                          : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {filters.sources.length === 1 && filters.sources[0] === "scopus" && <span className="mr-1">✓</span>}Scopus
                    </button>
                    <button
                      onClick={() => selectSource("thaijo")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                        filters.sources.length === 1 && filters.sources[0] === "thaijo"
                          ? "bg-white text-emerald-700 border-emerald-300 shadow-sm"
                          : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {filters.sources.length === 1 && filters.sources[0] === "thaijo" && <span className="mr-1">✓</span>}TCI-ThaiJO
                    </button>
                  </>
                )}

                {tab === "student" && (
                  <>
                    <button
                      onClick={() => selectSource("ai_showcase")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                        filters.sources.length === 1 && filters.sources[0] === "ai_showcase"
                          ? "bg-white text-purple-700 border-purple-300 shadow-sm"
                          : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {filters.sources.length === 1 && filters.sources[0] === "ai_showcase" && <span className="mr-1">✓</span>}AI Showcase
                    </button>
                    <button disabled className="px-3 py-1.5 rounded-md text-xs font-medium bg-transparent text-gray-300 cursor-not-allowed border-transparent">e-Project</button>
                  </>
                )}
              </div>
            </div>

            {/* --- ตัวกรองย่อย (inline ด้านขวา) --- */}
            <div className="flex flex-col gap-2 max-w-md">
            {(filters.sources.length === 0 || selectedSource === "scopus") && tab === "teacher" && (
              <>
                <FilterGroup 
                  title="ประเภทผลงาน"
                  options={SCOPUS_TYPES}
                  selected={filters.aggTypes || []}
                  onToggle={(val) => toggleFilter("aggTypes", val)}
                  variant="scopus"
                />
                <FilterGroup 
                  title="คุณภาพวารสาร"
                  options={SCOPUS_QUALITIES}
                  selected={filters.quartiles || []}
                  onToggle={(val) => toggleFilter("quartiles", val)}
                  variant="scopus"
                />
              </>
            )}
            {(filters.sources.length === 0 || selectedSource === "thaijo") && tab === "teacher" && (
                <FilterGroup 
                  title="กรองตามกลุ่ม TCI"
                  options={TCI_TIERS}
                  selected={filters.tciTiers || []}
                  onToggle={(val) => toggleFilter("tciTiers", val)}
                  variant="tci"
                />
            )}
            {(filters.sources.length === 0 || selectedSource === "ai_showcase") && tab === "student" && (
              <div className="grid gap-x-3 gap-y-1.5 whitespace-nowrap" style={{ gridTemplateColumns: 'auto 1fr' }}>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0 mt-1">ภาคีเครือข่าย</span>
                <div className="flex gap-1.5 items-center">
                  {AI_TRACKS.slice(0, 3).map(t => {
                    const Icon = t.icon;
                    const isSelected = (filters.tracks || []).includes(t.id);
                    return (
                      <button key={t.id} onClick={() => toggleFilter("tracks", t.id)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all whitespace-nowrap ${isSelected ? 'bg-[#7F77DD]/10 text-[#7F77DD] border-[#7F77DD]/30' : 'bg-white text-gray-400 border-gray-200 hover:border-[#7F77DD]/30'}`}
                      >
                        <span className="flex items-center gap-1">
                          {isSelected && <CheckCircle2 size={12} />}
                          <Icon size={11} className={isSelected ? '' : 'text-gray-300'} />
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div></div>
                <div className="flex gap-1.5">
                  {AI_TRACKS.slice(3).map(t => {
                    const Icon = t.icon;
                    const isSelected = (filters.tracks || []).includes(t.id);
                    return (
                      <button key={t.id} onClick={() => toggleFilter("tracks", t.id)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all whitespace-nowrap ${isSelected ? 'bg-[#7F77DD]/10 text-[#7F77DD] border-[#7F77DD]/30' : 'bg-white text-gray-400 border-gray-200 hover:border-[#7F77DD]/30'}`}
                      >
                        <span className="flex items-center gap-1">
                          {isSelected && <CheckCircle2 size={12} />}
                          <Icon size={11} className={isSelected ? '' : 'text-gray-300'} />
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            <div className="ml-auto flex flex-col items-end min-h-[80px]">
               <div className="flex items-center gap-3">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0">ปี ค.ศ. (พ.ศ.)</span>
                  <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">จาก:</span>
                      <div className="relative" ref={yearStartRef}>
                        <button
                          type="button"
                          onClick={() => setYearDropdown(prev => ({ ...prev, start: !prev.start, end: false }))}
                          className="h-8 w-36 px-2 rounded-md border border-gray-200 bg-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#7F77DD] cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span>{filters.yearStart ? `${filters.yearStart} (${Number(filters.yearStart) + 543})` : '···'}</span>
                          <ChevronDown size={12} className={`text-gray-400 shrink-0 transition-transform duration-200 ${yearDropdown.start ? "rotate-180" : ""}`} />
                        </button>
                        {yearDropdown.start && (
                          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 w-36 max-h-48 overflow-y-auto z-50">
                            {yearOptions.map((y) => {
                              const isActive = y === filters.yearStart;
                              return (
                                <button
                                  key={y}
                                  type="button"
                                  onClick={() => { setFilters({ ...filters, yearStart: y }); setYearDropdown(prev => ({ ...prev, start: false })); }}
                                  className={`w-full px-2 py-1.5 text-xs text-center transition-colors ${
                                    isActive ? "bg-[#7F77DD]/10 text-[#7F77DD] font-medium" : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {y} ({Number(y) + 543})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">ถึง:</span>
                      <div className="relative" ref={yearEndRef}>
                        <button
                          type="button"
                          onClick={() => setYearDropdown(prev => ({ ...prev, end: !prev.end, start: false }))}
                          className="h-8 w-36 px-2 rounded-md border border-gray-200 bg-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#7F77DD] cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span>{filters.yearEnd ? `${filters.yearEnd} (${Number(filters.yearEnd) + 543})` : '···'}</span>
                          <ChevronDown size={12} className={`text-gray-400 shrink-0 transition-transform duration-200 ${yearDropdown.end ? "rotate-180" : ""}`} />
                        </button>
                        {yearDropdown.end && (
                          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg py-1 w-36 max-h-48 overflow-y-auto z-50">
                            {yearOptions.map((y) => {
                              const isActive = y === filters.yearEnd;
                              return (
                                <button
                                  key={y}
                                  type="button"
                                  onClick={() => { setFilters({ ...filters, yearEnd: y }); setYearDropdown(prev => ({ ...prev, end: false })); }}
                                  className={`w-full px-2 py-1.5 text-xs text-center transition-colors ${
                                    isActive ? "bg-[#7F77DD]/10 text-[#7F77DD] font-medium" : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {y} ({Number(y) + 543})
                                </button>
                              );
                            })}
                          </div>
                        )}
                       </div>
                   </div>
               </div>
                {lastImportDates.length > 0 && (
                   <div className="flex items-center gap-2 mt-auto text-[10px] text-gray-400">
                        <span className="font-medium text-gray-500">
                         อัปเดตล่าสุด:
                       </span>
                     {lastImportDates.filter(d => tab === 'teacher' ? d.source !== 'AI Showcase' : d.source === 'AI Showcase').map(d => (
                      <span key={d.source} className="text-[10px] text-gray-400">
                        {d.source}: {new Date(d.finished_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ))}
                  </div>
                )}
             </div>
         </div>

       </div>

       {/* ================= ส่วนแสดงผล ================= */}
       <div className="mt-6">
         <ResultList results={results} total={total} page={page} onPageChange={setPage} loading={loading} query={query} tab={tab} sortField={sortField} sortDirection={sortDirection} onSort={(field, dir) => { setSortField(field); setSortDirection(dir); }} onExport={handleExport} />
       </div>
     </div>
   );
 }