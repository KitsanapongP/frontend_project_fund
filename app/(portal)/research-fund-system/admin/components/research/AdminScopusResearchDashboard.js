"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  SlidersHorizontal,
  Filter,
  CircleHelp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

import PageLayout from "../common/PageLayout";
import SimpleCard from "../common/SimpleCard";
import adminAPI from "@/app/lib/admin_api";
import { formatNumber } from "@/app/utils/format";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">
      กำลังโหลดกราฟ...
    </div>
  ),
});

const DEFAULT_FILTERS = {
  scope: "faculty",
  yearStartBE: "",
  yearEndBE: "",
  aggregationTypes: [],
  qualityBuckets: [],
  openAccessMode: "all",
  citationMin: "",
  citationMax: "",
  searchTitle: "",
  searchDOI: "",
  searchEID: "",
  searchScopusID: "",
  searchJournal: "",
  searchAuthor: "",
  searchAffiliation: "",
  searchKeyword: "",
};

const SOURCE_COLLAPSE_STORAGE_KEY = "admin_scopus_dashboard_sources_collapsed";
const SPONSOR_COLLAPSE_STORAGE_KEY = "admin_scopus_dashboard_sponsors_collapsed";
const OVERVIEW_COLLAPSE_STORAGE_KEY = "admin_scopus_dashboard_overview_collapsed";
const FACULTY_HISTORY_COLLAPSE_STORAGE_KEY = "admin_scopus_dashboard_faculty_history_collapsed";
const PERSON_SUMMARY_COLLAPSE_STORAGE_KEY = "admin_scopus_dashboard_person_summary_collapsed";
const PERSON_MATRIX_COLLAPSE_STORAGE_KEY = "admin_scopus_dashboard_person_matrix_collapsed";
const INTERNAL_COLLAB_COLLAPSE_STORAGE_KEY = "admin_scopus_dashboard_internal_collab_collapsed";

const PERSON_BASE_COLUMNS = [
  { key: "user_name", label: "ชื่อ-สกุล", align: "left", group: "base" },
  { key: "user_email", label: "อีเมล", align: "left", group: "base" },
  { key: "user_scopus_id", label: "Scopus ID", align: "left", group: "base" },
  { key: "publication_rows", label: "จำนวนแถวผลงาน", align: "right", group: "base" },
  { key: "unique_documents", label: "ผลงานไม่ซ้ำ", align: "right", group: "base" },
  { key: "cited_by_total", label: "Citation รวม", align: "right", group: "base" },
  { key: "avg_cited_by", label: "Citation เฉลี่ย/ผลงาน", align: "right", group: "base" },
];

const PERSON_TIME_COLUMNS = [
  { key: "first_year", label: "ปีแรก", align: "right", group: "time" },
  { key: "latest_year", label: "ปีล่าสุด", align: "right", group: "time" },
  { key: "active_years", label: "จำนวนปีที่มีผลงาน", align: "right", group: "time" },
];

const PERSON_QUARTILE_COLUMNS = [
  { key: "t1_count", label: "T1", align: "right", group: "quartile" },
  { key: "q1_count", label: "Q1", align: "right", group: "quartile" },
  { key: "q2_count", label: "Q2", align: "right", group: "quartile" },
  { key: "q3_count", label: "Q3", align: "right", group: "quartile" },
  { key: "q4_count", label: "Q4", align: "right", group: "quartile" },
  { key: "quartile_na", label: "N/A", align: "right", group: "quartile" },
];

const PERSON_SOURCE_COLUMNS = [
  { key: "journal_count", label: "Journal", align: "right", group: "source" },
  { key: "conference_count", label: "Conference", align: "right", group: "source" },
];

const PERSON_MATRIX_IDENTITY_COLUMNS = [
  { key: "user_name", label: "ชื่อ-สกุล" },
  { key: "user_email", label: "อีเมล" },
  { key: "user_scopus_id", label: "Scopus ID" },
];

const PERSON_MATRIX_STICKY_WIDTHS = {
  user_name: 220,
  user_email: 220,
  user_scopus_id: 170,
};
const PERSON_MATRIX_RANK_WIDTH = 72;
const OVERVIEW_METRICS_LABEL_WIDTH = 410;

const PERSON_ALL_COLUMNS = [
  ...PERSON_BASE_COLUMNS,
  ...PERSON_QUARTILE_COLUMNS,
  ...PERSON_SOURCE_COLUMNS,
  ...PERSON_TIME_COLUMNS,
];
const PERSON_DEFAULT_COLUMN_VISIBILITY = PERSON_ALL_COLUMNS.reduce((acc, col) => {
  acc[col.key] = true;
  return acc;
}, {});

const PERSON_COLUMN_PRESETS = {
  executive: [
    "user_name",
    "user_scopus_id",
    "unique_documents",
    "cited_by_total",
    "avg_cited_by",
    "t1_count",
    "q1_count",
    "journal_count",
    "conference_count",
  ],
  quartile: [
    "user_name",
    "user_scopus_id",
    "unique_documents",
    "cited_by_total",
    "t1_count",
    "q1_count",
    "q2_count",
    "q3_count",
    "q4_count",
    "quartile_na",
    "first_year",
    "latest_year",
    "active_years",
  ],
  analyst: PERSON_ALL_COLUMNS.map((col) => col.key),
};

function filterToQueryParams(filters = {}) {
  const query = {
    scope: filters.scope || "faculty",
    open_access_mode: filters.openAccessMode || "all",
  };

  if (filters.yearStartBE) query.year_start_be = filters.yearStartBE;
  if (filters.yearEndBE) query.year_end_be = filters.yearEndBE;
  if (Array.isArray(filters.aggregationTypes) && filters.aggregationTypes.length > 0) {
    query.aggregation_types = filters.aggregationTypes.join(",");
  }
  if (Array.isArray(filters.qualityBuckets) && filters.qualityBuckets.length > 0) {
    query.quality_buckets = filters.qualityBuckets.join(",");
  }
  if (filters.citationMin !== "") query.citation_min = filters.citationMin;
  if (filters.citationMax !== "") query.citation_max = filters.citationMax;

  if (filters.searchTitle) query.search_title = filters.searchTitle;
  if (filters.searchDOI) query.search_doi = filters.searchDOI;
  if (filters.searchEID) query.search_eid = filters.searchEID;
  if (filters.searchScopusID) query.search_scopus_id = filters.searchScopusID;
  if (filters.searchJournal) query.search_journal = filters.searchJournal;
  if (filters.searchAuthor) query.search_author = filters.searchAuthor;
  if (filters.searchAffiliation) query.search_affiliation = filters.searchAffiliation;
  if (filters.searchKeyword) query.search_keyword = filters.searchKeyword;

  return query;
}

function withDefaultYearRange(baseFilters, options) {
  const range = options?.year_range || {};
  const maxBE = Number(range?.max_be || 0);
  const minBE = Number(range?.min_be || 0);
  if (!maxBE || !minBE) return baseFilters;

  const defaultStartBE = Math.max(minBE, maxBE - 2);

  return {
    ...baseFilters,
    yearStartBE: String(defaultStartBE),
    yearEndBE: String(maxBE),
  };
}

export default function AdminScopusResearchDashboard() {
  const [options, setOptions] = useState(null);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [summary, setSummary] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isSourceCollapsed, setIsSourceCollapsed] = useState(false);
  const [isSponsorCollapsed, setIsSponsorCollapsed] = useState(false);
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false);
  const [isFacultyHistoryCollapsed, setIsFacultyHistoryCollapsed] = useState(false);
  const [selectedFacultyHistoryRow, setSelectedFacultyHistoryRow] = useState("");
  const [isPersonSummaryCollapsed, setIsPersonSummaryCollapsed] = useState(false);
  const [selectedPersonSummaryRow, setSelectedPersonSummaryRow] = useState("");
  const [isPersonMatrixCollapsed, setIsPersonMatrixCollapsed] = useState(false);
  const [selectedPersonMatrixRow, setSelectedPersonMatrixRow] = useState("");
  const [selectedOverviewMetricsRow, setSelectedOverviewMetricsRow] = useState("");
  const [hoveredOverviewMetricsRow, setHoveredOverviewMetricsRow] = useState("");
  const [isInternalCollabCollapsed, setIsInternalCollabCollapsed] = useState(false);
  const [selectedInternalCollabRow, setSelectedInternalCollabRow] = useState("");
  const [internalCollabSearch, setInternalCollabSearch] = useState("");
  const [internalCollabMinShared, setInternalCollabMinShared] = useState("");
  const [internalCollabPage, setInternalCollabPage] = useState(1);
  const [internalCollabPageSize, setInternalCollabPageSize] = useState(25);
  const [internalCollabSort, setInternalCollabSort] = useState({ key: "shared_documents", direction: "desc" });
  const [personMatrixSearch, setPersonMatrixSearch] = useState("");
  const [personMatrixYearStart, setPersonMatrixYearStart] = useState("");
  const [personMatrixYearEnd, setPersonMatrixYearEnd] = useState("");
  const [personMatrixIdentityVisibility, setPersonMatrixIdentityVisibility] = useState({
    user_name: true,
    user_email: true,
    user_scopus_id: true,
  });
  const [personMatrixSort, setPersonMatrixSort] = useState({ key: "user_name", direction: "asc" });
  const [personSummarySearch, setPersonSummarySearch] = useState("");
  const [personColumnVisibility, setPersonColumnVisibility] = useState(PERSON_DEFAULT_COLUMN_VISIBILITY);
  const [personSort, setPersonSort] = useState({ key: "unique_documents", direction: "desc" });
  const [documentChartView, setDocumentChartView] = useState("bar");
  const [quartileChartView, setQuartileChartView] = useState("donut");
  const [publicationSourceSort, setPublicationSourceSort] = useState("desc");
  const [optionsError, setOptionsError] = useState("");
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedSource = window.localStorage.getItem(SOURCE_COLLAPSE_STORAGE_KEY);
    if (savedSource === "1") {
      setIsSourceCollapsed(true);
    }

    const savedSponsor = window.localStorage.getItem(SPONSOR_COLLAPSE_STORAGE_KEY);
    if (savedSponsor === "1") {
      setIsSponsorCollapsed(true);
    }

    const savedOverview = window.localStorage.getItem(OVERVIEW_COLLAPSE_STORAGE_KEY);
    if (savedOverview === "1") {
      setIsOverviewCollapsed(true);
    }

    const savedFacultyHistory = window.localStorage.getItem(FACULTY_HISTORY_COLLAPSE_STORAGE_KEY);
    if (savedFacultyHistory === "1") {
      setIsFacultyHistoryCollapsed(true);
    }

    const savedPersonSummary = window.localStorage.getItem(PERSON_SUMMARY_COLLAPSE_STORAGE_KEY);
    if (savedPersonSummary === "1") {
      setIsPersonSummaryCollapsed(true);
    }

    const savedPersonMatrix = window.localStorage.getItem(PERSON_MATRIX_COLLAPSE_STORAGE_KEY);
    if (savedPersonMatrix === "1") {
      setIsPersonMatrixCollapsed(true);
    }

    const savedInternalCollab = window.localStorage.getItem(INTERNAL_COLLAB_COLLAPSE_STORAGE_KEY);
    if (savedInternalCollab === "1") {
      setIsInternalCollabCollapsed(true);
    }
  }, []);

  const toggleSourceCollapsed = useCallback(() => {
    setIsSourceCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SOURCE_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const toggleSponsorCollapsed = useCallback(() => {
    setIsSponsorCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SPONSOR_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const toggleOverviewCollapsed = useCallback(() => {
    setIsOverviewCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(OVERVIEW_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const toggleFacultyHistoryCollapsed = useCallback(() => {
    setIsFacultyHistoryCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(FACULTY_HISTORY_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const togglePersonSummaryCollapsed = useCallback(() => {
    setIsPersonSummaryCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PERSON_SUMMARY_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const togglePersonMatrixCollapsed = useCallback(() => {
    setIsPersonMatrixCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(PERSON_MATRIX_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const toggleInternalCollabCollapsed = useCallback(() => {
    setIsInternalCollabCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(INTERNAL_COLLAB_COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const togglePersonMatrixIdentityColumn = useCallback((columnKey) => {
    setPersonMatrixIdentityVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  }, []);

  const handlePersonMatrixSort = useCallback((columnKey) => {
    setPersonMatrixSort((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key: columnKey,
        direction: columnKey.startsWith("year:") ? "desc" : "asc",
      };
    });
  }, []);

  const personMatrixSortIndicator = useCallback((columnKey) => {
    if (personMatrixSort.key !== columnKey) return "↕";
    return personMatrixSort.direction === "asc" ? "▲" : "▼";
  }, [personMatrixSort]);

  const handleInternalCollabSort = useCallback((columnKey) => {
    setInternalCollabSort((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return {
        key: columnKey,
        direction: columnKey === "shared_documents" ? "desc" : "asc",
      };
    });
  }, []);

  const internalCollabSortIndicator = useCallback((columnKey) => {
    if (internalCollabSort.key !== columnKey) return "↕";
    return internalCollabSort.direction === "asc" ? "▲" : "▼";
  }, [internalCollabSort]);

  const togglePersonColumn = useCallback((columnKey) => {
    setPersonColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  }, []);

  const togglePersonColumnGroup = useCallback((columns, checked) => {
    setPersonColumnVisibility((prev) => {
      const next = { ...prev };
      columns.forEach((col) => {
        next[col.key] = checked;
      });
      return next;
    });
  }, []);

  const showAllPersonColumns = useCallback(() => {
    setPersonColumnVisibility({ ...PERSON_DEFAULT_COLUMN_VISIBILITY });
  }, []);

  const applyPersonColumnPreset = useCallback((presetKey) => {
    const selected = PERSON_COLUMN_PRESETS[presetKey] || [];
    const next = PERSON_ALL_COLUMNS.reduce((acc, col) => {
      acc[col.key] = selected.includes(col.key);
      return acc;
    }, {});
    setPersonColumnVisibility(next);
  }, []);

  const resetPersonSearch = useCallback(() => {
    setPersonSummarySearch("");
  }, []);

  const resetPersonSort = useCallback(() => {
    setPersonSort({ key: "unique_documents", direction: "desc" });
  }, []);

  const handlePersonSort = useCallback((columnKey) => {
    setPersonSort((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: columnKey, direction: "desc" };
    });
  }, []);

  const personSortIndicator = useCallback((columnKey) => {
    if (personSort.key !== columnKey) return "↕";
    return personSort.direction === "asc" ? "▲" : "▼";
  }, [personSort]);

  const personColumnLabelByKey = useMemo(() => {
    const map = {};
    PERSON_ALL_COLUMNS.forEach((col) => {
      map[col.key] = col.label;
    });
    return map;
  }, []);

  const loadSummary = useCallback(async (filters) => {
    setLoadingSummary(true);
    setSummaryError("");
    try {
      const response = await adminAPI.getScopusDashboardSummary(filterToQueryParams(filters));
      setSummary(response?.data || null);
    } catch (error) {
      setSummaryError(error?.message || "ไม่สามารถโหลดข้อมูลสรุปได้");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadFilterOptions() {
      setLoadingOptions(true);
      setOptionsError("");
      try {
        const response = await adminAPI.getScopusDashboardFilterOptions();
        if (!mounted) return;

        const payload = response?.data || {};
        setOptions(payload);

        const initialFilters = withDefaultYearRange(DEFAULT_FILTERS, payload);
        setDraftFilters(initialFilters);
        setAppliedFilters(initialFilters);
        await loadSummary(initialFilters);
      } catch (error) {
        if (!mounted) return;
        setOptionsError(error?.message || "ไม่สามารถโหลดตัวกรองเริ่มต้นได้");
      } finally {
        if (mounted) {
          setLoadingOptions(false);
        }
      }
    }

    loadFilterOptions();
    return () => {
      mounted = false;
    };
  }, [loadSummary]);

  const scopeOptions = useMemo(() => (Array.isArray(options?.scopes) ? options.scopes : []), [options]);
  const yearOptions = useMemo(() => (Array.isArray(options?.year_options) ? options.year_options : []), [options]);
  const aggregationOptions = useMemo(() => (Array.isArray(options?.aggregation_types) ? options.aggregation_types : []), [options]);
  const qualityOptions = useMemo(() => (Array.isArray(options?.quality_buckets) ? options.quality_buckets : []), [options]);

  const appliedFilterSummaryItems = useMemo(() => {
    const scopeLabel = scopeOptions.find((item) => item.value === appliedFilters.scope)?.label || "ระดับคณะ";

    const yearStart = String(appliedFilters.yearStartBE || "").trim();
    const yearEnd = String(appliedFilters.yearEndBE || "").trim();
    let yearLabel = "ทุกปี";
    if (yearStart && yearEnd) yearLabel = `${yearStart} - ${yearEnd}`;
    else if (yearStart) yearLabel = `${yearStart} - ล่าสุด`;
    else if (yearEnd) yearLabel = `เริ่มต้น - ${yearEnd}`;

    const aggregationLabelMap = aggregationOptions.reduce((acc, item) => {
      acc[String(item.value)] = String(item.label || item.value);
      return acc;
    }, {});
    const qualityLabelMap = qualityOptions.reduce((acc, item) => {
      acc[String(item.value)] = String(item.label || item.value);
      return acc;
    }, {});

    const selectedAggregations = Array.isArray(appliedFilters.aggregationTypes) ? appliedFilters.aggregationTypes : [];
    const selectedQuality = Array.isArray(appliedFilters.qualityBuckets) ? appliedFilters.qualityBuckets : [];

    const aggregationLabel = selectedAggregations.length > 0
      ? selectedAggregations.map((value) => aggregationLabelMap[String(value)] || String(value)).join(", ")
      : "ทั้งหมด";
    const qualityLabel = selectedQuality.length > 0
      ? selectedQuality.map((value) => qualityLabelMap[String(value)] || String(value)).join(", ")
      : "ทั้งหมด";

    return [
      { key: "scope", label: "มุมมอง", value: scopeLabel },
      { key: "year", label: "ช่วงปี", value: yearLabel },
      { key: "aggregation", label: "ประเภทผลงาน", value: aggregationLabel },
      { key: "quality", label: "คุณภาพวารสาร", value: qualityLabel },
    ];
  }, [aggregationOptions, appliedFilters, qualityOptions, scopeOptions]);

  const toggleMulti = useCallback((key, value) => {
    setDraftFilters((prev) => {
      const source = Array.isArray(prev[key]) ? prev[key] : [];
      const next = source.includes(value)
        ? source.filter((item) => item !== value)
        : [...source, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleApplyFilters = async () => {
    setAppliedFilters(draftFilters);
    await loadSummary(draftFilters);
  };

  const handleResetFilters = async () => {
    const reset = withDefaultYearRange(DEFAULT_FILTERS, options);
    setDraftFilters(reset);
    setAppliedFilters(reset);
    await loadSummary(reset);
  };

  const kpi = summary?.kpi || {};
  const qualityBreakdown = Array.isArray(summary?.quality_breakdown) ? summary.quality_breakdown : [];
  const aggregationBreakdown = Array.isArray(summary?.aggregation_breakdown) ? summary.aggregation_breakdown : [];
  const personSummaryRows = Array.isArray(summary?.person_summary) ? summary.person_summary : [];
  const personYearMatrix = summary?.person_year_matrix || {};
  const personYearMatrixYears = Array.isArray(personYearMatrix?.years) ? personYearMatrix.years : [];
  const personYearMatrixRows = Array.isArray(personYearMatrix?.rows) ? personYearMatrix.rows : [];
  const internalCollaborationPairs = Array.isArray(summary?.internal_collaboration_pairs) ? summary.internal_collaboration_pairs : [];

  const internalCollabFilteredRows = useMemo(() => {
    const query = internalCollabSearch.trim().toLowerCase();
    const minShared = Number(internalCollabMinShared || 0);
    const threshold = Number.isFinite(minShared) && minShared > 0 ? minShared : 0;

    const filtered = internalCollaborationPairs.filter((row) => {
      const userA = String(row.user_a || "").toLowerCase();
      const userB = String(row.user_b || "").toLowerCase();
      const shared = Number(row.shared_documents || 0);
      const searchMatch = query === "" || userA.includes(query) || userB.includes(query);
      return searchMatch && shared >= threshold;
    });

    filtered.sort((a, b) => {
      let compare = 0;
      if (internalCollabSort.key === "shared_documents") {
        compare = Number(a?.shared_documents || 0) - Number(b?.shared_documents || 0);
      } else if (internalCollabSort.key === "user_a") {
        compare = String(a?.user_a || "").localeCompare(String(b?.user_a || ""), "th", { sensitivity: "base" });
      } else {
        compare = String(a?.user_b || "").localeCompare(String(b?.user_b || ""), "th", { sensitivity: "base" });
      }

      if (compare === 0) {
        return String(a?.user_a || "").localeCompare(String(b?.user_a || ""), "th", { sensitivity: "base" });
      }
      return internalCollabSort.direction === "asc" ? compare : -compare;
    });

    return filtered;
  }, [internalCollaborationPairs, internalCollabSearch, internalCollabMinShared, internalCollabSort]);

  const internalCollabTotalPages = useMemo(
    () => Math.max(1, Math.ceil(internalCollabFilteredRows.length / internalCollabPageSize)),
    [internalCollabFilteredRows.length, internalCollabPageSize]
  );

  const internalCollabPageRows = useMemo(() => {
    const start = (internalCollabPage - 1) * internalCollabPageSize;
    return internalCollabFilteredRows.slice(start, start + internalCollabPageSize);
  }, [internalCollabFilteredRows, internalCollabPage, internalCollabPageSize]);

  useEffect(() => {
    const start = personYearMatrix?.year_start_be;
    const end = personYearMatrix?.year_end_be;
    if (!start || !end) {
      setPersonMatrixYearStart("");
      setPersonMatrixYearEnd("");
      return;
    }

    setPersonMatrixYearStart(String(start));
    setPersonMatrixYearEnd(String(end));
  }, [personYearMatrix?.year_start_be, personYearMatrix?.year_end_be]);

  useEffect(() => {
    setInternalCollabPage(1);
  }, [internalCollabSearch, internalCollabMinShared, internalCollabPageSize, internalCollabSort]);

  useEffect(() => {
    if (internalCollabPage > internalCollabTotalPages) {
      setInternalCollabPage(internalCollabTotalPages);
    }
  }, [internalCollabPage, internalCollabTotalPages]);
  const topPublicationSources = Array.isArray(summary?.top_publication_sources) ? summary.top_publication_sources : [];
  const fundingSponsorBreakdown = Array.isArray(summary?.funding_sponsor_breakdown) ? summary.funding_sponsor_breakdown : [];
  const facultyQuartileHistory = Array.isArray(summary?.faculty_quartile_history) ? summary.faculty_quartile_history : [];
  const facultyQuartileHistoryFiscal = Array.isArray(summary?.faculty_quartile_history_fiscal) ? summary.faculty_quartile_history_fiscal : [];
  const yearBreakdownBE = summary?.year_breakdown_be || {};

  const publicationSourceRows = useMemo(
    () => {
      const rows = topPublicationSources.map((item) => ({
        aggregationType: String(item?.aggregation_type || "N/A"),
        publicationSource: String(item?.publication_source || item?.label || "N/A"),
        total: Number(item?.total || 0),
      }));

      rows.sort((left, right) => {
        if (left.total !== right.total) {
          return publicationSourceSort === "desc" ? right.total - left.total : left.total - right.total;
        }
        const sourceCompare = left.publicationSource.localeCompare(right.publicationSource);
        if (sourceCompare !== 0) return sourceCompare;
        return left.aggregationType.localeCompare(right.aggregationType);
      });

      return rows;
    },
    [publicationSourceSort, topPublicationSources]
  );

  const visiblePersonBaseColumns = useMemo(
    () => PERSON_BASE_COLUMNS.filter((col) => personColumnVisibility[col.key]),
    [personColumnVisibility]
  );
  const visiblePersonQuartileColumns = useMemo(
    () => PERSON_QUARTILE_COLUMNS.filter((col) => personColumnVisibility[col.key]),
    [personColumnVisibility]
  );
  const visiblePersonSourceColumns = useMemo(
    () => PERSON_SOURCE_COLUMNS.filter((col) => personColumnVisibility[col.key]),
    [personColumnVisibility]
  );
  const visiblePersonTimeColumns = useMemo(
    () => PERSON_TIME_COLUMNS.filter((col) => personColumnVisibility[col.key]),
    [personColumnVisibility]
  );
  const visiblePersonColumnsCount = useMemo(
    () => visiblePersonBaseColumns.length + visiblePersonQuartileColumns.length + visiblePersonSourceColumns.length + visiblePersonTimeColumns.length,
    [visiblePersonBaseColumns.length, visiblePersonQuartileColumns.length, visiblePersonSourceColumns.length, visiblePersonTimeColumns.length]
  );
  const hasGroupedPersonColumns = visiblePersonQuartileColumns.length > 0 || visiblePersonSourceColumns.length > 0;
  const isMainGroupChecked = useMemo(
    () => [...PERSON_BASE_COLUMNS, ...PERSON_TIME_COLUMNS].every((col) => personColumnVisibility[col.key]),
    [personColumnVisibility]
  );
  const isQuartileGroupChecked = useMemo(
    () => PERSON_QUARTILE_COLUMNS.every((col) => personColumnVisibility[col.key]),
    [personColumnVisibility]
  );
  const isSourceGroupChecked = useMemo(
    () => PERSON_SOURCE_COLUMNS.every((col) => personColumnVisibility[col.key]),
    [personColumnVisibility]
  );

  const personSummaryFilteredRows = useMemo(() => {
    const query = personSummarySearch.trim().toLowerCase();
    const filtered = query
      ? personSummaryRows.filter((row) => {
          const name = String(row.user_name || "").toLowerCase();
          const email = String(row.user_email || "").toLowerCase();
          const scopusId = String(row.user_scopus_id || "").toLowerCase();
          return name.includes(query) || email.includes(query) || scopusId.includes(query);
        })
      : [...personSummaryRows];

    const numericSortColumns = new Set([
      "publication_rows",
      "unique_documents",
      "cited_by_total",
      "avg_cited_by",
      "t1_count",
      "q1_count",
      "q2_count",
      "q3_count",
      "q4_count",
      "quartile_na",
      "journal_count",
      "conference_count",
      "first_year",
      "latest_year",
      "active_years",
    ]);

    filtered.sort((a, b) => {
      const left = a?.[personSort.key];
      const right = b?.[personSort.key];
      let compare = 0;

      if (numericSortColumns.has(personSort.key)) {
        compare = Number(left || 0) - Number(right || 0);
      } else {
        compare = String(left || "").localeCompare(String(right || ""), "th", { sensitivity: "base" });
      }

      if (compare === 0) {
        return String(a?.user_name || "").localeCompare(String(b?.user_name || ""), "th", { sensitivity: "base" });
      }

      return personSort.direction === "asc" ? compare : -compare;
    });

    return filtered;
  }, [personSummaryRows, personSummarySearch, personSort]);

  const personSortLabel = useMemo(
    () => personColumnLabelByKey[personSort.key] || personSort.key,
    [personColumnLabelByKey, personSort.key]
  );

  const visiblePersonMatrixIdentityColumns = useMemo(
    () => PERSON_MATRIX_IDENTITY_COLUMNS.filter((col) => personMatrixIdentityVisibility[col.key]),
    [personMatrixIdentityVisibility]
  );

  const personMatrixStickyLeftByKey = useMemo(() => {
    let left = PERSON_MATRIX_RANK_WIDTH;
    const result = {};
    visiblePersonMatrixIdentityColumns.forEach((col) => {
      result[col.key] = left;
      left += PERSON_MATRIX_STICKY_WIDTHS[col.key] || 180;
    });
    return result;
  }, [visiblePersonMatrixIdentityColumns]);

  const personMatrixVisibleYears = useMemo(() => {
    const start = Number(personMatrixYearStart || 0);
    const end = Number(personMatrixYearEnd || 0);
    return personYearMatrixYears.filter((year) => {
      if (start && year < start) return false;
      if (end && year > end) return false;
      return true;
    });
  }, [personYearMatrixYears, personMatrixYearStart, personMatrixYearEnd]);

  const personMatrixFilteredRows = useMemo(() => {
    const query = personMatrixSearch.trim().toLowerCase();
    const filtered = query
      ? personYearMatrixRows.filter((row) => {
          const name = String(row.user_name || "").toLowerCase();
          const email = String(row.user_email || "").toLowerCase();
          const scopusId = String(row.user_scopus_id || "").toLowerCase();
          return name.includes(query) || email.includes(query) || scopusId.includes(query);
        })
      : [...personYearMatrixRows];

    filtered.sort((a, b) => {
      const isYearSort = personMatrixSort.key.startsWith("year:");
      let compare = 0;

      if (isYearSort) {
        const year = personMatrixSort.key.replace("year:", "");
        const left = Number(a?.year_counts?.[year] || 0);
        const right = Number(b?.year_counts?.[year] || 0);
        compare = left - right;
      } else {
        const left = String(a?.[personMatrixSort.key] || "");
        const right = String(b?.[personMatrixSort.key] || "");
        compare = left.localeCompare(right, "th", { sensitivity: "base" });
      }

      if (compare === 0) {
        return String(a?.user_name || "").localeCompare(String(b?.user_name || ""), "th", { sensitivity: "base" });
      }

      return personMatrixSort.direction === "asc" ? compare : -compare;
    });

    return filtered;
  }, [personYearMatrixRows, personMatrixSearch, personMatrixSort]);

  const totalDocuments = Number(kpi.total_documents || 0);
  const documentTypeRows = aggregationBreakdown;
  const quartileRows = useMemo(() => {
    const order = ["T1", "Q1", "Q2", "Q3", "Q4"];
    return order.map((key) => ({
      key,
      total: Number(qualityBreakdown.find((item) => item.value === key)?.total || 0),
    }));
  }, [qualityBreakdown]);
  const isFacultyOverview = appliedFilters.scope !== "individual";

  const ratioText = useCallback((value) => {
    if (!totalDocuments) return "0.0%";
    return `${((Number(value || 0) / totalDocuments) * 100).toFixed(1)}%`;
  }, [totalDocuments]);

  const publicationYearRangeLabel = useMemo(() => {
    const startFromFilter = Number(appliedFilters?.yearStartBE || 0);
    const endFromFilter = Number(appliedFilters?.yearEndBE || 0);

    if (startFromFilter > 0 || endFromFilter > 0) {
      const start = startFromFilter > 0 ? startFromFilter : "-";
      const end = endFromFilter > 0 ? endFromFilter : "-";
      return `${start} - ${end}`;
    }

    const years = Object.keys(yearBreakdownBE)
      .map((year) => Number(year))
      .filter((year) => Number.isFinite(year) && year > 0)
      .sort((a, b) => a - b);

    if (years.length === 0) return "-";
    return `${years[0]} - ${years[years.length - 1]}`;
  }, [appliedFilters?.yearStartBE, appliedFilters?.yearEndBE, yearBreakdownBE]);

  const latestScopusPullLabel = useMemo(() => {
    const raw = summary?.latest_scopus_pull_at;
    if (!raw) return "-";
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return String(raw);
    return parsed.toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [summary?.latest_scopus_pull_at]);

  const overviewYearsBE = useMemo(() => {
    const calendarYears = facultyQuartileHistory
      .map((row) => Number(row?.publication_year || 0))
      .filter((year) => Number.isFinite(year) && year > 0);
    const fiscalYears = facultyQuartileHistoryFiscal
      .map((row) => Number(row?.publication_year || 0))
      .filter((year) => Number.isFinite(year) && year > 0);

    const start = Number(appliedFilters?.yearStartBE || 0);
    const end = Number(appliedFilters?.yearEndBE || 0);
    if (start > 0 && end > 0 && end >= start) {
      const years = [];
      for (let year = start; year <= end; year += 1) {
        years.push(year);
      }
      return years;
    }

    return Array.from(new Set([...calendarYears, ...fiscalYears])).sort((a, b) => a - b);
  }, [appliedFilters?.yearEndBE, appliedFilters?.yearStartBE, facultyQuartileHistory, facultyQuartileHistoryFiscal]);

  const calendarHistoryByYear = useMemo(() => {
    const map = {};
    facultyQuartileHistory.forEach((row) => {
      const year = Number(row?.publication_year || 0);
      if (!year) return;
      map[year] = {
        t1: Number(row?.t1 || 0),
        q1: Number(row?.q1 || 0),
        q2: Number(row?.q2 || 0),
        q3: Number(row?.q3 || 0),
        q4: Number(row?.q4 || 0),
        tci: Number(row?.tci || 0),
        journal: Number(row?.journal || 0),
        conference: Number(row?.conference || 0),
        unique_documents: Number(row?.unique_documents || 0),
      };
    });
    return map;
  }, [facultyQuartileHistory]);

  const fiscalHistoryByYear = useMemo(() => {
    const map = {};
    facultyQuartileHistoryFiscal.forEach((row) => {
      const year = Number(row?.publication_year || 0);
      if (!year) return;
      map[year] = {
        t1: Number(row?.t1 || 0),
        q1: Number(row?.q1 || 0),
        q2: Number(row?.q2 || 0),
        q3: Number(row?.q3 || 0),
        q4: Number(row?.q4 || 0),
        tci: Number(row?.tci || 0),
        journal: Number(row?.journal || 0),
        conference: Number(row?.conference || 0),
        unique_documents: Number(row?.unique_documents || 0),
      };
    });
    return map;
  }, [facultyQuartileHistoryFiscal]);

  const buildOverviewYearMetrics = useCallback((sourceMap) => {
    const teacherCount = Number(kpi.total_teachers_with_scopus || 0);
    return overviewYearsBE.reduce((acc, year) => {
      const bucket = sourceMap[year] || {};
      const t1 = Number(bucket.t1 || 0);
      const q1 = Number(bucket.q1 || 0);
      const q2 = Number(bucket.q2 || 0);
      const q3 = Number(bucket.q3 || 0);
      const q4 = Number(bucket.q4 || 0);
      const tci = Number(bucket.tci || 0);
      const conference = Number(bucket.conference || 0);
      const uniqueDocuments = Number(bucket.unique_documents || 0);
      const groupedTotal = t1 + q1 + q2 + q3 + q4;
      const worksWithQ = groupedTotal;
      const allNoTCI = groupedTotal + conference;
      const allWithTCI = allNoTCI + tci;
      const totalWithConferenceAndTCI = allWithTCI;
      const topTierT1Q1 = t1 + q1;

      acc[year] = {
        t1,
        q1,
        q2,
        q3,
        q4,
        tci,
        journal: Number(bucket.journal || 0),
        conference,
        groupedTotal,
        worksWithQ,
        allNoTCI,
        allWithTCI,
        topTierT1Q1,
        totalWithConferenceAndTCI,
        teacherCount,
        t1PerGrouped: worksWithQ > 0 ? t1 / worksWithQ : 0,
        q1PerGrouped: worksWithQ > 0 ? q1 / worksWithQ : 0,
        t1Q1PerGrouped: worksWithQ > 0 ? topTierT1Q1 / worksWithQ : 0,
        q1PerAllNoTCI: allNoTCI > 0 ? topTierT1Q1 / allNoTCI : 0,
        q1PerAllWithTCI: allWithTCI > 0 ? topTierT1Q1 / allWithTCI : 0,
        t1PerAllNoTCI: allNoTCI > 0 ? t1 / allNoTCI : 0,
        tciPerAllWithTCI: allWithTCI > 0 ? tci / allWithTCI : 0,
        q1PerAll: allNoTCI > 0 ? q1 / allNoTCI : 0,
        worksWithQPerTeacher: teacherCount > 0 ? worksWithQ / teacherCount : 0,
        allNoTCIPerTeacher: teacherCount > 0 ? allNoTCI / teacherCount : 0,
        allWithTCIPerTeacher: teacherCount > 0 ? allWithTCI / teacherCount : 0,
        allPerTeacher: teacherCount > 0 ? allWithTCI / teacherCount : 0,
      };
      return acc;
    }, {});
  }, [kpi.total_teachers_with_scopus, overviewYearsBE]);

  const overviewYearMetricsCalendar = useMemo(
    () => buildOverviewYearMetrics(calendarHistoryByYear),
    [buildOverviewYearMetrics, calendarHistoryByYear]
  );

  const overviewYearMetricsFiscal = useMemo(
    () => buildOverviewYearMetrics(fiscalHistoryByYear),
    [buildOverviewYearMetrics, fiscalHistoryByYear]
  );

  const formatRatio = useCallback((value) => Number(value || 0).toFixed(2), []);

  const overviewMetricFormulaByKey = useMemo(() => ({
    t1_per_q: {
      description: "สัดส่วน T1 เทียบกับผลงานกลุ่ม Q1-Q4",
      formula: "T1 / (T1+Q1+Q2+Q3+Q4)",
    },
    q1_per_q: {
      description: "สัดส่วน Q1 เทียบกับผลงานกลุ่ม Q1-Q4",
      formula: "Q1 / (T1+Q1+Q2+Q3+Q4)",
    },
    t1q1_per_q: {
      description: "สัดส่วน (T1+Q1) เทียบกับผลงานกลุ่ม Q1-Q4",
      formula: "(T1+Q1) / (T1+Q1+Q2+Q3+Q4)",
    },
    q1_per_all: {
      description: "สัดส่วน (T1+Q1) เทียบกับผลงานทุกประเภท (ไม่รวม TCI)",
      formula: "(T1+Q1) / (T1+Q1+Q2+Q3+Q4+Conference)",
    },
    q1_per_all_with_tci: {
      description: "สัดส่วน (T1+Q1) เทียบกับผลงานทุกประเภท (รวม TCI)",
      formula: "(T1+Q1) / (T1+Q1+Q2+Q3+Q4+Conference+TCI)",
    },
    t1_per_all_no_tci: {
      description: "สัดส่วน T1 เทียบกับผลงานทุกประเภท (ไม่รวม TCI)",
      formula: "T1 / (T1+Q1+Q2+Q3+Q4+Conference)",
    },
    tci_per_all_with_tci: {
      description: "สัดส่วน TCI เทียบกับผลงานทุกประเภท (รวม TCI)",
      formula: "TCI / (T1+Q1+Q2+Q3+Q4+Conference+TCI)",
    },
    works_q_per_teacher: {
      description: "ผลงานกลุ่ม T1-Q4 ต่อจำนวนอาจารย์",
      formula: "(T1+Q1+Q2+Q3+Q4) / จำนวนอาจารย์",
    },
    all_per_teacher: {
      description: "ผลงานทุกประเภทต่อจำนวนอาจารย์ (ไม่รวม TCI)",
      formula: "(T1+Q1+Q2+Q3+Q4+Conference) / จำนวนอาจารย์",
    },
    all_with_tci_per_teacher: {
      description: "ผลงานทุกประเภทต่อจำนวนอาจารย์ (รวม TCI)",
      formula: "(T1+Q1+Q2+Q3+Q4+Conference+TCI) / จำนวนอาจารย์",
    },
  }), []);

  const renderOverviewMetricLabel = useCallback((rowKey, label) => {
    const tip = overviewMetricFormulaByKey[rowKey];
    if (!tip) return label;

    return (
      <span className="group relative inline-flex items-center gap-1.5">
        <span>{label}</span>
        <button
          type="button"
          aria-label={`ดูสูตรคำนวณของ ${label}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-500 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
        >
          <CircleHelp size={14} />
        </button>
        <div className="pointer-events-none absolute left-full top-1/2 z-[120] ml-2 w-[320px] max-w-[360px] -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 shadow-xl opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          <p className="font-semibold text-slate-800">ความหมาย</p>
          <p className="mt-0.5 leading-relaxed">{tip.description}</p>
          <p className="mt-2 font-semibold text-slate-800">สูตรคำนวณ</p>
          <p className="mt-0.5 rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] leading-relaxed text-slate-900">
            {tip.formula}
          </p>
        </div>
      </span>
    );
  }, [overviewMetricFormulaByKey]);

  const getOverviewLabelZIndex = useCallback(
    (rowKey) => (hoveredOverviewMetricsRow === rowKey ? 110 : 20),
    [hoveredOverviewMetricsRow]
  );

  const documentChartOptions = useMemo(() => {
    const categories = documentTypeRows.map((row) => row.label);
    const totals = documentTypeRows.map((row) => Number(row.total || 0));
    const percents = documentTypeRows.map((row) => Number(ratioText(row.total).replace("%", "")));
    const documentPalette = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];

    if (documentChartView === "percent") {
      return {
        type: "bar",
        height: 300,
        series: [{ name: "สัดส่วน", data: percents }],
        options: {
          chart: { toolbar: { show: false } },
          plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "70%", distributed: true } },
          xaxis: {
            categories,
            max: 100,
            labels: { formatter: (value) => `${value}%` },
          },
          colors: documentPalette,
          dataLabels: {
            enabled: true,
            formatter: (value) => `${Number(value).toFixed(1)}%`,
            style: {
              colors: ["#ffffff"],
              fontSize: "12px",
              fontWeight: 600,
            },
            dropShadow: {
              enabled: true,
              top: 1,
              left: 1,
              blur: 2,
              color: "#000000",
              opacity: 0.4,
            },
          },
          tooltip: {
            y: {
              formatter: (value, ctx) => {
                const count = totals[ctx.dataPointIndex] || 0;
                return `${Number(value).toFixed(1)}% (${formatNumber(count)} เอกสาร)`;
              },
            },
          },
          grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
        },
      };
    }

    return {
      type: "bar",
      height: 300,
      series: [{ name: "จำนวนเอกสาร", data: totals }],
        options: {
          chart: { toolbar: { show: false } },
          plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "70%", distributed: true } },
          xaxis: {
            categories,
            max: undefined,
            labels: { formatter: (value) => formatNumber(value) },
          },
          colors: documentPalette,
          dataLabels: {
            enabled: true,
            formatter: (value) => formatNumber(value),
            style: {
              colors: ["#ffffff"],
              fontSize: "12px",
              fontWeight: 600,
            },
            dropShadow: {
              enabled: true,
              top: 1,
              left: 1,
              blur: 2,
              color: "#000000",
              opacity: 0.4,
            },
          },
        tooltip: {
          y: {
            formatter: (value, ctx) => `${formatNumber(value)} เอกสาร (${ratioText(totals[ctx.dataPointIndex])})`,
          },
        },
        grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
      },
    };
  }, [documentTypeRows, documentChartView, ratioText]);

  const quartileChartOptions = useMemo(() => {
    const rows = quartileRows;
    const labels = rows.map((row) => row.key);
    const totals = rows.map((row) => Number(row.total || 0));
    const percents = rows.map((row) => Number(ratioText(row.total).replace("%", "")));
    const colors = ["#7c3aed", "#2563eb", "#10b981", "#f59e0b", "#ef4444"];

    if (quartileChartView === "bar") {
      return {
        type: "bar",
        height: 300,
        series: [{ name: "จำนวนเอกสาร", data: totals }],
        options: {
          chart: { toolbar: { show: false } },
          plotOptions: { bar: { borderRadius: 6, columnWidth: "55%", distributed: true } },
          xaxis: { categories: labels },
          colors,
          dataLabels: {
            enabled: true,
            formatter: (value) => formatNumber(value),
            style: {
              colors: ["#ffffff"],
              fontSize: "12px",
              fontWeight: 600,
            },
            dropShadow: {
              enabled: true,
              top: 1,
              left: 1,
              blur: 2,
              color: "#000000",
              opacity: 0.4,
            },
          },
          tooltip: {
            y: {
              formatter: (value, ctx) => `${formatNumber(value)} เอกสาร (${ratioText(totals[ctx.dataPointIndex])})`,
            },
          },
          grid: { borderColor: "#e5e7eb", strokeDashArray: 3 },
        },
      };
    }

    return {
      type: "donut",
      height: 330,
      series: totals,
      options: {
        labels,
        chart: { toolbar: { show: false } },
        colors,
        legend: {
          position: "bottom",
          fontSize: "13px",
          itemMargin: { horizontal: 10, vertical: 6 },
          formatter: (seriesName, opts) => {
            const index = opts.seriesIndex;
            return `${seriesName} - ${percents[index].toFixed(1)}%`;
          },
        },
        dataLabels: {
          enabled: true,
          formatter: (value) => `${Number(value).toFixed(1)}%`,
          style: {
            fontSize: "12px",
            fontWeight: 700,
            colors: ["#ffffff"],
          },
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 2,
            color: "#000000",
            opacity: 0.45,
          },
        },
        tooltip: {
          y: {
            formatter: (value, ctx) => `${formatNumber(value)} เอกสาร (${percents[ctx.seriesIndex].toFixed(1)}%)`,
          },
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#334155",
                },
                value: {
                  show: true,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#0f172a",
                  formatter: (value) => formatNumber(value),
                },
                total: {
                  show: true,
                  label: "รวม",
                  fontSize: "13px",
                  color: "#64748b",
                  formatter: () => formatNumber(totals.reduce((sum, n) => sum + n, 0)),
                },
              },
            },
          },
        },
      },
    };
  }, [quartileRows, quartileChartView, ratioText]);

  return (
    <PageLayout
      title="แดชบอร์ดงานวิจัย"
      subtitle="ระดับคณะ / รายบุคคล"
      icon={BarChart3}
      breadcrumbs={[
        { label: "หน้าแรก", href: "/research-fund-system/admin" },
        { label: "แดชบอร์ดงานวิจัย" },
      ]}
    >
      <div className="space-y-6">
        <SimpleCard
          title="ตัวกรองข้อมูล"
          icon={SlidersHorizontal}
        >
          <div className="space-y-4">
            {optionsError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{optionsError}</p>
            )}

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="space-y-3">
                <div className="grid gap-3 xl:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">มุมมอง</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {scopeOptions.map((mode) => {
                        const checked = mode.value === draftFilters.scope;
                        return (
                          <label
                            key={mode.value}
                            className={`inline-flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition ${
                              checked
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name="scopus-scope"
                              value={mode.value}
                              checked={checked}
                              onChange={(event) => setDraftFilters((prev) => ({ ...prev, scope: event.target.value }))}
                              className="h-4 w-4 border-slate-300 text-blue-600"
                            />
                            <span className="font-medium">{mode.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">ช่วงปี (พ.ศ.)</p>
                    <div className="flex items-center gap-2">
                      <select
                        value={draftFilters.yearStartBE}
                        onChange={(event) => setDraftFilters((prev) => ({ ...prev, yearStartBE: event.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        disabled={loadingOptions}
                      >
                        <option value="">ปีเริ่มต้น</option>
                        {yearOptions.map((item) => (
                          <option key={`start-${item.value}`} value={String(item.value)}>{item.label}</option>
                        ))}
                      </select>
                      <span className="text-slate-400">-</span>
                      <select
                        value={draftFilters.yearEndBE}
                        onChange={(event) => setDraftFilters((prev) => ({ ...prev, yearEndBE: event.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        disabled={loadingOptions}
                      >
                        <option value="">ปีสิ้นสุด</option>
                        {yearOptions.map((item) => (
                          <option key={`end-${item.value}`} value={String(item.value)}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">ประเภทผลงาน</p>
                    <div className="grid grid-cols-4 gap-2">
                      {aggregationOptions.map((item) => {
                        const active = draftFilters.aggregationTypes.includes(item.value);
                        return (
                          <label
                            key={item.value}
                            className={`inline-flex h-10 min-w-0 w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs transition ${
                              active
                                ? "border-blue-500 bg-blue-100/60 text-blue-700"
                                : "border-blue-200 bg-white text-slate-700 hover:border-blue-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleMulti("aggregationTypes", item.value)}
                              className="h-3.5 w-3.5 border-slate-300 text-blue-600"
                            />
                            <span className="truncate whitespace-nowrap">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">คุณภาพวารสาร</p>
                    <div className="grid grid-cols-6 gap-2">
                      {qualityOptions.map((item) => {
                        const active = draftFilters.qualityBuckets.includes(item.value);
                        return (
                          <label
                            key={item.value}
                            className={`inline-flex h-10 min-w-0 w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs transition ${
                              active
                                ? "border-emerald-500 bg-emerald-100/60 text-emerald-700"
                                : "border-emerald-200 bg-white text-slate-700 hover:border-emerald-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={active}
                              onChange={() => toggleMulti("qualityBuckets", item.value)}
                              className="h-3.5 w-3.5 border-slate-300 text-emerald-600"
                            />
                            <span className="truncate whitespace-nowrap">{(String(item.value || "").trim().toUpperCase() === "T1" || String(item.label || "").trim().toUpperCase().startsWith("T1")) ? "T1" : item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex min-w-0 flex-1 items-start gap-2 text-xs text-slate-600">
                <Filter size={14} className="mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-700">ตัวกรองปัจจุบัน:</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {appliedFilterSummaryItems.map((item) => (
                      <span key={item.key} className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700">
                        <span className="font-semibold text-slate-600">{item.label}:</span>
                        <span className="truncate">{item.value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  disabled={loadingSummary}
                >
                  ล้างตัวกรอง
                </button>

                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={loadingSummary || loadingOptions}
                >
                  <RefreshCw size={14} className={loadingSummary ? "animate-spin" : ""} />
                  ใช้ตัวกรอง
                </button>
              </div>
            </div>
          </div>
        </SimpleCard>

        {summaryError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {summaryError}
          </p>
        )}

        {!isFacultyOverview && (
          <SimpleCard
            title="สรุปรายบุคคล (Person Summary)"
            action={(
              <button
                type="button"
                onClick={togglePersonSummaryCollapsed}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <span>{isPersonSummaryCollapsed ? "แสดง" : "ซ่อน"}</span>
                {isPersonSummaryCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          >
            {!isPersonSummaryCollapsed && (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 xl:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ค้นหา (ชื่อ / อีเมล / Scopus ID)
                      </label>
                      <input
                        type="text"
                        value={personSummarySearch}
                        onChange={(event) => setPersonSummarySearch(event.target.value)}
                        placeholder="พิมพ์ชื่อ อีเมล หรือ Scopus ID"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />

                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={resetPersonSearch}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          รีเซ็ตค้นหา
                        </button>
                        <button
                          type="button"
                          onClick={resetPersonSort}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          คืนค่า Sort เริ่มต้น
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPersonColumnPreset("executive")}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          มุมมองผู้บริหาร
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPersonColumnPreset("quartile")}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          มุมมอง Quartile
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPersonColumnPreset("analyst")}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
                        >
                          มุมมองวิเคราะห์
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">ผลลัพธ์ที่พบ</p>
                          <p className="text-xl font-semibold leading-none text-slate-900">{formatNumber(personSummaryFilteredRows.length)} <span className="text-xs font-medium text-slate-500">คน</span></p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">คอลัมน์ที่แสดง</p>
                          <p className="text-xl font-semibold leading-none text-slate-900">{visiblePersonColumnsCount} <span className="text-xs font-medium text-slate-500">/ {PERSON_ALL_COLUMNS.length}</span></p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">เรียงลำดับ</p>
                          <p className="text-sm font-semibold leading-tight text-slate-900">{personSortLabel} <span className="text-xs font-medium text-slate-500">({personSort.direction === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})</span></p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">คอลัมน์ที่แสดง</p>
                        <button
                          type="button"
                          onClick={showAllPersonColumns}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          เลือกทั้งหมด
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">ข้อมูลหลัก</p>
                            <label className="inline-flex items-center gap-1 text-xs text-blue-700">
                              <input
                                type="checkbox"
                                checked={isMainGroupChecked}
                                onChange={(event) => togglePersonColumnGroup([...PERSON_BASE_COLUMNS, ...PERSON_TIME_COLUMNS], event.target.checked)}
                                className="h-3.5 w-3.5"
                              />
                              <span>ทั้งกลุ่ม</span>
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[...PERSON_BASE_COLUMNS, ...PERSON_TIME_COLUMNS].map((col) => (
                              <label key={col.key} className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={Boolean(personColumnVisibility[col.key])}
                                  onChange={() => togglePersonColumn(col.key)}
                                  className="h-3.5 w-3.5"
                                />
                                <span>{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-violet-200 bg-violet-50 p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">กลุ่ม Quartile</p>
                            <label className="inline-flex items-center gap-1 text-xs text-violet-700">
                              <input
                                type="checkbox"
                                checked={isQuartileGroupChecked}
                                onChange={(event) => togglePersonColumnGroup(PERSON_QUARTILE_COLUMNS, event.target.checked)}
                                className="h-3.5 w-3.5"
                              />
                              <span>ทั้งกลุ่ม</span>
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {PERSON_QUARTILE_COLUMNS.map((col) => (
                              <label key={col.key} className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-white px-2 py-1 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={Boolean(personColumnVisibility[col.key])}
                                  onChange={() => togglePersonColumn(col.key)}
                                  className="h-3.5 w-3.5"
                                />
                                <span>{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">กลุ่มประเภทแหล่งตีพิมพ์</p>
                            <label className="inline-flex items-center gap-1 text-xs text-emerald-700">
                              <input
                                type="checkbox"
                                checked={isSourceGroupChecked}
                                onChange={(event) => togglePersonColumnGroup(PERSON_SOURCE_COLUMNS, event.target.checked)}
                                className="h-3.5 w-3.5"
                              />
                              <span>ทั้งกลุ่ม</span>
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {PERSON_SOURCE_COLUMNS.map((col) => (
                              <label key={col.key} className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={Boolean(personColumnVisibility[col.key])}
                                  onChange={() => togglePersonColumn(col.key)}
                                  className="h-3.5 w-3.5"
                                />
                                <span>{col.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-slate-700">
                        <th rowSpan={hasGroupedPersonColumns ? 2 : 1} className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-center text-indigo-800">ลำดับ</th>
                        {visiblePersonBaseColumns.map((col) => (
                          <th
                            key={col.key}
                            rowSpan={hasGroupedPersonColumns ? 2 : 1}
                            onClick={() => handlePersonSort(col.key)}
                            className={`cursor-pointer border border-blue-200 bg-blue-50 px-3 py-2 text-blue-800 ${col.align === "right" ? "text-right" : "text-left"}`}
                          >
                            <span className="inline-flex items-center gap-1">{col.label}<span className="text-[10px] text-blue-600">{personSortIndicator(col.key)}</span></span>
                          </th>
                        ))}
                        {visiblePersonQuartileColumns.length > 0 && (
                          <th colSpan={visiblePersonQuartileColumns.length} className="border border-violet-200 bg-violet-50 px-3 py-2 text-center text-violet-800">กลุ่ม Quartile</th>
                        )}
                        {visiblePersonSourceColumns.length > 0 && (
                          <th colSpan={visiblePersonSourceColumns.length} className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-800">กลุ่มประเภทแหล่งตีพิมพ์</th>
                        )}
                        {visiblePersonTimeColumns.map((col) => (
                          <th
                            key={col.key}
                            rowSpan={hasGroupedPersonColumns ? 2 : 1}
                            onClick={() => handlePersonSort(col.key)}
                            className="cursor-pointer border border-amber-200 bg-amber-50 px-3 py-2 text-right text-amber-800"
                          >
                            <span className="inline-flex items-center gap-1">{col.label}<span className="text-[10px] text-amber-600">{personSortIndicator(col.key)}</span></span>
                          </th>
                        ))}
                      </tr>
                      {hasGroupedPersonColumns && (
                        <tr className="text-slate-700">
                          {visiblePersonQuartileColumns.map((col) => (
                            <th
                              key={col.key}
                              onClick={() => handlePersonSort(col.key)}
                              className="cursor-pointer border border-violet-200 bg-violet-50 px-3 py-2 text-right text-violet-800"
                            >
                              <span className="inline-flex items-center gap-1">{col.label}<span className="text-[10px] text-violet-600">{personSortIndicator(col.key)}</span></span>
                            </th>
                          ))}
                          {visiblePersonSourceColumns.map((col) => (
                            <th
                              key={col.key}
                              onClick={() => handlePersonSort(col.key)}
                              className="cursor-pointer border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-emerald-800"
                            >
                              <span className="inline-flex items-center gap-1">{col.label}<span className="text-[10px] text-emerald-600">{personSortIndicator(col.key)}</span></span>
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {personSummaryFilteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={1 + visiblePersonBaseColumns.length + visiblePersonQuartileColumns.length + visiblePersonSourceColumns.length + visiblePersonTimeColumns.length} className="border border-slate-200 px-3 py-4 text-center text-slate-500">ไม่พบข้อมูล</td>
                        </tr>
                      ) : (
                        personSummaryFilteredRows.map((row, index) => (
                          <tr
                            key={`${row.user_id}-${index}`}
                            onClick={() => setSelectedPersonSummaryRow((prev) => (prev === `${row.user_id}-${index}` ? "" : `${row.user_id}-${index}`))}
                            className={`cursor-pointer transition-colors ${
                              selectedPersonSummaryRow === `${row.user_id}-${index}`
                                ? "bg-amber-100"
                                : index % 2 === 0
                                  ? "bg-white hover:bg-sky-50"
                                  : "bg-slate-50 hover:bg-sky-50"
                            }`}
                          >
                            <td className="border border-slate-200 px-3 py-2 text-center">{index + 1}</td>
                            {visiblePersonBaseColumns.map((col) => {
                              const value = row?.[col.key];
                              let displayValue = value;
                              if (col.key === "avg_cited_by") displayValue = Number(value || 0).toFixed(2);
                              if (col.key === "first_year" || col.key === "latest_year") displayValue = Number(value || 0) > 0 ? value : "-";
                              if (["publication_rows", "unique_documents", "cited_by_total", "active_years"].includes(col.key)) {
                                displayValue = formatNumber(value || 0);
                              }
                              return (
                                <td key={col.key} className={`border border-slate-200 px-3 py-2 ${col.align === "right" ? "text-right" : "text-left"} ${col.key === "user_name" ? "font-medium text-slate-700" : ""}`}>
                                  {displayValue || "-"}
                                </td>
                              );
                            })}
                            {visiblePersonQuartileColumns.map((col) => (
                              <td key={col.key} className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row?.[col.key] || 0)}</td>
                            ))}
                            {visiblePersonSourceColumns.map((col) => (
                              <td key={col.key} className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row?.[col.key] || 0)}</td>
                            ))}
                            {visiblePersonTimeColumns.map((col) => {
                              const value = row?.[col.key];
                              let displayValue = value;
                              if (col.key === "first_year" || col.key === "latest_year") displayValue = Number(value || 0) > 0 ? value : "-";
                              if (col.key === "active_years") displayValue = formatNumber(value || 0);
                              return (
                                <td key={col.key} className="border border-slate-200 px-3 py-2 text-right">{displayValue || "-"}</td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SimpleCard>
        )}

        {!isFacultyOverview && (
          <SimpleCard
            title="เมทริกซ์รายปีรายบุคคล (Person Year Matrix)"
            action={(
              <button
                type="button"
                onClick={togglePersonMatrixCollapsed}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <span>{isPersonMatrixCollapsed ? "แสดง" : "ซ่อน"}</span>
                {isPersonMatrixCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          >
            {!isPersonMatrixCollapsed && (
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 xl:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ค้นหา (ชื่อ / อีเมล / Scopus ID)
                      </label>
                      <input
                        type="text"
                        value={personMatrixSearch}
                        onChange={(event) => setPersonMatrixSearch(event.target.value)}
                        placeholder="พิมพ์ชื่อ อีเมล หรือ Scopus ID"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />

                      <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                        <span className="mr-4">ช่วงปีที่แสดง: <span className="font-semibold text-slate-800">{personMatrixVisibleYears.length ? `${personMatrixVisibleYears[0]} - ${personMatrixVisibleYears[personMatrixVisibleYears.length - 1]}` : "-"}</span></span>
                        <span className="mr-4">ผลลัพธ์ที่พบ: <span className="font-semibold text-slate-800">{formatNumber(personMatrixFilteredRows.length)}</span> คน</span>
                        <span>เรียงลำดับ: <span className="font-semibold text-slate-800">{personMatrixSort.key.startsWith("year:") ? personMatrixSort.key.replace("year:", "ปี ") : PERSON_MATRIX_IDENTITY_COLUMNS.find((col) => col.key === personMatrixSort.key)?.label || personMatrixSort.key}</span> ({personMatrixSort.direction === "asc" ? "น้อยไปมาก" : "มากไปน้อย"})</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ปีเริ่มต้น (พ.ศ.)</label>
                          <select
                            value={personMatrixYearStart}
                            onChange={(event) => setPersonMatrixYearStart(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="">ทั้งหมด</option>
                            {personYearMatrixYears.map((year) => (
                              <option key={`matrix-start-${year}`} value={String(year)}>{year}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">ปีสิ้นสุด (พ.ศ.)</label>
                          <select
                            value={personMatrixYearEnd}
                            onChange={(event) => setPersonMatrixYearEnd(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          >
                            <option value="">ทั้งหมด</option>
                            {personYearMatrixYears.map((year) => (
                              <option key={`matrix-end-${year}`} value={String(year)}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">คอลัมน์ข้อมูลบุคคล</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {PERSON_MATRIX_IDENTITY_COLUMNS.map((col) => (
                            <label key={col.key} className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-1 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={Boolean(personMatrixIdentityVisibility[col.key])}
                                onChange={() => togglePersonMatrixIdentityColumn(col.key)}
                                className="h-3.5 w-3.5"
                              />
                              <span>{col.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-slate-700">
                        <th
                          className="border border-blue-200 bg-blue-50 px-3 py-2 text-center text-blue-800"
                          style={{
                            minWidth: `${PERSON_MATRIX_RANK_WIDTH}px`,
                            width: `${PERSON_MATRIX_RANK_WIDTH}px`,
                            position: "sticky",
                            left: "0px",
                            zIndex: 30,
                          }}
                        >
                          ลำดับ
                        </th>
                        {visiblePersonMatrixIdentityColumns.map((col) => (
                          <th
                            key={col.key}
                            onClick={() => handlePersonMatrixSort(col.key)}
                            className="cursor-pointer border border-blue-200 bg-blue-50 px-3 py-2 text-left text-blue-800"
                            style={{
                              minWidth: `${PERSON_MATRIX_STICKY_WIDTHS[col.key] || 180}px`,
                              position: "sticky",
                              left: `${personMatrixStickyLeftByKey[col.key] || 0}px`,
                              zIndex: 20,
                            }}
                          >
                            <span className="inline-flex items-center gap-1">{col.label}<span className="text-[10px] text-blue-600">{personMatrixSortIndicator(col.key)}</span></span>
                          </th>
                        ))}
                        {personMatrixVisibleYears.map((year) => (
                          <th
                            key={year}
                            onClick={() => handlePersonMatrixSort(`year:${year}`)}
                            className="cursor-pointer border border-sky-200 bg-sky-50 px-3 py-2 text-right text-sky-800"
                          >
                            <span className="inline-flex items-center gap-1">{year}<span className="text-[10px] text-sky-600">{personMatrixSortIndicator(`year:${year}`)}</span></span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {personMatrixFilteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={Math.max(1, 1 + visiblePersonMatrixIdentityColumns.length + personMatrixVisibleYears.length)} className="border border-slate-200 px-3 py-4 text-center text-slate-500">ไม่พบข้อมูล</td>
                        </tr>
                      ) : (
                        personMatrixFilteredRows.map((row, index) => {
                          const rowKey = `${row.user_id}-${index}`;
                          const stickyBgClass = selectedPersonMatrixRow === rowKey
                            ? "bg-amber-100"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50";
                          return (
                            <tr
                              key={rowKey}
                              onClick={() => setSelectedPersonMatrixRow((prev) => (prev === rowKey ? "" : rowKey))}
                              className={`cursor-pointer transition-colors ${
                                selectedPersonMatrixRow === rowKey
                                  ? "bg-amber-100"
                                  : index % 2 === 0
                                    ? "bg-white hover:bg-sky-50"
                                    : "bg-slate-50 hover:bg-sky-50"
                              }`}
                            >
                              <td
                                className={`border border-slate-200 px-3 py-2 text-center ${stickyBgClass}`}
                                style={{
                                  minWidth: `${PERSON_MATRIX_RANK_WIDTH}px`,
                                  width: `${PERSON_MATRIX_RANK_WIDTH}px`,
                                  position: "sticky",
                                  left: "0px",
                                  zIndex: 20,
                                }}
                              >
                                {index + 1}
                              </td>
                              {visiblePersonMatrixIdentityColumns.map((col) => {
                                return (
                                  <td
                                    key={`${rowKey}-${col.key}`}
                                    className={`border border-slate-200 px-3 py-2 text-left ${col.key === "user_name" ? "font-medium text-slate-700" : ""} ${stickyBgClass}`}
                                    style={{
                                      minWidth: `${PERSON_MATRIX_STICKY_WIDTHS[col.key] || 180}px`,
                                      position: "sticky",
                                      left: `${personMatrixStickyLeftByKey[col.key] || 0}px`,
                                      zIndex: 10,
                                    }}
                                  >
                                    {row?.[col.key] || "-"}
                                  </td>
                                );
                              })}
                              {personMatrixVisibleYears.map((year) => {
                                const count = row?.year_counts?.[String(year)] || 0;
                                return (
                                  <td key={`${rowKey}-${year}`} className="border border-slate-200 px-3 py-2 text-right">{formatNumber(count)}</td>
                                );
                              })}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </SimpleCard>
        )}

        {!isFacultyOverview && (
          <SimpleCard
            title="ความร่วมมือภายใน (Internal Collaboration)"
            action={(
              <button
                type="button"
                onClick={toggleInternalCollabCollapsed}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <span>{isInternalCollabCollapsed ? "แสดง" : "ซ่อน"}</span>
                {isInternalCollabCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          >
            {!isInternalCollabCollapsed && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">ตารางคู่ความร่วมมือภายใน (Internal Collaboration Pair) แบบ canonical pair (A-B ไม่นับซ้ำ B-A)</p>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        ค้นหาอาจารย์
                      </label>
                      <input
                        type="text"
                        value={internalCollabSearch}
                        onChange={(event) => setInternalCollabSearch(event.target.value)}
                        placeholder="พิมพ์ชื่ออาจารย์ A หรือ B"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        จำนวนเอกสารร่วมขั้นต่ำ
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={internalCollabMinShared}
                        onChange={(event) => setInternalCollabMinShared(event.target.value)}
                        placeholder="เช่น 2"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        แถวต่อหน้า
                      </label>
                      <select
                        value={internalCollabPageSize}
                        onChange={(event) => setInternalCollabPageSize(Number(event.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        {[10, 25, 50, 100].map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                    <span className="mr-4">ผลลัพธ์ที่พบ: <span className="font-semibold text-slate-800">{formatNumber(internalCollabFilteredRows.length)}</span> คู่</span>
                    <span>หน้า: <span className="font-semibold text-slate-800">{internalCollabPage}</span> / {internalCollabTotalPages}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-slate-700">
                        <th className="border border-blue-200 bg-blue-50 px-3 py-2 text-center text-blue-800">ลำดับ</th>
                        <th
                          onClick={() => handleInternalCollabSort("user_a")}
                          className="cursor-pointer border border-blue-200 bg-blue-50 px-3 py-2 text-left text-blue-800"
                        >
                          <span className="inline-flex items-center gap-1">อาจารย์ A <span className="text-[10px] text-blue-600">{internalCollabSortIndicator("user_a")}</span></span>
                        </th>
                        <th
                          onClick={() => handleInternalCollabSort("user_b")}
                          className="cursor-pointer border border-blue-200 bg-blue-50 px-3 py-2 text-left text-blue-800"
                        >
                          <span className="inline-flex items-center gap-1">อาจารย์ B <span className="text-[10px] text-blue-600">{internalCollabSortIndicator("user_b")}</span></span>
                        </th>
                        <th
                          onClick={() => handleInternalCollabSort("shared_documents")}
                          className="cursor-pointer border border-blue-200 bg-blue-50 px-3 py-2 text-right text-blue-800"
                        >
                          <span className="inline-flex items-center gap-1">ผลงานร่วมกัน (เอกสารไม่ซ้ำ) <span className="text-[10px] text-blue-600">{internalCollabSortIndicator("shared_documents")}</span></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {internalCollabPageRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border border-slate-200 px-3 py-4 text-center text-slate-500">ไม่พบข้อมูล</td>
                        </tr>
                      ) : (
                        internalCollabPageRows.map((row, index) => {
                          const rowKey = `${row.user_a_id}-${row.user_b_id}-${index}`;
                          const rowNumber = (internalCollabPage - 1) * internalCollabPageSize + index + 1;
                          return (
                            <tr
                              key={rowKey}
                              onClick={() => setSelectedInternalCollabRow((prev) => (prev === rowKey ? "" : rowKey))}
                              className={`cursor-pointer transition-colors ${
                                selectedInternalCollabRow === rowKey
                                  ? "bg-amber-100"
                                  : index % 2 === 0
                                    ? "bg-white hover:bg-sky-50"
                                    : "bg-slate-50 hover:bg-sky-50"
                              }`}
                            >
                              <td className="border border-slate-200 px-3 py-2 text-center">{rowNumber}</td>
                              <td className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{row.user_a || "-"}</td>
                              <td className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{row.user_b || "-"}</td>
                              <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.shared_documents || 0)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setInternalCollabPage((prev) => Math.max(1, prev - 1))}
                    disabled={internalCollabPage <= 1}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    type="button"
                    onClick={() => setInternalCollabPage((prev) => Math.min(internalCollabTotalPages, prev + 1))}
                    disabled={internalCollabPage >= internalCollabTotalPages}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </SimpleCard>
        )}

        {isFacultyOverview && (
          <>
          <SimpleCard
            title="ภาพรวม (Overview)"
            action={(
              <button
                type="button"
                onClick={toggleOverviewCollapsed}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <span>{isOverviewCollapsed ? "แสดง" : "ซ่อน"}</span>
                {isOverviewCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          >
            {!isOverviewCollapsed && <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
                  <p className="text-xs text-teal-700">จำนวนอาจารย์ในคณะ</p>
                  <p className="mt-2 text-right text-2xl font-semibold text-teal-900">{formatNumber(kpi.total_teachers_with_scopus || 0)}</p>
                </div>
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs text-indigo-700">จำนวนผลงานทั้งหมด (Unique Document)</p>
                  <p className="mt-2 text-right text-2xl font-semibold text-indigo-900">{formatNumber(kpi.total_documents || 0)}</p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs text-amber-700">จำนวน Citation ทั้งหมด (Total Citation)</p>
                  <p className="mt-2 text-right text-2xl font-semibold text-amber-900">{formatNumber(kpi.total_citations || 0)}</p>
                </div>
                <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                  <p className="text-xs text-sky-700">ช่วงปีผลงาน (Publication Year Range)</p>
                  <p className="mt-2 text-right text-2xl font-semibold text-sky-900">{publicationYearRangeLabel}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">จำนวนบทความที่เผยแพร่</p>
                </div>
                {overviewYearsBE.length === 0 ? (
                  <p className="text-sm text-slate-500">ไม่พบข้อมูลรายปี</p>
                ) : (
                  <>
                  <div className="overflow-x-auto overflow-y-hidden">
                    <table className="min-w-[980px] border-collapse text-sm">
                      <thead>
                        <tr className="text-slate-700">
                          <th
                            className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-indigo-800 whitespace-nowrap"
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 30,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          />
                          <th colSpan={overviewYearsBE.length} className="border border-blue-200 bg-blue-50 px-3 py-2 text-center text-blue-800">
                            ปีปฏิทิน (ม.ค. - ธ.ค.)
                          </th>
                          <th colSpan={overviewYearsBE.length} className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-800">
                            ปีงบประมาณ (ต.ค. - ก.ย.)
                          </th>
                        </tr>
                        <tr className="text-slate-700">
                          <th
                            className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-indigo-800 whitespace-nowrap"
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 30,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            รายการ
                          </th>
                          {overviewYearsBE.map((year) => (
                            <th key={`cal-${year}`} className="border border-blue-200 bg-blue-50 px-3 py-2 text-center text-blue-800">{year}</th>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <th key={`fy-${year}`} className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-800">{year}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "t1" ? "" : "t1"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "t1" ? "bg-amber-100" : "hover:bg-sky-50"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-nowrap ${selectedOverviewMetricsRow === "t1" ? "bg-amber-100" : "bg-slate-50"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            T1 (90-100)
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-t1-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsCalendar[year]?.t1 || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-t1-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsFiscal[year]?.t1 || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "q1" ? "" : "q1"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "q1" ? "bg-amber-100" : "hover:bg-sky-50"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-nowrap ${selectedOverviewMetricsRow === "q1" ? "bg-amber-100" : "bg-slate-50"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            Q1 (75-89)
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-q1-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsCalendar[year]?.q1 || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-q1-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsFiscal[year]?.q1 || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "q2" ? "" : "q2"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "q2" ? "bg-amber-100" : "hover:bg-sky-50"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-nowrap ${selectedOverviewMetricsRow === "q2" ? "bg-amber-100" : "bg-slate-50"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            Q2 (50-74)
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-q2-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsCalendar[year]?.q2 || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-q2-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsFiscal[year]?.q2 || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "q3" ? "" : "q3"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "q3" ? "bg-amber-100" : "hover:bg-sky-50"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-nowrap ${selectedOverviewMetricsRow === "q3" ? "bg-amber-100" : "bg-slate-50"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            Q3 (25-49)
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-q3-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsCalendar[year]?.q3 || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-q3-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsFiscal[year]?.q3 || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "q4" ? "" : "q4"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "q4" ? "bg-amber-100" : "hover:bg-sky-50"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-nowrap ${selectedOverviewMetricsRow === "q4" ? "bg-amber-100" : "bg-slate-50"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            Q4 (0-24)
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-q4-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsCalendar[year]?.q4 || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-q4-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsFiscal[year]?.q4 || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "tci" ? "" : "tci"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "tci" ? "bg-amber-100" : "hover:bg-sky-50"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-nowrap ${selectedOverviewMetricsRow === "tci" ? "bg-amber-100" : "bg-slate-50"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            TCI
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-tci-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsCalendar[year]?.tci || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-tci-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsFiscal[year]?.tci || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "conference" ? "" : "conference"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "conference" ? "bg-amber-100" : "hover:bg-sky-50"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium text-slate-700 whitespace-nowrap ${selectedOverviewMetricsRow === "conference" ? "bg-amber-100" : "bg-slate-50"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            Conference Proceeding
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-conf-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsCalendar[year]?.conference || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-conf-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right">{formatNumber(overviewYearMetricsFiscal[year]?.conference || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "total" ? "" : "total"))}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "total" ? "bg-amber-100" : "bg-indigo-50 hover:bg-indigo-100/70"}`}
                        >
                          <td
                            className={`border border-indigo-200 px-3 py-2 font-semibold text-indigo-900 whitespace-nowrap ${selectedOverviewMetricsRow === "total" ? "bg-amber-100" : "bg-indigo-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: 20,
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            รวม
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-total-${year}`} className="border border-blue-200 bg-blue-100/70 px-3 py-2 text-right font-semibold text-blue-900">{formatNumber(overviewYearMetricsCalendar[year]?.totalWithConferenceAndTCI || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-total-${year}`} className="border border-emerald-200 bg-emerald-100/70 px-3 py-2 text-right font-semibold text-emerald-900">{formatNumber(overviewYearMetricsFiscal[year]?.totalWithConferenceAndTCI || 0)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td colSpan={1 + overviewYearsBE.length * 2} className="border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                            กลุ่มสัดส่วนในผลงาน Q1-Q4
                          </td>
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "t1_per_q" ? "" : "t1_per_q"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("t1_per_q")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "t1_per_q" ? "bg-amber-100 text-slate-900" : "bg-violet-50/60 text-slate-800 hover:bg-violet-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "t1_per_q" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("t1_per_q"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("t1_per_q", "ร้อยละของ T1 ต่อ จำนวนผลงาน Q1-Q4")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-t1g-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.t1PerGrouped || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-t1g-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.t1PerGrouped || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "q1_per_q" ? "" : "q1_per_q"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("q1_per_q")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "q1_per_q" ? "bg-amber-100 text-slate-900" : "bg-violet-50/60 text-slate-800 hover:bg-violet-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "q1_per_q" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("q1_per_q"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("q1_per_q", "ร้อยละของ Q1 ต่อ จำนวนผลงาน Q1-Q4")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-q1g-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.q1PerGrouped || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-q1g-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.q1PerGrouped || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "t1q1_per_q" ? "" : "t1q1_per_q"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("t1q1_per_q")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "t1q1_per_q" ? "bg-amber-100 text-slate-900" : "bg-violet-50/60 text-slate-800 hover:bg-violet-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "t1q1_per_q" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("t1q1_per_q"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("t1q1_per_q", "ร้อยละของ (T1+Q1) ต่อ จำนวนผลงาน Q1-Q4")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-t1q1g-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.t1Q1PerGrouped || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-t1q1g-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.t1Q1PerGrouped || 0)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td colSpan={1 + overviewYearsBE.length * 2} className="border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                            กลุ่มสัดส่วนเทียบผลงานทุกประเภท
                          </td>
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "q1_per_all" ? "" : "q1_per_all"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("q1_per_all")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "q1_per_all" ? "bg-amber-100 text-slate-900" : "bg-blue-50/60 text-slate-800 hover:bg-blue-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "q1_per_all" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("q1_per_all"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("q1_per_all", "ร้อยละของ (T1+Q1) ต่อ จำนวนผลงานทุกประเภท (ไม่รวม TCI)")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-q1all-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.q1PerAllNoTCI || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-q1all-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.q1PerAllNoTCI || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "q1_per_all_with_tci" ? "" : "q1_per_all_with_tci"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("q1_per_all_with_tci")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "q1_per_all_with_tci" ? "bg-amber-100 text-slate-900" : "bg-blue-50/60 text-slate-800 hover:bg-blue-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "q1_per_all_with_tci" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("q1_per_all_with_tci"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("q1_per_all_with_tci", "ร้อยละของ (T1+Q1) ต่อ จำนวนผลงานทุกประเภท (รวม TCI)")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-q1allwithtci-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.q1PerAllWithTCI || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-q1allwithtci-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.q1PerAllWithTCI || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "t1_per_all_no_tci" ? "" : "t1_per_all_no_tci"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("t1_per_all_no_tci")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "t1_per_all_no_tci" ? "bg-amber-100 text-slate-900" : "bg-blue-50/60 text-slate-800 hover:bg-blue-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "t1_per_all_no_tci" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("t1_per_all_no_tci"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("t1_per_all_no_tci", "ร้อยละของ T1 ต่อ จำนวนผลงานทุกประเภท (ไม่รวม TCI)")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-t1allnotci-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.t1PerAllNoTCI || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-t1allnotci-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.t1PerAllNoTCI || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "tci_per_all_with_tci" ? "" : "tci_per_all_with_tci"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("tci_per_all_with_tci")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "tci_per_all_with_tci" ? "bg-amber-100 text-slate-900" : "bg-blue-50/60 text-slate-800 hover:bg-blue-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "tci_per_all_with_tci" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("tci_per_all_with_tci"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("tci_per_all_with_tci", "ร้อยละของ TCI ต่อ จำนวนผลงานทุกประเภท (รวม TCI)")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-tciallwithtci-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.tciPerAllWithTCI || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-tciallwithtci-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.tciPerAllWithTCI || 0)}</td>
                          ))}
                        </tr>
                        <tr>
                          <td colSpan={1 + overviewYearsBE.length * 2} className="border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                            กลุ่มสัดส่วนเทียบจำนวนอาจารย์
                          </td>
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "works_q_per_teacher" ? "" : "works_q_per_teacher"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("works_q_per_teacher")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "works_q_per_teacher" ? "bg-amber-100 text-slate-900" : "bg-emerald-50/60 text-slate-800 hover:bg-emerald-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "works_q_per_teacher" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("works_q_per_teacher"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("works_q_per_teacher", "ร้อยละของจำนวนผลงาน T1-Q4 ต่อจำนวนอาจารย์")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-worksqteacher-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.worksWithQPerTeacher || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-worksqteacher-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.worksWithQPerTeacher || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "all_per_teacher" ? "" : "all_per_teacher"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("all_per_teacher")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "all_per_teacher" ? "bg-amber-100 text-slate-900" : "bg-emerald-50/60 text-slate-800 hover:bg-emerald-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "all_per_teacher" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("all_per_teacher"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("all_per_teacher", "ร้อยละผลงานทุกประเภทต่อ จำนวนอาจารย์ (ไม่รวม TCI)")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-allteacher-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.allNoTCIPerTeacher || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-allteacher-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.allNoTCIPerTeacher || 0)}</td>
                          ))}
                        </tr>
                        <tr
                          onClick={() => setSelectedOverviewMetricsRow((prev) => (prev === "all_with_tci_per_teacher" ? "" : "all_with_tci_per_teacher"))}
                          onMouseEnter={() => setHoveredOverviewMetricsRow("all_with_tci_per_teacher")}
                          onMouseLeave={() => setHoveredOverviewMetricsRow("")}
                          className={`cursor-pointer transition-colors ${selectedOverviewMetricsRow === "all_with_tci_per_teacher" ? "bg-amber-100 text-slate-900" : "bg-emerald-50/60 text-slate-800 hover:bg-emerald-100/70"}`}
                        >
                          <td
                            className={`border border-slate-300 px-3 py-2 font-medium whitespace-nowrap ${selectedOverviewMetricsRow === "all_with_tci_per_teacher" ? "bg-amber-100" : "bg-slate-100"}`}
                            style={{
                              position: "sticky",
                              left: "0px",
                              zIndex: getOverviewLabelZIndex("all_with_tci_per_teacher"),
                              minWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              width: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                              maxWidth: `${OVERVIEW_METRICS_LABEL_WIDTH}px`,
                            }}
                          >
                            {renderOverviewMetricLabel("all_with_tci_per_teacher", "ร้อยละผลงานทุกประเภทต่อ จำนวนอาจารย์ (รวม TCI)")}
                          </td>
                          {overviewYearsBE.map((year) => (
                            <td key={`cal-allwithtci-teacher-${year}`} className="border border-blue-100 bg-blue-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsCalendar[year]?.allWithTCIPerTeacher || 0)}</td>
                          ))}
                          {overviewYearsBE.map((year) => (
                            <td key={`fy-allwithtci-teacher-${year}`} className="border border-emerald-100 bg-emerald-50/30 px-3 py-2 text-right font-semibold">{formatRatio(overviewYearMetricsFiscal[year]?.allWithTCIPerTeacher || 0)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">อัปเดตล่าสุด: <span className="font-medium text-slate-700">{latestScopusPullLabel}</span></p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">ประเภทผลงาน (Document Type - Aggregation)</p>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setDocumentChartView("bar")}
                        className={`rounded-md px-2 py-1 ${documentChartView === "bar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                      >
                        จำนวน
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocumentChartView("percent")}
                        className={`rounded-md px-2 py-1 ${documentChartView === "percent" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                      >
                        สัดส่วน
                      </button>
                    </div>
                  </div>
                  {documentTypeRows.length === 0 ? (
                    <p className="text-sm text-slate-500">ไม่พบข้อมูล</p>
                  ) : (
                    <ApexChart
                      key={`doc-${documentChartView}`}
                      type={documentChartOptions.type}
                      options={documentChartOptions.options}
                      series={documentChartOptions.series}
                      height={documentChartOptions.height}
                    />
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">Quartile (T1-Q4)</p>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setQuartileChartView("donut")}
                        className={`rounded-md px-2 py-1 ${quartileChartView === "donut" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                      >
                        โดนัท
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuartileChartView("bar")}
                        className={`rounded-md px-2 py-1 ${quartileChartView === "bar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}
                      >
                        แท่ง
                      </button>
                    </div>
                  </div>
                  <ApexChart
                    key={`quartile-${quartileChartView}`}
                    type={quartileChartOptions.type}
                    options={quartileChartOptions.options}
                    series={quartileChartOptions.series}
                    height={quartileChartOptions.height}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">แหล่งตีพิมพ์สูงสุด (Top Publication Sources)</p>
                    <button
                      type="button"
                      onClick={toggleSourceCollapsed}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      <span>{isSourceCollapsed ? "แสดง" : "ซ่อน"}</span>
                      {isSourceCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                  </div>
                  {!isSourceCollapsed && (
                    <div className="space-y-2">
                      {publicationSourceRows.length === 0 ? (
                        <p className="text-sm text-slate-500">ไม่พบข้อมูล</p>
                      ) : (
                        <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-200">
                          <table className="min-w-full border-collapse text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700">
                              <tr>
                                <th className="border border-slate-200 px-3 py-2 text-left font-semibold">ประเภทผลงาน</th>
                                <th className="border border-slate-200 px-3 py-2 text-left font-semibold">แหล่งตีพิมพ์</th>
                                <th className="border border-slate-200 px-3 py-2 text-right font-semibold">
                                  <button
                                    type="button"
                                    onClick={() => setPublicationSourceSort((prev) => (prev === "desc" ? "asc" : "desc"))}
                                    className="inline-flex items-center gap-1 text-right text-slate-700 hover:text-slate-900"
                                  >
                                    <span>จำนวน</span>
                                    {publicationSourceSort === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                  </button>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {publicationSourceRows.map((item, index) => (
                                <tr key={`${item.aggregationType}-${item.publicationSource}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                  <td className="border border-slate-200 px-3 py-2 text-slate-700">{item.aggregationType}</td>
                                  <td className="border border-slate-200 px-3 py-2 text-slate-700">{item.publicationSource}</td>
                                  <td className="border border-slate-200 px-3 py-2 text-right font-semibold text-slate-900">{formatNumber(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">แหล่งทุนสนับสนุน (Funding Sponsor)</p>
                    <button
                      type="button"
                      onClick={toggleSponsorCollapsed}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      <span>{isSponsorCollapsed ? "แสดง" : "ซ่อน"}</span>
                      {isSponsorCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                  </div>
                  {!isSponsorCollapsed && (
                    <div className="space-y-2">
                      {fundingSponsorBreakdown.length === 0 ? (
                        <p className="text-sm text-slate-500">ไม่พบข้อมูล</p>
                      ) : (
                        <div className="max-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-white">
                          <div className="space-y-2 p-2">
                            {fundingSponsorBreakdown.map((item, index) => (
                              <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                <p className="w-[78%] truncate text-sm text-slate-700">{String(item.label || "").trim().toUpperCase() === "N/A" ? "ไม่ระบุแหล่งทุน" : item.label}</p>
                                <p className="text-sm font-semibold text-slate-900">{formatNumber(item.total || 0)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>}
          </SimpleCard>

          <SimpleCard
            title="ประวัติควอไทล์ระดับคณะ (Faculty Quartile History)"
            action={(
              <button
                type="button"
                onClick={toggleFacultyHistoryCollapsed}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                <span>{isFacultyHistoryCollapsed ? "แสดง" : "ซ่อน"}</span>
                {isFacultyHistoryCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
          >
            {!isFacultyHistoryCollapsed && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-slate-700">
                      <th rowSpan={2} className="border border-indigo-200 bg-indigo-50 px-3 py-2 text-left text-indigo-800">ปีที่ตีพิมพ์ (พ.ศ.)</th>
                      <th rowSpan={2} className="border border-blue-200 bg-blue-50 px-3 py-2 text-right text-blue-800">เอกสารไม่ซ้ำ</th>
                      <th colSpan={6} className="border border-violet-200 bg-violet-50 px-3 py-2 text-center text-violet-800">กลุ่ม Quartile</th>
                      <th colSpan={2} className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-emerald-800">กลุ่มประเภทแหล่งตีพิมพ์</th>
                      <th rowSpan={2} className="border border-amber-200 bg-amber-50 px-3 py-2 text-right text-amber-800">Cited By Total</th>
                    </tr>
                    <tr className="text-slate-700">
                      <th className="border border-violet-200 bg-violet-50 px-3 py-2 text-right text-violet-800">T1</th>
                      <th className="border border-violet-200 bg-violet-50 px-3 py-2 text-right text-violet-800">Q1</th>
                      <th className="border border-violet-200 bg-violet-50 px-3 py-2 text-right text-violet-800">Q2</th>
                      <th className="border border-violet-200 bg-violet-50 px-3 py-2 text-right text-violet-800">Q3</th>
                      <th className="border border-violet-200 bg-violet-50 px-3 py-2 text-right text-violet-800">Q4</th>
                      <th className="border border-violet-200 bg-violet-50 px-3 py-2 text-right text-violet-800">N/A</th>
                      <th className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-emerald-800">Journal</th>
                      <th className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-right text-emerald-800">Conference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyQuartileHistory.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="border border-slate-200 px-3 py-4 text-center text-slate-500">
                          ไม่พบข้อมูล
                        </td>
                      </tr>
                    ) : (
                      facultyQuartileHistory.map((row, index) => (
                        <tr
                          key={`${row.publication_year}-${index}`}
                          onClick={() => setSelectedFacultyHistoryRow((prev) => (prev === `${row.publication_year}-${index}` ? "" : `${row.publication_year}-${index}`))}
                          className={`cursor-pointer transition-colors ${
                            selectedFacultyHistoryRow === `${row.publication_year}-${index}`
                              ? "bg-amber-100"
                              : index % 2 === 0
                                ? "bg-white hover:bg-sky-50"
                                : "bg-slate-50 hover:bg-sky-50"
                          }`}
                        >
                          <td className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{row.publication_year}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.unique_documents || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.t1 || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.q1 || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.q2 || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.q3 || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.q4 || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.na || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.journal || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.conference || 0)}</td>
                          <td className="border border-slate-200 px-3 py-2 text-right">{formatNumber(row.cited_by_total || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </SimpleCard>
          </>
        )}
      </div>
    </PageLayout>
  );
}
