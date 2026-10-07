const DEFAULT_PORTAL_RULE = {
  requireAuth: true,
  allowedRoles: [],
  allowedPermissions: [],
};

export const PORTAL_ITEM_ACCESS = {
  researchFund: {
    ...DEFAULT_PORTAL_RULE,
    allowedPermissions: ["portal.card.research_fund.access"],
  },
  externalFund: {
    ...DEFAULT_PORTAL_RULE,
    allowedPermissions: ["portal.card.external_fund.access"],
  },
  publicationSearch: {
    requireAuth: false,
  },
  mou: {
    ...DEFAULT_PORTAL_RULE,
    allowedPermissions: ["mou.read"],
  },
  links: {
    ...DEFAULT_PORTAL_RULE,
    allowedPermissions: ["portal.card.links.access"],
  },
  researcherMatching: {
    ...DEFAULT_PORTAL_RULE,
    requireAuth: false,
  },
  researcherManagement: {
    ...DEFAULT_PORTAL_RULE,
    allowedPermissions: ["portal.card.researcher_management.access"],
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

  return (requiredRoles.length === 0 || roleMatched) &&
    (requiredPermissions.length === 0 || permissionMatched);
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
