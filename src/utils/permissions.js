/**
 * Permission & Role Utilities
 *
 * Roles are coarse-grained (ADMIN, MANAGER, USER).
 * Permissions are fine-grained and can come from two sources:
 *   1. Derived from the user's roles via ROLE_PERMISSIONS.
 *   2. Explicitly granted/denied on the user object (overrides role defaults).
 */

// ── Role constants ────────────────────────────────────────────────────────────
export const ROLES = Object.freeze({
  ADMIN:   'ADMIN',
  MANAGER: 'MANAGER',
  USER:    'USER',
})

// ── Permission constants ──────────────────────────────────────────────────────
export const PERM = Object.freeze({
  VIEW_CLIENTS:         'canViewClients',
  CREATE_ACCOUNTS:      'canCreateAccounts',
  APPROVE_LOANS:        'canApproveLoans',
  PROCESS_TRANSACTIONS: 'canProcessTransactions',
  MANAGE_EMPLOYEES:     'canManageEmployees',
  VIEW_REPORTS:         'canViewReports',
  IS_AGENT:             'isAgent',
  IS_SUPERVISOR:        'isSupervisor',
})

// ── Default permissions per role ──────────────────────────────────────────────
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERM),   // all permissions
  [ROLES.MANAGER]: [
    PERM.VIEW_CLIENTS,
    PERM.APPROVE_LOANS,
    PERM.VIEW_REPORTS,
    PERM.PROCESS_TRANSACTIONS,
  ],
  [ROLES.USER]: [
    PERM.VIEW_CLIENTS,
    PERM.PROCESS_TRANSACTIONS,
  ],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Collect the full set of permissions granted by a list of roles.
 */
export function getPermissionsForRoles(roles = []) {
  const perms = new Set()
  roles.forEach((role) => {
    ROLE_PERMISSIONS[role]?.forEach((p) => perms.add(p))
  })
  return perms
}

/**
 * Check whether a user has a specific permission.
 *
 * Resolution order:
 *   1. Explicit user.permissions[key] (boolean) — set by admin, overrides role.
 *   2. Derived from user.roles via ROLE_PERMISSIONS.
 */
export function hasPermission(user, permission) {
  if (!user) return false
  const explicit = user.permissions?.[permission]
  if (explicit !== undefined) return Boolean(explicit)
  return getPermissionsForRoles(user.roles ?? []).has(permission)
}

/**
 * Check whether a user has all of the given permissions.
 */
export function hasAllPermissions(user, permissions = []) {
  return permissions.every((p) => hasPermission(user, p))
}

/**
 * Check whether a user has at least one of the given permissions.
 */
export function hasAnyPermission(user, permissions = []) {
  return permissions.some((p) => hasPermission(user, p))
}

/**
 * Check whether a user holds a specific role.
 */
export function hasRole(user, role) {
  return user?.roles?.includes(role) ?? false
}

/**
 * Check whether a user holds at least one of the given roles.
 */
export function hasAnyRole(user, roles = []) {
  return roles.some((role) => hasRole(user, role))
}
