/**
 * Feature: Prikaz liste berzi i toggle za radno vreme
 * Scenarios: 82
 *
 * Route /admin/stock-exchanges is accessible to supervisors and admins.
 * The test mode toggle card is rendered only for ADMIN role.
 */

const SUPERVISOR_EMAIL    = 'vasa@banka.rs'
const SUPERVISOR_PASSWORD = 'vasilije123'
const ADMIN_EMAIL         = 'admin@exbanka.com'
const ADMIN_PASSWORD      = 'admin'

// ── Helpers ────────────────────────────────────────────────────────────────────

function loginAsSupervisor() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(SUPERVISOR_EMAIL)
  cy.get('input[name="password"]').type(SUPERVISOR_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsAdmin() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(ADMIN_EMAIL)
  cy.get('input[name="password"]').type(ADMIN_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Prikaz liste berzi — scenario 82', () => {

  // ── Scenario 82a ──────────────────────────────────────────────────────────────

  it('Scenario 82a: supervizor vidi listu berzi sa svim osnovnim podacima', () => {
    // Given: korisnik (supervizor) otvori stranicu sa listom berzi
    loginAsSupervisor()
    cy.visit('/admin/stock-exchanges')

    // Then: prikazuje se naslov stranice
    cy.contains('h1', 'Stock Exchanges').should('be.visible')

    // And: tabela sadrži redove sa berzama
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // And: prikazuju se sve obavezne kolone (naziv, akronim, MIC kod, valuta, vremenska zona)
    ;['Name', 'Acronym', 'MIC Code', 'Currency', 'Timezone'].forEach((col) => {
      cy.contains('th', col).should('be.visible')
    })

    // And: prvi red sadrži neprazne vrednosti za svaku obaveznu kolonu
    cy.get('tbody tr').first().find('td').then(($tds) => {
      // indices: 0=Name, 1=Acronym, 2=MIC Code, 4=Currency, 5=Timezone
      ;[0, 1, 2, 4, 5].forEach((i) => {
        expect($tds.eq(i).text().trim()).not.to.be.empty
      })
    })
  })

  // ── Scenario 82b ──────────────────────────────────────────────────────────────

  it('Scenario 82b: admin vidi dugme za uključivanje/isključivanje radnog vremena berze', () => {
    // Given: korisnik (admin) otvori stranicu sa listom berzi
    loginAsAdmin()
    cy.visit('/admin/stock-exchanges')

    // Then: stranica se učitava
    cy.contains('h1', 'Stock Exchanges').should('be.visible')

    // And: postoji dugme za toggle test moda (radnog vremena)
    cy.contains(/Enable Test Mode|Disable Test Mode/).should('be.visible')

    // And: badge prikazuje trenutno stanje (ON ili OFF)
    cy.contains(/^(ON|OFF)$/).should('be.visible')
  })

})
