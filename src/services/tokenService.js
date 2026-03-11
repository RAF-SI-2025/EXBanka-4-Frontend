/**
 * Token Service
 *
 * Access token  → stored in sessionStorage.
 *   - Cleared when the tab/browser is closed.
 *
 * Refresh token → stored in sessionStorage.
 *   - Used to silently re-issue access tokens after expiry.
 *   - In production, prefer an httpOnly cookie set by the server.
 */

const ACCESS_TOKEN_KEY = 'access_token'
const TOKEN_KEY = 'refresh_token'

export const tokenService = {
  // ── Access token (sessionStorage) ──────────────────────────────────────
  getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY)
  },
  setAccessToken(token) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  },

  // ── Refresh token (sessionStorage) ─────────────────────────────────────
  getRefreshToken() {
    return sessionStorage.getItem(TOKEN_KEY)
  },
  setRefreshToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  },

  // ── Clear both (called on logout or auth failure) ───────────────────────
  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },
}
