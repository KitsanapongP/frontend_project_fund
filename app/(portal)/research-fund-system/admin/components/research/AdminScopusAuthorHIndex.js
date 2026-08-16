"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usersAPI, scopusConfigAPI } from "@/app/lib/api";
import { formatNumber } from "@/app/utils/format";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

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
        type: "line",
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
      <div className="flex flex-col gap-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Author h-index</div>
        <div className="text-xl font-semibold text-slate-900">h-index รายอาจารย์ (Scopus)</div>
        <p className="text-sm text-slate-600">
          ดู h-index ของอาจารย์แต่ละคนจากผลงานใน Scopus เลือกอาจารย์และช่วงปีได้ตามต้องการ
          ตัวเลขนับจากข้อมูลที่นำเข้าระบบ อาจน้อยกว่าใน scopus.com หากยังไม่ได้อัปเดตจำนวนการอ้างอิงล่าสุด
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
          {chart && graph?.h_index > 0 && (
            <p className="text-xs leading-relaxed text-slate-500">
              แต่ละจุดคือ 1 บทความ เรียงจากถูกอ้างอิงมากสุด (ซ้าย) ไปน้อยสุด (ขวา) — เอาเมาส์ชี้จุดเพื่อดูชื่อบทความ ·{" "}
              <span className="text-slate-700">h-index = {graph.h_index}</span> หมายถึงมี {graph.h_index} บทความที่ถูกอ้างอิงอย่างน้อยบทความละ {graph.h_index} ครั้ง (บทความทางซ้ายของเส้นประ)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
