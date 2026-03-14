import { mockClients } from '../mocks/clients'
import { Client } from '../models/Client'

// In-memory store so updates persist within a session.
// Replace the bodies of these functions with real API calls once the backend is ready.
let _clients = mockClients.map((c) => new Client(c))

export const clientService = {
  async getClients() {
    return [..._clients]
  },

  async getClientById(id) {
    const client = _clients.find((c) => c.id === id)
    if (!client) throw new Error(`Client ${id} not found`)
    return { ...client }
  },

  async updateClient(id, fields) {
    _clients = _clients.map((c) => {
      if (c.id !== id) return c
      return new Client({
        ...c,
        firstName:   fields.firstName   ?? c.firstName,
        lastName:    fields.lastName    ?? c.lastName,
        email:       fields.email       ?? c.email,
        phoneNumber: fields.phoneNumber ?? c.phoneNumber,
        address:     fields.address     ?? c.address,
        dateOfBirth: fields.dateOfBirth ?? c.dateOfBirth,
        gender:      fields.gender      ?? c.gender,
        username:    fields.username    ?? c.username,
        active:      fields.active      ?? c.active,
      })
    })
    return _clients.find((c) => c.id === id)
  },
}
