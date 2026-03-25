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
    const { data } = await apiClient.get(`/api/admin/accounts/${id}`)
    return bankAccountFromApi({ id, ...data })
  },

  async createAccount({ ownerId, ownerFirstName, ownerLastName, type, subtype, accountName, currencyType, currency, companyData, dailyLimit, monthlyLimit, createCard, cardLimit }) {
    let accountType
    if (currencyType === 'foreign') {
      accountType = 'FOREIGN_CURRENCY'
    } else if (type === 'business') {
      accountType = 'BUSINESS'
    } else if (subtype === 'savings') {
      accountType = 'SAVINGS'
    } else {
      accountType = 'CURRENT'
    }
    const { data } = await apiClient.post('/api/accounts/create', {
      clientId:       ownerId,
      accountType,
      accountSubtype: subtype,
      accountName,
      currencyCode:   currency,
      ...(companyData  && { companyData }),
      ...(dailyLimit   && { dailyLimit }),
      ...(monthlyLimit && { monthlyLimit }),
      ...(createCard   && { createCard: true }),
      ...(createCard && cardLimit && { cardLimit }),
    })
    return bankAccountFromApi({ ownerFirstName, ownerLastName, ...data })
  },

  async updateAccountLimits(id, { dailyLimit, monthlyLimit }) {
    await apiClient.put(`/api/accounts/${id}/limits`, { dailyLimit, monthlyLimit })
  },
}
