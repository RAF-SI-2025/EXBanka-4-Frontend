export class Recipient {
  constructor({ id, name, accountNumber }) {
    this.id            = id
    this.name          = name
    this.accountNumber = accountNumber
  }
}

export function recipientFromApi(data) {
  return new Recipient({
    id:            data.id,
    name:          data.name,
    accountNumber: data.accountNumber ?? data.account_number,
  })
}

// Serbian bank account format: XXX-XXXXXXXXXX-YY
export function isValidAccountNumber(value) {
  return /^\d{3}-\d{10,13}-\d{2}$/.test(value.trim())
}

// Progressively formats digits as XXX-XXXXXXXXXXXXX-XX while typing or on paste.
// Strips non-digits then inserts dashes at positions 3 and 16.
export function formatAccountNumberInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 18)
  if (digits.length <= 3)  return digits
  if (digits.length <= 16) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 16)}-${digits.slice(16)}`
}
