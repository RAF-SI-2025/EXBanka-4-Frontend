import { Payment } from '../models/Payment'

// Mock data — replace with GET /api/payments when backend is ready
export const MOCK_PAYMENTS = [
  new Payment({ id: 1,  dateTime: '2026-03-14 09:23', recipient: 'Coffee Shop',        recipientAccount: '265-0000000987654-32', amount: -350,   fee: 0,  currency: 'RSD', status: 'completed',  reference: 'REF-2026-0314-001', purpose: 'Coffee and snacks' }),
  new Payment({ id: 2,  dateTime: '2026-03-13 08:00', recipient: 'Poslodavac d.o.o.',  recipientAccount: '265-0000000111222-33', amount:  85000, fee: 0,  currency: 'RSD', status: 'completed',  reference: 'REF-2026-0313-001', purpose: 'Monthly salary' }),
  new Payment({ id: 3,  dateTime: '2026-03-12 11:45', recipient: 'EPS Distribucija',   recipientAccount: '265-0000000444555-66', amount: -4200,  fee: 30, currency: 'RSD', status: 'completed',  reference: 'REF-2026-0312-001', purpose: 'Electricity bill March' }),
  new Payment({ id: 4,  dateTime: '2026-03-11 14:12', recipient: 'Amazon EU',          recipientAccount: '265-0000000777888-99', amount: -2800,  fee: 50, currency: 'RSD', status: 'completed',  reference: 'REF-2026-0311-001', purpose: 'Online purchase' }),
  new Payment({ id: 5,  dateTime: '2026-03-10 16:30', recipient: 'Banka bankomat',     recipientAccount: '265-0000000000000-00', amount: -5000,  fee: 0,  currency: 'RSD', status: 'completed',  reference: 'REF-2026-0310-001', purpose: 'ATM withdrawal' }),
  new Payment({ id: 6,  dateTime: '2026-03-09 10:05', recipient: 'Ivan Petrović',      recipientAccount: '265-0000000321654-12', amount: -12000, fee: 30, currency: 'RSD', status: 'pending',    reference: 'REF-2026-0309-001', purpose: 'Transfer to friend' }),
  new Payment({ id: 7,  dateTime: '2026-03-08 08:15', recipient: 'Telekom Srbija',     recipientAccount: '265-0000000654321-45', amount: -1490,  fee: 0,  currency: 'RSD', status: 'completed',  reference: 'REF-2026-0308-001', purpose: 'Mobile subscription' }),
  new Payment({ id: 8,  dateTime: '2026-03-07 19:22', recipient: 'Netflix',            recipientAccount: '265-0000000999111-22', amount: -699,   fee: 0,  currency: 'RSD', status: 'failed',     reference: 'REF-2026-0307-001', purpose: 'Streaming subscription' }),
  new Payment({ id: 9,  dateTime: '2026-03-06 13:40', recipient: 'Ignjat Nikolić',     recipientAccount: '265-0000000222333-44', amount: -3500,  fee: 30, currency: 'RSD', status: 'completed',  reference: 'REF-2026-0306-001', purpose: 'Shared expenses' }),
  new Payment({ id: 10, dateTime: '2026-03-05 17:55', recipient: 'Booking.com',        recipientAccount: '265-0000000555666-77', amount: -180,   fee: 2,  currency: 'EUR', status: 'processing', reference: 'REF-2026-0305-001', purpose: 'Hotel reservation' }),
  new Payment({ id: 11, dateTime: '2026-03-04 12:00', recipient: 'Andrija Jovanović',  recipientAccount: '265-0000000888999-11', amount: -8000,  fee: 30, currency: 'RSD', status: 'completed',  reference: 'REF-2026-0304-001', purpose: 'Rent' }),
  new Payment({ id: 12, dateTime: '2026-03-03 09:10', recipient: 'Infostud d.o.o.',    recipientAccount: '265-0000000333444-55', amount:  32000, fee: 0,  currency: 'RSD', status: 'completed',  reference: 'REF-2026-0303-001', purpose: 'Freelance payment' }),
]
