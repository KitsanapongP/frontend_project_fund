export const normalizeRoleName = (role) => {
  const ROLE_NAME_BY_ID = {
    1: "teacher",
    2: "staff",
    3: "admin",
    4: "dept_head",
    5: "executive",
  };

  if (role == null) return null;

  if (typeof role === "object") {
    if (role.role != null) return normalizeRoleName(role.role);
    if (role.role_id != null) return normalizeRoleName(role.role_id);
  }

  if (typeof role === "string") {
    const numericRole = Number(role);
    if (!Number.isNaN(numericRole) && ROLE_NAME_BY_ID[numericRole]) {
      return ROLE_NAME_BY_ID[numericRole];
    }
    return role.toLowerCase();
  }

  if (typeof role === "number") {
    return ROLE_NAME_BY_ID[role] || null;
  }

  return null;
};

export const getUserPermissionSet = (user) => {
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return new Set(
    permissions.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
  );
};

export const hasAdminPortalAccess = (user) => {
  const roleValue = user?.role ?? user?.role_id;
  const roleName = normalizeRoleName(roleValue);
  if (roleName === "admin") {
    return true;
  }

  const permissionSet = getUserPermissionSet(user);
  if (permissionSet.size === 0) {
    return false;
  }

  if (permissionSet.has("dashboard.view.admin") || permissionSet.has("access.manage")) {
    return true;
  }

  for (const code of permissionSet) {
    if (code.startsWith("ui.page.admin.")) {
      return true;
    }
  }

  return false;
};

export const hasMemberPortalAccess = (user) => {
  const roleValue = user?.role ?? user?.role_id;
  const roleName = normalizeRoleName(roleValue);
  if (["teacher", "staff", "dept_head"].includes(roleName)) {
    return true;
  }

  const permissionSet = getUserPermissionSet(user);
  if (permissionSet.size === 0) {
    return false;
  }

  if (permissionSet.has("portal.member.access") || permissionSet.has("dashboard.view.self")) {
    return true;
  }

  for (const code of permissionSet) {
    if (code.startsWith("ui.page.member.")) {
      return true;
    }
  }

  return false;
};
