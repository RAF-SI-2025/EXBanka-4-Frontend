import { apiClient } from './apiClient'

export const fundService = {
  async getFunds() {
    const { data } = await apiClient.get('/investment/funds')
    return data
  },

  async getFund(id) {
    const { data } = await apiClient.get(`/investment/funds/${id}`)
    return data
  },

  async createFund(payload) {
    const { data } = await apiClient.post('/investment/funds', payload)
    return data
  },

  async updateFund(id, payload) {
    const { data } = await apiClient.put(`/investment/funds/${id}`, payload)
    return data
  },

  async deleteFund(id) {
    await apiClient.delete(`/investment/funds/${id}`)
  },

  async invest(fundId, { sourceAccountId, amount }) {
    const { data } = await apiClient.post(`/investment/funds/${fundId}/invest`, {
      sourceAccountId,
      amount,
    })
    return data
  },

  async withdraw(fundId, { destinationAccountId, amount }) {
    const { data } = await apiClient.post(`/investment/funds/${fundId}/withdraw`, {
      destinationAccountId,
      amount,
    })
    return data
  },

  async getFundSecurities(id) {
    const { data } = await apiClient.get(`/investment/funds/${id}/securities`)
    return data
  },

  async sellFundSecurity(fundId, payload) {
    const { data } = await apiClient.post(`/investment/funds/${fundId}/securities/sell`, payload)
    return data
  },

  async getFundPerformance(id, from, to) {
    const { data } = await apiClient.get(`/investment/funds/${id}/performance`, { params: { from, to } })
    return data
  },

  async getMyPositions() {
    const { data } = await apiClient.get('/investment/funds/my-positions')
    return Array.isArray(data) ? data : (data.positions ?? data.items ?? [])
  },

  async getManagedFunds(managerId) {
    const { data } = await apiClient.get('/investment/funds', { params: { managerId } })
    return Array.isArray(data) ? data : (data.funds ?? data.items ?? [])
  },

  async getBankPositions() {
    const { data } = await apiClient.get('/investment/funds/bank-positions')
    return Array.isArray(data) ? data : (data.positions ?? data.items ?? [])
  },
}
