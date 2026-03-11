/**
 * AuthContext
 *
 * Provides { user, login, logout, loading } to the component tree.
 *
 * On mount it attempts to restore a session from a stored refresh token.
 * It also listens for the 'auth:session-expired' event dispatched by the
 * apiClient interceptor when a token refresh fails, and logs the user out.
 *
 * The `user` object shape:
 *   { id, firstName, lastName, email, roles: string[], permissions: object }
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)   // true while restoring session

  // ── Restore session on mount ────────────────────────────────────────────
  useEffect(() => {
    authService.restoreSession()
      .then((restored) => setUser(restored))
      .finally(() => setLoading(false))
  }, [])

  // ── Listen for forced logout from the interceptor ───────────────────────
  useEffect(() => {
    function handleExpired() {
      setUser(null)
    }
    window.addEventListener('auth:session-expired', handleExpired)
    return () => window.removeEventListener('auth:session-expired', handleExpired)
  }, [])

  // ── Public API ──────────────────────────────────────────────────────────

  async function login(email, password) {
    const userData = await authService.login(email, password)
    setUser(userData)
    return userData
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
