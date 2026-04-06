/**
 * Feature: Kreiranje i upravljanje računima
 * Scenarios: 1–4 (employee), 6–8 (client)
 */

// ── Shared helpers ────────────────────────────────────────────────────────────

const CLIENT_EMAIL = 'ddimitrijevi822rn@raf.rs'

function selectClientByEmail(email) {
  cy.get('select[name="ownerId"] option')
    .contains(email)
    .then(($option) => {
      cy.get('select[name="ownerId"]').select($option.val())
    })
}

// Serbian locale formats numbers as "1.234,56" — strip dots and replace comma with dot to parse
function parseSrNumber(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'))
}

// ── Employee: Kreiranje računa ────────────────────────────────────────────────

describe('Kreiranje računa — zaposleni', () => {

  beforeEach(() => {
    // Given: zaposleni je ulogovan u aplikaciju
    cy.visit('/login')
    cy.get('input[name="email"]').type('admin@exbanka.com')
    cy.get('input[name="password"]').type('admin')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })

  // ── Scenario 1 ──────────────────────────────────────────────────────────────

  it('Scenario 1: kreira tekući račun, generiše 18-cifreni broj i šalje email obaveštenje', () => {
    // And: nalazi se na stranici za kreiranje računa
    cy.visit('/admin/accounts/new')

    // When: izabere postojećeg klijenta iz baze
    selectClientByEmail(CLIENT_EMAIL)

    // And: izabere tip računa "Tekući račun"
    // Personal type is selected by default; Standard subtype = tekući račun
    cy.get('input[type="radio"][name="type"][value="personal"]').should('be.checked')
    cy.get('select[name="subtype"]').select('Standard')

    // Account name auto-fills after subtype selection
    cy.get('input[name="accountName"]').should('have.value', 'Standard Account')

    // And: unese početno stanje računa (limiti su automatski popunjeni)
    cy.get('input[name="dailyLimit"]').should('have.value', '250000')
    cy.get('input[name="monthlyLimit"]').should('have.value', '1000000')

    cy.get('button[type="submit"]').click()

    // Then: sistem generiše broj računa od 18 cifara
    cy.get('.font-mono', { timeout: 10000 })
      .invoke('text')
      .invoke('trim')
      .should('match', /^\d{18}$/)

    // And: račun se uspešno kreira
    cy.contains('Account Created').should('be.visible')

    // And: klijent dobija email obaveštenje o uspešnom otvaranju računa
    cy.contains('confirmation email has been sent').should('be.visible')
    cy.contains(CLIENT_EMAIL).should('be.visible')
  })

  // ── Scenario 2 ──────────────────────────────────────────────────────────────

  it('Scenario 2: kreira devizni račun u EUR sa početnim stanjem 0 i šalje email obaveštenje', () => {
    cy.visit('/admin/accounts/new')

    selectClientByEmail(CLIENT_EMAIL)

    cy.get('input[type="radio"][name="type"][value="personal"]').should('be.checked')
    cy.get('select[name="subtype"]').select('Standard')

    // And: izabere tip "Devizni račun" (Foreign Currency)
    cy.get('input[type="radio"][name="currencyType"][value="foreign"]').click()

    // And: izabere valutu EUR
    cy.get('select[name="currency"]').select('EUR')

    cy.get('button[type="submit"]').click()

    // Then: sistem kreira devizni račun sa 18-cifrenim brojem
    cy.get('.font-mono', { timeout: 10000 })
      .invoke('text')
      .invoke('trim')
      .should('match', /^\d{18}$/)

    cy.contains('Account Created').should('be.visible')
    cy.contains('confirmation email has been sent').should('be.visible')
    cy.contains(CLIENT_EMAIL).should('be.visible')

    // And: račun se prikazuje u listi računa klijenta
    cy.get('.font-mono')
      .invoke('text')
      .invoke('trim')
      .then((accountNumber) => {
        cy.contains('All Accounts').click()
        cy.url().should('include', '/admin/accounts')
        cy.contains(accountNumber).should('be.visible')
      })
  })

  // ── Scenario 3 ──────────────────────────────────────────────────────────────

  it('Scenario 3: kreira račun sa automatskim kreiranjem kartice', () => {
    cy.visit('/admin/accounts/new')

    selectClientByEmail(CLIENT_EMAIL)

    cy.get('input[type="radio"][name="type"][value="personal"]').should('be.checked')
    cy.get('select[name="subtype"]').select('Standard')

    // And: čekira opciju "Napravi karticu"
    cy.get('input[type="checkbox"]').check()
    cy.get('input[type="checkbox"]').should('be.checked')

    cy.get('button[type="submit"]').click()

    // Then: sistem kreira novi račun
    cy.contains('Account Created', { timeout: 10000 }).should('be.visible')

    cy.contains('confirmation email has been sent').should('be.visible')
    cy.contains(CLIENT_EMAIL).should('be.visible')

    // And: automatski generiše debitnu karticu povezanu sa tim računom
    cy.get('.font-mono')
      .invoke('text')
      .invoke('trim')
      .then((accountNumber) => {
        cy.contains('All Accounts').click()
        cy.url().should('include', '/admin/accounts')
        cy.contains(accountNumber).click()
        cy.url().should('match', /\/admin\/accounts\/\d+/)

        cy.contains('Cards').should('be.visible')
        cy.contains('No cards linked to this account.', { timeout: 10000 }).should('not.exist')
        cy.get('.font-mono').first().invoke('text').should('match', /\d{16}/)
      })
  })

  // ── Scenario 4 ──────────────────────────────────────────────────────────────

  it('Scenario 4: kreira poslovni račun za firmu i dobija status Aktivan', () => {
    cy.visit('/admin/accounts/new')

    selectClientByEmail(CLIENT_EMAIL)

    // When: izabere opciju "Poslovni račun"
    cy.get('input[type="radio"][name="type"][value="business"]').click()
    cy.get('select[name="subtype"]').select('DOO (LLC)')
    cy.get('input[name="accountName"]').should('have.value', 'DOO (LLC) Account')

    // And: unese podatke o firmi
    cy.get('input[name="name"]').type('Test Firma d.o.o.')
    cy.get('input[name="registrationNumber"]').type('12345678')
    cy.get('input[name="pib"]').type('123456789')
    cy.get('select[name="activityCode"]').select('62.01')
    cy.get('input[name="address"]').type('Knez Mihailova 1, Beograd')

    cy.get('button[type="submit"]').click()

    cy.contains('Account Created', { timeout: 10000 }).should('be.visible')
    cy.get('.font-mono').invoke('text').invoke('trim').should('match', /^\d{18}$/)

    // And: račun dobija status "Aktivan"
    cy.get('.font-mono')
      .invoke('text')
      .invoke('trim')
      .then((accountNumber) => {
        cy.contains('All Accounts').click()
        cy.url().should('include', '/admin/accounts')
        cy.contains(accountNumber).click()
        cy.url().should('match', /\/admin\/accounts\/\d+/)

        cy.contains('active', { timeout: 10000 }).should('be.visible')
        cy.contains('Business').should('be.visible')
      })
  })
})

// ── Client: Pregled računa ────────────────────────────────────────────────────

describe('Pregled računa — klijent', () => {

  beforeEach(() => {
    // Given: klijent je ulogovan u aplikaciju
    cy.visit('/client/login')
    cy.get('input[name="email"]').type(CLIENT_EMAIL)
    cy.get('input[name="password"]').type('taraDunjic123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })

  // ── Scenario 6 ──────────────────────────────────────────────────────────────

  it('Scenario 6: prikazuju se aktivni računi sortirani po raspoloživom stanju', () => {
    // When: otvori sekciju "Računi"
    cy.visit('/client/accounts')

    // Then: prikazuju se svi aktivni računi klijenta
    cy.get('button[class*="rounded-xl"]', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Every visible status badge must be "active"
    cy.get('[class*="rounded-full"]').each(($badge) => {
      const text = $badge.text().trim().toLowerCase()
      if (text === 'active' || text === 'inactive') {
        expect(text).to.eq('active')
      }
    })

    // And: računi su sortirani po raspoloživom stanju (descending)
    cy.get('.font-serif.text-2xl').then(($balances) => {
      const values = [...$balances].map((el) => parseSrNumber(el.innerText.trim()))
      const sorted = [...values].sort((a, b) => b - a)
      expect(values).to.deep.equal(sorted)
    })
  })

  // ── Scenario 7 ──────────────────────────────────────────────────────────────

  it('Scenario 7: pregled detalja računa prikazuje broj računa, stanja i tip', () => {
    cy.visit('/client/accounts')
    cy.get('button[class*="rounded-xl"]', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne na nalog da otvori detalje
    cy.get('button[class*="rounded-xl"]').first().click()
    cy.url().should('match', /\/client\/accounts\/\d+/)

    // Then: prikazan je broj računa
    cy.get('.font-mono', { timeout: 10000 })
      .invoke('text')
      .invoke('trim')
      .should('match', /^\d{18}$/)

    // And: prikazano je stanje i raspoloživo stanje
    cy.contains('Available balance').should('be.visible')
    cy.contains('Total balance').should('be.visible')

    // And: prikazan je tip računa
    cy.contains('Type').scrollIntoView().should('be.visible')
    cy.contains(/personal|business/).should('be.visible')
  })

  // ── Scenario 8 ──────────────────────────────────────────────────────────────

  it('Scenario 8: promena naziva računa prikazuje potvrdu o uspešnoj promeni', () => {
    cy.visit('/client/accounts')
    cy.get('button[class*="rounded-xl"]', { timeout: 10000 }).first().click()
    cy.url().should('match', /\/client\/accounts\/\d+/)

    // When: izabere opciju "Promena naziva računa"
    cy.contains('Change Name').click()

    cy.get('input.input-field').should('be.visible').as('nameInput')

    // And: unese novi naziv
    const newName = `Moj račun ${Date.now()}`
    cy.get('@nameInput').clear().type(newName)
    cy.get('@nameInput').type('{enter}')

    // Then: sistem uspešno menja naziv računa
    cy.contains(newName).should('be.visible')

    // And: prikazuje potvrdu o uspešnoj promeni
    cy.contains('Account name updated successfully.').should('be.visible')
  })
})
