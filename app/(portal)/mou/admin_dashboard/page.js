"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  BarChart3, Activity, TrendingUp, Calendar,
  Clock, FileText, AlertTriangle, Key, Bookmark, ExternalLink, ArrowRight
} from "lucide-react";
import { mouAPI } from "../../../lib/mou_api";
import MouLayout from "../components/MouLayout";

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
};

const fmtDateTime = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const daysUntil = (d) => {
  if (!d) return null;
  const n = new Date(); n.setHours(0, 0, 0, 0);
  const t = new Date(d); t.setHours(0, 0, 0, 0);
  return Math.ceil((t - n) / (1000 * 60 * 60 * 24));
};

const statusStyle = (name) => {
  if (!name) return "bg-gray-100 text-gray-600";
  if (name.includes("ใกล้หมดอายุ") || name.includes("ใกล้หมด") || name.includes("ใกล้")) return "bg-amber-100 text-amber-600";
  if (name.includes("หมดอายุ")) return "bg-red-100 text-red-600";
  if (name.includes("มีผล")) return "bg-green-100 text-green-600";
  if (name.includes("รอดำเนินการ")) return "bg-blue-100 text-blue-600";
  if (name.includes("ยกเลิก")) return "bg-gray-100 text-gray-500";
  if (name.includes("ร่าง")) return "bg-purple-100 text-purple-600";
  if (name.includes("ต่ออายุ")) return "bg-teal-100 text-teal-600";
  return "bg-gray-100 text-gray-600";
};

const activityDateColor = (sentAt) => {
  if (!sentAt) return "bg-gray-100";
  const days = daysUntil(sentAt);
  if (days === 0) return "bg-blue-500";
  if (days === -1) return "bg-amber-500";
  return "bg-gray-300";
};

const statusBadge = (name) => {
  const v = (name || "").toLowerCase();
  if (v.includes("มีผล") || v.includes("active")) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300";
  if (v.includes("ใกล้")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-300";
  if (v.includes("หมดอายุ")) return "bg-red-50 text-red-700 ring-1 ring-red-300";
  if (v.includes("รอดำเนินการ")) return "bg-blue-50 text-blue-700 ring-1 ring-blue-300";
  if (v.includes("ร่าง")) return "bg-purple-50 text-purple-700 ring-1 ring-purple-300";
  return "bg-gray-50 text-gray-600 ring-1 ring-gray-300";
};

const renderActivityMessage = (msg) => {
  if (!msg) return null;
  const match = msg.match(/^(เปลี่ยนสถานะจาก)\s*(.+?)\s*(เป็น)\s*(.+)$/);
  if (match) {
    return (
      <>
        <span className="text-gray-700">เปลี่ยนสถานะจาก</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mx-1 ${statusBadge(match[2])}`}>{match[2]}</span>
        <ArrowRight size={14} className="text-gray-400 mx-1 inline" />
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(match[4])}`}>{match[4]}</span>
      </>
    );
  }
  return <span className="text-gray-800">{msg}</span>;
};

export default function AdminDashboardPage() {
  const [yearlyData, setYearlyData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [renewMous, setRenewMous] = useState([]);
  const [nearExpiryMous, setNearExpiryMous] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearMous, setYearMous] = useState([]);
  const [yearMousLoading, setYearMousLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mouAPI.getDashboard();
      if (res?.success && res?.data) {
        setYearlyData(res.yearlyData || []);
        setRecentActivities(res.recentActivities || []);
        setRenewMous(res.renewMous || []);
        setNearExpiryMous(res.nearExpiryMous || []);
      }
    } catch {
      Swal.fire({ icon: "error", title: "ไม่สามารถโหลดข้อมูล Dashboard" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (yearlyData.length > 0 && !selectedYear) {
      const cy = new Date().getFullYear();
      const match = yearlyData.find((d) => d.year === cy);
      setSelectedYear(match ? cy : yearlyData[0]?.year);
    }
  }, [yearlyData, selectedYear]);

  useEffect(() => {
    if (selectedYear === null) return;
    setYearMousLoading(true);
    setYearMous([]);
    const buddhistYear = selectedYear + 543;
    mouAPI.getActiveByYear(buddhistYear)
      .then((res) => { if (res?.success) setYearMous(res.data || []); })
      .catch(() => {})
      .finally(() => setYearMousLoading(false));
  }, [selectedYear]);

  const maxCount = useMemo(() => Math.max(...yearlyData.map((d) => d.count), 1), [yearlyData]);

  const filteredYearlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 3;
    const maxEndYear = Math.max(...yearlyData.map((d) => d.year), currentYear);
    return yearlyData.filter((d) => d.year >= minYear && d.year <= maxEndYear);
  }, [yearlyData]);

  const openRenewModal = (mou) => {
    const def = new Date();
    def.setFullYear(def.getFullYear() + 1);
    const yyyy = def.getFullYear();
    const mm = String(def.getMonth() + 1).padStart(2, "0");
    const dd = String(def.getDate()).padStart(2, "0");
    setRenewDate(`${yyyy}-${mm}-${dd}`);
    setRenewTarget(mou);
    setShowRenewModal(true);
  };

  const closeRenewModal = () => {
    setShowRenewModal(false);
    setRenewTarget(null);
    setRenewDate("");
  };

  const handleRenewConfirm = async () => {
    if (!renewTarget || !renewDate) return;
    const parts = renewDate.split("-");
    const buddhistDate = `${parts[2]}/${parts[1]}/${parseInt(parts[0]) + 543}`;
    try {
      const res = await apiClient.put(`/mou/${renewTarget.id}/renew`, { new_end_date: buddhistDate });
      if (res?.success) {
        Swal.fire({ icon: "success", title: "ต่ออายุสำเร็จ", timer: 1500, showConfirmButton: false });
        closeRenewModal();
        loadData();
      } else {
        Swal.fire({ icon: "error", title: "ต่ออายุไม่สำเร็จ", text: res?.error || "" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  return (
    <MouLayout subtitle="Dashboard">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
            <TrendingUp size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">ภาพรวม MOU ทั้งหมด</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 rounded-full border-[3px] border-blue-200 border-t-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-w-6xl">
          {/* Chart */}
          <div className="panel" style={{ padding: "28px 28px 32px" }}>
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <BarChart3 size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">จำนวน MOU ที่มีผลบังคับใช้รายปี</h3>
                  <p className="text-xs text-gray-400 mt-0.5">กดแท่งกราฟเพื่อดูรายละเอียด</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-xs text-gray-500">ปีที่เลือก</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-400" />
                  <span className="text-xs text-gray-500">ปีปัจจุบัน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-blue-200" />
                  <span className="text-xs text-gray-500">ปีอื่นๆ</span>
                </div>
              </div>
            </div>

            {filteredYearlyData.length > 0 ? (
              <>
                <div className="flex items-end justify-around gap-2 h-52 px-3 border-b border-gray-100">
                  {filteredYearlyData.map((d, i) => {
                    const isSelected = selectedYear === d.year;
                    const isCurrent = d.year === new Date().getFullYear();
                    const maxBarPx = 180;
                    const barPx = Math.max(Math.round((d.count / maxCount) * maxBarPx), 4);
                    return (
                      <button
                        key={d.year}
                        onClick={() => setSelectedYear(d.year)}
                        className="flex flex-col items-center group flex-1 min-w-0 cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <span className={`text-xs font-semibold mb-1.5 transition-colors duration-200 ${isSelected ? "text-emerald-600" : "text-gray-400"}`}>
                          {d.count}
                        </span>
                        <div
                          className={`w-full max-w-[52px] rounded-md transition-all duration-300 ${
                            isSelected
                              ? "bg-emerald-500 shadow-sm shadow-emerald-200"
                              : isCurrent
                                ? "bg-blue-400 group-hover:bg-blue-500"
                                : "bg-blue-200 group-hover:bg-blue-300"
                          }`}
                          style={{ height: barPx, animationDelay: `${i * 40}ms` }}
                        />
                        <span className={`text-xs font-medium mt-2 transition-colors duration-200 ${isSelected ? "text-emerald-600 font-semibold" : "text-gray-400"}`}>
                          {d.year + 543}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedYear && (
                  <div className="mt-6 pt-5 border-t border-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar size={15} className="text-emerald-500" />
                      <h4 className="text-sm font-semibold text-gray-700">MOU ปี {selectedYear + 543}</h4>
                      <span className="text-xs text-gray-400 ml-auto">{yearMous.length} รายการ</span>
                    </div>

                    {yearMousLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 rounded-full border-[3px] border-emerald-200 border-t-emerald-500 animate-spin" />
                      </div>
                    ) : yearMous.length > 0 ? (
                      <div style={{ background: "#f9fafb", borderRadius: 8, overflow: "hidden" }}>
                        <div className="colHeaders" style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 110px 120px", gap: 4, padding: "8px 16px", background: "#f9fafb", borderBottom: "1px solid var(--mou-line)", fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Key size={11} />รหัส MOU</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FileText size={11} />ชื่อ MOU / หน่วยงาน</span>
                          <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันเริ่มต้น</span>
                          <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันสิ้นสุด</span>
                          <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Bookmark size={11} />สถานะปัจจุบัน</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 4px" }}>
                          {yearMous.map((m, idx) => (
                            <div
                              key={m.id}
                              onClick={() => window.location.href = `/mou/show_detail_mou/${m.id}`}
                              className="mouRow"
                              style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 110px 120px", gap: 4, alignItems: "center", padding: "10px 12px", border: "1px solid var(--mou-line)", borderRadius: 8, background: "var(--mou-surface)", cursor: "pointer", transition: "box-shadow 0.15s ease, background 0.15s ease" }}
                              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.background = "var(--mou-primary-soft)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "var(--mou-surface)"; }}
                            >
                              <span style={{ fontSize: 13, color: "#374151" }}>{m.mou_code || "-"}</span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                                <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.partners?.[0]?.partner_org || "-"}</div>
                              </div>
                              <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{fmtDate(m.start_date)}</span>
                              <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{m.end_date ? fmtDate(m.end_date) : "-"}</span>
                              <span style={{ textAlign: "center" }}>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle(m.status?.name)}`}>{m.status?.name || "-"}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-10 text-gray-300">
                        <FileText size={32} className="mb-2 opacity-40" />
                        <span className="text-sm">ไม่มี MOU ในปีนี้</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-12 text-gray-300">
                <BarChart3 size={36} className="mb-2 opacity-40" />
                <span className="text-sm">ยังไม่มีข้อมูล MOU</span>
              </div>
            )}
          </div>

          {/* Near expiry card */}
          {nearExpiryMous.length > 0 && (
            <div className="panel" style={{ padding: "28px 28px 32px" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock size={18} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">MOU ใกล้หมดอายุ</h3>
                  <p className="text-xs text-gray-400 mt-0.5">MOU ที่กำลังจะหมดอายุ ควรเตรียมต่ออายุ</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">{nearExpiryMous.length} รายการ</span>
              </div>
              <div style={{ background: "#fffbeb", borderRadius: 8, overflow: "hidden" }}>
                <div className="colHeaders" style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 110px 120px 100px", gap: 4, padding: "8px 16px", background: "#fffbeb", borderBottom: "1px solid #fde68a", fontSize: 11, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Key size={11} />รหัส MOU</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FileText size={11} />ชื่อ MOU / หน่วยงาน</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันเริ่มต้น</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันสิ้นสุด</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Bookmark size={11} />สถานะปัจจุบัน</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Clock size={11} />เหลือ</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 4px" }}>
                  {nearExpiryMous.map((m) => {
                    const d = daysUntil(m.end_date);
                    return (
                      <div
                        key={m.id}
                        onClick={() => window.location.href = `/mou/show_detail_mou/${m.id}`}
                        className="mouRow"
                        style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 110px 120px 100px", gap: 4, alignItems: "center", padding: "10px 12px", border: "1px solid #fde68a", borderRadius: 8, background: "#fff", cursor: "pointer", transition: "box-shadow 0.15s ease, background 0.15s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.background = "#fffbeb"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#fff"; }}
                      >
                        <span style={{ fontSize: 13, color: "#374151" }}>{m.mou_code || "-"}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.partners?.[0]?.partner_org || "-"}</div>
                        </div>
                        <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{fmtDate(m.start_date)}</span>
                        <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{m.end_date ? fmtDate(m.end_date) : "-"}</span>
                        <span style={{ textAlign: "center" }}>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle(m.status?.name)}`}>{m.status?.name || "-"}</span>
                        </span>
                        <span style={{ textAlign: "center", fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                          {d !== null ? `เหลืออีก ${d} วัน` : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Expired card */}
          {renewMous.length > 0 && (
            <div className="panel" style={{ padding: "28px 28px 32px" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">MOU ที่หมดอายุแล้ว</h3>
                  <p className="text-xs text-gray-400 mt-0.5">MOU ที่หมดอายุแล้ว</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">{renewMous.length} รายการ</span>
              </div>
              <div style={{ background: "#fef2f2", borderRadius: 8, overflow: "hidden" }}>
                <div className="colHeaders" style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 110px 120px", gap: 4, padding: "8px 16px", background: "#fef2f2", borderBottom: "1px solid #fecaca", fontSize: 11, fontWeight: 600, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Key size={11} />รหัส MOU</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><FileText size={11} />ชื่อ MOU / หน่วยงาน</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันเริ่มต้น</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันสิ้นสุด</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Bookmark size={11} />สถานะปัจจุบัน</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 4px" }}>
                  {renewMous.map((m) => {
                    return (
                      <div
                        key={m.id}
                        onClick={() => window.location.href = `/mou/show_detail_mou/${m.id}`}
                        className="mouRow"
                        style={{ display: "grid", gridTemplateColumns: "140px 1fr 110px 110px 120px", gap: 4, alignItems: "center", padding: "10px 12px", border: "1px solid #fecaca", borderRadius: 8, background: "#fff", cursor: "pointer", transition: "box-shadow 0.15s ease, background 0.15s ease" }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "#fff"; }}
                      >
                        <span style={{ fontSize: 13, color: "#374151" }}>{m.mou_code || "-"}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.partners?.[0]?.partner_org || "-"}</div>
                        </div>
                        <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{fmtDate(m.start_date)}</span>
                        <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>{m.end_date ? fmtDate(m.end_date) : "-"}</span>
                        <span style={{ textAlign: "center" }}>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle(m.status?.name)}`}>{m.status?.name || "-"}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent activities */}
          <div className="panel" style={{ padding: "28px 28px 32px" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Activity size={18} className="text-gray-500" />
                </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">กิจกรรมล่าสุด</h3>
                <p className="text-xs text-gray-400 mt-0.5">การเปลี่ยนแปลงล่าสุดของ MOU</p>
              </div>
              <span className="ml-auto text-xs text-gray-400">{recentActivities.length} รายการ</span>
            </div>
            {recentActivities.length > 0 ? (
              <div>
                <div className="space-y-1">
                  {recentActivities.map((ev) => {
                    const actorName = ev.actor
                      ? [ev.actor.prefix, ev.actor.user_fname, ev.actor.user_lname].filter(Boolean).join(" ")
                      : "";
                    const dotColor = activityDateColor(ev.sent_at);
                    return (
                      <div key={ev.id} className="py-2.5">
                        <div className="min-w-0 flex-1 bg-white rounded-lg border border-blue-100 px-0 py-0 shadow-sm overflow-hidden">
                          <div className="px-4 py-2.5 bg-blue-50 flex items-center justify-between">
                            <div className="text-sm leading-snug">
                              {renderActivityMessage(ev.message || ev.action || "ดำเนินการ")}
                            </div>
                            {ev.mou_id && (
                              <button
                                onClick={() => window.location.href = `/mou/show_detail_mou/${ev.mou_id}`}
                                className="shrink-0 w-7 h-7 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-blue-500 hover:text-blue-700 transition ml-2 border border-blue-200"
                                title="ดูรายละเอียด MOU"
                              >
                                <ExternalLink size={13} />
                              </button>
                            )}
                          </div>
                          <div className="px-4 py-3">
                            {ev.mou?.title && (
                              <div className="text-sm font-medium text-gray-800">{ev.mou.title}</div>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                              {actorName && <span className="font-medium text-gray-500">{actorName}</span>}
                              {actorName && ev.sent_at && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                              {ev.sent_at && <span>{fmtDateTime(ev.sent_at)}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-gray-300">
                <Activity size={32} className="mb-2 opacity-40" />
                <span className="text-sm">ยังไม่มีกิจกรรมล่าสุด</span>
                <span className="text-xs mt-1 opacity-60">เมื่อมีการสร้างหรือแก้ไข MOU จะแสดงที่นี่</span>
              </div>
            )}
          </div>
        </div>
      )}

    </MouLayout>
  );
}
