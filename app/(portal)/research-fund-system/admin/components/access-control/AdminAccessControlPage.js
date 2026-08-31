"use client";

import { RESEARCH_FUND_PAGE_ICONS } from "@/app/lib/research_fund_menu_presentation";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenText,
  Check,
  CheckCircle2,
  CircleSlash2,
  KeyRound,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

import PageLayout from "../common/PageLayout";
import { accessControlAPI, usersAPI } from "../../../../../lib/api";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  PERMISSION_CATEGORIES,
  getPermissionPresentation,
  getPermissionSearchText,
  getRolePresentation,
  groupPermissionViews,
  normalizePermissionCode,
  resolvePreviewPermissions,
} from "@/app/lib/permission_presentation.mjs";

const TAB_ITEMS = [
  { id: "roles", label: "สิทธิ์ตามบทบาท", description: "กำหนดสิทธิ์พื้นฐานของแต่ละ Role", icon: Users },
  { id: "users", label: "สิทธิ์เฉพาะบุคคล", description: "เพิ่มหรือปฏิเสธสิทธิ์เป็นรายคน", icon: UserCog },
  { id: "dictionary", label: "พจนานุกรมสิทธิ์", description: "ค้นหาความหมายของสิทธิ์ทั้งหมด", icon: BookOpenText },
];

const FILTER_OPTIONS = {
  role: [
    { value: "all", label: "ทั้งหมด" },
    { value: "selected", label: "เลือกแล้ว" },
    { value: "unselected", label: "ยังไม่ได้เลือก" },
    { value: "high_risk", label: "สิทธิ์สำคัญ" },
  ],
  user: [
    { value: "all", label: "ทั้งหมด" },
    { value: "overridden", label: "มีข้อยกเว้น" },
    { value: "effective", label: "มีสิทธิ์ใช้งาน" },
    { value: "high_risk", label: "สิทธิ์สำคัญ" },
  ],
  dictionary: [
    { value: "all", label: "ทั้งหมด" },
    { value: "page", label: "สิทธิ์เข้าถึงหน้า" },
    { value: "action", label: "สิทธิ์การทำงาน" },
    { value: "high_risk", label: "สิทธิ์สำคัญ" },
    { value: "untranslated", label: "ยังไม่มีคำแปล" },
  ],
};

const normalizeSet = (values = []) => new Set(values.map(normalizePermissionCode).filter(Boolean));

const setsEqual = (left, right) => {
  if (left.size !== right.size) return false;
  for (const item of left) {
    if (!right.has(item)) return false;
  }
  return true;
};

const mapsEqual = (left = {}, right = {}) => {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(leftEntries) === JSON.stringify(rightEntries);
};

const getUserId = (item) => item?.user_id || item?.userId || "";

const getUserName = (item) => {
  const name = String(item?.name || "").trim();
  if (name) return name;
  const firstName = String(item?.user_fname || item?.first_name || "").trim();
  const lastName = String(item?.user_lname || item?.last_name || "").trim();
  return [firstName, lastName].filter(Boolean).join(" ") || "ไม่ระบุชื่อ";
};

const getUserEmail = (item) => {
  const email = String(item?.email || "").trim();
  return email || `ผู้ใช้ #${getUserId(item)}`;
};

const riskClasses = {
  high: "border-amber-200 bg-amber-50 text-amber-800",
  critical: "border-red-200 bg-red-50 text-red-700",
};

function RiskBadge({ risk }) {
  if (risk !== "high" && risk !== "critical") return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${riskClasses[risk]}`}>
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
      {risk === "critical" ? "สิทธิ์สำคัญมาก" : "ควรตรวจสอบ"}
    </span>
  );
}

function PermissionIdentity({ permission, implications = {} }) {
  const impliedCodes = Array.isArray(implications?.[permission.code]) ? implications[permission.code] : [];

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold leading-6 text-slate-900">{permission.titleTh}</p>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
          {permission.kindLabelTh}
        </span>
        <RiskBadge risk={permission.risk} />
        {!permission.translated ? (
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">ยังไม่มีคำแปล</span>
        ) : null}
      </div>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{permission.descriptionTh}</p>
      <details className="mt-1.5 text-xs text-slate-500">
        <summary className="w-fit cursor-pointer rounded text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30">
          ดูรหัสทางเทคนิค
        </summary>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <code className="rounded-md bg-slate-100 px-2 py-1 text-[0.72rem] text-slate-700">{permission.code}</code>
          {permission.englishDescription ? <span>{permission.englishDescription}</span> : null}
        </div>
      </details>
      {impliedCodes.length > 0 ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-blue-700">
          <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          เมื่อมีสิทธิ์นี้ ระบบจะให้สิทธิ์ขั้นต่ำ {impliedCodes.map((code) => getPermissionPresentation(code).titleTh).join(", ")} โดยอัตโนมัติ
        </p>
      ) : null}
    </div>
  );
}

function FilterToolbar({ search, onSearchChange, category, onCategoryChange, mode, onModeChange, modeOptions, resultCount }) {
  return (
    <div className="border-b border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_minmax(13rem,0.55fr)]">
        <label className="relative block">
          <span className="sr-only">ค้นหาสิทธิ์</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="ค้นหาด้วยชื่อภาษาไทย หน้า ฟังก์ชัน หรือรหัส..."
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
          <span className="shrink-0 text-sm font-medium text-slate-600">หมวด</span>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="min-h-9 min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none"
          >
            <option value="all">ทุกหมวด</option>
            {PERMISSION_CATEGORIES.filter((item) => item.key !== "other").map((item) => (
              <option key={item.key} value={item.key}>{item.labelTh}</option>
            ))}
            <option value="other">สิทธิ์อื่น ๆ</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="กรองสถานะสิทธิ์">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onModeChange(option.value)}
              aria-pressed={mode === option.value}
              className={mode === option.value
                ? "min-h-9 rounded-md border border-blue-600 bg-blue-600 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                : "min-h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-slate-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600" aria-live="polite">พบ {resultCount} สิทธิ์</p>
      </div>
    </div>
  );
}

function PermissionGroups({ groups, implications, renderControl, emptyMessage }) {
  if (groups.length === 0) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
        <Search className="h-8 w-8 text-slate-400" aria-hidden="true" />
        <p className="mt-3 font-semibold text-slate-800">ไม่พบสิทธิ์ที่ตรงกับตัวกรอง</p>
        <p className="mt-1 text-sm text-slate-600">{emptyMessage || "ลองเปลี่ยนคำค้นหา หมวด หรือสถานะที่เลือก"}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`permission-group-${group.key}`}>
          <div className="flex flex-col gap-2 bg-white px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
            <div>
              <h3 id={`permission-group-${group.key}`} className="font-semibold text-slate-900">{group.labelTh}</h3>
              <p className="mt-0.5 text-sm text-slate-600">{group.descriptionTh}</p>
            </div>
            <span className="w-fit rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{group.permissions.length} รายการ</span>
          </div>
          <div className="divide-y divide-slate-200 border-t border-slate-200">
            {group.permissions.map((permission) => (
              <div key={permission.code} className="grid gap-4 bg-white px-4 py-4 transition hover:bg-slate-50 sm:px-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <PermissionIdentity permission={permission} implications={implications} />
                {renderControl(permission)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function EffectiveBadge({ effective, source }) {
  if (effective) {
    return (
      <span className="inline-flex min-h-8 items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2.5 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        {source === "allow" ? "อนุญาตเฉพาะบุคคล" : source === "implied" ? "ได้รับโดยอัตโนมัติ" : "ได้รับจากบทบาท"}
      </span>
    );
  }
  return (
    <span className={source === "deny"
      ? "inline-flex min-h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700"
      : "inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2.5 text-xs font-semibold text-slate-600"}
    >
      <CircleSlash2 className="h-3.5 w-3.5" aria-hidden="true" />
      {source === "deny" ? "ปฏิเสธเฉพาะบุคคล" : "ไม่มีสิทธิ์"}
    </span>
  );
}

export default function AdminAccessControlPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const canManageAccess = hasPermission("access.manage");

  const [activeTab, setActiveTab] = useState("roles");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [implications, setImplications] = useState({});

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolePermissionCodes, setRolePermissionCodes] = useState([]);
  const [initialRolePermissionCodes, setInitialRolePermissionCodes] = useState([]);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");
  const [roleCategory, setRoleCategory] = useState("all");
  const [roleViewMode, setRoleViewMode] = useState("all");

  const [userQuery, setUserQuery] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserRoles, setSelectedUserRoles] = useState([]);
  const [baselinePermissions, setBaselinePermissions] = useState([]);
  const [userOverrideMap, setUserOverrideMap] = useState({});
  const [initialUserOverrideMap, setInitialUserOverrideMap] = useState({});
  const [loadingUserOverrides, setLoadingUserOverrides] = useState(false);
  const [savingUserOverrides, setSavingUserOverrides] = useState(false);
  const [userPermissionSearch, setUserPermissionSearch] = useState("");
  const [userPermissionCategory, setUserPermissionCategory] = useState("all");
  const [userViewMode, setUserViewMode] = useState("all");

  const [dictionarySearch, setDictionarySearch] = useState("");
  const [dictionaryCategory, setDictionaryCategory] = useState("all");
  const [dictionaryViewMode, setDictionaryViewMode] = useState("all");

  const rolePermissionSet = useMemo(() => normalizeSet(rolePermissionCodes), [rolePermissionCodes]);
  const initialRolePermissionSet = useMemo(() => normalizeSet(initialRolePermissionCodes), [initialRolePermissionCodes]);
  const baselinePermissionSet = useMemo(() => normalizeSet(baselinePermissions), [baselinePermissions]);
  const roleDirty = !setsEqual(rolePermissionSet, initialRolePermissionSet);
  const userDirty = !mapsEqual(userOverrideMap, initialUserOverrideMap);

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.role_id) === String(selectedRoleId)) || null,
    [roles, selectedRoleId],
  );
  const permissionViews = useMemo(() => permissions.map(getPermissionPresentation), [permissions]);
  const translatedPermissionCount = useMemo(() => permissionViews.filter((permission) => permission.translated).length, [permissionViews]);
  const previewPermissionSet = useMemo(() => resolvePreviewPermissions({
    baselinePermissions,
    overrides: userOverrideMap,
    implications,
  }), [baselinePermissions, implications, userOverrideMap]);

  const filterPermissions = useCallback(({ search, category, mode, context }) => {
    const keyword = normalizePermissionCode(search);
    return permissionViews.filter((permission) => {
      if (category !== "all" && permission.category !== category) return false;
      if (keyword && !getPermissionSearchText(permission).includes(keyword)) return false;
      if (context === "role") {
        const selected = rolePermissionSet.has(permission.code);
        if (mode === "selected" && !selected) return false;
        if (mode === "unselected" && selected) return false;
      }
      if (context === "user") {
        if (mode === "overridden" && !userOverrideMap[permission.code]) return false;
        if (mode === "effective" && !previewPermissionSet.has(permission.code)) return false;
      }
      if (context === "dictionary") {
        if (mode === "page" && permission.kind !== "page" && permission.kind !== "access") return false;
        if (mode === "action" && (permission.kind === "page" || permission.kind === "access")) return false;
        if (mode === "untranslated" && permission.translated) return false;
      }
      if (mode === "high_risk" && permission.risk !== "high" && permission.risk !== "critical") return false;
      return true;
    });
  }, [permissionViews, previewPermissionSet, rolePermissionSet, userOverrideMap]);

  const roleFilteredPermissions = useMemo(() => filterPermissions({ search: roleSearch, category: roleCategory, mode: roleViewMode, context: "role" }), [filterPermissions, roleCategory, roleSearch, roleViewMode]);
  const userFilteredPermissions = useMemo(() => filterPermissions({ search: userPermissionSearch, category: userPermissionCategory, mode: userViewMode, context: "user" }), [filterPermissions, userPermissionCategory, userPermissionSearch, userViewMode]);
  const dictionaryFilteredPermissions = useMemo(() => filterPermissions({ search: dictionarySearch, category: dictionaryCategory, mode: dictionaryViewMode, context: "dictionary" }), [dictionaryCategory, dictionarySearch, dictionaryViewMode, filterPermissions]);

  const loadRolePermissions = useCallback(async (roleId) => {
    if (!roleId) {
      setRolePermissionCodes([]);
      setInitialRolePermissionCodes([]);
      return;
    }
    setLoadingRolePermissions(true);
    try {
      const response = await accessControlAPI.getRolePermissions(roleId);
      const codes = Array.isArray(response?.permission_codes) ? response.permission_codes.map(normalizePermissionCode).filter(Boolean) : [];
      setRolePermissionCodes(codes);
      setInitialRolePermissionCodes(codes);
    } catch (error) {
      console.error("Failed to load role permissions", error);
      toast.error("ไม่สามารถโหลดสิทธิ์ของบทบาทได้");
      setRolePermissionCodes([]);
      setInitialRolePermissionCodes([]);
    } finally {
      setLoadingRolePermissions(false);
    }
  }, []);

  const loadInitialData = useCallback(async ({ silent = false, preferredRoleId = "" } = {}) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([accessControlAPI.listRoles(), accessControlAPI.listPermissions()]);
      const roleList = Array.isArray(rolesResponse?.data) ? rolesResponse.data : [];
      const permissionList = Array.isArray(permissionsResponse?.data)
        ? permissionsResponse.data.map((item) => ({ ...item, code: normalizePermissionCode(item?.code) }))
        : [];
      setRoles(roleList);
      setPermissions(permissionList);
      setImplications(permissionsResponse?.implications && typeof permissionsResponse.implications === "object" ? permissionsResponse.implications : {});
      const nextRoleId = preferredRoleId && roleList.some((item) => String(item.role_id) === String(preferredRoleId))
        ? preferredRoleId
        : roleList[0]?.role_id || "";
      setSelectedRoleId(String(nextRoleId || ""));
      if (!nextRoleId) {
        setRolePermissionCodes([]);
        setInitialRolePermissionCodes([]);
      }
    } catch (error) {
      console.error("Failed to load access control data", error);
      toast.error("ไม่สามารถโหลดข้อมูลจัดการสิทธิ์ได้");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);
  useEffect(() => { if (selectedRoleId) loadRolePermissions(selectedRoleId); }, [loadRolePermissions, selectedRoleId]);

  const loadUserOverrideData = useCallback(async (userId, { fallbackUser = null } = {}) => {
    if (!userId) return;
    setLoadingUserOverrides(true);
    try {
      const response = await accessControlAPI.getUserOverrides(userId);
      const nextOverrides = {};
      (Array.isArray(response?.overrides) ? response.overrides : []).forEach((item) => {
        const code = normalizePermissionCode(item?.code);
        const effect = normalizePermissionCode(item?.effect);
        if (code && (effect === "allow" || effect === "deny")) nextOverrides[code] = effect;
      });
      setSelectedUser(response?.user || fallbackUser);
      setSelectedUserRoles(Array.isArray(response?.roles) ? response.roles : []);
      setBaselinePermissions(Array.isArray(response?.role_permissions) ? response.role_permissions : []);
      setUserOverrideMap(nextOverrides);
      setInitialUserOverrideMap(nextOverrides);
    } catch (error) {
      console.error("Failed to load user override data", error);
      toast.error("ไม่สามารถโหลดสิทธิ์เฉพาะบุคคลได้");
    } finally {
      setLoadingUserOverrides(false);
    }
  }, []);

  const handleRefresh = async () => {
    if ((roleDirty || userDirty) && !window.confirm("มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการละทิ้งการเปลี่ยนแปลงและรีเฟรชข้อมูลหรือไม่?")) return;
    await loadInitialData({ silent: true, preferredRoleId: selectedRoleId });
    if (selectedRoleId) await loadRolePermissions(selectedRoleId);
    if (selectedUser) await loadUserOverrideData(getUserId(selectedUser), { fallbackUser: selectedUser });
  };

  const handleSelectRole = (roleId) => {
    if (String(roleId) === String(selectedRoleId)) return;
    if (roleDirty && !window.confirm("สิทธิ์ของบทบาทนี้ยังไม่ได้บันทึก ต้องการละทิ้งการเปลี่ยนแปลงหรือไม่?")) return;
    setSelectedRoleId(String(roleId));
  };

  const handleToggleRolePermission = (permissionCode) => {
    const code = normalizePermissionCode(permissionCode);
    if (!code || !canManageAccess) return;
    setRolePermissionCodes((previous) => {
      const next = normalizeSet(previous);
      next.has(code) ? next.delete(code) : next.add(code);
      return Array.from(next).sort((a, b) => a.localeCompare(b));
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!canManageAccess || !selectedRoleId) return;
    const removesAccessManagement = initialRolePermissionSet.has("access.manage") && !rolePermissionSet.has("access.manage");
    if (removesAccessManagement && !window.confirm("กำลังนำสิทธิ์แก้ไขการเข้าถึงออกจากบทบาทนี้ ผู้ใช้ในบทบาทอาจไม่สามารถจัดการสิทธิ์ได้ ต้องการดำเนินการต่อหรือไม่?")) return;
    setSavingRolePermissions(true);
    try {
      const payload = Array.from(rolePermissionSet).sort((a, b) => a.localeCompare(b));
      const response = await accessControlAPI.updateRolePermissions(selectedRoleId, payload);
      const savedCodes = Array.isArray(response?.permission_codes) ? response.permission_codes.map(normalizePermissionCode).filter(Boolean) : payload;
      setRolePermissionCodes(savedCodes);
      setInitialRolePermissionCodes(savedCodes);
      toast.success("บันทึกสิทธิ์ของบทบาทแล้ว");
    } catch (error) {
      console.error("Failed to save role permissions", error);
      toast.error("ไม่สามารถบันทึกสิทธิ์ของบทบาทได้");
    } finally {
      setSavingRolePermissions(false);
    }
  };

  const handleSearchUsers = async (event) => {
    event?.preventDefault();
    const query = userQuery.trim().toLowerCase();
    if (query.length < 4 || !query.includes("@")) {
      toast.error("กรุณากรอกอีเมลอย่างน้อย 4 ตัวอักษร");
      return;
    }
    setSearchingUsers(true);
    try {
      const response = await usersAPI.search(query);
      const found = (Array.isArray(response?.data) ? response.data : [])
        .filter((item) => getUserEmail(item).toLowerCase().includes(query))
        .sort((a, b) => getUserEmail(a).localeCompare(getUserEmail(b)));
      setUserOptions(found);
      if (found.length === 0) toast("ไม่พบผู้ใช้ที่ค้นหา");
      if (found.length === 1) await handleSelectUser(found[0]);
    } catch (error) {
      console.error("Failed to search users", error);
      toast.error("ค้นหาผู้ใช้ไม่สำเร็จ");
      setUserOptions([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSelectUser = async (nextUser) => {
    if (userDirty && !window.confirm("ข้อยกเว้นของผู้ใช้คนนี้ยังไม่ได้บันทึก ต้องการละทิ้งการเปลี่ยนแปลงหรือไม่?")) return;
    setSelectedUser(nextUser);
    setUserOptions([]);
    await loadUserOverrideData(getUserId(nextUser), { fallbackUser: nextUser });
  };

  const handleSetOverride = (permissionCode, effect) => {
    if (!canManageAccess) return;
    const code = normalizePermissionCode(permissionCode);
    setUserOverrideMap((previous) => {
      const next = { ...previous };
      if (effect === "allow" || effect === "deny") next[code] = effect;
      else delete next[code];
      return next;
    });
  };

  const handleSaveUserOverrides = async () => {
    if (!canManageAccess || !selectedUser) return;
    const selectedUserId = String(getUserId(selectedUser));
    const currentUserId = String(getUserId(currentUser));
    const selfDenied = selectedUserId && selectedUserId === currentUserId
      && (userOverrideMap["access.manage"] === "deny" || userOverrideMap["ui.page.admin.access_control.view"] === "deny");
    if (selfDenied && !window.confirm("คุณกำลังปฏิเสธสิทธิ์จัดการการเข้าถึงของบัญชีตนเอง หลังบันทึกอาจกลับมาแก้ไขหน้านี้ไม่ได้ ต้องการดำเนินการต่อหรือไม่?")) return;
    setSavingUserOverrides(true);
    try {
      const overrides = Object.entries(userOverrideMap)
        .filter(([, effect]) => effect === "allow" || effect === "deny")
        .map(([code, effect]) => ({ code, effect }));
      const response = await accessControlAPI.updateUserOverrides(selectedUserId, overrides);
      const nextOverrides = {};
      (Array.isArray(response?.overrides) ? response.overrides : []).forEach((item) => {
        const code = normalizePermissionCode(item?.code);
        const effect = normalizePermissionCode(item?.effect);
        if (code && (effect === "allow" || effect === "deny")) nextOverrides[code] = effect;
      });
      setSelectedUser(response?.user || selectedUser);
      setSelectedUserRoles(Array.isArray(response?.roles) ? response.roles : selectedUserRoles);
      setBaselinePermissions(Array.isArray(response?.role_permissions) ? response.role_permissions : baselinePermissions);
      setUserOverrideMap(nextOverrides);
      setInitialUserOverrideMap(nextOverrides);
      toast.success("บันทึกสิทธิ์เฉพาะบุคคลแล้ว");
    } catch (error) {
      console.error("Failed to save user overrides", error);
      toast.error("ไม่สามารถบันทึกสิทธิ์เฉพาะบุคคลได้");
    } finally {
      setSavingUserOverrides(false);
    }
  };

  const switchTab = (tabId) => {
    if (tabId === activeTab) return true;
    if ((activeTab === "roles" && roleDirty) || (activeTab === "users" && userDirty)) {
      if (!window.confirm("มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการออกจากส่วนนี้และละทิ้งการเปลี่ยนแปลงหรือไม่?")) return false;
      if (activeTab === "roles") setRolePermissionCodes(initialRolePermissionCodes);
      if (activeTab === "users") setUserOverrideMap(initialUserOverrideMap);
    }
    setActiveTab(tabId);
    return true;
  };

  return (
    <PageLayout
      title="จัดการสิทธิ์การเข้าถึง"
      subtitle="กำหนดว่าแต่ละบทบาทและผู้ใช้งานสามารถเข้าถึงหน้าใดหรือดำเนินการอะไรได้บ้าง"
      icon={RESEARCH_FUND_PAGE_ICONS.accessControl}
      actions={(
        <button type="button" onClick={handleRefresh} disabled={refreshing} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
          รีเฟรชข้อมูล
        </button>
      )}
      loading={loading}
    >
      {!canManageAccess ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900" role="status">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">กำลังดูข้อมูลในโหมดอ่านอย่างเดียว</p>
            <p className="mt-0.5 text-sm leading-6 text-amber-800">บัญชีนี้ตรวจสอบสิทธิ์ได้ แต่ต้องมีสิทธิ์ “แก้ไขสิทธิ์การเข้าถึง” จึงจะบันทึกการเปลี่ยนแปลงได้</p>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">ศูนย์ควบคุมสิทธิ์</h2>
              <p className="mt-0.5 max-w-2xl text-sm leading-6 text-slate-600">ชื่อภาษาไทยอธิบายผลต่อผู้ใช้งาน ส่วนรหัสภาษาอังกฤษเก็บไว้สำหรับการตรวจสอบทางเทคนิค</p>
            </div>
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-1.5"><dt>บทบาท</dt><dd className="font-semibold tabular-nums text-slate-900">{roles.length}</dd></div>
            <div className="flex items-center gap-1.5"><dt>สิทธิ์ทั้งหมด</dt><dd className="font-semibold tabular-nums text-slate-900">{permissions.length}</dd></div>
          </dl>
        </div>

        <div className="grid border-b border-slate-200 bg-slate-50 md:grid-cols-3" role="tablist" aria-label="ส่วนจัดการสิทธิ์">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`access-tab-${tab.id}`}
                type="button"
                role="tab"
                tabIndex={active ? 0 : -1}
                aria-selected={active}
                onClick={() => switchTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  const currentIndex = TAB_ITEMS.findIndex((item) => item.id === tab.id);
                  const offset = event.key === "ArrowRight" ? 1 : -1;
                  const nextIndex = (currentIndex + offset + TAB_ITEMS.length) % TAB_ITEMS.length;
                  const nextTab = TAB_ITEMS[nextIndex];
                  if (switchTab(nextTab.id)) {
                    event.currentTarget.parentElement?.querySelector(`#access-tab-${nextTab.id}`)?.focus();
                  }
                }}
                className={active
                ? "flex min-h-20 items-start gap-3 border-b-2 border-blue-600 bg-white px-4 py-4 text-left text-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/30 md:border-r md:border-r-slate-200"
                : "flex min-h-20 items-start gap-3 border-b border-slate-200 px-4 py-4 text-left text-slate-700 transition hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/30 md:border-b-0 md:border-r"}
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block font-semibold">{tab.label}</span>
                  <span className={`mt-0.5 block text-xs leading-5 ${active ? "text-blue-700" : "text-slate-500"}`}>{tab.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === "roles" ? (
          <div id="access-panel-roles" role="tabpanel" aria-labelledby="access-tab-roles" className="grid min-h-[36rem] xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50 xl:border-b-0 xl:border-r" aria-label="เลือกบทบาท">
              <div className="border-b border-slate-200 px-4 py-4">
                <h3 className="font-semibold text-slate-900">เลือกบทบาท</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">สิทธิ์ที่เลือกจะเป็นค่าพื้นฐานของผู้ใช้ในบทบาทนั้น</p>
              </div>
              <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-1">
                {roles.map((role) => {
                  const presentation = getRolePresentation(role);
                  const active = String(role.role_id) === String(selectedRoleId);
                  return (
                    <button key={role.role_id} type="button" onClick={() => handleSelectRole(role.role_id)} aria-pressed={active} className={active
                      ? "min-h-20 rounded-lg border border-blue-300 bg-blue-50 px-3 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      : "min-h-20 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30"}
                    >
                      <span className={`block font-semibold ${active ? "text-blue-800" : "text-slate-900"}`}>{presentation.labelTh}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{role.role}</span>
                      <span className="mt-2 block text-xs font-medium text-slate-600">{role.permission_count || 0} สิทธิ์ที่บันทึกไว้</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section aria-label="แก้ไขสิทธิ์ของบทบาท" className="min-w-0">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <p className="text-sm text-slate-600">กำลังแก้ไข</p>
                  <h3 className="mt-0.5 text-lg font-semibold text-slate-900">{getRolePresentation(selectedRole).labelTh}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">{selectedRole?.role || "ยังไม่ได้เลือกบทบาท"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">เลือก {rolePermissionSet.size} สิทธิ์</span>
                  {roleDirty ? <span className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">มีการเปลี่ยนแปลง</span> : null}
                </div>
              </div>

              <FilterToolbar search={roleSearch} onSearchChange={setRoleSearch} category={roleCategory} onCategoryChange={setRoleCategory} mode={roleViewMode} onModeChange={setRoleViewMode} modeOptions={FILTER_OPTIONS.role} resultCount={roleFilteredPermissions.length} />

              {loadingRolePermissions ? (
                <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-600" aria-live="polite"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> กำลังโหลดสิทธิ์ของบทบาท...</div>
              ) : (
                <PermissionGroups
                  groups={groupPermissionViews(roleFilteredPermissions)}
                  implications={implications}
                  renderControl={(permission) => (
                    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 lg:min-w-36">
                      <span>{rolePermissionSet.has(permission.code) ? "อนุญาต" : "ไม่อนุญาต"}</span>
                      <input type="checkbox" checked={rolePermissionSet.has(permission.code)} onChange={() => handleToggleRolePermission(permission.code)} disabled={!canManageAccess} aria-label={`${rolePermissionSet.has(permission.code) ? "ยกเลิก" : "ให้"}สิทธิ์ ${permission.titleTh}`} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60" />
                    </label>
                  )}
                />
              )}

              <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-300 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-slate-600">สิทธิ์การทำงานระดับสูงจะไม่ถูกเปิดตามสิทธิ์เข้าหน้าโดยอัตโนมัติ</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRolePermissionCodes(initialRolePermissionCodes)} disabled={!roleDirty || savingRolePermissions} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-4 w-4" aria-hidden="true" /> ยกเลิกการแก้ไข</button>
                  <button type="button" onClick={handleSaveRolePermissions} disabled={!roleDirty || !canManageAccess || savingRolePermissions} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:bg-slate-300">
                    {savingRolePermissions ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />} บันทึกสิทธิ์บทบาท
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "users" ? (
          <div id="access-panel-users" role="tabpanel" aria-labelledby="access-tab-users" className="min-h-[36rem]">
            <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
              <form onSubmit={handleSearchUsers} className="mx-auto max-w-3xl">
                <label htmlFor="access-user-search" className="block text-sm font-semibold text-slate-900">ค้นหาผู้ใช้งานด้วยอีเมล</label>
                <p className="mt-1 text-sm text-slate-600">เลือกผู้ใช้เพื่อดูสิทธิ์จาก Role และกำหนดเฉพาะรายการที่ต้องการยกเว้น</p>
                <div className="relative mt-3 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input id="access-user-search" type="email" value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder="name@kku.ac.th" autoComplete="off" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <button type="submit" disabled={searchingUsers} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60">
                    {searchingUsers ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />} ค้นหาผู้ใช้
                  </button>
                </div>
                {userOptions.length > 0 ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-300 bg-white" aria-label="ผลการค้นหาผู้ใช้">
                    {userOptions.map((item) => (
                      <button key={getUserId(item)} type="button" onClick={() => handleSelectUser(item)} className="block min-h-14 w-full border-b border-slate-200 px-3 py-2 text-left transition last:border-b-0 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500/30">
                        <span className="block font-semibold text-slate-900">{getUserName(item)}</span>
                        <span className="block text-sm text-slate-600">{getUserEmail(item)}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </form>
            </div>

            {loadingUserOverrides ? (
              <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-600" aria-live="polite"><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> กำลังตรวจสอบสิทธิ์ของผู้ใช้...</div>
            ) : selectedUser ? (
              <>
                <section className="border-b border-slate-200 px-4 py-4 sm:px-5" aria-labelledby="selected-user-title">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700"><UserCog className="h-5 w-5" aria-hidden="true" /></div>
                      <div>
                        <h3 id="selected-user-title" className="font-semibold text-slate-900">{getUserName(selectedUser)}</h3>
                        <p className="mt-0.5 text-sm text-slate-600">{getUserEmail(selectedUser)}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(selectedUserRoles.length > 0 ? selectedUserRoles : [{ role: selectedUser.role, role_key: selectedUser.role_key, is_primary: true }]).map((role) => {
                            const rolePresentation = getRolePresentation(role);
                            return <span key={`${role.role_id || role.role_key}-${role.is_primary}`} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">{rolePresentation.labelTh}{role.is_primary ? " · บทบาทหลัก" : " · บทบาทเสริม"}</span>;
                          })}
                        </div>
                      </div>
                    </div>
                    <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                      <div><dt className="inline">จากบทบาท </dt><dd className="inline font-semibold tabular-nums text-slate-900">{baselinePermissions.length}</dd></div>
                      <div><dt className="inline">ข้อยกเว้น </dt><dd className="inline font-semibold tabular-nums text-blue-700">{Object.keys(userOverrideMap).length}</dd></div>
                      <div><dt className="inline">มีผลจริง </dt><dd className="inline font-semibold tabular-nums text-green-700">{previewPermissionSet.size}</dd></div>
                    </dl>
                  </div>
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-800"><SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />ใช้ “ตามบทบาท” เป็นค่าเริ่มต้น เลือกอนุญาตหรือปฏิเสธเฉพาะกรณีที่ผู้ใช้นี้ต้องแตกต่างจากคนอื่นใน Role เดียวกัน</div>
                </section>

                <FilterToolbar search={userPermissionSearch} onSearchChange={setUserPermissionSearch} category={userPermissionCategory} onCategoryChange={setUserPermissionCategory} mode={userViewMode} onModeChange={setUserViewMode} modeOptions={FILTER_OPTIONS.user} resultCount={userFilteredPermissions.length} />

                <PermissionGroups
                  groups={groupPermissionViews(userFilteredPermissions)}
                  implications={implications}
                  renderControl={(permission) => {
                    const effect = userOverrideMap[permission.code] || "inherit";
                    const inBaseline = baselinePermissionSet.has(permission.code);
                    const effective = previewPermissionSet.has(permission.code);
                    const source = effect === "allow" ? "allow" : effect === "deny" ? "deny" : inBaseline ? "role" : effective ? "implied" : "none";
                    return (
                      <div className="flex min-w-0 flex-col gap-2 lg:w-[29rem] lg:items-end">
                        <div className="grid w-full grid-cols-1 gap-1 rounded-lg border border-slate-300 bg-slate-50 p-1 sm:grid-cols-3" role="radiogroup" aria-label={`ข้อยกเว้นสำหรับ ${permission.titleTh}`}>
                          {[
                            { value: "inherit", label: "ตามบทบาท" },
                            { value: "allow", label: "อนุญาตเพิ่ม" },
                            { value: "deny", label: "ปฏิเสธ" },
                          ].map((option) => {
                            const active = effect === option.value;
                            const activeClass = option.value === "allow" ? "border-green-300 bg-green-50 text-green-700" : option.value === "deny" ? "border-red-300 bg-red-50 text-red-700" : "border-blue-300 bg-white text-blue-700";
                            return (
                              <button key={option.value} type="button" role="radio" aria-checked={active} onClick={() => handleSetOverride(permission.code, option.value)} disabled={!canManageAccess} className={active
                                ? `min-h-10 rounded-md border px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${activeClass}`
                                : "min-h-10 rounded-md border border-transparent px-2 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"}
                              >{option.label}</button>
                            );
                          })}
                        </div>
                        <EffectiveBadge effective={effective} source={source} />
                      </div>
                    );
                  }}
                />

                <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-slate-300 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <p className="text-sm text-slate-600">บันทึกเฉพาะข้อยกเว้น ค่า “ตามบทบาท” จะไม่สร้างข้อมูลเพิ่มในฐานข้อมูล</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setUserOverrideMap(initialUserOverrideMap)} disabled={!userDirty || savingUserOverrides} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-4 w-4" aria-hidden="true" /> ยกเลิกการแก้ไข</button>
                    <button type="button" onClick={handleSaveUserOverrides} disabled={!userDirty || !canManageAccess || savingUserOverrides} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:bg-slate-300">
                      {savingUserOverrides ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />} บันทึกข้อยกเว้น
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"><UserCog className="h-6 w-6" aria-hidden="true" /></div>
                <h3 className="mt-4 font-semibold text-slate-900">เลือกผู้ใช้เพื่อเริ่มตรวจสอบสิทธิ์</h3>
                <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">ระบบจะแสดงสิทธิ์พื้นฐานจากทุก Role ที่ active และข้อยกเว้นของผู้ใช้นั้นโดยไม่เปลี่ยนแปลงข้อมูลจนกว่าจะกดบันทึก</p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "dictionary" ? (
          <div id="access-panel-dictionary" role="tabpanel" aria-labelledby="access-tab-dictionary" className="min-h-[36rem]">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700"><BookOpenText className="h-5 w-5" aria-hidden="true" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900">ความหมายของสิทธิ์ในระบบ</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">ส่วนนี้เป็นข้อมูลอ่านอย่างเดียว ใช้ค้นหาว่าสิทธิ์แต่ละรายการเปิดหน้าใด ทำงานอะไร และมีความเสี่ยงระดับไหน</p>
                </div>
              </div>
            </div>
            <FilterToolbar search={dictionarySearch} onSearchChange={setDictionarySearch} category={dictionaryCategory} onCategoryChange={setDictionaryCategory} mode={dictionaryViewMode} onModeChange={setDictionaryViewMode} modeOptions={FILTER_OPTIONS.dictionary} resultCount={dictionaryFilteredPermissions.length} />
            <PermissionGroups
              groups={groupPermissionViews(dictionaryFilteredPermissions)}
              implications={implications}
              renderControl={(permission) => (
                <div className="flex items-center gap-2 lg:min-w-32 lg:justify-end">
                  {permission.risk === "normal" ? (
                    <span className="inline-flex min-h-8 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600"><Check className="h-3.5 w-3.5" aria-hidden="true" /> สิทธิ์ทั่วไป</span>
                  ) : <RiskBadge risk={permission.risk} />}
                </div>
              )}
            />
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
