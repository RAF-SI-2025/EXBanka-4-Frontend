import { apiClient } from './apiClient'

export const bankProfitService = {
  async getBankFundPositions() {
    const { data } = await apiClient.get('/bank/profit/fund-positions')
    return Array.isArray(data) ? data : (data.positions ?? data.items ?? [])
  },

  async bankInvest(fundId, { accountId, amount }) {
    const { data } = await apiClient.post(`/bank/profit/fund-positions/${fundId}/invest`, { accountId, amount })
    return data
  },

  async bankRedeem(fundId, { accountId, amount }) {
    const { data } = await apiClient.post(`/bank/profit/fund-positions/${fundId}/redeem`, { accountId, amount })
    return data
  },
}
