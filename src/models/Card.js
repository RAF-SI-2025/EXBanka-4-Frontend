/**
 * Card statuses: 'ACTIVE' | 'BLOCKED' | 'DEACTIVATED'
 * Card brands:  'VISA' | 'MASTERCARD' | 'DINACARD' | 'AMERICAN_EXPRESS'
 * Card types:   'DEBIT' | 'CREDIT'
 */

export class Card {
  constructor({
    cardNumber,
    cardType,
    cardName,
    createdAt,
    expiryDate,
    accountNumber,
    cardLimit,
    status,
    authorizedPersonId,
  }) {
    this.cardNumber         = cardNumber
    this.cardType           = cardType          ?? 'DEBIT'
    this.cardName           = cardName          ?? null   // brand: VISA, MASTERCARD, etc.
    this.createdAt          = createdAt         ?? null
    this.expiryDate         = expiryDate        ?? null
    this.accountNumber      = accountNumber
    this.cardLimit          = cardLimit         ?? 0
    this.status             = status            ?? 'ACTIVE'
    this.authorizedPersonId = authorizedPersonId ?? null
  }

  get isActive()      { return this.status === 'ACTIVE' }
  get isBlocked()     { return this.status === 'BLOCKED' }
  get isDeactivated() { return this.status === 'DEACTIVATED' }
}

export function cardFromApi(data) {
  return new Card({
    cardNumber:         data.cardNumber,
    cardType:           data.cardType,
    cardName:           data.cardName,
    createdAt:          data.createdAt,
    expiryDate:         data.expiryDate,
    accountNumber:      data.accountNumber,
    cardLimit:          data.cardLimit,
    status:             data.status,
    authorizedPersonId: data.authorizedPersonId ?? null,
  })
}
