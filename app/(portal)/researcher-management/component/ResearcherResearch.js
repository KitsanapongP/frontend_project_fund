"use client";
import { useState, useEffect } from "react";
import api from "../../../lib/api";

export default function ResearchDocsTab({ targetUserId, hideHeader = false }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
        // ใช้ชื่อเต็มแทนอักษรย่อ เพราะภาษาไทยไม่มีมาตรฐาน initial
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

  // format วันที่ conference ให้เป็น range เช่น "March 15–17"
  const formatConferenceDate = (startDate, endDate, coverDisplayDate) => {
    if (!coverDisplayDate || typeof coverDisplayDate !== 'string') return "";

    let displayDate = coverDisplayDate.trim();

    // ตัวช่วยกรณีที่ในฐานข้อมูลเก็บปีพ่วงมาด้วย (เช่น "Feb 26-March 1, 2025" หรือ "October 2025")
    // เราจะใช้ปีจาก doc.publish_year มาตรวจเช็คและตัดออก เพื่อไม่ให้แสดงผลปีซ้ำซ้อนในวงเล็บอ้างอิง
    const yearStr = String(doc.publish_year);
    if (displayDate.includes(yearStr)) {
      // ตัดตัวเลขปี และเครื่องหมายจุลภาคคั่น (ถ้ามี) ออกไป
      displayDate = displayDate
        .replace(yearStr, "")
        .replace(/,\s*$/, "") // ลบเครื่องหมาย , ที่ตกค้างอยู่ท้ายประโยค
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

      {/* Year (+ date range สำหรับ conference) */}
      {doc.is_conference ? (
        <span>
  {" "}
  ({doc.publish_year}
  {(() => {
    // ส่งค่าไปเคลียร์ปีซ้ำผ่านฟังก์ชันที่มีอยู่แล้ว
    const displayDate = formatConferenceDate(
      doc.conference_date_start,
      doc.conference_date_end,
      doc.cover_display_date
    );
    // ถ้ามีข้อมูลเดือน/วันที่หลงเหลืออยู่ (ไม่ว่าเป็น Journal หรือ Conference) ให้แปะต่อท้ายปีทันที
    return displayDate ? `, ${displayDate}` : "";
  })()}
  ).
</span>
      ) : (
        <span> ({doc.publish_year}).</span>
      )}

      {/* Title (ชื่อบทความวิชาการ - ตัวธรรมดาเสมอ) */}
      <span className="ml-1 text-gray-900">{doc.title}.</span>

      {doc.is_conference ? (
        // === สำหรับ Conference: In Conference Name (pp. xxx-xxx). Location. ===
        <>
          {doc.conference_name && (
            <span className="ml-1 text-gray-900">
              In <span className="italic">{doc.conference_name}</span>
              
              {/* แสดงผลเลขหน้า (pp.) ต่อท้ายชื่อ Conference ทันทีตามหลัก APA 7th */}
              {doc.pages && <span> (pp. {doc.pages})</span>}

              {/* มัดรวม Venue, City, Country เป็น Location ต่อท้าย */}
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
        // === สำหรับ Journal: Journal Name, Volume(Issue), pages. ===
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

      {/* DOI (ปรับการแสดงผลข้อความลิงก์ให้เป็น URL เต็มตามมาตรฐาน APA 7th) */}
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
      {/* ส่วนหัวแท็บ - ไม่มีปุ่ม เพิ่มข้อมูล แล้ว */}
      {!hideHeader && (
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl"></div>
            <h2 className="text-base font-bold text-gray-800">
              งานวิจัย และบทความทางวิชาการ <span className="text-gray-400 font-normal text-xs ml-1">| APA Citations</span>
            </h2>
          </div>
        </div>
      )}

      {/* รายการผลงานแสดงผลแบบ APA */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 space-y-4">
        {isLoading ? (
          <div className="text-center text-sm text-gray-400 py-6">กำลังโหลดข้อมูลผลงาน...</div>
        ) : documents.length === 0 ? (
          <div className="text-center text-sm text-gray-400 py-6">ยังไม่มีข้อมูลบทความวิจัยในระบบ</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc, index) => (
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