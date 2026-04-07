import { apiClient } from './apiClient'

export const stockExchangeService = {
  async getAll() {
    const { data } = await apiClient.get('/stock-exchanges', { params: { page: 1, page_size: 100 } })
    return data.exchanges ?? []
  },
  async getTestMode() {
    const { data } = await apiClient.get('/stock-exchanges/test-mode')
    return data.enabled
  },
  async setTestMode(enabled) {
    const { data } = await apiClient.post('/stock-exchanges/test-mode', { enabled })
    return data.enabled
  },
}
