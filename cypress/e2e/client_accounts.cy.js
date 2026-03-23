/**
 * Feature: Pregled računa klijenta (client portal)
 */

// Serbian locale formats numbers as "1.234,56" — strip dots and replace comma with dot to parse
function parseSrNumber(str) {
  return parseFloat(str.replace(/\./g, '').replace(',', '.'))
}

describe('Pregled računa klijenta', () => {

  beforeEach(() => {
    // Given: klijent je ulogovan u aplikaciju
    cy.visit('/client/login')
    cy.get('input[name="email"]').type('ddimitrijevi822rn@raf.rs')
    cy.get('input[name="password"]').type('taraDunjic123')
    cy.get('button[type="submit"]').click()
    // Wait for redirect away from login — /client/login also contains '/client'
    // so we must assert the login segment is gone
    cy.url().should('not.include', '/login')
  })

  // ── Scenario 6 ──────────────────────────────────────────────────────────────

  it('Scenario 6: prikazuju se aktivni računi sortirani po raspoloživom stanju', () => {
    // When: otvori sekciju "Računi"
    cy.visit('/client/accounts')

    // Then: prikazuju se svi aktivni računi klijenta
    // Use button[class*="rounded-xl"] — account cards are <button> elements
    cy.get('button[class*="rounded-xl"]', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Every visible status badge must be "active"
    cy.get('[class*="rounded-full"]').each(($badge) => {
      const text = $badge.text().trim().toLowerCase()
      if (text === 'active' || text === 'inactive') {
        expect(text).to.eq('active')
      }
    })

    // And: računi su sortirani po raspoloživom stanju (descending)
    cy.get('.font-serif.text-2xl')
      .then(($balances) => {
        const values = [...$balances].map((el) => parseSrNumber(el.innerText.trim()))
        const sorted = [...values].sort((a, b) => b - a)
        expect(values).to.deep.equal(sorted)
      })
  })

  // ── Scenario 7 ──────────────────────────────────────────────────────────────

  it('Scenario 7: pregled detalja računa prikazuje broj računa, stanja i tip', () => {
    // Given: klijent se nalazi na stranici "Računi"
    cy.visit('/client/accounts')
    cy.get('button[class*="rounded-xl"]', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne na nalog da otvori detalje
    cy.get('button[class*="rounded-xl"]').first().click()

    // Then: sistem prikazuje detaljne informacije o računu
    cy.url().should('match', /\/client\/accounts\/\d+/)

    // And: prikazan je broj računa (18-cifreni, u font-mono u zaglavlju)
    cy.get('.font-mono', { timeout: 10000 })
      .invoke('text')
      .invoke('trim')
      .should('match', /^\d{18}$/)

    // And: prikazano je stanje i raspoloživo stanje
    cy.contains('Available balance').should('be.visible')
    cy.contains('Total balance').should('be.visible')

    // And: prikazan je tip računa (može biti ispod folda — scrollujemo do njega)
    cy.contains('Type').scrollIntoView().should('be.visible')
    cy.contains(/personal|business/).should('be.visible')
  })

  // ── Scenario 8 ──────────────────────────────────────────────────────────────

  it('Scenario 8: promena naziva računa prikazuje potvrdu o uspešnoj promeni', () => {
    // Given: klijent je otvorio detalje računa
    cy.visit('/client/accounts')
    cy.get('button[class*="rounded-xl"]', { timeout: 10000 }).first().click()
    cy.url().should('match', /\/client\/accounts\/\d+/)

    // When: izabere opciju "Promena naziva računa"
    cy.contains('Change Name').click()

    // The account name heading becomes an input field
    cy.get('input.input-field').should('be.visible').as('nameInput')

    // And: unese novi naziv koji nije već korišćen
    const newName = `Moj račun ${Date.now()}`
    cy.get('@nameInput').clear().type(newName)

    // Confirm by pressing Enter
    cy.get('@nameInput').type('{enter}')

    // Then: sistem uspešno menja naziv računa
    cy.contains(newName).should('be.visible')

    // And: prikazuje potvrdu o uspešnoj promeni
    cy.contains('Account name updated successfully.').should('be.visible')
  })
})
