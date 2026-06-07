"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  FileText, Calendar, Globe, User, Clock, Bookmark, Layers,
  MapPin, Building2, Paperclip, Download, ExternalLink,
  Tag, Activity, Users, FileSignature, History, ListChecks,
  ChevronLeft, Key, AlignLeft, Handshake, UserCheck, Tags, StickyNote,
  Plus, Hash, UserCircle, X, Check, Edit3, Bell
} from "lucide-react";
import MouLayout from "../../components/MouLayout";
import { mouAPI } from "../../../../lib/mou_api";
import apiClient from "../../../../lib/api";

const statusDot = (name) => {
  const v = (name || "").toLowerCase();
  if (v.includes("active") || v.includes("มีผล")) return "bg-emerald-500";
  if (v.includes("ใกล้")) return "bg-amber-500";
  if (v.includes("หมด")) return "bg-red-500";
  if (v.includes("รอดำเนินการ")) return "bg-blue-500";
  return "bg-gray-400";
};

const statusClass = (name) => {
  const v = (name || "").toLowerCase();
  if (v.includes("active") || v.includes("มีผล")) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300";
  if (v.includes("ใกล้")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-300";
  if (v.includes("หมด")) return "bg-red-50 text-red-700 ring-1 ring-red-300";
  if (v.includes("รอดำเนินการ")) return "bg-blue-50 text-blue-700 ring-1 ring-blue-300";
  return "bg-gray-50 text-gray-600 ring-1 ring-gray-300";
};

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("th-TH");
};

const infoIcon = {
  "รหัส MOU": Key,
  "ชื่อ MOU": FileText,
  "วันที่เริ่มต้น": Calendar,
  "วันที่สิ้นสุด": Calendar,
  "ปีที่ลงนาม": Bookmark,
  "หน่วยงานคู่ความร่วมมือ": Handshake,
  "หน่วยงานคู่สัญญา": Handshake,
  "ประเภท MOU": Tags,
  "สถานะ": Bookmark,
  "ระดับ": Layers,
  "ขอบเขตความร่วมมือ": Globe,
  "ประเทศ": MapPin,
  "ผู้ประสานงาน": UserCheck,
  "จำนวนวันก่อนที่จะหมดอายุ": Clock,
  "แจ้งเตือนก่อนสิ้นสุด (จำนวนวัน)": Clock,
  "ประเภทคู่สัญญา": Tag,
  "หมายเหตุ": StickyNote,
  "ลงนามโดย": FileSignature,
  "รายละเอียด": AlignLeft,
};

const iconColors = {
  Key: "text-blue-600",
  FileText: "text-blue-600",
  Calendar: "text-blue-600",
  Bookmark: "text-blue-600",
  Handshake: "text-blue-600",
  Tags: "text-blue-600",
  Activity: "text-blue-600",
  Layers: "text-blue-600",
  Globe: "text-blue-600",
  MapPin: "text-blue-600",
  UserCheck: "text-blue-600",
  Clock: "text-blue-600",
  Tag: "text-blue-500",
  StickyNote: "text-blue-600",
  FileSignature: "text-blue-600",
};

function InfoRow({ label, value, borderColor = "border-gray-100" }) {
  const Icon = infoIcon[label] || Tag;
  const colorKey = Icon.name || "Tag";
  const iconColor = iconColors[colorKey] || "text-blue-500";
  return (
    <div className={`bg-white rounded-lg px-4 py-3 border ${borderColor}`}>
      <div className="flex gap-1.5">
        <Icon size={12} className={`${iconColor} shrink-0 mt-0.5`} />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gray-500 mb-2">{label}</div>
          <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
        </div>
      </div>
    </div>
  );
}

function FileIcon({ fileName }) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') {
    return (
      <div className="w-9 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-red-600 font-extrabold text-[10px] tracking-wider">PDF</span>
      </div>
    );
  }
  if (['doc', 'docx'].includes(ext)) {
    return (
      <div className="w-9 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-blue-600 font-extrabold text-[10px] tracking-wider">DOC</span>
      </div>
    );
  }
  if (ext === 'txt') {
    return (
      <div className="w-9 h-10 rounded-lg bg-gray-50 border border-gray-300 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-gray-500 font-extrabold text-[10px] tracking-wider">TXT</span>
      </div>
    );
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return (
      <div className="w-9 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-green-600 font-extrabold text-[10px] tracking-wider">XLS</span>
      </div>
    );
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return (
      <div className="w-9 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-orange-600 font-extrabold text-[10px] tracking-wider">PPT</span>
      </div>
    );
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return (
      <div className="w-9 h-10 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0 shadow-sm">
        <span className="text-pink-600 font-extrabold text-[10px] tracking-wider">IMG</span>
      </div>
    );
  }
  return (
    <div className="w-9 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
      <span className="text-gray-500 font-extrabold text-[10px] tracking-wider">{ext.slice(0, 3).toUpperCase() || 'FIL'}</span>
    </div>
  );
}

function FacultyItem({ fac }) {
  const userName = [fac.user?.prefix, fac.user?.user_fname, fac.user?.user_lname].filter(Boolean).join(" ");
  const responsibleName = userName || fac.external_name;
  const email = fac.user?.email || fac.email;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-indigo-100">
      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
        <Building2 size={15} className="text-indigo-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-indigo-900 truncate">{fac.faculty?.name_th || "-"}</div>
        {responsibleName && (
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            ผู้รับผิดชอบ: {responsibleName}
          </div>
        )}
        {email && (
          <div className="text-[11px] text-gray-400 truncate mt-0.5">
            อีเมล: {email}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShowDetailMouPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const [mou, setMou] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countryMap, setCountryMap] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => {
    apiClient.get("/users").then((res) => setUsers(res?.users || [])).catch(() => {});
  }, []);

  useEffect(() => {
    mouAPI.getCountries().then((list) => {
      const map = {};
      (list || []).forEach((c) => { map[c.id] = c.name_th || c.name || ""; });
      setCountryMap(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    mouAPI.getMouDetail(params.id).then((res) => {
      if (res) setMou(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handleDownloadZip = async () => {
    try {
      const filename = `mou_${params.id}_attachments.zip`;
      await apiClient.downloadFile(`/mou/${params.id}/download`, filename);
    } catch {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถดาวน์โหลดเอกสารได้" });
    }
  };

  const handleViewFile = (attachId) => {
    const token = apiClient.getToken();
    const url = `${apiClient.baseURL}/mou/${params.id}/attachments/${attachId}`;
    window.open(url, "_blank");
  };

  const handleDownloadFile = async (attachId, fileName) => {
    try {
      await apiClient.downloadFile(`/mou/${params.id}/attachments/${attachId}?dl=1`, fileName);
    } catch {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถดาวน์โหลดไฟล์ได้" });
    }
  };

  if (loading) {
    return (
      <MouLayout subtitle="รายละเอียด MOU">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-200 border-t-blue-600" />
            <p className="text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MouLayout>
    );
  }

  if (!mou) {
    return (
      <MouLayout subtitle="รายละเอียด MOU">
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-red-500" />
          </div>
          <p className="text-red-600 font-medium">ไม่พบข้อมูล MOU</p>
        </div>
      </MouLayout>
    );
  }

  const levelName = mou.level === "university" ? "มหาวิทยาลัย" : mou.level === "faculty" ? "คณะ" : mou.level || "-";
  const scope = mou.is_international ? "ต่างประเทศ" : "ในประเทศ";
  const partnerOrg = mou.partners?.[0]?.partner_org || "-";
  const partnerType = mou.partners?.[0]?.partner_type?.name_th || "-";
  const yearOfSigning = mou.year_of_signing || "-";
  const coordinator = mou.coordinator
    ? [mou.coordinator.prefix || "", mou.coordinator.user_fname || "", mou.coordinator.user_lname || ""].filter(Boolean).join(" ")
    : "-";
  const signedBy = mou.signed_by || "-";
  const endDate = mou.end_date ? fmtDate(mou.end_date) : "-";
  const daysLeft = mou.end_date ? Math.ceil((new Date(mou.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const daysText = daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} วัน` : "หมดอายุแล้ว") : "-";
  const notifyVal = mou.notify_days_before != null ? String(mou.notify_days_before) : "-";
  const countryName = mou.country?.name_th || mou.country?.name || countryMap[mou.country_id] || "-";
  const faculties = (mou.faculties || []).filter((f) => f.faculty_id);
  const externalOrgs = (mou.faculties || []).filter((f) => f.external_org);
  const attachments = mou.attachments || [];
  const activities = mou.activities || [];
  const statusName = mou.status?.name || "-";

  return (
    <MouLayout subtitle="รายละเอียด MOU">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
              <FileText size={22} className="text-blue-600" />
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>
                รายละเอียด MOU
              </h1>
              {mou?.mou_code && <span className="text-xl font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">{mou.mou_code}</span>}
            </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition shadow-sm"
            onClick={() => router.back()}
          >
            <ChevronLeft size={15} />
            กลับ
          </button>
          <Link
            href={`/mou/admin_notification_settings?mou_id=${params.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-indigo-700 transition shadow-sm"
          >
            <Bell size={15} />
            ตั้งค่าการแจ้งเตือน
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card: ข้อมูล MOU */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Key size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">ข้อมูล MOU</span>
            <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusClass(statusName)}`}><span className={`w-2 h-2 rounded-full ${statusDot(statusName)}`} />{statusName}</span>
          </div>
          <div className="p-5 space-y-3">
            <InfoRow label="ชื่อ MOU" value={mou.title} borderColor="border-blue-100" />
            {mou.description && (
              <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                <div className="flex gap-1.5">
                  <AlignLeft size={12} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500 mb-2">รายละเอียด</div>
                    <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">{mou.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card: ความร่วมมือ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Layers size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">ความร่วมมือ</span>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <InfoRow label="ระดับ" value={levelName} borderColor="border-blue-100" />
              <InfoRow label="ขอบเขตความร่วมมือ" value={scope} borderColor="border-blue-100" />
              <InfoRow label="ประเทศ" value={countryName} borderColor="border-blue-100" />
            </div>
            {faculties.length > 0 && (
              <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                <div className="flex gap-1.5">
                  <Building2 size={12} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500 mb-2">คณะที่เข้าร่วม</div>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {faculties.map((fac) => (
                        <FacultyItem key={fac.id} fac={fac} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {externalOrgs.length > 0 && (
              <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                <div className="flex gap-1.5">
                  <Building2 size={12} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500 mb-2">ผู้รับผิดชอบภายนอก</div>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {externalOrgs.map((fac) => (
                        <div key={fac.id} className="p-2 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Building2 size={13} className="text-blue-500 shrink-0" />
                            <span className="text-xs font-medium text-blue-900 truncate">{fac.external_org}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 truncate pl-5">ผู้รับผิดชอบ: {fac.external_name || "ไม่ระบุ"}</div>
                          {fac.email && <div className="text-[11px] text-gray-400 truncate pl-5">อีเมล: {fac.email}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card: คู่สัญญาและกำหนดการ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <Handshake size={18} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">คู่สัญญาและกำหนดการ</span>
          </div>
          <div className="p-5 space-y-3">
            <InfoRow label="หน่วยงานคู่สัญญา" value={partnerOrg} borderColor="border-blue-100" />
            <InfoRow label="ประเภทคู่สัญญา" value={partnerType} borderColor="border-blue-100" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoRow label="ปีที่ลงนาม" value={yearOfSigning} borderColor="border-blue-100" />
              <InfoRow label="ลงนามโดย" value={signedBy} borderColor="border-blue-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoRow label="วันที่เริ่มต้น" value={fmtDate(mou.start_date)} borderColor="border-blue-100" />
              <InfoRow label="วันที่สิ้นสุด" value={endDate} borderColor="border-blue-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoRow label="ผู้ประสานงาน" value={coordinator} borderColor="border-blue-100" />
              <InfoRow label="แจ้งเตือนก่อนสิ้นสุด (จำนวนวัน)" value={notifyVal} borderColor="border-blue-100" />
            </div>
            {(mou.notes || "").trim() && (
              <InfoRow label="หมายเหตุ" value={mou.notes} borderColor="border-blue-100" />
            )}
          </div>
        </div>

        {/* Files & History - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
                <Paperclip size={18} className="text-violet-600" />
                <span className="text-sm font-semibold text-gray-800">ไฟล์แนบ</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 ml-auto">{attachments.length} ไฟล์</span>
              </div>
              <div className="divide-y divide-gray-100">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileIcon fileName={att.file_name} />
                      <span className="text-sm text-gray-700 truncate font-medium">{att.file_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        onClick={() => handleViewFile(att.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition"
                        title="ดูไฟล์"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(att.id, att.file_name)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition"
                        title="ดาวน์โหลด"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
              <History size={18} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">ประวัติ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันเวลา</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โดย</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {(() => {
                    const events = [];

                    if (mou.created_at) {
                      events.push({
                        id: "create",
                        title: "สร้าง MOU",
                        date: new Date(mou.created_at),
                        actor: mou.creator ? [mou.creator.prefix || "", mou.creator.user_fname || "", mou.creator.user_lname || ""].filter(Boolean).join(" ") : "",
                        icon: "bg-green-400",
                      });
                    }

                    if (mou.updated_at && mou.updated_at !== mou.created_at) {
                      events.push({
                        id: "update",
                        title: "แก้ไขข้อมูลล่าสุด",
                        date: new Date(mou.updated_at),
                        actor: mou.updater ? [mou.updater.prefix || "", mou.updater.user_fname || "", mou.updater.user_lname || ""].filter(Boolean).join(" ") : "",
                        icon: "bg-blue-400",
                      });
                    }

                    (mou.mou_events || []).forEach((ev) => {
                      const actor = ev.actor ? [ev.actor.prefix || "", ev.actor.user_fname || "", ev.actor.user_lname || ""].filter(Boolean).join(" ") : "";
                      events.push({
                        id: ev.id,
                        title: ev.action || "เหตุการณ์",
                        subtitle: ev.message || "",
                        date: new Date(ev.sent_at),
                        actor: actor || "",
                        icon: ev.action?.includes("เปลี่ยนสถานะ") ? "bg-amber-400" : ev.action?.includes("สร้าง") ? "bg-green-400" : "bg-blue-400",
                      });
                    });

                    events.sort((a, b) => b.date - a.date);

                    if (events.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-sm text-gray-400">ไม่มีประวัติ</td>
                        </tr>
                      );
                    }

                    return events.map((ev) => (
                      <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-2 h-2 rounded-full ${ev.icon} mt-1.5 shrink-0`} />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800">{ev.title}</div>
                              {ev.subtitle && (
                                <div className="text-[12px] text-gray-500 mt-0.5">{ev.subtitle}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{ev.date.toLocaleString("th-TH")}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">{ev.actor || "-"}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ListChecks size={16} className="text-emerald-600" />
            </div>
            <span className="text-sm font-semibold text-gray-800">กิจกรรมภายใต้ MOU</span>
            {activities.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">{activities.length} รายการ</span>
            )}
            <Link
              href={`/mou/add_activity_mou?mou_id=${params.id}`}
              className="btn primary inline-flex items-center gap-2 ml-auto"
            >
              <Plus size={16} />
              เพิ่มกิจกรรม
            </Link>
          </div>
          {activities.length > 0 ? (
            <div style={{ overflowX: "auto", maxHeight: activities.length > 5 ? "320px" : "none", overflowY: activities.length > 5 ? "auto" : "visible" }}>
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-center gap-1"><Hash size={12} />ลำดับ</div></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-start gap-1"><FileText size={12} />ชื่อกิจกรรม</div></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-center gap-1"><Calendar size={12} />วันที่เริ่ม</div></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-center gap-1"><Calendar size={12} />วันที่สิ้นสุด</div></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-center gap-1"><UserCircle size={12} />ผู้ประสานงาน</div></th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"><div className="flex items-center justify-center gap-1"><FileText size={12} />รายละเอียด</div></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{idx + 1}</td>
                      <td className="pl-4 pr-8 py-3 text-sm text-gray-900 font-medium max-w-[220px]" style={{ textAlign: "left" }}><div className="truncate">{a.title}</div></td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{fmtDate(a.activity_start)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{fmtDate(a.activity_end)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                        {a.coordinator
                          ? [a.coordinator.prefix || "", a.coordinator.user_fname || "", a.coordinator.user_lname || ""].filter(Boolean).join(" ")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Link
                          href={`/mou/show_detail_activity/${a.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition"
                        >
                          <FileText size={12} />
                          ดูรายละเอียด
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <ListChecks size={28} className="mb-1 opacity-50" />
              <span className="text-sm">ไม่มีกิจกรรม</span>
            </div>
          )}
        </div>
      </div>
    </MouLayout>
  );
}
