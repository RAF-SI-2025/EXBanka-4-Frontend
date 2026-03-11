/**
 * PermissionGate
 *
 * Conditionally renders children based on the current user's roles/permissions.
 * Renders `fallback` (default: nothing) when access is denied.
 *
 * Props:
 *   permission  — single permission key required
 *   permissions — array: user must have ALL of them
 *   anyOf       — array: user must have AT LEAST ONE
 *   role        — single role required
 *   roles       — array: user must have AT LEAST ONE
 *   fallback    — node rendered when access is denied (default: null)
 *
 * Examples:
 *   <PermissionGate permission="canManageEmployees">
 *     <NewEmployeeButton />
 *   </PermissionGate>
 *
 *   <PermissionGate role="ADMIN" fallback={<p>Admins only.</p>}>
 *     <AdminPanel />
 *   </PermissionGate>
 *
 *   <PermissionGate anyOf={["canApproveLoans", "canViewReports"]}>
 *     <FinanceMenu />
 *   </PermissionGate>
 */

import { usePermission } from '../hooks/usePermission'

export default function PermissionGate({
  permission,
  permissions,
  anyOf,
  role,
  roles,
  fallback = null,
  children,
}) {
  const { can, canAll, canAny, is, isAnyOf } = usePermission()

  let allowed = true

  if (permission)   allowed = allowed && can(permission)
  if (permissions)  allowed = allowed && canAll(permissions)
  if (anyOf)        allowed = allowed && canAny(anyOf)
  if (role)         allowed = allowed && is(role)
  if (roles)        allowed = allowed && isAnyOf(roles)

  return allowed ? children : fallback
}
