/**
 * Client Auth Service
 *
 * Authenticates bank clients via POST /client/login.
 * Stores tokens in clientTokenService (separate keys from employee tokens).
 */

import axios from 'axios'
import { clientTokenService } from './clientTokenService'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'

function decodeJwtPayload(token) {
  const payload = token.split('.')[1]
  return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
}

export const clientAuthService = {
  async login(email, password) {
    const { data } = await axios.post(`${BASE_URL}/client/login`, { email, password })

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

  async logout() {
    clientTokenService.clear()
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
