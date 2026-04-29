import { apiClient } from './apiClient'

export const taxService = {
  async getTaxList() {
    const { data } = await apiClient.get('/tax')
    return data
  },
  async collectTax() {
    await apiClient.post('/tax/collect')
  },
}
