import { apiClient } from './apiClient'
import { clientFromApi } from '../models/Client'

export const clientService = {
  async getClients({ page = 1, pageSize = 100 } = {}) {
    const { data } = await apiClient.get('/clients', {
      params: { page, page_size: pageSize },
    })
    return data.clients.map(clientFromApi)
  },

  async getClientById(id) {
    const { data } = await apiClient.get(`/clients/${id}`)
    return clientFromApi(data)
  },

  async createClient(formData) {
    const { data } = await apiClient.post('/clients', {
      first_name:    formData.firstName,
      last_name:     formData.lastName,
      jmbg:          formData.jmbg,
      date_of_birth: formData.dateOfBirth,
      gender:        formData.gender,
      email:         formData.email,
      phone_number:  formData.phoneNumber,
      address:       formData.address,
      username:      formData.username,
    })
    return clientFromApi(data)
  },

  async updateClient(id, fields) {
    const { data } = await apiClient.put(`/clients/${id}`, {
      first_name:    fields.firstName,
      last_name:     fields.lastName,
      jmbg:          fields.jmbg,
      date_of_birth: fields.dateOfBirth,
      gender:        fields.gender,
      email:         fields.email,
      phone_number:  fields.phoneNumber,
      address:       fields.address,
      username:      fields.username,
      active:        fields.active,
    })
    return clientFromApi(data)
  },
}
