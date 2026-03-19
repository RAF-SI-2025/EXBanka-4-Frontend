import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useRecipients } from '../../context/RecipientsContext'
import { isValidAccountNumber, formatAccountNumberInput } from '../../models/Recipient'
import Spinner from '../../components/Spinner'
import { useApiError } from '../../context/ApiErrorContext'

// ─── Shared form component ────────────────────────────────────────────────────

function RecipientForm({ initial = { name: '', accountNumber: '' }, onSave, onCancel, submitLabel }) {
  const [form, setForm]     = useState(initial)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    const formatted = name === 'accountNumber' ? formatAccountNumberInput(value) : value
    setForm((prev) => ({ ...prev, [name]: formatted }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleBlur(e) {
    const { name } = e.target
    const errs = validate()
    if (errs[name]) setErrors((prev) => ({ ...prev, [name]: errs[name] }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim())                        errs.name          = 'Recipient name is required.'
    if (!form.accountNumber.trim())               errs.accountNumber = 'Account number is required.'
    else if (!isValidAccountNumber(form.accountNumber)) errs.accountNumber = 'Invalid account number format (e.g. 265-0000000000000-00).'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({ name: form.name.trim(), accountNumber: form.accountNumber.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">
          Recipient name *
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Full name or company"
          className={`input-field ${errors.name ? 'input-error' : ''}`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">
          Account number *
        </label>
        <input
          name="accountNumber"
          value={form.accountNumber}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="265-0000000000000-00"
          className={`input-field font-mono ${errors.accountNumber ? 'input-error' : ''}`}
        />
        {errors.accountNumber && <p className="mt-1 text-xs text-red-500">{errors.accountNumber}</p>}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary">{submitLabel}</button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">{title}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ClientRecipientsPage() {
  useWindowTitle('Recipients | AnkaBanka')
  const navigate = useNavigate()
  const { recipients, loading, addRecipient, updateRecipient, deleteRecipient, reorderRecipients } = useRecipients()
  const { addSuccess } = useApiError()
  const [dragIndex, setDragIndex] = useState(null)
  const [dropIndex, setDropIndex] = useState(null)

  const [showAdd, setShowAdd]         = useState(false)
  const [editTarget, setEditTarget]   = useState(null)   // recipient being edited
  const [deleteTarget, setDeleteTarget] = useState(null) // recipient pending deletion

  async function handleAdd(fields) {
    await addRecipient(fields)
    setShowAdd(false)
    addSuccess(`${fields.name} added to recipients.`, 'Recipient Added')
  }

  async function handleEdit(fields) {
    await updateRecipient(editTarget.id, fields)
    setEditTarget(null)
    addSuccess(`${fields.name} updated successfully.`, 'Recipient Updated')
  }

  async function handleDelete() {
    const name = deleteTarget.name
    await deleteRecipient(deleteTarget.id)
    setDeleteTarget(null)
    addSuccess(`${name} removed from recipients.`, 'Recipient Removed')
  }

  function handleDragStart(i) {
    setDragIndex(i)
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    setDropIndex(i)
  }

  function handleDrop(i) {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDropIndex(null); return }
    const next = [...recipients]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(i, 0, moved)
    reorderRecipients(next)
    setDragIndex(null)
    setDropIndex(null)
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-3xl mx-auto w-full">

        <div className="flex items-center justify-between mb-1">
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white">Recipients</h1>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            + Add recipient
          </button>
        </div>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {loading && <Spinner />}

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {recipients.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No saved recipients yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-3 py-3 w-10" />
                  <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Name</th>
                  <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Account number</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {recipients.map((r, i) => (
                  <tr
                    key={r.id}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={() => { setDragIndex(null); setDropIndex(null) }}
                    className={`transition-colors
                      ${dragIndex === i ? 'opacity-40' : ''}
                      ${dropIndex === i && dragIndex !== i ? 'border-t-2 border-violet-500 dark:border-violet-400' : i !== recipients.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}
                    `}
                  >
                    <td className="px-3 py-3.5 cursor-grab active:cursor-grabbing">
                      <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 4a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 10a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 16a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 dark:text-white font-light">{r.name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 font-mono">{r.accountNumber}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setEditTarget(r)}
                          className="text-xs tracking-widest uppercase text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="text-xs tracking-widest uppercase text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => navigate('/client/payments/new', { state: { recipient: r } })}
                          className="text-xs tracking-widest uppercase text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        >
                          Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {recipients.length > 3 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            The first 3 recipients appear in the Quick payment section on your dashboard. Use the arrows to reorder.
          </p>
        )}

      </div>

      {/* Add modal */}
      {showAdd && (
        <Modal title="Add recipient" onClose={() => setShowAdd(false)}>
          <RecipientForm
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
            submitLabel="Add"
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title="Edit recipient" onClose={() => setEditTarget(null)}>
          <RecipientForm
            initial={{ name: editTarget.name, accountNumber: editTarget.accountNumber }}
            onSave={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitLabel="Save"
          />
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Modal title="Delete recipient" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-light mb-6">
            Are you sure you want to remove <span className="font-medium text-slate-900 dark:text-white">{deleteTarget.name}</span> from your saved recipients?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs tracking-widest uppercase rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

    </ClientPortalLayout>
  )
}
