"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BellRing,
  Edit,
  Loader2,
  PlusCircle,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";

import SettingsSectionCard from "@/app/(portal)/research-fund-system/admin/components/settings/common/SettingsSectionCard";
import SettingsModal from "@/app/(portal)/research-fund-system/admin/components/settings/common/SettingsModal";
import StatusBadge from "@/app/(portal)/research-fund-system/admin/components/settings/StatusBadge";
import { notificationMessagesAPI } from "@/app/lib/notification_messages_api";

const AUDIENCE_OPTIONS = [
  { value: "user", label: "ส่งถึงผู้ใช้" },
  { value: "dept_head", label: "ส่งถึงหัวหน้าสาขา" },
  { value: "admin", label: "ส่งถึงผู้ดูแล" },
];

const emptyTemplate = {
  event_key: "",
  send_to: "user",
  title_template: "",
  body_template: "",
  description: "",
  variables: [],
  is_active: true,
};

const normalizeVariables = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

function TemplateEditor({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(emptyTemplate);
  const [saving, setSaving] = useState(false);
  const formId = "notification-template-form";

  useEffect(() => {
    if (initial) {
      setForm({
        ...emptyTemplate,
        ...initial,
        description: initial.description || "",
        variables: normalizeVariables(initial.variables),
      });
    } else {
      setForm(emptyTemplate);
    }
  }, [initial]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({ ...form });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsModal
      open={open}
      onClose={onClose}
      size="3xl"
      headerContent={
        <div className="flex items-center gap-3 text-slate-800">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
            <BellRing className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <div className="text-lg font-semibold">
              {initial?.id ? "แก้ไขข้อความแจ้งเตือน" : "เพิ่มข้อความแจ้งเตือน"}
            </div>
            <p className="text-sm text-gray-500">กำหนดรายละเอียดข้อความแจ้งเตือนที่จะใช้ในระบบ</p>
          </div>
        </div>
      }
      bodyClassName="space-y-4 px-6 py-5 max-h-[75vh] overflow-y-auto"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <X className="h-4 w-4" /> ยกเลิก
          </button>
          <button
            type="submit"
            form={formId}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Key</label>
              <input
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={form.event_key}
                onChange={(e) => handleChange("event_key", e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">ตัวอย่าง: submission_submitted, admin_approved</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">ส่งถึง</label>
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={form.send_to}
                onChange={(e) => handleChange("send_to", e.target.value)}
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">หัวเรื่อง</label>
            <input
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={form.title_template}
              onChange={(e) => handleChange("title_template", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">ข้อความ</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
              value={form.body_template}
              onChange={(e) => handleChange("body_template", e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              รองรับ placeholder เช่น {"{{submission_number}}"} หรือ {"{{reason}}"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">ตัวแปร (คั่นด้วยคอมมา)</label>
              <input
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={form.variables.join(", ")}
                onChange={(e) =>
                  handleChange(
                    "variables",
                    e.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="submission_number, submitter_name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">บันทึกย่อ</label>
              <input
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="ตัวอย่าง: แจ้งผู้ยื่นเมื่อส่งคำร้อง"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
            <StatusBadge
              status={form.is_active}
              interactive
              confirm={false}
              onChange={(next) => handleChange("is_active", next)}
            />
            <span className="text-xs text-gray-500">ปิดใช้งานเมื่อไม่ต้องการให้ข้อความนี้ถูกเลือกใช้</span>
          </div>
        </form>
    </SettingsModal>
  );
}

function TemplateRow({ item, onEdit, onToggle, onReset, saving = false, resetting = false }) {
  const variableList = normalizeVariables(item.variables);
  const defaultVariables = normalizeVariables(item.default_variables);
  const isModified =
    item.title_template !== item.default_title_template ||
    item.body_template !== item.default_body_template ||
    JSON.stringify(variableList) !== JSON.stringify(defaultVariables);

  return (
    <div className="grid items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
            <BellRing className="h-4 w-4" />
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 font-semibold text-slate-700">{item.event_key}</span>
          <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 font-medium text-slate-700">
            {AUDIENCE_OPTIONS.find((a) => a.value === item.send_to)?.label || item.send_to}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            status={item.is_active}
            interactive
            confirm={false}
            disabled={saving}
            onChange={() => onToggle(item)}
          />
          <button
            onClick={() => onReset(item)}
            disabled={resetting || !isModified}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
              resetting || !isModified
                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
            }`}
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            รีเซ็ตเป็นค่าเริ่มต้น
          </button>
          <button
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 transition hover:border-blue-300"
          >
            <Edit className="h-4 w-4" /> แก้ไข
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">หัวเรื่อง</p>
          <p className="text-sm text-gray-800">{item.title_template}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">ข้อความ</p>
          <p className="text-sm text-gray-800 whitespace-pre-line">{item.body_template}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
        {variableList.length > 0 ? (
          variableList.map((variable) => (
            <span key={variable} className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1 font-semibold text-slate-700">
              {`{{${variable}}}`}
            </span>
          ))
        ) : (
          <span className="flex items-center gap-1 text-gray-500">
            <AlertCircle className="h-3.5 w-3.5" /> ไม่ได้ระบุตัวแปร
          </span>
        )}
        {item.description ? (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 font-medium text-slate-600">{item.description}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function NotificationTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [savingToggleId, setSavingToggleId] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await notificationMessagesAPI.list();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load notification templates", err);
      setError("ไม่สามารถโหลดข้อความแจ้งเตือนได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((item) =>
      [item.event_key, item.send_to, item.title_template, item.body_template]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [search, templates]);

  const handleEdit = (item) => {
    setEditing(item);
    setEditorOpen(true);
  };

  const handleToggle = async (item) => {
    setSavingToggleId(item.id);
    try {
      const next = !item.is_active;
      const payload = { ...item, is_active: next };
      await notificationMessagesAPI.update(item.id, {
        event_key: item.event_key,
        send_to: item.send_to,
        title_template: item.title_template,
        body_template: item.body_template,
        description: item.description,
        variables: item.variables || [],
        is_active: next,
      });
      setTemplates((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, is_active: next } : row))
      );
    } catch (err) {
      console.error("Failed to toggle notification message", err);
      setError("ไม่สามารถอัปเดตสถานะข้อความได้");
    } finally {
      setSavingToggleId(null);
    }
  };

  const handleReset = async (item) => {
    setResettingId(item.id);
    try {
      const updated = await notificationMessagesAPI.reset(item.id);
      const newItem = updated?.notification_message || updated;
      setTemplates((prev) => prev.map((row) => (row.id === item.id ? { ...row, ...newItem } : row)));
    } catch (err) {
      console.error("Failed to reset notification message", err);
      setError("ไม่สามารถรีเซ็ตข้อความเป็นค่าเริ่มต้นได้");
    } finally {
      setResettingId(null);
    }
  };

  const handleSave = async (payload) => {
    if (editing?.id) {
      const updated = await notificationMessagesAPI.update(editing.id, payload);
      const newItem = updated?.notification_message || updated;
      setTemplates((prev) =>
        prev.map((item) => (item.id === editing.id ? { ...item, ...newItem } : item))
      );
    } else {
      const created = await notificationMessagesAPI.create(payload);
      const newItem = created?.notification_message || created;
      setTemplates((prev) => [{ ...newItem }, ...prev]);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsSectionCard
        title="ข้อความแจ้งเตือน"
        subtitle="จัดการข้อความที่ใช้ส่งแจ้งเตือนเหตุการณ์ต่าง ๆ"
        icon={BellRing}
        iconBgClass="border border-amber-200 bg-amber-50"
        iconColorClass="text-amber-700"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="ค้นหาจาก event, ผู้รับ หรือข้อความ"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={loadTemplates}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400"
              type="button"
            >
              <RefreshCcw className="h-4 w-4" /> รีเฟรช
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="button"
            >
              <PlusCircle className="h-4 w-4" /> เพิ่มข้อความ
            </button>
          </div>
        }
      >
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">กำลังโหลดข้อมูล...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-600">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-700"><BellRing className="h-6 w-6" /></span>
            <div className="text-sm">ยังไม่มีข้อความแจ้งเตือน</div>
            <button
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="button"
            >
              <PlusCircle className="h-4 w-4" /> เพิ่มข้อความแรก
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <TemplateRow
                key={item.id}
                item={item}
                onEdit={handleEdit}
                onToggle={handleToggle}
                onReset={handleReset}
                saving={savingToggleId === item.id}
                resetting={resettingId === item.id}
              />
            ))}
          </div>
        )}
      </SettingsSectionCard>

      <TemplateEditor
        open={editorOpen}
        initial={editing}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}
