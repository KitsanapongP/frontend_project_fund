"use client";

import React, { useEffect, use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { ChevronLeft, FileText, Upload } from "lucide-react";
import apiClient from "../../../../lib/api";
import { mouAPI } from "../../../../lib/mou_api";
import { useAuth } from "../../../../contexts/AuthContext";
import MouLayout from "../../components/MouLayout";

function Icon({ name }) {
  const paths = {
    rows: (
      <>
        <path d="M8 6h12" />
        <path d="M8 12h12" />
        <path d="M8 18h12" />
        <path d="M4 6h.01" />
        <path d="M4 12h.01" />
        <path d="M4 18h.01" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.rows}
    </svg>
  );
}

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().split("T")[0];
}

export default function AdminEditMouPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user } = useAuth();
  const redirectTimerRef = useRef(null);

  const [mou, setMou] = useState(null);
  const [mouTypes, setMouTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [facultyOpen, setFacultyOpen] = useState(false);
  const facultyRef = useRef(null);
  const [facultyUsers, setFacultyUsers] = useState({});
  const [facultyExternalNames, setFacultyExternalNames] = useState({});
  const [facultyExternalOrgs, setFacultyExternalOrgs] = useState({});
  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    mou_code: "",
    title: "",
    description: "",
    level: "",
    mou_type_id: "",
    status_id: "",
    is_international: "",
    start_date: "",
    end_date: "",
    year_of_signing: "",
    partner_name: "",
    partner_type: "",
    country_id: null,
    faculty_ids: [],
    coordinator_id: "",
    coordinator_name: "",
    signed_by: "",
    notes: "",
    notify_days_before: 0,
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (facultyRef.current && !facultyRef.current.contains(e.target)) {
        setFacultyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    loadData();
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mouRes, typesRes, countriesRes, usersRes, facultiesRes, statusesRes] = await Promise.all([
        mouAPI.getMouDetail(params.id),
        mouAPI.getMouTypes(),
        mouAPI.getCountries(),
        apiClient.get("/users"),
        mouAPI.getFaculties(),
        mouAPI.getMouStatuses(),
      ]);
      if (mouRes) {
        setMou(mouRes);
        setExistingAttachments(mouRes.attachments || []);
        const existingFacultyIds = (mouRes.faculties || [])
          .map((f) => f.faculty_id)
          .filter(Boolean);
        const facultyUserMap = {};
        const facultyExtNameMap = {};
        const facultyExtOrgMap = {};
        (mouRes.faculties || []).forEach((f) => {
          if (f.faculty_id) {
            if (f.user_id) {
              const u = (usersRes?.users || []).find((u) => u.user_id === f.user_id);
              if (u) facultyUserMap[f.faculty_id] = `${u.prefix || ""} ${u.user_fname || ""} ${u.user_lname || ""}`.trim();
            } else if (f.external_name) {
              facultyUserMap[f.faculty_id] = f.external_name;
            }
            if (f.external_name && !f.user_id) facultyExtNameMap[f.faculty_id] = f.external_name;
            if (f.external_org) facultyExtOrgMap[f.faculty_id] = f.external_org;
          }
        });
        setFacultyUsers(facultyUserMap);
        setFacultyExternalNames(facultyExtNameMap);
        setFacultyExternalOrgs(facultyExtOrgMap);
        setFormData({
          mou_code: mouRes.mou_code || "",
          title: mouRes.title || "",
          description: mouRes.description || "",
          level: mouRes.level || "",
          mou_type_id: mouRes.mou_type_id ? String(mouRes.mou_type_id) : "",
          status_id: mouRes.status_id ? String(mouRes.status_id) : "",
          is_international: mouRes.is_international ? "true" : "false",
          start_date: formatDateForInput(mouRes.start_date),
          end_date: formatDateForInput(mouRes.end_date),
          year_of_signing: mouRes.year_of_signing ? String(mouRes.year_of_signing) : "",
          partner_name: mouRes.partners?.[0]?.partner_org || "",
          partner_type: mouRes.partners?.[0]?.partner_type || "",
          country_id: mouRes.country_id ? String(mouRes.country_id) : "",
          faculty_ids: existingFacultyIds,
          coordinator_id: mouRes.coordinator_id ? String(mouRes.coordinator_id) : "",
          coordinator_name: "",
          signed_by: mouRes.signed_by ? String(mouRes.signed_by) : "",
          notes: mouRes.notes || "",
          notify_days_before: mouRes.notifications?.[0]?.days_before ?? 0,
        });
      }
      setMouTypes(typesRes || []);
      setCountries(countriesRes || []);
      setUsers(usersRes?.users || []);
      setFaculties(facultiesRes || []);
      setStatuses(statusesRes || []);
    } catch (err) {
      console.error("Error loading MOU:", err);
      setError("ไม่สามารถโหลดข้อมูล MOU ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const removeExistingAttachment = (id) => {
    setExistingAttachments((prev) => prev.filter((a) => a.id !== id));
    setRemovedAttachmentIds((prev) => [...prev, id]);
  };

  const totalAttachments = existingAttachments.length + files.length;

  const handleAISummary = async () => {
    if (files.length === 0) {
      setError("กรุณาเลือกไฟล์ก่อน");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const formDataFile = new FormData();
      formDataFile.append("file", files[0]);
      const res = await apiClient.postFormData("/mou/ai-summary", formDataFile);
      if (res?.summary) {
        setFormData((prev) => ({ ...prev, description: res.summary }));
      }
    } catch (err) {
      console.error("AI summary error:", err);
      setError("ไม่สามารถสรุปไฟล์ได้");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFacultyToggle = (fid) => {
    const exists = formData.faculty_ids.includes(fid);
    if (exists) {
      setFacultyUsers((prevU) => { const next = { ...prevU }; delete next[fid]; return next; });
      setFacultyExternalNames((prev) => { const next = { ...prev }; delete next[fid]; return next; });
      setFacultyExternalOrgs((prev) => { const next = { ...prev }; delete next[fid]; return next; });
    }
    setFormData((prev) => ({
      ...prev,
      faculty_ids: exists ? prev.faculty_ids.filter((id) => id !== fid) : [...prev.faculty_ids, fid],
    }));
  };

  const handleFacultyUserChange = (fid, value) => {
    setFacultyUsers((prev) => ({ ...prev, [fid]: value }));
  };

  const handleFacultyExternalNameChange = (fid, value) => {
    setFacultyExternalNames((prev) => ({ ...prev, [fid]: value }));
  };

  const handleFacultyExternalOrgChange = (fid, value) => {
    setFacultyExternalOrgs((prev) => ({ ...prev, [fid]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving("save");
    setError("");
    setSuccess("");

    try {
      if (!formData.mou_code || !formData.title || !formData.mou_type_id || !formData.start_date || !formData.end_date || !formData.partner_name) {
        setError("กรุณากรอกข้อมูลที่จำเป็นทั้งหมด");
        return;
      }

      const selectedUser = users.find(u => u.user_id === parseInt(formData.coordinator_id, 10));

      const globalExtName = facultyExternalNames["_global"] || "";
      const globalExtOrg = facultyExternalOrgs["_global"] || "";
      const facultiesArr = formData.faculty_ids.map((fid) => {
        const raw = (facultyUsers[fid] || "").trim();
        const matchedUser = users.find((u) => {
          const fullName = [u.prefix || "", u.user_fname || "", u.user_lname || ""].filter(Boolean).join(" ").trim();
          return fullName === raw;
        });
        return {
          faculty_id: fid,
          user_id: matchedUser ? matchedUser.user_id : 0,
          external_name: matchedUser ? null : (raw || null),
          external_org: null,
        };
      });

      if (globalExtName || globalExtOrg) {
        facultiesArr.push({
          faculty_id: 0,
          user_id: 0,
          external_name: globalExtName || null,
          external_org: globalExtOrg || null,
        });
      }

      const mouPayload = {
        mou_code: formData.mou_code,
        title: formData.title,
        description: formData.description,
        level: formData.level,
        mou_type_id: parseInt(formData.mou_type_id, 10),
        status_id: formData.status_id ? parseInt(formData.status_id) : null,
        is_international: formData.is_international === "true",
        start_date: formData.start_date ? formData.start_date.split("-").reverse().join("/") : "",
        end_date: formData.end_date ? formData.end_date.split("-").reverse().join("/") : "",
        year_of_signing: formData.year_of_signing ? parseInt(formData.year_of_signing, 10) : null,
        partner_name: formData.partner_name,
        partner_type: formData.partner_type,
        country_id: formData.country_id ? parseInt(formData.country_id, 10) : null,
        faculties: facultiesArr,
        coordinator_id: formData.coordinator_id ? parseInt(formData.coordinator_id, 10) : null,
        coordinator_name: selectedUser ? `${selectedUser.user_fname || ""} ${selectedUser.user_lname || ""}`.trim() : "",
        signed_by: formData.signed_by ? parseInt(formData.signed_by, 10) : null,
        notes: formData.notes || null,
        notify_days_before: formData.notify_days_before ? parseInt(formData.notify_days_before, 10) : null,
        removed_attachment_ids: removedAttachmentIds,
      };

      if (files.length > 0) {
        const formDataPayload = new FormData();
        formDataPayload.append("data", JSON.stringify(mouPayload));
        files.forEach((f, i) => formDataPayload.append("files", f));
        await apiClient.postFormData(`/mou/${params.id}`, formDataPayload);
      } else {
        await mouAPI.updateMou(params.id, mouPayload);
      }

      await Swal.fire({
        icon: "success",
        title: "บันทึกการแก้ไขสำเร็จ!",
        confirmButtonColor: "#2563eb",
        timer: 1500,
      });
      router.replace("/mou");
    } catch (err) {
      console.error("Error updating MOU:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return (
      <MouLayout subtitle="แก้ไข MOU">
        <div className="panel" style={{ textAlign: "center", padding: "24px" }}>โหลดข้อมูล...</div>
      </MouLayout>
    );
  }

  if (!mou) {
    return (
      <MouLayout subtitle="แก้ไข MOU">
        <div className="panel" style={{ textAlign: "center", padding: "24px", color: "#dc2626" }}>ไม่พบข้อมูล MOU</div>
      </MouLayout>
    );
  }

  return (
    <MouLayout subtitle="แก้ไข MOU">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
            <FileText size={22} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800" style={{ margin: 0 }}>
            แก้ไข MOU
          </h1>
        </div>
        <Link className="btn inline-flex items-center gap-2" href="/mou">
          <ChevronLeft size={16} />
          กลับ
        </Link>
      </div>

      {(error || success) && (
        <div className="panel" style={{ marginBottom: "18px" }}>
          {error && <div style={{ color: "#dc2626" }}>{error}</div>}
          {success && <div style={{ color: "#16a34a" }}>{success}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="panel formSection" style={{ position: "relative" }}>
          <div style={{ position: "absolute", top: "24px", right: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "var(--mou-muted)", fontWeight: 500 }}>สถานะ</span>
            <div style={{ position: "relative", minWidth: "140px" }}>
              <select
                name="status_id"
                value={formData.status_id}
                onChange={handleChange}
                style={{ width: "100%", minHeight: "30px", padding: "2px 28px 2px 10px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, background: "var(--mou-primary-soft)", color: "var(--mou-primary)", border: "1px solid var(--mou-line)", cursor: "pointer", appearance: "none", outline: "none" }}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--mou-primary)", pointerEvents: "none" }}>▾</span>
            </div>
          </div>
          <div className="sectionHead">
            <span className="sectionIcon">
              <Icon name="plus" />
            </span>
            <h3>ข้อมูลพื้นฐาน MOU</h3>
          </div>

          <div className="formGrid">
            <div className="field">
              <label>
                รหัส MOU <span className="required">*</span>
              </label>
              <input type="text" name="mou_code" value={formData.mou_code} onChange={handleChange} placeholder="เช่น MOU-67-001" required />
            </div>

            <div className="field">
              <label>
                ชื่อ MOU <span className="required">*</span>
              </label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="ระบุชื่อ MOU" required />
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><FileText size={14} className="shrink-0" />รายละเอียด</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="ระบุรายละเอียด..." rows="4" />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Upload size={14} className="shrink-0" />ไฟล์แนบ</label>
              <div className="fileDrop" onClick={() => fileInputRef.current?.click()} style={{ position: "relative", cursor: "pointer", justifyContent: totalAttachments > 0 ? "flex-start" : "center", paddingTop: totalAttachments > 0 ? "40px" : "12px" }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleAISummary(); }} disabled={aiLoading} style={{ position: "absolute", top: "8px", right: "8px", zIndex: 1, fontSize: "12px", padding: "4px 8px", border: "1px solid var(--mou-primary)", borderRadius: "4px", background: "var(--mou-primary-soft)", color: "var(--mou-primary)", cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                  {aiLoading ? "กำลังวิเคราะห์..." : "AI สรุปรายละเอียดอัตโนมัติ"}
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }} accept=".pdf,.doc,.docx,.txt" multiple />
                {totalAttachments > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                    {existingAttachments.map((att) => (
                      <div key={att.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "#fff", borderRadius: "4px", fontSize: "13px" }}>
                        <a href={att.file_path} target="_blank" rel="noopener noreferrer" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, color: "var(--mou-primary)", textDecoration: "none" }} title={att.file_name}>
                          {att.file_name}
                        </a>
                        <span style={{ margin: "0 6px", color: "#6b7280", whiteSpace: "nowrap" }}>{att.mime_type || "-"}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingAttachment(att.id); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "0 4px", fontWeight: "bold" }} title="ลบ">×</button>
                      </div>
                    ))}
                    {files.map((f, i) => (
                      <div key={`new-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", background: "#fff", borderRadius: "4px", fontSize: "13px" }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{f.name}</span>
                        <span style={{ margin: "0 6px", color: "#6b7280", whiteSpace: "nowrap" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "0 4px", fontWeight: "bold" }} title="ลบ">×</button>
                      </div>
                    ))}
                    <span style={{ fontSize: "12px", color: "#6b7280", textAlign: "center", marginTop: "2px" }}>คลิกเพื่อเพิ่มไฟล์ (สูงสุด 3 ไฟล์)</span>
                  </div>
                ) : (
                  <>
                    <span className="fileDropIcon">+</span>
                    <span className="fileDropText">วางไฟล์ PDF / DOC / TXT (สูงสุด 3 ไฟล์ ไฟล์ละไม่เกิน 20 MB)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="formGrid" style={{ marginTop: "18px", gridTemplateColumns: "140px 1fr 1fr 1fr" }}>
            <div className="field">
              <label>
                ระดับ <span className="required">*</span>
              </label>
              <select name="level" value={formData.level} onChange={handleChange}>
                <option value="">เลือกระดับ</option>
                <option value="university">มหาวิทยาลัย</option>
                <option value="faculty">คณะ</option>
              </select>
            </div>

            <div className="field">
              <label>
                ประเภท MOU <span className="required">*</span>
              </label>
              <select name="mou_type_id" value={formData.mou_type_id} onChange={handleChange} required>
                <option value="">เลือกประเภท</option>
                {mouTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>
                ขอบเขตความร่วมมือ <span className="required">*</span>
              </label>
              <select name="is_international" value={formData.is_international} onChange={handleChange}>
                <option value="">เลือกขอบเขต</option>
                <option value="true">ต่างประเทศ</option>
                <option value="false">ในประเทศ</option>
              </select>
            </div>

            {formData.is_international === "true" && (
              <div className="field">
                <label>ประเทศ</label>
                <select name="country_id" value={formData.country_id || ""} onChange={handleChange}>
                  <option value="">เลือกประเทศ</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>{country.name_th}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.level === "university" && (
            <>
              <div className="field" style={{ marginTop: "18px" }}>
                <label>คณะที่เข้าร่วม</label>
                <div style={{ display: "flex", gap: "18px" }}>
                  <div ref={facultyRef} style={{ flex: 1, border: "1px solid var(--mou-line)", borderRadius: "5px", background: "var(--mou-field)", overflow: "hidden" }}>
                    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--mou-line)", background: "#fff" }}>
                      <input
                        type="text"
                        placeholder="ค้นหาคณะ..."
                        value={facultySearch}
                        onChange={(e) => setFacultySearch(e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", background: "transparent" }}
                      />
                    </div>
                    <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                      {faculties
                        .filter((fac) => !facultySearch || fac.name_th.includes(facultySearch))
                        .map((fac) => (
                          <label key={fac.id} className="multiSelectItem" style={{ padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                            <input
                              type="checkbox"
                              checked={formData.faculty_ids.includes(fac.id)}
                              onChange={() => handleFacultyToggle(fac.id)}
                              style={{ width: "16px", height: "16px", accentColor: "var(--mou-primary)", flexShrink: 0 }}
                            />
                            {fac.name_th}
                          </label>
                        ))}
                    </div>
                  </div>
                  <div style={{ width: "280px", minHeight: "100px", border: "1px solid var(--mou-line)", borderRadius: "5px", background: "var(--mou-surface)", padding: "10px" }}>
                    <div style={{ fontSize: "13px", color: "var(--mou-muted)", marginBottom: "8px", fontWeight: 500 }}>
                      เลือกแล้ว {formData.faculty_ids.length} คณะ
                    </div>
                    {formData.faculty_ids.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {formData.faculty_ids.map((fid) => {
                          const fac = faculties.find((f) => f.id === fid);
                          return (
                            <div key={fid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderRadius: "4px", background: "var(--mou-primary-soft)", fontSize: "13px" }}>
                              <span>{fac?.name_th || `#${fid}`}</span>
                              <button type="button" onClick={() => handleFacultyToggle(fid)} style={{ background: "none", border: "none", color: "var(--mou-primary)", cursor: "pointer", fontSize: "16px", fontWeight: 600, padding: "0 2px" }}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: "13px", color: "var(--mou-muted-soft)", textAlign: "center", padding: "20px 0" }}>ยังไม่เลือกคณะ</div>
                    )}
                  </div>
                </div>
              </div>
              {formData.faculty_ids.length > 0 && (
                <>
                  <div className="formGrid" style={{ marginTop: "18px" }}>
                    {formData.faculty_ids.map((fid) => {
                      const fac = faculties.find((f) => f.id === fid);
                      return (
                        <div className="field" key={fid}>
                          <label>ผู้รับผิดชอบคณะ {fac?.name_th || `#${fid}`}</label>
                          <input
                            list={`faculty-user-${fid}`}
                            value={facultyUsers[fid] || ""}
                            onChange={(e) => handleFacultyUserChange(fid, e.target.value)}
                            placeholder="พิมพ์ค้นหาชื่อหรือพิมพ์ชื่อที่ไม่มีในรายการ"
                          />
                          <datalist id={`faculty-user-${fid}`}>
                            {users.map((u) => (
                              <option key={u.user_id} value={`${u.prefix || ""} ${u.user_fname || ""} ${u.user_lname || ""}`.trim()} />
                            ))}
                          </datalist>
                        </div>
                      );
                    })}
                  </div>
                  <div className="formGrid" style={{ marginTop: "10px" }}>
                    <div className="field">
                      <label>ชื่อผู้รับผิดชอบภายนอก</label>
                      <input
                        type="text"
                        value={facultyExternalNames["_global"] || ""}
                        onChange={(e) => handleFacultyExternalNameChange("_global", e.target.value)}
                        placeholder="ระบุชื่อ (กรณีผู้รับผิดชอบไม่ใช่บุคลากรในคณะ)"
                      />
                    </div>
                    <div className="field">
                      <label>หน่วยงานผู้รับผิดชอบภายนอก</label>
                      <input
                        type="text"
                        value={facultyExternalOrgs["_global"] || ""}
                        onChange={(e) => handleFacultyExternalOrgChange("_global", e.target.value)}
                        placeholder="ระบุหน่วยงาน"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="formGrid" style={{ marginTop: "18px" }}>
            <div className="field">
              <label>
                หน่วยงานคู่สัญญา <span className="required">*</span>
              </label>
              <input type="text" name="partner_name" value={formData.partner_name} onChange={handleChange} placeholder="ชื่อหน่วยงาน" required />
            </div>

            <div className="field">
              <label>ประเภทคู่สัญญา</label>
              <select name="partner_type" value={formData.partner_type} onChange={handleChange}>
                <option value="">เลือกประเภท</option>
                <option value="มหาวิทยาลัย">มหาวิทยาลัย</option>
                <option value="บริษัท">บริษัท</option>
                <option value="หน่วยงานรัฐ">หน่วยงานรัฐ</option>
                <option value="องค์กรไม่แสวงหาผลกำไร">องค์กรไม่แสวงหาผลกำไร</option>
                <option value="สถาบันวิจัย">สถาบันวิจัย</option>
                <option value="อื่นๆ">อื่นๆ</option>
              </select>
            </div>
          </div>

          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "18px" }}>
            <div className="field">
              <label>ปีที่ลงนาม (ค.ศ.)</label>
              <input type="number" name="year_of_signing" value={formData.year_of_signing || ""} onChange={handleChange} min="1900" max="2155" placeholder="เช่น 2024" />
            </div>
            <div className="field">
              <label>ลงนามโดย</label>
              <select name="signed_by" value={formData.signed_by} onChange={handleChange}>
                <option value="">เลือกผู้ลงนาม</option>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.prefix || ""} {user.user_fname} {user.user_lname}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>วันที่เริ่มต้น <span className="required">*</span></label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>วันที่สิ้นสุด <span className="required">*</span></label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
            </div>
            <div className="field">
              <label>ผู้ประสานงาน <span className="required">*</span></label>
              <select name="coordinator_id" value={formData.coordinator_id} onChange={handleChange} required>
                <option value="">เลือกผู้ประสานงาน</option>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.prefix || ""} {user.user_fname} {user.user_lname}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>แจ้งเตือนก่อนสิ้นสุด</label>
              <div className="inputGroup">
                <input type="number" name="notify_days_before" value={formData.notify_days_before} onChange={handleChange} min="0" />
                <span className="inputSuffix">วัน</span>
              </div>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>หมายเหตุ</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="ระบุหมายเหตุ..." rows={3} />
            </div>
          </div>
        </div>

        <div className="footerActions">
          <button type="button" className="btn" onClick={() => router.push("/mou")}>
            ยกเลิก
          </button>
          <button type="submit" className="btn primary" disabled={saving === "save"}>
            {saving === "save" ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>
      </form>
    </MouLayout>
  );
}
