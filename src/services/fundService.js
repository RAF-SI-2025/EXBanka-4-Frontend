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
}
