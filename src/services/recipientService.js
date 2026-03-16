/**
 * Recipient service (mock)
 *
 * Replace function bodies with real API calls when backend is ready:
 *   GET    /api/recipients
 *   POST   /api/recipients
 *   PUT    /api/recipients/{id}
 *   DELETE /api/recipients/{id}
 */

import { mockRecipients } from '../mocks/recipients'
import { Recipient } from '../models/Recipient'

let _recipients = [...mockRecipients]
let _nextId = _recipients.length + 1

export const recipientService = {
  async getRecipients() {
    return [..._recipients]
  },

  async createRecipient({ name, accountNumber }) {
    const recipient = new Recipient({ id: _nextId++, name, accountNumber })
    _recipients = [..._recipients, recipient]
    return recipient
  },

  async updateRecipient(id, { name, accountNumber }) {
    const recipient = new Recipient({ id, name, accountNumber })
    _recipients = _recipients.map((r) => (r.id === id ? recipient : r))
    return recipient
  },

  async deleteRecipient(id) {
    _recipients = _recipients.filter((r) => r.id !== id)
  },
}
