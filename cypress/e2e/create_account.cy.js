/**
 * Feature: Kreiranje i upravljanje računima
 */

const CLIENT_EMAIL = 'ddimitrijevi822rn@raf.rs'

function selectClientByEmail(email) {
  cy.get('select[name="ownerId"] option')
    .contains(email)
    .then(($option) => {
      cy.get('select[name="ownerId"]').select($option.val())
    })
}

describe('Kreiranje računa za postojećeg klijenta', () => {

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

    // Submit
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
    // And: nalazi se na stranici za kreiranje računa
    cy.visit('/admin/accounts/new')

    // When: izabere postojećeg klijenta iz baze
    selectClientByEmail(CLIENT_EMAIL)

    // Account type stays Personal (default)
    cy.get('input[type="radio"][name="type"][value="personal"]').should('be.checked')

    // Select any personal subtype to unlock the currency options
    cy.get('select[name="subtype"]').select('Standard')

    // And: izabere tip "Devizni račun" (Foreign Currency)
    cy.get('input[type="radio"][name="currencyType"][value="foreign"]').click()

    // And: izabere valutu EUR
    cy.get('select[name="currency"]').select('EUR')

    // Submit
    cy.get('button[type="submit"]').click()

    // Then: sistem kreira devizni račun sa 18-cifrenim brojem
    cy.get('.font-mono', { timeout: 10000 })
      .invoke('text')
      .invoke('trim')
      .should('match', /^\d{18}$/)

    // And: račun se uspešno kreira
    cy.contains('Account Created').should('be.visible')

    // And: klijent dobija email obaveštenje
    cy.contains('confirmation email has been sent').should('be.visible')
    cy.contains(CLIENT_EMAIL).should('be.visible')

    // And: račun se prikazuje u listi računa klijenta
    // Save account number from success screen, then verify it appears in the list
    cy.get('.font-mono')
      .invoke('text')
      .invoke('trim')
      .then((accountNumber) => {
        cy.contains('All Accounts').click()
        cy.url().should('include', '/admin/accounts')
        cy.contains(accountNumber).should('be.visible')
      })
  })

  // ── Scenario 4 ──────────────────────────────────────────────────────────────

  it('Scenario 4: kreira poslovni račun za firmu i dobija status Aktivan', () => {
    // Given: nalazi se na stranici za kreiranje računa
    cy.visit('/admin/accounts/new')

    // And: poveže vlasnika računa sa klijentom
    selectClientByEmail(CLIENT_EMAIL)

    // When: izabere opciju "Poslovni račun"
    cy.get('input[type="radio"][name="type"][value="business"]').click()

    // Select business subtype (DOO)
    cy.get('select[name="subtype"]').select('DOO (LLC)')

    // Account name auto-fills
    cy.get('input[name="accountName"]').should('have.value', 'DOO (LLC) Account')

    // And: unese podatke o firmi
    cy.get('input[name="name"]').type('Test Firma d.o.o.')
    cy.get('input[name="registrationNumber"]').type('12345678')
    cy.get('input[name="pib"]').type('123456789')
    cy.get('select[name="activityCode"]').select('62.01')
    cy.get('input[name="address"]').type('Knez Mihailova 1, Beograd')

    cy.get('button[type="submit"]').click()

    // Then: sistem kreira poslovni račun
    cy.contains('Account Created', { timeout: 10000 }).should('be.visible')

    cy.get('.font-mono')
      .invoke('text')
      .invoke('trim')
      .should('match', /^\d{18}$/)

    // And: račun dobija status "Aktivan" — verify on the account detail page
    cy.get('.font-mono')
      .invoke('text')
      .invoke('trim')
      .then((accountNumber) => {
        cy.contains('All Accounts').click()
        cy.url().should('include', '/admin/accounts')
        cy.contains(accountNumber).click()
        cy.url().should('match', /\/admin\/accounts\/\d+/)

        // Status badge should show "active"
        cy.contains('active', { timeout: 10000 }).should('be.visible')

        // Account type should be Business
        cy.contains('Business').should('be.visible')
      })
  })

  // ── Scenario 3 ──────────────────────────────────────────────────────────────

  it('Scenario 3: kreira račun sa automatskim kreiranjem kartice', () => {
    // Given: nalazi se na stranici za kreiranje računa
    cy.visit('/admin/accounts/new')

    selectClientByEmail(CLIENT_EMAIL)

    // When: izabere tip računa
    cy.get('input[type="radio"][name="type"][value="personal"]').should('be.checked')
    cy.get('select[name="subtype"]').select('Standard')

    // And: čekira opciju "Napravi karticu"
    cy.get('input[type="checkbox"]').check()
    cy.get('input[type="checkbox"]').should('be.checked')

    cy.get('button[type="submit"]').click()

    // Then: sistem kreira novi račun
    cy.contains('Account Created', { timeout: 10000 }).should('be.visible')

    // And: klijent dobija email obaveštenje
    cy.contains('confirmation email has been sent').should('be.visible')
    cy.contains(CLIENT_EMAIL).should('be.visible')

    // And: automatski generiše debitnu karticu povezanu sa tim računom
    // Navigate to the account detail page and verify the Cards section has a card
    cy.get('.font-mono')
      .invoke('text')
      .invoke('trim')
      .then((accountNumber) => {
        cy.contains('All Accounts').click()
        cy.url().should('include', '/admin/accounts')

        // Find the row with this account number and click it to open detail
        cy.contains(accountNumber).click()
        cy.url().should('match', /\/admin\/accounts\/\d+/)

        // Cards section should show at least one card (not the empty state)
        cy.contains('Cards').should('be.visible')
        cy.contains('No cards linked to this account.', { timeout: 10000 }).should('not.exist')
        cy.get('.font-mono').first().invoke('text').should('match', /\d{16}/)
      })
  })
})
