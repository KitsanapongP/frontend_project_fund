"use client";

import { RESEARCH_FUND_PAGE_ICONS } from "@/app/lib/research_fund_menu_presentation";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Loader2,
  Search,
  X,
} from "lucide-react";
import PageLayout from "../common/PageLayout";
import { APIError, publicationsAPI, usersAPI } from "../../../../../lib/api";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { downloadXlsx } from "@/app/(portal)/research-fund-system/admin/utils/xlsxExporter";

const PUB_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const SORTABLE_FIELDS = new Set(["title", "cited_by", "year", "percentile", "quartile"]);
const QUARTILE_OPTIONS = ["T1", "Q1", "Q2", "Q3", "Q4"];
// Aggregation types present in the KKU-scoped Scopus search data (checked 2026-09-25).
const DOCUMENT_TYPE_OPTIONS = [
  "Journal",
  "Conference Proceeding",
  "Book Series",
  "Book",
];
const YEAR_OPTIONS = Array.from(
  { length: new Date().getUTCFullYear() - 1899 },
  (_, index) => new Date().getUTCFullYear() - index
);
const EXPORT_COLUMNS = [
  { key: "rowNumber", header: "ลำดับ", width: 8 },
  { key: "scopusId", header: "scopus_id", width: 14 },
  { key: "scopusLink", header: "scopus_link", width: 30 },
  { key: "title", header: "title", width: 60 },
  { key: "authorNames", header: "authors", width: 42 },
  { key: "abstract", header: "abstract", width: 60 },
  { key: "aggregationType", header: "aggregation_type", width: 18 },
  { key: "sourceId", header: "source_id", width: 18 },
  { key: "publicationName", header: "publication_name", width: 36 },
  { key: "affiliationAfid", header: "afid", width: 22 },
  { key: "affiliationName", header: "name", width: 34 },
  { key: "affiliationCity", header: "city", width: 18 },
  { key: "affiliationCountry", header: "country", width: 18 },
  { key: "affiliationUrl", header: "affiliation_url", width: 34 },
  { key: "affiliationsJson", header: "affiliations_json", width: 48 },
  { key: "issn", header: "issn", width: 18 },
  { key: "eissn", header: "eissn", width: 18 },
  { key: "isbn", header: "isbn", width: 18 },
  { key: "volume", header: "volume", width: 12 },
  { key: "issue", header: "issue", width: 12 },
  { key: "pageRange", header: "page_range", width: 16 },
  { key: "articleNumber", header: "article_number", width: 18 },
  { key: "coverDate", header: "cover_date", width: 18 },
  { key: "doi", header: "doi", width: 22 },
  { key: "citedBy", header: "citedby_count", width: 12 },
  { key: "authkeywords", header: "authkeywords", width: 28 },
  { key: "fundSponsor", header: "fund_sponsor", width: 28 },
  { key: "citeScoreStatus", header: "cite_score_status", width: 18 },
  { key: "citeScoreRank", header: "cite_score_rank", width: 14 },
  { key: "citeScorePercentile", header: "cite_score_percentile", width: 16 },
  { key: "journalTierBucket", header: "journal_tier_bucket", width: 16 },
  { key: "citeScoreQuartile", header: "cite_score_quartile", width: 16 },
  { key: "year", header: "publication_year", width: 12 },
  { key: "eid", header: "eid", width: 22 },
  { key: "scopusUrl", header: "scopus_url", width: 32 },
  { key: "doiUrl", header: "doi_url", width: 32 },
];

const BY_USER_DETAILS_COLUMNS = [
  { key: "rowNumber", header: "ลำดับ", width: 8 },
  { key: "userId", header: "user_id", width: 10 },
  { key: "userName", header: "user_name", width: 30 },
  { key: "userEmail", header: "user_email", width: 32 },
  { key: "userScopusId", header: "user_scopus_id", width: 16 },
  { key: "year", header: "publication_year", width: 12 },
  { key: "eid", header: "eid", width: 22 },
  { key: "scopusId", header: "scopus_id", width: 14 },
  { key: "title", header: "title", width: 56 },
  { key: "authorNames", header: "authors", width: 42 },
  { key: "publicationName", header: "publication_name", width: 34 },
  { key: "affiliationAfid", header: "afid", width: 22 },
  { key: "affiliationName", header: "name", width: 34 },
  { key: "affiliationCity", header: "city", width: 18 },
  { key: "affiliationCountry", header: "country", width: 18 },
  { key: "affiliationUrl", header: "affiliation_url", width: 34 },
  { key: "affiliationsJson", header: "affiliations_json", width: 48 },
  { key: "userAffiliationAfid", header: "user_affiliation_afid", width: 24 },
  { key: "userAffiliationName", header: "user_affiliation_name", width: 36 },
  { key: "userAffiliationCity", header: "user_affiliation_city", width: 24 },
  { key: "userAffiliationCountry", header: "user_affiliation_country", width: 24 },
  { key: "userAffiliationUrl", header: "user_affiliation_url", width: 36 },
  { key: "doi", header: "doi", width: 24 },
  { key: "citedBy", header: "citedby_count", width: 14 },
  { key: "citeScorePercentile", header: "cite_score_percentile", width: 18 },
  { key: "journalTierBucket", header: "journal_tier_bucket", width: 16 },
  { key: "citeScoreQuartile", header: "cite_score_quartile", width: 16 },
  { key: "citeScoreStatus", header: "cite_score_status", width: 18 },
  { key: "documentId", header: "document_id", width: 14 },
];

const COMBINED_META_COLUMNS = [
  { key: "key", header: "key", width: 24 },
  { key: "value", header: "value", width: 72 },
];

const resolveAffiliationExportFields = (item) => ({
  affiliationAfid: item?.affiliation_afid || item?.affiliationAfid || "",
  affiliationName: item?.affiliation_name || item?.affiliationName || "",
  affiliationCity: item?.affiliation_city || item?.affiliationCity || "",
  affiliationCountry: item?.affiliation_country || item?.affiliationCountry || "",
  affiliationUrl: item?.affiliation_url || item?.affiliationUrl || "",
  affiliationsJson: item?.affiliations_json || item?.affiliationsJson || "",
});

const resolveUserAffiliationExportFields = (item) => ({
  userAffiliationAfid: item?.user_affiliation_afid || item?.userAffiliationAfid || "",
  userAffiliationName: item?.user_affiliation_name || item?.userAffiliationName || "",
  userAffiliationCity: item?.user_affiliation_city || item?.userAffiliationCity || "",
  userAffiliationCountry:
    item?.user_affiliation_country || item?.userAffiliationCountry || "",
  userAffiliationUrl: item?.user_affiliation_url || item?.userAffiliationUrl || "",
});

const resolveJournalTierBucket = (percentile) => {
  if (percentile === null || percentile === undefined || percentile === "") return "";
  const value = Number(percentile);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 90) return "T1";
  if (value >= 75) return "Q1";
  if (value >= 50) return "Q2";
  if (value >= 25) return "Q3";
  return "Q4";
};

export default function AdminScopusResearchSearch() {
  const { user, hasPermission } = useAuth();
  const [pubQuery, setPubQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [pageSize, setPageSize] = useState(PUB_PAGE_SIZE);
  const [sortField, setSortField] = useState("year");
  const [sortDirection, setSortDirection] = useState("desc");
  const [quartileFilter, setQuartileFilter] = useState("");
  const [minCitedBy, setMinCitedBy] = useState("");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [searchReady, setSearchReady] = useState(false);
  const [publications, setPublications] = useState([]);
  const [pubMeta, setPubMeta] = useState({ total: 0, limit: PUB_PAGE_SIZE, offset: 0 });
  const [pubLoading, setPubLoading] = useState(true);
  const [pubError, setPubError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingByUser, setExportingByUser] = useState(false);
  const [exportingCombined, setExportingCombined] = useState(false);
  const [exportScope, setExportScope] = useState("filtered");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const exportDialogRef = useRef(null);

  useEffect(() => {
    const dialog = exportDialogRef.current;
    if (!dialog) return;
    if (exportDialogOpen && !dialog.open) dialog.showModal();
    if (!exportDialogOpen && dialog.open) dialog.close();
  }, [exportDialogOpen]);
  const activeFilterParams = useMemo(() => ({
    ...(appliedQuery && { q: appliedQuery }),
    ...(quartileFilter && { quartile: quartileFilter }),
    ...(minCitedBy !== "" && { min_cited_by: minCitedBy }),
    ...(documentTypeFilter && { document_type: documentTypeFilter }),
    ...(yearFrom && { year_from: yearFrom }),
    ...(yearTo && { year_to: yearTo }),
  }), [appliedQuery, quartileFilter, minCitedBy, documentTypeFilter, yearFrom, yearTo]);
  const advancedFilterCount = [documentTypeFilter, quartileFilter, minCitedBy, yearFrom, yearTo]
    .filter((value) => value !== "").length;
  const clearAdvancedFilters = () => {
    setDocumentTypeFilter("");
    setQuartileFilter("");
    setMinCitedBy("");
    setYearFrom("");
    setYearTo("");
    setPageOffset(0);
  };

  const searchTimerRef = useRef(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    const limit = Number(params.get("limit"));
    const sort = params.get("sort") || "year";
    const direction = params.get("direction") || "desc";
    const quartile = (params.get("quartile") || "").toUpperCase();
    const minCitations = params.get("min_cited_by") || "";
    const docType = params.get("document_type") || "";
    const from = params.get("year_from") || "";
    const to = params.get("year_to") || "";
    const offset = Number(params.get("offset"));
    setPubQuery(query);
    setAppliedQuery(query.trim());
    if (PAGE_SIZE_OPTIONS.includes(limit)) setPageSize(limit);
    if (SORTABLE_FIELDS.has(sort)) setSortField(sort);
    if (direction === "asc" || direction === "desc") setSortDirection(direction);
    if (QUARTILE_OPTIONS.includes(quartile)) setQuartileFilter(quartile);
    if (/^\d+$/.test(minCitations)) setMinCitedBy(minCitations);
    if (DOCUMENT_TYPE_OPTIONS.includes(docType)) setDocumentTypeFilter(docType);
    const validFrom = YEAR_OPTIONS.includes(Number(from)) ? from : "";
    const validTo = YEAR_OPTIONS.includes(Number(to)) ? to : "";
    if (!validFrom || !validTo || Number(validFrom) <= Number(validTo)) {
      setYearFrom(validFrom);
      setYearTo(validTo);
    }
    if (quartile || minCitations || docType || validFrom || validTo) setAdvancedOpen(true);
    if (Number.isSafeInteger(offset) && offset >= 0) setPageOffset(offset);
    setSearchReady(true);
  }, []);

  useEffect(() => {
    if (!searchReady || pubQuery.trim() === appliedQuery) return;
    searchTimerRef.current = setTimeout(() => {
      setPageOffset(0);
      setAppliedQuery(pubQuery.trim());
      searchTimerRef.current = null;
    }, 500);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchReady, pubQuery, appliedQuery]);

  const runSearchNow = () => {
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = null;
    setPageOffset(0);
    setAppliedQuery(pubQuery.trim());
    setReloadCount((count) => count + 1);
  };
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!searchReady) return;
    let active = true;
    const load = async () => {
      setPubLoading(true);
      setPubError("");
      try {
        const params = {
          limit: pageSize, offset: pageOffset, sort: sortField, direction: sortDirection,
          ...(appliedQuery && { q: appliedQuery }),
          ...(quartileFilter && { quartile: quartileFilter }),
          ...(minCitedBy !== "" && { min_cited_by: minCitedBy }),
          ...(documentTypeFilter && { document_type: documentTypeFilter }),
          ...(yearFrom && { year_from: yearFrom }),
          ...(yearTo && { year_to: yearTo }),
        };
        const res = await publicationsAPI.searchScopusPublications(params);
        if (!active) return;
        const total = Number(res?.paging?.total || 0);
        if (total > 0 && pageOffset >= total) {
          setPageOffset(Math.floor((total - 1) / pageSize) * pageSize);
          return;
        }
        const items = res?.data || [];
        setPublications(items);
        setPubMeta(res?.paging || { total: items.length, limit: pageSize, offset: pageOffset });
      } catch (error) {
        if (!active) return;
        console.error("Load publications error", error);
        setPublications([]);
        setPubMeta({ total: 0, limit: pageSize, offset: 0 });
        setPubError(error?.message || "ไม่สามารถดึงข้อมูลงานวิจัยได้");
      } finally {
        if (active) setPubLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [searchReady, appliedQuery, pageSize, pageOffset, sortField, sortDirection, quartileFilter, minCitedBy, documentTypeFilter, yearFrom, yearTo, reloadCount]);

  useEffect(() => {
    if (!searchReady) return;
    const url = new URL(window.location.href);
    const values = {
      q: appliedQuery, sort: sortField === "year" ? "" : sortField,
      direction: sortDirection === "desc" ? "" : sortDirection,
      limit: pageSize === PUB_PAGE_SIZE ? "" : String(pageSize),
      offset: pageOffset === 0 ? "" : String(pageOffset),
      quartile: quartileFilter, min_cited_by: minCitedBy, document_type: documentTypeFilter,
      year_from: yearFrom, year_to: yearTo,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    window.history.replaceState(window.history.state, "", url);
  }, [searchReady, appliedQuery, sortField, sortDirection, pageSize, pageOffset, quartileFilter, minCitedBy, documentTypeFilter, yearFrom, yearTo]);

  const handleSort = useCallback(
    (field) => {
      if (pubLoading || !SORTABLE_FIELDS.has(field)) return;
      if (sortField === field) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDirection("desc");
      }
      setPageOffset(0);
    },
    [pubLoading, sortField]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((pubMeta?.total || 0) / (pubMeta?.limit || PUB_PAGE_SIZE))),
    [pubMeta]
  );
  const currentPage = useMemo(
    () => Math.floor((pubMeta?.offset || 0) / (pubMeta?.limit || PUB_PAGE_SIZE)) + 1,
    [pubMeta]
  );

  const handlePageChange = (direction) => {
    if (pubLoading) return;
    const nextPage = currentPage + direction;
    if (nextPage < 1 || nextPage > totalPages) return;
    setPageOffset((nextPage - 1) * pageSize);
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return new Intl.NumberFormat("th-TH").format(num);
  };

  const formatPercentile = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    return formatNumber(num);
  };

  const quartileBadgeClass = (quartile) => {
    const normalized = quartile?.toUpperCase();
    switch (normalized) {
      case "T1":
        return "bg-violet-100 text-violet-700";
      case "Q1":
        return "bg-emerald-100 text-emerald-700";
      case "Q2":
        return "bg-sky-100 text-sky-700";
      case "Q3":
        return "bg-amber-100 text-amber-700";
      case "Q4":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const normalizeCiteScoreStatus = (status) => {
    if (!status) return "";
    return String(status).trim().toLowerCase();
  };

  const pickLatestCompleteMetric = (metrics) => {
    const completeMetrics = metrics.filter(
      (metric) => normalizeCiteScoreStatus(metric?.cite_score_status) === "complete",
    );
    if (completeMetrics.length === 0) {
      return null;
    }
    return completeMetrics.reduce((latest, metric) => {
      const metricYear = Number(metric?.metric_year ?? metric?.year ?? 0);
      if (!latest) return metric;
      const latestYear = Number(latest?.metric_year ?? latest?.year ?? 0);
      return metricYear >= latestYear ? metric : latest;
    }, null);
  };

  const resolveCompleteCiteScore = (pub) => {
    const metricsList = Array.isArray(pub?.scopus_source_metrics)
      ? pub.scopus_source_metrics
      : [];
    const completeMetric = pickLatestCompleteMetric(metricsList);
    if (completeMetric) {
      return {
        status: completeMetric.cite_score_status,
        rank: completeMetric.cite_score_rank,
        percentile: completeMetric.cite_score_percentile,
        quartile: completeMetric.cite_score_quartile,
      };
    }

    const status =
      pub?.cite_score_status ?? pub?.scopus_source_metrics?.cite_score_status ?? "";
    if (normalizeCiteScoreStatus(status) !== "complete") {
      return null;
    }

    return {
      status,
      rank: pub?.cite_score_rank ?? pub?.scopus_source_metrics?.cite_score_rank,
      percentile:
        pub?.cite_score_percentile ??
        pub?.scopus_source_metrics?.cite_score_percentile,
      quartile:
        pub?.cite_score_quartile ?? pub?.scopus_source_metrics?.cite_score_quartile,
    };
  };

  const buildExportRows = useCallback((items, startOffset = 0) => {
    if (!Array.isArray(items) || items.length === 0) return [];
    const formatCoverDate = (value) => {
      if (!value) return "";
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toISOString().split("T")[0];
    };
    return items.map((pub, index) => {
      const citeScoreMetrics = resolveCompleteCiteScore(pub);
      const rowNumber = startOffset + index + 1;
      const citedByValue =
        pub.cited_by !== undefined && pub.cited_by !== null ? pub.cited_by : "";
      const keywords = Array.isArray(pub.keywords)
        ? pub.keywords.join("; ")
        : pub.keywords || pub.authkeywords || "";
      const coverDate = pub.cover_date || pub.coverDate || null;
      const coverYear = (() => {
        if (!coverDate) return "";
        const date = coverDate instanceof Date ? coverDate : new Date(coverDate);
        return Number.isNaN(date.getTime()) ? "" : date.getFullYear();
      })();

      return {
        rowNumber,
        scopusId: pub.scopus_id || pub.scopusID || "",
        scopusLink: pub.scopus_url || pub.scopus_link || "",
        title: pub.title || "",
        authorNames: pub.author_names || pub.authorNames || "",
        abstract: pub.abstract || "",
        aggregationType: pub.aggregation_type || "",
        sourceId: pub.source_id || "",
        publicationName: pub.publication_name || pub.venue || "",
        ...resolveAffiliationExportFields(pub),
        issn: pub.issn || "",
        eissn: pub.eissn || "",
        isbn: pub.isbn || "",
        volume: pub.volume || "",
        issue: pub.issue || "",
        pageRange: pub.page_range || "",
        articleNumber: pub.article_number || "",
        coverDate: formatCoverDate(coverDate),
        doi: pub.doi || "",
        citedBy: citedByValue,
        authkeywords: keywords,
        fundSponsor: pub.fund_sponsor || "",
        citeScoreStatus: citeScoreMetrics?.status ?? "",
        citeScoreRank: citeScoreMetrics?.rank ?? "",
        citeScorePercentile:
          citeScoreMetrics?.percentile ?? "",
        journalTierBucket: resolveJournalTierBucket(citeScoreMetrics?.percentile),
        citeScoreQuartile:
          (citeScoreMetrics?.quartile || "")?.toUpperCase(),
        year: pub.publication_year || coverYear,
        eid: pub.eid || "",
        scopusUrl: pub.scopus_url || "",
        doiUrl: pub.doi || pub.doi_url || pub.url || "",
      };
    });
  }, []);

  const hasExportableData = useMemo(() => (pubMeta?.total || 0) > 0, [pubMeta?.total]);
  const filteredExportReady = hasExportableData && !pubLoading && pubQuery.trim() === appliedQuery;
  const roleRaw = user?.role_id ?? user?.role;
  const isAdmin = Number(roleRaw) === 3 || String(roleRaw || "").toLowerCase() === "admin";
  const hasPermissionSnapshot = Array.isArray(user?.permissions) && user.permissions.length > 0;
  const canExport = hasPermissionSnapshot
    ? hasPermission("scopus.publications.export") || hasPermission("report.export")
    : isAdmin;
  const canExportByUser = hasPermissionSnapshot
    ? hasPermission("scopus.publications.export_by_user")
    : isAdmin;
  const canExportCombined = canExport && canExportByUser;

  const buildByUserDetailRow = useCallback((item, context = {}) => {
    const coverDate = item?.cover_date ? new Date(item.cover_date) : null;
    const yearValue =
      item?.publication_year ||
      (coverDate && !Number.isNaN(coverDate.getTime()) ? coverDate.getFullYear() : "");
    const userId = context.userId ?? item?.user_id ?? "";
    const documentId = item?.document_id || item?.id || item?.scopus_id || item?.eid || "";
    return {
      userId,
      userName: context.userName ?? item?.user_name ?? "",
      userEmail: context.userEmail ?? item?.user_email ?? "",
      userScopusId: context.userScopusId ?? item?.user_scopus_id ?? "",
      year: yearValue,
      eid: item?.eid || "",
      scopusId: item?.scopus_id || "",
      title: item?.title || "",
      authorNames: item?.author_names || item?.authorNames || "",
      publicationName: item?.publication_name || item?.venue || "",
      ...resolveAffiliationExportFields(item),
      ...resolveUserAffiliationExportFields(item),
      doi: item?.doi || "",
      citedBy: item?.cited_by ?? "",
      citeScorePercentile: item?.cite_score_percentile ?? "",
      journalTierBucket: resolveJournalTierBucket(item?.cite_score_percentile),
      citeScoreQuartile: (item?.cite_score_quartile || "")?.toUpperCase(),
      citeScoreStatus: item?.cite_score_status || "",
      documentId,
      _userKey: `${userId}`,
      _docKey: item?.eid || documentId,
    };
  }, []);

  const buildByUserWorkbookData = useCallback((detailRows) => {
    const rows = Array.isArray(detailRows) ? detailRows : [];
    const summaryMap = new Map();
    const yearSet = new Set();

    rows.forEach((row) => {
      const key = row._userKey;
      const docKey = row._docKey;
      if (!key || !docKey) return;

      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          userId: row.userId,
          userName: row.userName,
          userEmail: row.userEmail,
          userScopusId: row.userScopusId,
          documents: new Set(),
          years: new Map(),
        });
      }

      const summary = summaryMap.get(key);
      if (!summary.documents.has(docKey)) {
        summary.documents.add(docKey);
        const yearKey = Number(row.year);
        if (Number.isFinite(yearKey) && yearKey > 0) {
          yearSet.add(yearKey);
          summary.years.set(yearKey, (summary.years.get(yearKey) || 0) + 1);
        }
      }
    });

    const years = Array.from(yearSet).sort((a, b) => a - b);
    const summaryColumns = [
      { key: "rowNumber", header: "ลำดับ", width: 8 },
      { key: "userId", header: "user_id", width: 10 },
      { key: "userName", header: "user_name", width: 30 },
      { key: "userEmail", header: "user_email", width: 32 },
      { key: "userScopusId", header: "user_scopus_id", width: 16 },
      { key: "totalPublications", header: "total_publications", width: 16 },
      ...years.map((year) => ({ key: `year_${year}`, header: `${year}`, width: 10 })),
    ];

    const summaryRows = Array.from(summaryMap.values())
      .sort((a, b) => {
        const nameA = (a.userName || "").toLowerCase();
        const nameB = (b.userName || "").toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return Number(a.userId || 0) - Number(b.userId || 0);
      })
      .map((entry, idx) => {
        const row = {
          rowNumber: idx + 1,
          userId: entry.userId,
          userName: entry.userName,
          userEmail: entry.userEmail,
          userScopusId: entry.userScopusId,
          totalPublications: entry.documents.size,
        };

        years.forEach((year) => {
          row[`year_${year}`] = entry.years.get(year) || 0;
        });

        return row;
      });

    const cleanedDetailRows = rows.map((row, index) => {
      const { _userKey, _docKey, ...rest } = row;
      return {
        rowNumber: index + 1,
        ...rest,
      };
    });

    return {
      summaryColumns,
      summaryRows,
      cleanedDetailRows,
    };
  }, []);

  const fetchAllDocumentRows = useCallback(async (scope = exportScope) => {
    const limit = 200;
    let offset = 0;
    let total;
    const allRows = [];

    while (true) {
      const params = { limit, offset, sort: sortField, direction: sortDirection, ...(scope === "all" ? {} : activeFilterParams) };

      const res = await publicationsAPI.searchScopusPublications(params);
      const items = Array.isArray(res?.data) ? res.data : [];
      const paging = res?.paging || {};
      total = paging.total ?? total;
      const pageLimit = paging.limit || limit;

      allRows.push(...buildExportRows(items, offset));

      if (items.length < pageLimit) {
        break;
      }
      offset += pageLimit;

      if (total !== undefined && offset >= total) {
        break;
      }
    }

    return allRows;
  }, [activeFilterParams, buildExportRows, exportScope, sortField, sortDirection]);

  const fetchByUserDetailsViaFallback = useCallback(async (scope = exportScope) => {
    const query = scope === "all" ? "" : appliedQuery;
    const users = [];
    const userPageLimit = 200;
    let userOffset = 0;

    while (true) {
      const res = await usersAPI.listScopusUsers({ limit: userPageLimit, offset: userOffset });
      const items = Array.isArray(res?.data) ? res.data : [];
      const paging = res?.paging || {};
      users.push(...items);

      const pageLimit = paging.limit || userPageLimit;
      const total = paging.total;
      if (items.length < pageLimit) {
        break;
      }
      userOffset += pageLimit;
      if (total !== undefined && userOffset >= total) {
        break;
      }
    }

    const normalizedQuery = query.toLowerCase();
    const filteredUsers = normalizedQuery
      ? users.filter((userItem) => {
          const name = String(userItem?.name || userItem?.user_name || "").toLowerCase();
          const email = String(userItem?.email || userItem?.user_email || "").toLowerCase();
          const scopusId = String(userItem?.scopus_author_id || userItem?.scopus_id || "").toLowerCase();
          return (
            name.includes(normalizedQuery) ||
            email.includes(normalizedQuery) ||
            scopusId.includes(normalizedQuery)
          );
        })
      : users;

    const detailRows = [];
    for (const userItem of filteredUsers) {
      const userId = userItem?.user_id || userItem?.userId;
      if (!userId) continue;

      const pubLimit = 200;
      let pubOffset = 0;
      while (true) {
        const params = { limit: pubLimit, offset: pubOffset, sort: "year", direction: "desc" };
        if (query) {
          params.q = query;
        }

        const pubRes = await publicationsAPI.getScopusPublicationsForUser(userId, params);
        const pubItems = Array.isArray(pubRes?.data) ? pubRes.data : [];
        const pubPaging = pubRes?.paging || {};
        const pageLimit = pubPaging.limit || pubLimit;
        const total = pubPaging.total;

        pubItems.forEach((item) => {
          detailRows.push(
            buildByUserDetailRow(item, {
              userId,
              userName: userItem?.name || userItem?.user_name || "",
              userEmail: userItem?.email || userItem?.user_email || "",
              userScopusId: userItem?.scopus_author_id || userItem?.scopus_id || "",
            })
          );
        });

        if (pubItems.length < pageLimit) {
          break;
        }
        pubOffset += pageLimit;
        if (total !== undefined && pubOffset >= total) {
          break;
        }
      }
    }

    return detailRows;
  }, [appliedQuery, buildByUserDetailRow, exportScope]);

  const fetchByUserDetailsRows = useCallback(async (scope = exportScope) => {
    const limit = 200;
    let offset = 0;
    let total;
    const detailRows = [];

    while (true) {
      const params = { limit, offset, sort: sortField, direction: sortDirection, ...(scope === "all" ? {} : activeFilterParams) };

      const res = await publicationsAPI.searchScopusPublicationsByUser(params);
      const items = Array.isArray(res?.data) ? res.data : [];
      const paging = res?.paging || {};
      total = paging.total ?? total;
      const pageLimit = paging.limit || limit;

      items.forEach((item) => {
        detailRows.push(buildByUserDetailRow(item));
      });

      if (items.length < pageLimit) {
        break;
      }
      offset += pageLimit;

      if (total !== undefined && offset >= total) {
        break;
      }
    }

    return detailRows;
  }, [activeFilterParams, buildByUserDetailRow, exportScope, sortField, sortDirection]);

  const fetchByUserDetailsWithFallback = useCallback(async (scope = exportScope) => {
    try {
      return await fetchByUserDetailsRows(scope);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        if (scope !== "all" && (quartileFilter || minCitedBy !== "" || documentTypeFilter || yearFrom || yearTo)) {
          throw error;
        }
        try {
          return await fetchByUserDetailsViaFallback(scope);
        } catch (fallbackError) {
          const wrappedError = new Error("BY_USER_FALLBACK_FAILED");
          wrappedError.cause = fallbackError;
          throw wrappedError;
        }
      }
      throw error;
    }
  }, [documentTypeFilter, exportScope, fetchByUserDetailsRows, fetchByUserDetailsViaFallback, minCitedBy, quartileFilter, yearFrom, yearTo]);

  const downloadByUserWorkbook = useCallback((detailRows) => {
    if (!Array.isArray(detailRows) || detailRows.length === 0) {
      toast.error("ไม่พบข้อมูลงานวิจัยสำหรับส่งออก");
      return false;
    }

    const { summaryColumns, summaryRows, cleanedDetailRows } = buildByUserWorkbookData(detailRows);
    const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
    const filename = `scopus_publications_by_user_${timestamp}.xlsx`;

    downloadXlsx(BY_USER_DETAILS_COLUMNS, cleanedDetailRows, {
      filename,
      sheets: [
        {
          name: "Summary",
          columns: summaryColumns,
          rows: summaryRows,
        },
        {
          name: "Details",
          columns: BY_USER_DETAILS_COLUMNS,
          rows: cleanedDetailRows,
        },
      ],
    });

    toast.success(`ส่งออกสำเร็จ ${summaryRows.length} ผู้ใช้ / ${cleanedDetailRows.length} รายการผลงาน`);
    return true;
  }, [buildByUserWorkbookData]);

  const handleExport = useCallback(async (scope = exportScope) => {
    if (!canExport) {
      toast.error("คุณไม่มีสิทธิ์ส่งออกข้อมูล");
      return;
    }
    if (scope !== "all" && !hasExportableData) return;
    setExporting(true);
    try {
      const allRows = await fetchAllDocumentRows(scope);
      if (allRows.length === 0) {
        toast.error("ไม่พบข้อมูลงานวิจัยสำหรับส่งออก");
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
      const filename = `scopus_publications_${timestamp}.xlsx`;
      downloadXlsx(EXPORT_COLUMNS, allRows, {
        sheetName: "Scopus Publications",
        filename,
      });
      toast.success(`ส่งออก ${allRows.length} รายการเรียบร้อยแล้ว`);
    } catch (error) {
      console.error("Export publications error", error);
      toast.error("ไม่สามารถส่งออกไฟล์ได้");
    } finally {
      setExporting(false);
    }
  }, [canExport, exportScope, fetchAllDocumentRows, hasExportableData]);

  const handleExportByUser = useCallback(async (scope = exportScope) => {
    if (!canExportByUser) {
      toast.error("คุณไม่มีสิทธิ์ส่งออกรายผู้ใช้");
      return;
    }

    setExportingByUser(true);
    try {
      const detailRows = await fetchByUserDetailsWithFallback(scope);
      downloadByUserWorkbook(detailRows);
    } catch (error) {
      if (error?.message === "BY_USER_FALLBACK_FAILED") {
        console.error("Export publications by user fallback error", error?.cause || error);
        toast.error("ระบบ API ยังไม่พร้อมสำหรับการส่งออกรายผู้ใช้");
      } else {
        console.error("Export publications by user error", error);
        toast.error("ไม่สามารถส่งออกไฟล์ได้");
      }
    } finally {
      setExportingByUser(false);
    }
  }, [canExportByUser, downloadByUserWorkbook, exportScope, fetchByUserDetailsWithFallback]);

  const handleExportCombined = useCallback(async (scope = exportScope) => {
    if (!canExportCombined) {
      toast.error("ต้องมีสิทธิ์ส่งออกทั้งเอกสารและรายผู้ใช้");
      return;
    }
    if (scope !== "all" && !hasExportableData) return;

    setExportingCombined(true);
    try {
      const [documentRows, detailRows] = await Promise.all([
        fetchAllDocumentRows(scope),
        fetchByUserDetailsWithFallback(scope),
      ]);
      if (documentRows.length === 0 && detailRows.length === 0) {
        toast.error("ไม่พบข้อมูลงานวิจัยสำหรับส่งออก");
        return;
      }

      const { summaryColumns, summaryRows, cleanedDetailRows } = buildByUserWorkbookData(detailRows);
      const query = scope === "all" ? "" : appliedQuery;
      const generatedAt = new Date().toISOString();
      const metaRows = [
        { key: "generated_at", value: generatedAt },
        { key: "scope", value: scope },
        { key: "query", value: query || "-" },
        { key: "quartile", value: scope === "all" ? "-" : quartileFilter || "-" },
        { key: "min_cited_by", value: scope === "all" ? "-" : minCitedBy || "-" },
        { key: "document_type", value: scope === "all" ? "-" : documentTypeFilter || "-" },
        { key: "year_from", value: scope === "all" ? "-" : yearFrom || "-" },
        { key: "year_to", value: scope === "all" ? "-" : yearTo || "-" },
        { key: "documents_rows", value: documentRows.length },
        { key: "users_details_rows", value: cleanedDetailRows.length },
        { key: "users_summary_rows", value: summaryRows.length },
      ];

      const timestamp = generatedAt.replace(/[:T]/g, "-").split(".")[0];
      const filename = `scopus_full_export_${timestamp}.xlsx`;
      downloadXlsx(EXPORT_COLUMNS, documentRows, {
        filename,
        sheets: [
          {
            name: "Documents",
            columns: EXPORT_COLUMNS,
            rows: documentRows,
          },
          {
            name: "Users_Details",
            columns: BY_USER_DETAILS_COLUMNS,
            rows: cleanedDetailRows,
          },
          {
            name: "Users_Summary",
            columns: summaryColumns,
            rows: summaryRows,
          },
          {
            name: "Meta",
            columns: COMBINED_META_COLUMNS,
            rows: metaRows,
          },
        ],
      });

      toast.success(
        `ส่งออกครบทุกชีตแล้ว (Documents ${documentRows.length} / Users ${cleanedDetailRows.length})`
      );
    } catch (error) {
      if (error?.message === "BY_USER_FALLBACK_FAILED") {
        console.error("Export combined fallback error", error?.cause || error);
        toast.error("ระบบ API ยังไม่พร้อมสำหรับการส่งออกรายผู้ใช้");
      } else {
        console.error("Export combined error", error);
        toast.error("ไม่สามารถส่งออกไฟล์รวมได้");
      }
    } finally {
      setExportingCombined(false);
    }
  }, [
    buildByUserWorkbookData,
    canExportCombined,
    exportScope,
    fetchAllDocumentRows,
    fetchByUserDetailsWithFallback,
    hasExportableData,
    appliedQuery,
    documentTypeFilter,
    minCitedBy,
    quartileFilter,
    yearFrom,
    yearTo,
  ]);

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
    );
  };

  const sortableHeaderProps = (field) => ({
    onClick: () => handleSort(field),
    role: "button",
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSort(field);
      }
    },
    "aria-sort":
      sortField === field ? (sortDirection === "asc" ? "ascending" : "descending") : "none",
  });

  return (
    <PageLayout
      title="ค้นหางานวิจัย"
      subtitle="ค้นหาและส่งออกเอกสารจากฐานข้อมูล Scopus ของบุคลากรภายสังกัดมหาวิทยาลัยขอนแก่น"
      icon={RESEARCH_FUND_PAGE_ICONS.researchSearch}
    >
      <div className="space-y-4">
        <section aria-labelledby="scopus-search-heading" className="rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <div className="flex items-center gap-2 text-blue-700">
              <Search className="h-4 w-4" aria-hidden="true" />
              <h2 id="scopus-search-heading" className="text-base font-semibold text-slate-900">ค้นหาเอกสารจาก Scopus</h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">แสดงเฉพาะผลงานที่ผู้แต่งตีพิมพ์ขณะสังกัดอยู่ที่มหาวิทยาลัยขอนแก่น</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="flex w-full min-w-0 items-stretch gap-2 lg:w-auto lg:flex-[1_1_40rem]">
              <label className="relative min-w-0 flex-1">
              <span className="sr-only">คำค้น Scopus</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="ค้นหาชื่อเรื่อง ผู้แต่ง DOI หรือแหล่งพิมพ์"
                value={pubQuery}
                onChange={(event) => setPubQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") runSearchNow(); }}
              />
              </label>
              <button type="button" aria-label="ค้นหา" onClick={runSearchNow} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                {pubLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
                <span className="hidden sm:inline">ค้นหา</span>
              </button>
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-2 lg:w-auto lg:flex-nowrap">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button type="button" aria-expanded={advancedOpen} aria-controls="scopus-advanced-options" onClick={() => setAdvancedOpen((open) => !open)} className="inline-flex min-h-9 items-center gap-2 rounded-md px-1 text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                ค้นหาขั้นสูง
                {advancedFilterCount > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">{advancedFilterCount}</span>}
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {advancedFilterCount > 0 && <button type="button" onClick={clearAdvancedFilters} className="text-sm text-slate-600 underline-offset-2 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">ล้างตัวกรอง</button>}
              </div>
              <button type="button" onClick={() => setExportDialogOpen(true)} className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                <Download className="h-4 w-4" aria-hidden="true" />ส่งออกข้อมูล
              </button>
            </div>
          </div>
          <div id="scopus-advanced-options" hidden={!advancedOpen} role="group" aria-label="ตัวเลือกค้นหาขั้นสูง" className="mt-3 border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-end justify-center gap-3">
              <label className="flex w-full min-w-0 flex-col gap-1 text-xs font-medium text-slate-700 sm:w-56">
                ประเภทแหล่งพิมพ์
                <select value={documentTypeFilter} onChange={(event) => { setDocumentTypeFilter(event.target.value); setPageOffset(0); }} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="">ทุกประเภท</option>
                  {DOCUMENT_TYPE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="flex w-[calc(50%-0.375rem)] min-w-0 flex-col gap-1 text-xs font-medium text-slate-700 sm:w-40">
                ระดับวารสาร
                <select value={quartileFilter} onChange={(event) => { setQuartileFilter(event.target.value); setPageOffset(0); }} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="">ทุกระดับ</option>
                  {QUARTILE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="flex w-[calc(50%-0.375rem)] min-w-0 flex-col gap-1 text-xs font-medium text-slate-700 sm:w-40">
                Cited by ขั้นต่ำ
                <input type="number" min="0" step="1" value={minCitedBy} onChange={(event) => { if (/^\d*$/.test(event.target.value)) { setMinCitedBy(event.target.value); setPageOffset(0); } }} placeholder="ไม่จำกัด" className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="flex w-[calc(50%-0.375rem)] min-w-0 flex-col gap-1 text-xs font-medium text-slate-700 sm:w-36">
                ปีตีพิมพ์ตั้งแต่
                <select value={yearFrom} onChange={(event) => { const value = event.target.value; setYearFrom(value); if (value && yearTo && Number(value) > Number(yearTo)) setYearTo(""); setPageOffset(0); }} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="">ทุกปี</option>
                  {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
              <label className="flex w-[calc(50%-0.375rem)] min-w-0 flex-col gap-1 text-xs font-medium text-slate-700 sm:w-36">
                ถึงปี
                <select value={yearTo} onChange={(event) => { const value = event.target.value; setYearTo(value); if (value && yearFrom && Number(value) < Number(yearFrom)) setYearFrom(""); setPageOffset(0); }} className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                  <option value="">ทุกปี</option>
                  {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </label>
            </div>
          </div>
          {!advancedOpen && advancedFilterCount > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs" aria-label="ตัวกรองที่ใช้งาน">
              {documentTypeFilter && <button type="button" onClick={() => { setDocumentTypeFilter(""); setPageOffset(0); }} className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-800 hover:bg-blue-100">{documentTypeFilter} ×</button>}
              {quartileFilter && <button type="button" onClick={() => { setQuartileFilter(""); setPageOffset(0); }} className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-800 hover:bg-blue-100">{quartileFilter} ×</button>}
              {minCitedBy !== "" && <button type="button" onClick={() => { setMinCitedBy(""); setPageOffset(0); }} className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-800 hover:bg-blue-100">อ้างอิง ≥ {minCitedBy} ×</button>}
              {(yearFrom || yearTo) && <button type="button" onClick={() => { setYearFrom(""); setYearTo(""); setPageOffset(0); }} className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-800 hover:bg-blue-100">ปี {yearFrom || "…"}–{yearTo || "…"} ×</button>}
            </div>
          )}
        </section>

        <section aria-label="ผลการค้นหา Scopus" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">ผลการค้นหา</h2>
            <span className="text-sm text-slate-600" aria-live="polite">
              {pubLoading ? "กำลังโหลด..." : `${formatNumber(pubMeta.total || 0)} รายการ`}
            </span>
          </div>
          {pubError ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{pubError}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                {pubLoading ? (
                  <div className="space-y-2 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-6 rounded bg-slate-100" />
                    ))}
                  </div>
                ) : publications.length === 0 ? (
                  <div className="py-6 text-center text-slate-500">ไม่พบข้อมูลงานวิจัยจาก Scopus</div>
                ) : (
                  <>
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-14 px-4 py-2 text-center font-medium text-gray-700">ลำดับ</th>
                          <th
                            {...sortableHeaderProps("title")}
                            className="cursor-pointer select-none px-4 py-2 text-left font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            <span className="inline-flex items-center gap-1">ชื่อเรื่อง {renderSortIcon("title")}</span>
                          </th>
                          <th className="min-w-40 px-4 py-2 text-left font-medium text-gray-700">ผู้แต่ง</th>
                          <th
                            {...sortableHeaderProps("cited_by")}
                            className="w-24 cursor-pointer select-none px-4 py-2 text-right font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            <span className="inline-flex items-center justify-end gap-1">Cited by {renderSortIcon("cited_by")}</span>
                          </th>
                          <th {...sortableHeaderProps("percentile")} className="w-28 cursor-pointer select-none px-4 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"><span className="inline-flex items-center gap-1">Percentile {renderSortIcon("percentile")}</span></th>
                          <th {...sortableHeaderProps("quartile")} className="w-28 cursor-pointer select-none px-4 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"><span className="inline-flex items-center gap-1">Quartile {renderSortIcon("quartile")}</span></th>
                          <th
                            {...sortableHeaderProps("year")}
                            className="w-20 cursor-pointer select-none px-4 py-2 text-center font-medium text-gray-700 transition hover:bg-gray-100"
                          >
                            <span className="inline-flex items-center justify-center gap-1">ปี {renderSortIcon("year")}</span>
                          </th>
                          <th className="w-32 px-4 py-2 text-left font-medium text-gray-700">ลิงก์</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {publications.map((pub, index) => {
                          const rowNumber = (pubMeta.offset || 0) + index + 1;
                          const citedByValue = pub.cited_by !== undefined && pub.cited_by !== null ? pub.cited_by : null;
                          const yearValue = pub.publication_year || "-";
                          const scopusUrl = pub.scopus_url;
                          const citeScoreMetrics = resolveCompleteCiteScore(pub);
                          const citeScorePercentile = citeScoreMetrics?.percentile;
                          const citeScoreQuartile = citeScoreMetrics?.quartile;
                          const journalTier = resolveJournalTierBucket(citeScorePercentile) || citeScoreQuartile;
                          const subtypeDescription =
                            pub.scopus_documents?.subtype_description ||
                            pub.subtype_description ||
                            pub.subtypeDescription;
                          const shouldShowCiteScore = subtypeDescription === "Article";
                          const linkLabel = pub.title || pub.venue || pub.publication_name || "ไม่ระบุชื่อเรื่อง";

                          const titleContent = scopusUrl ? (
                            <a
                              href={scopusUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="group inline-flex max-w-full items-center gap-1 truncate font-semibold text-blue-700 hover:text-blue-900"
                              title={linkLabel}
                            >
                              <span className="truncate">{linkLabel}</span>
                              <ExternalLink size={14} className="min-h-[14px] min-w-[14px] opacity-70 group-hover:opacity-100" />
                            </a>
                          ) : (
                            <span className="block truncate font-semibold text-gray-900" title={pub.title}>
                              {linkLabel}
                            </span>
                          );
                          return (
                            <tr key={`${pub.id || pub.scopus_id || pub.eid}-${index}`} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-center text-gray-700">{rowNumber}</td>
                              <td className="max-w-xs px-4 py-2 lg:max-w-md">
                                <div className="space-y-1">
                                  {titleContent}
                                  {pub.venue || pub.publication_name ? (
                                    <span className="block truncate text-xs text-gray-500">{pub.venue || pub.publication_name}</span>
                                  ) : null}
                                  {pub.scopus_id ? (
                                    <span className="block text-xs text-gray-500">Scopus ID: {pub.scopus_id}</span>
                                  ) : null}
                                  {pub.eid ? <span className="block text-xs text-gray-500">EID: {pub.eid}</span> : null}
                                </div>
                              </td>
                              <td className="max-w-xs px-4 py-2 text-sm text-gray-700" title={pub.author_names || ""}>{pub.author_names || "-"}</td>
                              <td className="px-4 py-2 text-right text-gray-700">{citedByValue ?? "-"}</td>
                              <td className="px-4 py-2 text-center text-gray-700">
                                {shouldShowCiteScore && formatPercentile(citeScorePercentile) ? (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                    Percentile {formatPercentile(citeScorePercentile)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center text-gray-700">
                                {shouldShowCiteScore && journalTier ? (
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${quartileBadgeClass(
                                      journalTier,
                                    )}`}
                                  >
                                    {journalTier.toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center text-gray-700">{yearValue}</td>
                              <td className="px-4 py-2">
                                <div className="flex flex-wrap gap-2 text-xs">
                                  {pub.url && (
                                    <a
                                      href={pub.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-1 text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                                    >
                                      DOI/URL <ExternalLink size={14} />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span>
                          แสดง {(pubMeta.offset || 0) + 1}-
                          {Math.min((pubMeta.offset || 0) + (pubMeta.limit || pageSize), pubMeta.total || 0)} จาก {pubMeta.total || 0}
                        </span>
                        <label className="flex items-center gap-2 text-xs text-slate-500">
                          แถวต่อหน้า
                          <select
                            value={pageSize}
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPageOffset(0); }}
                            disabled={pubLoading}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-60"
                          >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          หน้า {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePageChange(-1)}
                          disabled={currentPage <= 1 || pubLoading}
                          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage >= totalPages || pubLoading}
                          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                        >
                          ถัดไป
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <div>
                        <p className="font-semibold">หมายเหตุเกี่ยวกับ Percentile และ Quartile</p>
                        <p className="text-sm leading-relaxed text-amber-800/90">
                          ค่า Percentile และ Quartile จะอ้างอิงตามปีที่บทความตีพิมพ์ และอาจไม่ถูกต้องและไม่เป็นปัจจุบัน แนะนำให้ตรวจสอบข้อมูลเพิ่มเติมหากใช้ประกอบการตัดสินใจสำคัญ
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
        <dialog
          ref={exportDialogRef}
          aria-labelledby="scopus-export-heading"
          onClose={() => setExportDialogOpen(false)}
          onClick={(event) => { if (event.target === event.currentTarget) setExportDialogOpen(false); }}
          className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[min(calc(100vw-2rem),32rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="scopus-export-heading" className="text-lg font-semibold">ส่งออกข้อมูล Scopus</h2>
                <p className="mt-1 text-sm text-slate-600">เลือกขอบเขตและชุดข้อมูลในไฟล์ Excel</p>
              </div>
              <button type="button" onClick={() => setExportDialogOpen(false)} aria-label="ปิดหน้าต่างส่งออกข้อมูล" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <label className="mt-5 flex flex-col gap-1 text-sm font-medium text-slate-700">
              ขอบเขตข้อมูล
              <select id="export-scope" value={exportScope} onChange={(event) => setExportScope(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                <option value="filtered">ตามคำค้นและตัวกรอง</option>
                <option value="all">ผลงาน KKU ทั้งหมด</option>
              </select>
            </label>
            <p className="mt-2 text-xs text-slate-500">
              {exportScope === "all"
                ? "ส่งออกผลงาน KKU ทั้งหมด โดยไม่ใช้คำค้นและตัวกรอง"
                : "ส่งออกทุกผลลัพธ์ที่ตรงกับคำค้นและตัวกรอง ไม่จำกัดเฉพาะหน้าที่กำลังดู"}
            </p>
            <div className="mt-5 grid gap-2">
              <button type="button" onClick={() => handleExport(exportScope)} disabled={!canExport || exporting || (exportScope !== "all" && !filteredExportReady)} className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}ส่งออกเอกสาร
              </button>
              <button type="button" onClick={() => handleExportByUser(exportScope)} disabled={!canExportByUser || exportingByUser || (exportScope !== "all" && !filteredExportReady)} className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50">
                {exportingByUser ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}ส่งออกรายผู้ใช้
              </button>
              <button type="button" onClick={() => handleExportCombined(exportScope)} disabled={!canExportCombined || exportingCombined || (exportScope !== "all" && !filteredExportReady)} className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50">
                {exportingCombined ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}ส่งออกไฟล์รวม
              </button>
            </div>
          </div>
        </dialog>
      </div>
    </PageLayout>
  );
}
