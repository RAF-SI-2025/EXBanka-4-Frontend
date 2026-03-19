import { createContext, useContext, useState, useEffect } from 'react'
import { paymentService } from '../services/paymentService'
import { useClientAuth } from './ClientAuthContext'

const ClientPaymentsContext = createContext()

export function ClientPaymentsProvider({ children }) {
  const { clientUser } = useClientAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function reload() {
    setLoading(true)
    try {
      const data = await paymentService.getPayments()
      setPayments(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (clientUser) reload() }, [clientUser])

  return (
    <ClientPaymentsContext.Provider value={{ payments, loading, error, reload }}>
      {children}
    </ClientPaymentsContext.Provider>
  )
}

export function useClientPayments() {
  return useContext(ClientPaymentsContext)
}
