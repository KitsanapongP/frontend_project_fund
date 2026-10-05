"use client";

import { useId, useState } from 'react';
import Hint from './report/Hint';
import styles from './FacultyInsights.module.css';
import { facultyInsightHints as hints } from '@/app/lib/scopus_faculty_insight_hints.mjs';
import { FACULTY_ROLES, insightNumber, insightPercent, insightRatio } from '@/app/lib/scopus_faculty_insights.mjs';
import { facultyRoleArcLayout, facultyRoleSelection } from '@/app/lib/scopus_faculty_donut.mjs';

// Actual arc paths keep each pointer target within its own role's segment.
function arc(start, end) {
  const point = angle => { const radians = (angle - 90) * Math.PI / 180; return [120 + 78 * Math.cos(radians), 120 + 78 * Math.sin(radians)]; };
  const from = point(start), to = point(end);
  if (end - start >= 359.999) {
    const middle = point(start + 180);
    return `M ${from} A 78 78 0 1 1 ${middle} A 78 78 0 1 1 ${to}`;
  }
  return `M ${from} A 78 78 0 ${end - start > 180 ? 1 : 0} 1 ${to}`;
}

export default function FacultyRoleDonut({ title, roles, total, percentageGroup = '' }) {
  const [hovered, setHovered] = useState(null), [focused, setFocused] = useState(null);
  const [selected, setSelected] = useState([]);
  const denominatorID = useId(), selectionID = useId();
  const summary = facultyRoleSelection(roles, total, selected), hasSelection = summary.keys.length > 0;
  const activeKeys = hasSelection ? summary.keys : [hovered || focused].filter(Boolean);
  const active = key => activeKeys.includes(key);
  const clear = () => { setSelected([]); setHovered(null); setFocused(null); };
  const select = role => {
    setSelected(previous => previous.includes(role.key) ? previous.filter(key => key !== role.key) : [...previous, role.key]);
    setHovered(null); setFocused(null);
  };
  const clearBlank = event => {
    // Portals bubble through React, but belong outside this frame in the DOM.
    if (!event.currentTarget.contains(event.target)) return;
    if (event.target.closest('button, [role="button"], [data-donut-text]')) return;
    clear();
  };
  const engage = role => ({
    onMouseEnter: () => setHovered(role.key), onMouseLeave: () => setHovered(null),
    onFocus: () => setFocused(role.key), onBlur: () => setFocused(null),
  });
  return <div data-role-donut data-active-roles={activeKeys.join(',')} data-selected-roles={summary.keys.join(',')} onClick={clearBlank} onKeyDown={event => {
    if (event.key === 'Escape' && event.target.closest('[data-role-segment], [data-role-legend]')) { event.preventDefault(); event.stopPropagation(); clear(); }
  }} style={{ containerType: 'inline-size', containerName: 'faculty-donut' }} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
    <div className="mb-1 flex items-center justify-center gap-1"><h3 data-donut-text className="text-sm font-semibold text-slate-800">{title}</h3><Hint label={`จำนวนและร้อยละ ${title}`} text={hints.donut} /></div>
    <div className={styles.donutBody}>
      <ul className={styles.legend} aria-label={`คำอธิบายสี ${title}`}>
        {FACULTY_ROLES.map(role => <li key={role.key} className="min-w-0"><button type="button" data-role-legend={role.key} {...engage(role)} onClick={() => select(role)} aria-pressed={selected.includes(role.key)} aria-describedby={denominatorID} aria-label={`เลือกบทบาท ${title} ${role.label} ${insightNumber(roles[role.key])} ผลงาน ${insightPercent(insightRatio(roles[role.key], total))}`} className={`flex min-h-12 w-full flex-col justify-center rounded-lg border px-2 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-700 ${selected.includes(role.key) ? 'border-slate-400 bg-white shadow-sm' : active(role.key) ? 'border-slate-300 bg-white' : 'border-transparent hover:bg-white'}`}>
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] leading-4 text-slate-700"><span className="h-3 w-3 shrink-0 rounded-full" style={{ background: role.color }} aria-hidden="true" /><span title={role.label}>{role.shortLabel}</span></span>
          <span className="mt-1 flex w-full items-center justify-between gap-2 pl-[18px] tabular-nums"><b className="text-sm text-slate-900">{insightNumber(roles[role.key])}</b><span className="text-xs text-slate-600">{insightPercent(insightRatio(roles[role.key], total))}</span></span>
        </button></li>)}
      </ul>
      <div className={styles.chart}>
        <svg viewBox="0 0 240 240" role="group" aria-describedby={selectionID} aria-label={`สัดส่วนบทบาท ${title} รวม ${insightNumber(total)} ผลงาน`}>
          <circle cx="120" cy="120" r="78" fill="none" stroke="#e2e8f0" strokeWidth="30" />
          {facultyRoleArcLayout(roles, total).map(role => {
            const n = role.count;
            if (!n) return null;
            const path = arc(role.start + role.gap, role.end - role.gap);
            return <g key={role.key} className={styles.segmentGroup}>
              <path data-role-halo={role.key} d={path} fill="none" stroke="#0f172a" strokeWidth={active(role.key) ? 42 : 36} aria-hidden="true" className={styles.segmentHalo} />
              <path data-role-segment={role.key} data-start-angle={role.start} data-end-angle={role.end} d={path} fill="none" stroke={role.color} strokeWidth={active(role.key) ? 36 : 30} opacity={hasSelection && !selected.includes(role.key) ? 0.3 : 1} role="button" tabIndex={0} aria-pressed={selected.includes(role.key)} aria-describedby={denominatorID} aria-label={`เลือกบทบาท ${title} ${role.label} ${insightNumber(n)} ผลงาน ${insightPercent(insightRatio(n, total))}`} {...engage(role)} onClick={() => select(role)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(role); } }} className={`${styles.segment} cursor-pointer motion-safe:transition-[opacity,stroke-width] motion-safe:duration-150`} />
            </g>;
          })}
          <g data-donut-text aria-hidden="true"><text data-donut-count x="120" y="112" textAnchor="middle" fontSize="32" fontWeight="700" fill="#0f172a">{insightNumber(summary.count)}</text><text data-donut-percent x="120" y="137" textAnchor="middle" fontSize="15" fill="#475569">{hasSelection ? insightPercent(summary.percent) : 'ผลงานทั้งหมด'}</text>{hasSelection && <text x="120" y="158" textAnchor="middle" fontSize="12" fill="#64748b">จาก {insightNumber(total)} ผลงาน</text>}</g>
        </svg>
      </div>
    </div>
    <p id={denominatorID} className="mt-1 text-center text-xs leading-5 text-slate-600"><span data-donut-text>ร้อยละคิดจากผลงาน{percentageGroup}ทั้งหมด {insightNumber(total)} ผลงาน</span></p>
    <p id={selectionID} role="status" aria-live="polite" aria-atomic="true" className="sr-only">{hasSelection ? `เลือก ${summary.labels.join(' และ ')} รวม ${insightNumber(summary.count)} ผลงาน คิดเป็น ${insightPercent(summary.percent)} จากผลงานทั้งหมด ${insightNumber(total)} ผลงาน` : `แสดงผลงานทั้งหมด ${insightNumber(total)} ผลงาน`}</p>
    {total === 0 && <p className="mt-1 text-center text-xs text-slate-500"><span data-donut-text>ไม่พบผลงานในกลุ่มนี้</span></p>}
  </div>;
}
