"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { usersAPI } from "@/app/lib/api";
import { getRolePresentation } from "@/app/lib/permission_presentation.mjs";

const EMPTY_FORM = {
  prefix: "",
  user_fname: "",
  user_lname: "",
  name_en: "",
  gender: "",
  email: "",
  email_notification: "",
  tel: "",
  date_of_employment: "",
  manage_position: "",
  lab_name: "",
  room: "",
  role_id: "",
  temporary_password: "",
  confirm_password: "",
};

const cleanDate = (value) => String(value || "").slice(0, 10);

const toForm = (user) => ({
  ...EMPTY_FORM,
  prefix: user?.prefix || "",
  user_fname: user?.user_fname || "",
  user_lname: user?.user_lname || "",
  name_en: user?.name_en || "",
  gender: user?.gender || "",
  email: user?.email || "",
  email_notification: user?.email_notification || "",
  tel: user?.tel || "",
  date_of_employment: cleanDate(user?.date_of_employment),
  manage_position: user?.manage_position || "",
  lab_name: user?.lab_name || "",
  room: user?.room || "",
  role_id: String(user?.role_id || ""),
});

const displayName = (user) => [user?.prefix, user?.user_fname, user?.user_lname].filter(Boolean).join(" ").trim() || "ไม่ระบุชื่อ";

const formatDateTime = (value) => {
  if (!value) return "ยังไม่เคยเข้าใช้";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ยังไม่เคยเข้าใช้";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

function LoginBadge({ active, children }) {
  return (
    <span className={active
      ? "inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"
      : "inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500"}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

function UserFormDrawer({ mode, user, options, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => toForm(user));
  const [initialForm, setInitialForm] = useState(() => toForm(user));
  const [showPassword, setShowPassword] = useState(false);
  const isCreate = mode === "create";

  useEffect(() => {
    const next = toForm(user);
    if (isCreate) {
      next.role_id = String(options.roles?.[0]?.role_id || "");
    }
    setForm(next);
    setInitialForm(next);
  }, [isCreate, options.roles, user]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const requestClose = () => {
    if (dirty && !window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดแบบฟอร์มหรือไม่?")) return;
    onClose();
  };

  const setField = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isCreate && form.temporary_password !== form.confirm_password) {
      toast.error("รหัสผ่านชั่วคราวและการยืนยันไม่ตรงกัน");
      return;
    }
    if (isCreate && form.temporary_password.length < 8) {
      toast.error("รหัสผ่านชั่วคราวต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    const payload = { ...form, role_id: Number(form.role_id) };
    delete payload.confirm_password;
    if (!isCreate) delete payload.temporary_password;
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/40" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
      <section className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-blue-700">{isCreate ? "บัญชีใหม่" : `ผู้ใช้ #${user?.user_id}`}</p>
            <h2 id="user-form-title" className="mt-1 text-xl font-bold text-slate-950">{isCreate ? "เพิ่มผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน"}</h2>
            <p className="mt-1 text-sm text-slate-600">ข้อมูลที่มีเครื่องหมาย <span className="font-semibold text-red-600">*</span> จำเป็นต้องกรอกก่อนบันทึก</p>
          </div>
          <button type="button" onClick={requestClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30" aria-label="ปิดแบบฟอร์ม">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5 sm:px-6">
            <fieldset>
              <legend className="flex items-center gap-2 font-semibold text-slate-900"><UserRound className="h-4 w-4 text-blue-600" aria-hidden="true" />ข้อมูลประจำตัว</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">คำนำหน้า <span className="text-red-600">*</span>
                  <input required value={form.prefix} onChange={setField("prefix")} placeholder="เช่น ผศ. ดร." className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700">เพศ
                  <select value={form.gender} onChange={setField("gender")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option value="">ไม่ระบุ</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option><option value="อื่น ๆ">อื่น ๆ</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">ชื่อ <span className="text-red-600">*</span>
                  <input required value={form.user_fname} onChange={setField("user_fname")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700">นามสกุล <span className="text-red-600">*</span>
                  <input required value={form.user_lname} onChange={setField("user_lname")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">ชื่อภาษาอังกฤษ
                  <input value={form.name_en} onChange={setField("name_en")} placeholder="First name and last name" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden="true" />ตำแหน่งการใช้งาน</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">ตำแหน่ง <span className="text-red-600">*</span>
                  <select required value={form.role_id} onChange={setField("role_id")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option value="">เลือกตำแหน่ง</option>
                    {(options.roles || []).map((item) => <option key={item.role_id} value={item.role_id}>{getRolePresentation(item).labelTh}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">วันเริ่มงาน
                  <input type="date" value={form.date_of_employment} onChange={setField("date_of_employment")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700">ตำแหน่งบริหาร
                  <input value={form.manage_position} onChange={setField("manage_position")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
              </div>
              {!isCreate && String(user?.role_id || "") !== form.role_id ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />การเปลี่ยนตำแหน่งอาจเปลี่ยนเมนู ขั้นตอนอนุมัติ และสิทธิ์พื้นฐานของผู้ใช้นี้</div>
              ) : null}
            </fieldset>

            <fieldset>
              <legend className="flex items-center gap-2 font-semibold text-slate-900"><KeyRound className="h-4 w-4 text-blue-600" aria-hidden="true" />ข้อมูลติดต่อและบัญชี</legend>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">อีเมลสำหรับเข้าสู่ระบบ <span className="text-red-600">*</span>
                  <input required type="email" value={form.email} onChange={setField("email")} autoComplete="off" placeholder="name@kku.ac.th" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700">อีเมลรับการแจ้งเตือน
                  <input type="email" value={form.email_notification} onChange={setField("email_notification")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700">โทรศัพท์
                  <input value={form.tel} onChange={setField("tel")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700">ห้อง
                  <input value={form.room} onChange={setField("room")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                <label className="block text-sm font-medium text-slate-700">ห้องปฏิบัติการ / แล็บ
                  <input value={form.lab_name} onChange={setField("lab_name")} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </label>
                {isCreate ? (
                  <>
                    <label className="block text-sm font-medium text-slate-700">รหัสผ่านชั่วคราว <span className="text-red-600">*</span>
                      <span className="relative mt-1.5 block">
                        <input required minLength={8} type={showPassword ? "text" : "password"} value={form.temporary_password} onChange={setField("temporary_password")} autoComplete="new-password" className="min-h-11 w-full rounded-lg border border-slate-300 px-3 pr-11 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                        <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                      </span>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">ยืนยันรหัสผ่าน <span className="text-red-600">*</span>
                      <input required minLength={8} type={showPassword ? "text" : "password"} value={form.confirm_password} onChange={setField("confirm_password")} autoComplete="new-password" className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    </label>
                    <p className="sm:col-span-2 text-xs leading-5 text-slate-500">ผู้ใช้สามารถล็อกอินด้วยรหัสนี้ได้ทันที หรือใช้ Forgot Password เพื่อกำหนดรหัสใหม่ภายหลัง ระบบไม่ส่งรหัสให้ผู้ใช้อัตโนมัติ</p>
                  </>
                ) : (
                  <p className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">การแก้ไขข้อมูลหน้านี้จะไม่เปลี่ยนรหัสผ่านหรือบัญชี KKU SSO ที่เชื่อมไว้</p>
                )}
              </div>
            </fieldset>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            <button type="button" onClick={requestClose} disabled={saving} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">ยกเลิก</button>
            <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:bg-slate-300">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{isCreate ? "เพิ่มผู้ใช้งาน" : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function UserManagementPanel({ canManage, onManagePermissions, refreshKey = 0 }) {
  const [users, setUsers] = useState([]);
  const [options, setOptions] = useState({ roles: [] });
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [roleId, setRoleId] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, page_size: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawer, setDrawer] = useState(null);

  const roleLookup = useMemo(() => new Map((options.roles || []).map((item) => [String(item.role_id), item])), [options.roles]);

  const loadOptions = useCallback(async () => {
    try {
      const response = await usersAPI.getOptions();
      setOptions({ roles: response?.data?.roles || [] });
    } catch (error) {
      console.error("Failed to load user options", error);
      toast.error("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersAPI.list({ q: appliedQuery || undefined, role_id: roleId || undefined, page, page_size: 20 });
      setUsers(Array.isArray(response?.data) ? response.data : []);
      setPagination(response?.pagination || { page, page_size: 20, total: 0, total_pages: 0 });
    } catch (error) {
      console.error("Failed to load managed users", error);
      toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้งานได้");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, page, roleId]);

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => { loadUsers(); }, [loadUsers, refreshKey]);

  const applySearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedQuery(query.trim());
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (drawer.mode === "create") {
        await usersAPI.create(payload);
        toast.success("เพิ่มผู้ใช้งานแล้ว");
      } else {
        await usersAPI.update(drawer.user.user_id, payload);
        toast.success("บันทึกข้อมูลผู้ใช้งานแล้ว");
      }
      setDrawer(null);
      await loadUsers();
    } catch (error) {
      console.error("Failed to save managed user", error);
      toast.error(error?.message || "ไม่สามารถบันทึกข้อมูลผู้ใช้งานได้");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="access-panel-user-management" role="tabpanel" aria-labelledby="access-tab-user-management" className="min-h-[36rem]">
      <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <form onSubmit={applySearch} className="grid flex-1 gap-3 md:grid-cols-[minmax(16rem,1fr)_13rem_auto]">
            <label className="block text-sm font-medium text-slate-700">ค้นหาผู้ใช้งาน
              <span className="relative mt-1.5 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อ นามสกุล หรืออีเมล" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></span>
            </label>
            <label className="block text-sm font-medium text-slate-700">ตำแหน่ง
              <select value={roleId} onChange={(event) => { setRoleId(event.target.value); setPage(1); }} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"><option value="">ทุกตำแหน่ง</option>{(options.roles || []).map((item) => <option key={item.role_id} value={item.role_id}>{getRolePresentation(item).labelTh}</option>)}</select>
            </label>
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30"><Search className="h-4 w-4" aria-hidden="true" />ค้นหา</button>
          </form>
          {canManage ? <button type="button" onClick={() => setDrawer({ mode: "create", user: null })} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"><Plus className="h-4 w-4" aria-hidden="true" />เพิ่มผู้ใช้งาน</button> : null}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-white text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">ผู้ใช้งาน</th><th className="px-5 py-3">ตำแหน่ง</th><th className="px-5 py-3">ช่องทางเข้าสู่ระบบ</th><th className="px-5 py-3">เข้าใช้ล่าสุด</th><th className="px-5 py-3 text-right">จัดการ</th></tr></thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? <tr><td colSpan={5} className="px-5 py-16 text-center text-slate-600"><span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />กำลังโหลดรายชื่อ...</span></td></tr> : null}
            {!loading && users.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center"><UserRound className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" /><p className="mt-3 font-semibold text-slate-800">ไม่พบผู้ใช้งาน</p><p className="mt-1 text-sm text-slate-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p></td></tr> : null}
            {!loading ? users.map((user) => (
              <tr key={user.user_id} className="align-top transition hover:bg-slate-50">
                <td className="px-5 py-4"><p className="font-semibold text-slate-900">{displayName(user)}</p><p className="mt-1 text-slate-600">{user.email}</p><p className="mt-1 text-xs text-slate-400">User ID: {user.user_id}</p></td>
                <td className="px-5 py-4"><span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{getRolePresentation(roleLookup.get(String(user.role_id)) || { role: user.role }).labelTh}</span></td>
                <td className="px-5 py-4"><div className="flex flex-wrap gap-1.5"><LoginBadge active={user.local_auth}>{user.local_auth ? "Local พร้อมใช้" : "Local ยังไม่มีรหัส"}</LoginBadge><LoginBadge active={user.sso_auth}>{user.sso_auth ? "KKU SSO เชื่อมแล้ว" : "KKU SSO ยังไม่เชื่อม"}</LoginBadge></div></td>
                <td className="px-5 py-4 text-slate-600">{formatDateTime(user.last_login_at)}</td>
                <td className="px-5 py-4"><div className="flex justify-end gap-2">{onManagePermissions ? <button type="button" onClick={() => onManagePermissions(user)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"><KeyRound className="h-3.5 w-3.5" aria-hidden="true" />สิทธิ์</button> : null}{canManage ? <button type="button" onClick={() => setDrawer({ mode: "edit", user })} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-blue-300 bg-blue-50 px-3 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Pencil className="h-3.5 w-3.5" aria-hidden="true" />แก้ไข</button> : null}</div></td>
              </tr>
            )) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">ทั้งหมด <span className="font-semibold tabular-nums text-slate-900">{pagination.total || 0}</span> คน</p>
        <div className="flex items-center gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || loading} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />ก่อนหน้า</button><span className="min-w-24 text-center text-sm text-slate-600">หน้า {pagination.page || 1} / {Math.max(1, pagination.total_pages || 1)}</span><button type="button" onClick={() => setPage((value) => value + 1)} disabled={loading || page >= (pagination.total_pages || 1)} className="inline-flex min-h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-40">ถัดไป<ChevronRight className="h-4 w-4" /></button></div>
      </div>

      {drawer ? <UserFormDrawer mode={drawer.mode} user={drawer.user} options={options} saving={saving} onClose={() => setDrawer(null)} onSave={handleSave} /> : null}
    </div>
  );
}
