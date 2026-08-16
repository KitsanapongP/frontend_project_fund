"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { usersAPI, scopusConfigAPI } from "@/app/lib/api";
import { formatNumber } from "@/app/utils/format";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const toBE = (ce) => (ce == null || ce === "" ? "" : Number(ce) + 543);

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text; // กัน CSV injection
  return `"${safe.replaceAll('"', '""')}"`;
}

function htmlEscape(value) {
  return String(value == null ? "" : value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function downloadFile(filename, content, mime) {
  const blob = new Blob(["﻿", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }); // BOM ให้ Excel อ่านไทยได้
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Hirsch h-graph รายอาจารย์ (เอกสารเรียงตาม citations vs เส้น y=x) จาก scopus_documents
export default function AdminScopusAuthorHIndex() {
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedScopusId, setSelectedScopusId] = useState("");

  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const [graph, setGraph] = useState(null);
  const [authorYears, setAuthorYears] = useState([]); // ปี (ค.ศ.) ที่มีเอกสารจริงของอาจารย์คนที่เลือก
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportingAll, setExportingAll] = useState(false);

  // โหลดรายชื่ออาจารย์ที่มี Scopus ID
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setUsersLoading(true);
      try {
        const res = await usersAPI.listScopusUsers({ limit: 200 });
        const items = Array.isArray(res?.data) ? res.data : [];
        if (cancelled) return;
        setUsers(items);
        if (items.length > 0) {
          setSelectedScopusId(String(items[0].scopus_id || ""));
        }
      } catch (e) {
        if (!cancelled) setUsersError(e?.message || "ไม่สามารถโหลดรายชื่ออาจารย์ได้");
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedUser = useMemo(
    () => users.find((u) => String(u.scopus_id) === String(selectedScopusId)) || null,
    [users, selectedScopusId]
  );

  // ===== Zoom (ทำเองเพื่อคุม cap + ให้ smooth + ไม่มี drag) =====
  const chartWrapRef = useRef(null);
  const ZOOM_MIN_SPAN = 3; // ซูมเข้าได้ลึกสุด ~3 บทความ (cap เข้า)
  // ช่วงเต็มของแกน X = จำนวนบทความ หรือ citation สูงสุด (อย่างใดมากกว่า)
  const axisMax = useMemo(() => {
    if (!graph || !Array.isArray(graph.points) || graph.points.length === 0) return 1;
    const n = graph.points.length;
    const maxCit = graph.points.reduce((m, p) => Math.max(m, p.citations || 0), 0);
    return Math.max(n, maxCit, 1);
  }, [graph]);
  const zoomRef = useRef({ min: 0, max: 1 });
  // กราฟเปลี่ยน (เปลี่ยนคน/ช่วงปี) -> รีเซ็ตซูมเป็นเต็ม
  useEffect(() => {
    zoomRef.current = { min: 0, max: axisMax };
  }, [axisMax]);

  async function applyZoomRange(min, max) {
    min = Math.max(0, min);
    max = Math.min(axisMax, max);
    if (max - min < ZOOM_MIN_SPAN) {
      const c = (min + max) / 2;
      min = Math.max(0, c - ZOOM_MIN_SPAN / 2);
      max = Math.min(axisMax, c + ZOOM_MIN_SPAN / 2);
    }
    if (min >= max) return;
    zoomRef.current = { min, max };
    try {
      const ApexCharts = (await import("apexcharts")).default;
      ApexCharts.exec("author-hindex-graph", "updateOptions", { xaxis: { min, max } }, false, false);
    } catch (_) {}
  }
  // factor < 1 = ซูมเข้า, > 1 = ซูมออก; center = จุดที่คงไว้ (ค่าเริ่มต้น = กลางช่วง)
  function zoomBy(factor, center) {
    const { min, max } = zoomRef.current;
    const span = max - min;
    const c = center == null ? (min + max) / 2 : center;
    const newSpan = Math.min(axisMax, span * factor);
    let nmin = c - (c - min) * (newSpan / span);
    applyZoomRange(nmin, nmin + newSpan);
  }
  const zoomInStep = () => zoomBy(0.6);
  const zoomOutStep = () => zoomBy(1.7);
  const zoomReset = () => applyZoomRange(0, axisMax);

  // wheel zoom แบบ smooth (ก้าวเล็ก ๆ ไม่มี debounce) เฉพาะตอนชี้อยู่บนกราฟ
  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!graph) return;
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 1.12 : 0.89); // ออก / เข้า ทีละนิด
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, axisMax]);

  // Export CSV: h-index ของอาจารย์ทุกคน
  async function exportAllCSV() {
    setExportingAll(true);
    setError("");
    try {
      const res = await scopusConfigAPI.getAuthorHIndexSummary();
      const data = Array.isArray(res?.data) ? res.data : [];
      const header = [
        "ลำดับ", "รหัสอาจารย์", "ชื่อ-สกุล", "Scopus Author ID",
        "h-index", "จำนวนเอกสาร", "การอ้างอิงรวม", "ผู้เขียนร่วม", "ช่วงปีผลงาน (พ.ศ.)",
      ];
      const rows = data.map((r) => [
        r.rank, r.user_id, r.name, r.scopus_author_id,
        r.h_index, r.document_count, r.citation_total, r.scopus_coauthor_count ?? "-",
        r.year_min != null ? `${toBE(r.year_min)}–${toBE(r.year_max)}` : "-",
      ]);
      downloadCSV(`scopus-hindex-all-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    } catch (e) {
      setError(e?.message || "ส่งออกข้อมูลทุกคนไม่สำเร็จ");
    } finally {
      setExportingAll(false);
    }
  }

  // Export CSV รายบุคคล: รายการบทความของอาจารย์ที่เลือก ตามช่วงปีที่แสดง
  function exportPersonCSV() {
    if (!graph || !Array.isArray(graph.points) || graph.points.length === 0) return;
    const h = graph.h_index;
    const header = ["ลำดับ", "ชื่อบทความ", "ปี (พ.ศ.)", "จำนวนการอ้างอิง", "อยู่ใน h-core", "EID"];
    const rows = graph.points.map((p) => [
      p.rank, p.title || "", p.year != null ? toBE(p.year) : "-", p.citations, p.rank <= h ? "ใช่" : "ไม่", p.eid || "",
    ]);
    downloadCSV(`scopus-hindex-${selectedScopusId}-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  }

  // Export รายงานรายบุคคล: ไฟล์ HTML ฝังภาพกราฟ + ตารางบทความ (เปิดในเบราว์เซอร์/พิมพ์เป็น PDF ได้)
  async function exportPersonReport() {
    if (!graph || !Array.isArray(graph.points) || graph.points.length === 0) return;
    const h = graph.h_index;

    let imgTag = "";
    try {
      const ApexCharts = (await import("apexcharts")).default;
      // รีเซ็ตซูมให้กราฟเต็มก่อนแคปเป็นรูป กันภาพที่ผู้ใช้ซูมค้างไว้ออกไปในรายงาน
      try {
        zoomRef.current = { min: 0, max: axisMax };
        ApexCharts.exec("author-hindex-graph", "updateOptions", { xaxis: { min: 0, max: axisMax } }, false, false);
        await new Promise((r) => setTimeout(r, 80));
      } catch (_) {}
      const res = await ApexCharts.exec("author-hindex-graph", "dataURI", { scale: 2 });
      if (res?.imgURI) {
        imgTag = `<img src="${res.imgURI}" alt="กราฟ h-index" style="max-width:100%;border:1px solid #e2e8f0;border-radius:8px;margin-top:8px" />`;
      }
    } catch (e) {
      // ถ้าดึงภาพกราฟไม่ได้ ก็ยังออกรายงานพร้อมตารางได้
    }

    const name = selectedUser?.name || selectedScopusId;
    const yearLabel =
      yearFrom || yearTo ? `${yearFrom ? toBE(yearFrom) : "ต้น"}–${yearTo ? toBE(yearTo) : "ล่าสุด"} พ.ศ.` : "ทั้งหมด";
    const rowsHtml = graph.points
      .map(
        (p) => `<tr>
          <td style="text-align:center">${p.rank}</td>
          <td>${htmlEscape(p.title || "")}</td>
          <td style="text-align:center">${p.year != null ? toBE(p.year) : "-"}</td>
          <td style="text-align:right">${p.citations}</td>
          <td style="text-align:center">${p.rank <= h ? "✓" : ""}</td>
          <td>${htmlEscape(p.eid || "")}</td>
        </tr>`
      )
      .join("");

    const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><title>h-index — ${htmlEscape(name)}</title>
<style>
  body{font-family:'Sarabun',Tahoma,-apple-system,'Segoe UI',sans-serif;color:#0f172a;margin:28px;max-width:960px}
  h1{font-size:20px;margin:0 0 4px}.muted{color:#64748b;font-size:13px}
  .stats{display:flex;gap:16px;margin:16px 0;flex-wrap:wrap}
  .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;min-width:110px}
  .stat b{font-size:22px;display:block}.stat span{color:#64748b;font-size:12px}
  table{border-collapse:collapse;width:100%;font-size:13px;margin-top:18px}
  th,td{border:1px solid #e2e8f0;padding:6px 9px;vertical-align:top}th{background:#f1f5f9;text-align:left}
  @media print{body{margin:0}}
</style></head><body>
  <h1>h-index รายบุคคล — ${htmlEscape(name)}</h1>
  <div class="muted">Scopus Author ID: ${htmlEscape(selectedScopusId)} · ช่วงปี: ${yearLabel} · ออกรายงาน ${new Date().toLocaleDateString("th-TH")}</div>
  <div class="stats">
    <div class="stat"><span>h-index</span><b>${h}</b></div>
    <div class="stat"><span>เอกสาร</span><b>${graph.document_count}</b></div>
    <div class="stat"><span>การอ้างอิงรวม</span><b>${graph.citation_total}</b></div>
  </div>
  ${imgTag}
  <table>
    <thead><tr><th style="width:48px">ลำดับ</th><th>ชื่อบทความ</th><th style="width:74px">ปี (พ.ศ.)</th><th style="width:84px">การอ้างอิง</th><th style="width:60px">h-core</th><th style="width:150px">EID</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body></html>`;

    downloadFile(`scopus-hindex-${selectedScopusId}-${new Date().toISOString().slice(0, 10)}.html`, html, "text/html;charset=utf-8");
  }

  async function fetchGraph(scopusId, yf, yt) {
    if (!scopusId) return;
    setLoading(true);
    setError("");
    try {
      const params = { scopus_id: scopusId };
      if (yf) params.year_from = yf;
      if (yt) params.year_to = yt;
      const res = await scopusConfigAPI.getAuthorHIndexGraph(params);
      const data = res?.data || null;
      setGraph(data);
      // ตอนโหลดช่วงเต็ม (ไม่กรองปี) เก็บรายการปีที่มีเอกสารจริง + ตั้ง default เป็นช่วงเต็ม (h-index เป็นค่าสะสมทั้งอาชีพ)
      if (data && !yf && !yt) {
        let ys = Array.isArray(data.available_years) ? data.available_years.map(Number) : [];
        if (ys.length === 0 && Array.isArray(data.points)) {
          ys = [...new Set(data.points.map((p) => p.year).filter((y) => y != null).map(Number))];
        }
        ys.sort((a, b) => b - a);
        setAuthorYears(ys);
        if (data.available_year_min != null) setYearFrom(String(data.available_year_min));
        if (data.available_year_max != null) setYearTo(String(data.available_year_max));
      }
    } catch (e) {
      setError(e?.message || "ไม่สามารถโหลดกราฟ h-index ได้");
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }

  // เมื่อเปลี่ยนอาจารย์ -> โหลดกราฟช่วงเต็ม (fetchGraph จะตั้ง default ช่วงปีเป็นช่วงที่มีข้อมูลจริง)
  useEffect(() => {
    if (!selectedScopusId) return;
    setYearFrom("");
    setYearTo("");
    fetchGraph(selectedScopusId, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScopusId]);

  // ตัวเลือกปี (ค.ศ.) = ปีที่มีเอกสารจริงจาก backend (available_years) + ปีที่เลือกไว้ (กันช่องว่าง)
  // แสดงผลเป็น พ.ศ. ในหน้าจอ แต่เก็บ/ส่งค่าเป็น ค.ศ. ให้ตรงกับ endpoint
  const yearOptions = useMemo(() => {
    const set = new Set(authorYears.map(Number));
    const selFrom = Number(yearFrom);
    const selTo = Number(yearTo);
    if (Number.isFinite(selFrom) && selFrom > 0) set.add(selFrom);
    if (Number.isFinite(selTo) && selTo > 0) set.add(selTo);
    return Array.from(set).sort((a, b) => b - a);
  }, [authorYears, yearFrom, yearTo]);

  const chart = useMemo(() => {
    if (!graph || !Array.isArray(graph.points) || graph.points.length === 0) return null;
    const points = graph.points;
    const n = points.length;
    const maxCit = points.reduce((m, p) => Math.max(m, p.citations || 0), 0);
    const axisMax = Math.max(n, maxCit, 1);

    const areaData = points.map((p) => ({ x: p.rank, y: p.citations || 0 }));
    const diagData = [
      { x: 0, y: 0 },
      { x: axisMax, y: axisMax },
    ];

    const h = graph.h_index;
    const options = {
      chart: {
        id: "author-hindex-graph",
        type: "line",
        // ปิด zoom/toolbar ในตัว ApexCharts (drag ไม่มีประโยชน์ + wheel มัน debounce กระตุก)
        // แล้วใช้ปุ่ม + wheel handler ของเราเองที่ clamp ช่วงได้ (ดู applyZoom/zoomBy)
        toolbar: { show: false },
        zoom: { enabled: false },
        selection: { enabled: false },
        fontFamily: "inherit",
        animations: { enabled: false },
      },
      colors: ["#38bdf8", "#7c3aed"],
      stroke: { curve: "straight", width: [2, 2] },
      fill: { type: ["gradient", "solid"], opacity: [0.25, 1] },
      // จุดบนเส้น citations hover ดูรายละเอียดบทความได้ ส่วนเส้นทแยงไม่มีจุด
      markers: { size: [3, 0], strokeWidth: 0, hover: { size: 6 } },
      xaxis: {
        type: "numeric",
        min: 0,
        max: axisMax,
        tickAmount: Math.min(axisMax, 12),
        title: { text: "ลำดับบทความ (เรียงตามการอ้างอิงมาก→น้อย)" },
        labels: { formatter: (v) => `${Math.round(v)}` },
      },
      yaxis: {
        min: 0,
        title: { text: "จำนวนการอ้างอิง" },
        labels: { formatter: (v) => `${Math.round(v)}` },
      },
      legend: { show: false },
      tooltip: {
        shared: false,
        intersect: true,
        custom: ({ seriesIndex, dataPointIndex }) => {
          if (seriesIndex !== 0) return "";
          const p = points[dataPointIndex];
          if (!p) return "";
          const title = p.title ? p.title : "(ไม่มีชื่อเรื่อง)";
          return `<div style="padding:6px 8px;font-size:12px;max-width:280px">
            <div style="font-weight:600">บทความอันดับ ${p.rank} · ถูกอ้างอิง ${p.citations} ครั้ง${p.year ? ` · ${p.year + 543}` : ""}</div>
            <div style="color:#475569;margin-top:2px">${title}</div>
          </div>`;
        },
      },
      annotations: {
        // เส้นตั้งที่ h = ขอบเขตบทความที่นับเข้า h-index (h บทความแรกถูกอ้างอิง ≥ h ครั้ง)
        xaxis:
          h > 0
            ? [{ x: h, borderColor: "#a16207", strokeDashArray: 4, label: { text: `h แรก`, style: { background: "#fef9c3", color: "#713f12" } } }]
            : [],
        points:
          h > 0
            ? [
                {
                  x: h,
                  y: h,
                  marker: { size: 7, fillColor: "#facc15", strokeColor: "#a16207", strokeWidth: 2 },
                  label: {
                    text: `h-index = ${h}`,
                    borderColor: "#a16207",
                    style: { background: "#fef9c3", color: "#713f12", fontWeight: 600 },
                  },
                },
              ]
            : [],
      },
    };

    const series = [
      { name: "Citations", type: "area", data: areaData },
      { name: "y = x", type: "line", data: diagData },
    ];

    return { options, series };
  }, [graph]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Author h-index</div>
          <div className="text-xl font-semibold text-slate-900">h-index รายอาจารย์ (Scopus)</div>
          <p className="max-w-2xl text-sm text-slate-600">
            ดู h-index ของอาจารย์แต่ละคนจากผลงานใน Scopus เลือกอาจารย์และช่วงปีได้ตามต้องการ
            ตัวเลขนับจากข้อมูลที่นำเข้าระบบ อาจน้อยกว่าใน scopus.com หากยังไม่ได้อัปเดตจำนวนการอ้างอิงล่าสุด
          </p>
        </div>
        <button
          type="button"
          onClick={exportAllCSV}
          disabled={exportingAll}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={14} />
          {exportingAll ? "กำลังส่งออก..." : "ส่งออก CSV (ทั้งหมด)"}
        </button>
      </div>

      {usersError && <p className="mt-3 text-sm text-rose-600">{usersError}</p>}

      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-slate-600">อาจารย์</span>
          <select
            value={selectedScopusId}
            onChange={(e) => setSelectedScopusId(e.target.value)}
            disabled={usersLoading || users.length === 0}
            className="min-w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm disabled:bg-slate-100"
          >
            {usersLoading && <option value="">กำลังโหลด...</option>}
            {!usersLoading && users.length === 0 && <option value="">— ไม่มีอาจารย์ที่มี Scopus ID —</option>}
            {users.map((u) => (
              <option key={u.user_id} value={u.scopus_id}>
                {u.name || `User ${u.user_id}`} ({u.scopus_id})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-slate-600">ตั้งแต่ปี (พ.ศ.)</span>
          <select
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">ทั้งหมด</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y + 543}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-slate-600">ถึงปี (พ.ศ.)</span>
          <select
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">ทั้งหมด</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y + 543}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => fetchGraph(selectedScopusId, yearFrom, yearTo)}
          disabled={loading || !selectedScopusId}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "กำลังโหลด..." : "อัปเดตกราฟ"}
        </button>

        <button
          type="button"
          onClick={exportPersonCSV}
          disabled={!graph || !(graph.points?.length > 0)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          title="ส่งออกรายการบทความของอาจารย์ที่เลือกเป็น CSV ตามช่วงปีที่แสดง"
        >
          <Download size={14} />
          ส่งออกบทความ (CSV)
        </button>

        <button
          type="button"
          onClick={exportPersonReport}
          disabled={!graph || !(graph.points?.length > 0)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          title="ส่งออกรายงานของอาจารย์ที่เลือก (กราฟ + ตารางบทความ) ตามช่วงปีที่แสดง"
        >
          <Download size={14} />
          ส่งออกรายงาน (พร้อมกราฟ)
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">h-index</div>
            <div className="mt-1 text-4xl font-bold text-slate-900">{graph ? formatNumber(graph.h_index) : "-"}</div>
            {selectedUser && <div className="mt-1 text-xs text-slate-500">{selectedUser.name}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
              <div className="text-xs text-slate-500">เอกสาร</div>
              <div className="text-lg font-semibold text-slate-900">{graph ? formatNumber(graph.document_count) : "-"}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
              <div className="text-xs text-slate-500">การอ้างอิงรวม</div>
              <div className="text-lg font-semibold text-slate-900">{graph ? formatNumber(graph.citation_total) : "-"}</div>
            </div>
          </div>
          {graph?.available_year_min != null && (
            <p className="text-[11px] text-slate-500">
              ช่วงปีที่มีข้อมูล (พ.ศ.): {graph.available_year_min + 543}–{graph.available_year_max + 543}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {chart && (
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={zoomOutStep} title="ซูมออก" className="rounded-md border border-slate-300 p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-50">
                <ZoomOut size={15} />
              </button>
              <button type="button" onClick={zoomInStep} title="ซูมเข้า" className="rounded-md border border-slate-300 p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-50">
                <ZoomIn size={15} />
              </button>
              <button type="button" onClick={zoomReset} title="ขนาดเต็ม" className="rounded-md border border-slate-300 p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-50">
                <Maximize2 size={15} />
              </button>
            </div>
          )}
          <div ref={chartWrapRef} className="min-h-[360px] rounded-xl border border-slate-200 p-2">
            {loading ? (
              <div className="flex h-[360px] items-center justify-center text-sm text-slate-500">กำลังโหลดกราฟ...</div>
            ) : chart ? (
              <ApexChart options={chart.options} series={chart.series} type="line" height={360} />
            ) : (
              <div className="flex h-[360px] items-center justify-center text-sm text-slate-500">
                {selectedScopusId ? "ไม่มีเอกสารสำหรับช่วงที่เลือก" : "เลือกอาจารย์เพื่อดูกราฟ"}
              </div>
            )}
          </div>
          {chart && graph?.h_index > 0 && (
            <p className="text-xs leading-relaxed text-slate-500">
              แต่ละจุดคือ 1 บทความ เรียงจากถูกอ้างอิงมากสุด (ซ้าย) ไปน้อยสุด (ขวา) — ชี้จุดเพื่อดูชื่อบทความ · ซูมด้วยปุ่มด้านบนหรือเลื่อนเมาส์ ·{" "}
              <span className="text-slate-700">h-index = {graph.h_index}</span> หมายถึงมี {graph.h_index} บทความที่ถูกอ้างอิงอย่างน้อยบทความละ {graph.h_index} ครั้ง (บทความทางซ้ายของเส้นประ)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
