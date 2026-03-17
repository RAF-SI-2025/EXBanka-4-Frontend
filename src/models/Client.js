export class Client {
  constructor({
    id,
    firstName,
    lastName,
    jmbg,
    email,
    phoneNumber,
    address,
    dateOfBirth,
    gender,
    username,
    active,
    bankAccounts,
  }) {
    this.id          = id
    this.firstName   = firstName
    this.lastName    = lastName
    this.jmbg        = jmbg ?? ''
    this.email       = email
    this.phoneNumber = phoneNumber
    this.address     = address
    this.dateOfBirth = dateOfBirth
    this.gender      = gender
    this.username    = username
    this.active      = active
    this.bankAccounts = bankAccounts ?? []
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

export function clientFromApi(data) {
  return new Client({
    id:          data.id,
    firstName:   data.first_name,
    lastName:    data.last_name,
    jmbg:        data.jmbg,
    email:       data.email,
    phoneNumber: data.phone_number,
    address:     data.address,
    dateOfBirth: data.date_of_birth,
    gender:      data.gender,
    username:    data.username,
    active:      data.active,
    bankAccounts: [],
  })
}
