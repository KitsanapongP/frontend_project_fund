"use client";

import React, { useEffect, use, useRef, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { ChevronLeft, ChevronDown, FileText, Upload, Layers, User, Handshake, Plus, Briefcase, UserPlus, MinusCircle, Key } from "lucide-react";
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

function statusClass(name) {
  const v = (name || "").toLowerCase();
  if (v.includes("มีผล")) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300";
  if (v.includes("ใกล้")) return "bg-amber-50 text-amber-700 ring-1 ring-amber-300";
  if (v.includes("หมด")) return "bg-red-50 text-red-700 ring-1 ring-red-300";
  if (v.includes("รอดำเนินการ") || v.includes("กำลังดำเนินการ")) return "bg-blue-50 text-blue-700 ring-1 ring-blue-300";
  return "bg-gray-50 text-gray-600 ring-1 ring-gray-300";
}

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
          <input ref={inputRef} type="text" className="csInput" value={query || (value ? displayLabel : "")} onChange={handleInputChange} onFocus={() => setOpen(true)} placeholder={placeholder} />
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

function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  const tIndex = dateStr.indexOf("T");
  if (tIndex !== -1) return dateStr.substring(0, tIndex);
  return dateStr;
}

export default function AdminEditMouPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user } = useAuth();
  const redirectTimerRef = useRef(null);

  const [mou, setMou] = useState(null);
  const [partnerTypes, setPartnerTypes] = useState([]);
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
  const [facultyEmails, setFacultyEmails] = useState({});
  const [externalPersons, setExternalPersons] = useState([]);
  const externalPersonIdCounter = useRef(0);
  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentStatusName, setCurrentStatusName] = useState("");
  const fileInputRef = useRef(null);
  const coorRef = useRef(null);
  const [coorQuery, setCoorQuery] = useState("");
  const [coorOpen, setCoorOpen] = useState(false);

  const filteredCoorUsers = coorQuery.trim()
    ? users.filter(u =>
        [u.prefix || "", u.user_fname || "", u.user_lname || ""].filter(Boolean).join(" ").toLowerCase().includes(coorQuery.toLowerCase())
      )
    : users;

  useEffect(() => {
    const handler = (e) => {
      if (coorRef.current && !coorRef.current.contains(e.target)) {
        setCoorOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    mou_code: "",
    description: "",
    level: "",
    status_id: "",
    is_international: "",
    start_date: "",
    end_date: "",
    year_of_signing: "",
    partner_name: "",
    partner_type_id: "",
    country_id: null,
    faculty_ids: [],
    coordinator_id: "",
    coordinator_other: "",
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
      const [mouRes, countriesRes, usersRes, facultiesRes, statusesRes, partnerTypesRes] = await Promise.all([
        mouAPI.getMouDetail(params.id),
        mouAPI.getCountries(),
        apiClient.get("/users"),
        mouAPI.getFaculties(),
        mouAPI.getMouStatuses(),
        mouAPI.getMouPartnerTypes(),
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
        const facultyEmailMap = {};
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
            if (f.email) facultyEmailMap[f.faculty_id] = f.email;
          } else if (f.external_name || f.external_org || f.email) {
            // External person from existing data
            externalPersonIdCounter.current += 1;
            setExternalPersons((prev) => [...prev, { id: externalPersonIdCounter.current, name: f.external_name || "", org: f.external_org || "", email: f.email || "" }]);
          }
        });
        setFacultyEmails(facultyEmailMap);
        setFacultyUsers(facultyUserMap);
        setFacultyExternalNames(facultyExtNameMap);
        setFacultyExternalOrgs(facultyExtOrgMap);
        setFormData({
          title: mouRes.title || "",
          mou_code: mouRes.mou_code || "",
          description: mouRes.description || "",
          level: mouRes.level || "",
          status_id: mouRes.status_id ? String(mouRes.status_id) : "",
          is_international: mouRes.is_international ? "true" : "false",
          start_date: formatDateForInput(mouRes.start_date),
          end_date: formatDateForInput(mouRes.end_date),
          year_of_signing: formatDateForInput(mouRes.year_of_signing),
          partner_name: mouRes.partners?.[0]?.partner_org || "",
          partner_type_id: mouRes.partners?.[0]?.partner_type_id || "",
          country_id: mouRes.country_id ? String(mouRes.country_id) : "",
          faculty_ids: existingFacultyIds,
          coordinator_id: mouRes.coordinator_id ? String(mouRes.coordinator_id) : "",
          coordinator_other: mouRes.coordinator_other || "",
          coordinator_name: "",
          signed_by: mouRes.signed_by || "",
          notes: mouRes.notes || "",
          notify_days_before: mouRes.notifications?.[0]?.days_before ?? 0,
        });
        setCurrentStatusName(mouRes.status?.name || "");
        if (mouRes.coordinator_id) {
          const cu = (usersRes?.users || []).find((u) => u.user_id === mouRes.coordinator_id);
          if (cu) setCoorQuery(`${cu.prefix || ""} ${cu.user_fname || ""} ${cu.user_lname || ""}`.trim());
        } else if (mouRes.coordinator_other) {
          setCoorQuery(mouRes.coordinator_other);
        }
      }
      setCountries(countriesRes || []);
      setUsers(usersRes?.users || []);
      setFaculties(facultiesRes || []);
      setStatuses(statusesRes || []);
      setPartnerTypes(partnerTypesRes || []);
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
      setFacultyEmails((prev) => { const next = { ...prev }; delete next[fid]; return next; });
    }
    setFormData((prev) => ({
      ...prev,
      faculty_ids: exists ? prev.faculty_ids.filter((id) => id !== fid) : [...prev.faculty_ids, fid],
    }));
  };

  const handleFacultyUserChange = (fid, value) => {
    setFacultyUsers((prev) => ({ ...prev, [fid]: value }));
    const COMPUTING_FACULTY_ID = 6;
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
        title: formData.title,
        mou_code: formData.mou_code || null,
        description: formData.description,
        level: formData.level,
        status_id: formData.status_id ? parseInt(formData.status_id) : null,
        is_international: formData.is_international === "true",
        start_date: formData.start_date ? formData.start_date.split("-").reverse().join("/") : "",
        end_date: formData.end_date ? formData.end_date.split("-").reverse().join("/") : "",
        year_of_signing: formData.year_of_signing || null,
        partner_name: formData.partner_name,
        partner_type_id: formData.partner_type_id ? parseInt(formData.partner_type_id, 10) : null,
        country_id: formData.country_id ? parseInt(formData.country_id, 10) : null,
        faculties: facultiesArr,
        coordinator_id: formData.coordinator_id ? parseInt(formData.coordinator_id, 10) : null,
        coordinator_other: formData.coordinator_other || (selectedUser ? "" : null),
        coordinator_name: selectedUser ? `${selectedUser.user_fname || ""} ${selectedUser.user_lname || ""}`.trim() : "",
        signed_by: formData.signed_by || null,
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
      router.replace("/mou/mou_list");
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
        <button type="button" className="btn inline-flex items-center gap-2" onClick={() => router.back()}>
          <ChevronLeft size={16} />
          กลับ
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="panel formSection afu" style={{ animationDelay: "0ms" }}>
          <div className="sectionHead">
            <FileText size={18} className="text-blue-500" />
            <h3>ข้อมูล MOU</h3>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--mou-muted)", fontWeight: 500 }}>สถานะ</span>
              <div style={{ position: "relative", minWidth: "160px" }}>
                {(() => {
                  return (
                    <Select
                      name="status_id"
                      value={formData.status_id}
                      onChange={handleChange}
                      options={statuses.map((s) => ({ value: String(s.id), label: s.name }))}
                      placeholder="เลือกสถานะ"
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="formGrid">
            <div className="field">
              <label><Key size={14} className="shrink-0" />รหัส MOU <span className="required">*</span></label>
              <input type="text" name="mou_code" value={formData.mou_code} onChange={handleChange} placeholder="ระบุรหัส MOU" />
            </div>

            <div className="field">
              <label>
                ชื่อ MOU <span className="required">*</span>
              </label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="ระบุชื่อ MOU" required />
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>รายละเอียด</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="ระบุรายละเอียด..." rows="4" />
            </div>

            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label><Upload size={14} className="shrink-0" />ไฟล์แนบ</label>
              <div className="fileDrop" onClick={() => fileInputRef.current?.click()} style={{ position: "relative", cursor: "pointer", justifyContent: totalAttachments > 0 ? "flex-start" : "center", paddingTop: totalAttachments > 0 ? "40px" : "12px" }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleAISummary(); }} disabled={aiLoading} style={{ position: "absolute", top: "8px", right: "8px", zIndex: 1, fontSize: "12px", padding: "4px 8px", border: "1px solid var(--mou-primary)", borderRadius: "4px", background: "var(--mou-primary-soft)", color: "var(--mou-primary)", cursor: "pointer", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                  {aiLoading ? "กำลังวิเคราะห์..." : "AI สรุปรายละเอียดอัตโนมัติ"}
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }} accept=".pdf" multiple />
                {totalAttachments > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", width: "100%" }}>
                    {existingAttachments.map((att) => (
                      <div key={att.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "12px 16px 10px", background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "110px", position: "relative" }}>
                        <a href={att.file_path} target="_blank" rel="noopener noreferrer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", textDecoration: "none", color: "inherit" }}>
                          <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#fee2e2", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" }}>PDF</div>
                          <span style={{ fontSize: "11px", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", color: "#374151" }}>{att.file_name}</span>
                        </a>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingAttachment(att.id); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0, boxShadow: "0 2px 4px rgba(239,68,68,0.3)" }} title="ลบ">×</button>
                      </div>
                    ))}
                    {files.map((f, i) => (
                      <div key={`new-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "12px 16px 10px", background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", minWidth: "110px", position: "relative" }}>
                        <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#fee2e2", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" }}>PDF</div>
                        <span style={{ fontSize: "11px", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", color: "#374151" }}>{f.name}</span>
                        <span style={{ fontSize: "10px", color: "#9ca3af" }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: 0, boxShadow: "0 2px 4px rgba(239,68,68,0.3)" }} title="ลบ">×</button>
                      </div>
                    ))}
                    <div onClick={() => fileInputRef.current?.click()} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", padding: "12px 16px 10px", background: "#f9fafb", borderRadius: "10px", border: "1px dashed #d1d5db", minWidth: "110px", cursor: "pointer", color: "#6b7280", transition: "all 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#3b82f6"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#6b7280"; }}>
                      <span style={{ fontSize: 24, fontWeight: 300, lineHeight: 1, color: "inherit" }}>+</span>
                      <span style={{ fontSize: "11px", textAlign: "center", color: "inherit" }}>เพิ่มไฟล์</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#6b7280", width: "100%", textAlign: "center", marginTop: "2px" }}>คลิกเพื่อเพิ่มไฟล์ (สูงสุด 3 ไฟล์)</span>
                  </div>
                ) : (
                  <>
                    <span className="fileDropIcon">+</span>
                    <span className="fileDropText">วางไฟล์ PDF (สูงสุด 3 ไฟล์ ไฟล์ละไม่เกิน 20 MB)</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="panel formSection afu" style={{ animationDelay: "80ms" }}>
          <div className="sectionHead">
            <Layers size={18} className="text-blue-500" />
            <h3>ความร่วมมือ</h3>
          </div>

          <div className="formGrid">
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
                <Select name="country_id" value={formData.country_id || ""} onChange={handleChange} placeholder="เลือกประเทศ" searchable options={countries.map((c) => ({ value: c.id, label: c.name_th }))} />
              </div>
            )}

            {formData.level === "university" && (
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>คณะที่เข้าร่วม</label>
                <div style={{ display: "flex", gap: "18px", height: "280px" }}>
                  <div ref={facultyRef} style={{ flex: 1, border: "1px solid var(--mou-line)", borderRadius: "5px", background: "var(--mou-field)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--mou-line)", background: "#fff" }}>
                      <input
                        type="text"
                        placeholder="ค้นหาคณะ..."
                        value={facultySearch}
                        onChange={(e) => setFacultySearch(e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", background: "transparent" }}
                      />
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
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
                  <div style={{ width: "280px", border: "1px solid var(--mou-line)", borderRadius: "5px", background: "var(--mou-surface)", padding: "10px", overflowY: "auto" }}>
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
              {formData.faculty_ids.map((fid) => {
                const fac = faculties.find((f) => f.id === fid);
                const isComputing = fid === 6;
                return (
                  <div key={fid} style={{ border: "1px solid var(--mou-line)", borderRadius: 10, padding: "14px 16px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--mou-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={14} style={{ color: "var(--mou-primary)" }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mou-text)" }}>
                        {fac?.name_th || `#${fid}`}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "block" }}>ชื่อผู้รับผิดชอบ <span className="required">*</span></label>
                        {isComputing ? (
                          <input
                            list={`faculty-user-${fid}`}
                            value={facultyUsers[fid] || ""}
                            onChange={(e) => handleFacultyUserChange(fid, e.target.value)}
                            placeholder="พิมพ์ค้นหาชื่อหรือพิมพ์ชื่อที่ไม่มีในรายการ"
                          />
                        ) : (
                          <input
                            value={facultyUsers[fid] || ""}
                            onChange={(e) => handleFacultyUserChange(fid, e.target.value)}
                            placeholder="ระบุชื่อผู้รับผิดชอบ"
                          />
                        )}
                        {isComputing && (
                          <datalist id={`faculty-user-${fid}`}>
                            {users.map((u) => (
                              <option key={u.user_id} value={`${u.prefix || ""} ${u.user_fname || ""} ${u.user_lname || ""}`.trim()} />
                            ))}
                          </datalist>
                        )}
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, display: "block" }}>อีเมล <span className="required">*</span></label>
                        <input type="email" value={facultyEmails[fid] || ""} onChange={(e) => handleFacultyEmailChange(fid, e.target.value)}
                          placeholder="อีเมล" style={{ width: "220px" }} />
                      </div>
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
                        <label style={{ fontSize: 13 }}><Briefcase size={13} className="shrink-0" />หน่วยงาน <span className="required">*</span></label>
                        <input type="text" value={p.org} onChange={(e) => updateExternalPerson(p.id, "org", e.target.value)} placeholder="หน่วยงาน" required />
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

          <div className="formGrid">
            <div className="field">
              <label>
                หน่วยงานคู่สัญญา <span className="required">*</span>
              </label>
              <input type="text" name="partner_name" value={formData.partner_name} onChange={handleChange} placeholder="ชื่อหน่วยงาน" required />
            </div>

            <div className="field">
              <label>ประเภทคู่สัญญา</label>
              <select name="partner_type_id" value={formData.partner_type_id} onChange={handleChange}>
                <option value="">เลือกประเภท</option>
                {partnerTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name_th}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>วันเดือนปีที่ลงนาม</label>
              <input type="date" name="year_of_signing" value={formData.year_of_signing || ""} onChange={handleChange} placeholder="เช่น 2024-06-01" />
            </div>

            <div className="field">
              <label>ลงนามโดย</label>
              <input type="text" name="signed_by" value={formData.signed_by || ""} onChange={handleChange} placeholder="ชื่อผู้ลงนาม" />
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
                {coorOpen && filteredCoorUsers.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCoorUsers.map((u) => (
                      <div
                        key={u.user_id}
                        className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${u.user_id === parseInt(formData.coordinator_id) ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, coordinator_id: u.user_id, coordinator_other: "" }));
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
          <button type="button" className="btn" onClick={() => router.back()}>
            ยกเลิก
          </button>
          <button type="submit" className="btn primary" disabled={saving === "save"}>
            {saving === "save" ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </div>

        {(error || success) && (
          <div style={{ marginTop: "18px", animation: "slideUpAlert 0.35s ease-out" }}>
            {error && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "14px 18px", borderRadius: "12px",
                background: "#fef2f2", border: "1px solid #fecaca",
                boxShadow: "0 4px 16px rgba(220,38,38,0.1)",
              }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: "#dc2626", color: "#fff", fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "700", flexShrink: 0, marginTop: "1px",
                }}>!</div>
                <div style={{ flex: 1, fontSize: "14px", color: "#991b1b", lineHeight: "1.5" }}>
                  {error}
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#fca5a5", fontSize: "18px", lineHeight: 1, padding: "2px",
                    flexShrink: 0,
                  }}
                >×</button>
              </div>
            )}
            {success && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "14px 18px", borderRadius: "12px",
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                boxShadow: "0 4px 16px rgba(22,163,74,0.1)",
              }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "50%",
                  background: "#16a34a", color: "#fff", fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: "700", flexShrink: 0, marginTop: "1px",
                }}>✓</div>
                <div style={{ flex: 1, fontSize: "14px", color: "#166534", lineHeight: "1.5" }}>
                  {success}
                </div>
                <button
                  type="button"
                  onClick={() => setSuccess("")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#86efac", fontSize: "18px", lineHeight: 1, padding: "2px",
                    flexShrink: 0,
                  }}
                >×</button>
              </div>
            )}
          </div>
        )}
      </form>
      <style>{`
        @keyframes slideUpAlert {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes csIn {
          from { opacity: 0; transform: translateY(-8px) scaleY(0.95); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        .csWrap { position: relative; width: 100%; }
        .csBtn {
          width: 100%; min-height: 30px; border: 1px solid var(--mou-line); border-radius: 999px;
          background: var(--mou-primary-soft); color: var(--mou-primary); padding: 2px 12px; font-size: 13px;
          font-weight: 600; outline: none; cursor: pointer; display: flex; align-items: center;
          justify-content: space-between; gap: 8px; text-align: left; font-family: inherit;
          line-height: 1.5; transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .csBtn:hover { border-color: #a78bfa; background: #ede9fe; }
        .csBtn.open, .csBtn:focus-visible { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        .csBtn.hasVal { color: var(--mou-primary); }
        .csLabel { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .csInput { flex: 1; border: none; outline: none; background: transparent; padding: 2px 12px; font-size: 13px; font-family: inherit; color: var(--mou-primary); min-width: 0; }
        .csArrow { flex-shrink: 0; color: var(--mou-primary); transition: transform 0.25s ease; }
        .csArrow.open { transform: rotate(180deg); }
        .csDropdownPortal {
          max-height: 240px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 10px;
          background: #fff; box-shadow: 0 8px 28px rgba(0,0,0,0.13); padding: 4px;
          animation: csIn 0.2s ease-out; transform-origin: top center; z-index: 9999;
        }
        .csOpt {
          padding: 8px 12px; font-size: 14px; cursor: pointer; border-radius: 6px;
          list-style: none; color: #111827; transition: background 0.15s ease, color 0.15s ease;
        }
        .csOpt:hover, .csOpt.foc { background: #eff6ff; color: #2563eb; }
        .csOpt.sel { background: #2563eb; color: #fff; font-weight: 500; }
        .csOpt.sel:hover { background: #1d4ed8; }
        .csDropdownPortal::-webkit-scrollbar { width: 4px; }
        .csDropdownPortal::-webkit-scrollbar-track { background: transparent; }
        .csDropdownPortal::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>
    </MouLayout>
  );
}
