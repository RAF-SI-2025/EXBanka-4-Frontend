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
