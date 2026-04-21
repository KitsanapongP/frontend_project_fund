"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Save, Search, ShieldCheck, UserCog } from "lucide-react";
import PageLayout from "../common/PageLayout";
import { accessControlAPI, usersAPI } from "../../../lib/api";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "react-hot-toast";

const EFFECT_OPTIONS = [
  { value: "inherit", label: "ตาม Role" },
  { value: "allow", label: "Allow" },
  { value: "deny", label: "Deny" },
];

const normalizeCode = (value) => String(value || "").trim().toLowerCase();

const PAGE_CHILD_PERMISSION_HINTS = {
  "ui.page.admin.dashboard.view": ["dashboard.view.admin"],
  "ui.page.admin.applications.view": ["submission.read.all", "fund.request.approve", "publication.reward.approve"],
  "ui.page.admin.research_dashboard.view": ["scopus.publications.read"],
  "ui.page.admin.scopus.view": [
    "scopus.publications.read",
    "scopus.publications.read_by_user",
    "scopus.publications.export",
    "scopus.publications.export_by_user",
  ],
  "ui.page.admin.import_export.view": ["report.export"],
  "ui.page.admin.access_control.view": ["access.view", "access.manage"],
  "ui.page.member.dept_review.view": [
    "submission.read.department",
    "dept_head.review.recommend",
    "dept_head.review.reject",
    "dept_head.review.request_revision",
  ],
};

const getUserEmail = (user) => {
  const email = String(user?.email || "").trim();
  if (email) {
    return email;
  }
  const userId = user?.user_id || user?.userId;
  return userId ? `ผู้ใช้ #${userId}` : "ผู้ใช้";
};

export default function AdminAccessControlPage() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rolePermissionCodes, setRolePermissionCodes] = useState([]);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [savingRolePermissions, setSavingRolePermissions] = useState(false);

  const [userQuery, setUserQuery] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserOverrides, setLoadingUserOverrides] = useState(false);
  const [savingUserOverrides, setSavingUserOverrides] = useState(false);
  const [userOverrideMap, setUserOverrideMap] = useState({});
  const [effectivePermissions, setEffectivePermissions] = useState([]);
  const [permissionFilter, setPermissionFilter] = useState("");
  const [overrideViewMode, setOverrideViewMode] = useState("all");

  const canManageAccess = hasPermission("access.manage");

  const permissionByCode = useMemo(() => {
    const map = new Map();
    permissions.forEach((permission) => {
      const code = normalizeCode(permission?.code);
      if (!code) return;
      map.set(code, permission);
    });
    return map;
  }, [permissions]);

  const pagePermissionGroups = useMemo(() => {
    const pagePermissions = permissions
      .filter((permission) => {
        const code = normalizeCode(permission?.code);
        return code.startsWith("ui.page.") && code.endsWith(".view");
      })
      .sort((a, b) => normalizeCode(a?.code).localeCompare(normalizeCode(b?.code)));

    return pagePermissions.map((pagePermission) => {
      const pageCode = normalizeCode(pagePermission?.code);
      const hintedChildren = PAGE_CHILD_PERMISSION_HINTS[pageCode] || [];
      const children = hintedChildren
        .map((code) => normalizeCode(code))
        .map((code) => permissionByCode.get(code))
        .filter(Boolean);

      const allCodes = [
        pageCode,
        ...children.map((item) => normalizeCode(item?.code)).filter(Boolean),
      ];

      return {
        key: pageCode,
        title: pagePermission?.description || pagePermission?.code,
        pagePermission,
        children,
        allCodes,
      };
    });
  }, [permissionByCode, permissions]);

  const ungroupedPermissions = useMemo(() => {
    const groupedCodes = new Set();
    pagePermissionGroups.forEach((group) => {
      group.allCodes.forEach((code) => groupedCodes.add(code));
    });
    return permissions
      .filter((permission) => !groupedCodes.has(normalizeCode(permission?.code)))
      .sort((a, b) => normalizeCode(a?.code).localeCompare(normalizeCode(b?.code)));
  }, [pagePermissionGroups, permissions]);

  const rolePermissionSet = useMemo(() => {
    return new Set(rolePermissionCodes.map((code) => normalizeCode(code)).filter(Boolean));
  }, [rolePermissionCodes]);

  const effectivePermissionSet = useMemo(() => {
    return new Set(effectivePermissions.map((code) => normalizeCode(code)).filter(Boolean));
  }, [effectivePermissions]);

  const selectedRole = useMemo(() => {
    return roles.find((role) => String(role.role_id) === String(selectedRoleId)) || null;
  }, [roles, selectedRoleId]);

  const matchesPermissionFilter = useCallback((permission) => {
    const keyword = normalizeCode(permissionFilter);
    const code = normalizeCode(permission?.code);
    const description = normalizeCode(permission?.description);
    const hasOverride = Boolean(userOverrideMap[code]);
    const isEffective = effectivePermissionSet.has(code);

    if (overrideViewMode === "overridden" && !hasOverride) {
      return false;
    }
    if (overrideViewMode === "effective" && !isEffective) {
      return false;
    }

    if (!keyword) {
      return true;
    }
    return code.includes(keyword) || description.includes(keyword);
  }, [effectivePermissionSet, overrideViewMode, permissionFilter, userOverrideMap]);

  const filteredPageGroupsForUser = useMemo(() => {
    return pagePermissionGroups
      .map((group) => {
        const parentVisible = matchesPermissionFilter(group.pagePermission);
        const visibleChildren = group.children.filter(matchesPermissionFilter);
        if (!parentVisible && visibleChildren.length === 0) {
          return null;
        }
        return {
          ...group,
          visibleChildren,
        };
      })
      .filter(Boolean);
  }, [matchesPermissionFilter, pagePermissionGroups]);

  const filteredUngroupedForUser = useMemo(() => {
    return ungroupedPermissions.filter(matchesPermissionFilter);
  }, [matchesPermissionFilter, ungroupedPermissions]);

  const filteredPermissionCountForUser = useMemo(() => {
    const groupedCount = filteredPageGroupsForUser.reduce((total, group) => {
      return total + 1 + group.visibleChildren.length;
    }, 0);
    return groupedCount + filteredUngroupedForUser.length;
  }, [filteredPageGroupsForUser, filteredUngroupedForUser.length]);

  const loadRolePermissions = useCallback(async (roleId) => {
    if (!roleId) {
      setRolePermissionCodes([]);
      return;
    }

    setLoadingRolePermissions(true);
    try {
      const response = await accessControlAPI.getRolePermissions(roleId);
      const codes = Array.isArray(response?.permission_codes) ? response.permission_codes : [];
      setRolePermissionCodes(codes.map((code) => normalizeCode(code)).filter(Boolean));
    } catch (error) {
      console.error("Failed to load role permissions", error);
      toast.error("ไม่สามารถโหลดสิทธิ์ของ role ได้");
      setRolePermissionCodes([]);
    } finally {
      setLoadingRolePermissions(false);
    }
  }, []);

  const loadInitialData = useCallback(async ({ silent = false, preferredRoleId = "" } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        accessControlAPI.listRoles(),
        accessControlAPI.listPermissions(),
      ]);

      const roleList = Array.isArray(rolesResponse?.data) ? rolesResponse.data : [];
      const permissionList = Array.isArray(permissionsResponse?.data)
        ? permissionsResponse.data.map((item) => ({
            ...item,
            code: normalizeCode(item?.code),
          }))
        : [];

      setRoles(roleList);
      setPermissions(permissionList);

      const nextRoleId =
        preferredRoleId && roleList.some((item) => String(item.role_id) === String(preferredRoleId))
          ? preferredRoleId
          : roleList[0]?.role_id || "";

      setSelectedRoleId(String(nextRoleId || ""));

      if (!nextRoleId) {
        setRolePermissionCodes([]);
      }

    } catch (error) {
      console.error("Failed to load access control data", error);
      toast.error("ไม่สามารถโหลดข้อมูลจัดการสิทธิ์ได้");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!selectedRoleId) {
      setRolePermissionCodes([]);
      return;
    }
    loadRolePermissions(selectedRoleId);
  }, [loadRolePermissions, selectedRoleId]);

  const handleToggleRolePermission = (permissionCode) => {
    const normalizedCode = normalizeCode(permissionCode);
    if (!normalizedCode) return;

    setRolePermissionCodes((prev) => {
      const set = new Set(prev.map((item) => normalizeCode(item)).filter(Boolean));
      if (set.has(normalizedCode)) {
        set.delete(normalizedCode);
      } else {
        set.add(normalizedCode);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });
  };

  const handleTogglePageGroup = (group, checked) => {
    const codes = Array.isArray(group?.allCodes) ? group.allCodes.map((item) => normalizeCode(item)).filter(Boolean) : [];
    if (codes.length === 0) return;

    setRolePermissionCodes((prev) => {
      const set = new Set(prev.map((item) => normalizeCode(item)).filter(Boolean));
      if (checked) {
        codes.forEach((code) => set.add(code));
      } else {
        codes.forEach((code) => set.delete(code));
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });
  };

  const handleToggleGroupChild = (group, permissionCode) => {
    const code = normalizeCode(permissionCode);
    const pageCode = normalizeCode(group?.pagePermission?.code);
    if (!code) return;

    setRolePermissionCodes((prev) => {
      const set = new Set(prev.map((item) => normalizeCode(item)).filter(Boolean));
      if (set.has(code)) {
        set.delete(code);
      } else {
        set.add(code);
        if (pageCode) {
          set.add(pageCode);
        }
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!canManageAccess) {
      toast.error("คุณไม่มีสิทธิ์แก้ไขการตั้งค่าสิทธิ์");
      return;
    }
    if (!selectedRoleId) {
      toast.error("กรุณาเลือก role");
      return;
    }

    setSavingRolePermissions(true);
    try {
      const payload = Array.from(rolePermissionSet).sort((a, b) => a.localeCompare(b));
      await accessControlAPI.updateRolePermissions(selectedRoleId, payload);
      toast.success("บันทึกสิทธิ์ของ role สำเร็จ");
      await loadRolePermissions(selectedRoleId);
    } catch (error) {
      console.error("Failed to save role permissions", error);
      toast.error("ไม่สามารถบันทึกสิทธิ์ของ role ได้");
    } finally {
      setSavingRolePermissions(false);
    }
  };

  const handleSearchUsers = async () => {
    const query = userQuery.trim().toLowerCase();
    if (query.length < 4 || !query.includes("@")) {
      toast.error("กรุณากรอกอีเมลเพื่อค้นหา");
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await usersAPI.search(query);
      const users = Array.isArray(response?.data) ? response.data : [];
      const filteredUsers = users
        .filter((user) => normalizeCode(user?.email).includes(query))
        .sort((a, b) => {
          const emailA = normalizeCode(a?.email);
          const emailB = normalizeCode(b?.email);
          const startsA = emailA.startsWith(query) ? 0 : 1;
          const startsB = emailB.startsWith(query) ? 0 : 1;
          if (startsA !== startsB) {
            return startsA - startsB;
          }
          return emailA.localeCompare(emailB);
        });

      setUserOptions(filteredUsers);

      if (filteredUsers.length === 0) {
        toast("ไม่พบผู้ใช้ที่ค้นหา");
      } else if (filteredUsers.length === 1) {
        await handleSelectUser(filteredUsers[0]);
      }
    } catch (error) {
      console.error("Failed to search users", error);
      toast.error("ค้นหาผู้ใช้ไม่สำเร็จ");
      setUserOptions([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const loadUserOverrideData = useCallback(async (userId, { keepSelection = false } = {}) => {
    if (!userId) {
      if (!keepSelection) {
        setSelectedUser(null);
        setUserOverrideMap({});
        setEffectivePermissions([]);
      }
      return;
    }

    setLoadingUserOverrides(true);
    try {
      const response = await accessControlAPI.getUserOverrides(userId);
      const user = response?.user || null;
      const overrides = Array.isArray(response?.overrides) ? response.overrides : [];
      const effective = Array.isArray(response?.effective_permissions)
        ? response.effective_permissions
        : [];

      const nextOverrideMap = {};
      overrides.forEach((item) => {
        const code = normalizeCode(item?.code);
        const effect = normalizeCode(item?.effect);
        if (!code || (effect !== "allow" && effect !== "deny")) return;
        nextOverrideMap[code] = effect;
      });

      setUserOverrideMap(nextOverrideMap);
      setEffectivePermissions(effective);
      if (user) {
        setSelectedUser(user);
      }
    } catch (error) {
      console.error("Failed to load user override data", error);
      toast.error("ไม่สามารถโหลดสิทธิ์รายผู้ใช้ได้");
      if (!keepSelection) {
        setSelectedUser(null);
        setUserOverrideMap({});
        setEffectivePermissions([]);
      }
    } finally {
      setLoadingUserOverrides(false);
    }
  }, []);

  const handleSelectUser = async (user) => {
    const userId = user?.user_id || user?.userId;
    if (!userId) return;

    setSelectedUser(user);
    await loadUserOverrideData(userId, { keepSelection: true });
  };

  const handleSetOverrideEffect = (permissionCode, effect, group = null) => {
    const code = normalizeCode(permissionCode);
    const normalizedEffect = normalizeCode(effect);
    if (!code) return;

    setUserOverrideMap((prev) => {
      const next = { ...prev };
      const pageCode = normalizeCode(group?.pagePermission?.code);
      const childCodes = Array.isArray(group?.children)
        ? group.children.map((item) => normalizeCode(item?.code)).filter(Boolean)
        : [];
      if (normalizedEffect === "allow" || normalizedEffect === "deny") {
        next[code] = normalizedEffect;
        if (pageCode) {
          if (code !== pageCode && !next[pageCode]) {
            next[pageCode] = "allow";
          }
          if (code === pageCode && normalizedEffect === "allow") {
            childCodes.forEach((childCode) => {
              next[childCode] = "allow";
            });
          }
        }
      } else {
        delete next[code];
      }
      return next;
    });
  };

  const handleSetGroupOverrideEffect = (group, effect) => {
    const normalizedEffect = normalizeCode(effect);
    const codes = Array.isArray(group?.allCodes)
      ? group.allCodes.map((item) => normalizeCode(item)).filter(Boolean)
      : [];

    if (codes.length === 0) return;

    setUserOverrideMap((prev) => {
      const next = { ...prev };
      if (normalizedEffect === "allow" || normalizedEffect === "deny") {
        codes.forEach((code) => {
          next[code] = normalizedEffect;
        });
      } else {
        codes.forEach((code) => {
          delete next[code];
        });
      }
      return next;
    });
  };

  const handleSaveUserOverrides = async () => {
    if (!canManageAccess) {
      toast.error("คุณไม่มีสิทธิ์แก้ไขสิทธิ์รายผู้ใช้");
      return;
    }
    const userId = selectedUser?.user_id || selectedUser?.userId;
    if (!userId) {
      toast.error("กรุณาเลือกผู้ใช้");
      return;
    }

    const overrides = Object.entries(userOverrideMap)
      .filter(([code, effect]) => code && (effect === "allow" || effect === "deny"))
      .map(([code, effect]) => ({ code, effect }));

    setSavingUserOverrides(true);
    try {
      const response = await accessControlAPI.updateUserOverrides(userId, overrides);
      const nextOverrides = Array.isArray(response?.overrides) ? response.overrides : [];
      const nextEffective = Array.isArray(response?.effective_permissions)
        ? response.effective_permissions
        : [];

      const nextOverrideMap = {};
      nextOverrides.forEach((item) => {
        const code = normalizeCode(item?.code);
        const effect = normalizeCode(item?.effect);
        if (!code || (effect !== "allow" && effect !== "deny")) return;
        nextOverrideMap[code] = effect;
      });

      setUserOverrideMap(nextOverrideMap);
      setEffectivePermissions(nextEffective);
      toast.success("บันทึกสิทธิ์รายผู้ใช้สำเร็จ");
    } catch (error) {
      console.error("Failed to save user overrides", error);
      toast.error("ไม่สามารถบันทึกสิทธิ์รายผู้ใช้ได้");
    } finally {
      setSavingUserOverrides(false);
    }
  };

  return (
    <PageLayout
      title="จัดการสิทธิ์การเข้าถึง"
      subtitle="กำหนดสิทธิ์ราย Role และสิทธิ์เฉพาะรายผู้ใช้ (allow/deny)"
      icon={ShieldCheck}
      actions={
        <button
          type="button"
          onClick={() => loadInitialData({ silent: true, preferredRoleId: selectedRoleId })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          รีเฟรชข้อมูล
        </button>
      }
      loading={loading}
    >
      {!canManageAccess ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          คุณมีสิทธิ์ดูข้อมูลเท่านั้น (access.view) หากต้องการแก้ไข Role/Override ต้องมีสิทธิ์ access.manage
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Role Permission Matrix</h3>
              <p className="text-xs text-slate-500">กำหนดว่า role ไหนทำอะไรได้บ้าง</p>
            </div>
            <button
              type="button"
              onClick={handleSaveRolePermissions}
              disabled={!canManageAccess || savingRolePermissions || !selectedRoleId}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingRolePermissions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              บันทึก Role
            </button>
          </div>

          <div className="mb-4">
            <label htmlFor="access-role" className="mb-1 block text-xs font-semibold text-slate-600">
              เลือก Role
            </label>
            <select
              id="access-role"
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {roles.map((role) => (
                <option key={role.role_id} value={String(role.role_id)}>
                  {role.role} (ID: {role.role_id}, {role.permission_count || 0} perms)
                </option>
              ))}
            </select>
          </div>

          {loadingRolePermissions ? (
            <div className="py-10 text-center text-sm text-slate-500">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              กำลังโหลดสิทธิ์ของ role...
            </div>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-auto rounded-lg border border-slate-200 p-3">
              {pagePermissionGroups.map((group) => {
                const pageCode = normalizeCode(group?.pagePermission?.code);
                const childCodes = group.children.map((child) => normalizeCode(child.code));
                const checkedCount = [pageCode, ...childCodes].filter((code) => rolePermissionSet.has(code)).length;
                const totalCount = 1 + childCodes.length;
                const groupChecked = checkedCount > 0;

                return (
                  <div key={group.key} className="rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-start gap-3 border-b border-slate-100 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={groupChecked}
                        onChange={(event) => handleTogglePageGroup(group, event.target.checked)}
                        disabled={!canManageAccess}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{group.title}</div>
                        <div className="text-xs text-slate-500">{group.pagePermission.code}</div>
                      </div>
                      <div className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {checkedCount}/{totalCount}
                      </div>
                    </div>

                    {group.children.length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        {group.children.map((child) => {
                          const childCode = normalizeCode(child.code);
                          const checked = rolePermissionSet.has(childCode);
                          return (
                            <label key={child.permission_id || childCode} className="flex cursor-pointer items-start gap-3 px-6 py-2 hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleToggleGroupChild(group, childCode)}
                                disabled={!canManageAccess}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm text-slate-800">{child.code}</div>
                                <div className="text-xs text-slate-500">{child.description || "-"}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {ungroupedPermissions.length > 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">อื่นๆ</div>
                  <div className="divide-y divide-slate-100">
                    {ungroupedPermissions.map((permission) => {
                      const code = normalizeCode(permission.code);
                      const checked = rolePermissionSet.has(code);
                      return (
                        <label key={permission.permission_id || code} className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-white">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleRolePermission(code)}
                            disabled={!canManageAccess}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-slate-800">{permission.code}</div>
                            <div className="text-xs text-slate-500">{permission.description || "-"}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Role ปัจจุบัน: <span className="font-semibold text-slate-700">{selectedRole?.role || "-"}</span>
            {" "}
            ({rolePermissionSet.size} permissions)
          </p>
          <p className="mt-1 text-xs text-amber-700">
            คำแนะนำ: ควรคงสิทธิ์ <code className="rounded bg-amber-100 px-1 py-0.5">access.manage</code> ไว้อย่างน้อย 1 role สำหรับผู้ดูแลระบบ
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">User Permission Overrides</h3>
              <p className="text-xs text-slate-500">ตั้งค่า allow/deny รายคนทับค่า role</p>
            </div>
            <button
              type="button"
              onClick={handleSaveUserOverrides}
              disabled={!canManageAccess || savingUserOverrides || !selectedUser}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingUserOverrides ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              บันทึกผู้ใช้
            </button>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-slate-600">ค้นหาผู้ใช้</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={userQuery}
                onChange={(event) => setUserQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearchUsers();
                  }
                }}
                placeholder="ค้นหาด้วยอีเมล เช่น kitsanapong.p@kkumail.com"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSearchUsers}
                disabled={searchingUsers}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searchingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                ค้นหา
              </button>
            </div>
          </div>

          {userOptions.length > 0 ? (
            <div className="mb-4 max-h-36 overflow-auto rounded-lg border border-slate-200">
              {userOptions.map((user) => {
                const userId = user.user_id || user.userId;
                const active = Number(selectedUser?.user_id || selectedUser?.userId) === Number(userId);
                return (
                  <button
                    key={userId}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className={`block w-full border-b border-slate-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                      active ? "bg-slate-900 text-white" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-medium">{getUserEmail(user)}</div>
                    <div className={`text-xs ${active ? "text-slate-200" : "text-slate-500"}`}>
                      user_id: {userId}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {selectedUser ? (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <UserCog className="h-4 w-4" />
                {getUserEmail(selectedUser)}
              </div>
              <div>user_id: {selectedUser.user_id || selectedUser.userId}</div>
              <div>
                role: {selectedUser.role || selectedUser.role_key || "-"} (ID: {selectedUser.role_id || "-"})
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
              กรุณาเลือกผู้ใช้เพื่อจัดการ override
            </div>
          )}

          {loadingUserOverrides ? (
            <div className="py-10 text-center text-sm text-slate-500">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              กำลังโหลดสิทธิ์รายผู้ใช้...
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={permissionFilter}
                  onChange={(event) => setPermissionFilter(event.target.value)}
                  placeholder="กรอง permission code"
                  className="min-w-[180px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setOverrideViewMode("all")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${overrideViewMode === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setOverrideViewMode("overridden")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${overrideViewMode === "overridden" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  เฉพาะ Override
                </button>
                <button
                  type="button"
                  onClick={() => setOverrideViewMode("effective")}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${overrideViewMode === "effective" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
                >
                  เฉพาะ Effective
                </button>
              </div>

              <div className="mb-2 text-xs text-slate-500">
                แสดง {filteredPermissionCountForUser} จาก {permissions.length} permissions
              </div>

              <div className="max-h-[460px] space-y-3 overflow-auto rounded-lg border border-slate-200 p-3">
                {filteredPageGroupsForUser.map((group) => {
                  const pageCode = normalizeCode(group.pagePermission.code);
                  const parentEffect = userOverrideMap[pageCode] || "inherit";
                  const groupCodes = [pageCode, ...group.children.map((child) => normalizeCode(child.code))];
                  const checkedCount = groupCodes
                    .filter((code) => userOverrideMap[code] && userOverrideMap[code] !== "inherit").length;
                  const effectiveCount = groupCodes.filter((code) => effectivePermissionSet.has(code)).length;
                  const totalCount = 1 + group.children.length;
                  const groupIsEffective = effectiveCount > 0;

                  return (
                    <div key={group.key} className="rounded-lg border border-slate-200 bg-white">
                      <div className="grid grid-cols-12 items-center gap-2 border-b border-slate-100 px-3 py-2">
                        <div className="col-span-7 min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{group.title}</div>
                          <div className="truncate text-xs text-slate-500">{group.pagePermission.code}</div>
                        </div>
                        <div className="col-span-3">
                          <select
                            value={parentEffect}
                            onChange={(event) => handleSetGroupOverrideEffect(group, event.target.value)}
                            disabled={!selectedUser || !canManageAccess}
                            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            {EFFECT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 text-right text-xs">
                          <div className="text-slate-500">{checkedCount}/{totalCount}</div>
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 font-semibold ${groupIsEffective ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {groupIsEffective ? "Effective" : "No access"}
                          </span>
                        </div>
                      </div>

                      {group.visibleChildren.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {group.visibleChildren.map((permission) => {
                            const code = normalizeCode(permission.code);
                            const effect = userOverrideMap[code] || "inherit";
                            const isEffective = effectivePermissionSet.has(code);
                            return (
                              <div key={permission.permission_id || code} className="grid grid-cols-12 items-center gap-2 px-6 py-2">
                                <div className="col-span-7 min-w-0">
                                  <div className="truncate text-sm text-slate-800">{permission.code}</div>
                                  <div className="truncate text-xs text-slate-500">{permission.description || "-"}</div>
                                </div>
                                <div className="col-span-3">
                                  <select
                                    value={effect}
                                    onChange={(event) => handleSetOverrideEffect(code, event.target.value, group)}
                                    disabled={!selectedUser || !canManageAccess}
                                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                                  >
                                    {EFFECT_OPTIONS.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-2 text-right text-xs">
                                  <span className={`rounded-full px-2 py-1 font-semibold ${isEffective ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                    {isEffective ? "Effective" : "No access"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {filteredUngroupedForUser.length > 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">อื่นๆ</div>
                    <div className="divide-y divide-slate-100">
                      {filteredUngroupedForUser.map((permission) => {
                        const code = normalizeCode(permission.code);
                        const effect = userOverrideMap[code] || "inherit";
                        const isEffective = effectivePermissionSet.has(code);
                        return (
                          <div key={permission.permission_id || code} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                            <div className="col-span-7 min-w-0">
                              <div className="truncate text-sm text-slate-800">{permission.code}</div>
                              <div className="truncate text-xs text-slate-500">{permission.description || "-"}</div>
                            </div>
                            <div className="col-span-3">
                              <select
                                value={effect}
                                onChange={(event) => handleSetOverrideEffect(code, event.target.value)}
                                disabled={!selectedUser || !canManageAccess}
                                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                              >
                                {EFFECT_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2 text-right text-xs">
                              <span className={`rounded-full px-2 py-1 font-semibold ${isEffective ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                {isEffective ? "Effective" : "No access"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
