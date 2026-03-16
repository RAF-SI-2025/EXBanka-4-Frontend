import { Recipient } from '../models/Recipient'

const make = (data) => new Recipient(data)

// Mock saved recipients — replace with GET /api/recipients when backend is ready
export const mockRecipients = [
  make({ id: 1, name: 'Ivan Petrović',    accountNumber: '265-0000000321654-12' }),
  make({ id: 2, name: 'Ignjat Nikolić',   accountNumber: '265-0000000222333-44' }),
  make({ id: 3, name: 'Andrija Jovanović', accountNumber: '265-0000000888999-11' }),
  make({ id: 4, name: 'Jelena Marković',  accountNumber: '265-0000000456789-01' }),
]
