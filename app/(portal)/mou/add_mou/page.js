"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Plus, FileSignature, Hash, FileText, Building2, Globe, Calendar,
  User, AlertCircle, CheckCircle, X, ChevronLeft, Upload,
  Sparkles, Search, Users, Clock, Bookmark, Layers, Tag, ChevronDown,
  AlignLeft, Tags, MapPin, UserPlus, Briefcase, Handshake, UserCheck, Key, StickyNote, MinusCircle
} from "lucide-react";
import apiClient from "../../../lib/api";
import { mouAPI } from "../../../lib/mou_api";
import MouLayout from "../components/MouLayout";

function Select({ value, onChange, options, placeholder = "เลือก", name, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const portalRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));
  const displayLabel = selected ? selected.label : placeholder;

  const filtered = searchable && query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target) && portalRef.current && !portalRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    if (searchable && inputRef.current) inputRef.current.focus();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, searchable, updatePos]);

  const select = useCallback(
    (val) => {
      onChange({ target: { name, value: val } });
      setOpen(false);
      setQuery("");
    },
    [name, onChange]
  );

  const onKeyDown = (e) => {
    if (searchable) {
      if (e.key === "ArrowDown" && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
        return;
      }
      if (!open) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIdx((i) => (i < filtered.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIdx((i) => (i > 0 ? i - 1 : filtered.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIdx >= 0 && filtered[focusedIdx]) {
            select(filtered[focusedIdx].value);
          } else {
            setOpen(false);
            setQuery("");
          }
          break;
      }
      return;
    }
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setFocusedIdx(0);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIdx((i) => (i < options.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIdx((i) => (i > 0 ? i - 1 : options.length - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIdx >= 0 && options[focusedIdx]) select(options[focusedIdx].value);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange({ target: { name, value: val } });
    if (!open) setOpen(true);
  };

  const toggle = () => setOpen((o) => !o);

  return (
    <div ref={ref} className="csWrap" onKeyDown={onKeyDown}>
      {searchable ? (
        <div ref={triggerRef} className={`csBtn${open ? " open" : ""}${value ? " hasVal" : ""}`} style={{ padding: 0, overflow: "hidden", alignItems: "stretch" }}>
          <input ref={inputRef} type="text" className="csInput" value={query || displayLabel} onChange={handleInputChange} onFocus={() => setOpen(true)} placeholder={placeholder} />
          <div style={{ display: "flex", alignItems: "center", paddingRight: 8, cursor: "pointer" }} onClick={toggle}>
            <ChevronDown size={18} className={`csArrow${open ? " open" : ""}`} />
          </div>
        </div>
      ) : (
        <button ref={triggerRef} type="button" className={`csBtn${open ? " open" : ""}${value ? " hasVal" : ""}`} onClick={toggle} aria-haspopup="listbox" aria-expanded={open}>
          <span className="csLabel">{displayLabel}</span>
          <ChevronDown size={18} className={`csArrow${open ? " open" : ""}`} />
        </button>
      )}
      {open && typeof document !== "undefined" && createPortal(
        <ul ref={portalRef} className="csDropdownPortal" role="listbox" style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}>
          {filtered.length === 0 ? (
            <li className="csOpt" style={{ color: "#9ca3af", cursor: "default", textAlign: "center" }}>ไม่มีรายการ</li>
          ) : (
            filtered.map((opt, idx) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={String(value) === String(opt.value)}
                className={`csOpt${String(value) === String(opt.value) ? " sel" : ""}${idx === focusedIdx ? " foc" : ""}`}
                onClick={() => select(opt.value)}
                onMouseEnter={() => setFocusedIdx(idx)}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}

export default function AddMouPage() {
  const router = useRouter();
  const redirectTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    mou_code: "",
    title: "",
    description: "",
    level: "",
    is_international: "",
    start_date: "",
    end_date: "",
    year_of_signing: "",
    partner_name: "",
    partner_type_id: "",
    country_id: null,
    faculty_ids: [],
    coordinator_id: "",
    coordinator_name: "",
    signed_by: "",
    notes: "",
    notify_days_before: "",
  });
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [users, setUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [facultySearch, setFacultySearch] = useState("");
  const [facultyUsers, setFacultyUsers] = useState({});
  const [facultyExternalNames, setFacultyExternalNames] = useState({});
  const [facultyExternalOrgs, setFacultyExternalOrgs] = useState({});
  const [facultyEmails, setFacultyEmails] = useState({});
  const [externalPersons, setExternalPersons] = useState([]);
  const externalPersonIdCounter = useRef(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadReferenceData();
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const loadReferenceData = async () => {
    try {
      const [countriesResponse, usersResponse, facultiesResponse, partnerTypesResponse] = await Promise.all([
        mouAPI.getCountries(),
        apiClient.get("/users"),
        mouAPI.getFaculties(),
        mouAPI.getMouPartnerTypes(),
      ]);
      setCountries(countriesResponse || []);
      setUsers(usersResponse?.users || []);
      setFaculties(facultiesResponse || []);
      setPartnerTypes(partnerTypesResponse || []);
    } catch (err) {
      console.error("Error loading reference data:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      setFacultyUsers((prevU) => {
        const next = { ...prevU };
        delete next[fid];
        return next;
      });
      setFacultyExternalNames((prev) => {
        const next = { ...prev };
        delete next[fid];
        return next;
      });
      setFacultyExternalOrgs((prev) => {
        const next = { ...prev };
        delete next[fid];
        return next;
      });
      setFacultyEmails((prev) => {
        const next = { ...prev };
        delete next[fid];
        return next;
      });
    }
    setFormData((prev) => ({
      ...prev,
      faculty_ids: exists ? prev.faculty_ids.filter((id) => id !== fid) : [...prev.faculty_ids, fid],
    }));
  };

  const handleFacultyUserChange = (fid, value) => {
    setFacultyUsers((prev) => ({ ...prev, [fid]: value }));
    if (fid === COMPUTING_FACULTY_ID) {
      const matchedUser = users.find((u) => {
        const fullName = [u.prefix || "", u.user_fname || "", u.user_lname || ""].filter(Boolean).join(" ").trim();
        return fullName === value.trim();
      });
      if (matchedUser) {
        setFacultyEmails((prev) => ({ ...prev, [fid]: matchedUser.email || "" }));
      }
    }
  };

  const handleFacultyExternalNameChange = (fid, value) => {
    setFacultyExternalNames((prev) => ({ ...prev, [fid]: value }));
  };

  const handleFacultyExternalOrgChange = (fid, value) => {
    setFacultyExternalOrgs((prev) => ({ ...prev, [fid]: value }));
  };

  const handleFacultyEmailChange = (fid, value) => {
    setFacultyEmails((prev) => ({ ...prev, [fid]: value }));
  };

  const addExternalPerson = () => {
    externalPersonIdCounter.current += 1;
    setExternalPersons((prev) => [...prev, { id: externalPersonIdCounter.current, name: "", org: "", email: "" }]);
  };

  const updateExternalPerson = (id, field, value) => {
    setExternalPersons((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removeExternalPerson = (id) => {
    setExternalPersons((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e, asDraft = true) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSaving(asDraft ? "draft" : "save");
    setError("");
    setSuccess("");

    try {
      if (!formData.title || !formData.start_date || !formData.end_date || !formData.partner_name) {
        setError("กรุณากรอกข้อมูลที่จำเป็นทั้งหมด");
        return;
      }

      if (formData.faculty_ids.length > 0) {
        const missing = formData.faculty_ids.filter((fid) => !facultyUsers[fid]);
        if (missing.length > 0) {
          setError("กรุณาเลือกผู้รับผิดชอบทุกคณะที่เข้าร่วม");
          return;
        }
      }

      const selectedUser = users.find(u => u.user_id === parseInt(formData.coordinator_id, 10));

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
          email: facultyEmails[fid] || null,
        };
      });

      externalPersons.forEach((p) => {
        if (p.name || p.org || p.email) {
          facultiesArr.push({
            faculty_id: 0,
            user_id: 0,
            external_name: p.name || null,
            external_org: p.org || null,
            email: p.email || null,
          });
        }
      });

      const mouPayload = {
        mou_code: formData.mou_code || null,
        title: formData.title,
        description: formData.description,
        level: formData.level,
        status_id: asDraft ? 1 : 2,
        is_international: formData.is_international === "true",
        start_date: formData.start_date ? formData.start_date.split("-").reverse().join("/") : "",
        end_date: formData.end_date ? formData.end_date.split("-").reverse().join("/") : "",
        year_of_signing: formData.year_of_signing || null,
        partner_name: formData.partner_name,
        partner_type_id: parseInt(formData.partner_type_id) || 0,
        country_id: formData.country_id ? parseInt(formData.country_id, 10) : null,
        faculties: facultiesArr,
        coordinator_id: formData.coordinator_id ? parseInt(formData.coordinator_id, 10) : null,
        coordinator_name: selectedUser ? `${selectedUser.user_fname || ""} ${selectedUser.user_lname || ""}`.trim() : "",
        signed_by: formData.signed_by || null,
        notes: formData.notes,
        notify_days_before: formData.notify_days_before ? parseInt(formData.notify_days_before, 10) : null,
      };

      if (files.length > 0) {
        const formDataPayload = new FormData();
        formDataPayload.append("data", JSON.stringify(mouPayload));
        files.forEach((f, i) => formDataPayload.append("files", f));
        await apiClient.postFormData("/mou", formDataPayload);
      } else {
        await mouAPI.createMou(mouPayload);
      }

      await Swal.fire({
        icon: "success",
        title: asDraft ? "บันทึกร่าง MOU สำเร็จ!" : "บันทึก MOU สำเร็จ!",
        confirmButtonColor: "#2563eb",
        timer: 1500,
      });
      setFormData({
        mou_code: "",
        title: "",
        description: "",
        level: "",
        is_international: "",
        start_date: "",
        end_date: "",
        year_of_signing: "",
        partner_name: "",
        partner_type_id: "",
        country_id: null,
        faculty_ids: [],
        coordinator_id: "",
        coordinator_name: "",
        signed_by: "",
        notes: "",
        notify_days_before: "",
      });
      setFiles([]);
      setFacultyUsers({});
      setFacultyExternalNames({});
      setFacultyExternalOrgs({});
      setFacultyEmails({});
      setExternalPersons([]);
      externalPersonIdCounter.current = 0;
      router.replace("/mou");
    } catch (err) {
      console.error("Error creating MOU:", err);
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setLoading(false);
      setSaving("");
    }
  };

  const COMPUTING_FACULTY_ID = 6;
  const sortedFacultyIds = useMemo(() => {
    const ids = [...formData.faculty_ids];
    const idx = ids.indexOf(COMPUTING_FACULTY_ID);
    if (idx > 0) {
      ids.splice(idx, 1);
      ids.unshift(COMPUTING_FACULTY_ID);
    }
    return ids;
  }, [formData.faculty_ids]);

  const getUserFullName = (u) => [u.prefix || "", u.user_fname || "", u.user_lname || ""].filter(Boolean).join(" ").trim();

  return (
    <MouLayout subtitle="เพิ่ม MOU">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .afu { animation: fadeInUp 0.35s ease-out both; }
        .afi { animation: fadeIn 0.25s ease-out both; }
        .asd { animation: slideDown 0.3s ease-out both; }
        .mouRoot .field label { font-weight: 600 !important; color: #374151 !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; flex-wrap: wrap !important; }
        .formSection .field label { font-weight: 500 !important; }
        .mouRoot .field input:not([type="date"]), .mouRoot .field textarea { color: #111827 !important; }
        .mouRoot .field input::placeholder, .mouRoot .field textarea::placeholder { color: #9ca3af !important; }
        .mouRoot .field input[type="date"]:required:invalid { color: #9ca3af !important; }
        .mouRoot .field input[type="date"]:valid { color: #111827 !important; }
        .mouRoot .field select { color: #9ca3af !important; }
        .mouRoot .field select:focus, .mouRoot .field select:has(option:checked:not([value=""])) { color: #111827 !important; }

        .csWrap { position: relative; width: 100%; }
        .csBtn {
          width: 100%; min-height: 42px; border: 1px solid #d1d5db; border-radius: 8px;
          background: #fff; color: #9ca3af; padding: 8px 12px 8px 14px; font-size: 14px;
          outline: none; cursor: pointer; display: flex; align-items: center;
          justify-content: space-between; gap: 8px; text-align: left; font-family: inherit;
          line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .csBtn:hover { border-color: #a78bfa; background: #fafafa; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .csBtn.open, .csBtn:focus-visible { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12), 0 1px 2px rgba(0,0,0,0.04); }
        .csBtn.hasVal { color: #111827; }
        .csLabel { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .csInput { flex: 1; border: none; outline: none; background: transparent; padding: 8px 14px; font-size: 14px; font-family: inherit; color: #111827; min-width: 0; }
        .csArrow { flex-shrink: 0; color: #9ca3af; transition: transform 0.25s ease; }
        .csArrow.open { transform: rotate(180deg); }
        .csDropdown, .csDropdownPortal {
          max-height: 240px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 10px;
          background: #fff; box-shadow: 0 8px 28px rgba(0,0,0,0.13); padding: 4px;
          animation: csIn 0.2s ease-out; transform-origin: top center;
        }
        @keyframes csIn {
          from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        .csOpt {
          padding: 8px 12px; font-size: 14px; cursor: pointer; border-radius: 6px;
          list-style: none; color: #111827; transition: background 0.15s ease, color 0.15s ease;
        }
        .csOpt:hover, .csOpt.foc, .csDropdownPortal .csOpt:hover, .csDropdownPortal .csOpt.foc { background: #eff6ff; color: #2563eb; }
        .csOpt.sel, .csDropdownPortal .csOpt.sel { background: #2563eb; color: #fff; font-weight: 500; }
        .csOpt.sel:hover, .csDropdownPortal .csOpt.sel:hover { background: #1d4ed8; }
        .csDropdown::-webkit-scrollbar, .csDropdownPortal::-webkit-scrollbar { width: 4px; }
        .csDropdown::-webkit-scrollbar-track, .csDropdownPortal::-webkit-scrollbar-track { background: transparent; }
        .csDropdown::-webkit-scrollbar-thumb, .csDropdownPortal::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>

      {/* Page Title */}
      <div className="flex items-center justify-between mb-6 afu" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
            <Plus size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ margin: 0, lineHeight: 1.2 }}>
              เพิ่ม MOU ใหม่
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">สร้างบันทึกข้อตกลงความร่วมมือฉบับใหม่</p>
          </div>
        </div>
        <button type="button" className="btn inline-flex items-center gap-2" onClick={() => router.back()}>
          <ChevronLeft size={16} />
          กลับ
        </button>
      </div>

      {(error || success) && (
        <div className="panel asd" style={{ marginBottom: "18px", display: "flex", alignItems: "center", gap: 8 }}>
          {error && <><AlertCircle size={18} style={{ color: "#dc2626", flexShrink: 0 }} /><span style={{ color: "#dc2626" }}>{error}</span></>}
          {success && <><CheckCircle size={18} style={{ color: "#16a34a", flexShrink: 0 }} /><span style={{ color: "#16a34a" }}>{success}</span></>}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, true)}>
        <div className="panel formSection afu" style={{ animationDelay: "80ms" }}>
          <div className="sectionHead">
            <FileText size={18} className="text-blue-500" />
            <h3>ข้อมูล MOU</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label><FileText size={14} className="shrink-0" />ชื่อ MOU <span className="required">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="ระบุชื่อ MOU" required />
            </div>
            <div className="field">
              <label><Key size={14} className="shrink-0" />รหัส MOU</label>
              <input type="text" name="mou_code" value={formData.mou_code} onChange={handleChange} placeholder="ระบุรหัส MOU" />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><AlignLeft size={14} className="shrink-0" />รายละเอียด</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="ระบุรายละเอียด..." rows={3} />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Upload size={14} className="shrink-0" />ไฟล์แนบ</label>
              <div className="fileDrop" onClick={() => fileInputRef.current?.click()} style={{ position: "relative", cursor: "pointer", justifyContent: files.length > 0 ? "flex-start" : "center", paddingTop: files.length > 0 ? "36px" : "16px", minHeight: "80px" }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleAISummary(); }} disabled={aiLoading} className="aiBtn" style={{ position: "absolute", top: "6px", right: "6px" }}>
                  <Sparkles size={12} />
                  {aiLoading ? "กำลังวิเคราะห์..." : "AI สรุปรายละเอียด"}
                </button>
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
                    <span style={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}>คลิกเพื่อเพิ่มไฟล์ (สูงสุด 3 ไฟล์)</span>
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

        <div className="panel formSection afu" style={{ animationDelay: "120ms" }}>
          <div className="sectionHead">
            <Layers size={18} className="text-blue-500" />
            <h3>ความร่วมมือ</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label><Layers size={14} className="shrink-0" />ระดับ <span className="required">*</span></label>
              <Select name="level" value={formData.level} onChange={handleChange} placeholder="เลือกระดับ" options={[
                { value: "university", label: "มหาวิทยาลัย" },
                { value: "faculty", label: "คณะ" },
              ]} />
            </div>
            <div className="field">
              <label><Globe size={14} className="shrink-0" />ขอบเขต <span className="required">*</span></label>
              <Select name="is_international" value={formData.is_international} onChange={handleChange} placeholder="เลือกขอบเขต" options={[
                { value: "true", label: "ต่างประเทศ" },
                { value: "false", label: "ในประเทศ" },
              ]} />
            </div>
            {formData.is_international === "true" && (
              <div className="field">
                <label><MapPin size={14} className="shrink-0" />ประเทศ</label>
                <Select name="country_id" value={formData.country_id || ""} onChange={handleChange} placeholder="เลือกประเทศ" options={countries.map((c) => ({ value: c.id, label: c.name_th }))} />
              </div>
            )}
            {formData.level === "university" && (
              <div className="field" style={{ gridColumn: "1 / -1", marginTop: "8px" }}>
                <label><Building2 size={14} className="shrink-0" />คณะที่เข้าร่วม</label>
                <div style={{ display: "flex", gap: "12px", height: "260px" }}>
                  <div style={{ flex: 1, border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-field)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--mou-line)", background: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                      <Search size={14} className="text-gray-400" />
                      <input type="text" placeholder="ค้นหาคณะ..." value={facultySearch} onChange={(e) => setFacultySearch(e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", background: "transparent" }} />
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2px", padding: "4px" }}>
                      {faculties.filter((fac) => !facultySearch || fac.name_th.includes(facultySearch)).map((fac) => (
                        <label key={fac.id} className="multiSelectItem" style={{ padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", borderRadius: "4px" }}>
                          <input type="checkbox" checked={formData.faculty_ids.includes(fac.id)} onChange={() => handleFacultyToggle(fac.id)}
                            style={{ width: "16px", height: "16px", accentColor: "var(--mou-primary)", flexShrink: 0 }} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fac.name_th}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ width: "240px", border: "1px solid var(--mou-line)", borderRadius: "8px", background: "var(--mou-surface)", padding: "10px", overflowY: "auto" }}>
                    <div style={{ fontSize: "13px", color: "var(--mou-muted)", marginBottom: "8px", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={14} />เลือกแล้ว {formData.faculty_ids.length} คณะ
                    </div>
                    {formData.faculty_ids.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {sortedFacultyIds.map((fid) => {
                          const fac = faculties.find((f) => f.id === fid);
                          const isComputing = fid === COMPUTING_FACULTY_ID;
                          return (
                            <div key={fid} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderRadius: "6px", background: isComputing ? "#eff6ff" : "var(--mou-primary-soft)", fontSize: "13px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                {isComputing && <Sparkles size={11} className="text-blue-500" />}
                                {fac?.name_th || `#${fid}`}
                              </span>
                              <button type="button" onClick={() => handleFacultyToggle(fid)} style={{ background: "none", border: "none", color: "var(--mou-primary)", cursor: "pointer", padding: "0 2px" }} title="ลบ"><X size={12} /></button>
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
            )}
          </div>
        </div>

        {formData.level === "university" && formData.faculty_ids.length > 0 && (
          <div className="panel formSection afu" style={{ animationDelay: "160ms" }}>
            <div className="sectionHead">
              <User size={18} className="text-blue-500" />
              <h3>ผู้รับผิดชอบ</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {sortedFacultyIds.map((fid) => {
                const fac = faculties.find((f) => f.id === fid);
                const isComputing = fid === COMPUTING_FACULTY_ID;
                return (
                  <div key={fid} style={{ border: "1px solid var(--mou-line)", borderRadius: 10, padding: "14px 16px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mou-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={14} style={{ color: "var(--mou-primary)" }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mou-text)" }}>
                        {isComputing ? `คณะ${fac?.name_th || `#${fid}`}` : fac?.name_th || `#${fid}`}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        {isComputing ? (
                          <Select value={facultyUsers[fid] || ""} onChange={(e) => handleFacultyUserChange(fid, e.target.value)}
                            placeholder="เลือกหรือพิมพ์ชื่อผู้รับผิดชอบ" searchable
                            options={users.map((u) => ({ value: getUserFullName(u), label: getUserFullName(u) }))} />
                        ) : (
                          <input type="text" value={facultyUsers[fid] || ""} onChange={(e) => handleFacultyUserChange(fid, e.target.value)}
                            placeholder="ระบุชื่อผู้รับผิดชอบ" required />
                        )}
                      </div>
                      <input type="email" value={facultyEmails[fid] || ""} onChange={(e) => handleFacultyEmailChange(fid, e.target.value)}
                        placeholder="อีเมล" style={{ width: "220px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* External responsible persons */}
            <div style={{ marginTop: 16 }}>
              <div className="formGrid" style={{ gridTemplateColumns: "1fr" }}>
                {externalPersons.map((p) => (
                  <div key={p.id} style={{ position: "relative", border: "1px solid var(--mou-line)", borderRadius: 10, padding: "14px 16px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <button type="button" onClick={() => removeExternalPerson(p.id)}
                      style={{ position: "absolute", top: 8, right: 8, background: "none", border: "none", color: "var(--mou-primary)", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--mou-primary-soft)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                      title="ลบ">
                      <MinusCircle size={18} />
                    </button>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 13 }}><UserPlus size={13} className="shrink-0" />ชื่อผู้รับผิดชอบภายนอก <span className="required">*</span></label>
                        <input type="text" value={p.name} onChange={(e) => updateExternalPerson(p.id, "name", e.target.value)} placeholder="ชื่อ" required />
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 13 }}><Briefcase size={13} className="shrink-0" />หน่วยงาน</label>
                        <input type="text" value={p.org} onChange={(e) => updateExternalPerson(p.id, "org", e.target.value)} placeholder="หน่วยงาน" />
                      </div>
                      <div className="field" style={{ margin: 0 }}>
                        <label style={{ fontSize: 13 }}><FileText size={13} className="shrink-0" />อีเมล <span className="required">*</span></label>
                        <input type="email" value={p.email} onChange={(e) => updateExternalPerson(p.id, "email", e.target.value)} placeholder="อีเมล" required />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addExternalPerson}
                style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", border: "1px dashed var(--mou-primary)", borderRadius: 8, background: "var(--mou-primary-soft)", color: "var(--mou-primary)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                <Plus size={15} /> เพิ่มผู้รับผิดชอบภายนอก
              </button>
            </div>
          </div>
        )}

        <div className="panel formSection afu" style={{ animationDelay: "200ms" }}>
          <div className="sectionHead">
            <Handshake size={18} className="text-blue-500" />
            <h3>คู่สัญญาและกำหนดการ</h3>
          </div>
          <div className="formGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label><Handshake size={14} className="shrink-0" />หน่วยงานคู่สัญญา <span className="required">*</span></label>
              <input type="text" name="partner_name" value={formData.partner_name} onChange={handleChange} placeholder="ชื่อหน่วยงาน" required />
            </div>
            <div className="field">
              <label><Tag size={14} className="shrink-0" />ประเภทคู่สัญญา <span className="required">*</span></label>
               <Select name="partner_type_id" value={formData.partner_type_id} onChange={handleChange} placeholder="เลือกประเภท" options={partnerTypes.map(t => ({value: t.id, label: t.name_th}))} />
            </div>
            <div className="field">
              <label><Bookmark size={14} className="shrink-0" />วันเดือนปีที่ลงนาม</label>
              <input type="date" name="year_of_signing" value={formData.year_of_signing || ""} onChange={handleChange} placeholder="เช่น 2024-06-01" />
            </div>
            <div className="field">
              <label><FileSignature size={14} className="shrink-0" />ลงนามโดย</label>
              <input type="text" name="signed_by" value={formData.signed_by || ""} onChange={handleChange} placeholder="ชื่อผู้ลงนาม" />
            </div>
            <div className="field">
              <label><Calendar size={14} className="shrink-0" />วันที่เริ่มต้น <span className="required">*</span></label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
            </div>
            <div className="field">
              <label><Calendar size={14} className="shrink-0" />วันที่สิ้นสุด <span className="required">*</span></label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
            </div>
            <div className="field">
              <label><UserCheck size={14} className="shrink-0" />ผู้ประสานงาน <span className="required">*</span></label>
              <Select name="coordinator_id" value={formData.coordinator_id} onChange={handleChange} placeholder="เลือกผู้ประสานงาน" options={users.map((u) => ({ value: u.user_id, label: getUserFullName(u) }))} />
            </div>
            <div className="field">
              <label><Clock size={14} className="shrink-0" />แจ้งเตือนก่อนสิ้นสุด</label>
              <div className="inputGroup">
                <input type="number" name="notify_days_before" value={formData.notify_days_before} onChange={handleChange} min="0" placeholder="ระบุจำนวนวัน" />
                <span className="inputSuffix">วัน</span>
              </div>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><StickyNote size={14} className="shrink-0" />หมายเหตุ</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="ระบุหมายเหตุ..." rows={3} />
            </div>
          </div>
        </div>

        <div className="footerActions afu" style={{ animationDelay: "300ms" }}>
          <button type="button" className="btn inline-flex items-center gap-2" onClick={() => router.back()}>
            <X size={16} />ยกเลิก
          </button>
          <button type="submit" className="btn soft inline-flex items-center gap-2" style={{ border: "1px solid var(--mou-primary)" }} disabled={loading}>
            {loading && saving === "draft" ? "กำลังบันทึก..." : <><CheckCircle size={16} />บันทึกร่าง</>}
          </button>
          <button type="button" className="btn primary inline-flex items-center gap-2" disabled={loading} onClick={() => handleSubmit(null, false)}>
            {loading && saving === "save" ? "กำลังบันทึก..." : <><FileSignature size={16} />บันทึก MOU</>}
          </button>
        </div>
      </form>
    </MouLayout>
  );
}
