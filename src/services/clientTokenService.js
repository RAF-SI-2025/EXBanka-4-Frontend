/**
 * Client Token Service
 *
 * Separate from tokenService (employee tokens) to avoid key collisions.
 * Uses 'client_access_token' and 'client_refresh_token' keys in sessionStorage.
 */

const CLIENT_ACCESS_TOKEN_KEY  = 'client_access_token'
const CLIENT_REFRESH_TOKEN_KEY = 'client_refresh_token'

export const clientTokenService = {
  getAccessToken()       { return sessionStorage.getItem(CLIENT_ACCESS_TOKEN_KEY) },
  setAccessToken(token)  { sessionStorage.setItem(CLIENT_ACCESS_TOKEN_KEY, token) },

  getRefreshToken()      { return sessionStorage.getItem(CLIENT_REFRESH_TOKEN_KEY) },
  setRefreshToken(token) { sessionStorage.setItem(CLIENT_REFRESH_TOKEN_KEY, token) },

  clear() {
    sessionStorage.removeItem(CLIENT_ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(CLIENT_REFRESH_TOKEN_KEY)
  },
}
