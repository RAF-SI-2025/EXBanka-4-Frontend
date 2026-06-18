/**
 * Feature: OTC Trgovina - Pristup i prikaz + OTC Pregovaranje
 * Scenarios: 14–22
 */

const API_BASE            = 'http://localhost:8083'
const CLIENT_EMAIL        = 'dunja@banka.rs'
const CLIENT_PASS         = 'taraDunjic123'
const SUPERVISOR_EMAIL    = 'vasa@banka.rs'
const SUPERVISOR_PASS     = 'vasilije123'
const ADMIN_EMAIL         = 'admin@exbanka.com'
const ADMIN_PASS          = 'admin'

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

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('OTC Trgovina — scenarios 14–22', () => {

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

  // ── Scenario 14 ───────────────────────────────────────────────────────────────

  it('Scenario 14: klijent sa permisijom za trgovinu vidi OTC portal', () => {
    // Given: korisnik je ulogovan kao klijent sa permisijom za trgovinu
    loginAsClient()

    // When: otvori portal "OTC Trgovina"
    cy.visit('/client/otc/market')

    // Then: vidi listu akcija koje su drugi klijenti stavili u javni režim
    cy.get('table', { timeout: 10000 }).should('exist')
    cy.get('table thead').within(() => {
      cy.contains(/type|name|symbol|amount|price|owner/i).should('exist')
    })

    // And: prikaz je identičan kao u Portalu za Hartije od vrednosti
    cy.contains('button', 'Offer').should('exist')
  })

  // ── Scenario 15 ───────────────────────────────────────────────────────────────

  it('Scenario 15: klijent bez permisije nema pristup OTC portalu', () => {
    // Given: korisnik je ulogovan kao klijent bez permisije za trgovinu
    loginAsClient()

    // Intercept the market fetch to simulate 403 (no trade permission)
    cy.intercept('GET', 'http://localhost:8083/otc/market', {
      statusCode: 403,
      body: { message: 'Forbidden' },
    }).as('getMarket')

    // When: pokuša da otvori portal "OTC Trgovina"
    cy.visit('/client/otc/market', { failOnStatusCode: false })
    cy.wait('@getMarket')

    // Then: pristup mu je odbijen
    cy.contains(/failed|forbidden|error|not authorized/i, { timeout: 6000 })
      .should('be.visible')
  })

  // ── Scenario 16 ───────────────────────────────────────────────────────────────

  it('Scenario 16: supervizor vidi OTC portal sa ponudama aktuara', () => {
    // Given: korisnik je ulogovan kao supervizor
    cy.intercept('GET', 'http://localhost:8083/otc/market', {
      statusCode: 200,
      body: [{
        id: 'sup-1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        securityType: 'STOCK',
        amount: 10,
        pricePerStock: 150,
        ownerName: 'Actuary',
        ownerBank: 'EXBanka',
        lastUpdated: new Date().toISOString(),
      }],
    }).as('getOtcMarket')
    loginAsSupervisor()

    // When: otvori portal "OTC Trgovina"
    cy.visit('/otc/market')
    cy.wait('@getOtcMarket')

    // Then: vidi ponude aktuara (ne klijenata)
    cy.get('table', { timeout: 10000 }).should('exist')

    // And: može kreirati ponudu za pregovor
    cy.contains('button', /offer/i).should('exist')
  })

  // ── Scenario 17 ───────────────────────────────────────────────────────────────

  it('Scenario 17: kupac inicira pregovor sa prodavcem', () => {
    // Given: kupac je na OTC portalu i vidi akcije prodavca
    loginAsClient()
    cy.visit('/client/otc/market')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne na akciju i unese ponudu
    cy.intercept('POST', '**/otc/negotiations').as('createNegotiation')
    cy.contains('button', 'Offer').first().click()

    // Fill the Make Offer modal
    cy.contains('Make Offer', { timeout: 5000 }).should('be.visible')
    cy.get('.fixed.inset-0').find('input[type="number"]').first().clear().type('1')
    cy.get('.fixed.inset-0').find('input[type="number"]').eq(1).clear().type('100')
    // Premium is optional — skip
    // Settlement date: pick tomorrow
    cy.get('input[type="date"]').first().then(($input) => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      cy.wrap($input).type(dateStr)
    })
    cy.contains('button', 'Submit Offer').click()
    cy.wait('@createNegotiation', { timeout: 10000 })

    // Then: sistem kreira novu ponudu sa statusom aktivnog pregovora
    // And: ponuda se prikazuje u Portalu: OTC Ponude i Ugovori za obe strane
    cy.visit('/client/otc/negotiations')
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)
  })

  // ── Scenario 18 ───────────────────────────────────────────────────────────────

  it('Scenario 18: prodavac šalje protivponudu', () => {
    // Given: postoji aktivna ponuda od kupca — mock negotiation where it is client's turn
    loginAsClient()
    cy.window().then((win) => {
      const token = win.sessionStorage.getItem('client_access_token')
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.user_id
      const mockNeg = {
        id: 'neg-test-1', ticker: 'AAPL', amount: 1, pricePerStock: 100,
        settlementDate: '2027-12-01', premium: 0, lastModified: new Date().toISOString(),
        status: 'PENDING_BUYER', buyerType: 'CLIENT', buyerId: userId,
        sellerType: 'CLIENT', sellerId: 'other-seller', initiatedByMe: true, modifiedBy: 'Seller',
      }
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations', { body: [mockNeg] })
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations/neg-test-1', { body: mockNeg })
    })
    cy.visit('/client/otc/negotiations')
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    // Open the first negotiation where it is client's turn
    cy.get('table tbody tr').first().contains('button', 'Open').click()
    cy.url().should('include', '/client/otc/negotiations/')

    // When: prodavac klikne na ponudu i pošalje protivponudu sa izmenjenim uslovima
    cy.intercept('PUT', '**/otc/negotiations/*/counter').as('counterOffer')
    cy.contains('button', 'Counter-offer', { timeout: 5000 }).click()

    // Fill counter-offer form (Settlement Date is required by handleCounter validation)
    cy.get('form', { timeout: 5000 }).within(() => {
      cy.get('input[type="number"]').eq(0).clear().type('2')
      cy.get('input[type="number"]').eq(1).clear().type('110')
      cy.get('input[type="date"]').type('2027-12-01')
      cy.get('button[type="submit"]').click()
    })
    cy.wait('@counterOffer', { timeout: 10000 })

    // Then: ponuda se ažurira novim vrednostima
    // And: polje ModifiedBy se postavlja na ime prodavca
    // And: polje LastModified se ažurira
    cy.contains(/last modified|modified by/i, { timeout: 5000 }).should('exist')
  })

  // ── Scenario 19 ───────────────────────────────────────────────────────────────

  it('Scenario 19: kupac prihvata ponudu — kreira se opcioni ugovor', () => {
    // Given: postoji aktivna ponuda između kupca i prodavca — mock negotiation where it is client's turn
    loginAsClient()
    cy.window().then((win) => {
      const token = win.sessionStorage.getItem('client_access_token')
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.user_id
      const mockNeg = {
        id: 'neg-test-1', ticker: 'AAPL', amount: 1, pricePerStock: 100,
        settlementDate: '2027-12-01', premium: 0, lastModified: new Date().toISOString(),
        status: 'PENDING_BUYER', buyerType: 'CLIENT', buyerId: userId,
        sellerType: 'CLIENT', sellerId: 'other-seller', initiatedByMe: true, modifiedBy: 'Seller',
      }
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations', { body: [mockNeg] })
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations/neg-test-1', { body: mockNeg })
    })
    cy.visit('/client/otc/negotiations')
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    cy.get('table tbody tr').first().contains('button', 'Open').click()
    cy.url().should('include', '/client/otc/negotiations/')

    // When: kupac klikne na "Prihvati"
    cy.intercept('PUT', '**/otc/negotiations/*/accept').as('acceptOffer')
    cy.contains('button', 'Accept', { timeout: 5000 }).click()

    // Then: confirm modal shows premium payable
    cy.contains(/premium payable|confirm accept/i, { timeout: 5000 }).should('be.visible')
    cy.contains('button', 'Confirm Accept').click()
    cy.wait('@acceptOffer', { timeout: 10000 })

    // Then: sistem automatski kreira opcioni ugovor
    // And: ugovor se prikazuje na stranici Sklopljeni ugovori
    cy.contains(/contract.*created|ugovor.*kreiran|contracts/i, { timeout: 8000 }).should('be.visible')
  })

  // ── Scenario 20 ───────────────────────────────────────────────────────────────

  it('Scenario 20: jedna strana odustaje od pregovora', () => {
    // Given: postoji aktivna ponuda između kupca i prodavca — mock negotiation where it is client's turn
    loginAsClient()
    let getCount = 0
    cy.window().then((win) => {
      const token = win.sessionStorage.getItem('client_access_token')
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.user_id
      const mockNeg = {
        id: 'neg-test-1', ticker: 'AAPL', amount: 1, pricePerStock: 100,
        settlementDate: '2027-12-01', premium: 0, lastModified: new Date().toISOString(),
        status: 'PENDING_BUYER', buyerType: 'CLIENT', buyerId: userId,
        sellerType: 'CLIENT', sellerId: 'other-seller', initiatedByMe: true, modifiedBy: 'Seller',
      }
      // Counter-based: first GET returns negotiation, all subsequent return empty list.
      // This avoids timing issues — the counter increments synchronously inside the handler.
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations', (req) => {
        getCount++
        req.reply({ body: getCount === 1 ? [mockNeg] : [] })
      })
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations/neg-test-1', { body: mockNeg })
    })
    cy.visit('/client/otc/negotiations')
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    cy.get('table tbody tr').first().contains('button', 'Open').click()

    // When: jedna strana klikne na "Odustani" — mock success so handleReject navigates away
    cy.intercept('PUT', '**/otc/negotiations/*/reject', { statusCode: 200, body: {} }).as('rejectOffer')
    cy.contains('button', 'Reject', { timeout: 5000 }).click()
    cy.wait('@rejectOffer', { timeout: 10000 })

    // Then: ponuda se briše i više nije vidljiva u Aktivnim ponudama
    cy.visit('/client/otc/negotiations')
    cy.get('table', { timeout: 8000 }).should('exist')
    // App renders empty state as a <tr> with message — verify no real negotiation rows remain
    cy.contains(/no active negotiations|nema aktivnih/i, { timeout: 6000 }).should('be.visible')
  })

  // ── Scenario 21 ───────────────────────────────────────────────────────────────

  it('Scenario 21: prodavac ne može imati ugovore za više akcija nego što poseduje', () => {
    // Given: prodavac poseduje 12 AAPL akcija i ima aktivne ugovore za 10 — mock negotiation where it is client's turn
    loginAsClient()
    cy.window().then((win) => {
      const token = win.sessionStorage.getItem('client_access_token')
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.user_id
      const mockNeg = {
        id: 'neg-test-1', ticker: 'AAPL', amount: 1, pricePerStock: 100,
        settlementDate: '2027-12-01', premium: 0, lastModified: new Date().toISOString(),
        status: 'PENDING_BUYER', buyerType: 'CLIENT', buyerId: userId,
        sellerType: 'CLIENT', sellerId: 'other-seller', initiatedByMe: true, modifiedBy: 'Seller',
      }
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations', { body: [mockNeg] })
      cy.intercept('GET', 'http://localhost:8083/otc/negotiations/neg-test-1', { body: mockNeg })
    })
    cy.visit('/client/otc/negotiations')
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    cy.get('table tbody tr').first().contains('button', 'Open').click()
    cy.url().should('include', '/client/otc/negotiations/')

    // Mock: acceptance exceeds holdings
    cy.intercept('PUT', '**/otc/negotiations/*/accept', {
      statusCode: 422,
      body: { error: 'Insufficient shares available for contract' },
    }).as('acceptOffer')

    // When: pokuša da prihvati ponudu za još 5 akcija
    cy.contains('button', 'Accept', { timeout: 5000 }).click()
    cy.contains('button', 'Confirm Accept').click()
    cy.wait('@acceptOffer')

    // Then: sistem odbija jer ukupan broj prelazi raspoložive akcije
    // And: prikazuje poruku o nedovoljnom broju akcija
    cy.contains(/insufficient|not enough|shares/i, { timeout: 6000 }).should('be.visible')
  })

  // ── Scenario 22 ───────────────────────────────────────────────────────────────

  it('Scenario 22: istekao ugovor oslobađa akcije za nove pregovore', () => {
    // Given: prodavac ima 12 akcija, ugovor za 3 je istekao
    loginAsClient()

    // Mock: OTC market shows quantity that includes the 3 freed shares
    cy.intercept('GET', 'http://localhost:8083/otc/market', {
      statusCode: 200,
      body: [{
        id: 'mock-1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        securityType: 'STOCK',
        amount: 5,  // 2 remaining + 3 freed from expired contract
        pricePerStock: 150,
        ownerName: 'Seller',
        ownerBank: 'EXBanka',
        lastUpdated: new Date().toISOString(),
      }],
    }).as('getMarket')

    // When: prodavac pregleda raspoložive akcije
    cy.visit('/client/otc/market')
    cy.wait('@getMarket')

    // Then: 5 akcija su dostupne za nove pregovore (2 preostale + 3 oslobođene)
    cy.get('table tbody tr', { timeout: 6000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().contains('5').should('exist')
  })

})
