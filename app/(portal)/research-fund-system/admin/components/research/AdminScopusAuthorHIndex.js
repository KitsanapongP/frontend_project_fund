"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usersAPI, scopusConfigAPI } from "@/app/lib/api";
import { formatNumber } from "@/app/utils/format";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const BE_OFFSET = 543;

// แปลงปี พ.ศ. (จาก filter ของ dashboard) -> ค.ศ. ที่ endpoint hgraph ใช้
function beToCe(be) {
  const n = Number(String(be || "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  // เผื่อกรณีที่ค่าเป็น ค.ศ. อยู่แล้ว (เช่น < 2100 แต่ > 1900)
  return n > 2400 ? n - BE_OFFSET : n;
}

// Hirsch h-graph รายอาจารย์ (เอกสารเรียงตาม citations vs เส้น y=x) จาก scopus_documents
export default function AdminScopusAuthorHIndex({ filterYearStartBE = "", filterYearEndBE = "" }) {
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedScopusId, setSelectedScopusId] = useState("");

  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  const [graph, setGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ปี ค.ศ. ที่มาจาก filter ด้านบนของ dashboard (ใช้เป็น default)
  const filterCeFrom = useMemo(() => beToCe(filterYearStartBE), [filterYearStartBE]);
  const filterCeTo = useMemo(() => beToCe(filterYearEndBE), [filterYearEndBE]);

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
          setSelectedScopusId(String(items[0].scopus_author_id || ""));
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
    () => users.find((u) => String(u.scopus_author_id) === String(selectedScopusId)) || null,
    [users, selectedScopusId]
  );

  async function fetchGraph(scopusId, yf, yt) {
    if (!scopusId) return;
    setLoading(true);
    setError("");
    try {
      const params = { scopus_id: scopusId };
      if (yf) params.year_from = yf;
      if (yt) params.year_to = yt;
      const res = await scopusConfigAPI.getAuthorHIndexGraph(params);
      setGraph(res?.data || null);
    } catch (e) {
      setError(e?.message || "ไม่สามารถโหลดกราฟ h-index ได้");
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }

  // เมื่อเปลี่ยนอาจารย์ หรือ filter ปีด้านบนเปลี่ยน -> ตั้ง default ปีตาม filter แล้วโหลดกราฟ
  useEffect(() => {
    if (!selectedScopusId) return;
    const yf = filterCeFrom != null ? String(filterCeFrom) : "";
    const yt = filterCeTo != null ? String(filterCeTo) : "";
    setYearFrom(yf);
    setYearTo(yt);
    fetchGraph(selectedScopusId, yf, yt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScopusId, filterCeFrom, filterCeTo]);

  // ช่วงปีสำหรับ dropdown: ใช้ available range จากกราฟ, ไม่งั้น fallback จาก filter/ปีปัจจุบัน (ให้ dropdown ไม่ว่างเสมอ)
  const yearOptions = useMemo(() => {
    let min = graph?.available_year_min;
    let max = graph?.available_year_max;
    // เผื่อ available_* ไม่มา -> ดึงจาก points
    if ((min == null || max == null) && Array.isArray(graph?.points)) {
      const years = graph.points.map((p) => p.year).filter((y) => y != null);
      if (years.length > 0) {
        min = Math.min(...years);
        max = Math.max(...years);
      }
    }
    const nowCe = new Date().getFullYear();
    if (min == null) min = filterCeFrom != null ? filterCeFrom : 2000;
    if (max == null) max = filterCeTo != null ? filterCeTo : nowCe;
    // ให้ครอบคลุมค่าที่เลือกไว้ด้วย
    const selFrom = Number(yearFrom);
    const selTo = Number(yearTo);
    if (Number.isFinite(selFrom) && selFrom > 0) min = Math.min(min, selFrom);
    if (Number.isFinite(selTo) && selTo > 0) max = Math.max(max, selTo);
    if (min > max) [min, max] = [max, min];
    const out = [];
    for (let y = max; y >= min; y -= 1) out.push(y);
    return out;
  }, [graph, yearFrom, yearTo, filterCeFrom, filterCeTo]);

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

    const options = {
      chart: { type: "line", toolbar: { show: false }, fontFamily: "inherit", animations: { enabled: false } },
      colors: ["#38bdf8", "#7c3aed"],
      stroke: { curve: "straight", width: [2, 2] },
      fill: { type: ["gradient", "solid"], opacity: [0.25, 1] },
      markers: { size: 0 },
      xaxis: {
        type: "numeric",
        min: 0,
        max: axisMax,
        tickAmount: Math.min(axisMax, 12),
        title: { text: "จำนวนเอกสาร (Documents)" },
        labels: { formatter: (v) => `${Math.round(v)}` },
      },
      yaxis: {
        min: 0,
        title: { text: "การอ้างอิง (Citations)" },
        labels: { formatter: (v) => `${Math.round(v)}` },
      },
      legend: { show: false },
      tooltip: {
        shared: false,
        custom: ({ seriesIndex, dataPointIndex }) => {
          if (seriesIndex !== 0) return "";
          const p = points[dataPointIndex];
          if (!p) return "";
          const title = p.title ? p.title : "(ไม่มีชื่อเรื่อง)";
          return `<div style="padding:6px 8px;font-size:12px;max-width:260px">
            <div style="font-weight:600">#${p.rank} · ${p.citations} citations${p.year ? ` · ${p.year}` : ""}</div>
            <div style="color:#475569;margin-top:2px">${title}</div>
          </div>`;
        },
      },
      annotations: {
        points:
          graph.h_index > 0
            ? [
                {
                  x: graph.h_index,
                  y: graph.h_index,
                  marker: { size: 7, fillColor: "#facc15", strokeColor: "#a16207", strokeWidth: 2 },
                  label: {
                    text: `h = ${graph.h_index}`,
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
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Author h-index</div>
        <div className="text-xl font-semibold text-slate-900">กราฟ h-index รายอาจารย์ (Scopus)</div>
        <p className="text-sm text-slate-600">
          กราฟ Hirsch (เอกสารเรียงตามจำนวนการอ้างอิง) คำนวณจากเอกสาร Scopus ที่นำเข้าระบบแล้ว จุดที่เส้นตัดกับเส้นทแยง y=x คือค่า h-index
          · ค่าอาจต่ำกว่า scopus.com เล็กน้อยหากยังไม่ได้ refresh จำนวนการอ้างอิงล่าสุด · ช่วงปีเริ่มต้นตาม filter ด้านบน
        </p>
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
              <option key={u.user_id} value={u.scopus_author_id}>
                {u.name || `User ${u.user_id}`} ({u.scopus_author_id})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-slate-600">ตั้งแต่ปี (ค.ศ.)</span>
          <select
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">ทั้งหมด</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-slate-600">ถึงปี (ค.ศ.)</span>
          <select
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="">ทั้งหมด</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
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
              ช่วงปีที่มีข้อมูล: {graph.available_year_min}–{graph.available_year_max}
            </p>
          )}
        </div>

        <div className="min-h-[360px] rounded-xl border border-slate-200 p-2">
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
      </div>
    </div>
  );
}
