"use client";
import { useEffect, useRef, useState } from "react";
import { usePublicationSearch } from "@/app/hooks/usePublicationSearch";
import ResultList from "./ResultList";
import { Search, ChevronDown, FileSearch, FilterX, FileText, Presentation, BookOpen, Book, Award, CircleSlash, Trophy, CheckCircle2, User, Tag } from "lucide-react";

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
  { value: "1", label: "กลุ่ม 1", icon: Trophy },
  { value: "2", label: "กลุ่ม 2", icon: Trophy },
  { value: "3", label: "กลุ่ม 3", icon: Trophy },
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
  { id: "ag",   name: "คณะเกษตรศาสตร์" },
  { id: "cola", name: "วิทยาลัยการปกครองท้องถิ่น" },
  { id: "cp",   name: "วิทยาลัยการคอมพิวเตอร์" },
  { id: "kkbs", name: "คณะบริหารธุรกิจและการบัญชี" },
  { id: "md",   name: "คณะแพทยศาสตร์" },
];

export default function PublicationSearchPage() {
  const { tab, setTab, query, setQuery, filters, setFilters, results, total, loading, page, setPage, yearRange, sortField, setSortField, sortDirection, setSortDirection, searchField, setSearchField, advancedQueries, setAdvancedQueries } = usePublicationSearch();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [yearDropdown, setYearDropdown] = useState({ start: false, end: false });
  const yearStartRef = useRef(null);
  const yearEndRef = useRef(null);

  const anyDropdownOpen = dropdownOpen || yearDropdown.start || yearDropdown.end;

  const availableFields = SEARCH_FIELDS.filter(f => f.value !== "keywords" || tab === "teacher");
  const selectedField = availableFields.find(f => f.value === searchField) || availableFields[0];

  const defaultYearMin = useRef(null);
  const defaultYearMax = useRef(null);
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

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSearchField("all");
    setQuery("");
    setAdvancedQueries({ title: "", author: "", keywords: "", abstract: "" });
    setPage(1);
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
      <div className="flex items-start gap-3 whitespace-nowrap">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide shrink-0 mt-1.5">
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
                        : "bg-transparent text-gray-500 border-transparent hover:text-gray-700"
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
                        className="h-12 flex items-center gap-2 pl-5 pr-3 text-sm font-medium text-gray-700 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <selectedField.icon size={14} className="text-[#7F77DD]" />
                        <span className="max-w-[80px] truncate">{selectedField.label}</span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 min-w-[160px] z-50 animate-in fade-in slide-in-from-top-2">
                          {availableFields.map((field) => {
                            const isActive = field.value === searchField;
                            return (
                              <button
                                key={field.value}
                                type="button"
                                onClick={() => { setSearchField(field.value); setDropdownOpen(false); }}
                                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                                  isActive ? "bg-[#7F77DD]/10 text-[#7F77DD]" : "text-gray-700 hover:bg-gray-50"
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
                  <button
                    onClick={() => {}}
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
                      : "bg-transparent text-gray-500 border-transparent hover:text-gray-700"
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
                          : "bg-transparent text-gray-500 border-transparent hover:text-gray-700"
                      }`}
                    >
                      {filters.sources.length === 1 && filters.sources[0] === "scopus" && <span className="mr-1">✓</span>}Scopus
                    </button>
                    <button
                      onClick={() => selectSource("thaijo")}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                        filters.sources.length === 1 && filters.sources[0] === "thaijo"
                          ? "bg-white text-emerald-700 border-emerald-300 shadow-sm"
                          : "bg-transparent text-gray-500 border-transparent hover:text-gray-700"
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
                          : "bg-transparent text-gray-500 border-transparent hover:text-gray-700"
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
                <FilterGroup 
                  title="คณะ/วิทยาลัย"
                  options={AI_TRACKS.map(t => ({ value: t.id, label: t.name }))}
                  selected={filters.tracks || []}
                  onToggle={(val) => toggleFilter("tracks", val)}
                  gridCols={3}
                />
            )}
            </div>

           <div className="ml-auto flex items-center gap-3">
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
                          <span>{filters.yearStart} ({Number(filters.yearStart) + 543})</span>
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
                          <span>{filters.yearEnd} ({Number(filters.yearEnd) + 543})</span>
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
           </div>
        </div>

      </div>

      {/* ================= ส่วนแสดงผล ================= */}
      <div className="mt-6">
        <ResultList results={results} total={total} page={page} onPageChange={setPage} loading={loading} query={query} tab={tab} sortField={sortField} sortDirection={sortDirection} onSort={(field, dir) => { setSortField(field); setSortDirection(dir); }} />
      </div>
    </div>
  );
}