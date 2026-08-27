"use client";

import { useState, useEffect, useRef } from "react";
import { DollarSign } from "lucide-react";
import { teacherAPI } from "../../../../../lib/teacher_api";
import {
  targetRolesUtils,
  filterFundsByRole,
} from "../../../../../lib/target_roles_utils";
import systemConfigAPI from "../../../../../lib/system_config_api";
import { FORM_TYPE_CONFIG } from "../../../../../lib/form_type_config";
import { systemAPI } from "../../../../../lib/api";
import FundCatalogView, {
  FundCatalogErrorState,
  FundCatalogLoadingState,
  FundPeriodNotice,
} from "./FundCatalogView";

const RESEARCH_CATEGORY_KEYWORDS = [
  "ทุนส่งเสริมการวิจัย",
];

const normalizeText = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const extractCategoryTexts = (category) => {
  if (!category || typeof category !== "object") {
    return [];
  }

  const baseTexts = [
    category.category_name,
    category.categoryName,
    category.name,
    category.category_name_en,
    category.categoryNameEn,
  ];

  const subTexts = Array.isArray(category.subcategories)
    ? category.subcategories.flatMap((sub) => [
        sub?.subcategory_name,
        sub?.subcategorie_name,
        sub?.name,
        sub?.fund_condition,
      ])
    : [];

  return [...baseTexts, ...subTexts]
    .filter((text) => text != null && text !== "")
    .map(normalizeText);
};

const matchCategoryByKeywords = (category, keywords = []) => {
  const texts = extractCategoryTexts(category);
  if (!texts.length || !Array.isArray(keywords) || !keywords.length) {
    return false;
  }

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (!normalizedKeyword) {
      return false;
    }

    return texts.some((text) => text.includes(normalizedKeyword));
  });
};

const selectCategoriesByKeywords = (categories = [], keywords = []) => {
  if (!Array.isArray(categories) || !categories.length) {
    return [];
  }

  const directMatches = categories.filter((category) =>
    matchCategoryByKeywords(category, keywords)
  );

  if (directMatches.length) {
    return directMatches;
  }

  const scored = categories
    .map((category) => {
      const texts = extractCategoryTexts(category);
      const score = keywords.reduce((total, keyword) => {
        const normalizedKeyword = normalizeText(keyword);
        if (!normalizedKeyword) {
          return total;
        }
        const hit = texts.some((text) => text.includes(normalizedKeyword));
        return total + (hit ? 1 : 0);
      }, 0);

      return { category, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length) {
    return scored.map((entry) => entry.category);
  }

  return categories.slice(0, 1);
};

export default function ResearchFundContent({ onNavigate }) {
  const [selectedYear, setSelectedYear] = useState("");
  const [fundCategories, setFundCategories] = useState([]);
  const [filteredFunds, setFilteredFunds] = useState([]);
  const [years, setYears] = useState([]);

  const [systemConfig, setSystemConfig] = useState(null);
  const [isWithinApplicationPeriod, setIsWithinApplicationPeriod] = useState(true);
  const [endDateLabel, setEndDateLabel] = useState("");

  const [loading, setLoading] = useState(true);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [showConditionModal, setShowConditionModal] = useState(false);
  const [isConditionModalVisible, setIsConditionModalVisible] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState({ title: "", content: "" });
  const modalRef = useRef(null);

  useEffect(() => {
    if (showConditionModal && modalRef.current) {
      modalRef.current.focus();
    }
  }, [showConditionModal]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadFundData(selectedYear, userRole);
    }
  }, [selectedYear, userRole, isWithinApplicationPeriod, endDateLabel]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, fundCategories]);

  const yearIdFromSelectedYear = () => {
    if (!selectedYear || !Array.isArray(years)) {
      return null;
    }

    const yearItem = years.find((item) => String(item.year) === String(selectedYear));
    return yearItem?.year_id ?? null;
  };

  const findParentCategoryId = (subcategoryId) => {
    if (!subcategoryId) return null;

    const normalizedId = Number(subcategoryId);
    const parent = fundCategories.find((category) =>
      category?.subcategories?.some((sub) => {
        const currentId = sub?.subcategory_id ?? sub?.subcategorie_id;
        return Number(currentId) === normalizedId;
      })
    );

    return parent?.category_id ?? parent?.categoryId ?? null;
  };

  // remaining_budget / used_amount / remaining_grant are provided by the new
  // database table views, so this component no longer parses those fields.

  const computeApplicationOpen = (start, end) => {
    if (!start || !end) return true;
    const parse = (value) => {
      if (value == null) return NaN;
      const s = String(value).trim();
      if (/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) return new Date(s);
      return new Date(s.replace(" ", "T"));
    };

    const startDate = parse(start);
    const endDate = parse(end);
    if (isNaN(startDate) || isNaN(endDate)) return true;

    const now = new Date();
    const nowTime = now.getTime();
    return startDate.getTime() <= nowTime && nowTime <= endDate.getTime();
  };

  const formatThaiDate = (value) => {
    if (!value) return "";
    const date = new Date(String(value).replace(" ", "T"));
    if (isNaN(date.getTime())) return "";
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [roleInfo, yearsData, winData, currentYearRes] = await Promise.all([
        targetRolesUtils.getCurrentUserRole(),
        loadAvailableYears(),
        loadSystemConfig(),
        systemConfigAPI
          .getCurrentYear()
          .catch((err) => {
            console.warn("Failed to fetch current system year:", err);
            return null;
          }),
      ]);

      setUserRole(roleInfo);

      const normalizedYears = Array.isArray(yearsData)
        ? [...yearsData].sort((a, b) => {
            const aYear = Number(a?.year ?? 0);
            const bYear = Number(b?.year ?? 0);
            return bYear - aYear;
          })
        : [];

      setYears(normalizedYears);
      setSystemConfig(winData || null);

      const systemYearCandidate =
        currentYearRes?.current_year ??
        currentYearRes?.data?.current_year ??
        winData?.current_year ??
        null;

      const fallbackYear = normalizedYears.length
        ? String(normalizedYears[0].year)
        : "";

      const resolvedYearCandidate = systemYearCandidate
        ? String(systemYearCandidate)
        : fallbackYear;

      const hasResolvedYear = normalizedYears.some(
        (year) => String(year.year) === resolvedYearCandidate
      );

      const finalYear = hasResolvedYear ? resolvedYearCandidate : fallbackYear;

      if (finalYear) {
        setSelectedYear(finalYear);
      } else {
        setSelectedYear("");
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableYears = async () => {
    try {
      setYearsLoading(true);
      const data = await systemAPI.getYears();
      const yearsData = Array.isArray(data?.years)
        ? data.years
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];
      return yearsData.filter((year) => year && year.year_id && year.year);
    } catch (err) {
      console.error("Error loading years:", err);
      return [];
    } finally {
      setYearsLoading(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      setConfigLoading(true);
      const res = await systemConfigAPI.getWindow();
      const win = systemConfigAPI.normalizeWindow(res);

      const norm = (value) => {
        if (!value) return null;
        const s = String(value).trim();
        if (!s || s === "0000-00-00 00:00:00") return null;
        return s;
      };

      const start_date = norm(win.start_date);
      const end_date = norm(win.end_date);

      const open =
        typeof win.is_open_effective === "boolean"
          ? win.is_open_effective
          : computeApplicationOpen(start_date, end_date);

      setIsWithinApplicationPeriod(open);
      setEndDateLabel(end_date ? formatThaiDate(end_date) : "");
      const payload = {
        start_date,
        end_date,
        is_open_effective: open,
        current_year: win.current_year ?? null,
        last_updated: win.last_updated ?? null,
        now: win.now ?? null,
      };

      return payload;
    } catch (err) {
      console.warn("loadSystemConfig failed:", err);
      setIsWithinApplicationPeriod(true);
      setEndDateLabel("");
      return null;
    } finally {
      setConfigLoading(false);
    }
  };

  const formatDateThaiFull = (dateString) => {
    if (!dateString || dateString === "0000-00-00 00:00:00") return "ไม่ระบุ";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "วันที่ไม่ถูกต้อง";
      const thaiMonths = [
        "มกราคม",
        "กุมภาพันธ์",
        "มีนาคม",
        "เมษายน",
        "พฤษภาคม",
        "มิถุนายน",
        "กรกฎาคม",
        "สิงหาคม",
        "กันยายน",
        "ตุลาคม",
        "พฤศจิกายน",
        "ธันวาคม",
      ];
      const day = date.getDate();
      const month = thaiMonths[date.getMonth()];
      const year = date.getFullYear() + 543;
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${day} ${month} ${year} เวลา ${hours}:${minutes} น.`;
    } catch {
      return "วันที่ไม่ถูกต้อง";
    }
  };

  const getDaysUntilDeadline = () => {
    if (!systemConfig || !systemConfig.end_date || systemConfig.end_date === "0000-00-00 00:00:00") {
      return null;
    }
    try {
      const now = new Date();
      const endDate = new Date(systemConfig.end_date);
      const diffTime = endDate - now;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const loadFundData = async (year, roleContext = userRole) => {
    try {
      setLoading(true);
      setError(null);

      if (!year) {
        setFundCategories([]);
        return;
      }

      const response = await teacherAPI.getVisibleFundsStructure(year);

      if (!response.categories || !Array.isArray(response.categories)) {
        console.error("No categories found or invalid format");
        setFundCategories([]);
        return;
      }

      const visibleCategories = filterFundsByRole(
        response.categories,
        roleContext?.role_id ?? roleContext?.role_name ?? roleContext
      );

      const researchFunds = selectCategoriesByKeywords(
        visibleCategories,
        RESEARCH_CATEGORY_KEYWORDS
      );

      const adjusted = researchFunds.map((category) => {
        const updatedSubs = (category.subcategories || []).map((sub) => {
          const next = { ...sub };
          if (!isWithinApplicationPeriod) {
            const note = endDateLabel ? `\nสิ้นสุดรับคำขอ: ${endDateLabel}` : "";
            const base = (next.fund_condition || "").trim();
            const already = base.includes("สิ้นสุดรับคำขอ:");
            next.fund_condition = already ? base : `${base}${note}`;
          }
          return next;
        });
        return { ...category, subcategories: updatedSubs };
      });

      setFundCategories(adjusted);
    } catch (err) {
      console.error("Error loading fund data:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลทุน");
      setFundCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...fundCategories];

    if (searchTerm) {
      filtered = filtered
        .map((category) => ({
          ...category,
          subcategories:
            category.subcategories?.filter((sub) => {
              const name = sub.subcategorie_name || sub.subcategory_name || "";
              const cond = sub.fund_condition || "";
              return (
                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cond.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }) || [],
        }))
        .filter((category) => category.subcategories && category.subcategories.length > 0);
    }

    setFilteredFunds(filtered);
  };

  const showCondition = (fundName, condition) => {
    setSelectedCondition({ title: fundName, content: condition });
    setShowConditionModal(true);
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => setIsConditionModalVisible(true));
    } else {
      setTimeout(() => setIsConditionModalVisible(true), 0);
    }
  };

  const closeConditionModal = () => {
    setIsConditionModalVisible(false);
    setTimeout(() => setShowConditionModal(false), 250);
  };

  const renderApplicationPeriodInfo = () => {
    if (!systemConfig) return null;

    const daysUntilDeadline = getDaysUntilDeadline();
    const endDateFormatted = formatDateThaiFull(systemConfig.end_date);

    if (!isWithinApplicationPeriod) {
      return (
        <FundPeriodNotice
          tone="danger"
          title="หมดเวลาการยื่นขอทุน"
          description={`การยื่นขอทุนได้สิ้นสุดลงเมื่อ ${endDateFormatted}`}
        />
      );
    }

    if (daysUntilDeadline !== null && daysUntilDeadline <= 7) {
      return (
        <FundPeriodNotice
          tone="warning"
          title={daysUntilDeadline > 0 ? `เหลือเวลาอีก ${daysUntilDeadline} วัน` : "วันสุดท้ายของการยื่นขอทุน"}
          description={`การยื่นขอทุนจะสิ้นสุดในวันที่ ${endDateFormatted}`}
        />
      );
    }

    if (systemConfig.end_date && systemConfig.end_date !== "0000-00-00 00:00:00") {
      return (
        <FundPeriodNotice
          tone="info"
          title="ระยะเวลาการยื่นขอทุน"
          description={`สามารถยื่นขอทุนได้ถึงวันที่ ${endDateFormatted}`}
        />
      );
    }

    return null;
  };

  if (loading) {
    return <FundCatalogLoadingState />;
  }

  if (error) {
    return <FundCatalogErrorState message={error} onRetry={() => loadFundData(selectedYear)} />;
  }

  const handleViewDetails = (subcategory) => {
    const formType = subcategory?.form_type || "download";
    const formConfig = FORM_TYPE_CONFIG[formType] || {};

    if (!formConfig.isOnlineForm) {
      const docUrl = subcategory?.form_url || "/documents/default-fund-form.docx";
      if (typeof window !== "undefined") {
        window.open(docUrl, "_blank");
      }
      return;
    }

    try {
      sessionStorage.setItem("fund_form_readonly", "1");
    } catch {}

    if (onNavigate) {
      const resolvedSubcategoryId =
        subcategory?.subcategory_id || subcategory?.subcategorie_id || null;
      const resolvedSubcategoryName =
        subcategory?.subcategory_name || subcategory?.subcategorie_name || "";

      onNavigate(
        formConfig.route || "generic-fund-application",
        {
          category_id: findParentCategoryId(resolvedSubcategoryId),
          year_id: yearIdFromSelectedYear(),
          subcategory,
          subcategory_id: resolvedSubcategoryId,
          subcategory_name: resolvedSubcategoryName,
          originPage: "research-fund",
        },
        { mode: "view-only" }
      );
    }
  };

  return (
    <FundCatalogView
      title="ทุนส่งเสริมงานวิจัยและนวัตกรรม"
      subtitle="รายการทุนส่งเสริมงานวิจัยที่เปิดรับสมัคร"
      icon={DollarSign}
      breadcrumbLabel="ทุนส่งเสริมงานวิจัย"
      applicationPeriodInfo={renderApplicationPeriodInfo()}
      years={years}
      selectedYear={selectedYear}
      yearsLoading={yearsLoading}
      onYearChange={(event) => setSelectedYear(event.target.value)}
      searchTerm={searchTerm}
      onSearchChange={(event) => setSearchTerm(event.target.value)}
      filteredFunds={filteredFunds}
      fundCategories={fundCategories}
      emptyTitle="ไม่พบทุนส่งเสริมงานวิจัย"
      emptyYearMessage="ไม่มีทุนส่งเสริมงานวิจัยในปีงบประมาณนี้"
      isWithinApplicationPeriod={isWithinApplicationPeriod}
      onShowCondition={showCondition}
      onViewDetails={handleViewDetails}
      conditionModal={{
        isOpen: showConditionModal,
        isVisible: isConditionModalVisible,
        title: selectedCondition.title,
        content: selectedCondition.content,
        onClose: closeConditionModal,
        modalRef,
      }}
    />
  );
}
