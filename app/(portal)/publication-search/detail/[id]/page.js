import { ExternalLink, Calendar, BookOpen, User, Tag, University, Globe, Award, Users, Hash, Download, Quote, Library, Medal, Trophy } from "lucide-react";
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
  let journalNameEn = null;
  let journalCategory = null;
  let journalAcronym = null;
  let journalTier = null;
  let journalTierPeriod = null;
  let journalUrl = null;
  let journalPath = null;
  let titleEn = null;
  let onlineIssn = null;
  let printIssn = null;
  let pdfUrl = null;
  let doi = null;
  let scopusIssn = null;
  let scopusEissn = null;
  let scopusVolume = null;
  let scopusIssue = null;
  let scopusPageRange = null;
  let scopusArticleNumber = null;

  if (item.source_name === 'scopus') {
    const [sRows] = await pool.execute(
      `SELECT doi, issn, eissn, volume, issue, page_range, article_number FROM scopus_documents WHERE id = ? LIMIT 1`,
      [item.source_id]
    );
    if (sRows.length > 0) {
      doi = sRows[0].doi;
      scopusIssn = sRows[0].issn;
      scopusEissn = sRows[0].eissn;
      scopusVolume = sRows[0].volume;
      scopusIssue = sRows[0].issue;
      scopusPageRange = sRows[0].page_range;
      scopusArticleNumber = sRows[0].article_number;
    }
  }

  if (item.source_name === 'thaijo') {
    const [jRows] = await pool.execute(
      `SELECT 
        j.name_th,
        j.name_en,
        j.category,
        j.acronym,
        j.online_issn,
        j.print_issn,
        j.tier,
        j.tier_period,
        j.path,
        j.journal_url,
        d.title_en,
        d.pdf_url,
        d.doi
      FROM thaijo_documents d
      JOIN thaijo_journals j ON d.journal_id = j.journal_id
      WHERE d.id = ?
      LIMIT 1`,
      [item.source_id]
    );

    if (jRows.length > 0) {
      journalName = jRows[0].name_th;
      journalNameEn = jRows[0].name_en;
      journalCategory = jRows[0].category;
      journalAcronym = jRows[0].acronym;
      onlineIssn = jRows[0].online_issn;
      printIssn = jRows[0].print_issn;
      journalTier = jRows[0].tier;
      journalTierPeriod = jRows[0].tier_period;
      journalPath = jRows[0].path;
      journalUrl = jRows[0].journal_url;
      titleEn = jRows[0].title_en;
      pdfUrl = jRows[0].pdf_url;
      doi = jRows[0].doi;
    }
  }

  const keywordsList = parseKeywords(item.keywords);
  const sourceLabel = getSourceLabel(item.source_name);

  let groupCode = null;
  let posterUrl = null;
  let membersWithIds = null;
  if (item.source_name === 'ai_showcase') {
    const [grp] = await pool.execute(
      `SELECT group_code, poster_url FROM ai_showcase_projects WHERE id = ? LIMIT 1`,
      [item.source_id]
    );
    if (grp.length > 0) {
      groupCode = grp[0].group_code;
      posterUrl = grp[0].poster_url || (item.url?.startsWith('https://ai-dday.computing.kku.ac.th/') ? `${item.url}.webp` : null);
    }
    const [memberRows] = await pool.execute(
      `SELECT name, student_id FROM ai_showcase_project_members WHERE project_id = ? AND role = 'student'`,
      [item.source_id]
    );
    membersWithIds = memberRows;
  }

  const isAIDdayLink = item.url?.startsWith('https://ai-dday.computing.kku.ac.th/');

  const getSourceLink = () => {
    if (item.source_name === 'ai_showcase') {
      return isAIDdayLink ? item.url : null;
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
  const infoCard = "rounded-xl border border-gray-200 bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <BackButton />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          
          <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100 flex flex-wrap md:flex-nowrap items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Globe size={14} />
                <span className="font-medium">{sourceLabel}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 leading-snug max-w-3xl">
                {item.title}
              </h1>
              {titleEn && (
                <p className="text-sm text-gray-500 mt-1">{titleEn}</p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 shrink-0">

               {item.journal_quartile && (
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-xl text-xs font-semibold border border-orange-200">
                    <Medal size={14} className="text-orange-500 shrink-0" />
                    {item.journal_quartile}
                    {item.journal_percentile && ` (${item.journal_percentile}%)`}
                  </span>
                )}
               {item.journal_tier && (
                 <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-xs font-semibold border border-emerald-200">
                    <Trophy size={14} className="text-emerald-500 shrink-0" />
                    กลุ่ม {item.journal_tier}
                 </span>
               )}
            </div>
          </div>

          <div className="p-8 space-y-8">
            
            <div className="flex flex-wrap items-start gap-8">
              {item.source_name === 'ai_showcase' && (
                <div className="flex flex-col gap-8 w-full">
                  {authors.length > 0 && (
                    <section>
                      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <User size={16} className="text-gray-500 shrink-0" /> ผู้จัดทำ
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {membersWithIds.map((entry, idx) => {
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

                    <section>
                      <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <University size={16} className="text-gray-500" /> ภาคีเครือข่าย
                      </h2>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border-violet-200 text-xs rounded-xl border font-medium">
                        <University size={12} className="text-violet-500 shrink-0" />
                        {TRACK_NAMES[item.track_id] || item.track_id || "-"}
                      </div>
                    </section>
                  </div>
                </div>
              )}

              {item.source_name !== 'ai_showcase' && authors.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <User size={16} className="text-gray-500 shrink-0" /> ผู้เขียน
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {authors.map((entry, idx) => {
                      const name = entry.name || entry;
                      return (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 text-xs rounded-xl border border-sky-200 font-medium">
                          <User size={12} className="text-sky-500 shrink-0" />
                          {name}
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
                    <ExternalLink size={12} className="text-orange-500" /> เปิดหน้าผลงานต้นฉบับ ({sourceLabel})
                  </a>
                  {pdfUrl && (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-medium hover:bg-rose-100 transition">
                      <Download size={12} className="text-rose-500" /> ดาวน์โหลด PDF
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

            {(item.source_name === 'thaijo' || item.journal_name) && (
              <section>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Library size={16} className="text-gray-500" /> ข้อมูลวารสาร
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  {(item.journal_name || journalName) && (
                    <div>
                      <span className="text-gray-500">ชื่อวารสาร:</span>
                      <p className="font-medium text-gray-800">{item.journal_name || journalName}</p>
                    </div>
                  )}
                  {item.source_name === 'thaijo' && journalNameEn && (
                    <div>
                      <span className="text-gray-500">ชื่อวารสาร (EN):</span>
                      <p className="font-medium text-gray-800">{journalNameEn}</p>
                    </div>
                  )}
                  {item.source_name === 'thaijo' && journalCategory && (
                    <div>
                      <span className="text-gray-500">หมวดหมู่:</span>
                      <p className="font-medium text-gray-800">{journalCategory}</p>
                    </div>
                  )}
                  {item.source_name === 'thaijo' && journalAcronym && (
                    <div>
                      <span className="text-gray-500">ชื่อย่อ:</span>
                      <p className="font-medium text-gray-800">{journalAcronym}</p>
                    </div>
                  )}
                  {item.source_name === 'thaijo' && onlineIssn && (
                    <div>
                      <span className="text-gray-500">ISSN (ออนไลน์):</span>
                      <p className="font-medium text-gray-800">{onlineIssn}</p>
                    </div>
                  )}
                  {item.source_name === 'thaijo' && printIssn && (
                    <div>
                      <span className="text-gray-500">ISSN (สิ่งพิมพ์):</span>
                      <p className="font-medium text-gray-800">{printIssn}</p>
                    </div>
                  )}
                  {item.source_name === 'thaijo' && journalTier && (
                    <div>
                      <span className="text-gray-500">กลุ่ม TCI:</span>
                      <p className="font-medium text-gray-800">กลุ่ม {journalTier}{journalTierPeriod ? ` (${journalTierPeriod})` : ''}</p>
                    </div>
                  )}
                  {doi && (
                    <div>
                      <span className="text-gray-500">DOI:</span>
                      <p className="font-medium text-gray-800">
                        <a href={`https://doi.org/${doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {doi}
                        </a>
                      </p>
                    </div>
                  )}
                  {item.source_name === 'scopus' && (scopusIssn || scopusEissn) && (
                    <div>
                      <span className="text-gray-500">ISSN:</span>
                      <p className="font-medium text-gray-800">{scopusIssn || scopusEissn}</p>
                    </div>
                  )}
                  {item.source_name === 'scopus' && (scopusVolume || scopusIssue || scopusPageRange || scopusArticleNumber) && (
                    <div>
                      <span className="text-gray-500">เล่ม/หน้า:</span>
                      <p className="font-medium text-gray-800">
                        {[scopusVolume && `Vol. ${scopusVolume}`, scopusIssue && `(Issue ${scopusIssue})`, scopusPageRange, scopusArticleNumber && `Art. ${scopusArticleNumber}`].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {item.source_name === 'thaijo' && journalUrl && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500">เว็บไซต์วารสาร:</span>
                      <p className="font-medium text-gray-800">
                        <a href={journalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                          {journalUrl}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

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

            {posterUrl && isAIDdayLink && (
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

            <section className="border-t border-gray-100 pt-6">
              <div className={`grid gap-x-8 gap-y-3 ${item.source_name === 'scopus' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
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
            </div>
            </section>


          </div>
        </div>

      </div>
    </div>
  );
}