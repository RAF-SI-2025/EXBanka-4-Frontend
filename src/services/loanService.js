import { clientApiClient } from './clientApiClient'
import { apiClient } from './apiClient'

export const loanService = {
  async getMyLoans() {
    const { data } = await clientApiClient.get('/loans')
    return data
  },

  async getLoanById(id) {
    const { data } = await clientApiClient.get(`/loans/${id}`)
    return data
  },

  async applyForLoan(payload) {
    const { data } = await clientApiClient.post('/loans/apply', payload)
    return data
  },
}

export const employeeLoanService = {
  async getLoanApplications({ loanType, accountNumber } = {}) {
    const params = {}
    if (loanType)      params.loanType      = loanType
    if (accountNumber) params.accountNumber = accountNumber
    const { data } = await apiClient.get('/admin/loans/applications', { params })
    return data
  },

  async approveLoan(id) {
    const { data } = await apiClient.put(`/admin/loans/${id}/approve`)
    return data
  },

  async rejectLoan(id) {
    const { data } = await apiClient.put(`/admin/loans/${id}/reject`)
    return data
  },

  async getAllLoans({ loanType, accountNumber, status } = {}) {
    const params = {}
    if (loanType)      params.loanType      = loanType
    if (accountNumber) params.accountNumber = accountNumber
    if (status)        params.status        = status
    const { data } = await apiClient.get('/admin/loans', { params })
    return data
  },
}
