"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import {
  Bookmark, RefreshCw, Calendar, Key, FileText,
  AlertCircle, RotateCcw
} from "lucide-react";
import { mouAPI } from "../../../lib/mou_api";
import apiClient from "../../../lib/api";
import MouLayout from "../components/MouLayout";

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("th-TH");
};

const statusClass = (name) => {
  const v = (name || "").toLowerCase();
  if (v.includes("มีผล") || v.includes("มีผลบังคับ")) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300";
  if (v.includes("ใกล้")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-300";
  if (v.includes("หมด")) return "bg-red-50 text-red-700 ring-1 ring-red-300";
  if (v.includes("รอดำเนินการ")) return "bg-blue-50 text-blue-700 ring-1 ring-blue-300";
  if (v.includes("ยกเลิก")) return "bg-gray-100 text-gray-500 ring-1 ring-gray-300";
  if (v.includes("ต่ออายุ")) return "bg-purple-50 text-purple-700 ring-1 ring-purple-300";
  return "bg-gray-50 text-gray-600 ring-1 ring-gray-300";
};

const tabs = [
  { key: "active", label: "มีผลบังคับใช้", icon: Bookmark, countKey: "active" },
  { key: "expired", label: "จะหมดอายุ", icon: AlertCircle, countKey: "expired" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState("active");
  const [activeMous, setActiveMous] = useState([]);
  const [expiredMous, setExpiredMous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(String(new Date().getFullYear() + 543));

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear() + 543;
    const years = [];
    for (let y = cy; y >= cy - 5; y--) years.push(String(y));
    return years;
  }, []);

  const loadData = useCallback(async (selectedYear) => {
    setLoading(true);
    try {
      const res = await mouAPI.getDashboard(selectedYear || undefined);
      if (res?.success && res?.data) {
        setStats(res.data);
        setActiveMous(res.activeMous || []);
        setExpiredMous(res.expiredMous || []);
      }
    } catch {
      Swal.fire({ icon: "error", title: "ไม่สามารถโหลดข้อมูล Dashboard" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(year); }, [loadData, year]);

  const handleRenew = async (mou) => {
    const now = new Date();
    const defaultEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const dd = String(defaultEnd.getDate()).padStart(2, "0");
    const mm = String(defaultEnd.getMonth() + 1).padStart(2, "0");
    const yyyy = defaultEnd.getFullYear() + 543;
    const defaultEndStr = `${dd}/${mm}/${yyyy}`;

    const { value: formValues } = await Swal.fire({
      title: "ต่ออายุ MOU",
      html: `
        <div style="text-align:left;font-size:14px;margin-bottom:12px">
          <p><strong>${mou.mou_code}</strong> — ${mou.title}</p>
          <p style="color:var(--mou-muted);margin-top:4px">กำหนดวันสิ้นสุดใหม่:</p>
        </div>
        <input id="swal-renew-end" class="swal2-input" value="${defaultEndStr}" placeholder="วันสิ้นสุดใหม่ (DD/MM/YYYY)">
        <div style="font-size:12px;color:var(--mou-muted-soft);text-align:left">รูปแบบ: DD/MM/YYYY (เช่น 31/12/2570)</div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "ต่ออายุ",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
      preConfirm: () => {
        const endDate = document.getElementById("swal-renew-end").value;
        if (!endDate) {
          Swal.showValidationMessage("กรุณากรอกวันสิ้นสุด");
          return false;
        }
        const parts = endDate.split("/");
        if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
          Swal.showValidationMessage("รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น DD/MM/YYYY)");
          return false;
        }
        return { new_end_date: endDate };
      },
    });

    if (!formValues) return;

    try {
      const res = await apiClient.put(`/mou/${mou.id}/renew`, formValues);
      if (res?.success) {
        await Swal.fire({ icon: "success", title: "ต่ออายุ MOU สำเร็จ", timer: 1500, showConfirmButton: false });
        loadData(year);
      } else {
        Swal.fire({ icon: "error", title: "ไม่สามารถต่ออายุ MOU ได้", text: res?.error || "" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const handleRowClick = (id, e) => {
    if (e.target.closest("a, button, select, input, textarea")) return;
    window.location.href = `/mou/show_detail_mou/${id}`;
  };

  const currentList = activeTab === "active" ? activeMous : expiredMous;

  return (
    <MouLayout subtitle="รายงาน Dashboard">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out both; }
        .ySel { padding: 6px 30px 6px 12px; border: 1px solid var(--mou-line); border-radius: 8px; font-size: 14px; outline: none; background: var(--mou-surface); cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; color: var(--mou-text); }
        .ySel:focus { border-color: var(--mou-primary); box-shadow: 0 0 0 3px var(--mou-primary-soft); }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-fadeInUp">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl" style={{ background: "var(--mou-primary-soft)", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-center h-full">
              <Bookmark size={22} style={{ color: "var(--mou-primary)" }} />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ margin: 0, color: "var(--mou-text)" }}>Dashboard MOU</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--mou-muted)" }}>ภาพรวมข้อมูล MOU ทั้งหมด</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select className="ySel" value={year} onChange={(e) => setYear(e.target.value)} style={{ fontSize: 14 }}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>ปี พ.ศ. {y}</option>
            ))}
          </select>
          <button onClick={() => loadData(year)} className="btn inline-flex items-center gap-1.5" style={{ fontSize: 13 }}>
            <RefreshCw size={15} /> รีเฟรช
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px]" style={{ borderColor: "var(--mou-primary-soft)", borderTopColor: "var(--mou-primary)" }} />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Tabs */}
          <div className="flex items-center gap-2 animate-fadeInUp">
            {tabs.map((tab) => {
              const count = stats[tab.countKey] ?? 0;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                    border: isActive ? "none" : "1px solid var(--mou-line)",
                    background: isActive ? "var(--mou-primary)" : "var(--mou-surface)",
                    color: isActive ? "#fff" : "var(--mou-muted)",
                    cursor: "pointer", transition: "all 0.15s ease", boxShadow: isActive ? "0 1px 3px rgba(37,99,235,0.2)" : "none",
                    fontFamily: "inherit", lineHeight: 1.2,
                  }}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  <span style={{ fontSize: 12, opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="bg-white rounded-xl" style={{ border: "1px solid var(--mou-line)", overflow: "hidden" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--mou-line-soft)", display: "flex", alignItems: "center", gap: 12 }}>
              {activeTab === "active" ? (
                <Bookmark size={16} style={{ color: "var(--mou-green)" }} />
              ) : (
                <AlertCircle size={16} style={{ color: "var(--mou-red)" }} />
              )}
              <h3 className="text-sm font-semibold m-0" style={{ color: "var(--mou-text)" }}>
                {tabs.find((t) => t.key === activeTab)?.label}
              </h3>
              <span className="ml-auto text-xs" style={{ color: "var(--mou-muted-soft)" }}>{currentList.length} รายการ</span>
            </div>

            {currentList.length > 0 ? (
              <div style={{ background: "var(--mou-field)" }}>
                <div className="colHeaders" style={{
                  display: "grid",
                  gridTemplateColumns: activeTab === "expired" ? "110px 1fr 105px 105px 120px 120px" : "110px 1fr 105px 105px 120px",
                  gap: 4, padding: "8px 24px", background: "var(--mou-field)",
                  borderBottom: "1px solid var(--mou-line)",
                  fontSize: 11, fontWeight: 600, color: "var(--mou-muted)",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Key size={11} />รหัส MOU</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, paddingRight: 12 }}><FileText size={11} />ชื่อ MOU / หน่วยงาน</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันเริ่มต้น</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Calendar size={11} />วันสิ้นสุด</span>
                  <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}><Bookmark size={11} />สถานะ</span>
                  {activeTab === "expired" && (
                    <span style={{ textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }}>ดำเนินการ</span>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "16px 4px" }}>
                  {currentList.map((m, idx) => {
                    const isExpired = activeTab === "expired";
                    return (
                      <div key={m.id} className="mouRow" style={{
                        display: "grid",
                        gridTemplateColumns: isExpired ? "110px 1fr 105px 105px 120px 120px" : "110px 1fr 105px 105px 120px",
                        gap: 4, alignItems: "center", padding: "16px 20px",
                        border: "1px solid var(--mou-line)", borderRadius: 8,
                        background: "var(--mou-surface)", cursor: "pointer",
                        animation: `fadeInUp 0.3s ease-out ${idx * 0.04}s both`,
                        transition: "box-shadow 0.15s ease, background 0.15s ease",
                      }} onClick={(e) => handleRowClick(m.id, e)}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"; e.currentTarget.style.background = isExpired ? "#fef2f2" : "var(--mou-primary-soft)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "var(--mou-surface)"; }}>
                        <span style={{ textAlign: "center", padding: "2px 10px", borderRadius: 5, background: isExpired ? "#fef2f2" : "var(--mou-primary-soft)", color: isExpired ? "var(--mou-red)" : "var(--mou-primary)", fontSize: 12, whiteSpace: "nowrap" }}>{m.mou_code}</span>
                        <div style={{ minWidth: 0, paddingRight: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mou-text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: "var(--mou-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.partners?.[0]?.partner_org || "-"}</div>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--mou-muted)", textAlign: "center" }}>{fmtDate(m.start_date)}</span>
                        <span style={{ fontSize: 12, color: "var(--mou-muted)", textAlign: "center" }}>{m.end_date ? fmtDate(m.end_date) : "-"}</span>
                        <span style={{ textAlign: "center" }}>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(m.status?.name || "")}`}>{m.status?.name || "-"}</span>
                        </span>
                        {isExpired ? (
                          <span style={{ textAlign: "center" }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRenew(m); }}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition"
                              style={{ border: "1px solid #d8b4fe", background: "#faf5ff", color: "#9333ea" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3e8ff"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "#faf5ff"; }}
                            >
                              <RotateCcw size={13} /> ต่ออายุ
                            </button>
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12" style={{ color: "var(--mou-muted-soft)" }}>
                {activeTab === "expired" ? <AlertCircle size={32} className="opacity-40 mb-2" /> : <Bookmark size={32} className="opacity-40 mb-2" />}
                <span className="text-sm">{activeTab === "expired" ? "ไม่มี MOU ที่จะหมดอายุในปีนี้" : "ไม่มี MOU ที่มีผลบังคับใช้ในปีนี้"}</span>
              </div>
            )}
          </div>

        </div>
      )}
    </MouLayout>
  );
}
