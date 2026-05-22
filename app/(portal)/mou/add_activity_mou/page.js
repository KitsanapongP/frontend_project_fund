"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, Calendar, MapPin, Users, FileText, AlignLeft,
  StickyNote, Paperclip, Download, X, Check, Building2, Target,
  ChevronLeft, Search, Plus, Tag, Upload, Sparkles, FileSignature,
  Clock
} from "lucide-react";
import apiClient from "../../../lib/api";
import { mouAPI } from "../../../lib/mou_api";
import { useAuth } from "../../../contexts/AuthContext";
import { notifyMouAction } from "../../../lib/notificationHelper";
import MouLayout from "../components/MouLayout";
import Swal from "sweetalert2";

export default function AddActivityMouPage() {
  const router = useRouter();
  const { user } = useAuth();
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
      await notifyMouAction(user?.user_id, "activity_create", payload.title || "Activity", null);
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
        .afu { animation: fadeInUp 0.35s ease-out both; }
        .asd { animation: asd 0.3s ease-out both; }
        .formSection .field label { font-weight: 500 !important; }
        .mouRoot .field input:not([type="date"]), .mouRoot .field textarea { color: #111827 !important; }
        .mouRoot .field input::placeholder, .mouRoot .field textarea::placeholder { color: #9ca3af !important; }
        .mouRoot .field input[type="date"]:required:invalid { color: #9ca3af !important; }
        .mouRoot .field input[type="date"]:valid { color: #111827 !important; }
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
        <Link className="btn inline-flex items-center gap-2" href="/mou">
          <ChevronLeft size={16} />
          กลับ
        </Link>
      </div>
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-24 mb-6"></div>

      {(error) && (
        <div className="panel asd" style={{ marginBottom: "18px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#dc2626" }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: ข้อมูลกิจกรรม */}
        <div className="panel formSection afu" style={{ animationDelay: "80ms" }}>
          <div className="sectionHead">
            <FileText size={18} className="text-blue-500" />
            <h3>ข้อมูลกิจกรรม</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* MOU */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><FileSignature size={14} className="shrink-0" />MOU ที่เชื่อมโยง</label>
              <input type="hidden" name="mou_id" value={formData.mou_id} />
              <div className="mouReadonlyField" style={{ color: "#2563eb", background: "#eff6ff", borderColor: "#bfdbfe" }}>
                {selectedMou ? `${selectedMou.mou_code} - ${selectedMou.title}` : formData.mou_id ? "กำลังโหลด..." : "-"}
              </div>
            </div>

            {/* Title */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Activity size={14} className="shrink-0" />ชื่อกิจกรรม <span className="required">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="ระบุชื่อกิจกรรม" required />
            </div>

            {/* Objective */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Target size={14} className="shrink-0" />วัตถุประสงค์</label>
              <textarea name="objective" value={formData.objective} onChange={handleChange} placeholder="ระบุวัตถุประสงค์..." rows={2} />
            </div>

            {/* Description */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><AlignLeft size={14} className="shrink-0" />รายละเอียด</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="ระบุรายละเอียด..." rows={3} />
            </div>

            {/* Plan */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><FileText size={14} className="shrink-0" />แผนงาน</label>
              <textarea name="plan" value={formData.plan} onChange={handleChange} placeholder="ระบุแผนงาน..." rows={2} />
            </div>

            {/* Start date */}
            <div className="field">
              <label><Calendar size={14} className="shrink-0" />วันที่เริ่มจัดกิจกรรม <span className="required">*</span></label>
              <input type="date" name="activity_start" value={formData.activity_start} onChange={handleChange} required />
            </div>

            {/* End date */}
            <div className="field">
              <label><Calendar size={14} className="shrink-0" />วันที่สิ้นสุดจัดกิจกรรม <span className="required">*</span></label>
              <input type="date" name="activity_end" value={formData.activity_end} onChange={handleChange} required />
            </div>

            {/* Location */}
            <div className="field">
              <label><MapPin size={14} className="shrink-0" />สถานที่จัดกิจกรรม <span className="required">*</span></label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="ระบุสถานที่" required />
            </div>

            {/* Participants */}
            <div className="field">
              <label><Users size={14} className="shrink-0" />จำนวนผู้เข้าร่วม</label>
              <div className="inputGroup">
                <input type="number" name="participant_count" value={formData.participant_count} onChange={handleChange} placeholder="ระบุจำนวน" min="0" />
                <span className="inputSuffix">คน</span>
              </div>
            </div>

            {/* Coordinator */}
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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

            {/* Coordinator Org */}
            <div className="field">
              <label><Building2 size={14} className="shrink-0" />หน่วยงานผู้ประสานงาน</label>
              <input type="text" name="coordinator_org" value={formData.coordinator_org} onChange={handleChange} placeholder="ระบุหน่วยงาน" />
            </div>

            {/* Notes */}
            <div className="field">
              <label><StickyNote size={14} className="shrink-0" />หมายเหตุ</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="ระบุหมายเหตุ..." rows={3} />
            </div>
          </div>
        </div>

        {/* Section 2: ประเภทย่อย */}
        <div className="panel formSection afu" style={{ animationDelay: "140ms" }}>
          <div className="sectionHead">
            <Tag size={18} className="text-blue-500" />
            <h3>ประเภทย่อย</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr" }}>
            {/* Activity Type */}
            <div className="field" style={{ marginBottom: "8px" }}>
              <label><Tag size={14} className="shrink-0" />ประเภทกิจกรรม <span className="required">*</span></label>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: "0 0 50%", border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-field)", overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--mou-line)", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                    <Search size={14} className="text-gray-400" />
                    <input type="text" placeholder="ค้นหาประเภท..." value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", background: "transparent" }} />
                  </div>
                  <div style={{ maxHeight: "140px", overflowY: "auto", padding: "4px" }}>
                    {filteredTypes.length > 0 ? filteredTypes.map((t) => (
                      <label key={t.id} className="multiSelectItem" style={{ padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", borderRadius: "4px" }}>
                        <input type="checkbox" checked={selectedTypeIds.includes(t.id)} onChange={() => toggleType(t.id)}
                          style={{ width: "16px", height: "16px", accentColor: "var(--mou-primary)", flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                      </label>
                    )) : (
                      <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>ไม่มีประเภทกิจกรรม</div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: "80px", border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-surface)", padding: "8px" }}>
                  <div style={{ fontSize: "12px", color: "var(--mou-muted)", marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} />เลือกแล้ว {selectedTypeIds.length} รายการ
                  </div>
                  {selectedTypeIds.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {selectedTypeIds.slice(0, 5).map((id) => {
                        const type = activityTypes.find((t) => t.id === id);
                        return (
                          <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 6px", borderRadius: "4px", background: "var(--mou-primary-soft)", fontSize: "12px" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{type?.name || `#${id}`}</span>
                            <button type="button" onClick={() => toggleType(id)} style={{ background: "none", border: "none", color: "var(--mou-primary)", cursor: "pointer", padding: "0 2px", flexShrink: 0 }} title="ลบ"><X size={10} /></button>
                          </div>
                        );
                      })}
                      {selectedTypeIds.length > 5 && (
                        <div style={{ fontSize: "11px", color: "var(--mou-muted)", textAlign: "center", padding: "2px" }}>+{selectedTypeIds.length - 5} รายการ</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--mou-muted-soft)", textAlign: "center", padding: "16px 0" }}>ยังไม่เลือก</div>
                  )}
                </div>
              </div>
            </div>

            {/* OKR */}
            <div className="field">
              <label><Target size={14} className="shrink-0" />สอดคล้องกับ OKR</label>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: "0 0 50%", border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-field)", overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--mou-line)", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                    <Search size={14} className="text-gray-400" />
                    <input type="text" placeholder="ค้นหา OKR..." value={okrSearch} onChange={(e) => setOkrSearch(e.target.value)}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", background: "transparent" }} />
                  </div>
                  <div style={{ maxHeight: "140px", overflowY: "auto", padding: "4px" }}>
                    {filteredOkrs.length > 0 ? filteredOkrs.map((o) => (
                      <label key={o.id} className="multiSelectItem" style={{ padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", borderRadius: "4px" }}>
                        <input type="checkbox" checked={selectedOkrIds.includes(o.id)} onChange={() => toggleOkr(o.id)}
                          style={{ width: "16px", height: "16px", accentColor: "var(--mou-primary)", flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</span>
                      </label>
                    )) : (
                      <div style={{ padding: "12px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>ไม่มี OKR</div>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, minHeight: "80px", border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-surface)", padding: "8px" }}>
                  <div style={{ fontSize: "12px", color: "var(--mou-muted)", marginBottom: "6px", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                    <Check size={12} />เลือกแล้ว {selectedOkrIds.length} รายการ
                  </div>
                  {selectedOkrIds.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      {selectedOkrIds.slice(0, 5).map((id) => {
                        const okr = okrs.find((o) => o.id === id);
                        return (
                          <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 6px", borderRadius: "4px", background: "#eef2ff", fontSize: "12px" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{okr?.title || `#${id}`}</span>
                            <button type="button" onClick={() => toggleOkr(id)} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer", padding: "0 2px", flexShrink: 0 }} title="ลบ"><X size={10} /></button>
                          </div>
                        );
                      })}
                      {selectedOkrIds.length > 5 && (
                        <div style={{ fontSize: "11px", color: "var(--mou-muted)", textAlign: "center", padding: "2px" }}>+{selectedOkrIds.length - 5} รายการ</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--mou-muted-soft)", textAlign: "center", padding: "16px 0" }}>ยังไม่เลือก</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: เอกสารแนบ */}
        <div className="panel formSection afu" style={{ animationDelay: "200ms" }}>
          <div className="sectionHead">
            <Paperclip size={18} className="text-blue-500" />
            <h3>เอกสารแนบ</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {/* File attachments */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Paperclip size={14} className="shrink-0" />ไฟล์แนบ</label>
              <div className="fileDrop" onClick={() => fileInputRef.current?.click()} style={{ position: "relative", cursor: "pointer", justifyContent: files.length > 0 ? "flex-start" : "center", paddingTop: files.length > 0 ? "36px" : "16px", minHeight: "80px" }}>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }} accept=".pdf,.doc,.docx,.txt" multiple />
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
                    <span style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>คลิกเพื่อเพิ่มไฟล์ (สูงสุด 3 ไฟล์ ไฟล์ละไม่เกิน 20 MB)</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <Upload size={22} style={{ color: "var(--mou-primary)" }} />
                    <span style={{ color: "#6b7280", fontSize: "13px" }}>PDF / DOC / TXT สูงสุด 3 ไฟล์ ไฟล์ละไม่เกิน 20 MB</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="footerActions afu" style={{ animationDelay: "300ms" }}>
          <button type="button" className="btn inline-flex items-center gap-2" onClick={() => router.push("/mou")}>
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
