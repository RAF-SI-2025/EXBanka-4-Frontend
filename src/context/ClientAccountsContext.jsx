import { createContext, useContext, useState, useEffect } from 'react'
import { clientAccountService } from '../services/clientAccountService'
import { useClientAuth } from './ClientAuthContext'

const ClientAccountsContext = createContext()

export function ClientAccountsProvider({ children }) {
  const { clientUser } = useClientAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function reload() {
    setLoading(true)
    try {
      const data = await clientAccountService.getMyAccounts()
      setAccounts(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function renameAccount(id, newAccountName) {
    await clientAccountService.renameAccount(id, newAccountName)
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        a.accountName = newAccountName
        return a
      })
    )
  }

  useEffect(() => { if (clientUser) reload() }, [clientUser])

  return (
    <ClientAccountsContext.Provider value={{ accounts, loading, error, reload, renameAccount }}>
      {children}
    </ClientAccountsContext.Provider>
  )
}

export function useClientAccounts() {
  return useContext(ClientAccountsContext)
}
