/**
 * Auth Service
 *
 * Wraps all authentication API calls against the API Gateway.
 * After login / session restore, fetches the full employee record so the
 * user payload contains firstName, lastName, email, etc.
 */

import { apiClient, refreshClient } from './apiClient'
import { tokenService } from './tokenService'
import { employeeFromApi } from '../models/Employee'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Decode the payload section of a JWT without verifying the signature.
 * Safe to use client-side — we trust the token we just received from our server.
 */
function decodeJwtPayload(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

function buildUserPayload(employee, dozvole = []) {
  const roles = dozvole.map((d) => d.toUpperCase()).includes('ADMIN')
    ? ['ADMIN']
    : ['USER']
  return {
    id:          employee.id,
    firstName:   employee.firstName,
    lastName:    employee.lastName,
    email:       employee.email,
    roles,
    permissions: employee.permissions,
  }
}

// ── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Log in with username + password.
   * POST /login → { access_token, refresh_token }
   * Then fetches GET /employees/{id} for the full user profile.
   */
  async login(username, password) {
    const { data } = await apiClient.post('/login', { username, password })
    tokenService.setAccessToken(data.access_token)
    tokenService.setRefreshToken(data.refresh_token)

    const claims = decodeJwtPayload(data.access_token)
    const employee = employeeFromApi(
      (await apiClient.get(`/employees/${claims.user_id}`)).data
    )
    return buildUserPayload(employee, claims.dozvole ?? [])
  },

  /**
   * Exchange the stored refresh token for a new access token.
   * Called automatically by the apiClient interceptor — rarely called directly.
   * POST /refresh → { access_token }
   */
  async refresh() {
    const refreshToken = tokenService.getRefreshToken()
    if (!refreshToken) throw new Error('No refresh token available.')
    const { data } = await refreshClient.post('/refresh', { refresh_token: refreshToken })
    tokenService.setAccessToken(data.access_token)
    return data.access_token
  },

  /**
   * Log out the current user.
   * Clears tokens locally (no backend logout endpoint).
   */
  async logout() {
    tokenService.clear()
  },

  /**
   * Attempt to restore a session from a stored refresh token.
   * Called once on app load to silently re-authenticate.
   * Returns the user payload or null.
   */
  async restoreSession() {
    const refreshToken = tokenService.getRefreshToken()
    if (!refreshToken) return null
    try {
      const accessToken = await authService.refresh()
      const claims = decodeJwtPayload(accessToken)
      const employee = employeeFromApi(
        (await apiClient.get(`/employees/${claims.user_id}`)).data
      )
      return buildUserPayload(employee, claims.dozvole ?? [])
    } catch {
      tokenService.clear()
      return null
    }
  },
}
