"use client";
import { useState, useEffect } from "react";
import api from "../../../lib/api";

export default function ResearchDocsTab({ targetUserId, hideHeader = false }) {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]); 
  const [filterMode, setFilterMode] = useState("all"); // เปลี่ยนค่าเริ่มต้นเป็น 'all' เพื่อให้เห็นภาพรวมก่อน หรือจะเปลี่ยนเป็นช่วงแรกก็ได้ครับ
  const [isLoading, setIsLoading] = useState(false);
  const [yearRanges, setYearRanges] = useState([]); // State สำหรับเก็บช่วงปีที่คำนวณได้ของแต่ละคน

  // ดึงข้อมูลทั้งหมดจาก API
  useEffect(() => {
    if (targetUserId) {
      const fetchDocuments = async () => {
        setIsLoading(true);
        try {
          const res = await api.get(`/admin/instructors/${targetUserId}/documents`);
          setDocuments(res || []);
        } catch (err) {
          console.error("Error fetching docs:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDocuments();
    }
  }, [targetUserId]);

  // ─── 1. คำนวณช่วงปีละ 5 ปี แบบไดนามิกตามข้อมูลของแต่ละคน ───
  useEffect(() => {
    if (documents.length === 0) {
      setYearRanges([]);
      return;
    }

    const currentYear = new Date().getFullYear();
    
    // หาปีที่เก่าที่สุดในข้อมูลของอาจารย์คนนี้
    const years = documents.map(doc => Number(doc.publish_year)).filter(Boolean);
    const minYear = years.length > 0 ? Math.min(...years) : currentYear;

    const ranges = [];
    let startYear = currentYear;

    // ลูปสร้างช่วงทีละ 5 ปี ถอยลงไปเรื่อย ๆ จนกว่าจะครอบคลุม minYear
    while (startYear >= minYear) {
      const endYear = startYear - 4;
      ranges.push({
        key: `${startYear}-${endYear}`,
        start: startYear,
        end: endYear,
        label: `ผลงานช่วงปี ${startYear} - ${endYear}`
      });
      startYear = endYear - 1; // ขยับไปเริ่มช่วงถัดไป เช่น จาก 2022 ก็ไปเริ่ม 2021
    }

    setYearRanges(ranges);
    // Option: ถ้าอยากให้ default เลือก 5 ปีแรกเสมอ สามารถ uncomment บรรทัดด้านล่างนี้ได้ครับ
    // if (ranges.length > 0) setFilterMode(ranges[0].key);
  }, [documents]);

  // ─── 2. Logic คัดกรองข้อมูลตามช่วงปีที่เลือก ───
  useEffect(() => {
    if (filterMode === "all") {
      setFilteredDocs(documents);
    } else {
      // ค้นหาช่วงปีที่ตรงกับค่า key ใน filterMode (เช่น "2026-2022")
      const activeRange = yearRanges.find(r => r.key === filterMode);
      
      if (activeRange) {
        const filtered = documents.filter((doc) => {
          const year = Number(doc.publish_year);
          return year >= activeRange.end && year <= activeRange.start;
        });
        setFilteredDocs(filtered);
      } else {
        setFilteredDocs(documents);
      }
    }
  }, [documents, filterMode, yearRanges]);

  const renderAPAStyle = (doc) => {
    const formatAuthors = (htmlContent) => {
      if (!htmlContent) return "";
      const thRegex = /[\u0e00-\u0e7f]/;
      if (!thRegex.test(htmlContent)) return htmlContent;

      let cleanHtml = htmlContent.replace(
        /(รศ\.ดร\.|ผศ\.ดร\.|ดร\.|อ\.|ศาสตราจารย์|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|นาย|นางสาว|นาง|คุณ)\s?/g,
        ""
      );

      const authorArray = cleanHtml.split(",");
      const formatted = authorArray.map((authorStr) => {
        let trimmed = authorStr.trim();
        if (!trimmed) return "";

        let hasAmpersand = false;
        if (trimmed.startsWith("&")) {
          hasAmpersand = true;
          trimmed = trimmed.replace("&", "").trim();
        }

        const hasStrong = trimmed.includes("<strong>");
        const pureName = trimmed.replace(/<\/?strong>/g, "").trim();
        const nameParts = pureName.split(/\s+/);

        let result;
        if (nameParts.length >= 2) {
          result = `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(" ")}`;
        } else {
          result = pureName;
        }

        if (hasStrong) result = `<strong>${result}</strong>`;
        if (hasAmpersand) result = `& ${result}`;
        return result;
      });

      return formatted.filter(Boolean).join(", ");
    };

    const authorsHtml = (() => {
      const a = formatAuthors(doc.authors);
      return a.endsWith(".") ? a : `${a}.`;
    })();

    const formatConferenceDate = (startDate, endDate, coverDisplayDate) => {
      if (!coverDisplayDate || typeof coverDisplayDate !== 'string') return "";

      let displayDate = coverDisplayDate.trim();
      const yearStr = String(doc.publish_year);
      if (displayDate.includes(yearStr)) {
        displayDate = displayDate
          .replace(yearStr, "")
          .replace(/,\s*$/, "") 
          .trim();
      }

      return displayDate;
    };

    return (
      <div className="text-sm text-gray-700 leading-relaxed font-normal flex-1">
        {/* Authors */}
        <span
          className="text-gray-900 [&_strong]:font-bold [&_strong]:text-blue-700"
          dangerouslySetInnerHTML={{ __html: authorsHtml }}
        />

        {/* Year */}
        {doc.is_conference ? (
          <span>
            {" "}
            ({doc.publish_year}
            {(() => {
              const displayDate = formatConferenceDate(
                doc.conference_date_start,
                doc.conference_date_end,
                doc.cover_display_date
              );
              return displayDate ? `, ${displayDate}` : "";
            })()}
            ).
          </span>
        ) : (
          <span> ({doc.publish_year}).</span>
        )}

        {/* Title */}
        <span className="ml-1 text-gray-900">{doc.title}.</span>

        {/* Conference vs Journal Details */}
        {doc.is_conference ? (
          <>
            {doc.conference_name && (
              <span className="ml-1 text-gray-900">
                In <span className="italic">{doc.conference_name}</span>
                {doc.pages && <span> (pp. {doc.pages})</span>}
                {(doc.conference_venue || doc.city || doc.country) && (
                  <span>
                    , {[doc.conference_venue, doc.city, doc.country]
                      .filter(Boolean)
                      .map(s => s.trim())
                      .filter(s => s !== "")
                      .join(", ")}
                  </span>
                )}
                .
              </span>
            )}
          </>
        ) : (
          <>
            <span className="ml-1 italic text-gray-900">{doc.journal_name}</span>
            {doc.volume && (
              <span className="italic text-gray-900">, {doc.volume}</span>
            )}
            {doc.issue && (
              <span className="text-gray-900">({doc.issue})</span>
            )}
            {doc.pages && (
              <span className="text-gray-900">, {doc.pages}.</span>
            )}
          </>
        )}

        {/* DOI */}
        {doc.doi && (
          <a
            href={doc.doi.startsWith("http") ? doc.doi : `https://doi.org/${doc.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 block hover:underline mt-1 w-fit font-mono"
          >
            {doc.doi.startsWith("http") ? doc.doi : `https://doi.org/${doc.doi}`}
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ส่วนหัวแท็บ + Dropdown แบบ Dynamic */}
      {!hideHeader && (
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl"></div>
            <h2 className="text-base font-bold text-gray-800">
              งานวิจัย และบทความทางวิชาการ <span className="text-gray-400 font-normal text-xs ml-1">| APA Citations</span>
            </h2>
          </div>
          
          {/* ─── 3. ส่วน Dropdown ที่จะงอกตามปีที่เก่าที่สุดของแต่ละคน ─── */}
          <div className="flex items-center gap-2">
            <label htmlFor="year-filter" className="text-xs font-medium text-gray-500">เลือกปีที่แสดงผลงานวิจัย:</label>
            <select
              id="year-filter"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 shadow-sm font-medium"
            >
              <option value="all">ผลงานทั้งหมด</option>
              {yearRanges.map((range) => (
                <option key={range.key} value={range.key}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* รายการผลงานแสดงผลแบบ APA */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 space-y-4">
        {isLoading ? (
          <div className="text-center text-sm text-gray-400 py-6">กำลังโหลดข้อมูลผลงาน...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-6">ไม่พบข้อมูลบทความวิจัยในช่วงเวลาที่เลือก</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDocs.map((doc, index) => (
              <div key={doc.id || index} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xs font-bold text-gray-400 mt-1 bg-white border border-gray-200 px-2 py-0.5 rounded-md min-w-[24px] text-center shadow-sm">
                    {index + 1}
                  </span>
                  {renderAPAStyle(doc)}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 uppercase tracking-wide border self-start ${
                    doc.source_type === 'scopus' ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}>
                    {doc.source_type}
                  </span>

                  {doc.tier_details && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border bg-blue-50 border-blue-200 text-blue-600 whitespace-nowrap">
                      {doc.tier_details.tier_name} · {typeof doc.tier_details.weight === 'number' ? doc.tier_details.weight.toFixed(1) : doc.tier_details.weight}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}