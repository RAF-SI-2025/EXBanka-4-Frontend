import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAuth } from '../../context/AuthContext'
import { actuaryService } from '../../services/actuaryService'
import { fundService } from '../../services/fundService'

export default function CreateFundPage() {
  useWindowTitle('Create Fund | AnkaBanka')
  const { user } = useAuth()
  const navigate = useNavigate()

  const [actuaries, setActuaries] = useState([])
  const [form, setForm] = useState({ name: '', description: '', minimumContribution: '', managerId: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user && !user.permissions?.isSupervisor) {
      navigate('/investment/funds', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    actuaryService.getActuaries().then(setActuaries).catch(() => {})
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Fund name is required.'
    if (!form.minimumContribution) errs.minimumContribution = 'Minimum contribution is required.'
    else if (parseFloat(form.minimumContribution) <= 0) errs.minimumContribution = 'Must be greater than 0.'
    if (!form.managerId) errs.managerId = 'Please select a manager.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSubmitting(true)
    try {
      await fundService.createFund({
        name: form.name.trim(),
        description: form.description.trim(),
        minimumContribution: parseFloat(form.minimumContribution),
        managerId: parseInt(form.managerId, 10),
      })
      navigate('/investment/funds', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Create Fund</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Fund Name <span className="text-violet-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`input-field ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. Growth Equity Fund"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="input-field resize-none"
              placeholder="Optional description of the fund's strategy"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Minimum Contribution (RSD) <span className="text-violet-500">*</span>
            </label>
            <input
              type="number"
              name="minimumContribution"
              value={form.minimumContribution}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              className={`input-field ${errors.minimumContribution ? 'input-error' : ''}`}
              placeholder="e.g. 1000"
            />
            {errors.minimumContribution && <p className="mt-1 text-xs text-red-500">{errors.minimumContribution}</p>}
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Fund Manager <span className="text-violet-500">*</span>
            </label>
            <select
              name="managerId"
              value={form.managerId}
              onChange={handleChange}
              className={`input-field appearance-none ${errors.managerId ? 'input-error' : ''}`}
            >
              <option value="">Select a manager</option>
              {actuaries.map((a) => (
                <option key={a.employeeId} value={a.employeeId}>
                  {a.fullName} — {a.position}
                </option>
              ))}
            </select>
            {errors.managerId && <p className="mt-1 text-xs text-red-500">{errors.managerId}</p>}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create Fund'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/investment/funds')}
              className="text-xs tracking-widest uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
