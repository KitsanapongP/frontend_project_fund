const DEFAULT_PORTAL_RULE = {
  requireAuth: true,
  allowedRoles: [],
  allowedPermissions: [],
};

export const PORTAL_ITEM_ACCESS = {
  researchFund: {
    ...DEFAULT_PORTAL_RULE,
  },
  externalFund: {
    ...DEFAULT_PORTAL_RULE,
  },
  publicationSearch: {
    ...DEFAULT_PORTAL_RULE,
  },
  mou: {
    ...DEFAULT_PORTAL_RULE,
  },
  links: {
    ...DEFAULT_PORTAL_RULE,
  },
  researcherMatching: {
    ...DEFAULT_PORTAL_RULE,
  },
  researcherManagement: {
    ...DEFAULT_PORTAL_RULE,
    // เตรียมไว้สำหรับ role ใหม่ในอนาคต เช่น allowedRoles: ['researcher_manager']
    allowedRoles: [],
    allowedPermissions: [],
  },
};

export function getPortalItemAccess(itemId) {
  return PORTAL_ITEM_ACCESS[itemId] || DEFAULT_PORTAL_RULE;
}

export function canAccessPortalRule(rule, { isAuthenticated, hasAnyRole, hasAnyPermission }) {
  const resolvedRule = rule || DEFAULT_PORTAL_RULE;

  if (!resolvedRule.requireAuth) {
    return true;
  }

  if (!isAuthenticated) {
    return false;
  }

  const requiredRoles = Array.isArray(resolvedRule.allowedRoles) ? resolvedRule.allowedRoles : [];
  const requiredPermissions = Array.isArray(resolvedRule.allowedPermissions)
    ? resolvedRule.allowedPermissions
    : [];

  if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
    return true;
  }

  const roleMatched = typeof hasAnyRole === "function" ? hasAnyRole(requiredRoles) : false;
  const permissionMatched =
    typeof hasAnyPermission === "function" ? hasAnyPermission(requiredPermissions) : false;

  return roleMatched || permissionMatched;
}

export function sanitizeNextPath(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  const nextPath = value.trim();
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "";
  }

  if (nextPath === "/login" || nextPath.startsWith("/login?")) {
    return "";
  }

  return nextPath;
}
