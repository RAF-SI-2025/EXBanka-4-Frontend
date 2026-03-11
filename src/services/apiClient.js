/**
 * API Client
 *
 * Axios instance with two interceptors:
 *   Request  → attaches the access token to every request.
 *   Response → on 401, silently refreshes the token and retries.
 *
 * A separate `refreshClient` (no interceptors) is used for the refresh call
 * itself to avoid infinite retry loops.
 *
 * Concurrent requests that arrive while a refresh is in progress are queued
 * and replayed once the new token is available.
 */

import axios from 'axios'
import { tokenService } from './tokenService'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'

// ── Bare client used only for token refresh ─────────────────────────────────
// No interceptors — prevents infinite 401 loop if the refresh endpoint itself
// returns 401.
export const refreshClient = axios.create({ baseURL: BASE_URL })

// ── Main client ──────────────────────────────────────────────────────────────
export const apiClient = axios.create({ baseURL: BASE_URL })

// ── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ─────────────────────────────────────────────────────
let isRefreshing = false
let waitingQueue = []   // { resolve, reject }[]

function flushQueue(error, token) {
  waitingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  waitingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    // Only handle 401; let everything else propagate normally.
    // _retry flag prevents retrying the same request twice.
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // If a refresh is already happening, queue this request.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitingQueue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = tokenService.getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token available.')

      const { data } = await refreshClient.post('/refresh', { refresh_token: refreshToken })

      tokenService.setAccessToken(data.access_token)

      flushQueue(null, data.access_token)

      original.headers.Authorization = `Bearer ${data.access_token}`
      return apiClient(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      tokenService.clear()

      // Notify the app that the session has expired so AuthContext can react.
      window.dispatchEvent(new CustomEvent('auth:session-expired'))

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
