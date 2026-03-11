/**
 * Auth Service
 *
 * Wraps all authentication API calls.
 * Currently uses a mock implementation; swap the bodies for real API calls
 * once a backend is available (the signatures stay the same).
 *
 * Mock token format: "mock_access_{userId}"  /  "mock_refresh_{userId}"
 * These are decoded back to a userId by the refresh mock below.
 */

import { apiClient } from './apiClient'
import { tokenService } from './tokenService'
import { mockEmployees } from '../mocks/employees'

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUserPayload(emp) {
  return {
    id:          emp.id,
    firstName:   emp.firstName,
    lastName:    emp.lastName,
    email:       emp.email,
    roles:       emp.roles ?? ['USER'],
    permissions: emp.permissions ?? {},
  }
}

// ── Mock implementations (replace with real API calls) ────────────────────────

const MOCK_DELAY = 300   // ms — simulates network latency

function mockDelay() {
  return new Promise((r) => setTimeout(r, MOCK_DELAY))
}

// ── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Log in with email + password.
   * Returns a user payload and stores tokens.
   *
   * Real API:  POST /auth/login  →  { accessToken, refreshToken, user }
   */
  async login(email, password) {
    // ── MOCK ──────────────────────────────────────────────────────────────
    await mockDelay()
    const emp = mockEmployees.find(
      (e) => e.email === email && e.password === password
    )
    if (!emp) {
      const err = new Error('Invalid credentials.')
      err.status = 401
      throw err
    }
    const user = buildUserPayload(emp)
    tokenService.setAccessToken(`mock_access_${emp.id}`)
    tokenService.setRefreshToken(`mock_refresh_${emp.id}`)
    return user
    // ── REAL (uncomment when backend is ready) ────────────────────────────
    // const { data } = await apiClient.post('/auth/login', { email, password })
    // tokenService.setAccessToken(data.accessToken)
    // tokenService.setRefreshToken(data.refreshToken)
    // return data.user
  },

  /**
   * Exchange the stored refresh token for a new access token.
   * Called automatically by the apiClient interceptor — rarely called directly.
   *
   * Real API:  POST /auth/refresh  →  { accessToken, refreshToken? }
   */
  async refresh() {
    // ── MOCK ──────────────────────────────────────────────────────────────
    await mockDelay()
    const refreshToken = tokenService.getRefreshToken()
    const match = refreshToken?.match(/^mock_refresh_(\d+)$/)
    if (!match) throw new Error('Invalid refresh token.')
    const userId = Number(match[1])
    const emp = mockEmployees.find((e) => e.id === userId)
    if (!emp) throw new Error('Employee not found.')
    const newAccess = `mock_access_${userId}`
    tokenService.setAccessToken(newAccess)
    return newAccess
    // ── REAL ──────────────────────────────────────────────────────────────
    // const refreshToken = tokenService.getRefreshToken()
    // const { data } = await refreshClient.post('/auth/refresh', { refreshToken })
    // tokenService.setAccessToken(data.accessToken)
    // if (data.refreshToken) tokenService.setRefreshToken(data.refreshToken)
    // return data.accessToken
  },

  /**
   * Log out the current user.
   * Clears tokens locally and notifies the server (best-effort).
   *
   * Real API:  POST /auth/logout
   */
  async logout() {
    // ── MOCK ──────────────────────────────────────────────────────────────
    await mockDelay()
    tokenService.clear()
    // ── REAL ──────────────────────────────────────────────────────────────
    // try { await apiClient.post('/auth/logout') } finally { tokenService.clear() }
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
      // ── MOCK ────────────────────────────────────────────────────────────
      await mockDelay()
      const match = refreshToken.match(/^mock_refresh_(\d+)$/)
      if (!match) return null
      const emp = mockEmployees.find((e) => e.id === Number(match[1]))
      if (!emp) return null
      tokenService.setAccessToken(`mock_access_${emp.id}`)
      return buildUserPayload(emp)
      // ── REAL ──────────────────────────────────────────────────────────
      // const newAccess = await authService.refresh()
      // const { data } = await apiClient.get('/auth/me')
      // return data
    } catch {
      tokenService.clear()
      return null
    }
  },
}
