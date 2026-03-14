import { createContext, useContext, useState } from 'react'
import { clientService } from '../services/clientService'

const ClientsContext = createContext()

export function ClientsProvider({ children }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function reload() {
    setLoading(true)
    setError(null)
    try {
      const data = await clientService.getClients()
      setClients(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  async function updateClient(id, fields) {
    const updated = await clientService.updateClient(id, fields)
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }

  return (
    <ClientsContext.Provider value={{ clients, loading, error, reload, updateClient }}>
      {children}
    </ClientsContext.Provider>
  )
}

export function useClients() {
  return useContext(ClientsContext)
}
