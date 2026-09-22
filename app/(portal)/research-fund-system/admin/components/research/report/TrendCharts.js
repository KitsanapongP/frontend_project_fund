"use client";

import { useEffect, useRef, useState } from "react";
import { formatCount, formatPct, isUsable } from "@/app/lib/scopus_benchmark_report.mjs";

const INK = "#0f172a";
const MUTED = "#64748b";
const RULE = "#e2e8f0";
const FACULTY = "#2563eb";
const TINT = "#a7c3f6";
const HEIGHT = 240;

function niceCeil(value) {
  if (!(value > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

// Measure the container width so each chart's SVG viewBox matches its rendered CSS
// width 1:1. Without this the fixed viewBox is scaled down on small screens and the
// text shrinks below the 12px floor (R9). Falls back to a sensible width for SSR.
function useMeasuredWidth(fallback) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && Math.abs(w - width) > 1) setWidth(w);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [width]);
  return [ref, Math.max(240, Math.round(width))];
}

// Fewer x ticks when the chart is narrow or spans many years, so year labels never
// collide (also part of R9).
function tickEvery(width, count) {
  if (count <= 6) return 1;
  if (width < 360) return 3;
  if (width < 520) return 2;
  return 1;
}

// Column chart of faculty document counts by year (baseline 0). The report year is
// solid blue, other ended years a lighter tint, and the current year is drawn with
// a hatch pattern + "สะสม" so cumulative data never relies on colour alone. Missing
// years are gaps, not zeros (§5 D).
function VolumeChart({ points, reportYear, currentYear, width }) {
  const W = width;
  const H = HEIGHT;
  const left = 42;
  const right = 16;
  const top = 16;
  const bottom = 40;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const values = points.map((p) => (isUsable(p.faculty) ? Number(p.faculty) : null));
  const max = Math.max(1, ...values.filter((v) => v !== null));
  const axisMax = niceCeil(max);
  const band = plotW / points.length;
  const barW = Math.min(40, band * 0.62);
  const every = tickEvery(W, points.length);
  const ticks = [0, 1, 2, 3].map((i) => (axisMax * i) / 3);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }} role="img"
      aria-label={`กราฟแท่งจำนวนผลงานคณะรายปี ${points[0]?.year}–${points[points.length - 1]?.year}`}>
      <defs>
        <pattern id="rp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="#dbe6fb" />
          <line x1="0" y1="0" x2="0" y2="6" stroke={FACULTY} strokeWidth="2.4" />
        </pattern>
      </defs>
      <desc>จำนวนผลงานคณะรายปี ปีปัจจุบันเป็นข้อมูลสะสม แสดงด้วยลายเส้น</desc>
      {ticks.map((value, index) => {
        const y = top + plotH - (value / axisMax) * plotH;
        return (
          <g key={index}>
            <line x1={left} y1={y} x2={W - right} y2={y} stroke={RULE} />
            <text x={left - 8} y={y + 4} textAnchor="end" fontSize="12" fill={MUTED}>{formatCount(Math.round(value))}</text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const value = values[index];
        const cx = left + band * (index + 0.5);
        const isReport = Number(point.year) === Number(reportYear);
        const isCurrent = Number(point.year) === Number(currentYear);
        const showYear = index % every === 0 || isReport;
        if (value === null) {
          return showYear ? <text key={point.year} x={cx} y={H - 12} textAnchor="middle" fontSize="12" fill={MUTED}>{point.year}</text> : null;
        }
        const barH = (value / axisMax) * plotH;
        const y = top + plotH - barH;
        const fill = isCurrent ? "url(#rp-hatch)" : isReport ? FACULTY : TINT;
        return (
          <g key={point.year}>
            <rect x={cx - barW / 2} y={y} width={barW} height={barH} fill={fill} stroke={isCurrent ? FACULTY : "none"} strokeWidth={isCurrent ? 1 : 0} />
            <text x={cx} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="600" fill={INK}>{formatCount(value)}</text>
            {isCurrent && <text x={cx} y={y - 20} textAnchor="middle" fontSize="10" fill={MUTED}>สะสม</text>}
            {showYear && <text x={cx} y={H - 12} textAnchor="middle" fontSize="12" fill={isReport ? INK : MUTED} fontWeight={isReport ? "600" : "400"}>{point.year}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// Line chart of the faculty/KKU share by year (straight segments, not smoothed).
// Y starts at 0 with a dynamic upper bound; the final point is directly labelled;
// missing points break the line rather than dropping to zero (§5 D).
function ShareChart({ points, width }) {
  const W = width;
  const H = HEIGHT;
  const left = 40;
  const right = 30;
  const top = 16;
  const bottom = 40;
  const plotW = W - left - right;
  const plotH = H - top - bottom;
  const values = points.map((p) => (isUsable(p.share) ? Number(p.share) : null));
  const max = Math.max(1, ...values.filter((v) => v !== null));
  const axisMax = Math.max(5, niceCeil(max));
  const every = tickEvery(W, points.length);
  const ticks = [0, 1, 2, 3].map((i) => (axisMax * i) / 3);
  const coords = points.map((p, index) => {
    const value = values[index];
    if (value === null) return null;
    return { x: left + plotW * ((index + 0.5) / points.length), y: top + plotH - (value / axisMax) * plotH, value, year: p.year };
  });
  const segments = [];
  let current = [];
  coords.forEach((c) => {
    if (c) current.push(c);
    else if (current.length) { segments.push(current); current = []; }
  });
  if (current.length) segments.push(current);
  const lastPoint = [...coords].reverse().find(Boolean);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }} role="img"
      aria-label={`กราฟเส้นสัดส่วนผลงานคณะต่อ KKU รายปี ${points[0]?.year}–${points[points.length - 1]?.year}`}>
      <desc>สัดส่วนผลงานคณะเทียบผลงาน KKU รายปี หน่วยเป็นเปอร์เซ็นต์</desc>
      {ticks.map((value, index) => {
        const y = top + plotH - (value / axisMax) * plotH;
        return (
          <g key={index}>
            <line x1={left} y1={y} x2={W - right} y2={y} stroke={RULE} />
            <text x={left - 8} y={y + 4} textAnchor="end" fontSize="12" fill={MUTED}>{Math.round(value)}%</text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const show = index % every === 0 || index === points.length - 1;
        const x = left + plotW * ((index + 0.5) / points.length);
        return show ? <text key={point.year} x={x} y={H - 12} textAnchor="middle" fontSize="12" fill={MUTED}>{point.year}</text> : null;
      })}
      {segments.map((segment, index) => (
        <polyline key={index} points={segment.map((c) => `${c.x},${c.y}`).join(" ")} fill="none" stroke={FACULTY} strokeWidth="2.4" />
      ))}
      {coords.filter(Boolean).map((c) => (
        <circle key={c.year} cx={c.x} cy={c.y} r="3.4" fill={FACULTY} />
      ))}
      {lastPoint && (
        <text x={Math.min(lastPoint.x, W - right)} y={lastPoint.y - 12} textAnchor="middle" fontSize="12" fontWeight="600" fill={INK}>{formatPct(lastPoint.value)}</text>
      )}
    </svg>
  );
}

export default function TrendCharts({ points, reportYear, currentYear, trendRange, onRangeChange, scopeConsistent = true, showRangeSelector = true, periodLabel }) {
  const [volumeRef, volumeWidth] = useMeasuredWidth(520);
  const [shareRef, shareWidth] = useMeasuredWidth(360);

  return (
    <section className="border-b border-slate-200 py-6" aria-label="แนวโน้มรายปีของคณะ">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">แนวโน้มผลงานคณะ{showRangeSelector ? "" : ` (ช่วงปี ${periodLabel})`}</h2>
        {showRangeSelector ? (
          <div className="no-print inline-flex overflow-hidden rounded-md border border-slate-300" role="group" aria-label="ช่วงปีของกราฟแนวโน้ม">
            {[5, 10].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => onRangeChange(range)}
                aria-pressed={trendRange === range}
                className={`px-3 py-1.5 text-xs font-medium ${trendRange === range ? "bg-blue-50 text-blue-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {range} ปี
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0">
          <h3 className="mb-2 text-sm text-slate-500">จำนวนผลงานคณะ <span className="text-slate-400">/ ผลงาน</span></h3>
          <div ref={volumeRef}>
            <VolumeChart points={points} reportYear={reportYear} currentYear={currentYear} width={volumeWidth} />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="mb-2 text-sm text-slate-500">สัดส่วนผลงานคณะต่อ KKU <span className="text-slate-400">/ %</span></h3>
          {scopeConsistent ? (
            <div ref={shareRef}>
              <ShareChart points={points} width={shareWidth} />
            </div>
          ) : (
            <div className="flex h-[240px] items-center justify-center rounded-md border border-dashed border-amber-200 bg-amber-50 px-4 text-center text-xs text-amber-800">
              งดสัดส่วนคณะ/KKU เพราะขอบเขตของสามระดับไม่ตรงกัน (แสดงเฉพาะจำนวนผลงานคณะที่สังเกตได้)
            </div>
          )}
        </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-600">ดูตัวเลขรายปี</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm tabular-nums">
            <caption className="sr-only">ตัวเลขจำนวนผลงานคณะ ผลงาน KKU และสัดส่วนคณะต่อ KKU รายปี</caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th scope="col" className="py-2 pr-3">ปี</th>
                <th scope="col" className="py-2 pr-3 text-right">ผลงานคณะ</th>
                <th scope="col" className="py-2 pr-3 text-right">ผลงาน KKU</th>
                <th scope="col" className="py-2 text-right">สัดส่วนคณะ/KKU</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.year} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{point.year}{Number(point.year) === Number(currentYear) ? " (สะสม)" : ""}</td>
                  <td className="py-2 pr-3 text-right">{isUsable(point.faculty) ? formatCount(point.faculty) : "–"}</td>
                  <td className="py-2 pr-3 text-right">{isUsable(point.kku) ? formatCount(point.kku) : "–"}</td>
                  <td className="py-2 text-right">{isUsable(point.share) ? formatPct(point.share) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
