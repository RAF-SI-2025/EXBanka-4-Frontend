import { clientApiClient } from './clientApiClient'

export const clientOtcService = {
  async getNegotiations() {
    const { data } = await clientApiClient.get('/otc/negotiations')
    return data
  },

  async getNegotiation(id) {
    const { data } = await clientApiClient.get(`/otc/negotiations/${id}`)
    return data
  },

  async createNegotiation(payload) {
    const { data } = await clientApiClient.post('/otc/negotiations', payload)
    return data
  },

  async counterOffer(id, payload) {
    const { data } = await clientApiClient.put(`/otc/negotiations/${id}/counter`, payload)
    return data
  },

  async acceptNegotiation(id) {
    const { data } = await clientApiClient.put(`/otc/negotiations/${id}/accept`)
    return data
  },

  async rejectNegotiation(id) {
    const { data } = await clientApiClient.put(`/otc/negotiations/${id}/reject`)
    return data
  },

  async getMarket() {
    const { data } = await clientApiClient.get('/otc/market')
    return data
  },

  async getExternalStocks() {
    const { data } = await clientApiClient.get('/api/otc/external-stocks')
    return data
  },

  async getContracts(status) {
    const { data } = await clientApiClient.get('/otc/contracts', { params: status ? { status } : undefined })
    return data
  },

  async exerciseContract(id, buyerAccountId) {
    const { data } = await clientApiClient.post(`/otc/contracts/${id}/exercise`, { buyerAccountId })
    return data
  },
}
