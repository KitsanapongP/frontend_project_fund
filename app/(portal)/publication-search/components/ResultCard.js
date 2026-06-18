"use client";
import { useState } from "react";
import Link from "next/link";
import { Tag, User, ChevronDown, ChevronUp } from "lucide-react";

function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 text-inherit rounded-sm px-0.5">{part}</mark>
      : part
  );
}

const parseKeywords = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  let text = String(raw).trim();

  if (text.includes("en_US") || text.includes("th_TH") || text.startsWith("{")) {
    text = text.replace(/['"]?(en_US|th_TH|en|th)['"]?\s*:\s*/gi, '');
    text = text.replace(/[{}[\]"']/g, '');

    let parts = text.split(',');
    if (parts.length === 1) {
      parts = text.split(/\s+/);
    }

    return parts.map(s => s.trim()).filter(w => w.length > 1);
  }

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text.replace(/'/g, '"'));
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  return text.split(",").map(s => s.replace(/["{}\[\]]/g, '').trim()).filter(Boolean);
};

const getSourceLabel = (source) => {
  if (source === 'scopus') return 'Scopus';
  if (source === 'thaijo') return 'TCI-ThaiJO';
  if (source === 'ai_showcase') return 'AI Showcase';
  return source;
};

const TRACK_NAMES = {
  'ag': 'คณะเกษตรศาสตร์',
  'cola': 'วิทยาลัยการปกครองท้องถิ่น',
  'cp': 'วิทยาลัยการคอมพิวเตอร์',
  'kkbs': 'คณะบริหารธุรกิจและการบัญชี',
  'md': 'คณะแพทยศาสตร์',
};

export default function ResultCard({ item, tab, query, index }) {
  if (!item) return null;

  const [showAllKeywords, setShowAllKeywords] = useState(false);

  const authorText = Array.isArray(item.authors) ? item.authors.join(", ") : (item.authors || "");
  const keywordsList = parseKeywords(item.keywords);

  const sourceLabel = getSourceLabel(item.source_name);
  const sourceColor = item.source_name === 'thaijo' 
    ? "bg-emerald-100 text-emerald-700" 
    : item.source_name === 'scopus' 
    ? "bg-sky-100 text-sky-700" 
    : "bg-purple-100 text-purple-700";

  const qualityLabel = item.journal_quartile ?? (item.journal_tier ? `TCI กลุ่ม ${item.journal_tier}` : "-");
  const typeLabel = item.detail_type || "-";
  const trackName = TRACK_NAMES[item.track_id] || "-";

  return (
    <div className="group flex flex-col md:flex-row gap-4 p-5 transition hover:bg-gray-50/80">
      <div className="hidden md:flex flex-col items-center justify-center w-[40px] text-center shrink-0">
        <span className="text-xs font-medium text-gray-400">{index}</span>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        
        <div className="flex items-start gap-2">
          <div className="min-w-0">
            <Link 
              href={`/publication-search/detail/${item.id}`}
              className="text-base font-bold text-gray-800 group-hover:text-[#7F77DD] leading-snug hover:underline decoration-2 underline-offset-4 decoration-[#7F77DD] line-clamp-2"
            >
              {highlightText(item.title, query)}
            </Link>
          </div>
        </div>

        {authorText && (
          <div className="flex flex-wrap gap-1.5">
            {authorText.split(", ").map((name, i) => (
              <Link key={i} href={`/publication-search?q=${encodeURIComponent(name)}&search_field=author${item.source_name === 'ai_showcase' ? '&tab=student' : ''}`}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 
                            bg-[#F3F8FF] text-[#4F8EF7] rounded-full border border-[#DCEBFF]
                            hover:bg-blue-100 hover:border-blue-300 transition cursor-pointer">
                <User size={10} />
                {highlightText(name, query)}
              </Link>
            ))}
          </div>
        )}

        {keywordsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(showAllKeywords ? keywordsList : keywordsList.slice(0, 3)).map((kw, i) => (
              <Link
                key={i}
                href={`/publication-search?q=${encodeURIComponent(kw)}&search_field=keywords`}
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 
                            bg-[#F4FFF8] text-[#34B27B] rounded-full border border-[#DCFCEB]
                            hover:bg-emerald-100 hover:border-emerald-300 transition cursor-pointer">
                <Tag size={10} />
                {highlightText(kw, query)}
              </Link>
            ))}
            {keywordsList.length > 3 && (
              <button
                onClick={() => setShowAllKeywords(!showAllKeywords)}
                className="
                  inline-flex items-center gap-0.5
                  px-2 py-0.5
                  text-[9px] font-medium
                  rounded-full
                  bg-[#F6FFF9]
                  text-[#2FA56F]
                  border border-[#DDF7E8]
                  hover:bg-[#ECFDF5]
                  hover:border-[#CFF2DE]
                  transition
                  cursor-pointer
                "
              >
                {showAllKeywords ? (
                  <>
                    <ChevronUp size={10} />
                    น้อยลง
                  </>
                ) : (
                  <>
                    <ChevronDown size={10} />
                    เพิ่มเติม
                  </>
                )}
              </button>
            )}
          </div>
        )}

      </div>

      {tab === "student" ? (
        <>

          <div className="flex flex-col items-center justify-center w-full md:w-[180px] text-center">
            <span className="inline-flex items-center justify-center gap-1 h-8 w-full text-[10px] font-medium text-amber-700">
              {item.advisors && item.advisors.length > 0
                ? item.advisors.join(", ")
                : "-"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-full md:w-[110px] text-center">
            <span className="inline-flex items-center justify-center h-8 w-full text-xs font-medium text-gray-700">
              {trackName}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center w-full md:w-[60px] text-center">
            <span className="inline-flex items-center justify-center h-8 w-full text-xs font-medium text-gray-500">
              {item.cited_by ?? "-"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-full md:w-[110px] text-center">
            <span className="inline-flex items-center justify-center h-8 w-full text-xs font-medium text-gray-700">
              {qualityLabel}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-full md:w-[90px] text-center">
            <span className="inline-flex items-center justify-center h-8 w-full text-xs font-medium text-gray-700">
              {typeLabel}
            </span>
          </div>
        </>
      )}

      <div className="flex flex-col items-center justify-center w-full md:w-[110px] text-center">
        <span className="inline-flex items-center justify-center h-8 w-full text-xs font-medium text-gray-700 whitespace-nowrap">
            {(item.publication_year ? `${item.publication_year} (${Number(item.publication_year) + 543})` : "-")}
        </span>
      </div>

      <div className={`flex flex-col items-center justify-center w-full ${tab === 'student' ? 'md:w-[120px]' : 'md:w-[200px]'} text-center`}>
        {item.journal_name && (
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-medium text-gray-500 bg-gray-100 leading-tight mb-1.5 max-w-[190px] line-clamp-2">
            {item.journal_name}
          </span>
        )}
        <span className={`inline-flex items-center justify-center h-6 px-1.5 rounded-md text-[9px] font-semibold ${sourceColor}`}>
          {sourceLabel}
        </span>
      </div>

    </div>
  );
}
