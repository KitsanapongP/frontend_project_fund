"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  FileText, Bookmark, Clock, AlertCircle, Activity, ListChecks,
  ChevronLeft, RefreshCw, UserCheck, Calendar, Target, Hourglass
} from "lucide-react";
import { mouAPI } from "../../../lib/mou_api";
import MouLayout from "../components/MouLayout";

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("th-TH");
};

const statusBadge = (name) => {
  const v = (name || "").toLowerCase();
  if (v.includes("active") || v.includes("มีผล")) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300";
  if (v.includes("ใกล้")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-300";
  if (v.includes("หมด")) return "bg-red-50 text-red-700 ring-1 ring-red-300";
  if (v.includes("รอดำเนินการ")) return "bg-blue-50 text-blue-700 ring-1 ring-blue-300";
  if (v.includes("ยกเลิก")) return "bg-gray-50 text-gray-600 ring-1 ring-gray-300";
  return "bg-gray-50 text-gray-600 ring-1 ring-gray-300";
};

const creatorName = (c) => {
  if (!c) return "-";
  return [c.prefix || "", c.user_fname || "", c.user_lname || ""].filter(Boolean).join(" ") || "-";
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [urgentMous, setUrgentMous] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mouAPI.getDashboard();
      if (res?.success && res?.data) {
        setStats(res.data);
        setRecentActivities(res.recentActivities || []);
        setUrgentMous(res.urgentMous || []);
      }
    } catch {
      Swal.fire({ icon: "error", title: "ไม่สามารถโหลดข้อมูล Dashboard" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statCards = [
    { key: "total", label: "MOU ทั้งหมด", value: stats?.total || 0, icon: FileText, gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
    { key: "active", label: "มีผลบังคับใช้", value: stats?.active || 0, icon: Bookmark, gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
    { key: "nearExpiry", label: "ใกล้หมดอายุ", value: stats?.nearExpiry || 0, icon: Clock, gradient: "from-amber-500 to-amber-600", bg: "bg-amber-50" },
    { key: "expired", label: "หมดอายุแล้ว", value: stats?.expired || 0, icon: AlertCircle, gradient: "from-red-500 to-red-600", bg: "bg-red-50" },
    { key: "pending", label: "รอดำเนินการ", value: stats?.pending || 0, icon: Hourglass, gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-50" },
    { key: "cancelled", label: "ยกเลิก", value: stats?.cancelled || 0, icon: AlertCircle, gradient: "from-gray-500 to-gray-600", bg: "bg-gray-50" },
  ];

  const getDaysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <MouLayout subtitle="รายงาน Dashboard">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
            <FileText size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>
              แดชบอร์ด MOU
            </h1>
          </div>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw size={15} />
          รีเฟรช
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-200 border-t-blue-600" />
            <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                      <Icon size={16} className={`bg-gradient-to-br ${s.gradient} bg-clip-text text-transparent`} />
                    </div>
                    <span className="text-xs text-gray-500">{s.label}</span>
                  </div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
                    {s.value}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Activity size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">กิจกรรมล่าสุด</span>
              </div>
              {recentActivities.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentActivities.map((act) => (
                    <div key={act.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <ListChecks size={12} className="text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/mou/show_detail_activity/${act.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition truncate block">
                            {act.title}
                          </Link>
                          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                            <span>{act.activity_type?.name || "-"}</span>
                            <span>•</span>
                            <span>{fmtDate(act.activity_start)}</span>
                            {act.creator && (
                              <>
                                <span>•</span>
                                <span>{creatorName(act.creator)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <Activity size={28} className="mb-1 opacity-50" />
                  <span className="text-sm">ไม่มีกิจกรรม</span>
                </div>
              )}
            </div>

            {/* Urgent MOUs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Clock size={16} className="text-amber-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">MOU ที่ต้องดำเนินการ</span>
              </div>
              {urgentMous.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {urgentMous.map((m) => {
                    const daysLeft = getDaysLeft(m.end_date);
                    return (
                      <div key={m.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${daysLeft !== null && daysLeft <= 30 ? "bg-red-100" : "bg-amber-100"}`}>
                            <Calendar size={12} className={daysLeft !== null && daysLeft <= 30 ? "text-red-600" : "text-amber-600"} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link href={`/mou/show_detail_mou/${m.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition truncate block">
                              {m.mou_code} - {m.title}
                            </Link>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                              <span>{fmtDate(m.end_date)}</span>
                              {daysLeft !== null && (
                                <>
                                  <span>•</span>
                                  <span className={daysLeft <= 30 ? "text-red-600 font-medium" : "text-amber-600"}>{daysLeft} วัน</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusBadge(m.status?.name)}`}>
                            {m.status?.name || "-"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-gray-400">
                  <Clock size={28} className="mb-1 opacity-50" />
                  <span className="text-sm">ไม่มี MOU ที่ต้องดำเนินการ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MouLayout>
  );
}
