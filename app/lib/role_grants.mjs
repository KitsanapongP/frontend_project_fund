export function additionalRoleIds(roles = []) {
  return [...new Set(roles.filter((role) => !role.is_primary).map((role) => String(role.role_id)))].sort();
}

export function roleGrantPermissions(roles, primaryRoleId, additionalIds) {
  const selected = new Set([String(primaryRoleId), ...additionalIds.map(String)]);
  return [...new Set(roles.filter((role) => selected.has(String(role.role_id)))
    .flatMap((role) => role.permission_codes || []))];
}
