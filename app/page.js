"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  BriefcaseBusiness,
  ExternalLink,
  FileSearch,
  GraduationCap,
  Handshake,
  Users,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "./contexts/AuthContext";
import PublicHeader from "./components/public/PublicHeader";
import MemberHeader from "./member/components/layout/Header";
import { getSupportFundMappings } from "./lib/support_fundmapping_api";
import { canAccessPortalRule, getPortalItemAccess } from "./lib/portal_access";

const PORTAL_ITEMS = [
  {
    id: "researchFund",
    label: "กองทุนวิจัยฯ",
    href: "/member/research-fund",
    icon: BookOpenText,
    description: "ข้อมูลกองทุนและการใช้งานระบบ",
  },
  {
    id: "externalFund",
    label: "ทุนภายนอก",
    href: "/external-fund",
    icon: BriefcaseBusiness,
    description: "รายการและประกาศทุนจากแหล่งภายนอก",
  },
  {
    id: "publicationSearch",
    label: "สืบค้นผลงาน",
    href: "/publication-search",
    icon: FileSearch,
    description: "สืบค้นข้อมูลผลงานและผลงานนักศึกษา",
  },
  {
    id: "mou",
    label: "MOU",
    href: "/mou",
    icon: Handshake,
    description: "ข้อมูลความร่วมมือและบันทึกข้อตกลง",
  },
  {
    id: "links",
    label: "Links",
    href: "/links",
    icon: ExternalLink,
    description: "ลิงก์ระบบที่เกี่ยวข้อง",
  },
  {
    id: "researcherMatching",
    label: "จับคู่นักวิจัย",
    href: "/?page=researcherMatching",
    icon: Users,
    description: "ค้นหาและจับคู่หัวข้อกับนักวิจัย",
  },
  {
    id: "researcherManagement",
    label: "จัดการบุคลากร",
    href: "/researcher-management",
    icon: GraduationCap,
    description: "บริหารจัดการข้อมูลบุคลากรวิจัย",
  },
];

const RENDERABLE_PAGE_IDS = new Set(["researchFund", "researcherMatching"]);
const PAGE_TITLES = {
  home: "หน้าหลัก",
  researchFund: "กองทุนวิจัยฯ",
  researcherMatching: "จับคู่นักวิจัย",
};

const APP_DISPLAY_NAME = "ระบบบริหารจัดการทุนวิจัย";

const MATCHING_STATUS_LABELS = {
  N: "ยังไม่ได้จับคู่",
  Y: "จับคู่แล้ว",
  C: "ปิดโครงการแล้ว",
  D: "ยกเลิกความต้องการ",
};

const MATCHING_STATUS_UI = {
  N: "border-amber-200 bg-amber-50 text-amber-800",
  Y: "border-emerald-200 bg-emerald-50 text-emerald-800",
  C: "border-slate-300 bg-slate-100 text-slate-700",
  D: "border-rose-200 bg-rose-50 text-rose-800",
  default: "border-blue-200 bg-blue-50 text-blue-800",
};

function createEmptyAdvancedFilters() {
  return {
    req_code: "",
    name: "",
    owner: "",
    faculty: "",
    matching_status: "",
    matched_researcher: "",
    keywords: "",
  };
}

function PortalGridContent({ onCardClick }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PORTAL_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onCardClick(item)}
              className="group w-full rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.label}</h3>
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ComingSoonContent({ pageTitle }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="px-8 py-14 sm:px-12 text-center">
        <p className="text-lg font-semibold text-gray-700">{pageTitle}</p>
        <p className="mt-2 text-2xl font-bold text-gray-900">กำลังพัฒนา... (Coming Soon)</p>
      </div>
    </section>
  );
}

function normalizeSearchText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toLowerCase();
}

function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : "-";
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function getMappingName(item, fallbackIndex) {
  const name = typeof item?.name === "string" ? item.name.trim() : "";
  if (name) {
    return name;
  }

  return `รายการที่ ${fallbackIndex + 1}`;
}

function getItemValueByKeys(item, keys = []) {
  if (!item || typeof item !== "object") {
    return undefined;
  }

  const normalizedKeyMap = new Map(Object.keys(item).map((key) => [String(key).toLowerCase(), key]));

  for (const key of keys) {
    const matchedKey = normalizedKeyMap.get(String(key).toLowerCase());
    if (!matchedKey) {
      continue;
    }

    return item[matchedKey];
  }

  return undefined;
}

function getMatchingStatusCode(value) {
  const normalized = normalizeSearchText(value).toUpperCase();
  return ["N", "Y", "C", "D"].includes(normalized) ? normalized : "";
}

function formatDetailFieldValue(key, value) {
  const normalizedKey = String(key || "").toLowerCase();
  if (normalizedKey === "maching_status" || normalizedKey === "matching_status") {
    const statusCode = getMatchingStatusCode(value);
    if (statusCode && MATCHING_STATUS_LABELS[statusCode]) {
      return MATCHING_STATUS_LABELS[statusCode];
    }
  }

  return formatFieldValue(value);
}

function getMatchingStatusMeta(value) {
  const code = getMatchingStatusCode(value);
  const label = MATCHING_STATUS_LABELS[code] || "ไม่ระบุสถานะ";
  const badgeClass = MATCHING_STATUS_UI[code] || MATCHING_STATUS_UI.default;

  return {
    code: code || "-",
    label,
    badgeClass,
  };
}

function parseKeywordList(value) {
  const text = formatFieldValue(value);
  if (!text || text === "-") {
    return [];
  }

  return text
    .split(/[;,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSearchTokens(value) {
  return normalizeSearchText(value)
    .split(/[\s,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ResearcherMatchingContent() {
  const [mappings, setMappings] = useState([]);
  const [basicQueryInput, setBasicQueryInput] = useState("");
  const [basicQueryApplied, setBasicQueryApplied] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advancedDraft, setAdvancedDraft] = useState(() => createEmptyAdvancedFilters());
  const [advancedApplied, setAdvancedApplied] = useState(() => createEmptyAdvancedFilters());
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadMappings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    setSelectedItem(null);
    setBasicQueryInput("");
    setBasicQueryApplied("");
    setIsAdvancedOpen(false);
    setAdvancedDraft(createEmptyAdvancedFilters());
    setAdvancedApplied(createEmptyAdvancedFilters());

    try {
      const { data } = await getSupportFundMappings();
      const rows = Array.isArray(data)
        ? data.filter((row) => row && typeof row === "object")
        : [];

      setMappings(rows);
    } catch (error) {
      setMappings([]);
      setErrorMessage(error?.message || "ไม่สามารถโหลดข้อมูลจับคู่นักวิจัยได้");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const hasAdvancedFilters = useMemo(() => {
    return Object.values(advancedApplied).some((value) => normalizeSearchText(value) !== "");
  }, [advancedApplied]);

  const filteredMappings = useMemo(() => {
    const basicQuery = normalizeSearchText(basicQueryApplied);
    const advancedFilters = {
      req_code: normalizeSearchText(advancedApplied.req_code),
      name: normalizeSearchText(advancedApplied.name),
      owner: normalizeSearchText(advancedApplied.owner),
      faculty: normalizeSearchText(advancedApplied.faculty),
      matching_status: getMatchingStatusCode(advancedApplied.matching_status),
      matched_researcher: normalizeSearchText(advancedApplied.matched_researcher),
      keywords: normalizeSearchText(advancedApplied.keywords),
    };
    const keywordTokens = parseSearchTokens(advancedApplied.keywords);

    return mappings.filter((item) => {
      const reqCode = normalizeSearchText(getItemValueByKeys(item, ["req_code"]));
      const name = normalizeSearchText(getItemValueByKeys(item, ["name"]));
      const owner = normalizeSearchText(getItemValueByKeys(item, ["owner"]));
      const faculty = normalizeSearchText(getItemValueByKeys(item, ["faculty"]));
      const statusCode = getMatchingStatusCode(
        getItemValueByKeys(item, ["matching_status", "maching_status"])
      );
      const statusLabel = normalizeSearchText(MATCHING_STATUS_LABELS[statusCode] || "");
      const matchedResearcher = normalizeSearchText(
        getItemValueByKeys(item, ["matched_researcher", "mached_researcher"])
      );
      const keywords = normalizeSearchText(getItemValueByKeys(item, ["keywords", "keyword"]));

      if (basicQuery) {
        const basicPool = [
          reqCode,
          name,
          owner,
          faculty,
          statusCode.toLowerCase(),
          statusLabel,
          matchedResearcher,
          keywords,
        ];

        if (!basicPool.some((value) => value.includes(basicQuery))) {
          return false;
        }
      }

      if (advancedFilters.req_code && !reqCode.includes(advancedFilters.req_code)) {
        return false;
      }

      if (advancedFilters.name && !name.includes(advancedFilters.name)) {
        return false;
      }

      if (advancedFilters.owner && !owner.includes(advancedFilters.owner)) {
        return false;
      }

      if (advancedFilters.faculty && !faculty.includes(advancedFilters.faculty)) {
        return false;
      }

      if (advancedFilters.matching_status && statusCode !== advancedFilters.matching_status) {
        return false;
      }

      if (
        advancedFilters.matched_researcher &&
        !matchedResearcher.includes(advancedFilters.matched_researcher)
      ) {
        return false;
      }

      if (advancedFilters.keywords && keywordTokens.some((token) => !keywords.includes(token))) {
        return false;
      }

      return true;
    });
  }, [advancedApplied, basicQueryApplied, mappings]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    const basicQuery = basicQueryApplied.trim();

    if (basicQuery) {
      chips.push({
        key: "basic",
        label: `ค้นหาทั่วไป: ${basicQuery}`,
      });
    }

    if (advancedApplied.req_code.trim()) {
      chips.push({ key: "req_code", label: `รหัส: ${advancedApplied.req_code.trim()}` });
    }

    if (advancedApplied.name.trim()) {
      chips.push({ key: "name", label: `ชื่องาน: ${advancedApplied.name.trim()}` });
    }

    if (advancedApplied.owner.trim()) {
      chips.push({ key: "owner", label: `เจ้าของ: ${advancedApplied.owner.trim()}` });
    }

    if (advancedApplied.faculty.trim()) {
      chips.push({ key: "faculty", label: `คณะ: ${advancedApplied.faculty.trim()}` });
    }

    if (advancedApplied.matching_status) {
      const code = getMatchingStatusCode(advancedApplied.matching_status);
      chips.push({
        key: "matching_status",
        label: `สถานะ: ${MATCHING_STATUS_LABELS[code] || advancedApplied.matching_status}`,
      });
    }

    if (advancedApplied.matched_researcher.trim()) {
      chips.push({
        key: "matched_researcher",
        label: `นักวิจัย CP: ${advancedApplied.matched_researcher.trim()}`,
      });
    }

    if (advancedApplied.keywords.trim()) {
      chips.push({ key: "keywords", label: `คีย์เวิร์ด: ${advancedApplied.keywords.trim()}` });
    }

    return chips;
  }, [advancedApplied, basicQueryApplied]);

  const applyBasicSearch = useCallback(() => {
    setBasicQueryApplied(basicQueryInput.trim());
  }, [basicQueryInput]);

  const applyAdvancedSearch = useCallback(() => {
    setAdvancedApplied({
      req_code: advancedDraft.req_code.trim(),
      name: advancedDraft.name.trim(),
      owner: advancedDraft.owner.trim(),
      faculty: advancedDraft.faculty.trim(),
      matching_status: getMatchingStatusCode(advancedDraft.matching_status),
      matched_researcher: advancedDraft.matched_researcher.trim(),
      keywords: advancedDraft.keywords.trim(),
    });
  }, [advancedDraft]);

  const resetAdvancedSearch = useCallback(() => {
    setAdvancedDraft(createEmptyAdvancedFilters());
    setAdvancedApplied(createEmptyAdvancedFilters());
  }, []);

  const clearAllSearch = useCallback(() => {
    setBasicQueryInput("");
    setBasicQueryApplied("");
    setAdvancedDraft(createEmptyAdvancedFilters());
    setAdvancedApplied(createEmptyAdvancedFilters());
  }, []);

  if (isLoading) {
    return (
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-12 text-center sm:px-10">
          <p className="text-base font-medium text-gray-700">กำลังโหลดข้อมูลจับคู่นักวิจัย...</p>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-10 text-center sm:px-10">
          <p className="text-base font-semibold text-red-600">ไม่สามารถโหลดข้อมูลได้</p>
          <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
          <button
            onClick={loadMappings}
            className="mt-6 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </section>
    );
  }

  if (selectedItem) {
    const selectedName = getMappingName(selectedItem, 0);
    const summaryStatus = getMatchingStatusMeta(
      getItemValueByKeys(selectedItem, ["matching_status", "maching_status"])
    );
    const summaryFields = [
      {
        label: "รหัสความต้องการ",
        value: formatDetailFieldValue("req_code", getItemValueByKeys(selectedItem, ["req_code"])),
      },
      {
        label: "สถานะการจับคู่งาน",
        value: summaryStatus.label,
      },
      {
        label: "เจ้าของเรื่อง/ความต้องการ",
        value: formatDetailFieldValue("owner", getItemValueByKeys(selectedItem, ["owner"])),
      },
      {
        label: "ช่องทางติดต่อ",
        value: formatDetailFieldValue("owner_contact", getItemValueByKeys(selectedItem, ["owner_contact"])),
      },
      {
        label: "คณะ",
        value: formatDetailFieldValue("faculty", getItemValueByKeys(selectedItem, ["faculty"])),
      },
      {
        label: "กำหนดส่ง",
        value: formatDetailFieldValue("deadline", getItemValueByKeys(selectedItem, ["deadline"])),
      },
      {
        label: "ชื่อนักวิจัยของ CP",
        value: formatDetailFieldValue(
          "matched_researcher",
          getItemValueByKeys(selectedItem, ["matched_researcher", "mached_researcher"])
        ),
      },
    ];

    const detailTextFields = [
      {
        label: "รายละเอียดงาน",
        value: formatDetailFieldValue("description", getItemValueByKeys(selectedItem, ["description"])),
      },
      {
        label: "เป้าหมายของงาน",
        value: formatDetailFieldValue("dev_plan", getItemValueByKeys(selectedItem, ["dev_plan"])),
      },
      {
        label: "รายละเอียดความต้องการเชิงเทคนิค",
        value: formatDetailFieldValue("tech_comment", getItemValueByKeys(selectedItem, ["tech_comment"])),
      },
      {
        label: "รายละเอียดเพิ่มเติม",
        value: formatDetailFieldValue("comment", getItemValueByKeys(selectedItem, ["Comment", "comment"])),
      },
    ];

    const keywordList = parseKeywordList(getItemValueByKeys(selectedItem, ["keywords", "keyword"]));

    return (
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setSelectedItem(null)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span aria-hidden>←</span>
              <span>กลับไปยังรายการทั้งหมด</span>
            </button>

            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${summaryStatus.badgeClass}`}>
              {summaryStatus.label}
            </span>
          </div>

          <h3 className="mt-5 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{selectedName}</h3>
        </div>

        <div className="p-5 sm:p-8">
          <section>
            <h4 className="text-xl font-bold text-slate-900">ข้อมูลหลัก</h4>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {summaryFields.map((field) => (
                <div key={field.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-700">{field.label}</p>
                  <p className="mt-1 break-words text-base font-medium text-slate-900">{field.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h4 className="text-xl font-bold text-slate-900">รายละเอียดโครงการ</h4>
            <div className="mt-4 grid gap-4">
              {detailTextFields.map((field) => (
                <article key={field.label} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-base font-semibold text-slate-800">{field.label}</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
                    {field.value}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h4 className="text-xl font-bold text-slate-900">คีย์เวิร์ด</h4>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
              {keywordList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {keywordList.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">-</p>
              )}
            </div>
          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-100 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.42)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />

      <div className="relative border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 px-4 py-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">รายการความต้องการ</p>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
            แสดง {filteredMappings.length} จากทั้งหมด {mappings.length} รายการ
          </span>
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-[0_12px_30px_-25px_rgba(6,95,70,0.45)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">ค้นหาแบบปกติ</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
                <input
                  type="text"
                  value={basicQueryInput}
                  onChange={(event) => setBasicQueryInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyBasicSearch();
                    }
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  placeholder="พิมพ์คำค้นหา เช่น คณะ, คีย์เวิร์ด, เจ้าของเรื่อง"
                />
              </div>
            </label>

            <button
              type="button"
              onClick={applyBasicSearch}
              className="inline-flex items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              ค้นหา
            </button>

            <button
              type="button"
              onClick={clearAllSearch}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ล้างทั้งหมด
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen((previous) => !previous)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span>{isAdvancedOpen ? "ซ่อน" : "แสดง"} Advanced Search</span>
            </button>

            {hasAdvancedFilters && (
              <span className="text-xs font-medium text-slate-500">มีการใช้งานตัวกรองขั้นสูง</span>
            )}
          </div>

          {isAdvancedOpen && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="text-sm font-semibold text-slate-800">Advanced Search</p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">รหัสความต้องการ</span>
                  <input
                    type="text"
                    value={advancedDraft.req_code}
                    onChange={(event) =>
                      setAdvancedDraft((previous) => ({ ...previous, req_code: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    placeholder="เช่น REQ-001"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">ชื่องาน</span>
                  <input
                    type="text"
                    value={advancedDraft.name}
                    onChange={(event) =>
                      setAdvancedDraft((previous) => ({ ...previous, name: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">เจ้าของเรื่อง/ความต้องการ</span>
                  <input
                    type="text"
                    value={advancedDraft.owner}
                    onChange={(event) =>
                      setAdvancedDraft((previous) => ({ ...previous, owner: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">คณะ</span>
                  <input
                    type="text"
                    value={advancedDraft.faculty}
                    onChange={(event) =>
                      setAdvancedDraft((previous) => ({ ...previous, faculty: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">สถานะการจับคู่งาน</span>
                  <select
                    value={advancedDraft.matching_status}
                    onChange={(event) =>
                      setAdvancedDraft((previous) => ({ ...previous, matching_status: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="">ทั้งหมด</option>
                    <option value="N">ยังไม่ได้จับคู่</option>
                    <option value="Y">จับคู่แล้ว</option>
                    <option value="C">ปิดโครงการแล้ว</option>
                    <option value="D">ยกเลิกความต้องการ</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">ชื่อนักวิจัยของ CP</span>
                  <input
                    type="text"
                    value={advancedDraft.matched_researcher}
                    onChange={(event) =>
                      setAdvancedDraft((previous) => ({ ...previous, matched_researcher: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="block sm:col-span-2 lg:col-span-3">
                  <span className="mb-1 block text-xs font-medium text-slate-600">คีย์เวิร์ด</span>
                  <input
                    type="text"
                    value={advancedDraft.keywords}
                    onChange={(event) =>
                      setAdvancedDraft((previous) => ({ ...previous, keywords: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    placeholder="เช่น AI machine-learning IoT (คั่นด้วยช่องว่าง , หรือ ;)"
                  />
                  <span className="mt-1 block text-xs text-slate-500">
                    ค้นหาได้หลายคำ ระบบจะหาเฉพาะรายการที่มีครบทุกคำ
                  </span>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyAdvancedSearch}
                  className="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  ใช้ตัวกรอง
                </button>
                <button
                  type="button"
                  onClick={resetAdvancedSearch}
                  className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            </div>
          )}
        </div>

        {activeFilterChips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
              >
                {chip.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative p-4 sm:p-6">
        {filteredMappings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {mappings.length === 0 ? "ยังไม่มีข้อมูลใน support_fundmapping" : "ไม่พบข้อมูลตามเงื่อนไขค้นหา"}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMappings.map((item, index) => {
              const displayName = getMappingName(item, index);
              const itemKey = item?.support_fundmapping_id ?? item?.id ?? `${displayName}-${index}`;
              const owner = formatDetailFieldValue("owner", getItemValueByKeys(item, ["owner"]));
              const faculty = formatDetailFieldValue("faculty", getItemValueByKeys(item, ["faculty"]));
              const deadline = formatDetailFieldValue("deadline", getItemValueByKeys(item, ["deadline"]));
              const statusMeta = getMatchingStatusMeta(
                getItemValueByKeys(item, ["matching_status", "maching_status"])
              );

              return (
                <button
                  key={itemKey}
                  onClick={() => setSelectedItem(item)}
                  className="group w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_18px_34px_-28px_rgba(14,116,144,0.45)]"
                >
                  <div className="flex gap-3 px-4 py-4 sm:px-5">
                    <span className="mt-0.5 inline-flex h-8 min-w-[2rem] items-center justify-center rounded-full bg-slate-100 px-2 text-sm font-semibold text-slate-700">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold leading-snug text-slate-900 sm:text-base">{displayName}</p>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                        <p className="truncate rounded-lg bg-slate-100 px-2.5 py-1.5" title={owner}>
                          <span className="font-semibold text-slate-600">เจ้าของ:</span> {owner}
                        </p>
                        <p className="truncate rounded-lg bg-slate-100 px-2.5 py-1.5" title={faculty}>
                          <span className="font-semibold text-slate-600">คณะ:</span> {faculty}
                        </p>
                        <p className="truncate rounded-lg bg-slate-100 px-2.5 py-1.5" title={deadline}>
                          <span className="font-semibold text-slate-600">กำหนดส่ง:</span> {deadline}
                        </p>
                      </div>
                    </div>

                    <div className="hidden items-center sm:flex">
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 transition group-hover:border-cyan-300 group-hover:bg-cyan-100">
                        ดูรายละเอียด
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, hasAnyRole, hasAnyPermission } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");

  const promptLoginRequired = useCallback(
    async (targetHref) => {
      const result = await Swal.fire({
        title: "แจ้งเตือน",
        text: "กรุณาเข้าสู่ระบบเพื่อใช้งาน",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "เข้าสู่ระบบ",
        cancelButtonText: "ปิด",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const nextPath = targetHref || "/";
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      }
    },
    [router]
  );

  const promptNoPermission = useCallback(async () => {
    await Swal.fire({
      title: "แจ้งเตือน",
      text: "คุณไม่มีสิทธิ์เข้าใช้งานส่วนนี้",
      icon: "warning",
      confirmButtonText: "ปิด",
    });
  }, []);

  useEffect(() => {
    const requestedPage = searchParams.get("page");

    if (requestedPage && RENDERABLE_PAGE_IDS.has(requestedPage)) {
      setCurrentPage(requestedPage);
      return;
    }

    setCurrentPage("home");
  }, [searchParams]);

  useEffect(() => {
    if (isLoading || currentPage === "home") {
      return;
    }

    const pageAccessRule = getPortalItemAccess(currentPage);
    const canAccessCurrentPage = canAccessPortalRule(pageAccessRule, {
      isAuthenticated,
      hasAnyRole,
      hasAnyPermission,
    });

    if (pageAccessRule.requireAuth && !isAuthenticated) {
      setCurrentPage("home");
      const targetPath = currentPage === "researchFund" ? "/member/research-fund" : `/?page=${currentPage}`;
      void promptLoginRequired(targetPath);
      return;
    }

    if (!canAccessCurrentPage) {
      setCurrentPage("home");
      void promptNoPermission();
      return;
    }

    if (currentPage === "researchFund") {
      router.push("/member/research-fund");
      setCurrentPage("home");
    }
  }, [
    currentPage,
    isAuthenticated,
    isLoading,
    hasAnyRole,
    hasAnyPermission,
    promptLoginRequired,
    promptNoPermission,
    router,
  ]);

  const currentPageTitle = useMemo(() => {
    return PAGE_TITLES[currentPage] || "หน้าหลัก";
  }, [currentPage]);

  const handleBackToPortal = () => {
    router.push("/");
    setCurrentPage("home");
  };

  const handlePortalCardClick = (item) => {
    const rule = getPortalItemAccess(item?.id);
    const canAccess = canAccessPortalRule(rule, {
      isAuthenticated,
      hasAnyRole,
      hasAnyPermission,
    });

    if (!rule.requireAuth) {
      router.push(item.href);
      return;
    }

    if (!isAuthenticated) {
      void promptLoginRequired(item.href);
      return;
    }

    if (!canAccess) {
      void promptNoPermission();
      return;
    }

    router.push(item.href);
  };

  const renderPageContent = () => {
    if (currentPage === "home") {
      return <PortalGridContent onCardClick={handlePortalCardClick} />;
    }

    const renderContentWithBack = (content) => (
      <div className="space-y-3">
        <button
          onClick={handleBackToPortal}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          <ArrowLeft size={16} className="me-2" />
          กลับหน้าหลัก
        </button>
        {content}
      </div>
    );

    if (currentPage === "researcherMatching") {
      return renderContentWithBack(<ResearcherMatchingContent />);
    }

    return <ComingSoonContent pageTitle={currentPageTitle} />;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white text-center">
        <Image
          src="/image_icon/fund_cpkku_logo.png"
          alt="โลโก้กองทุนวิจัย"
          width={160}
          height={160}
          priority
        />
        <h1 className="text-2xl font-bold text-gray-900">{APP_DISPLAY_NAME}</h1>
        <div className="space-y-1 text-gray-600">
          <p className="text-lg font-medium text-gray-700">กำลังโหลดหน้า...</p>
          <p className="text-sm text-gray-500">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {isAuthenticated ? (
        <MemberHeader
          isOpen={isMenuOpen}
          setIsOpen={setIsMenuOpen}
          currentPageTitle={currentPageTitle}
        />
      ) : (
        <PublicHeader
          isOpen={isMenuOpen}
          setIsOpen={setIsMenuOpen}
          currentPageTitle={currentPageTitle}
          loginHref="/login"
        />
      )}

      <main className="pt-40 lg:pt-32 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="bg-gray-100 p-1 sm:p-2">{renderPageContent()}</div>
        </div>
      </main>
    </div>
  );
}
