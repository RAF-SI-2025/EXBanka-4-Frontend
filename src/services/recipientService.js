import { clientApiClient } from './clientApiClient'
import { recipientFromApi } from '../models/Recipient'

export const recipientService = {
  async getRecipients() {
    const { data } = await clientApiClient.get('/api/recipients')
    return data.map(recipientFromApi)
  },

  async createRecipient({ name, accountNumber }) {
    const { data } = await clientApiClient.post('/api/recipients', { name, accountNumber })
    return recipientFromApi(data)
  },

  async updateRecipient(id, { name, accountNumber }) {
    const { data } = await clientApiClient.put(`/api/recipients/${id}`, { name, accountNumber })
    return recipientFromApi(data)
  },

  async deleteRecipient(id) {
    await clientApiClient.delete(`/api/recipients/${id}`)
  },
}
