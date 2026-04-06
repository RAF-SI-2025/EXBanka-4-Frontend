import { createContext, useContext, useState, useEffect } from 'react'
import { recipientService } from '../services/recipientService'
import { useClientAuth } from './ClientAuthContext'

const RecipientsContext = createContext()

export function RecipientsProvider({ children }) {
  const { clientUser } = useClientAuth()
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  async function reload() {
    setLoading(true)
    try {
      const data = await recipientService.getRecipients()
      setRecipients(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addRecipient(fields) {
    const created = await recipientService.createRecipient(fields)
    setRecipients((prev) => [...prev, created])
    return created
  }

  async function updateRecipient(id, fields) {
    const updated = await recipientService.updateRecipient(id, fields)
    setRecipients((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }

  async function deleteRecipient(id) {
    await recipientService.deleteRecipient(id)
    setRecipients((prev) => prev.filter((r) => r.id !== id))
  }

  async function reorderRecipients(newList) {
    setRecipients(newList)
    await recipientService.reorderRecipients(newList.map((r) => r.id))
  }

  useEffect(() => { if (clientUser) reload() }, [clientUser])

  return (
    <RecipientsContext.Provider value={{ recipients, loading, error, reload, addRecipient, updateRecipient, deleteRecipient, reorderRecipients }}>
      {children}
    </RecipientsContext.Provider>
  )
}

export function useRecipients() {
  return useContext(RecipientsContext)
}
