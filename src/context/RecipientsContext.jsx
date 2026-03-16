import { createContext, useContext, useState, useEffect } from 'react'
import { recipientService } from '../services/recipientService'

const RecipientsContext = createContext()

export function RecipientsProvider({ children }) {
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading]       = useState(true)
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

  function reorderRecipients(newList) {
    setRecipients(newList)
  }

  useEffect(() => { reload() }, [])

  return (
    <RecipientsContext.Provider value={{ recipients, loading, error, reload, addRecipient, updateRecipient, deleteRecipient, reorderRecipients }}>
      {children}
    </RecipientsContext.Provider>
  )
}

export function useRecipients() {
  return useContext(RecipientsContext)
}
