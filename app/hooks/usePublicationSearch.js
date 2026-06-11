import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const DEFAULT_FILTERS = {
  sources: [],
  yearStart: "",
  yearEnd: "",
  quartiles: [],
  aggTypes: [],
  tciTiers: [],
  projectTypes: [],
  tracks: [],
};

function getUrlParam(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  return new URLSearchParams(window.location.search).get(key) || fallback;
}

export function usePublicationSearch() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => getUrlParam('tab', 'teacher'));
  const [query, setQuery] = useState(() => getUrlParam('q', ''));
  const [searchField, setSearchField] = useState(() => getUrlParam('search_field', 'all'));
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [yearRange, setYearRange] = useState({ min: null, max: null });
  const [sortField, setSortField] = useState("published_at");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [advancedQueries, setAdvancedQueries] = useState({
    title: "",
    author: "",
    keywords: "",
    abstract: "",
  });

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("tab", tab);
      params.set("page", String(page));

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

      const res = await fetch(`/api/publications/search?${params}`);
      const json = await res.json();

      if (json.success) {
        setResults(json.data || []);
        setTotal(json.total);
        if (json.min_year && json.max_year) {
          setYearRange({ min: json.min_year, max: json.max_year });
        }
      } else {
        setResults([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, query, filters, page, sortField, sortDirection, searchField, advancedQueries]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const sf = searchParams.get('search_field') || 'all';
    if (q !== query || sf !== searchField) {
      setQuery(q);
      setSearchField(sf);
      setPage(1);
    }
    const trackParam = searchParams.get('track');
    if (trackParam) {
      setFilters(f => ({ ...f, tracks: [trackParam] }));
    }
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(fetchResults, 300);
    return () => clearTimeout(t);
  }, [fetchResults]);

  useEffect(() => {
    setPage(1);
    setSortField("published_at");
    setSortDirection("DESC");
  }, [tab]);

  const updateTab = (newTab) => {
    setTab(newTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      window.history.replaceState({}, '', url);
    }
  };

  return {
    tab, setTab: updateTab,
    query, setQuery,
    filters, setFilters,
    results, total, loading,
    page, setPage,
    yearRange,
    sortField, setSortField,
    sortDirection, setSortDirection,
    searchField, setSearchField,
    advancedQueries, setAdvancedQueries,
  };
}