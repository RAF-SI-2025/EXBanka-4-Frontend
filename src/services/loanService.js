import { clientApiClient } from './clientApiClient'

export const loanService = {
  async getMyLoans() {
    const { data } = await clientApiClient.get('/loans')
    return data
  },

  async getLoanById(id) {
    const { data } = await clientApiClient.get(`/loans/${id}`)
    return data
  },

  async applyForLoan(payload) {
    const { data } = await clientApiClient.post('/loans', payload)
    return data
  },
}
