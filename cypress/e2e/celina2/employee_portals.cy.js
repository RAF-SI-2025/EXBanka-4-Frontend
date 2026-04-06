/**
 * Feature: Portali za zaposlene (Employee Portals)
 * Scenarios: 39–40
 */

const EMPLOYEE_EMAIL    = 'admin@exbanka.com'
const EMPLOYEE_PASSWORD = 'admin'

// A client known to exist in the DB
const KNOWN_CLIENT_EMAIL = 'ddimitrijevi822rn@raf.rs'

describe('Portal za upravljanje klijentima — zaposleni', () => {

  beforeEach(() => {
    cy.visit('/login')
    cy.get('input[name="email"]').type(EMPLOYEE_EMAIL)
    cy.get('input[name="password"]').type(EMPLOYEE_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    cy.intercept('GET', '**/clients*').as('loadClients')
    cy.visit('/admin/clients')
    cy.wait('@loadClients')
    cy.contains('h1', 'Clients').should('be.visible')
  })

  // ── Scenario 39 ─────────────────────────────────────────────────────────────

  it('Scenario 39: pretraga klijenta prikazuje odgovarajuće rezultate', () => {
    // When: unese email klijenta u polje za pretragu
    cy.get('input[placeholder="Search by name or email…"]').type(KNOWN_CLIENT_EMAIL)

    // Then: sistem prikazuje listu klijenata koji odgovaraju kriterijumu
    cy.contains('td', KNOWN_CLIENT_EMAIL).should('be.visible')

    // Only matching rows are shown
    cy.get('tbody tr').should('have.length', 1)
    cy.contains('No clients match your search.').should('not.exist')

    // And: zaposleni može otvoriti profil klijenta
    cy.get('tbody tr').first().click()
    cy.url().should('match', /\/admin\/clients\/\d+/)
    cy.get('h1').should('be.visible')
  })

  // ── Scenario 40 ─────────────────────────────────────────────────────────────

  it('Scenario 40: izmena podataka klijenta — sistem čuva nove podatke', () => {
    // Given: otvorio je profil određenog klijenta
    cy.get('input[placeholder="Search by name or email…"]').type(KNOWN_CLIENT_EMAIL)
    cy.get('tbody tr').first().click()
    cy.url().should('match', /\/admin\/clients\/\d+/)

    // When: klikne Edit
    cy.contains('button', 'Edit').click()

    // Editing mode is now active — phone and address fields are visible
    cy.get('input[name="phoneNumber"]').should('be.visible')
    cy.get('input[name="address"]').should('be.visible')

    // And: izmeni broj telefona i adresu
    const newPhone   = '+381601234567'
    const newAddress = `Testna ulica ${Date.now()}`

    cy.get('input[name="phoneNumber"]').clear().type(newPhone)
    cy.get('input[name="address"]').clear().type(newAddress)

    // And: klikne na dugme "Sačuvaj"
    cy.contains('button', 'Save').click()

    // Then: sistem čuva nove podatke — edit mode exits and values are displayed
    cy.contains('button', 'Edit').should('be.visible')   // back to view mode
    cy.contains('button', 'Save').should('not.exist')    // save button gone

    cy.contains(newPhone).should('be.visible')
    cy.contains(newAddress).should('be.visible')
  })
})
