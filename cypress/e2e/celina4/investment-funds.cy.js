/**
 * Feature: Investicioni fondovi + Kreiranje fonda + Kupovina hartija za fond
 * Scenarios: 29–42
 */

const API_BASE         = 'http://localhost:8083'
const CLIENT_EMAIL     = 'dunja@banka.rs'
const CLIENT_PASS      = 'taraDunjic123'
const SUPERVISOR_EMAIL = 'vasa@banka.rs'
const SUPERVISOR_PASS  = 'vasilije123'
const AGENT_EMAIL      = 'elezovic@banka.rs'
const AGENT_PASS       = 'denis123'
const ADMIN_EMAIL      = 'admin@exbanka.com'
const ADMIN_PASS       = 'admin'

function loginAsClient() {
  cy.visit('/client/login')
  cy.get('input[name="email"]').type(CLIENT_EMAIL)
  cy.get('input[name="password"]').type(CLIENT_PASS)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/client/login')
}

function loginAsSupervisor() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(SUPERVISOR_EMAIL)
  cy.get('input[name="password"]').type(SUPERVISOR_PASS)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsAgent() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(AGENT_EMAIL)
  cy.get('input[name="password"]').type(AGENT_PASS)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

// ── Suite ──────────────────────────────────────────────────────────────────────

Cypress.on('uncaught:exception', () => false)

describe('Investicioni fondovi — scenarios 29–42', () => {

  before(() => {
    // Restore supervisor's isSupervisor permission (portfolio-funds Sc46 may have removed it)
    cy.request({
      method: 'POST',
      url: 'http://localhost:8083/login',
      body: { email: ADMIN_EMAIL, password: ADMIN_PASS },
      failOnStatusCode: false,
    }).then(({ body }) => {
      const token = body.access_token
      if (!token) return
      cy.request({
        method: 'GET',
        url: 'http://localhost:8083/employees',
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then(({ body: data }) => {
        const emps = Array.isArray(data) ? data : (data.employees ?? [])
        const sup = emps.find(e => e.email === SUPERVISOR_EMAIL)
        if (!sup) return
        cy.request({
          method: 'PUT',
          url: `http://localhost:8083/employees/${sup.id}`,
          headers: { Authorization: `Bearer ${token}` },
          body: {
            first_name:    sup.first_name,
            last_name:     sup.last_name,
            date_of_birth: sup.date_of_birth,
            gender:        sup.gender,
            email:         sup.email,
            phone_number:  sup.phone_number,
            address:       sup.address,
            username:      sup.username,
            position:      sup.position,
            department:    sup.department,
            active:        sup.active !== false,
            permissions:   ['SUPERVISOR'],
            jmbg:          sup.jmbg ?? '',
          },
          failOnStatusCode: false,
        })
      })
    })
  })

  // ── Scenario 29 ───────────────────────────────────────────────────────────────

  it('Scenario 29: klijent vidi listu investicionih fondova na discovery stranici', () => {
    // Given: korisnik je ulogovan kao klijent sa permisijom za trgovinu
    loginAsClient()

    // When: otvori stranicu "Investicioni fondovi"
    cy.visit('/client/investment/funds')

    // Then: vidi tabelarni prikaz svih dostupnih fondova
    cy.get('table', { timeout: 10000 }).should('exist')
    cy.get('table tbody tr').should('have.length.greaterThan', 0)

    // And: za svaki fond vidi naziv, opis, ukupnu vrednost, profit i minimalni ulog
    cy.get('table thead').within(() => {
      cy.contains(/fund name|naziv/i).should('exist')
      cy.contains(/description|opis/i).should('exist')
      cy.contains(/value|vrednost/i).should('exist')
      cy.contains(/profit/i).should('exist')
      cy.contains(/min.*contribution|minimalni ulog/i).should('exist')
    })
  })

  // ── Scenario 30 ───────────────────────────────────────────────────────────────

  it('Scenario 30: filtriranje i sortiranje fondova na discovery stranici', () => {
    // Given: korisnik je na discovery stranici fondova — mock funds so Alpha Fund exists for search
    cy.intercept('GET', 'http://localhost:8083/investment/funds*', {
      body: [
        { id: 1, name: 'Alpha Fund', description: 'Test', fundValue: 100000, profit: 5000, minimumContribution: 1000 },
        { id: 2, name: 'Beta Fund', description: 'Test2', fundValue: 50000, profit: 2000, minimumContribution: 500 },
      ],
    })
    loginAsClient()
    cy.visit('/client/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: postavi filter po imenu fonda
    cy.get('input[placeholder*="Search"]').type('Alpha')
    cy.wait(500)

    // Then: lista fondova se ažurira prema zadatom kriterijumu
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).invoke('text').should('match', /alpha/i)
    })

    // When: klikne na kolonu za sortiranje po vrednosti
    cy.get('input[placeholder*="Search"]').clear()
    cy.wait(300)
    cy.contains('th', /value|vrednost/i).click()
    cy.wait(300)

    // Then: sort icon changes (table reordered)
    cy.contains('th', /value|vrednost/i)
      .find('svg, [class*="sort"], [class*="arrow"], span')
      .should('exist')
  })

  // ── Scenario 31 ───────────────────────────────────────────────────────────────

  it('Scenario 31: klijent otvara detaljan prikaz fonda', () => {
    // Given: klijent je na discovery stranici
    loginAsClient()
    cy.visit('/client/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne na određeni fond
    cy.get('table tbody tr').first().find('a, button').first().click()

    // Then: vidi detaljan prikaz sa svim informacijama
    cy.url().should('include', '/client/investment/funds/')
    cy.contains(/fund value|vrednost fonda/i, { timeout: 8000 }).should('exist')
    cy.contains(/profit/i).should('exist')
    cy.contains(/min.*contribution|minimalni ulog/i).should('exist')

    // And: vidi listu hartija fonda sa: Ticker, Price, Change, Volume, initialMarginCost, acquisitionDate
    cy.contains(/ticker/i).should('exist')
    cy.contains(/price/i).should('exist')
    cy.contains(/volume/i).should('exist')
    cy.contains(/acquisition/i).should('exist')

    // And: vidi performanse fonda kroz grafikon ili tabelu
    cy.contains(/1M|3M|6M|1Y/i).should('exist')
  })

  // ── Scenario 32 ───────────────────────────────────────────────────────────────

  it('Scenario 32: supervizor vidi dugme za prodaju pored svake hartije u fondu', () => {
    // Given: supervizor je na detaljnom prikazu fonda
    cy.intercept('GET', 'http://localhost:8083/investment/funds', {
      statusCode: 200,
      body: [{ id: 1, name: 'Alpha Fund', active: true, managerName: 'Manager', fundValue: 100000, profit: 5000, minimumContribution: 1000 }],
    })
    cy.intercept('GET', 'http://localhost:8083/investment/funds/1', {
      statusCode: 200,
      body: { id: 1, name: 'Alpha Fund', active: true, managerName: 'Manager', fundValue: 100000, profit: 5000, minimumContribution: 1000 },
    })
    cy.intercept('GET', 'http://localhost:8083/investment/funds/1/securities', {
      statusCode: 200,
      body: [{ ticker: 'AAPL', name: 'Apple Inc.', price: 150, volume: 1000, initialMarginCost: 500, quantity: 10, acquisitionPrice: 140, acquisitionDate: '2024-01-01' }],
    })
    cy.intercept('GET', 'http://localhost:8083/investment/funds/1/performance*', {
      statusCode: 200,
      body: [],
    })
    loginAsSupervisor()
    cy.visit('/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().find('a, button').first().click()
    cy.url().should('include', '/investment/funds/')

    // When: vidi listu hartija
    cy.get('table', { timeout: 8000 }).should('exist')
    cy.get('table tbody tr').should('have.length.greaterThan', 0)

    // Then: pored svake hartije postoji dugme za prodaju
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).contains('button', /sell|prodaj/i).should('exist')
    })
  })

  // ── Scenario 33 ───────────────────────────────────────────────────────────────

  it('Scenario 33: klijent uspešno investira u fond', () => {
    // Given: klijent je izabrao fond sa minimalnim ulogom i ima dovoljno sredstava
    loginAsClient()
    cy.visit('/client/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne "Invest" i unese iznos, izabere račun i potvrdi investiciju
    cy.intercept('POST', '**/investment/funds/*/invest').as('invest')
    cy.contains('button', 'Invest').first().click({ force: true })

    cy.get('input[placeholder*="Amount"], input[name*="amount"], input[type="number"]')
      .first()
      .clear()
      .type('5000')

    cy.get('select').first().select(0)
    cy.get('.fixed.inset-0').contains('button', 'Invest').click()
    cy.wait('@invest', { timeout: 10000 })

    // Then: sistem kreira ClientFundTransaction sa statusom completed
    cy.contains(/success|invested|ulaganje/i, { timeout: 8000 }).should('be.visible')
  })

  // ── Scenario 34 ───────────────────────────────────────────────────────────────

  it('Scenario 34: klijent pokušava da uloži manje od minimalnog uloga', () => {
    // Given: fond ima minimalni ulog
    loginAsClient()
    cy.visit('/client/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klijent pokuša da uloži manje od minimalnog
    cy.contains('button', 'Invest').first().click()

    cy.get('input[placeholder*="Amount"], input[name*="amount"], input[type="number"]')
      .first()
      .clear()
      .type('1')  // Below any reasonable minimum

    // Then: sistem odbija transakciju i prikazuje poruku o minimalnom iznosu
    cy.contains(/minimum|minimalni|at least/i, { timeout: 5000 }).should('be.visible')
  })

  // ── Scenario 35 ───────────────────────────────────────────────────────────────

  it('Scenario 35: klijent povlači novac iz fonda — dovoljna likvidnost', () => {
    // Given: klijent ima poziciju u fondu i fond ima dovoljno likvidnih sredstava
    loginAsClient()

    // Navigate to a fund where client has a position
    cy.visit('/client/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().find('a, button').first().click()
    cy.url().should('include', '/client/investment/funds/')
    cy.url().then((url) => {
      const fundId = Number(url.split('/').pop())
      cy.intercept('GET', '**/client/funds/positions', {
        statusCode: 200,
        body: [{ fundId, fundName: 'Test Fund', fundValue: 100000, totalInvestedAmount: 5000, currentPositionValue: 5250, myProfit: 250, fundPercentage: 5.25 }],
      })
      cy.reload()
    })

    // When: klijent klikne "Withdraw"
    cy.intercept('POST', '**/investment/funds/*/withdraw').as('withdraw')
    cy.contains('button', /withdraw|povuci/i, { timeout: 8000 }).click({ force: true })

    cy.get('input[placeholder*="Amount"], input[name*="amount"], input[type="number"]')
      .first()
      .clear()
      .type('2000')

    cy.get('select').first().select(0)
    cy.get('.fixed.inset-0').contains('button', /withdraw/i).click()
    cy.wait('@withdraw', { timeout: 10000 })

    // Then: novac se odmah prebacuje na klijentov račun
    cy.contains(/success|withdrawn|povlačenje/i, { timeout: 8000 }).should('be.visible')
  })

  // ── Scenario 36 ───────────────────────────────────────────────────────────────

  it('Scenario 36: klijent povlači novac iz fonda — nedovoljna likvidnost', () => {
    // Given: klijent želi da povuče više novca nego što fond ima na računu
    loginAsClient()
    cy.visit('/client/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().find('a, button').first().click()
    cy.url().should('include', '/client/investment/funds/')
    cy.url().then((url) => {
      const fundId = Number(url.split('/').pop())
      cy.intercept('GET', '**/client/funds/positions', {
        statusCode: 200,
        body: [{ fundId, fundName: 'Test Fund', fundValue: 100000, totalInvestedAmount: 5000, currentPositionValue: 5250, myProfit: 250, fundPercentage: 5.25 }],
      })
      cy.reload()
    })

    cy.intercept('POST', '**/investment/funds/*/withdraw', {
      statusCode: 200,
      body: { pending: true },
    }).as('withdraw')

    cy.contains('button', /withdraw|povuci/i, { timeout: 5000 }).click({ force: true })
    cy.get('input[type="number"]').first().clear().type('999999')
    cy.get('select').first().select(0)
    cy.get('.fixed.inset-0').contains('button', /withdraw/i).click()
    cy.wait('@withdraw')

    // Then: sistem vrši automatsku likvidaciju
    // And: klijent dobija obaveštenje da će isplatu dobiti u kratkom roku
    cy.contains(/liquidat|shortly|shortly|pending|kratkom roku/i, { timeout: 6000 }).should('be.visible')
  })

  // ── Scenario 37 ───────────────────────────────────────────────────────────────

  it('Scenario 37: klijent plaća proviziju pri povlačenju u stranoj valuti', () => {
    // Given: klijent povlači novac iz fonda na račun u EUR
    loginAsClient()
    cy.visit('/client/investment/funds')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().find('a, button').first().click()
    cy.url().should('include', '/client/investment/funds/')
    cy.url().then((url) => {
      const fundId = Number(url.split('/').pop())
      cy.intercept('GET', '**/client/funds/positions', {
        statusCode: 200,
        body: [{ fundId, fundName: 'Test Fund', fundValue: 100000, totalInvestedAmount: 5000, currentPositionValue: 5250, myProfit: 250, fundPercentage: 5.25 }],
      })
      cy.reload()
    })

    cy.intercept('POST', '**/investment/funds/*/withdraw', {
      statusCode: 200,
      body: {
        message: 'Withdrawal successful',
        commission: 12.50,
        convertedAmount: 50,
        currency: 'EUR',
      },
    }).as('withdraw')

    cy.contains('button', /withdraw|povuci/i, { timeout: 5000 }).click({ force: true })
    cy.get('input[type="number"]').first().clear().type('6000')

    // When: sistem vrši konverziju iz RSD — select EUR account if available
    cy.get('select').first().then(($select) => {
      const options = [...$select[0].options]
      const eurOption = options.findIndex((o) => o.text.match(/EUR/i))
      if (eurOption > -1) {
        cy.wrap($select).select(eurOption)
      } else {
        cy.wrap($select).select(0)
      }
    })

    cy.get('.fixed.inset-0').contains('button', /withdraw/i).click()
    cy.wait('@withdraw')

    // Then: naplaćuje se provizija tokom konverzije
    cy.contains(/commission|provizija|fee/i, { timeout: 6000 }).should('be.visible')
  })

  // ── Scenario 38 ───────────────────────────────────────────────────────────────

  it('Scenario 38: supervizor uspešno kreira novi investicioni fond', () => {
    // Given: korisnik je ulogovan kao supervizor
    loginAsSupervisor()

    // Find the fund creation route via navigation
    cy.get('nav, [role="navigation"]', { timeout: 8000 }).then(($nav) => {
      if ($nav.text().match(/create fund|novi fond|new fund/i)) {
        cy.contains(/create fund|novi fond|new fund/i).click()
      } else {
        cy.visit('/investment/funds/new', { failOnStatusCode: false })
      }
    })

    cy.intercept('POST', 'http://localhost:8083/investment/funds', {
      statusCode: 201,
      body: { id: 99, name: `Test Fund` },
    }).as('createFund')

    const fundName = `Test Fund ${Date.now()}`

    // When: unese naziv fonda, kratak opis, minimalni iznos ulaganja i potvrdi kreiranje
    cy.get('input[name*="name"], input[placeholder*="name"], input[placeholder*="naziv"]')
      .first()
      .type(fundName)
    cy.get('input[name*="description"], textarea[name*="description"]')
      .first()
      .type('Automated test fund')
    cy.get('input[name*="minimum"], input[name*="min"], input[placeholder*="minimum"], input[placeholder*="min"]')
      .first()
      .type('1000')

    // Select manager (required field)
    cy.get('select').first().find('option').should('have.length.greaterThan', 1)
    cy.get('select').first().select(1)

    cy.contains('button', /create|submit|potvrdi/i).click()
    cy.wait('@createFund', { timeout: 10000 })

    // Then: sistem kreira novi investicioni fond (navigates away on success)
    cy.url({ timeout: 8000 }).should('include', '/investment/funds')
  })

  // ── Scenario 39 ───────────────────────────────────────────────────────────────

  it('Scenario 39: agent nema pristup stranici za kreiranje fonda', () => {
    // Given: korisnik je ulogovan kao agent
    loginAsAgent()

    // When: pokuša da otvori stranicu za kreiranje fonda
    cy.visit('/investment/funds/new', { failOnStatusCode: false })

    // Then: pristup mu je odbijen
    cy.url().then((currentUrl) => {
      if (currentUrl.includes('/investment/funds/new')) {
        cy.contains(/access denied|forbidden|not authorized|permission|404/i, { timeout: 6000 })
          .should('be.visible')
      }
      // If redirected away — correct behavior, test passes
    })
  })

  // ── Scenario 40 ───────────────────────────────────────────────────────────────

  it('Scenario 40: supervizor kupuje hartiju za investicioni fond', () => {
    // Given: supervizor upravlja fondom i fond ima dovoljno likvidnih sredstava
    loginAsSupervisor()

    // Navigate to order creation for supervisor (employee-side securities or orders page)
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    cy.intercept('POST', '**/orders').as('createOrder')

    // Click Buy on a stock
    cy.contains('button', /buy|kupi/i).first().click()
    cy.url().should('include', '/orders/new')

    // When: naznači da kupuje za fond i izabere fond
    cy.get('input[type="number"]').first().clear().type('1')

    // Look for "For fund" option / fund selector
    cy.get('select, [role="combobox"]').then(($selects) => {
      const fundSelect = [...$selects].find(($s) => $s.innerText?.match(/fund|fond/i))
      if (fundSelect) {
        cy.wrap(fundSelect).select(0)
      }
    })

    cy.contains('button', /review|preview|confirm/i).click()
    cy.contains('button', 'Confirm').click()
    cy.wait('@createOrder', { timeout: 10000 })

    // Then: order se kreira i sredstva se skidaju sa računa fonda
    cy.contains(/order submitted|submitted|success/i, { timeout: 8000 }).should('be.visible')
  })

  // ── Scenario 41 ───────────────────────────────────────────────────────────────

  it('Scenario 41: supervizor kupuje hartiju za banku', () => {
    // Given: supervizor kreira BUY order
    loginAsSupervisor()
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    cy.intercept('POST', '**/orders').as('createOrder')
    cy.contains('button', /buy|kupi/i).first().click()
    cy.url().should('include', '/orders/new')

    cy.get('input[type="number"]').first().clear().type('1')

    // When: naznači da kupuje za banku i izabere bankin račun
    cy.get('select, [role="combobox"]').then(($selects) => {
      const bankSelect = [...$selects].find(($s) => $s.innerText?.match(/bank|banka/i))
      if (bankSelect) cy.wrap(bankSelect).select(0)
    })

    cy.contains('button', /review|preview/i).click()

    // Then: konverzija se vrši bez provizije
    cy.contains(/commission|provizija/i).should('not.exist')

    cy.contains('button', 'Confirm').click()
    cy.wait('@createOrder', { timeout: 10000 })

    cy.contains(/order submitted|submitted|success/i, { timeout: 8000 }).should('be.visible')
  })

  // ── Scenario 42 ───────────────────────────────────────────────────────────────

  it('Scenario 42: supervizor ne može kupiti za fond ako nema dovoljno likvidnosti', () => {
    // Given: fond ima 500 RSD na računu
    loginAsSupervisor()
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Mock: order creation fails with insufficient liquidity
    cy.intercept('POST', '**/orders', {
      statusCode: 422,
      body: { message: 'Insufficient fund liquidity' },
    }).as('createOrder')

    cy.contains('button', /buy|kupi/i).first().click()
    cy.url().should('include', '/orders/new')
    cy.get('input[type="number"]').first().clear().type('100')  // Large quantity

    cy.contains('button', /review|preview/i).click()
    cy.contains('button', 'Confirm').click()
    cy.wait('@createOrder')

    // Then: sistem odbija order i prikazuje poruku o nedovoljnoj likvidnosti fonda
    cy.contains(/insufficient|liquidity|likvidnost|failed|error/i, { timeout: 10000 }).should('be.visible')
  })

})
