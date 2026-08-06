import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, UnderlineType, TableLayoutType, ExternalHyperlink, AlignmentType, Header
} from "docx";
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

const isThaiText = (text = "") => /[\u0e00-\u0e7f]/.test(text);

function splitByLanguage(text) {
  if (!text) return [];
  const segments = [];
  const regex = /([\u0e00-\u0e7f]+|[^\u0e00-\u0e7f]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const seg = match[1];
    if (!seg) continue;
    segments.push({ text: seg, isThai: isThaiText(seg) });
  }
  return segments;
}

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

export const exportToDocx = async (profile, weightMaster = {}) => {
  if (!profile) return;

  const {
    header, educations, expertises, textbooks,
    researches, intellectualProperties, researchProjects
  } = profile;

  const fontName = "Sarabun";
  const baseFontSize = 28; // 14pt (28 half-points)
  const cellMargins = { top: 100, bottom: 100, left: 150, right: 150 };

  const currentYear = new Date().getFullYear();
  const currentYearTH = currentYear + 543;
  const startFiveYearsAgoBE = currentYearTH - 4;
  const startFiveYearsAgoCE = currentYear - 4;

  const ownerFname = (header?.user_fname || "").trim();
  const ownerLname = (header?.user_lname || "").trim();
  const fullOwnerName = `${ownerFname} ${ownerLname}`.trim();

  const makeRun = (text, extra = {}) => {
    const lang = isThaiText(text)
      ? { value: "th-TH", eastAsia: "th-TH" }
      : { value: "en-US" };
    return new TextRun({ text, font: fontName, size: baseFontSize, language: lang, ...extra });
  };

  const createParagraph = (text, isBold = false, size = baseFontSize, alignment = AlignmentType.LEFT) => {
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

    return new Paragraph({ children: runs, alignment, spacing: { after: 60 } });
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

  function parseHtmlToRuns(text, fontName, baseFontSize) {
    if (!text) return [];
    
    const regex = /(<strong>.*?<\/strong>)/gi;
    const parts = text.split(regex);

    const runs = [];
    parts.forEach((part) => {
      if (!part) return;

      const isBold = /^<strong>.*<\/strong>$/i.test(part);
      const cleanText = part.replace(/<\/?strong>/gi, "");

      const segs = splitByLanguage(cleanText);
      segs.forEach(({ text: t, isThai }) => {
        runs.push(
          new TextRun({
            text: t,
            font: fontName,
            size: baseFontSize,
            bold: isBold,
            language: isThai ? { value: "th-TH", eastAsia: "th-TH" } : { value: "en-US" },
          })
        );
      });
    });

    return runs;
  }

  // 1. Header
  const documentHeader = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "ประวัติผลงานอาจารย์ | CV", font: fontName, size: 24, bold: true, color: "595959" })
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "วิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น", font: fontName, size: 24, color: "595959" })
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "College of Computing, KKU.", font: fontName, size: 24, color: "595959" })
        ],
        spacing: { after: 200 }
      }),
    ],
  });

  const documentChildren = [];

  // 2. ชื่อนามสกุล
  documentChildren.push(
    createParagraph(`${header?.prefix || ""}${header?.user_fname || ""} ${header?.user_lname || ""}`, true, 28),
    createParagraph(`${prefixMap[header?.prefix?.trim()] || header?.prefix || ""} ${header?.Name_en || ""}`, true, 28),
    new Paragraph({ text: "", spacing: { after: 100 } })
  );

  // 3. ตารางประวัติและตำแหน่ง
  const degreeLabel = { 1: "ปริญญาตรี", 2: "ปริญญาโท", 3: "ปริญญาเอก" };
  const bioTableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("ตำแหน่งทางวิชาการ", true)],
          columnSpan: 2,
          width: { size: 40, type: WidthType.PERCENTAGE },
          margins: cellMargins
        }),
        new TableCell({
          children: [createParagraph(header?.position_name || header?.position || "-", false)],
          columnSpan: 2,
          width: { size: 60, type: WidthType.PERCENTAGE },
          margins: cellMargins
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("ประวัติการศึกษา", true)],
          columnSpan: 4,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [createParagraph("ระดับ", true)], width: { size: 15, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ชื่อปริญญา (สาขาวิชา)", true)], width: { size: 40, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ชื่อสถาบัน,ประเทศ", true)], width: { size: 30, type: WidthType.PERCENTAGE }, margins: cellMargins }),
        new TableCell({ children: [createParagraph("ปี พ.ศ. ที่จบ", true)], width: { size: 15, type: WidthType.PERCENTAGE }, margins: cellMargins }),
      ],
    })
  ];

  (educations || []).forEach((edu) => {
    let displayGradYear = "-";
    if (edu.grad_year) {
      const yr = Number(edu.grad_year);
      displayGradYear = (yr < 2400 ? yr + 543 : yr).toString();
    }
    bioTableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [createParagraph(degreeLabel[edu.degree_id] || "-")], margins: cellMargins }),
          new TableCell({ children: [createParagraph(`${edu.degree_title_th || ""}${edu.major ? ` (${edu.major})` : ""}`)], margins: cellMargins }),
          new TableCell({ children: [createParagraph(edu.university_th || edu.university_en || "-")], margins: cellMargins }),
          new TableCell({ children: [createParagraph(displayGradYear)], margins: cellMargins }),
        ],
      })
    );
  });

  const scopusUrl = formatAuthorUrl("scopus_id", header?.scopus_id);
  const scholarUrl = formatAuthorUrl("scholar_author_id", header?.scholar_author_id);

  const createTableCellHyperlink = (label, url) => {
    const runs = [new TextRun({ text: `${label}: `, font: fontName, size: baseFontSize, bold: true })];
    if (url && url !== "-") {
      runs.push(
        new ExternalHyperlink({
          link: url,
          children: [
            new TextRun({
              text: url,
              font: fontName,
              size: baseFontSize,
              color: "0000FF",
              underline: { type: UnderlineType.SINGLE },
            }),
          ],
        })
      );
    } else {
      runs.push(new TextRun({ text: "-", font: fontName, size: baseFontSize }));
    }
    return new Paragraph({ children: runs, spacing: { after: 60 } });
  };

  bioTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [createTableCellHyperlink("Link Scopus", scopusUrl)],
          columnSpan: 4,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [createTableCellHyperlink("Link Google Scholar", scholarUrl)],
          columnSpan: 4,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    })
  );

  documentChildren.push(
    new Table({
      rows: bioTableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
    }),
    new Paragraph({ text: "", spacing: { after: 120 } })
  );

  // 4. ตารางรวมผลงานทางวิชาการ ( Single Unified Table )
  const academicTableRows = [];

  // หัวข้อตารางผลงานทางวิชาการ
  academicTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph(`ผลงานทางวิชาการ (ผลงาน 5 ปี ย้อนหลัง ${startFiveYearsAgoBE}-${currentYearTH})`, true)],
          columnSpan: 2,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    })
  );

  //ตำรา หนังสือ และเอกสารประกอบการสอน
  academicTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("ตำรา หนังสือ และเอกสารประกอบการสอน", true)],
          columnSpan: 2,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    })
  );

  const validTextbooks = (textbooks || []).filter((book) => {
    const yr = Number(book.year);
    const cleanYrBE = yr < 2400 ? yr + 543 : yr;
    return cleanYrBE >= startFiveYearsAgoBE && cleanYrBE <= currentYearTH;
  });

  if (validTextbooks.length > 0) {
    validTextbooks.forEach((book, idx) => {
      const yr = Number(book.year);
      const displayYear = (yr < 2400 ? yr + 543 : yr).toString();
      let details = `${idx + 1}. ${fullOwnerName} (${displayYear}). ${book.title || ""}.`;
      if (book.edition) details += ` ${book.edition}.`;
      if (book.publisher) details += ` ${book.publisher}.`;

      academicTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [createParagraph(details)],
              columnSpan: 2,
              width: { size: 100, type: WidthType.PERCENTAGE },
              margins: cellMargins
            })
          ]
        })
      );
    });
  } else {
    academicTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("-")],
            columnSpan: 2,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: cellMargins
          })
        ]
      })
    );
  }

  //งานวิจัย และบทความทางวิชาการ
  academicTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("งานวิจัย และบทความทางวิชาการ", true)],
          columnSpan: 2,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    })
  );

  const validResearches = (researches || []).filter((res) => {
    const yr = Number(res.publish_year);
    const cleanYrCE = yr > 2400 ? yr - 543 : yr;
    return cleanYrCE >= startFiveYearsAgoCE && cleanYrCE <= currentYear;
  });

  if (validResearches.length > 0) {
    validResearches.forEach((res, idx) => {
      const citationRuns = [makeRun(`${idx + 1}. `)];
      let authorsText = res.authors || "";
      
      citationRuns.push(...parseHtmlToRuns(authorsText, fontName, baseFontSize));
      citationRuns.push(makeRun(` (${res.publish_year}). ${res.title || ""}. `));

      if (res.journal_name) {
        citationRuns.push(...makeStyledRuns(res.journal_name, { italics: true }));
      }
      if (res.volume) citationRuns.push(...makeStyledRuns(`, ${res.volume}`, { italics: true }));
      if (res.pages) citationRuns.push(makeRun(`, pp. ${res.pages}.`));
      if (res.doi) citationRuns.push(makeRun(` DOI: ${res.doi}`));

      let descriptionText = res.tier_details?.thai_description?.trim() || "บทความวิจัยหรือบทความวิชาการ";

      academicTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: citationRuns, spacing: { after: 60 } })],
              width: { size: 65, type: WidthType.PERCENTAGE },
              margins: cellMargins
            }),
            new TableCell({
              children: [new Paragraph({ children: makeStyledRuns(descriptionText), spacing: { after: 60 } })],
              width: { size: 35, type: WidthType.PERCENTAGE },
              margins: cellMargins
            }),
          ],
        })
      );
    });
  } else {
    academicTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("- ไม่มีข้อมูลบทความวิจัยในช่วง 5 ปี ย้อนหลัง -")],
            columnSpan: 2,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: cellMargins
          })
        ]
      })
    );
  }

  //ทรัพย์สินทางปัญญา
  academicTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("ผลงานวิชาการด้านอื่น ๆ (สิทธิบัตร, อนุสิทธิบัตร, ลิขสิทธิ์)", true)],
          columnSpan: 2,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    })
  );

  const validIPs = (intellectualProperties || []).filter((ip) => {
    if (!ip.granted_year) return false;
    const yr = Number(ip.granted_year);
    const cleanYr = yr > 2400 ? yr - 543 : yr;
    return cleanYr >= startFiveYearsAgoCE && cleanYr <= currentYear;
  });

  if (validIPs.length > 0) {
    validIPs.forEach((ip, idx) => {
      const yr = Number(ip.granted_year);
      const displayYear = (yr < 2400 ? yr + 543 : yr).toString();
      const ipTypeName = ipTypeMap[ip.type] || "ทรัพย์สินทางปัญญา";
      const itemPrefix = validIPs.length > 1 ? `${idx + 1}. ` : "";

      academicTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [createParagraph(`${itemPrefix}${ipTypeName}: ${ip.title || "-"}`)],
              width: { size: 85, type: WidthType.PERCENTAGE },
              margins: cellMargins
            }),
            new TableCell({
              children: [createParagraph(displayYear)],
              width: { size: 15, type: WidthType.PERCENTAGE },
              margins: cellMargins
            }),
          ]
        })
      );
    });
  } else {
    academicTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("-")],
            columnSpan: 2,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: cellMargins
          })
        ]
      })
    );
  }

  //โครงการวิจัย
  academicTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("โครงการวิจัย/Research Project", true)],
          columnSpan: 2,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    })
  );

  const validProjects = (researchProjects || []).filter((proj) => {
    let yr = proj.fiscal_year ? Number(proj.fiscal_year) : null;
    
    if (!yr && proj.start_date) {
      const matches = String(proj.start_date).match(/\d{4}/);
      if (matches) yr = Number(matches[0]);
    }

    if (!yr || isNaN(yr)) return false;

    const cleanYrBE = yr < 2400 ? yr + 543 : yr;
    return cleanYrBE >= startFiveYearsAgoBE && cleanYrBE <= currentYearTH;
  });

  if (validProjects.length > 0) {
    validProjects.forEach((proj, idx) => {
      const projectName = proj.project_name_th || proj.project_name_en || "-";
      const itemPrefix = validProjects.length > 1 ? `${idx + 1}. ` : "";

      academicTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [createParagraph(`${itemPrefix}${projectName}`)],
              columnSpan: 2,
              width: { size: 100, type: WidthType.PERCENTAGE },
              margins: cellMargins
            })
          ]
        })
      );
    });
  } else {
    academicTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("-")],
            columnSpan: 2,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: cellMargins
          })
        ]
      })
    );
  }

  //ความเชี่ยวชาญ 
  academicTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("ความเชี่ยวชาญ/Research Interests", true)],
          columnSpan: 2,
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: cellMargins
        })
      ]
    })
  );

  const validExpertises = (expertises || []).filter((item) => {
    const expText = typeof item === "object" ? item.expertise : item;
    return expText && expText.trim() !== "";
  });

  if (validExpertises.length > 0) {
    validExpertises.forEach((item, idx) => {
      const expText = typeof item === "object" ? item.expertise : item;
      const itemPrefix = validExpertises.length > 1 ? `${idx + 1}. ` : "";

      academicTableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [createParagraph(`${itemPrefix}${expText.trim()}`)],
              columnSpan: 2,
              width: { size: 100, type: WidthType.PERCENTAGE },
              margins: cellMargins
            })
          ]
        })
      );
    });
  } else {
    academicTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("-")],
            columnSpan: 2,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: cellMargins
          })
        ]
      })
    );
  }

  // เพิ่มตารางผลงานทางวิชาการลง documentChildren
  documentChildren.push(
    new Table({
      rows: academicTableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.AUTOFIT,
    })
  );

  // 5. สร้างและบันทึกไฟล์ DOCX
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
    sections: [
      {
        properties: {},
        headers: {
          default: documentHeader,
        },
        children: documentChildren,
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `CHECV-${header?.user_fname || "export"}.docx`);
  });
};