import { clientApiClient } from './clientApiClient'

export const transferService = {
  async createTransfer({ fromAccount, toAccount, amount }) {
    const { data } = await clientApiClient.post('/api/transfers', { fromAccount, toAccount, amount })
    return data
  },
}
