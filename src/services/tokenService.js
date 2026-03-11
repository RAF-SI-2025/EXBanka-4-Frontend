/**
 * Token Service
 *
 * Access token  → stored in memory only (not localStorage/sessionStorage).
 *   - Survives page re-renders but NOT full page reloads.
 *   - Protects against XSS reading the token from storage.
 *
 * Refresh token → stored in localStorage.
 *   - Used to silently re-issue access tokens after expiry.
 *   - In production, prefer an httpOnly cookie set by the server.
 */

const TOKEN_KEY = 'refresh_token'

let _accessToken = null

export const tokenService = {
  // ── Access token (in-memory) ────────────────────────────────────────────
  getAccessToken() {
    return _accessToken
  },
  setAccessToken(token) {
    _accessToken = token
  },

  // ── Refresh token (localStorage) ───────────────────────────────────────
  getRefreshToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setRefreshToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  // ── Clear both (called on logout or auth failure) ───────────────────────
  clear() {
    _accessToken = null
    localStorage.removeItem(TOKEN_KEY)
  },
}
