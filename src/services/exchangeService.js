import { clientApiClient } from './clientApiClient'

export const exchangeService = {
  async getRates() {
    const { data } = await clientApiClient.get('/exchange/rates')
    return data
  },

  async preview({ fromCurrency, toCurrency, amount }) {
    const { data } = await clientApiClient.post('/exchange/preview', { fromCurrency, toCurrency, amount })
    return data
  },

  async convert({ fromAccount, toAccount, amount }) {
    const { data } = await clientApiClient.post('/exchange/convert', { fromAccount, toAccount, amount })
    return data
  },

  async getHistory() {
    const { data } = await clientApiClient.get('/exchange/history')
    return data.transactions ?? data
  },
}
