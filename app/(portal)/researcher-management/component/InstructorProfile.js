"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Mail, Phone, GraduationCap, BookOpen, Award,
  Lightbulb, Loader2, Link2, CalendarDays, Banknote,
  FlaskConical, BadgeCheck, Building, Layers
} from "lucide-react";
import api from "../../../lib/api";
import ResearcherResearch from "./ResearcherResearch";
import { exportToDocx } from "../utils/exportCHEDocx"; 

// ─── Static data ──────────────────────────────────────────────
const prefixMap = { "นาย": "Mr.", "นาง": "Mrs.", "นางสาว": "Miss" };

const DEGREE_LABEL = { 1: "ปริญญาตรี", 2: "ปริญญาโท", 3: "ปริญญาเอก" };

const InstructorCourseList = [
  {
    label: "ระดับปริญญาตรี",
    courses: [
      { course_id: 1, course_name: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศและนวัตกรรมอัจฉริยะ" },
      { course_id: 2, course_name: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์" },
      { course_id: 3, course_name: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาภูมิสารสนเทศศาสตร์" },
      { course_id: 4, course_name: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาปัญญาประดิษฐ์" },
      { course_id: 5, course_name: "หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาความมั่นคงปลอดภัยไซเบอร์" },
    ],
  },
  {
    label: "ระดับปริญญาโท",
    courses: [
      { course_id: 6, course_name: "หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ" },
      { course_id: 7, course_name: "หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาวิทยาการข้อมูลและปัญญาประดิษฐ์ (นานาชาติ)" },
      { course_id: 8, course_name: "หลักสูตรวิทยาศาสตรมหาบัณฑิต สาขาวิชาภูมิสารสนเทศศาสตร์" },
    ],
  },
  {
    label: "ระดับปริญญาเอก",
    courses: [
      { course_id: 9,  course_name: "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศ (นานาชาติ)" },
      { course_id: 10, course_name: "หลักสูตรปรัชญาดุษฎีบัณฑิต สาขาวิชาภูมิสารสนเทศศาสตร์" },
    ],
  },
];

const courseMap = Object.fromEntries(
  InstructorCourseList.flatMap((g) =>
    g.courses.map((c) => [c.course_id, { name: c.course_name, level: g.label }])
  )
);

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────
function Section({ icon, title, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
          {icon}
        </span>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-sm text-slate-400 italic">ไม่มีข้อมูล</p>;
}

function LevelBadge({ label }) {
  const color =
    label === "ระดับปริญญาตรี"
      ? "bg-sky-50 text-sky-700 border-sky-200"
      : label === "ระดับปริญญาโท"
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`inline-block text-[10px] font-bold border rounded-full px-2 py-0.5 ${color}`}>
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function InstructorPublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/instructors/profile/${id}`)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <Loader2 className="animate-spin text-cyan-500" size={36} />
      </div>
    );

  const {
    header,
    educations,
    expertises,
    instructor_research_projects,
    instructor_intellectual_properties,
    instructor_course_responsibility,
    instructor_textbooks,
  } = profile;

  const externalLinks = [
    { key: "scopus_id",        label: "Scopus",         url: header?.scopus_id },
    { key: "scholar_author_id",label: "Google Scholar", url: header?.scholar_author_id },
    { key: "thaijo_author_id", label: "ThaiJO",         url: header?.thaijo_author_id },
  ].filter((l) => l.url);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">

        {/* ══ HERO CARD ══════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden relative">
          {/* Top accent strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />

          <div className="flex flex-col sm:flex-row gap-6 p-6 sm:p-8 relative">
            {/* Avatar */}
            <div className="shrink-0 self-start">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-3xl font-bold flex items-center justify-center shadow-md">
                {header?.user_fname?.charAt(0) || "อ"}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-1 pr-0 sm:pr-32"> {/* เว้นระยะขวาบนจอใหญ่ไม่ให้ข้อความไปทับปุ่ม */}
              
              {/* ปุ่ม Export อยู่ขวาสุดของชื่อบนจอใหญ่ และต่อท้ายชื่อบนจอมือถือ */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h1 className="text-2xl font-bold text-slate-900 leading-snug">
                  {header?.prefix}{header?.user_fname} {header?.user_lname}
                </h1>
                
                <button
                  onClick={async () => {
                    try {
                      let researchData = [];
                      if (id) {
                        const res = await api.get(`/researcher-management/instructors/${id}/documents`);
                        researchData = res || []; 
                      }

                      const completeProfileData = {
                        header: { ...header },
                        educations: educations || [],
                        expertises: expertises || [], 
                        textbooks: instructor_textbooks || [],   
                        researches: researchData,
                        intellectualProperties: instructor_intellectual_properties || [],
                        researchProjects: instructor_research_projects || []
                      };

                      exportToDocx(completeProfileData);
                    } catch (error) {
                      console.error("Export error:", error);
                      alert("เกิดข้อผิดพลาดในการเตรียมข้อมูลส่งออก");
                    }
                  }}
                  className="sm:absolute sm:top-6 sm:right-8 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm active:scale-95 transition-all duration-150 shrink-0"
                >
                  <BookOpen size={13} className="text-white/90" />
                  <span>Export CHE .docx</span>
                </button>
              </div>

              {/* English name */}
              {header?.Name_en && (
                <p className="text-slate-500 text-sm">
                  {prefixMap[header?.prefix] || header?.prefix} {header.Name_en}
                </p>
              )}

              {/* Position + employment date */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {header?.position && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <BadgeCheck size={13} className="text-cyan-500" />
                    {header.position}
                  </span>
                )}
                {header?.date_of_employment && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarDays size={13} className="text-slate-400" />
                    บรรจุงาน {formatDate(header.date_of_employment)}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-3" />

              {/* Contact */}
              <div className="space-y-1.5">
                {header?.email && (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={14} className="text-cyan-500 shrink-0" />
                    <a href={`mailto:${header.email}`} className="hover:text-cyan-600 hover:underline">
                      {header.email}
                    </a>
                  </p>
                )}
                {header?.tel && (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-cyan-500 shrink-0" />
                    {header.tel}
                  </p>
                )}
              </div>

              {/* External links */}
              {externalLinks.length > 0 && (
                <div className="pt-3 space-y-1.5">
                  {externalLinks.map((l) => (
                    <a
                      key={l.key}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-xs text-slate-500 hover:text-cyan-600 group"
                    >
                      <Link2 size={12} className="mt-0.5 shrink-0 text-slate-400 group-hover:text-cyan-500" />
                      <span className="flex flex-col">
                        <span className="font-semibold text-slate-700 group-hover:text-cyan-700">{l.label}</span>
                        <span className="truncate max-w-xs text-slate-400 group-hover:text-cyan-500">{l.url}</span>
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ ตำรา ══════════════════════════════════════════════════ */}
        <Section icon={<BookOpen size={16} />} title="ตำราและหนังสือ">
          {instructor_textbooks?.length > 0 ? (
            <ol className="space-y-3">
              {instructor_textbooks.map((t, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3">
                      {t.publisher && (
                        <span className="flex items-center gap-1">
                          <Building size={10} className="text-slate-400" />
                          {t.publisher}
                        </span>
                      )}
                      {t.edition && (
                        <span className="flex items-center gap-1">
                          <Layers size={10} className="text-slate-400" />
                          {t.edition}
                        </span>
                      )}
                      {t.year && (
                        <span className="text-slate-400">
                          พ.ศ. {t.year + 543} ({t.year})
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Empty />
          )}
        </Section>

        {/* ══ หลักสูตรที่รับผิดชอบ ═══════════════════════════════ */}
        <Section icon={<BookOpen size={16} />} title="หลักสูตรที่รับผิดชอบ">
          {instructor_course_responsibility?.length > 0 ? (
            <ul className="space-y-2.5">
              {instructor_course_responsibility.map((item, i) => {
                const course = courseMap[item.course_id];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <div>
                      {course?.level && <LevelBadge label={course.level} />}
                      <p className="text-sm text-slate-700 mt-0.5 leading-snug">
                        {course?.name || `หลักสูตร ID: ${item.course_id}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>

        {/* ══ ประวัติการศึกษา ══════════════════════════════════════ */}
        <Section icon={<GraduationCap size={16} />} title="ประวัติการศึกษา">
          {educations?.length > 0 ? (
            <ol className="relative border-l border-slate-200 ml-1 space-y-5">
              {educations.map((edu, i) => (
                <li key={i} className="pl-5 relative">
                  <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 border-2 border-white ring-1 ring-cyan-300" />
                  <span className="inline-block text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full px-2 py-0.5 mb-1">
                    {DEGREE_LABEL[edu.degree_id] || `ระดับ ${edu.degree_id}`}
                  </span>
                  <p className="font-semibold text-slate-800 text-sm leading-snug">
                    {edu.degree_title_th}
                    {edu.major ? <span className="font-normal text-slate-500"> — {edu.major}</span> : null}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {edu.university_th || edu.university_en || "-"}
                    {edu.grad_year ? ` · ${edu.grad_year}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <Empty />
          )}
        </Section>

        {/* ══ ความเชี่ยวชาญ ════════════════════════════════════════ */}
        <Section icon={<Lightbulb size={16} />} title="ความเชี่ยวชาญ">
          {expertises?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {expertises.map((e, i) => (
                <span
                  key={i}
                  className="bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {e.expertise}
                </span>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        {/* ══ โครงการวิจัย ══════════════════════════════════════════ */}
        <Section icon={<FlaskConical size={16} />} title="โครงการวิจัย">
          {instructor_research_projects?.length > 0 ? (
            <div className="space-y-3">
              {instructor_research_projects.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1"
                >
                  <p className="font-semibold text-slate-800 text-sm leading-snug">
                    {p.project_name_th || "-"}
                  </p>
                  {p.project_name_en && (
                    <p className="text-xs text-slate-500 italic">{p.project_name_en}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 pt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Banknote size={11} className="text-slate-400" />
                      {p.source_of_fund || "-"}
                    </span>
                    {p.budget && (
                      <span className="text-xs text-slate-500">
                        งบประมาณ {Number(p.budget).toLocaleString()} บาท
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatDate(p.start_date)} – {formatDate(p.end_date)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </Section>

        {/* ══ ทรัพย์สินทางปัญญา ════════════════════════════════════ */}
        <Section icon={<Award size={16} />} title="ผลงานวิชาการและทรัพย์สินทางปัญญา">
          {instructor_intellectual_properties?.length > 0 ? (
            <ul className="space-y-3">
              {instructor_intellectual_properties.map((ip, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <span className="mt-1 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm leading-snug">{ip.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ประเภท: <span className="text-slate-700">{ip.type || "-"}</span>
                      <span className="mx-1.5 text-slate-300">|</span>
                      เลขทะเบียน:{" "}
                      <span className="text-slate-700">
                        {ip.registration_number || "อยู่ระหว่างดำเนินการ"}
                      </span>
                      {ip.granted_year && (
                        <>
                          <span className="mx-1.5 text-slate-300">|</span>
                          ปีที่ได้รับ:{" "}
                          <span className="text-slate-700">{ip.granted_year}</span>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Section>

        {/* ══ งานวิจัยและบทความ (APA) ══════════════════════════════ */}
        <Section icon={<BookOpen size={16} />} title="งานวิจัยและบทความทางวิชาการ">
          <ResearcherResearch targetUserId={id} hideHeader={true} />
        </Section>

      </div>
    </div>
  );
}
