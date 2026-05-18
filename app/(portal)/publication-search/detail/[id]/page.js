import { ExternalLink, Calendar, BookOpen, User, Tag, Globe, Award, Users, Hash, Download, Quote } from "lucide-react";
import BackButton from "./BackButton";
import pool from "../../../../lib/db-connection";
import { notFound } from "next/navigation";

const TRACK_NAMES = {
  'ag': 'คณะเกษตรศาสตร์',
  'cola': 'วิทยาลัยการปกครองท้องถิ่น',
  'cp': 'วิทยาลัยการคอมพิวเตอร์',
  'kkbs': 'คณะบริหารธุรกิจและการบัญชี',
  'md': 'คณะแพทยศาสตร์',
};

const parseKeywords = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  let text = String(raw).trim();

  // 1. กรณีมี Object ภาษา (en_US, th_TH) หรือ JSON
  if (text.includes("en_US") || text.includes("th_TH") || text.startsWith("{")) {
    
    text = text.replace(/['"]?(en_US|th_TH|en|th)['"]?\s*:\s*/gi, '');
    text = text.replace(/[{}[\]"']/g, '');

    let parts = text.split(',');
    if (parts.length === 1) {
      parts = text.split(/\s+/); 
    }

    return parts.map(s => s.trim()).filter(w => w.length > 1);
  }

  // 2. กรณี Array JSON ธรรมดา [...]
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text.replace(/'/g, '"'));
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  // 3. กรณี String ทั่วไป
  return text.split(",").map(s => s.replace(/["{}\[\]]/g, '').trim()).filter(Boolean);
};

const getSourceLabel = (source) => {
  if (source === 'scopus') return 'Scopus';
  if (source === 'thaijo') return 'TCI-ThaiJO';
  if (source === 'ai_showcase') return 'AI Showcase';
  return source;
};

export default async function DetailPage({ params }) {
  const { id } = await params; 

  const [contentRows] = await pool.execute(
    `SELECT * FROM unified_search_contents WHERE id = ?`,
    [id]
  );

  if (contentRows.length === 0) notFound();
  const item = contentRows[0];

  const [authorRows] = await pool.execute(
    `SELECT name, role FROM unified_search_authors WHERE unified_publication_id = ? ORDER BY author_seq ASC`,
    [id]
  );
  const authors = authorRows.filter(a => a.role !== 'advisor').map(row => row.name);
  const advisors = authorRows.filter(a => a.role === 'advisor').map(row => row.name);
  let journalName = null;
  let onlineIssn = null;
  let printIssn = null;
  let pdfUrl = null;
  let doi = null;
  if (item.source_name === 'thaijo') {
    const [jRows] = await pool.execute(
      `SELECT j.name_th, j.online_issn, j.print_issn, d.pdf_url
       FROM thaijo_documents d
       JOIN thaijo_journals j ON d.journal_id = j.journal_id
       WHERE d.id = ? LIMIT 1`,
      [item.source_id]
    );
    if (jRows.length > 0) {
      journalName = jRows[0].name_th;
      onlineIssn = jRows[0].online_issn;
      printIssn = jRows[0].print_issn;
      pdfUrl = jRows[0].pdf_url;
    }
  }
  if (item.source_name === 'scopus') {
    const [doiRows] = await pool.execute(
      `SELECT doi FROM scopus_documents WHERE id = ? LIMIT 1`,
      [item.source_id]
    );
    doi = doiRows.length > 0 ? doiRows[0].doi : null;
  }

  const keywordsList = parseKeywords(item.keywords);
  const sourceLabel = getSourceLabel(item.source_name);

  let groupCode = null;
  let membersWithIds = null;
  if (item.source_name === 'ai_showcase') {
    const [grp] = await pool.execute(
      `SELECT group_code FROM ai_showcase_projects WHERE id = ? LIMIT 1`,
      [item.source_id]
    );
    groupCode = grp.length > 0 ? grp[0].group_code : null;
    const [memberRows] = await pool.execute(
      `SELECT name, student_id FROM ai_showcase_project_members WHERE project_id = ? AND role = 'student'`,
      [item.source_id]
    );
    membersWithIds = memberRows;
  }

  const getSourceLink = () => {
    if (item.source_name === 'ai_showcase') {
      return item.url?.startsWith('https://ai-dday.computing.kku.ac.th/') ? item.url : null;
    }
    const directUrl = item.source_url || item.url || item.link || item.project_url;
    if (directUrl) return directUrl;

    if (item.source_name === 'scopus') {
      if (doi) return `https://www.scopus.com/record/display.uri?doi=${doi}&origin=resultslist`;
      return item.url || null;
    }
    if (item.source_name === 'thaijo') {
      return `https://tci-thaijo.org/index.php?keyword=${encodeURIComponent(item.title)}`;
    }
    return null;
  };

  const sourceLink = getSourceLink();
  const posterUrl = item.source_name === 'ai_showcase' && item.url?.startsWith('https://ai-dday.computing.kku.ac.th/') ? `${item.url}.webp` : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <BackButton />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          
          <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Globe size={14} />
                <span className="font-medium">{sourceLabel}</span>
                {journalName && (
                  <>
                    <span className="text-gray-300">/</span>
                    <span className="font-medium text-gray-700">{journalName}</span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-snug max-w-3xl">
                {item.title}
              </h1>
            </div>
            
            <div className="flex flex-wrap gap-2">

               {item.journal_quartile && (
                  <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-xl text-xs font-semibold border border-orange-200">
                    Quartile: {item.journal_quartile}
                    {item.journal_percentile && ` (${item.journal_percentile}%)`}
                  </span>
                )}
               {item.journal_tier && (
                 <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-xs font-semibold border border-emerald-200">
                    กลุ่ม {item.journal_tier}
                 </span>
               )}
            </div>
          </div>

          <div className="p-8 space-y-8">
            
            <div className="flex flex-wrap items-start gap-8">
              {groupCode && (
                <section>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Users size={16} className="text-gray-500" /> ชื่อกลุ่ม
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-xl border border-indigo-200 font-medium">
                    <Users size={12} className="text-indigo-500 shrink-0" />
                    {groupCode}
                  </div>
                </section>
              )}

              {authors.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <User size={16} className="text-gray-500" /> ผู้เขียน / ผู้จัดทำ
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {(membersWithIds || authors).map((entry, idx) => {
                      const name = entry.name || entry;
                      const sid = entry.student_id;
                      return (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 text-xs rounded-xl border border-sky-200 font-medium">
                          <User size={12} className="text-sky-500 shrink-0" />
                          {sid ? `${name} (${sid})` : name}
                        </span>
                      );
                    })}
                  </div>
                </section>
              )}

              {advisors.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <User size={16} className="text-amber-500" /> อาจารย์ที่ปรึกษา
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {advisors.map((advisor, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-xl border border-amber-200 font-medium">
                        {advisor}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {sourceLink && (
              <section>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ExternalLink size={16} className="text-gray-500" /> การเข้าถึง
                </h2>
                <div className="flex flex-wrap gap-3">
                  <a href={sourceLink} target="_blank" rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl border border-orange-200 text-xs font-medium hover:bg-orange-100 transition">
                    <Globe size={12} className="text-orange-500" /> เปิดหน้าผลงานต้นฉบับ ({sourceLabel})
                  </a>
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition">
                      <Download size={14} /> ดาวน์โหลด PDF
                    </a>
                  )}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-gray-500" /> บทคัดย่อ
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {item.abstract || <span className="text-gray-400 italic">ไม่มีข้อมูลบทคัดย่อ</span>}
              </p>
            </section>

            {keywordsList.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Tag size={16} className="text-gray-500" /> คำสำคัญ
                </h2>
                <div className="flex flex-wrap gap-2">
                  {keywordsList.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-2xl border border-emerald-200 font-medium">
                      <Tag size={11} className="text-emerald-500 shrink-0" />
                      {kw}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {posterUrl && (
              <div className="py-4 border-t border-gray-100">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={posterUrl} 
                    alt="Poster"
                    className="w-full h-auto"
                  />
                </a>
              </div>
            )}

            <section className="border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
              <div>
                <h3 className="text-xs text-gray-500 mb-1">{item.source_name === 'ai_showcase' ? 'ปีที่จัดทำ' : 'ปีที่ตีพิมพ์'}</h3>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Calendar size={14} />
                  {item.publication_year
                    ? `${item.publication_year} (${Number(item.publication_year) + 543})`
                    : "-"
                  }
                </p>
                {item.published_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.published_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-xs text-gray-500 mb-1">{item.source_name === 'ai_showcase' ? 'แท็ก' : 'ประเภทผลงาน'}</h3>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  {item.source_name === 'ai_showcase' ? <Hash size={14} /> : <Award size={14} />} {item.detail_type || "-"}
                </p>
              </div>
              {item.cited_by !== null && item.cited_by !== undefined && (
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">ถูกอ้างอิง</h3>
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Quote size={14} /> {item.cited_by} ครั้ง
                  </p>
                </div>
              )}
              {doi && (
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">DOI</h3>
                  <p className="text-sm text-gray-800 flex items-center gap-2">
                    <ExternalLink size={14} className="shrink-0" />
                    <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {doi}
                    </a>
                  </p>
                </div>
              )}
              {item.source_name === 'ai_showcase' && (
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">คณะ/วิทยาลัย</h3>
                  <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Globe size={14} /> {TRACK_NAMES[item.track_id] || item.track_id || "-"}
                  </p>
                </div>
              )}
              {onlineIssn && (
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">ISSN (ออนไลน์)</h3>
                  <p className="text-sm font-bold text-gray-800">{onlineIssn}</p>
                </div>
              )}
              {printIssn && (
                <div>
                  <h3 className="text-xs text-gray-500 mb-1">ISSN (สิ่งพิมพ์)</h3>
                  <p className="text-sm font-bold text-gray-800">{printIssn}</p>
                </div>
              )}
            </section>


          </div>
        </div>

      </div>
    </div>
  );
}