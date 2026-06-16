/**
 * Client API Client
 *
 * Axios instance for client-portal API calls.
 * Uses clientTokenService (separate keys from employee tokens).
 * On 401, silently refreshes via POST /client/refresh and retries.
 */

import axios from 'axios'
import { clientTokenService } from './clientTokenService'

const BASE_URL = window.__ENV__?.API_URL ?? 'http://localhost:8083'

// Bare client used only for the refresh call — no interceptors to avoid loops.
export const clientRefreshAxios = axios.create({ baseURL: BASE_URL })

// Main client for all client-portal requests.
export const clientApiClient = axios.create({ baseURL: BASE_URL })

// ── Request interceptor ───────────────────────────────────────────────────────
clientApiClient.interceptors.request.use(
  (config) => {
    const token = clientTokenService.getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor (silent token refresh) ───────────────────────────────
let isRefreshing = false
let waitingQueue = []

function flushQueue(error, token) {
  waitingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  waitingQueue = []
}

const CLIENT_API_ERROR_MESSAGES = {
  400: 'Bad request. Please check the submitted data.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'Conflict. This resource already exists or cannot be modified.',
  500: 'Server error. Please try again later.',
  502: 'Service is currently unreachable. Please try again shortly.',
  503: 'Service unavailable. Please try again later.',
  504: 'The request timed out. Please try again.',
}

function dispatchClientApiError(status, message) {
  window.dispatchEvent(new CustomEvent('api:error', { detail: { status, message } }))
}

clientApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status   = error.response?.status

    if (status && status !== 401) {
      const backendMessage = error.response?.data?.error
      const message = backendMessage || CLIENT_API_ERROR_MESSAGES[status] || 'An unexpected error occurred.'
      dispatchClientApiError(status, message)
    }

    if (status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitingQueue.push({ resolve, reject })
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`
        return clientApiClient(original)
      })
    }

    original._retry = true
    isRefreshing    = true

    try {
      const refreshToken = clientTokenService.getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token available.')

      const { data } = await clientRefreshAxios.post('/client/refresh', {
        refresh_token: refreshToken,
      })

      clientTokenService.setAccessToken(data.access_token)
      flushQueue(null, data.access_token)

      original.headers.Authorization = `Bearer ${data.access_token}`
      return clientApiClient(original)
    } catch (refreshError) {
      flushQueue(refreshError, null)
      clientTokenService.clear()
      window.dispatchEvent(new CustomEvent('client-auth:session-expired'))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
