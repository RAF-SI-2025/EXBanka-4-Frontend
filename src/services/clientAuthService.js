/**
 * Client Auth Service
 *
 * Authenticates bank clients via POST /client/login.
 * Stores tokens in clientTokenService (separate keys from employee tokens).
 */

import axios from 'axios'
import { clientTokenService } from './clientTokenService'
import { clientApiClient } from './clientApiClient'

const BASE_URL = window.__ENV__?.API_URL ?? 'http://localhost:8083'

function decodeJwtPayload(token) {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}

export const clientAuthService = {
  async login(email, password) {
    const { data } = await axios.post(`${BASE_URL}/client/login`, { email, password, source: 'mobile' })

    if (data.requires_totp) {
      return { requiresTotp: true, sessionToken: data.session_token }
    }

    clientTokenService.setAccessToken(data.access_token)
    clientTokenService.setRefreshToken(data.refresh_token)

    const claims = decodeJwtPayload(data.access_token)
    return {
      id:        claims.user_id,
      firstName: claims.first_name,
      lastName:  claims.last_name,
      email:     claims.email,
    }
  },

  async validateTotpLogin(sessionToken, code) {
    const { data } = await axios.post(`${BASE_URL}/auth/totp/validate`, {
      session_token: sessionToken,
      code,
    })
    clientTokenService.setAccessToken(data.access_token)
    clientTokenService.setRefreshToken(data.refresh_token)
    const claims = decodeJwtPayload(data.access_token)
    return {
      id:        claims.user_id,
      firstName: claims.first_name,
      lastName:  claims.last_name,
      email:     claims.email,
    }
  },

  async generateTotpSecret() {
    const { data } = await clientApiClient.post('/auth/totp/generate')
    return data
  },

  async verifyTotp(code) {
    const { data } = await clientApiClient.post('/auth/totp/verify', { code })
    return data
  },

  async disableTotp() {
    await clientApiClient.delete('/auth/totp')
  },

  async logout() {
    try {
      const token = clientTokenService.getAccessToken()
      if (token) {
        await axios.post(`${BASE_URL}/auth/logout`, null, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (_) {
      // best-effort
    }
    clientTokenService.clear()
  },

  async forgotPassword(email) {
    await axios.post(`${BASE_URL}/client/forgot-password`, { email })
  },

  async resetPassword(token, password, confirmPassword) {
    await axios.post(`${BASE_URL}/client/reset-password`, {
      token,
      password,
      confirm_password: confirmPassword,
    })
  },

  /** Called on app load to restore a previous session from stored tokens. */
  restoreSession() {
    const token = clientTokenService.getAccessToken()
    if (!token) return null
    try {
      const claims = decodeJwtPayload(token)
      if (claims.exp * 1000 < Date.now()) {
        clientTokenService.clear()
        return null
      }
      return {
        id:        claims.user_id,
        firstName: claims.first_name,
        lastName:  claims.last_name,
        email:     claims.email,
      }
    } catch {
      clientTokenService.clear()
      return null
    }
  },
}
