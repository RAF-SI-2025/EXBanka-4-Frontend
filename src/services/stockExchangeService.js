import { apiClient } from './apiClient'

export const stockExchangeService = {
  async getAll(page = 1, pageSize = 10) {
    const { data } = await apiClient.get('/stock-exchanges', { params: { page, page_size: pageSize } })
    return { exchanges: data.exchanges ?? [], totalCount: data.totalCount ?? 0 }
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
