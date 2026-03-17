import { createContext, useContext, useState, useEffect } from 'react'
import { clientAuthService } from '../services/clientAuthService'

const ClientAuthContext = createContext()

export function ClientAuthProvider({ children }) {
  const [clientUser, setClientUser] = useState(null)

  // Restore session from stored token on mount.
  useEffect(() => {
    const user = clientAuthService.restoreSession()
    if (user) setClientUser(user)
  }, [])

  // Listen for forced logout when clientApiClient's token refresh fails.
  useEffect(() => {
    function handleExpired() { setClientUser(null) }
    window.addEventListener('client-auth:session-expired', handleExpired)
    return () => window.removeEventListener('client-auth:session-expired', handleExpired)
  }, [])

  async function clientLogin(email, password) {
    const userData = await clientAuthService.login(email, password)
    setClientUser(userData)
    return userData
  }

  async function clientLogout() {
    await clientAuthService.logout()
    setClientUser(null)
  }

  return (
    <ClientAuthContext.Provider value={{ clientUser, clientLogin, clientLogout }}>
      {children}
    </ClientAuthContext.Provider>
  )
}

export function useClientAuth() {
  return useContext(ClientAuthContext)
}
