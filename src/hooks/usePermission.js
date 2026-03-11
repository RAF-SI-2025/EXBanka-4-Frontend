/**
 * usePermission hook
 *
 * Provides permission/role checks bound to the currently logged-in user.
 *
 * Usage:
 *   const { can, is, isAnyOf, isLoggedIn } = usePermission()
 *
 *   can('canManageEmployees')          → boolean
 *   is('ADMIN')                        → boolean
 *   isAnyOf(['ADMIN', 'MANAGER'])      → boolean
 *   canAll(['canViewClients', ...])    → boolean (all required)
 *   canAny(['canViewReports', ...])    → boolean (at least one)
 */

import { useAuth } from '../context/AuthContext'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasRole,
  hasAnyRole,
} from '../utils/permissions'

export function usePermission() {
  const { user } = useAuth()

  return {
    /** True when the user has the given permission. */
    can:      (permission)  => hasPermission(user, permission),
    /** True when the user has ALL of the given permissions. */
    canAll:   (permissions) => hasAllPermissions(user, permissions),
    /** True when the user has AT LEAST ONE of the given permissions. */
    canAny:   (permissions) => hasAnyPermission(user, permissions),
    /** True when the user holds the given role. */
    is:       (role)        => hasRole(user, role),
    /** True when the user holds at least one of the given roles. */
    isAnyOf:  (roles)       => hasAnyRole(user, roles),
    /** True when a user is currently logged in. */
    isLoggedIn: Boolean(user),
  }
}
