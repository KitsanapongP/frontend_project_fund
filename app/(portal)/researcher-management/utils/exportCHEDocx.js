import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, UnderlineType, TableLayoutType, ExternalHyperlink
} from "docx"; // เพิ่ม ExternalHyperlink เข้ามาใช้งาน
import { saveAs } from "file-saver";

const prefixMap = {
  "นาย": "Mr.",
  "นาง": "Mrs.",
  "นางสาว": "Miss",
  "ผศ.": "Asst. Prof.",
  "รศ.": "Assoc. Prof.",
  "ศ.": "Prof.",
  "ผศ. ดร.": "Asst. Prof. Dr.",
  "รศ. ดร.": "Assoc. Prof. Dr.",
  "ศ. ดร.": "Prof. Dr.",
  "ดร.": "Dr.",
  "อ.": "Lecturer",
};

const ipTypeMap = {
  "patent": "สิทธิบัตร (Patent)",
  "petty_patent": "อนุสิทธิบัตร (Petty Patent)",
  "copyright": "ลิขสิทธิ์ (Copyright)"
};

// ตัวช่วยตรวจสอบว่าข้อความเป็นภาษาไทยหรือไม่ 
const isThaiText = (text = "") => /[\u0e00-\u0e7f]/.test(text);

//ตัดข้อความเป็น segment ไทย/อังกฤษ 
function splitByLanguage(text) {
  if (!text) return [];
  const segments = [];
  const regex = /([\u0e00-\u0e7f\s]+|[^\u0e00-\u0e7f]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const seg = match[1];
    if (!seg) continue;
    segments.push({ text: seg, isThai: isThaiText(seg) });
  }
  return segments;
}

// ─── ฟังก์ชันช่วยต่อ URL อัตโนมัติให้กับ Author IDs ของ CHE ─────────────────
function formatAuthorUrl(key, value) {
  if (!value || value.trim() === "" || value.trim() === "-") return null;
  
  const cleanId = value.trim();
  
  if (cleanId.toLowerCase().startsWith("http://") || cleanId.toLowerCase().startsWith("https://")) {
    return cleanId;
  }

  switch (key) {
    case "scopus_id": {
      const scopusClean = cleanId.replace(/^SCOPUS_ID:/i, "").trim();
      return `https://www.scopus.com/authid/detail.uri?authorId=${scopusClean}`;
    }
    case "scholar_author_id":
      return `https://scholar.google.com/citations?user=${cleanId}&hl=th`;
    case "thaijo_author_id":
      return `https://www.tci-thaijo.org/en/authors/${cleanId}`;
    default:
      return null;
  }
}

// weightMaster จะถูกส่งเข้ามาจากภายนอก
export const exportToDocx = async (profile, weightMaster = {}) => {
  if (!profile) return;

  const {
    header, educations, expertises, textbooks,
    researches, intellectualProperties, researchProjects
  } = profile;

  const fontName = "TH Sarabun PSK";
  const baseFontSize = 32;

  const currentYear = new Date().getFullYear();
  const startFiveYearsAgo = currentYear - 4;

  const ownerFname = (header?.user_fname || "").trim();
  const ownerLname = (header?.user_lname || "").trim();
  const fullOwnerName = `${ownerFname} ${ownerLname}`.trim();

  const makeRun = (text, extra = {}) => {
    const lang = isThaiText(text)
      ? { value: "th-TH", eastAsia: "th-TH" }
      : { value: "en-US" };
    return new TextRun({ text, font: fontName, size: baseFontSize, language: lang, ...extra });
  };

  // Paragraph จาก text ธรรมดา
  const createParagraph = (text, isBold = false, size = baseFontSize) => {
    const segs = splitByLanguage(text);
    const runs = segs.length > 0
      ? segs.map(({ text: t, isThai }) =>
          new TextRun({
            text: t,
            font: fontName,
            size,
            bold: isBold,
            language: isThai ? { value: "th-TH", eastAsia: "th-TH" } : { value: "en-US" },
          })
        )
      : [new TextRun({ text: text || "", font: fontName, size, bold: isBold, language: { value: "th-TH", eastAsia: "th-TH" } })];

    return new Paragraph({ children: runs, spacing: { after: 120 } });
  };

  const createHyperlinkParagraph = (label, url) => {
    if (!url || url === "-") {
      return new Paragraph({
        children: [makeRun(`${label}: -`)],
        spacing: { after: 120 }
      });
    }

    return new Paragraph({
      children: [
        makeRun(`${label}: `),
        new ExternalHyperlink({
          link: url,
          children: [
            new TextRun({
              text: url,
              font: fontName,
              size: baseFontSize,
              color: "000000",
              bold: true,
              underline: { type: UnderlineType.SINGLE }, // ขีดเส้นใต้ลิงก์
            }),
          ],
        }),
      ],
      spacing: { after: 120 },
    });
  };

  const makeStyledRuns = (text, extra = {}) => {
    const segs = splitByLanguage(text);
    if (segs.length === 0) return [makeRun(text, extra)];
    return segs.map(({ text: t, isThai }) =>
      new TextRun({
        text: t,
        font: fontName,
        size: baseFontSize,
        language: isThai ? { value: "th-TH", eastAsia: "th-TH" } : { value: "en-US" },
        ...extra,
      })
    );
  };

  // ─── Citation paragraph พร้อม highlight ชื่อเจ้าของ ─────────────────────
  const createCitationParagraphWithHighlight = (indexStr, fullCitationText, suffixDetails = "") => {
    const runs = [makeRun(indexStr)];
    const highlight = { bold: true, underline: { type: UnderlineType.SINGLE } };

    let remaining = fullCitationText;
    const tryMatch = (name) => {
      if (!name) return false;
      const idx = remaining.indexOf(name);
      if (idx === -1) return false;
      if (idx > 0) runs.push(...makeStyledRuns(remaining.slice(0, idx)));
      runs.push(...makeStyledRuns(name, highlight));
      remaining = remaining.slice(idx + name.length);
      return true;
    };

    if (!tryMatch(fullOwnerName) && !tryMatch(ownerFname)) {
      runs.push(...makeStyledRuns(remaining));
      remaining = "";
    }
    if (remaining) runs.push(...makeStyledRuns(remaining));
    if (suffixDetails) runs.push(...makeStyledRuns(suffixDetails));

    return new Paragraph({ children: runs, spacing: { after: 120 } });
  };

  //ตารางการศึกษา 
  const degreeLabel = { 1: "ปริญญาตรี", 2: "ปริญญาโท", 3: "ปริญญาเอก" };

  const educationRows = [
    new TableRow({
      children: [
        new TableCell({ children: [createParagraph("ระดับ", true)], width: { size: 15, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [createParagraph("ชื่อปริญญา (สาขาวิชา)", true)], width: { size: 45, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [createParagraph("ชื่อสถาบัน, ประเทศ", true)], width: { size: 25, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [createParagraph("ปี ค.ศ. ที่จบ", true)], width: { size: 15, type: WidthType.PERCENTAGE } }),
      ],
    }),
  ];

  (educations || []).forEach((edu) => {
    let displayGradYear = "-";
    if (edu.grad_year) {
      const yr = Number(edu.grad_year);
      displayGradYear = (yr > 2400 ? yr - 543 : yr).toString();
    }
    educationRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [createParagraph(degreeLabel[edu.degree_id] || "-")] }),
          new TableCell({ children: [createParagraph(`${edu.degree_title_th || ""}${edu.major ? ` (${edu.major})` : ""}`)] }),
          new TableCell({ children: [createParagraph(edu.university_th || edu.university_en || "-")] }),
          new TableCell({ children: [createParagraph(displayGradYear)] }),
        ],
      })
    );
  });

  const eduTable = new Table({
    rows: educationRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.AUTOFIT,
  });

  //ประกอบเอกสาร 
  const documentChildren = [
    createParagraph(`${header?.prefix || ""}${header?.user_fname || ""} ${header?.user_lname || ""}`, true, 40),
    createParagraph(`${prefixMap[header?.prefix?.trim()] || header?.prefix || ""} ${header?.Name_en || ""}`),
    new Paragraph({ text: "" }),
    createParagraph(`ตำแหน่งทางวิชาการ: ${header?.position_name || header?.position || "-"}`, true),
    createParagraph("ประวัติการศึกษา:", true),
    eduTable,
    new Paragraph({ text: "" }),
    
    //เปลี่ยนมาใช้ฟังก์ชัน createHyperlinkParagraph เพื่อแทรกลิงก์
    createHyperlinkParagraph("Link Scopus", formatAuthorUrl("scopus_id", header?.scopus_id)),
    createHyperlinkParagraph("Link Google Scholar", formatAuthorUrl("scholar_author_id", header?.scholar_author_id)),
    createHyperlinkParagraph("Link TCI", formatAuthorUrl("thaijo_author_id", header?.thaijo_author_id)),
    
    new Paragraph({ text: "" }),
    createParagraph(`ผลงานทางวิชาการ (ผลงาน 5 ปี ย้อนหลัง ค.ศ. ${startFiveYearsAgo}-${currentYear})`, true, 36),
    new Paragraph({ text: "" }),

    //ตำรา 
    createParagraph("ตำรา หนังสือ และเอกสารประกอบการสอน", true),
  ];

  const validTextbooks = (textbooks || []).filter((book) => {
    const yr = Number(book.year);
    const cleanYr = yr > 2400 ? yr - 543 : yr;
    return cleanYr >= startFiveYearsAgo && cleanYr <= currentYear;
  });

  if (validTextbooks.length > 0) {
    validTextbooks.forEach((book, idx) => {
      const yr = Number(book.year);
      const displayYear = (yr > 2400 ? yr - 543 : yr).toString();
      let details = `. (${displayYear}). ${book.title || ""}.`;
      if (book.edition) details += ` ${book.edition}.`;
      if (book.publisher) details += ` ${book.publisher}.`;
      documentChildren.push(
        createCitationParagraphWithHighlight(`${idx + 1}. `, fullOwnerName, details)
      );
    });
  } else {
    documentChildren.push(createParagraph("- ไม่มีข้อมูลตำราหรือหนังสือในช่วง 5 ปี ย้อนหลัง -"));
  }

  documentChildren.push(new Paragraph({ text: "" }));

  //งานวิจัย 
  documentChildren.push(createParagraph("งานวิจัย และบทความทางวิชาการ", true));

  const validResearches = (researches || []).filter((res) => {
    const yr = Number(res.publish_year);
    const cleanYr = yr > 2400 ? yr - 543 : yr;
    return cleanYr >= startFiveYearsAgo && cleanYr <= currentYear;
  });

  if (validResearches.length > 0) {
    const parseAuthors = (authorsHtml) => {
      if (!authorsHtml) return "";
      const thRegex = /[\u0e00-\u0e7f]/;
      let cleaned = authorsHtml;
      if (thRegex.test(authorsHtml)) {
        cleaned = authorsHtml.replace(
          /(รศ\.ดร\.|ผศ\.ดร\.|ดร\.|อ\.|ศาสตราจารย์|รองศาสตราจารย์|ผู้ช่วยศาสตราจารย์|นาย|นางสาว|นาง|คุณ)\s?/g,
          ""
        );
        const parts = cleaned.split(",").map((s) => {
          let t = s.trim();
          if (!t) return "";
          let hasAmp = false;
          if (t.startsWith("&")) { hasAmp = true; t = t.replace("&", "").trim(); }
          const hasStrong = t.includes("<strong>");
          const pure = t.replace(/<\/?strong>/g, "").trim();
          const nameParts = pure.split(/\s+/);
          let result = nameParts.length >= 2
            ? `${nameParts[nameParts.length - 1]}, ${nameParts.slice(0, -1).join(" ")}`
            : pure;
          if (hasStrong) result = `<strong>${result}</strong>`;
          if (hasAmp) result = `& ${result}`;
          return result;
        });
        cleaned = parts.filter(Boolean).join(", ");
      } else {
        cleaned = cleaned.replace(/<\/?strong>/g, "").trim();
      }
      if (cleaned && !cleaned.endsWith(".")) cleaned += ".";
      return cleaned;
    };

    const findOwnerInAuthors = (cleanAuthors) => {
      const nameEnParts = (header?.Name_en || "").trim().split(/\s+/);
      const firstLetter = nameEnParts[0]?.charAt(0) || "";
      const lastNameEn = nameEnParts[nameEnParts.length - 1] || "";

      const format1 = fullOwnerName;
      const format2 = ownerLname && ownerFname ? `${ownerLname}, ${ownerFname}` : "";
      const format3 = lastNameEn && firstLetter ? `${lastNameEn}, ${firstLetter}.` : "___NO___";

      if (format1 && cleanAuthors.includes(format1)) return format1;
      if (format2 && cleanAuthors.includes(format2)) return format2;
      const lc = cleanAuthors.toLowerCase();
      if (lc.includes(format3.toLowerCase())) {
        const si = lc.indexOf(format3.toLowerCase());
        return cleanAuthors.substring(si, si + format3.length);
      }
      if (ownerFname && cleanAuthors.includes(ownerFname)) return ownerFname;
      return "";
    };

    const buildCitationRuns = (idx, cleanAuthors, res) => {
      const runs = [makeRun(`${idx + 1}. `)];
      const matchedName = findOwnerInAuthors(cleanAuthors);
      const highlight = { bold: true, underline: { type: UnderlineType.SINGLE } };

      if (matchedName) {
        const before = cleanAuthors.slice(0, cleanAuthors.indexOf(matchedName));
        const after = cleanAuthors.slice(cleanAuthors.indexOf(matchedName) + matchedName.length);
        if (before) runs.push(...makeStyledRuns(before));
        runs.push(...makeStyledRuns(matchedName, highlight));
        if (after) runs.push(...makeStyledRuns(after));
      } else {
        runs.push(...makeStyledRuns(cleanAuthors));
      }

      if (res.is_conference) {
        if (res.cover_display_date) {
          let displayDate = res.cover_display_date.trim();
          const yearStr = String(res.publish_year);
          if (displayDate.includes(yearStr)) {
            displayDate = displayDate.replace(yearStr, "").replace(/,\s*$/, "").trim();
          }
          if (displayDate) {
            runs.push(makeRun(` (${res.publish_year}, ${displayDate}).`));
          } else {
            runs.push(makeRun(` (${res.publish_year}).`));
          }
        } else {
          runs.push(makeRun(` (${res.publish_year}).`));
        }
      } else {
        runs.push(makeRun(` (${res.publish_year}).`));
      }

      const rawTitle = res.title || "";
      const sentenceCaseTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
      runs.push(...makeStyledRuns(` ${sentenceCaseTitle}.`));

      if (res.is_conference) {
        if (res.conference_name) {
          runs.push(makeRun(" In "));
          runs.push(...makeStyledRuns(res.conference_name, { italics: true }));
          if (res.pages) {
            runs.push(makeRun(` (pp. ${res.pages})`));
          }
          const loc = [res.city, res.country].filter(Boolean).join(", ");
          if (loc) {
            runs.push(makeRun(`, ${loc}`));
          }
          runs.push(makeRun("."));
        }
      } else {
        if (res.journal_name) {
          runs.push(makeRun(" "));
          runs.push(...makeStyledRuns(res.journal_name, { italics: true }));
        }
        if (res.volume) runs.push(...makeStyledRuns(`, ${res.volume}`, { italics: true }));
        if (res.issue) runs.push(makeRun(`(${res.issue})`));
        if (res.pages) {
          runs.push(makeRun(`, ${res.pages}.`));
        } else {
          runs.push(makeRun("."));
        }
      }

      if (res.doi) {
        let cleanDoi = res.doi.trim();
        if (cleanDoi.toLowerCase().startsWith("doi:")) {
          cleanDoi = cleanDoi.replace(/^[Dd][Oo][Ii]:\s*/, "");
        }
        if (!cleanDoi.startsWith("http")) {
          cleanDoi = `https://doi.org/${cleanDoi}`;
        }
        runs.push(makeRun(` ${cleanDoi}`));
      }

      return runs;
    };

    const researchRows = validResearches.map((res, idx) => {
      const cleanAuthors = parseAuthors(res.authors);
      const citationRuns = buildCitationRuns(idx, cleanAuthors, res);

      let descriptionText = "";
      if (res.tier_details) {
        descriptionText = res.tier_details.thai_description?.trim() || res.tier_details.tier_name || "บทความวิชาการ";
      } else {
        descriptionText = "บทความวิชาการ";
      }

      const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: citationRuns, spacing: { after: 120 }, alignment: "left" })],
            width: { size: 65, type: WidthType.PERCENTAGE },
            margins: cellMargins,
          }),
          new TableCell({
            children: [new Paragraph({
              children: makeStyledRuns(descriptionText),
              spacing: { after: 120 },
              alignment: "left",
            })],
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: cellMargins,
          }),
        ],
      });
    });

    documentChildren.push(
      new Table({
        rows: researchRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.AUTOFIT,
      })
    );
  } else {
    documentChildren.push(createParagraph("- ไม่มีข้อมูลบทความวิจัยในช่วง 5 ปี ย้อนหลัง -"));
  }

  documentChildren.push(new Paragraph({ text: "" }));

  //ทรัพย์สินทางปัญญา
  documentChildren.push(createParagraph("ผลงานวิชาการด้านอื่น ๆ (สิทธิบัตร, อนุสิทธิบัตร, ลิขสิทธิ์)", true));

  const validIPs = (intellectualProperties || []).filter((ip) => {
    if (!ip.granted_year) return false;
    const yr = Number(ip.granted_year);
    const cleanYr = yr > 2400 ? yr - 543 : yr;
    return cleanYr >= startFiveYearsAgo && cleanYr <= currentYear;
  });

  if (validIPs.length > 0) {
    const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

    const ipHeaderRow = new TableRow({
      children: [
        new TableCell({ children: [createParagraph("ประเภท", true)], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ชื่อผลงานวิชาการ / ทรัพย์สินทางปัญญา", true)], width: { size: 35, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("เลขทะเบียน / เลขที่สิทธิบัตร", true)], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ค่าน้ำหนัก", true)], width: { size: 10, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ปีที่ได้รับอนุมัติ", true)], width: { size: 15, type: WidthType.PERCENTAGE }, margins: cellMargins }),
      ],
    });

    const ipDataRows = validIPs.map((ip, idx) => {
      const yr = Number(ip.granted_year);
      const displayYear = (yr > 2400 ? yr - 543 : yr).toString();
      const ipTypeName = ipTypeMap[ip.type] || "ทรัพย์สินทางปัญญา";

      const weight = ip.tier_details?.weight != null
        ? Number(ip.tier_details.weight).toFixed(1)
        : weightMaster[ip.type]?.weight != null
          ? Number(weightMaster[ip.type].weight).toFixed(1)
          : "-";

      const displayTitle = `"${ip.title || ""}"`;
      const ipTitleRuns = makeStyledRuns(displayTitle);

      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: makeStyledRuns(ipTypeName), spacing: { after: 120 } })], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
          new TableCell({ children: [new Paragraph({ children: ipTitleRuns, spacing: { after: 120 } })], width: { size: 35, type: WidthType.PERCENTAGE }, margins: cellMargins }),
          new TableCell({ children: [createParagraph(ip.registration_number || "-")], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
          new TableCell({ children: [createParagraph(weight)], width: { size: 10, type: WidthType.PERCENTAGE }, margins: cellMargins }),
          new TableCell({ children: [createParagraph(displayYear)], width: { size: 15, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        ],
      });
    });

    documentChildren.push(
      new Table({
        rows: [ipHeaderRow, ...ipDataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.AUTOFIT,
      })
    );
  } else {
    documentChildren.push(createParagraph("- ไม่มีข้อมูลผลงานทรัพย์สินทางปัญญาในช่วง 5 ปี ย้อนหลัง -"));
  }

  documentChildren.push(new Paragraph({ text: "" }));

  //โครงการวิจัย 
  documentChildren.push(createParagraph("โครงการวิจัย", true));

  const formatToCEDate = (dateStr) => {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    const yr = Number(parts[0]);
    return `${yr > 2400 ? yr - 543 : yr}-${parts[1] || "01"}-${parts[2] || "01"}`;
  };

  const validProjects = (researchProjects || []).filter((proj) => {
    // ดึงค่าปีงบประมาณออกมา หากไม่มีจะลองแปลงจาก start_date เป็นตัวสำรอง
    let projYear = proj.fiscal_year 
      ? Number(proj.fiscal_year) 
      : (proj.start_date ? Number(proj.start_date.split("-")[0]) : null);

    if (!projYear) return false;

    // แปลงปี พ.ศ. ให้เป็น ค.ศ. (ถ้าค่าที่เข้ามามากกว่า 2400)
    const cleanYr = projYear > 2400 ? projYear - 543 : projYear;

    // ตรวจสอบว่าอยู่ในช่วง 5 ปีหรือไม่
    return cleanYr >= startFiveYearsAgo && cleanYr <= currentYear;
  });

  if (validProjects.length > 0) {
    const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

    const projHeaderRow = new TableRow({
      children: [
        new TableCell({ children: [createParagraph("ปีงบประมาณ", true)], width: { size: 12, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ชื่อโครงการ (TH / EN)", true)], width: { size: 35, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("แหล่งทุน", true)], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ระยะเวลาโครงการ", true)], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("งบประมาณ (บาท)", true)], width: { size: 13, type: WidthType.PERCENTAGE }, margins: cellMargins }),
      ],
    });

    const projDataRows = validProjects.map((proj, idx) => {
      const fiscalYear = proj.fiscal_year
        ? String(proj.fiscal_year)
        : (() => {
            const yr = Number((proj.start_date || "").split("-")[0]);
            return yr ? String(yr > 2400 ? yr - 543 : yr) : "-";
          })();

      const projectNameTH = proj.project_name_th || "-";
      const projectNameEN = proj.project_name_en ? `(${proj.project_name_en})` : "";
      const duration = `${formatToCEDate(proj.start_date)} ถึง ${formatToCEDate(proj.end_date)}`;
      const budget = proj.budget ? Number(proj.budget).toLocaleString() : "-";

      return new TableRow({
        children: [
          new TableCell({ children: [createParagraph(fiscalYear)], width: { size: 12, type: WidthType.PERCENTAGE }, margins: cellMargins }),
          new TableCell({
            children: [
              new Paragraph({ children: makeStyledRuns(projectNameTH), spacing: { after: 60 } }),
              ...(projectNameEN ? [new Paragraph({ children: makeStyledRuns(projectNameEN), spacing: { after: 120 } })] : []),
            ],
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: cellMargins,
          }),
          new TableCell({ children: [createParagraph(proj.source_of_fund || "-")], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
          new TableCell({ children: [createParagraph(duration)], width: { size: 20, type: WidthType.PERCENTAGE }, margins: cellMargins }),
          new TableCell({ children: [createParagraph(budget)], width: { size: 13, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        ],
      });
    });

    documentChildren.push(
      new Table({
        rows: [projHeaderRow, ...projDataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.AUTOFIT,
      })
    );
  } else {
    documentChildren.push(createParagraph("- ไม่มีข้อมูลโครงการวิจัยในช่วง 5 ปี ย้อนหลัง -"));
  }

  documentChildren.push(new Paragraph({ text: "" }));

  //ความเชี่ยวชาญ
  documentChildren.push(createParagraph("ความเชี่ยวชาญ / Research Interests", true));

  if (expertises && expertises.length > 0) {
    expertises.forEach((item, idx) => {
      const expText = typeof item === "object" ? item.expertise : item;
      if (expText?.trim()) {
        documentChildren.push(
          new Paragraph({
            children: makeStyledRuns(`${idx + 1}. ${expText.trim()}`),
            spacing: { after: 80 },
          })
        );
      }
    });
  } else {
    documentChildren.push(createParagraph("- ไม่มีข้อมูลความเชี่ยวชาญ -"));
  }

  //Export
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontName,
            size: baseFontSize,
            language: { value: "th-TH", eastAsia: "th-TH" },
          },
        },
      },
    },
    sections: [{ properties: {}, children: documentChildren }],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `CHECV-${header?.user_fname || "export"}.docx`);
  });
};