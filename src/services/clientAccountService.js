import { clientApiClient } from './clientApiClient'
import { bankAccountFromApi } from '../models/BankAccount'

export const clientAccountService = {
  async getMyAccounts() {
    const { data } = await clientApiClient.get('/api/accounts/my')
    return data.map(bankAccountFromApi)
  },

  async getAccountById(id) {
    const { data } = await clientApiClient.get(`/api/accounts/${id}`)
    return bankAccountFromApi({ id, ...data })
  },

  async renameAccount(id, newAccountName) {
    await clientApiClient.put(`/api/accounts/${id}/name`, { newAccountName })
  },
}
