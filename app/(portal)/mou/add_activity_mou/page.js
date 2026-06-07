"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Calendar, MapPin, Users, FileText, AlignLeft,
  StickyNote, Paperclip, Download, X, Check, Building2, Target,
  ChevronLeft, ChevronDown, Search, Plus, Tag, Upload, Sparkles, FileSignature,
  Clock, Bookmark, Handshake, Layers, ChevronRight, Eye
} from "lucide-react";
import apiClient from "../../../lib/api";
import { mouAPI } from "../../../lib/mou_api";
import MouLayout from "../components/MouLayout";
import Swal from "sweetalert2";

export default function AddActivityMouPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    mou_id: "",
    title: "",
    activity_start: "",
    activity_end: "",
    location: "",
    participant_count: "",
    objective: "",
    description: "",
    plan: "",
    notes: "",
    coordinator_id: "",
    coordinator_other: "",
    coordinator_org: "",
  });
  const [selectedMou, setSelectedMou] = useState(null);
  const [activityTypes, setActivityTypes] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState([]);
  const [selectedOkrIds, setSelectedOkrIds] = useState([]);
  const [typeSearch, setTypeSearch] = useState("");
  const [okrSearch, setOkrSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mouCardOpen, setMouCardOpen] = useState(false);

  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return d;
    }
  };
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const coorRef = useRef(null);
  const [coorQuery, setCoorQuery] = useState("");
  const [coorOpen, setCoorOpen] = useState(false);

  const filteredUsers = coorQuery.trim()
    ? users.filter(u =>
        `${u.prefix || ""} ${u.user_fname || ""} ${u.user_lname || ""}`.toLowerCase().includes(coorQuery.toLowerCase())
      )
    : users;

  useEffect(() => {
    const handler = (e) => {
      if (coorRef.current && !coorRef.current.contains(e.target)) setCoorOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mouId = params.get("mou_id");
    if (mouId) {
      setFormData((prev) => ({ ...prev, mou_id: mouId }));
      mouAPI.getMouDetail(mouId).then((mou) => {
        setSelectedMou(mou);
      }).catch(() => {
        setError("ไม่สามารถโหลดข้อมูล MOU");
      });
    }
    mouAPI.getActivityTypes().then(setActivityTypes).catch(() => {});
    mouAPI.getOkrs().then(setOkrs).catch(() => {});
    apiClient.get("/users").then((res) => setUsers(res?.users || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleType = (id) => {
    setSelectedTypeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleOkr = (id) => {
    setSelectedOkrIds((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleFileChange = (e) => {
    const MAX_FILES = 3;
    const MAX_SIZE = 20 * 1024 * 1024;
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > MAX_FILES) {
        Swal.fire({ icon: "warning", title: "ไฟล์เกินจำนวน", text: `สามารถแนบไฟล์ได้สูงสุด ${MAX_FILES} ไฟล์` });
      e.target.value = "";
      return;
    }
    for (const f of selected) {
      if (f.size > MAX_SIZE) {
        setError(`ไฟล์ "${f.name}" มีขนาดเกิน 20 MB`);
        e.target.value = "";
        return;
      }
    }
    setFiles((prev) => [...prev, ...selected]);
    setError("");
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
      setError("");

    try {
      if (!formData.mou_id || !formData.title || selectedTypeIds.length === 0 || !formData.activity_start || !formData.activity_end || !formData.location) {
        setError("กรุณากรอกข้อมูลที่จำเป็นทั้งหมด");
        setLoading(false);
        return;
      }

      const startParts = formData.activity_start.split("-");
      const formattedStart = startParts.length === 3 ? `${startParts[2]}/${startParts[1]}/${startParts[0]}` : formData.activity_start;

      const endParts = formData.activity_end.split("-");
      const formattedEnd = endParts.length === 3 ? `${endParts[2]}/${endParts[1]}/${endParts[0]}` : formData.activity_end;

      const payload = {
        mou_id: parseInt(formData.mou_id, 10),
        title: formData.title,
        activity_type_ids: selectedTypeIds.map((id) => parseInt(id, 10)),
        activity_start: formattedStart,
        activity_end: formattedEnd,
        location: formData.location,
        participant_count: formData.participant_count ? parseInt(formData.participant_count, 10) : 0,
        okr_ids: selectedOkrIds.map((id) => parseInt(id, 10)),
        objective: formData.objective,
        description: formData.description,
        plan: formData.plan,
        notes: formData.notes,
        coordinator_id: formData.coordinator_id ? parseInt(formData.coordinator_id, 10) : null,
        coordinator_other: formData.coordinator_other,
        coordinator_org: formData.coordinator_org,
      };

      if (files.length > 0) {
        const formDataPayload = new FormData();
        formDataPayload.append("data", JSON.stringify(payload));
        files.forEach((f) => formDataPayload.append("files", f));
        await apiClient.postFormData("/mou/activities", formDataPayload);
      } else {
        await mouAPI.createMouActivity(payload);
      }

      await Swal.fire({
        icon: "success",
        title: "บันทึกกิจกรรมสำเร็จ!",
        confirmButtonColor: "#2563eb",
        timer: 1500,
      });
      setFormData({
        mou_id: formData.mou_id,
        title: "",
        activity_start: "",
        activity_end: "",
        location: "",
        participant_count: "",
        objective: "",
        description: "",
        plan: "",
        notes: "",
        coordinator_id: "",
        coordinator_other: "",
        coordinator_org: "",
      });
      setSelectedTypeIds([]);
      setSelectedOkrIds([]);
      setFiles([]);

      router.replace("/mou");
    } catch (err) {
      console.error("Error creating activity:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
    }
  };

  const filteredTypes = activityTypes.filter((t) =>
    !typeSearch || t.name.toLowerCase().includes(typeSearch.toLowerCase())
  );
  const filteredOkrs = okrs.filter((o) =>
    !okrSearch || o.title.toLowerCase().includes(okrSearch.toLowerCase())
  );

  return (
    <MouLayout subtitle="เพิ่มกิจกรรม">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes asd { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spinner { to { transform: rotate(360deg); } }
        .afu { animation: fadeInUp 0.35s ease-out both; }
        .asd { animation: asd 0.3s ease-out both; }
        .mouRoot .field label { font-weight: 600 !important; color: #374151 !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; flex-wrap: wrap !important; }
        .mouRoot .field input:not([type="date"]), .mouRoot .field textarea { color: #111827 !important; }
        .mouRoot .field input::placeholder, .mouRoot .field textarea::placeholder { color: #9ca3af !important; }
        .mouRoot .field input[type="date"]:required:invalid { color: #9ca3af !important; }
        .mouRoot .field input[type="date"]:valid { color: #111827 !important; }
        .mouRoot .field select { color: #9ca3af !important; }
        .mouRoot .field select:focus, .mouRoot .field select:has(option:checked:not([value=""])) { color: #111827 !important; }
      `}</style>

      {/* Page Title */}
      <div className="flex items-center justify-between mb-6 afu" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
            <Activity size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ margin: 0, lineHeight: 1.2 }}>
              เพิ่มกิจกรรมภายใต้ MOU
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">บันทึกกิจกรรมใหม่ภายใต้บันทึกข้อตกลงความร่วมมือ</p>
          </div>
        </div>
        <button type="button" className="btn inline-flex items-center gap-2" onClick={() => router.back()}>
          <ChevronLeft size={16} />
          กลับ
        </button>
      </div>
      {(error) && (
        <div className="panel asd" style={{ marginBottom: "18px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#dc2626" }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* MOU */}
        <div className="panel formSection afu" style={{ animationDelay: "0ms", padding: 0, overflow: "hidden" }}>
          <div className="px-5 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText size={15} color="#fff" />
            </div>
            <span className="text-sm font-semibold text-blue-800">MOU ที่เชื่อมโยง {selectedMou?.mou_code}</span>
          </div>
          <input type="hidden" name="mou_id" value={formData.mou_id} />
          {selectedMou ? (
            <>
              {!mouCardOpen && (
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-base font-bold text-gray-800">{selectedMou.title}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {selectedMou.partners?.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <Building2 size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">หน่วยงาน</div>
                          <div className="text-xs font-medium text-gray-700 truncate">{selectedMou.partners.map(p => p.partner_org).join(", ")}</div>
                        </div>
                      </div>
                    )}
                    {selectedMou.country?.name_th && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">ประเทศ</div>
                          <div className="text-xs font-medium text-gray-700">{selectedMou.country.name_th}</div>
                        </div>
                      </div>
                    )}
                    {selectedMou.level && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <Tag size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">ระดับ</div>
                          <div className="text-xs font-medium text-gray-700">{selectedMou.level === "university" ? "มหาวิทยาลัย" : selectedMou.level === "faculty" ? "คณะ" : selectedMou.level}</div>
                        </div>
                      </div>
                    )}
                    {selectedMou.start_date && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <Calendar size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">ระยะเวลา</div>
                          <div className="text-xs font-medium text-gray-700">{fmtDate(selectedMou.start_date)} - {selectedMou.end_date ? fmtDate(selectedMou.end_date) : "ปัจจุบัน"}</div>
                        </div>
                      </div>
                    )}
                    {selectedMou.status?.name && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                        <Bookmark size={14} className="text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">สถานะ</div>
                          <div className="text-xs font-medium text-gray-700">{selectedMou.status.name}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setMouCardOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition"
                  >
                    <ChevronDown size={15} />
                    ดูข้อมูลเพิ่มเติม
                  </button>
                </div>
              )}

              {mouCardOpen && (
                <div className="p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-800">{selectedMou.title}</span>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={15} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">ข้อมูล MOU</span>
                    </div>
                    <FullInfoRow label="ชื่อ MOU" value={selectedMou.title} />
                    {selectedMou.description && (
                      <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                        <div className="flex gap-1.5">
                          <AlignLeft size={12} className="text-gray-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-500 mb-2">รายละเอียด</div>
                            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-line">{selectedMou.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers size={15} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">ความร่วมมือ</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FullInfoRow label="ระดับ" value={selectedMou.level === "university" ? "มหาวิทยาลัย" : selectedMou.level === "faculty" ? "คณะ" : selectedMou.level || "-"} />
                      <FullInfoRow label="ขอบเขตความร่วมมือ" value={selectedMou.is_international ? "ต่างประเทศ" : "ในประเทศ"} />
                    </div>
                    {selectedMou.country?.name_th && (
                      <FullInfoRow label="ประเทศ" value={selectedMou.country.name_th} />
                    )}
                    {(selectedMou.faculties || []).filter((f) => f.faculty_id).length > 0 && (
                      <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                        <div className="flex gap-1.5">
                          <Building2 size={12} className="text-gray-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-500 mb-2">คณะที่เข้าร่วม</div>
                            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-1">
                              {(selectedMou.faculties || []).filter((f) => f.faculty_id).map((fac) => (
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

                  <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Handshake size={15} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">คู่สัญญาและกำหนดการ</span>
                    </div>
                    <FullInfoRow label="หน่วยงานคู่สัญญา" value={selectedMou.partners?.[0]?.partner_org || "-"} />
                    <FullInfoRow label="ประเภทคู่สัญญา" value={selectedMou.partners?.[0]?.partner_type?.name_th || "-"} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FullInfoRow label="ปีที่ลงนาม" value={selectedMou.year_of_signing || "-"} />
                      <FullInfoRow label="ลงนามโดย" value={selectedMou.signed_by || "-"} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FullInfoRow label="วันที่เริ่มต้น" value={fmtDate(selectedMou.start_date)} />
                      <FullInfoRow label="วันที่สิ้นสุด" value={selectedMou.end_date ? fmtDate(selectedMou.end_date) : "-"} />
                    </div>
                    <FullInfoRow label="ผู้ประสานงาน" value={selectedMou.coordinator ? [selectedMou.coordinator.prefix || "", selectedMou.coordinator.user_fname || "", selectedMou.coordinator.user_lname || ""].filter(Boolean).join(" ") : "-"} />
                    {(selectedMou.notes || "").trim() && (
                      <FullInfoRow label="หมายเหตุ" value={selectedMou.notes} />
                    )}
                  </div>

                  <button
                    onClick={() => setMouCardOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition"
                  >
                    แสดงน้อยลง
                    <ChevronDown size={15} style={{ transform: "rotate(180deg)" }} />
                  </button>
                </div>
              )}
            </>
          ) : formData.mou_id ? (
            <div className="p-5 flex items-center gap-3">
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #d1d5db", borderTopColor: "#3b82f6", animation: "spinner 0.6s linear infinite" }} />
              <span className="text-sm text-gray-500">กำลังโหลด...</span>
            </div>
          ) : (
            <div className="p-5 text-center text-sm text-gray-400">
              ไม่ได้ระบุ MOU — เลือก MOU จากหน้ารายการก่อน
            </div>
          )}
        </div>

        {/* ข้อมูลกิจกรรม */}
        <div className="panel formSection afu" style={{ animationDelay: "80ms" }}>
          <div className="sectionHead">
            <Activity size={18} className="text-blue-500" />
            <h3>ข้อมูลกิจกรรม</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Activity size={14} className="shrink-0" />ชื่อกิจกรรม <span className="required">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="ระบุชื่อกิจกรรม" required />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Target size={14} className="shrink-0" />วัตถุประสงค์</label>
              <textarea name="objective" value={formData.objective} onChange={handleChange} placeholder="ระบุวัตถุประสงค์..." rows={2} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><AlignLeft size={14} className="shrink-0" />รายละเอียด</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="ระบุรายละเอียด..." rows={3} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><FileText size={14} className="shrink-0" />แผนงาน</label>
              <textarea name="plan" value={formData.plan} onChange={handleChange} placeholder="ระบุแผนงาน..." rows={2} />
            </div>
          </div>
        </div>

        {/* วันเวลาและสถานที่ */}
        <div className="panel formSection afu" style={{ animationDelay: "120ms" }}>
          <div className="sectionHead">
            <Calendar size={18} className="text-blue-500" />
            <h3>วันเวลาและสถานที่</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label><Calendar size={14} className="shrink-0" />วันที่เริ่มจัดกิจกรรม <span className="required">*</span></label>
              <input type="date" name="activity_start" value={formData.activity_start} onChange={handleChange} required />
            </div>
            <div className="field">
              <label><Calendar size={14} className="shrink-0" />วันที่สิ้นสุดจัดกิจกรรม <span className="required">*</span></label>
              <input type="date" name="activity_end" value={formData.activity_end} onChange={handleChange} required />
            </div>
            <div className="field">
              <label><MapPin size={14} className="shrink-0" />สถานที่จัดกิจกรรม <span className="required">*</span></label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="ระบุสถานที่" required />
            </div>
            <div className="field">
              <label><Users size={14} className="shrink-0" />จำนวนผู้เข้าร่วม</label>
              <div className="inputGroup">
                <input type="number" name="participant_count" value={formData.participant_count} onChange={handleChange} placeholder="ระบุจำนวน" min="0" />
                <span className="inputSuffix">คน</span>
              </div>
            </div>
          </div>
        </div>

        {/* ผู้รับผิดชอบ */}
        <div className="panel formSection afu" style={{ animationDelay: "160ms" }}>
          <div className="sectionHead">
            <Users size={18} className="text-blue-500" />
            <h3>ผู้รับผิดชอบ</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label><Users size={14} className="shrink-0" />ผู้ประสานงาน <span className="required">*</span></label>
              <div className="relative" ref={coorRef}>
                <input
                  value={coorQuery}
                  onChange={(e) => {
                    setCoorQuery(e.target.value);
                    setCoorOpen(true);
                    setFormData((prev) => ({ ...prev, coordinator_id: "", coordinator_other: e.target.value }));
                  }}
                  onFocus={() => setCoorOpen(true)}
                  placeholder="ค้นหาหรือพิมพ์ชื่อผู้ประสานงาน"
                />
                {coorOpen && filteredUsers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.user_id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${u.user_id === parseInt(formData.coordinator_id) ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, coordinator_id: u.user_id, coordinator_other: "", coordinator_org: "คณะวิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น" }));
                          setCoorQuery(`${u.prefix || ""} ${u.user_fname || ""} ${u.user_lname || ""}`.trim());
                          setCoorOpen(false);
                        }}
                      >
                        {u.prefix || ""} {u.user_fname || ""} {u.user_lname || ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="field">
              <label><Building2 size={14} className="shrink-0" />หน่วยงานผู้ประสานงาน</label>
              <input type="text" name="coordinator_org" value={formData.coordinator_org} onChange={handleChange} placeholder="ระบุหน่วยงาน" />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><StickyNote size={14} className="shrink-0" />หมายเหตุ</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="ระบุหมายเหตุ..." rows={3} />
            </div>
          </div>
        </div>

        {/* ประเภทย่อย */}
        <div className="panel formSection afu" style={{ animationDelay: "200ms" }}>
          <div className="sectionHead">
            <Tag size={18} className="text-blue-500" />
            <h3>ประเภทย่อย</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="field" style={{ marginBottom: "8px" }}>
              <label><Tag size={14} className="shrink-0" />ประเภทกิจกรรม <span className="required">*</span></label>
              <div style={{ border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-field)", overflow: "hidden" }}>
                <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--mou-line)", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                  <Search size={14} className="text-gray-400" />
                  <input type="text" placeholder="ค้นหาประเภท..." value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)}
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", background: "transparent" }} />
                </div>
                <div style={{ maxHeight: "140px", overflowY: "auto" }}>
                  {filteredTypes.length > 0 ? filteredTypes.map((t) => (
                    <label key={t.id} className="multiSelectItem" style={{ display: "block", width: "100%", padding: "8px 10px", fontSize: "14px", cursor: "pointer", borderRadius: "4px" }}>
                      <input type="checkbox" checked={selectedTypeIds.includes(t.id)} onChange={() => toggleType(t.id)}
                        style={{ width: "16px", height: "16px", accentColor: "var(--mou-primary)", verticalAlign: "middle", marginRight: "8px" }} />
                      <span style={{ verticalAlign: "middle" }}>{t.name}</span>
                    </label>
                  )) : (
                    <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>ไม่มีประเภทกิจกรรม</div>
                  )}
                </div>
              </div>
            </div>
            <div className="field">
              <label><Target size={14} className="shrink-0" />สอดคล้องกับ OKR</label>
              <div style={{ border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-field)", overflow: "hidden" }}>
                <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--mou-line)", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                  <Search size={14} className="text-gray-400" />
                  <input type="text" placeholder="ค้นหา OKR..." value={okrSearch} onChange={(e) => setOkrSearch(e.target.value)}
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", background: "transparent" }} />
                </div>
                <div style={{ maxHeight: "140px", overflowY: "auto" }}>
                  {filteredOkrs.length > 0 ? filteredOkrs.map((o) => (
                    <label key={o.id} className="multiSelectItem" style={{ display: "block", width: "100%", padding: "8px 10px", fontSize: "14px", cursor: "pointer", borderRadius: "4px" }}>
                      <input type="checkbox" checked={selectedOkrIds.includes(o.id)} onChange={() => toggleOkr(o.id)}
                        style={{ width: "16px", height: "16px", accentColor: "var(--mou-primary)", verticalAlign: "middle", marginRight: "8px" }} />
                      <span style={{ verticalAlign: "middle" }}>{o.title}</span>
                    </label>
                  )) : (
                    <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>ไม่มี OKR</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* เอกสารแนบ */}
        <div className="panel formSection afu" style={{ animationDelay: "240ms" }}>
          <div className="sectionHead">
            <Paperclip size={18} className="text-blue-500" />
            <h3>เอกสารแนบ</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Paperclip size={14} className="shrink-0" />ไฟล์แนบ</label>
              <div className="fileDrop" onClick={() => fileInputRef.current?.click()} style={{ position: "relative", cursor: "pointer", justifyContent: files.length > 0 ? "flex-start" : "center", paddingTop: files.length > 0 ? "36px" : "16px", minHeight: "80px" }}>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }} accept=".pdf" multiple />
                {files.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                    {files.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#fff", borderRadius: "6px", fontSize: "13px" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                          <Upload size={12} className="shrink-0" style={{ color: "#6b7280" }} />
                          {f.name}
                        </span>
                        <span style={{ margin: "0 8px", color: "#6b7280", whiteSpace: "nowrap" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0 4px" }} title="ลบ"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <Upload size={22} style={{ color: "var(--mou-primary)" }} />
                    <span style={{ color: "#6b7280", fontSize: "13px" }}>PDF สูงสุด 3 ไฟล์ ไฟล์ละไม่เกิน 20 MB</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="footerActions afu" style={{ animationDelay: "300ms" }}>
          <button type="button" className="btn inline-flex items-center gap-2" onClick={() => router.back()}>
            <X size={16} />ยกเลิก
          </button>
          <button type="submit" className="btn primary inline-flex items-center gap-2" disabled={loading}>
            {loading ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />กำลังบันทึก...</>
            ) : (
              <><Check size={16} />บันทึกกิจกรรม</>
            )}
          </button>
        </div>
      </form>
    </MouLayout>
  );
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
