"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Download, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";
import memberAPI from "@/app/lib/member_api";
import { formatNumber } from "@/app/utils/format";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
const CHART_ID = "member-hindex-graph";

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

// Hirsch h-graph ของผู้ใช้ที่ล็อกอินอยู่ (self-only) — เอกสารเรียงตาม citations vs เส้น y=x จาก scopus_documents
export default function MemberScopusAuthorHIndex() {
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const [graph, setGraph] = useState(null);
  const [myYears, setMyYears] = useState([]); // ปี (ค.ศ.) ที่มีเอกสารจริงของผู้ใช้
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [noScopus, setNoScopus] = useState(false); // ผู้ใช้ยังไม่ผูก Scopus ID
  const [showHint, setShowHint] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  // ===== Zoom + Pan (ทำเองเพื่อคุม cap/ตำแหน่งการซูม + ให้ smooth) =====
  const chartWrapRef = useRef(null);
  const ZOOM_MIN_SPAN = 3; // ซูมเข้าได้ลึกสุด ~3 บทความ (cap เข้า)
  const axisMax = useMemo(() => {
    if (!graph || !Array.isArray(graph.points) || graph.points.length === 0) return 1;
    const n = graph.points.length;
    const maxCit = graph.points.reduce((m, p) => Math.max(m, p.citations || 0), 0);
    return Math.max(n, maxCit, 1);
  }, [graph]);
  const zoomRef = useRef({ min: 0, max: 1 });
  const rafRef = useRef(null); // batch xaxis redraws into one frame (จุดเยอะ -> ไม่กระตุก)
  const markersHiddenRef = useRef(false); // ซ่อนจุดชั่วคราวระหว่างซูม/ลากให้วาดไว แล้วโชว์คืนเมื่อหยุด
  const markerTimerRef = useRef(null);
  useEffect(() => {
    zoomRef.current = { min: 0, max: axisMax };
  }, [axisMax]);

  // เข้าถึง instance ApexCharts แบบ sync (ไว้ pan/wheel ให้ลื่น ไม่ต้อง await import)
  function getChart() {
    const list = (typeof window !== "undefined" && window.Apex && window.Apex._chartInstances) || [];
    const f = list.find((c) => c.id === CHART_ID);
    return f ? f.chart : null;
  }
  function getGridRect() {
    const el = chartWrapRef.current?.querySelector(".apexcharts-grid");
    return el ? el.getBoundingClientRect() : null;
  }
  // โชว์จุดคืนเมื่อหยุดขยับสักครู่ (debounce) — ระหว่างขยับซ่อนจุดไว้ให้วาดไว (วิธี B)
  function scheduleMarkerRestore() {
    if (markerTimerRef.current) clearTimeout(markerTimerRef.current);
    markerTimerRef.current = setTimeout(() => {
      markerTimerRef.current = null;
      markersHiddenRef.current = false;
      const chart = getChart();
      if (chart) chart.updateOptions({ markers: { size: [3, 0] } }, false, false, false);
    }, 160);
  }
  // เก็บช่วงล่าสุดไว้ แล้ววาดครั้งเดียวต่อเฟรม (coalesce) — ปุ่ม/ล้อ/ลาก ใช้ทางเดียวกันหมด
  // ระหว่างขยับซ่อน markers (วาดไว ไม่มี violation) แล้วค่อยโชว์จุดคืนตอนหยุด
  function commitRange(min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return; // กัน NaN เข้า ApexCharts
    zoomRef.current = { min, max };
    markersHiddenRef.current = true;
    scheduleMarkerRestore();
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const chart = getChart();
      if (chart)
        chart.updateOptions(
          { xaxis: { min: zoomRef.current.min, max: zoomRef.current.max }, markers: { size: markersHiddenRef.current ? 0 : [3, 0] } },
          false,
          false,
          false
        );
    });
  }
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (markerTimerRef.current) clearTimeout(markerTimerRef.current);
  }, []);
  // ปิด popover (คำอธิบาย/คำอธิบายกราฟ) เมื่อกด Escape หรือคลิกนอกพื้นที่
  useEffect(() => {
    if (!showDesc && !showHint) return;
    const closeAll = () => {
      setShowDesc(false);
      setShowHint(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    const onDown = (e) => {
      if (!e.target.closest?.("[data-hindex-popover]")) closeAll();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [showDesc, showHint]);
  function applyZoomRange(min, max) {
    min = Math.max(0, min);
    max = Math.min(axisMax, max);
    if (max - min < ZOOM_MIN_SPAN) {
      const c = (min + max) / 2;
      min = Math.max(0, c - ZOOM_MIN_SPAN / 2);
      max = Math.min(axisMax, c + ZOOM_MIN_SPAN / 2);
    }
    if (min >= max) return;
    commitRange(min, max);
  }
  // factor < 1 = ซูมเข้า, > 1 = ซูมออก; center = จุดแกน X ที่คงไว้ระหว่างซูม
  function zoomBy(factor, center) {
    const { min, max } = zoomRef.current;
    const span = max - min;
    let c = center == null ? (min + max) / 2 : center;
    c = Math.max(min, Math.min(max, c));
    const newSpan = Math.min(axisMax, span * factor);
    const nmin = c - (c - min) * (newSpan / span);
    applyZoomRange(nmin, nmin + newSpan);
  }
  // ปุ่มซูม: โฟกัสไปที่จุด H-index (ส่วนที่สนใจจริง) — ปรับแรงขึ้นให้ซูมเข้า/ออกไวกว่าเดิม
  const zoomInStep = () => zoomBy(0.45, graph?.h_index);
  const zoomOutStep = () => zoomBy(2.2, graph?.h_index);
  const zoomReset = () => applyZoomRange(0, axisMax);

  // wheel = ซูมเข้าหาเคอร์เซอร์ · กดค้างลาก = pan (เมาส์ + สัมผัส) เฉพาะตอนที่ซูมเข้าอยู่
  useEffect(() => {
    const el = chartWrapRef.current;
    if (!el || !graph) return;

    const centerFromClientX = (clientX) => {
      const gr = getGridRect();
      if (!gr || !gr.width) return null;
      const frac = Math.min(1, Math.max(0, (clientX - gr.left) / gr.width));
      const { min, max } = zoomRef.current;
      return min + frac * (max - min);
    };
    const clientXOf = (e) => (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    const clientYOf = (e) => (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY);

    const pan = { active: false };
    const onWheel = (e) => {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 1.33 : 0.75, centerFromClientX(e.clientX)); // ล้อเมาส์: ซูมแรงขึ้น
    };
    const onDown = (e) => {
      const { min, max } = zoomRef.current;
      if (max - min >= axisMax - 0.001) return; // ยังไม่ได้ซูม -> ไม่ต้อง pan (มือถือเลื่อนหน้าปกติ)
      const gr = getGridRect();
      if (!gr || !gr.width) return;
      pan.active = true;
      pan.isTouch = !!e.touches;
      pan.decided = !pan.isTouch;
      pan.startX = clientXOf(e);
      pan.startY = clientYOf(e);
      pan.startMin = min;
      pan.startMax = max;
      pan.dataPerPx = (max - min) / gr.width;
      el.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!pan.active) return;
      const cx = clientXOf(e);
      if (!pan.decided) {
        const dx = Math.abs(cx - pan.startX);
        const dy = Math.abs(clientYOf(e) - pan.startY);
        if (dx < 6 && dy < 6) return;
        if (dy > dx) { pan.active = false; return; } // ตั้งใจเลื่อนแนวตั้ง -> ปล่อยให้ scroll หน้า
        pan.decided = true;
      }
      if (e.cancelable) e.preventDefault();
      const shift = -(cx - pan.startX) * pan.dataPerPx;
      let nmin = pan.startMin + shift;
      let nmax = pan.startMax + shift;
      const span = nmax - nmin;
      if (nmin < 0) { nmin = 0; nmax = span; }
      if (nmax > axisMax) { nmax = axisMax; nmin = axisMax - span; }
      commitRange(nmin, nmax);
    };
    const onUp = () => {
      pan.active = false;
      el.style.cursor = "grab";
    };

    el.style.cursor = "grab";
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onDown);
    el.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, axisMax]);

  // Export CSV: รายการบทความของฉัน ตามช่วงปีที่แสดง
  function exportPersonCSV() {
    if (!graph || !Array.isArray(graph.points) || graph.points.length === 0) return;
    const h = graph.h_index;
    const sid = graph.scopus_author_id || "me";
    const header = ["ลำดับ", "ชื่อบทความ", "ปี (พ.ศ.)", "จำนวนการอ้างอิง", "อยู่ใน h-core", "EID"];
    const rows = graph.points.map((p) => [
      p.rank, p.title || "", p.year != null ? toBE(p.year) : "-", p.citations, p.rank <= h ? "ใช่" : "ไม่", p.eid || "",
    ]);
    downloadCSV(`scopus-hindex-${sid}-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  }

  // Export รายงานของฉัน: ไฟล์ HTML ฝังภาพกราฟ + ตารางบทความ (เปิดในเบราว์เซอร์/พิมพ์เป็น PDF ได้)
  async function exportPersonReport() {
    if (!graph || !Array.isArray(graph.points) || graph.points.length === 0) return;
    const h = graph.h_index;
    const sid = graph.scopus_author_id || "me";

    let imgTag = "";
    try {
      const ApexCharts = (await import("apexcharts")).default;
      // รีเซ็ตซูมให้กราฟเต็มก่อนแคปเป็นรูป กันภาพที่ผู้ใช้ซูมค้างไว้ออกไปในรายงาน
      try {
        zoomRef.current = { min: 0, max: axisMax };
        ApexCharts.exec(CHART_ID, "updateOptions", { xaxis: { min: 0, max: axisMax } }, false, false);
        await new Promise((r) => setTimeout(r, 80));
      } catch (_) {}
      const res = await ApexCharts.exec(CHART_ID, "dataURI", { scale: 2 });
      if (res?.imgURI) {
        imgTag = `<img src="${res.imgURI}" alt="กราฟ H-index" style="max-width:100%;border:1px solid #e2e8f0;border-radius:8px;margin-top:8px" />`;
      }
    } catch (e) {
      // ถ้าดึงภาพกราฟไม่ได้ ก็ยังออกรายงานพร้อมตารางได้
    }

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
<html lang="th"><head><meta charset="utf-8"><title>H-index (Scopus)</title>
<style>
  body{font-family:'Sarabun',Tahoma,-apple-system,'Segoe UI',sans-serif;color:#0f172a;margin:28px;max-width:960px}
  h1{font-size:20px;margin:0 0 4px}.muted{color:#64748b;font-size:14px}
  .stats{display:flex;gap:16px;margin:16px 0;flex-wrap:wrap}
  .stat{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 16px;min-width:110px}
  .stat b{font-size:24px;display:block}.stat span{color:#64748b;font-size:12px}
  table{border-collapse:collapse;width:100%;font-size:14px;margin-top:18px}
  th,td{border:1px solid #e2e8f0;padding:6px 9px;vertical-align:top}th{background:#f1f5f9;text-align:left}
  @media print{body{margin:0}}
</style></head><body>
  <h1>H-index (Scopus)</h1>
  <div class="muted">Scopus Author ID: ${htmlEscape(sid)} · ช่วงปี: ${yearLabel} · ออกรายงาน ${new Date().toLocaleDateString("th-TH")}</div>
  <div class="stats">
    <div class="stat"><span>H-index</span><b>${h}</b></div>
    <div class="stat"><span>เอกสาร</span><b>${graph.document_count}</b></div>
    <div class="stat"><span>การอ้างอิงรวม</span><b>${graph.citation_total}</b></div>
  </div>
  ${imgTag}
  <table>
    <thead><tr><th style="width:48px">ลำดับ</th><th>ชื่อบทความ</th><th style="width:74px">ปี (พ.ศ.)</th><th style="width:84px">การอ้างอิง</th><th style="width:60px">h-core</th><th style="width:150px">EID</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body></html>`;

    downloadFile(`scopus-hindex-${sid}-${new Date().toISOString().slice(0, 10)}.html`, html, "text/html;charset=utf-8");
  }

  async function fetchGraph(yf, yt) {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (yf) params.year_from = yf;
      if (yt) params.year_to = yt;
      const res = await memberAPI.getMyHIndexGraph(params);
      const data = res?.data || null;
      setGraph(data);
      setNoScopus(data == null); // backend คืน data:null เมื่อผู้ใช้ยังไม่ผูก Scopus ID
      // ตอนโหลดช่วงเต็ม (ไม่กรองปี) เก็บรายการปีที่มีเอกสารจริง + ตั้ง default เป็นช่วงเต็ม (H-index เป็นค่าสะสม)
      if (data && !yf && !yt) {
        let ys = Array.isArray(data.available_years) ? data.available_years.map(Number) : [];
        if (ys.length === 0 && Array.isArray(data.points)) {
          ys = [...new Set(data.points.map((p) => p.year).filter((y) => y != null).map(Number))];
        }
        ys.sort((a, b) => b - a);
        setMyYears(ys);
        if (data.available_year_min != null) setYearFrom(String(data.available_year_min));
        if (data.available_year_max != null) setYearTo(String(data.available_year_max));
      }
    } catch (e) {
      setError(e?.message || "ไม่สามารถโหลดกราฟ H-index ได้");
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }

  // เปลี่ยนปีแล้วโหลดทันที (instant filter ให้เหมือนตัวกรองอื่นในหน้า) + clamp กัน from > to แล้วได้กราฟว่างเงียบ ๆ
  function handleYearFrom(v) {
    let from = v;
    let to = yearTo;
    if (from && to && Number(from) > Number(to)) to = from;
    setYearFrom(from);
    setYearTo(to);
    fetchGraph(from, to);
  }
  function handleYearTo(v) {
    let from = yearFrom;
    let to = v;
    if (from && to && Number(to) < Number(from)) from = to;
    setYearFrom(from);
    setYearTo(to);
    fetchGraph(from, to);
  }

  // โหลดกราฟช่วงเต็มครั้งแรก (server resolve scopus_id จาก token)
  useEffect(() => {
    fetchGraph("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ตัวเลือกปี (ค.ศ.) = ปีที่มีเอกสารจริงจาก backend (available_years) + ปีที่เลือกไว้ (กันช่องว่าง)
  // แสดงผลเป็น พ.ศ. ในหน้าจอ แต่เก็บ/ส่งค่าเป็น ค.ศ. ให้ตรงกับ endpoint
  const yearOptions = useMemo(() => {
    const set = new Set(myYears.map(Number));
    const selFrom = Number(yearFrom);
    const selTo = Number(yearTo);
    if (Number.isFinite(selFrom) && selFrom > 0) set.add(selFrom);
    if (Number.isFinite(selTo) && selTo > 0) set.add(selTo);
    return Array.from(set).sort((a, b) => b - a);
  }, [myYears, yearFrom, yearTo]);

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
        id: CHART_ID,
        type: "line",
        // ปิด zoom/toolbar ในตัว ApexCharts แล้วใช้ปุ่ม + wheel handler ของเราเอง (ดู applyZoom/zoomBy)
        toolbar: { show: false },
        zoom: { enabled: false },
        selection: { enabled: false },
        fontFamily: "inherit",
        animations: { enabled: false },
      },
      // โทนน้ำเงินอ่อน (primary-ring) = เส้น citations, border สีเทาอ่อน = เส้นอ้างอิง y=x (ไกด์ ไม่ใช่ข้อมูล)
      colors: ["#3b82f6", "#cbd5e1"],
      stroke: { curve: "straight", width: [2, 1.5] },
      fill: { type: ["gradient", "solid"], opacity: [0.18, 1] },
      // จุดบนเส้น = น้ำเงินเข้ม (primary-deep) มีขอบขาว ให้ต่างจากเส้นและเด่นขึ้น
      markers: { size: [3, 0], colors: ["#1d4ed8"], strokeColors: "#ffffff", strokeWidth: 1.5, hover: { size: 6 } },
      xaxis: {
        type: "numeric",
        min: 0,
        max: axisMax,
        tickAmount: Math.min(axisMax, 12),
        title: { text: "ลำดับบทความ (เรียงตามการอ้างอิงมาก→น้อย)" },
        labels: { formatter: (v) => `${Math.round(v)}` },
        // ปิดเส้น crosshair/axis-tooltip: ตอน pan มันคำนวณตำแหน่งเป็น NaN แล้ว throw error (ไม่จำเป็น มี tooltip จุดพอ)
        crosshairs: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        title: { text: "จำนวนการอ้างอิง" },
        labels: { formatter: (v) => `${Math.round(v)}` },
      },
      legend: { show: false },
      tooltip: {
        // intersect:false = ชี้ใกล้ ๆ ก็ขึ้น (ไม่ต้องจ่อจุดเป๊ะ); enabledOnSeries:[0] = ให้ tooltip
        // ผูกกับเส้น citations เท่านั้น ไม่ให้เส้นทแยง y=x แย่ง (โดยเฉพาะจุดตรง H-index ที่เส้นตัดกัน)
        shared: false,
        intersect: false,
        enabledOnSeries: [0],
        custom: ({ seriesIndex, dataPointIndex }) => {
          if (seriesIndex !== 0) return "";
          const p = points[dataPointIndex];
          if (!p) return "";
          const title = htmlEscape(p.title ? p.title : "(ไม่มีชื่อเรื่อง)");
          return `<div style="padding:6px 8px;font-size:12px;max-width:300px;white-space:normal">
            <div style="font-weight:600">บทความอันดับ ${p.rank} · ถูกอ้างอิง ${p.citations} ครั้ง${p.year ? ` · ${p.year + 543}` : ""}</div>
            <div style="color:#475569;margin-top:2px;white-space:normal;word-break:break-word;line-height:1.35">${title}</div>
          </div>`;
        },
      },
      annotations: {
        // เส้นตั้งที่ h = ขอบเขตบทความที่นับเข้า H-index (h บทความแรกถูกอ้างอิง ≥ h ครั้ง)
        xaxis:
          h > 0
            ? [{ x: h, borderColor: "#d97706", strokeDashArray: 4, label: { text: `h แรก`, style: { background: "#fef9c3", color: "#854d0e" } } }]
            : [],
        points:
          h > 0
            ? [
                {
                  x: h,
                  y: h,
                  marker: { size: 7, fillColor: "#d97706", strokeColor: "#854d0e", strokeWidth: 2 },
                  label: {
                    text: `H-index = ${h}`,
                    borderColor: "#d97706",
                    style: { background: "#fef9c3", color: "#854d0e", fontWeight: 600 },
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
          <div className="flex items-center gap-1.5">
            <h3 className="text-xl font-semibold text-slate-900">H-index (Scopus)</h3>
            <div className="relative" data-hindex-popover>
              <button
                type="button"
                onClick={() => setShowDesc((v) => !v)}
                aria-label="รายละเอียด H-index"
                aria-expanded={showDesc}
                aria-describedby={showDesc ? "member-hindex-desc" : undefined}
                title="รายละเอียด"
                className={`flex h-5 w-5 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  showDesc ? "border-slate-400 bg-slate-100 text-slate-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Info size={12} />
              </button>
              {showDesc && (
                <div id="member-hindex-desc" role="note" className="absolute left-0 top-7 z-20 w-80 rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-600 shadow-lg">
                  H-index ของคุณคำนวณจากผลงานใน Scopus ที่นำเข้าระบบ เลือกช่วงปีได้ตามต้องการ
                  ตัวเลขอาจน้อยกว่าใน scopus.com หากยังไม่ได้อัปเดตจำนวนการอ้างอิงล่าสุด
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        {/* กลุ่มช่วงปี — เปลี่ยนแล้วอัปเดตกราฟทันที */}
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-slate-600">ตั้งแต่ปี (พ.ศ.)</span>
            <select
              value={yearFrom}
              onChange={(e) => handleYearFrom(e.target.value)}
              disabled={noScopus}
              className="min-w-[6rem] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-slate-100"
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
              onChange={(e) => handleYearTo(e.target.value)}
              disabled={noScopus}
              className="min-w-[6rem] rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">ทั้งหมด</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y + 543}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* กลุ่มส่งออก */}
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={exportPersonCSV}
            disabled={!graph || !(graph.points?.length > 0)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            title="ส่งออกรายการบทความเป็น CSV ตามช่วงปีที่แสดง"
          >
            <Download size={14} />
            ส่งออกบทความ (CSV)
          </button>

          <button
            type="button"
            onClick={exportPersonReport}
            disabled={!graph || !(graph.points?.length > 0)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            title="ส่งออกรายงาน (กราฟ + ตารางบทความ) ตามช่วงปีที่แสดง"
          >
            <Download size={14} />
            ส่งออกรายงาน (พร้อมกราฟ)
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">H-index</div>
            <div className="mt-1 text-4xl font-bold text-slate-900">{graph ? formatNumber(graph.h_index) : "-"}</div>
            <div className="mt-1 text-xs text-slate-500">ตามช่วงปีที่เลือก</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
              <div className="text-xs text-slate-500">เอกสาร<br />(ช่วงที่เลือก)</div>
              <div className="text-lg font-semibold text-slate-900">{graph ? formatNumber(graph.document_count) : "-"}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
              <div className="text-xs text-slate-500">การอ้างอิง<br />(ช่วงที่เลือก)</div>
              <div className="text-lg font-semibold text-slate-900">{graph ? formatNumber(graph.citation_total) : "-"}</div>
            </div>
          </div>
          {graph?.available_year_min != null && (
            <p className="text-xs text-slate-500">
              ช่วงปีที่มีข้อมูล (พ.ศ.): {graph.available_year_min + 543}–{graph.available_year_max + 543}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {chart && (
            <div className="flex items-start justify-between gap-2">
              {/* ซ้ายบน: ปุ่มซูม + รีเซ็ต (เด่น มีข้อความ) */}
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={zoomOutStep} aria-label="ซูมออก" title="ซูมออก" className="rounded-md border border-slate-300 p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <ZoomOut size={15} />
                </button>
                <button type="button" onClick={zoomInStep} aria-label="ซูมเข้า" title="ซูมเข้า" className="rounded-md border border-slate-300 p-1.5 text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <ZoomIn size={15} />
                </button>
                <button
                  type="button"
                  onClick={zoomReset}
                  title="กลับมาที่มุมมองเต็ม"
                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Maximize2 size={14} />
                  รีเซ็ตมุมมอง
                </button>
              </div>
              {/* ขวาบน: ไอคอนอธิบายกราฟ */}
              <div className="relative" data-hindex-popover>
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  aria-label="คำอธิบายกราฟ"
                  aria-expanded={showHint}
                  aria-describedby={showHint ? "member-hindex-hint" : undefined}
                  title="คำอธิบายกราฟ"
                  className={`flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    showHint ? "border-slate-400 bg-slate-100 text-slate-700" : "border-slate-300 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Info size={15} />
                </button>
                {showHint && (
                  <div id="member-hindex-hint" role="note" className="absolute right-0 top-9 z-20 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-lg">
                    แต่ละจุดคือ 1 บทความ เรียงจากถูกอ้างอิงมากสุด (ซ้าย) ไปน้อยสุด (ขวา) — ชี้จุดเพื่อดูชื่อบทความ · ซูมด้วยปุ่ม/เลื่อนเมาส์ (โฟกัสที่ H-index) · เมื่อซูมแล้วกดค้างลากเพื่อเลื่อนดูช่วงอื่นได้
                    {graph?.h_index > 0 && (
                      <span className="mt-1.5 block text-slate-700">
                        H-index = {graph.h_index} หมายถึงมี {graph.h_index} บทความที่ถูกอ้างอิงอย่างน้อยบทความละ {graph.h_index} ครั้ง (บทความทางซ้ายของเส้นประ)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={chartWrapRef} className="hidx-chart min-h-[360px] rounded-xl border border-slate-200 p-2">
            {loading ? (
              <div className="flex h-[360px] items-center justify-center text-sm text-slate-500">กำลังโหลดกราฟ...</div>
            ) : chart ? (
              <ApexChart options={chart.options} series={chart.series} type="line" height={360} />
            ) : (
              <div className="flex h-[360px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-slate-500">
                {noScopus ? (
                  <>
                    <p className="font-medium text-slate-700">บัญชีของคุณยังไม่ได้เชื่อมกับ Scopus ID</p>
                    <p className="max-w-md">
                      ระบบจึงยังแสดง H-index ให้ไม่ได้ — โปรดติดต่อผู้ดูแลระบบหรือเจ้าหน้าที่กองทุนวิจัย
                      เพื่อเชื่อม Scopus Author ID เข้ากับบัญชีของคุณ
                    </p>
                  </>
                ) : (
                  "ไม่มีเอกสารสำหรับช่วงที่เลือก"
                )}
              </div>
            )}
          </div>
          {/* ตารางข้อมูลสำหรับ screen reader — กราฟ SVG อ่านไม่ได้ (ครอบ div sr-only เพราะ table ไม่เคารพ height:1px) */}
          {chart && graph && Array.isArray(graph.points) && (
            <div className="sr-only">
            <table>
              <caption>ตาราง H-index (Scopus) — บทความเรียงตามจำนวนการอ้างอิงจากมากไปน้อย</caption>
              <thead>
                <tr>
                  <th>อันดับ</th>
                  <th>ชื่อบทความ</th>
                  <th>ปี (พ.ศ.)</th>
                  <th>จำนวนการอ้างอิง</th>
                  <th>อยู่ใน h-core</th>
                </tr>
              </thead>
              <tbody>
                {graph.points.map((p) => (
                  <tr key={p.eid || p.rank}>
                    <td>{p.rank}</td>
                    <td>{p.title || "-"}</td>
                    <td>{p.year != null ? p.year + 543 : "-"}</td>
                    <td>{p.citations}</td>
                    <td>{p.rank <= graph.h_index ? "ใช่" : "ไม่"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
