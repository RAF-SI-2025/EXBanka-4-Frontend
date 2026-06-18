/**
 * Feature: Portal OTC Ponude i Ugovori
 * Scenarios: 23–28
 */

const CLIENT_EMAIL = 'dunja@banka.rs'
const CLIENT_PASS  = 'taraDunjic123'

function loginAsClient() {
  cy.visit('/client/login')
  cy.get('input[name="email"]').type(CLIENT_EMAIL)
  cy.get('input[name="password"]').type(CLIENT_PASS)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/client/login')
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Portal OTC Ponude i Ugovori — scenarios 23–28', () => {

  // ── Scenario 23 ───────────────────────────────────────────────────────────────

  it('Scenario 23: stranica Aktivne ponude prikazuje sve aktivne pregovore', () => {
    // Given: korisnik ima aktivne pregovore
    loginAsClient()

    // When: otvori stranicu "Aktivne ponude"
    cy.visit('/client/otc/negotiations')

    // Then: vidi listu svih svojih aktivnih pregovora
    cy.get('table', { timeout: 10000 }).should('exist')
    cy.get('table tbody tr').should('have.length.greaterThan', 0)

    // And: za svaki pregovor vidi: s kim pregovara, akciju, količinu, cenu i settlementDate
    cy.get('table thead').within(() => {
      cy.contains(/ticker|symbol|action/i).should('exist')
      cy.contains(/amount|quantity|količina/i).should('exist')
      cy.contains(/price|cena/i).should('exist')
      cy.contains(/settlement/i).should('exist')
    })
  })

  // ── Scenario 24 ───────────────────────────────────────────────────────────────

  it('Scenario 24: vizualizacija odstupanja u ponudama bojama', () => {
    // Given: postoje ponude sa različitim odstupanjima cene
    loginAsClient()

    // Intercept securities listings to provide market prices for color calculation
    cy.intercept('GET', 'http://localhost:8083/securities*', (req) => {
      const url = new URL(req.url)
      const ticker = url.searchParams.get('ticker') || ''
      req.reply({ statusCode: 200, body: { items: [{ ticker, price: 100 }] } })
    })

    cy.intercept('GET', 'http://localhost:8083/otc/negotiations', {
      statusCode: 200,
      body: [
        // 3% deviation — emerald (≤5%)
        {
          id: 'neg-1',
          ticker: 'AAPL',
          amount: 10,
          pricePerStock: 103,
          settlementDate: '2026-12-01',
          premium: 0,
          lastModified: new Date().toISOString(),
          status: 'ACTIVE',
          initiatedByMe: true,
        },
        // 12% deviation — amber (5-20%)
        {
          id: 'neg-2',
          ticker: 'MSFT',
          amount: 5,
          pricePerStock: 88,
          settlementDate: '2026-12-01',
          premium: 0,
          lastModified: new Date().toISOString(),
          status: 'ACTIVE',
          initiatedByMe: false,
        },
        // 25% deviation — red (>20%)
        {
          id: 'neg-3',
          ticker: 'GOOG',
          amount: 3,
          pricePerStock: 75,
          settlementDate: '2026-12-01',
          premium: 0,
          lastModified: new Date().toISOString(),
          status: 'ACTIVE',
          initiatedByMe: true,
        },
      ],
    }).as('getNegotiations')

    // When: korisnik vidi ponude na stranici Aktivne ponude
    cy.visit('/client/otc/negotiations')
    cy.wait('@getNegotiations')

    // Then: ponude sa različitim odstupanjima su obojene odgovarajućim bojama
    cy.get('table tbody tr').should('have.length', 3)

    // Assert color indicators exist (the UI applies color classes based on deviation)
    cy.get('table tbody tr').eq(0).find('[class*="emerald"]')
      .should('exist')
    cy.get('table tbody tr').eq(1).find('[class*="amber"]')
      .should('exist')
    cy.get('table tbody tr').eq(2).find('[class*="red"]')
      .should('exist')
  })

  // ── Scenario 25 ───────────────────────────────────────────────────────────────

  it('Scenario 25: filtriranje sklopljenih ugovora po statusu "važeći"', () => {
    // Given: korisnik je na stranici Sklopljeni ugovori
    loginAsClient()
    cy.intercept('GET', 'http://localhost:8083/otc/contracts*', {
      statusCode: 200,
      body: [{ id: 1, ticker: 'AAPL', amount: 5, strikePrice: 180, premium: 500, settlementDate: '2027-12-01', status: 'ACTIVE', seller: 'Test Seller' }],
    }).as('getContracts')
    cy.visit('/client/otc/contracts')

    // When: filtrira po statusu "važeći"
    cy.contains(/valid|važeći/i, { timeout: 8000 }).click()

    // Then: vidi samo ugovore čiji settlementDate nije prošao
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    // And: za svaki važeći ugovor postoji dugme "Iskoristi"
    cy.get('table tbody tr').each(($row) => {
      cy.wrap($row).contains('button', /exercise|iskoristi/i).should('exist')
    })
  })

  // ── Scenario 26 ───────────────────────────────────────────────────────────────

  it('Scenario 26: iskorišćavanje važećeg opcionog ugovora po SAGA patternu', () => {
    // Given: kupac ima važeći opcioni ugovor (settlementDate nije prošao)
    loginAsClient()
    cy.intercept('GET', 'http://localhost:8083/otc/contracts*', {
      statusCode: 200,
      body: [{ id: 1, ticker: 'AAPL', amount: 5, strikePrice: 180, premium: 500, settlementDate: '2027-12-01', status: 'ACTIVE', seller: 'Test Seller' }],
    }).as('getContracts')
    cy.visit('/client/otc/contracts')
    cy.contains(/valid|važeći/i, { timeout: 8000 }).click()
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    // When: klikne na "Iskoristi"
    cy.intercept('POST', '**/otc/contracts/*/exercise').as('exerciseContract')
    cy.get('table tbody tr').first().contains('button', /exercise|iskoristi/i).click()

    // Then: modal "Exercise Contract" prikazuje detalje
    cy.contains(/exercise contract|iskoristi ugovor/i, { timeout: 5000 }).should('be.visible')
    cy.contains(/ticker|stock/i).should('exist')
    cy.contains(/amount|količina/i).should('exist')
    cy.contains(/strike price/i).should('exist')
    cy.contains(/premium/i).should('exist')
    cy.contains(/total/i).should('exist')

    cy.contains('button', /confirm exercise|potvrdi/i).click()
    cy.wait('@exerciseContract', { timeout: 10000 })

    // And: kupac kupuje akcije po dogovorenom strike price-u
    // And: sistem prikazuje profit ako je opcija in-the-money
    cy.contains(/success|exercise|iskorišćen|profit/i, { timeout: 8000 }).should('be.visible')
  })

  // ── Scenario 27 ───────────────────────────────────────────────────────────────

  it('Scenario 27: pokušaj iskorišćavanja isteklog opcionog ugovora', () => {
    // Given: opcioni ugovor ima settlementDate koji je prošao
    loginAsClient()
    cy.visit('/client/otc/contracts')

    // When: korisnik otvori tab sa isteklim ugovorima
    cy.contains(/expired|istekli/i, { timeout: 8000 }).click()
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    // Then: dugme "Iskoristi" nije dostupno
    cy.get('table tbody tr').first().within(() => {
      cy.contains('button', /exercise|iskoristi/i).should('not.exist')
    })

    // And: ugovor je vidljiv samo radi evidencije
    cy.get('table tbody tr').first().should('be.visible')
  })

  // ── Scenario 28 ───────────────────────────────────────────────────────────────

  it('Scenario 28: kupac ne iskorišćava opciju — gubi samo premiju', () => {
    // Given: opcioni ugovor ima settlementDate koji je prošao, nije iskorišćen
    loginAsClient()

    cy.intercept('GET', 'http://localhost:8083/otc/contracts*', (req) => {
      const url = req.url
      if (url.includes('EXPIRED') || url.includes('expired')) {
        req.reply({
          statusCode: 200,
          body: [{
            id: 'expired-contract-1',
            ticker: 'AAPL',
            amount: 5,
            strikePrice: 200,
            premium: 500,
            settlementDate: '2025-01-01',  // past date
            status: 'EXPIRED',
            seller: 'Seller Name',
            profit: -500,
          }],
        })
      } else {
        req.reply({ statusCode: 200, body: [] })
      }
    }).as('getContracts')

    cy.visit('/client/otc/contracts')
    cy.contains(/expired|istekli/i, { timeout: 8000 }).click()
    cy.wait('@getContracts')

    // Then: dugme "Iskoristi" nije dostupno
    cy.get('table tbody tr', { timeout: 6000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().within(() => {
      cy.contains('button', /exercise|iskoristi/i).should('not.exist')
    })

    // And: ugovor je vidljiv samo radi evidencije
    // And: kupac gubi samo iznos plaćene premije (shown as negative profit)
    cy.get('table tbody tr').first().contains(/expired|istekao|-500/i).should('exist')

    // And: ugovor dobija status isteklog
    cy.get('table tbody tr').first().contains(/expired|istekao/i).should('exist')
  })

})
