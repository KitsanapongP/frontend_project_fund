"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, ExternalLink, Loader2, Search } from "lucide-react";
import PageLayout from "../common/PageLayout";
import { APIError, publicationsAPI, usersAPI } from "../../../../../lib/api";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { downloadXlsx } from "@/app/(portal)/research-fund-system/admin/utils/xlsxExporter";

const PUB_PAGE_SIZE = 10;
const EXPORT_COLUMNS = [
  { key: "rowNumber", header: "ลำดับ", width: 8 },
  { key: "scopusId", header: "scopus_id", width: 14 },
  { key: "scopusLink", header: "scopus_link", width: 30 },
  { key: "title", header: "title", width: 60 },
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
  const [publications, setPublications] = useState([]);
  const [pubMeta, setPubMeta] = useState({ total: 0, limit: PUB_PAGE_SIZE, offset: 0 });
  const [pubLoading, setPubLoading] = useState(false);
  const [pubError, setPubError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportingByUser, setExportingByUser] = useState(false);
  const [exportingCombined, setExportingCombined] = useState(false);
  const [exportScope, setExportScope] = useState("filtered");

  const fetchPublications = useCallback(
    async (offset = 0) => {
      setPubLoading(true);
      setPubError("");
      try {
        const params = { limit: PUB_PAGE_SIZE, offset, sort: "year", direction: "desc" };
        if (pubQuery.trim()) {
          params.q = pubQuery.trim();
        }
        const res = await publicationsAPI.searchScopusPublications(params);
        const items = res?.data || [];
        setPublications(items);
        setPubMeta(res?.paging || { total: items.length, limit: PUB_PAGE_SIZE, offset });
      } catch (error) {
        console.error("Load publications error", error);
        setPublications([]);
        setPubMeta({ total: 0, limit: PUB_PAGE_SIZE, offset: 0 });
        setPubError(error?.message || "ไม่สามารถดึงข้อมูลงานวิจัยได้");
      } finally {
        setPubLoading(false);
      }
    },
    [pubQuery]
  );

  useEffect(() => {
    fetchPublications(0);
  }, [fetchPublications]);

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
    const nextOffset = (nextPage - 1) * (pubMeta?.limit || PUB_PAGE_SIZE);
    fetchPublications(nextOffset);
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
    const query = scope === "all" ? "" : pubQuery.trim();
    const limit = pubMeta?.limit || PUB_PAGE_SIZE;
    let offset = 0;
    let total = scope === "all" ? undefined : pubMeta?.total || 0;
    const allRows = [];

    while (true) {
      const params = { limit, offset, sort: "year", direction: "desc" };
      if (scope !== "all" && query) {
        params.q = query;
      }

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
  }, [buildExportRows, exportScope, pubMeta?.limit, pubMeta?.total, pubQuery]);

  const fetchByUserDetailsViaFallback = useCallback(async (scope = exportScope) => {
    const query = scope === "all" ? "" : pubQuery.trim();
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
  }, [buildByUserDetailRow, exportScope, pubQuery]);

  const fetchByUserDetailsRows = useCallback(async (scope = exportScope) => {
    const query = scope === "all" ? "" : pubQuery.trim();
    const limit = 200;
    let offset = 0;
    let total;
    const detailRows = [];

    while (true) {
      const params = { limit, offset, sort: "year", direction: "desc" };
      if (scope !== "all" && query) {
        params.q = query;
      }

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
  }, [buildByUserDetailRow, exportScope, pubQuery]);

  const fetchByUserDetailsWithFallback = useCallback(async (scope = exportScope) => {
    try {
      return await fetchByUserDetailsRows(scope);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
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
  }, [exportScope, fetchByUserDetailsRows, fetchByUserDetailsViaFallback]);

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
      const query = scope === "all" ? "" : pubQuery.trim();
      const generatedAt = new Date().toISOString();
      const metaRows = [
        { key: "generated_at", value: generatedAt },
        { key: "scope", value: scope },
        { key: "query", value: query || "-" },
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
    pubQuery,
  ]);

  return (
    <PageLayout
      title="ค้นหางานวิจัย"
      subtitle="ค้นหาและสำรวจเอกสารจากฐานข้อมูล Scopus"
      icon={Search}
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">ค้นหาเอกสารจาก Scopus</p>
            <p className="text-xs text-slate-500">ดึงข้อมูลเอกสารทั้งหมดที่มีอยู่ในฐานข้อมูล ไม่จำกัดเฉพาะผู้ใช้คนใด</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                className="w-64 rounded-lg border border-slate-300 bg-white px-9 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="ค้นหาชื่อเรื่อง / DOI / EID / คำค้น"
                value={pubQuery}
                onChange={(e) => setPubQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchPublications(0);
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600" htmlFor="export-scope">
                ส่งออก:
              </label>
              <select
                id="export-scope"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value)}
              >
                <option value="filtered">ผลลัพธ์ตามตัวกรอง</option>
                <option value="all">ข้อมูลทั้งหมด</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => fetchPublications(0)}
              disabled={pubLoading}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pubLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}ค้นหาเอกสาร
            </button>
            <button
              type="button"
              onClick={() => handleExport(exportScope)}
              disabled={!canExport || exporting || (exportScope !== "all" && !hasExportableData)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}ส่งออกเอกสาร
            </button>
            <button
              type="button"
              onClick={() => handleExportByUser(exportScope)}
              disabled={!canExportByUser || exportingByUser || (exportScope !== "all" && !hasExportableData)}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportingByUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}ส่งออกจากรายชื่อผู้ใช้
            </button>
            <button
              type="button"
              onClick={() => handleExportCombined(exportScope)}
              disabled={!canExportCombined || exportingCombined || (exportScope !== "all" && !hasExportableData)}
              className="inline-flex items-center justify-center rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 shadow-sm transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exportingCombined ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}ส่งออกทั้งหมด
            </button>
          </div>
        </div>

        <div className="p-5">
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
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-700">รวม {formatNumber(pubMeta.total || 0)} รายการ</div>
                      <div className="text-xs text-slate-500">
                        อัปเดตการค้นหาเพื่อดูเอกสารทั้งหมดที่ตรงกับคำค้น
                      </div>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-14 px-4 py-2 text-center font-medium text-gray-700">ลำดับ</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">ชื่อเรื่อง</th>
                          <th className="w-24 px-4 py-2 text-right font-medium text-gray-700">Cited by</th>
                          <th className="w-28 px-4 py-2 text-center font-medium text-gray-700">Percentile</th>
                          <th className="w-28 px-4 py-2 text-center font-medium text-gray-700">Quartile</th>
                          <th className="w-20 px-4 py-2 text-center font-medium text-gray-700">ปี</th>
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
                              className="group inline-flex max-w-full items-center gap-1 truncate font-semibold text-indigo-700 hover:text-indigo-900"
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
                                    <span className="block text-[11px] text-gray-500">Scopus ID: {pub.scopus_id}</span>
                                  ) : null}
                                  {pub.eid ? <span className="block text-[11px] text-gray-500">EID: {pub.eid}</span> : null}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700">{citedByValue ?? "-"}</td>
                              <td className="px-4 py-2 text-center text-gray-700">
                                {shouldShowCiteScore && formatPercentile(citeScorePercentile) ? (
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                                    Percentile {formatPercentile(citeScorePercentile)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-center text-gray-700">
                                {shouldShowCiteScore && citeScoreQuartile ? (
                                  <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${quartileBadgeClass(
                                      citeScoreQuartile,
                                    )}`}
                                  >
                                    Quartile {citeScoreQuartile.toUpperCase()}
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
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
                      <span>
                        แสดง {(pubMeta.offset || 0) + 1}-
                        {Math.min((pubMeta.offset || 0) + (pubMeta.limit || PUB_PAGE_SIZE), pubMeta.total || 0)} จาก {pubMeta.total || 0}
                      </span>
                      <div className="space-x-2">
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
                        <p className="text-[13px] leading-relaxed text-amber-800/90">
                          ค่า Percentile และ Quartile จะอ้างอิงตามปีที่บทความตีพิมพ์ และอาจไม่ถูกต้อง 100% แนะนำให้ตรวจสอบข้อมูล
                          เพิ่มเติมหากใช้ประกอบการตัดสินใจสำคัญ
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
