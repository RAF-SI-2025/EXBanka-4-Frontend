/**
 * Auth Service
 *
 * Wraps all authentication API calls against the API Gateway.
 * User identity is read directly from JWT claims — no extra API call needed.
 */

import { apiClient, refreshClient } from './apiClient'
import { tokenService } from './tokenService'
import { permissionsFromDozvole } from '../models/Employee'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Decode the payload section of a JWT without verifying the signature.
 * Safe to use client-side — we trust the token we just received from our server.
 */
function decodeJwtPayload(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

function buildUserPayload(claims) {
  const dozvole = claims.dozvole ?? []
  const roles = dozvole.map((d) => d.toUpperCase()).includes('ADMIN')
    ? ['ADMIN']
    : ['USER']
  return {
    id:          claims.user_id,
    firstName:   claims.first_name ?? '',
    lastName:    claims.last_name  ?? '',
    email:       claims.email      ?? '',
    roles,
    permissions: permissionsFromDozvole(dozvole),
  }
}

// ── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Log in with username + password.
   * POST /login → { access_token, refresh_token }
   * User info is read directly from the JWT claims.
   */
  async login(username, password) {
    const { data } = await apiClient.post('/login', { username, password })
    tokenService.setAccessToken(data.access_token)
    tokenService.setRefreshToken(data.refresh_token)
    return buildUserPayload(decodeJwtPayload(data.access_token))
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
   * Activate a new employee account using the token from the email link.
   * POST /auth/activate → { message }
   */
  async activate(token, password, confirmPassword) {
    await apiClient.post('/auth/activate', {
      token,
      password,
      confirm_password: confirmPassword,
    })
  },

  /**
   * Request a password reset email for the given address.
   * POST /auth/forgot-password → { message }
   */
  async forgotPassword(email) {
    await apiClient.post('/auth/forgot-password', { email })
  },

  /**
   * Reset a password using the token from the reset email link.
   * POST /auth/reset-password → { message }
   */
  async resetPassword(token, password, confirmPassword) {
    await apiClient.post('/auth/reset-password', {
      token,
      password,
      confirm_password: confirmPassword,
    })
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
      return buildUserPayload(decodeJwtPayload(accessToken))
    } catch {
      tokenService.clear()
      return null
    }
  },
}