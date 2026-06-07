"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Save, Bell, Eye, EyeOff, Users, RefreshCw, Mail, Clock, FileText, ChevronLeft, ChevronDown, Building2, Tag, MapPin, Calendar, Bookmark, FileSignature, Check, AlignLeft, Layers, Handshake } from "lucide-react";
import { mouAPI } from "../../../lib/mou_api";
import apiClient from "../../../lib/api";
import MouLayout from "../components/MouLayout";

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("th-TH");
};

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMou, setPreviewMou] = useState(null);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mouList, setMouList] = useState([]);
  const [mouId, setMouId] = useState(null);
  const [mouDetail, setMouDetail] = useState(null);
  const [mouDetailLoading, setMouDetailLoading] = useState(false);
  const [showFullDetail, setShowFullDetail] = useState(false);

  // per-MOU notify_days_before
  const [notifyDaysBefore, setNotifyDaysBefore] = useState("");

  const fieldLabels = {
    notify_coordinator: "แจ้งผู้ประสานงาน MOU",
    notify_faculty_responsible: "แจ้งผู้รับผิดชอบคณะ",
    notify_external: "แจ้งผู้รับผิดชอบภายนอก",
    include_mou_code: "แสดงรหัส MOU",
    include_title: "แสดงชื่อ MOU",
    include_partner: "แสดงชื่อคู่ความร่วมมือ",
    include_dates: "แสดงวันที่เริ่มต้น-สิ้นสุด",
    include_level: "แสดงระดับความร่วมมือ",
    include_status: "แสดงสถานะ",
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mid = params.get("mou_id");
    if (mid) setMouId(parseInt(mid, 10));
    fetchData();
  }, []);

  useEffect(() => {
    if (!mouId) return;
    setMouDetailLoading(true);
    mouAPI.getMouDetail(mouId)
      .then((mou) => {
        setMouDetail(mou);
        setNotifyDaysBefore(mou.notify_days_before != null ? String(mou.notify_days_before) : "");
      })
      .catch(() => Swal.fire("ผิดพลาด", "ไม่สามารถโหลดข้อมูล MOU", "error"))
      .finally(() => setMouDetailLoading(false));
  }, [mouId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSettings(), fetchRecipients(), fetchMouList()]);
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถโหลดข้อมูลได้", "error");
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const res = await mouAPI.getNotificationSettings();
    if (res?.success) setSettings(res.data);
  };

  const fetchRecipients = async () => {
    const res = await mouAPI.listNotificationRecipients();
    if (res?.success) setRecipients(res.data);
  };

  const fetchMouList = async () => {
    const res = await mouAPI.getMous({ limit: 50 });
    if (res?.data) setMouList(res.data);
  };

  const gatherSelectedRecipients = () => {
    if (!settings) return [];
    const selected = [];
    if (settings.notify_coordinator) {
      recipients.filter((r) => r.type === "coordinator").forEach((r) => selected.push(r));
    }
    if (settings.notify_faculty_responsible) {
      recipients.filter((r) => r.type === "faculty").forEach((r) => selected.push(r));
    }
    if (settings.notify_external) {
      recipients.filter((r) => r.type === "external").forEach((r) => selected.push(r));
    }
    return selected;
  };

  const categories = {
    info: {
      label: "ข้อมูล MOU", icon: FileText,
      keys: ["include_mou_code", "include_title", "include_status"],
      labels: { include_mou_code: "รหัส MOU", include_title: "ชื่อ MOU", include_status: "สถานะ" },
    },
    cooperation: {
      label: "ความร่วมมือ", icon: Layers,
      keys: ["include_level"],
      labels: { include_level: "ระดับความร่วมมือ" },
    },
    contract: {
      label: "คู่สัญญาและกำหนดการ", icon: Handshake,
      keys: ["include_partner", "include_dates"],
      labels: { include_partner: "ชื่อคู่ความร่วมมือ", include_dates: "วันที่เริ่มต้น-สิ้นสุด" },
    },
  };

  const toggleCategory = (keys, value) => {
    const update = {};
    keys.forEach((k) => { update[k] = value; });
    setSettings((prev) => ({ ...prev, ...update }));
  };

  const isAllChecked = (keys) => keys.every((k) => settings?.[k]);
  const isAnyChecked = (keys) => keys.some((k) => settings?.[k]);

  const toggleField = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreview = async () => {
    const targetMou = previewMou || mouId;
    if (!targetMou) {
      Swal.fire("กรุณาเลือก", "กรุณาเลือก MOU เพื่อดูตัวอย่างอีเมล", "warning");
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await mouAPI.getNotificationPreview(targetMou, settings);
      if (res?.success) {
        setPreviewHtml(res.data.html);
        setPreviewSubject(res.data.subject);
        setShowPreview(true);
      }
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถสร้างตัวอย่างอีเมลได้", "error");
    }
    setPreviewLoading(false);
  };

  const handleSaveNotifyDays = async () => {
    if (!mouId) return;
    const days = notifyDaysBefore ? parseInt(notifyDaysBefore, 10) : null;
    if (notifyDaysBefore && (isNaN(days) || days < 1 || days > 365)) {
      Swal.fire("ผิดพลาด", "กรุณากรอกจำนวนวันระหว่าง 1-365", "warning");
      return;
    }
    try {
      const res = await apiClient.put(`/mou/${mouId}`, { notify_days_before: days });
      if (res?.success) {
        Swal.fire("บันทึกสำเร็จ", "ตั้งค่าการแจ้งเตือน MOU ได้รับการอัปเดตแล้ว", "success");
      } else {
        Swal.fire("ผิดพลาด", res?.error || "ไม่สามารถบันทึกได้", "error");
      }
    } catch (err) {
      Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        default_days_before: settings.default_days_before,
        notify_coordinator: settings.notify_coordinator,
        notify_faculty_responsible: settings.notify_faculty_responsible,
        notify_external: settings.notify_external,
        include_mou_code: settings.include_mou_code,
        include_title: settings.include_title,
        include_partner: settings.include_partner,
        include_dates: settings.include_dates,
        include_level: settings.include_level,
        include_status: settings.include_status,
      };
      const res = await mouAPI.updateNotificationSettings(payload);
      if (res?.success) {
        setSettings(res.data);
        Swal.fire("บันทึกสำเร็จ", "ตั้งค่าการแจ้งเตือน MOU ได้รับการอัปเดตแล้ว", "success");
      }
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกการตั้งค่าได้", "error");
    }
    setSaving(false);
  };

  const recipientGroups = {
    coordinator: (recipients || []).filter((r) => r.type === "coordinator"),
    faculty: (recipients || []).filter((r) => r.type === "faculty"),
    external: (recipients || []).filter((r) => r.type === "external"),
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fadeInUp 0.35s ease-out both; }
      `}</style>
      <MouLayout subtitle="ตั้งค่าการแจ้งเตือน MOU">
        <div className="flex items-center justify-between mb-6 animate-in">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-sm flex items-center justify-center">
              <Bell size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>
                ตั้งค่าการแจ้งเตือน MOU
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">กำหนดค่าการแจ้งเตือนเมื่อ MOU ใกล้หมดอายุ</p>
            </div>
          </div>
          {mouId && (
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition shadow-sm"
            >
              <ChevronLeft size={15} />
              กลับ
            </button>
          )}
        </div>

        {loading || mouDetailLoading ? (
          <div className="flex items-center justify-center min-h-[300px] animate-in">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-200 border-t-blue-600" />
              <p className="text-sm text-gray-500">กำลังโหลด...</p>
            </div>
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* MOU Detail Card */}
            {mouDetail && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden animate-in">
                <div className="px-5 py-3 border-b border-blue-100 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                    <FileText size={15} color="#fff" />
                  </div>
                  <span className="text-sm font-semibold text-blue-800">MOU ที่เลือก</span>
                </div>
                <div className="p-5">
                  {!showFullDetail && (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{mouDetail.mou_code}</span>
                        <span className="text-base font-bold text-gray-800">{mouDetail.title}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {mouDetail.partners?.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                            <Building2 size={14} className="text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">หน่วยงาน</div>
                              <div className="text-xs font-medium text-gray-700 truncate">{mouDetail.partners.map(p => p.partner_org).join(", ")}</div>
                            </div>
                          </div>
                        )}
                        {mouDetail.country?.name_th && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                            <MapPin size={14} className="text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">ประเทศ</div>
                              <div className="text-xs font-medium text-gray-700">{mouDetail.country.name_th}</div>
                            </div>
                          </div>
                        )}
                        {mouDetail.level && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                            <Tag size={14} className="text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">ระดับ</div>
                              <div className="text-xs font-medium text-gray-700">{mouDetail.level === "university" ? "มหาวิทยาลัย" : mouDetail.level === "faculty" ? "คณะ" : mouDetail.level}</div>
                            </div>
                          </div>
                        )}
                        {mouDetail.start_date && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                            <Calendar size={14} className="text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">ระยะเวลา</div>
                              <div className="text-xs font-medium text-gray-700">{fmtDate(mouDetail.start_date)} - {mouDetail.end_date ? fmtDate(mouDetail.end_date) : "ปัจจุบัน"}</div>
                            </div>
                          </div>
                        )}
                        {mouDetail.status?.name && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                            <Bookmark size={14} className="text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">สถานะ</div>
                              <div className="text-xs font-medium text-gray-700">{mouDetail.status.name}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setShowFullDetail(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition"
                      >
                        <ChevronDown size={15} />
                        ดูข้อมูลเพิ่มเติม
                      </button>
                    </>
                  )}
                  {showFullDetail && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{mouDetail.mou_code}</span>
                        <span className="text-base font-bold text-gray-800">{mouDetail.title}</span>
                      </div>

                      {/* ข้อมูล MOU */}
                      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText size={15} className="text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">ข้อมูล MOU</span>
                        </div>
                        <FullInfoRow label="ชื่อ MOU" value={mouDetail.title} />
                        {mouDetail.description && (
                          <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                            <div className="flex gap-1.5">
                              <AlignLeft size={12} className="text-gray-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-gray-500 mb-2">รายละเอียด</div>
                                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">{mouDetail.description}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ความร่วมมือ */}
                      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers size={15} className="text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">ความร่วมมือ</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <FullInfoRow label="ระดับ" value={mouDetail.level === "university" ? "มหาวิทยาลัย" : mouDetail.level === "faculty" ? "คณะ" : mouDetail.level || "-"} />
                          <FullInfoRow label="ขอบเขตความร่วมมือ" value={mouDetail.is_international ? "ต่างประเทศ" : "ในประเทศ"} />
                        </div>
                        {mouDetail.country?.name_th && (
                          <FullInfoRow label="ประเทศ" value={mouDetail.country.name_th} />
                        )}
                        {(mouDetail.faculties || []).filter((f) => f.faculty_id).length > 0 && (
                          <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                            <div className="flex gap-1.5">
                              <Building2 size={12} className="text-gray-400 shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-gray-500 mb-2">คณะที่เข้าร่วม</div>
                                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                                  {(mouDetail.faculties || []).filter((f) => f.faculty_id).map((fac) => (
                                    <div key={fac.id} className="p-2 rounded-lg border border-indigo-100">
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Building2 size={13} className="text-indigo-500 shrink-0" />
                                        <span className="text-xs font-medium text-indigo-900 truncate">{fac.faculty?.name_th || "-"}</span>
                                      </div>
                                      {fac.user && (
                                        <div className="text-[11px] text-gray-500 truncate pl-5">
                                          ผู้รับผิดชอบ: {[fac.user.prefix || "", fac.user.user_fname || "", fac.user.user_lname || ""].filter(Boolean).join(" ")}
                                        </div>
                                      )}
                                      {(fac.user?.email || fac.email) && (
                                        <div className="text-[11px] text-gray-400 truncate pl-5">อีเมล: {fac.user?.email || fac.email}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* คู่สัญญาและกำหนดการ */}
                      <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Handshake size={15} className="text-blue-600" />
                          <span className="text-sm font-semibold text-gray-700">คู่สัญญาและกำหนดการ</span>
                        </div>
                        <FullInfoRow label="หน่วยงานคู่สัญญา" value={mouDetail.partners?.[0]?.partner_org || "-"} />
                        <FullInfoRow label="ประเภทคู่สัญญา" value={mouDetail.partners?.[0]?.partner_type?.name_th || "-"} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <FullInfoRow label="ปีที่ลงนาม" value={mouDetail.year_of_signing || "-"} />
                          <FullInfoRow label="ลงนามโดย" value={mouDetail.signed_by || "-"} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <FullInfoRow label="วันที่เริ่มต้น" value={fmtDate(mouDetail.start_date)} />
                          <FullInfoRow label="วันที่สิ้นสุด" value={mouDetail.end_date ? fmtDate(mouDetail.end_date) : "-"} />
                        </div>
                        <FullInfoRow label="ผู้ประสานงาน" value={mouDetail.coordinator ? [mouDetail.coordinator.prefix || "", mouDetail.coordinator.user_fname || "", mouDetail.coordinator.user_lname || ""].filter(Boolean).join(" ") : "-"} />
                        {(mouDetail.notes || "").trim() && (
                          <FullInfoRow label="หมายเหตุ" value={mouDetail.notes} />
                        )}
                      </div>

                      <button
                        onClick={() => setShowFullDetail(false)}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition"
                      >
                        แสดงน้อยลง
                        <ChevronDown size={15} style={{ transform: "rotate(180deg)" }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Per-MOU notify_days_before */}
            {mouDetail && (
              <SectionCard icon={Clock} title={`ระยะเวลาการแจ้งเตือนล่วงหน้า`}>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600 whitespace-nowrap">แจ้งเตือนก่อนหมดอายุ</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={notifyDaysBefore}
                      onChange={(e) => setNotifyDaysBefore(e.target.value)}
                      placeholder={mouDetail.notify_days_before ? String(mouDetail.notify_days_before) : String(settings.default_days_before)}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                    />
                  </div>
                  <span className="text-sm text-gray-500">วัน</span>
                  {mouDetail.notify_days_before ? (
                    <span className="text-xs text-emerald-600 font-medium">(ตั้งไว้ {mouDetail.notify_days_before} วัน)</span>
                  ) : (
                    <span className="text-xs text-gray-400">(ยังไม่ได้ตั้งค่า — จะใช้ค่าเริ่มต้น {settings.default_days_before} วัน)</span>
                  )}
                  <button
                    onClick={handleSaveNotifyDays}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm"
                  >
                    <Check size={14} />
                    บันทึก
                  </button>
                </div>
              </SectionCard>
            )}

            <SectionCard icon={Users} title="ผู้รับการแจ้งเตือน">
              <div className="space-y-5">
                <RecipientGroup
                  label="ผู้ประสานงาน MOU"
                  enabled={settings.notify_coordinator}
                  onToggle={() => toggleField("notify_coordinator")}
                  recipients={recipientGroups.coordinator}
                  avatarColor="bg-blue-500"
                  badgeColor="bg-blue-50 text-blue-600"
                />
                <RecipientGroup
                  label="ผู้รับผิดชอบคณะ"
                  enabled={settings.notify_faculty_responsible}
                  onToggle={() => toggleField("notify_faculty_responsible")}
                  recipients={recipientGroups.faculty}
                  avatarColor="bg-blue-500"
                  badgeColor="bg-blue-50 text-blue-600"
                  subtitleKey="faculty_name"
                />
                <RecipientGroup
                  label="ผู้รับผิดชอบภายนอก"
                  enabled={settings.notify_external}
                  onToggle={() => toggleField("notify_external")}
                  recipients={recipientGroups.external}
                  avatarColor="bg-blue-500"
                  badgeColor="bg-blue-50 text-blue-600"
                  subtitleKey="org_name"
                  subtitleFallback="ไม่ระบุหน่วยงาน"
                />
              </div>
            </SectionCard>

            <SectionCard icon={FileText} title="เนื้อหาที่แสดงในอีเมล">
              <div className="space-y-5">
                {Object.entries(categories).map(([catKey, cat]) => {
                  const CatIcon = cat.icon;
                  const allChecked = isAllChecked(cat.keys);
                  return (
                    <div key={catKey}>
                      <div
                        className="flex items-center gap-2 mb-2 cursor-pointer select-none"
                        onClick={() => toggleCategory(cat.keys, !allChecked)}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${allChecked ? "bg-emerald-600 border-emerald-600" : "border-gray-300 bg-white"}`}>
                          {allChecked && <Check size={10} className="text-white" />}
                        </div>
                        <CatIcon size={13} className={allChecked ? "text-emerald-600" : "text-gray-400"} />
                        <span className={`text-xs font-semibold uppercase tracking-wider ${allChecked ? "text-gray-800" : "text-gray-500"}`}>{cat.label}</span>
                      </div>
                      <div className="ml-5 divide-y divide-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                        {cat.keys.map((k) => (
                          <ToggleRow key={k} label={cat.labels[k]} checked={settings?.[k]} onChange={() => toggleField(k)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {mouId && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden animate-in">
                <div className="px-5 py-4 border-b border-blue-100 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-blue-800">ตัวอย่างอีเมลแจ้งเตือน</span>
                  <button
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
                  >
                    {previewLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Eye size={14} />
                    )}
                    {previewLoading ? "กำลังสร้าง..." : "ดูตัวอย่าง"}
                  </button>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {showPreview && previewHtml && (
                      <div className="border border-blue-100 rounded-lg overflow-hidden animate-in">
                        <div className="flex items-center justify-between bg-blue-50/50 px-4 py-2.5 border-b border-blue-100">
                          <span className="text-sm font-medium text-gray-700 truncate">{previewSubject}</span>
                          <button
                            onClick={() => setShowPreview(false)}
                            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition shrink-0 ml-3"
                          >
                            <EyeOff size={14} />
                            ซ่อน
                          </button>
                        </div>
                        <div className="bg-gray-50 p-4 max-h-[600px] overflow-auto">
                          <iframe
                            srcDoc={previewHtml}
                            title="Email Preview"
                            className="w-full border border-blue-100 rounded-lg"
                            style={{ minHeight: "400px", background: "#fff" }}
                            sandbox=""
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 animate-in">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition shadow-sm"
              >
                <Save size={16} />
                {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400 animate-in">
            <Bell size={40} className="mb-3 opacity-50" />
            <p className="text-sm">ไม่พบข้อมูลการตั้งค่า</p>
          </div>
        )}
      </MouLayout>
    </>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-blue-100 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Icon size={16} className="text-blue-600" />
        </div>
        <span className="text-sm font-semibold text-blue-800">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-gray-50 transition cursor-pointer group" onClick={onChange}>
      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/30 ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function RecipientGroup({ label, enabled, onToggle, recipients, avatarColor, badgeColor, subtitleKey, subtitleFallback }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <ToggleSwitch checked={enabled} onChange={onToggle} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor || "bg-gray-100 text-gray-500"}`}>
          {recipients.length} คน
        </span>
      </div>
      {enabled && recipients.length > 0 && (
        <div className="ml-14 space-y-2">
          {recipients.map((r) => (
            <div key={r.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition">
              <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
                {getInitials(r.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-700 truncate">{r.name}</div>
                <div className="text-xs text-gray-400 truncate">
                  {subtitleKey ? (r[subtitleKey] || subtitleFallback || r.email) : r.email}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "??";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase() || "?";
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function FullInfoRow({ label, value }) {
  return (
    <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
      <div className="flex gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gray-500 mb-2">{label}</div>
          <div className="text-sm font-medium text-gray-900 break-words">{value || "-"}</div>
        </div>
      </div>
    </div>
  );
}
