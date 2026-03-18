import { apiClient } from './apiClient'
import { bankAccountFromApi } from '../models/BankAccount'

export const accountService = {
  async getAccounts() {
    const { data } = await apiClient.get('/api/accounts')
    return data.map((a) => bankAccountFromApi({
      id:               a.id,
      accountNumber:    a.accountNumber,
      accountName:      a.accountName,
      ownerId:          a.ownerId,
      ownerFirstName:   a.ownerFirstName,
      ownerLastName:    a.ownerLastName,
      accountType:      a.accountType,
      currencyCode:     a.currencyCode,
      availableBalance: a.availableBalance,
    }))
  },

  async getAccountById(id) {
    const { data } = await apiClient.get(`/api/accounts/${id}`)
    return bankAccountFromApi({ id, ...data })
  },

  async createAccount({ ownerId, ownerFirstName, ownerLastName, type, currencyType, currency }) {
    let accountType
    if (type === 'business') {
      accountType = 'BUSINESS'
    } else if (currencyType === 'foreign') {
      accountType = 'FOREIGN_CURRENCY'
    } else {
      accountType = 'CURRENT'
    }
    const { data } = await apiClient.post('/api/accounts/create', {
      clientId:     ownerId,
      accountType,
      currencyCode: currency,
    })
    return bankAccountFromApi({ ownerFirstName, ownerLastName, ...data })
  },
}
