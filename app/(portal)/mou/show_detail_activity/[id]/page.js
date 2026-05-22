"use client";

import React, { useEffect, useState, useRef, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, Calendar, MapPin, Users, FileText, AlignLeft,
  StickyNote, Paperclip, Download, X, Check, Building2, Target,
  ChevronLeft, Search, Plus, Tag, Upload, FileSignature,
  Clock, UserCircle, Edit3, Trash2, ListChecks, Hash, ExternalLink, Tags
} from "lucide-react";
import apiClient from "../../../../lib/api";
import { mouAPI } from "../../../../lib/mou_api";
import { useAuth } from "../../../../contexts/AuthContext";
import MouLayout from "../../components/MouLayout";
import Swal from "sweetalert2";

function MouInfo({ label, icon: Icon, value, children, borderColor = "border-gray-100" }) {
  return (
    <div className={`bg-white rounded-lg px-4 py-3 border ${borderColor}`}>
      <div className="flex gap-1.5">
        <Icon size={12} className="text-gray-400 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-gray-500 mb-2">{label}</div>
          {children ? (
            <div className="text-sm font-medium text-gray-900 break-words">{children}</div>
          ) : (
            <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileIcon({ fileName, mimeType }) {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') {
    return <div className="w-7 h-8 rounded bg-red-50 border border-red-200 flex items-center justify-center shrink-0"><span className="text-red-600 font-extrabold text-[9px] tracking-wider">PDF</span></div>;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <div className="w-7 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0"><span className="text-blue-600 font-extrabold text-[9px] tracking-wider">DOC</span></div>;
  }
  if (ext === 'txt') {
    return <div className="w-7 h-8 rounded bg-gray-50 border border-gray-300 flex items-center justify-center shrink-0"><span className="text-gray-500 font-extrabold text-[9px] tracking-wider">TXT</span></div>;
  }
  if (['jpg', 'jpeg', 'png'].includes(ext)) {
    return <div className="w-7 h-8 rounded bg-pink-50 border border-pink-200 flex items-center justify-center shrink-0"><span className="text-pink-600 font-extrabold text-[9px] tracking-wider">IMG</span></div>;
  }
  return <div className="w-7 h-8 rounded bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0"><span className="text-gray-400 font-extrabold text-[9px] tracking-wider">FILE</span></div>;
}

const fmtInputDate = (d) => {
  if (!d || d.startsWith("0001")) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toISOString().split("T")[0];
};

export default function ShowDetailActivityPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activityTypes, setActivityTypes] = useState([]);
  const [okrs, setOkrs] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState([]);
  const [selectedOkrIds, setSelectedOkrIds] = useState([]);
  const [typeSearch, setTypeSearch] = useState("");
  const [okrSearch, setOkrSearch] = useState("");
  const [editForm, setEditForm] = useState({
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
  const coorRef = useRef(null);
  const [coorQuery, setCoorQuery] = useState("");
  const [coorOpen, setCoorOpen] = useState(false);

  const filteredUsers = coorQuery.trim()
    ? users.filter(u =>
        `${u.prefix || ""} ${u.user_fname || ""} ${u.user_lname || ""}`.toLowerCase().includes(coorQuery.toLowerCase())
      )
    : users;

  const filteredTypes = useMemo(() =>
    activityTypes.filter((t) => !typeSearch || t.name.toLowerCase().includes(typeSearch.toLowerCase())),
    [activityTypes, typeSearch]
  );
  const filteredOkrs = useMemo(() =>
    okrs.filter((o) => !okrSearch || (o.title || "").toLowerCase().includes(okrSearch.toLowerCase())),
    [okrs, okrSearch]
  );

  useEffect(() => {
    const handler = (e) => {
      if (coorRef.current && !coorRef.current.contains(e.target)) setCoorOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    mouAPI.getActivityTypes().then(setActivityTypes).catch(() => {});
    mouAPI.getOkrs().then(setOkrs).catch(() => {});
    apiClient.get("/users").then((res) => setUsers(res?.users || [])).catch(() => {});

    mouAPI.getMouActivity(params.id).then((res) => {
      const act = res?.data || res;
      setActivity(act);
      setEditForm({
        title: act.title || "",
        activity_start: act.activity_start || "",
        activity_end: act.activity_end || "",
        location: act.location || "",
        participant_count: act.participant_count || "",
        objective: act.objective || "",
        description: act.description || "",
        plan: act.plan || "",
        notes: act.notes || "",
        coordinator_id: act.coordinator_id || "",
        coordinator_other: act.coordinator_other || "",
        coordinator_org: act.coordinator_org || "",
      });
      setSelectedTypeIds((act.activity_types || []).map((t) => t.id));
      setSelectedOkrIds((act.okrs || []).map((o) => o.id));
      if (act.coordinator?.user_id) {
        setCoorQuery(`${act.coordinator.prefix || ""} ${act.coordinator.user_fname || ""} ${act.coordinator.user_lname || ""}`.trim());
      } else {
        setCoorQuery(act.coordinator_other || "");
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  const handleDeleteAttachment = async (attachId) => {
    const result = await Swal.fire({
      title: "ต้องการลบไฟล์นี้ใช่หรือไม่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    try {
      await mouAPI.deleteMouActivityAttachment(activity.id, attachId);
      const res = await mouAPI.getMouActivity(activity.id);
      const act = res?.data || res;
      setActivity(act);
      await Swal.fire({ icon: "success", title: "ลบไฟล์สำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const handleUploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentFiles = activity.attachments || [];
    if (currentFiles.length >= 3) {
      await Swal.fire({ icon: "warning", title: "ไม่สามารถเพิ่มไฟล์ได้", text: "สามารถแนบไฟล์ได้สูงสุด 3 ไฟล์" });
      e.target.value = "";
      return;
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      await Swal.fire({ icon: "warning", title: "ไฟล์มีขนาดเกิน 20 MB" });
      e.target.value = "";
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: editForm.title,
        objective: editForm.objective,
        description: editForm.description,
        plan: editForm.plan,
        activity_start: editForm.activity_start,
        activity_end: editForm.activity_end,
        location: editForm.location,
        participant_count: editForm.participant_count ? parseInt(editForm.participant_count, 10) : 0,
        coordinator_id: editForm.coordinator_id ? parseInt(editForm.coordinator_id, 10) : null,
        coordinator_other: editForm.coordinator_other,
        coordinator_org: editForm.coordinator_org,
        activity_type_ids: selectedTypeIds,
        okr_ids: selectedOkrIds,
        notes: editForm.notes,
      };

      if (payload.activity_start && payload.activity_start.includes("-")) {
        const datePart = payload.activity_start.split("T")[0];
        const sp = datePart.split("-");
        payload.activity_start = `${sp[2]}/${sp[1]}/${sp[0]}`;
      }
      if (payload.activity_end && payload.activity_end.includes("-")) {
        const datePart = payload.activity_end.split("T")[0];
        const sp = datePart.split("-");
        payload.activity_end = `${sp[2]}/${sp[1]}/${sp[0]}`;
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      formData.append("files", file);

      const res = await apiClient.putFormData(`/mou/activities/${activity.id}`, formData);
      const updated = res?.data || res;
      if (updated?.data) {
        setActivity(updated.data);
      } else {
        const refreshed = await mouAPI.getMouActivity(activity.id);
        setActivity(refreshed?.data || refreshed);
      }
      await Swal.fire({ icon: "success", title: "อัปโหลดไฟล์สำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
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

  const handleEditToggle = async () => {
    if (editing) {
      const result = await Swal.fire({
        title: "ต้องการยกเลิกการแก้ไขใช่หรือไม่",
        text: "ข้อมูลที่แก้ไขจะไม่ถูกบันทึก",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "ใช่",
        cancelButtonText: "ไม่",
      });
      if (!result.isConfirmed) return;
      const fmtActivityDate = (d) => {
        if (!d || d.startsWith("0001")) return "";
        return d;
      };
      setEditForm({
        title: activity.title || "",
        activity_start: fmtActivityDate(activity.activity_start),
        activity_end: fmtActivityDate(activity.activity_end),
        location: activity.location || "",
        participant_count: activity.participant_count || "",
        objective: activity.objective || "",
        description: activity.description || "",
        plan: activity.plan || "",
        notes: activity.notes || "",
        coordinator_id: activity.coordinator_id || "",
        coordinator_other: activity.coordinator_other || "",
        coordinator_org: activity.coordinator_org || "",
      });
      setSelectedTypeIds((activity.activity_types || []).map((t) => t.id));
      setSelectedOkrIds((activity.okrs || []).map((o) => o.id));
      if (activity.coordinator?.user_id) {
        setCoorQuery(`${activity.coordinator.prefix || ""} ${activity.coordinator.user_fname || ""} ${activity.coordinator.user_lname || ""}`.trim());
      } else {
        setCoorQuery(activity.coordinator_other || "");
      }
    }
    setEditing(!editing);
  };

  const handleSave = async () => {
    const result = await Swal.fire({
      title: "ต้องการบันทึกข้อมูลใช่หรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      const payload = {
        title: editForm.title,
        objective: editForm.objective,
        description: editForm.description,
        plan: editForm.plan,
        activity_start: editForm.activity_start,
        activity_end: editForm.activity_end,
        location: editForm.location,
        participant_count: editForm.participant_count ? parseInt(editForm.participant_count, 10) : 0,
        coordinator_id: editForm.coordinator_id ? parseInt(editForm.coordinator_id, 10) : null,
        coordinator_other: editForm.coordinator_other,
        coordinator_org: editForm.coordinator_org,
        activity_type_ids: selectedTypeIds,
        okr_ids: selectedOkrIds,
        notes: editForm.notes,
      };

      if (payload.activity_start && payload.activity_start.includes("-")) {
        const datePart = payload.activity_start.split("T")[0];
        const sp = datePart.split("-");
        payload.activity_start = `${sp[2]}/${sp[1]}/${sp[0]}`;
      }
      if (payload.activity_end && payload.activity_end.includes("-")) {
        const datePart = payload.activity_end.split("T")[0];
        const sp = datePart.split("-");
        payload.activity_end = `${sp[2]}/${sp[1]}/${sp[0]}`;
      }

      const res = await mouAPI.updateMouActivity(activity.id, payload);
      const updated = res?.data || res;
      setActivity(updated);
      setEditing(false);
      await Swal.fire({ icon: "success", title: "บันทึกสำเร็จ", timer: 1500, showConfirmButton: false });
    } catch (err) {
      await Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "ต้องการลบกิจกรรมนี้ใช่หรือไม่",
      text: "การกระทำนี้ไม่สามารถย้อนกลับได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;

    try {
      await mouAPI.deleteMouActivity(activity.id);
      await Swal.fire({ icon: "success", title: "ลบสำเร็จ", timer: 1500, showConfirmButton: false });
      router.push(`/mou/show_detail_mou/${activity.mou_id}`);
    } catch (err) {
      await Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const handleViewFile = (attachId) => {
    const token = apiClient.getToken();
    const url = `${apiClient.baseURL}/mou/${activity.mou_id}/attachments/${attachId}`;
    window.open(url, "_blank");
  };

  const handleDownloadFile = async (attachId, fileName) => {
    try {
      await apiClient.downloadFile(`/mou/${activity.mou_id}/attachments/${attachId}?dl=1`, fileName);
    } catch {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถดาวน์โหลดไฟล์ได้" });
    }
  };

  if (loading) {
    return (
      <MouLayout subtitle="รายละเอียดกิจกรรม">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-blue-200 border-t-blue-600" />
            <p className="text-sm text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MouLayout>
    );
  }

  if (!activity) {
    return (
      <MouLayout subtitle="รายละเอียดกิจกรรม">
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-red-500" />
          </div>
          <p className="text-red-600 font-medium">ไม่พบข้อมูลกิจกรรม</p>
        </div>
      </MouLayout>
    );
  }

  const coordinatorName = activity.coordinator?.user_id
    ? [activity.coordinator.prefix || "", activity.coordinator.user_fname || "", activity.coordinator.user_lname || ""].filter(Boolean).join(" ")
    : activity.coordinator_other || "";

  return (
    <MouLayout subtitle="รายละเอียดกิจกรรม">
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes asd { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .afu { animation: fadeInUp 0.35s ease-out both; }
        .asd { animation: asd 0.3s ease-out both; }
        .formSection .field label { font-weight: 500 !important; }
      `}</style>

      {/* Page Title */}
      <div className="flex items-center justify-between mb-6 afu" style={{ animationDelay: "0ms" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 shadow-sm flex items-center justify-center">
            <Activity size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ margin: 0, lineHeight: 1.2 }}>
              {editing ? "แก้ไขกิจกรรม" : "รายละเอียดกิจกรรม"}
            </h1>

          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            href={`/mou/show_detail_mou/${activity.mou_id}`}
          >
            <ChevronLeft size={15} />
            กลับ
          </Link>
          {!editing && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition"
            >
              <Trash2 size={15} />
              ลบ
            </button>
          )}
          {!editing && (
            <button
              onClick={() => { setEditing(true); }}
              className="btn primary inline-flex items-center gap-2"
            >
              <Edit3 size={16} />
              แก้ไข
            </button>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
        <div className="p-5 space-y-5 divide-y divide-gray-100">

          {/* Section: ข้อมูลกิจกรรม */}
          <div className="pt-0">
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={15} className="text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">ข้อมูลกิจกรรม</span>
              </div>
              <div className={editing ? "bg-blue-50 rounded-lg p-3 -mx-1" : ""}>
                <MouInfo label="MOU ที่เชื่อมโยง" icon={FileSignature}>
                  {activity.mou ? `${activity.mou.mou_code} - ${activity.mou.title}` : `#${activity.mou_id}`}
                </MouInfo>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <input type="text" name="title" value={editForm.title} onChange={handleChange} placeholder="ชื่อกิจกรรม" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  <textarea name="objective" value={editForm.objective} onChange={handleChange} placeholder="วัตถุประสงค์..." rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  <textarea name="description" value={editForm.description} onChange={handleChange} placeholder="รายละเอียด..." rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  <textarea name="plan" value={editForm.plan} onChange={handleChange} placeholder="แผนการดำเนินงาน..." rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Calendar size={12} />วันที่เริ่ม</label>
                      <input type="date" name="activity_start" value={editForm.activity_start ? fmtInputDate(editForm.activity_start) : ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Calendar size={12} />วันที่สิ้นสุด</label>
                      <input type="date" name="activity_end" value={editForm.activity_end ? fmtInputDate(editForm.activity_end) : ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MapPin size={12} />สถานที่</label>
                      <input name="location" value={editForm.location} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Users size={12} />จำนวนผู้เข้าร่วม (คน)</label>
                      <input type="number" name="participant_count" value={editForm.participant_count} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                    <div className="flex gap-1.5">
                      <Activity size={12} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500 mb-1">ชื่อกิจกรรม</div>
                        <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <MouInfo label="วันที่เริ่ม" icon={Calendar} value={fmtDate(activity.activity_start)} borderColor="border-blue-100" />
                    <MouInfo label="วันที่สิ้นสุด" icon={Calendar} value={fmtDate(activity.activity_end)} borderColor="border-blue-100" />
                    <MouInfo label="สถานที่" icon={MapPin} value={activity.location || "-"} borderColor="border-blue-100" />
                    <MouInfo label="จำนวนผู้เข้าร่วม" icon={Users} value={`${activity.participant_count || 0} คน`} borderColor="border-blue-100" />
                  </div>
                  <MouInfo label="วัตถุประสงค์" icon={Target} value={activity.objective || "-"} borderColor="border-blue-100" />
                  <MouInfo label="รายละเอียด" icon={AlignLeft} value={activity.description || "-"} borderColor="border-blue-100" />
                  <MouInfo label="แผนการดำเนินงาน" icon={FileText} value={activity.plan || "-"} borderColor="border-blue-100" />
                </>
              )}
            </div>
          </div>

          {/* Section: กำหนดการและสถานที่ (edit mode only) — info fields are shown above in view mode */}
          {editing && (
            <div className="pt-4">
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={15} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">กำหนดการและสถานที่</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Calendar size={12} />วันที่เริ่ม</label>
                    <input type="date" name="activity_start" value={editForm.activity_start ? fmtInputDate(editForm.activity_start) : ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Calendar size={12} />วันที่สิ้นสุด</label>
                    <input type="date" name="activity_end" value={editForm.activity_end ? fmtInputDate(editForm.activity_end) : ""} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MapPin size={12} />สถานที่</label>
                    <input name="location" value={editForm.location} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Users size={12} />จำนวนผู้เข้าร่วม (คน)</label>
                    <input type="number" name="participant_count" value={editForm.participant_count} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: ประเภทกิจกรรมและ OKR */}
          <div className="pt-4">
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Tags size={15} className="text-blue-600" />
                <span className="text-sm font-semibold text-gray-700">ประเภทกิจกรรมและ OKR</span>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Tag size={12} />ประเภทกิจกรรม</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: "0 0 50%", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb", overflow: "hidden" }}>
                        <div style={{ padding: "4px 8px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                          <Search size={12} className="text-gray-400" />
                          <input type="text" placeholder="ค้นหา..." value={typeSearch} onChange={(e) => setTypeSearch(e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", fontSize: "13px", background: "transparent" }} />
                        </div>
                        <div style={{ maxHeight: "120px", overflowY: "auto", padding: "2px" }}>
                          {filteredTypes.length > 0 ? filteredTypes.map((t) => (
                            <label key={t.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "13px", borderRadius: "4px" }}>
                              <input type="checkbox" checked={selectedTypeIds.includes(t.id)} onChange={() => toggleType(t.id)}
                                style={{ width: "14px", height: "14px", accentColor: "#059669" }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</span>
                            </label>
                          )) : (
                            <div style={{ padding: "8px", textAlign: "center", color: "#9ca3af", fontSize: "12px" }}>ไม่มีประเภท</div>
                          )}
                        </div>
                      </div>
                      <div style={{ flex: 1, minHeight: "60px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb", padding: "6px" }}>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: 500 }}>เลือกแล้ว {selectedTypeIds.length} รายการ</div>
                        {selectedTypeIds.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {selectedTypeIds.slice(0, 5).map((id) => {
                              const t = activityTypes.find((x) => x.id === id);
                              return (
                                <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px", borderRadius: "4px", background: "#eef2ff", fontSize: "11px" }}>
                                  <span className="truncate" style={{ flex: 1 }}>{t?.name || `#${id}`}</span>
                                  <button type="button" onClick={() => toggleType(id)} style={{ background: "none", border: "none", color: "#059669", cursor: "pointer", padding: "0 2px" }}><X size={8} /></button>
                                </div>
                              );
                            })}
                            {selectedTypeIds.length > 5 && <div style={{ fontSize: "10px", color: "#6b7280", textAlign: "center" }}>+{selectedTypeIds.length - 5} รายการ</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", padding: "12px 0" }}>ยังไม่เลือก</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Target size={12} />สอดคล้องกับ OKR</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <div style={{ flex: "0 0 50%", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb", overflow: "hidden" }}>
                        <div style={{ padding: "4px 8px", borderBottom: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                          <Search size={12} className="text-gray-400" />
                          <input type="text" placeholder="ค้นหา..." value={okrSearch} onChange={(e) => setOkrSearch(e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", fontSize: "13px", background: "transparent" }} />
                        </div>
                        <div style={{ maxHeight: "120px", overflowY: "auto", padding: "2px" }}>
                          {filteredOkrs.length > 0 ? filteredOkrs.map((o) => (
                            <label key={o.id} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "13px", borderRadius: "4px" }}>
                              <input type="checkbox" checked={selectedOkrIds.includes(o.id)} onChange={() => toggleOkr(o.id)}
                                style={{ width: "14px", height: "14px", accentColor: "#059669" }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.title}</span>
                            </label>
                          )) : (
                            <div style={{ padding: "8px", textAlign: "center", color: "#9ca3af", fontSize: "12px" }}>ไม่มี OKR</div>
                          )}
                        </div>
                      </div>
                      <div style={{ flex: 1, minHeight: "60px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#f9fafb", padding: "6px" }}>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "4px", fontWeight: 500 }}>เลือกแล้ว {selectedOkrIds.length} รายการ</div>
                        {selectedOkrIds.length > 0 ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {selectedOkrIds.slice(0, 5).map((id) => {
                              const o = okrs.find((x) => x.id === id);
                              return (
                                <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 6px", borderRadius: "4px", background: "#eef2ff", fontSize: "11px" }}>
                                  <span className="truncate" style={{ flex: 1 }}>{o?.title || `#${id}`}</span>
                                  <button type="button" onClick={() => toggleOkr(id)} style={{ background: "none", border: "none", color: "#4f46e5", cursor: "pointer", padding: "0 2px" }}><X size={8} /></button>
                                </div>
                              );
                            })}
                            {selectedOkrIds.length > 5 && <div style={{ fontSize: "10px", color: "#6b7280", textAlign: "center" }}>+{selectedOkrIds.length - 5} รายการ</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center", padding: "12px 0" }}>ยังไม่เลือก</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                    <div className="flex gap-1.5">
                      <Tag size={12} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500 mb-1">ประเภทกิจกรรม</div>
                        <div className="flex flex-wrap gap-1">
                          {(activity.activity_types || []).length > 0 ? (activity.activity_types || []).map((t) => (
                            <span key={t.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50">{t.name || `#${t.id}`}</span>
                          )) : <span className="text-sm text-gray-500">-</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                    <div className="flex gap-1.5">
                      <ListChecks size={12} className="text-gray-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500 mb-1">OKR</div>
                        <div className="flex flex-wrap gap-1">
                          {(activity.okrs || []).length > 0 ? (activity.okrs || []).map((o) => (
                            <span key={o.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50">{o.title || `#${o.id}`}</span>
                          )) : <span className="text-sm text-gray-500">-</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: การประสานงาน */}
          {!editing && (
            <div className="pt-4">
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={15} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">การประสานงาน</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <MouInfo label="ผู้ประสานงาน" icon={UserCircle} value={coordinatorName || "-"} borderColor="border-blue-100" />
                  <MouInfo label="หน่วยงานผู้ประสานงาน" icon={Building2} value={activity.coordinator_org || "-"} borderColor="border-blue-100" />
                </div>
                <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                  <div className="flex gap-1.5">
                    <StickyNote size={12} className="text-gray-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 mb-1">หมายเหตุ</div>
                      <p className="text-sm text-gray-900 whitespace-pre-line">{activity.notes || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {editing && (
            <div className="pt-4">
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={15} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">การประสานงาน</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><UserCircle size={12} />ผู้ประสานงาน</label>
                    <div className="relative" ref={coorRef}>
                      <input
                        value={coorQuery}
                        onChange={(e) => {
                          setCoorQuery(e.target.value);
                          setCoorOpen(true);
                          setEditForm((prev) => ({ ...prev, coordinator_id: "", coordinator_other: e.target.value }));
                        }}
                        onFocus={() => setCoorOpen(true)}
                        placeholder="ค้นหาหรือพิมพ์ชื่อ"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      {coorOpen && filteredUsers.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                          {filteredUsers.map((u) => (
                              <div
                                key={u.user_id}
                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${u.user_id === parseInt(editForm.coordinator_id) ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                                onClick={() => {
                                  setEditForm((prev) => ({ ...prev, coordinator_id: u.user_id, coordinator_other: "", coordinator_org: "คณะวิทยาลัยการคอมพิวเตอร์ มหาวิทยาลัยขอนแก่น" }));
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
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Building2 size={12} />หน่วยงานผู้ประสานงาน</label>
                    <input name="coordinator_org" value={editForm.coordinator_org} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                </div>
                <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                  <div className="flex gap-1.5">
                    <StickyNote size={12} className="text-gray-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 mb-1">หมายเหตุ</div>
                      <textarea name="notes" value={editForm.notes} onChange={handleChange} placeholder="หมายเหตุ..." rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: เอกสารแนบ */}
          <div className="pt-4">
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Paperclip size={15} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">เอกสารแนบ</span>
                </div>
                {editing && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">สูงสุด 3 ไฟล์ (PDF, DOC, DOCX, TXT)</span>
                    <input type="file" id="fileUpload" onChange={handleUploadFile} style={{ display: "none" }} accept=".pdf,.doc,.docx,.txt" />
                    <button type="button" onClick={() => {
                      const currentFiles = activity.attachments || [];
                      if (currentFiles.length >= 3) {
                        Swal.fire({ icon: "warning", title: "ไม่สามารถเพิ่มไฟล์ได้", text: "สามารถแนบไฟล์ได้สูงสุด 3 ไฟล์" });
                        return;
                      }
                      document.getElementById("fileUpload")?.click();
                    }} disabled={saving}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition">
                      <Upload size={11} />{saving ? "กำลังอัปโหลด..." : "เพิ่มไฟล์"}
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg px-4 py-3 border border-blue-100">
                <div className="flex gap-1.5">
                  <Paperclip size={12} className="text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500 mb-1">ไฟล์แนบ</div>
                    {(activity.attachments || []).length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {(activity.attachments || []).map((att) => (
                          <div key={att.id} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-700 truncate flex items-center gap-1.5">
                              <FileIcon fileName={att.file_name || att.filename} mimeType={att.mime_type} />
                              {att.file_name || att.filename || `#${att.id}`}
                            </span>
                            <div className="flex gap-1 shrink-0">
                              <button type="button" onClick={() => handleViewFile(att.id)} className="text-blue-600 hover:text-blue-800 text-xs p-1" title="เปิดดู"><ExternalLink size={11} /></button>
                              <button type="button" onClick={() => handleDownloadFile(att.id, att.file_name || att.filename)} className="text-blue-600 hover:text-blue-800 text-xs p-1" title="ดาวน์โหลด"><Download size={11} /></button>
                              {editing && (
                                <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="text-red-500 hover:text-red-700 text-xs p-1" title="ลบ"><Trash2 size={11} /></button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <span className="text-sm text-gray-500">-</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {editing && (
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
              <button type="button" className="btn inline-flex items-center gap-2" onClick={handleEditToggle}>
                <X size={16} />ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn primary inline-flex items-center gap-2"
              >
                {saving ? (
                  <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />กำลังบันทึก...</>
                ) : (
                  <><Check size={16} />บันทึก</>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </MouLayout>
  );
}

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("th-TH");
}
