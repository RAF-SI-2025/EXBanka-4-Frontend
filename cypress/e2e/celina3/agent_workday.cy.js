/**
 * Feature: Agent Work Day
 * A full work day simulation for a bank agent — 12 parts
 */

const VASILIJE_EMAIL    = 'vasa@banka.rs'
const VASILIJE_PASSWORD = 'vasilije123'

const DENIS_EMAIL    = 'elezovic@banka.rs'
const DENIS_PASSWORD = 'denis123'

const API_BASE = 'http://localhost:8083'

describe('Agent Work Day', () => {

  // ── Part 1 ──────────────────────────────────────────────────────────────────

  it('Part 1: Vasilije logs in, opens Actuaries page and sets Denis Elezovic\'s limit to 200.000 RSD', () => {
    // Login as Vasilije
    cy.visit('/login')
    cy.get('input[name="email"]').type(VASILIJE_EMAIL)
    cy.get('input[name="password"]').type(VASILIJE_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Navigate to Actuaries page
    cy.visit('/admin/actuaries')
    cy.contains('h1', 'Actuaries').should('be.visible')

    // Filter by last name to find Denis Elezovic
    cy.get('input[name="lastName"]').type('Elezovic')
    cy.get('tbody tr').should('have.length', 1)
    cy.get('tbody tr').should('contain.text', 'Denis Elezovic')

    // Click "Set limit" on Denis's row
    cy.get('tbody tr').contains('td', 'Denis Elezovic')
      .closest('tr')
      .within(() => {
        cy.contains('Set limit').click()
        cy.get('input[type="number"]').clear().type('200000')
        cy.contains('Save').click()
      })

    // Verify the new limit is displayed
    // (filter is still active so only Denis's row is shown)
    cy.get('tbody tr').first().should('contain.text', '200.000,00 RSD0,00 RSD')
  })

  // ── Part 2 ──────────────────────────────────────────────────────────────────

  it('Part 2: Denis logs in, searches MSFT, opens detail page, views options and verifies ITM/OTM coloring', () => {
    // Login as Denis
    cy.visit('/login')
    cy.get('input[name="email"]').type(DENIS_EMAIL)
    cy.get('input[name="password"]').type(DENIS_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Open securities page and search for MSFT
    cy.visit('/securities')
    cy.get('input[placeholder="Search by ticker or name…"]').type('MSFT')

    // Click on the MSFT ticker link to open the detail page
    cy.contains('button', 'MSFT').click()
    cy.url().should('match', /\/securities\/\d+$/)

    // Scroll down to Stock Details section and click View Options link
    cy.contains('Stock Details').scrollIntoView()
    cy.contains('a', 'View Options').click()
    cy.url().should('include', '/options')

    // The options page first shows a Settlement Dates table — click the first row's "View options →"
    cy.contains('Settlement Dates').should('be.visible')
    cy.contains('td', 'View options →').first().click()

    // Options chain table is now visible
    cy.contains('th', 'Calls').should('be.visible')

    // Verify In-The-Money rows are colored green (bg-emerald-50/60 on the call or put td)
    cy.get('td[colspan="5"][class*="bg-emerald-50"]').should('exist')

    // Verify Out-Of-The-Money rows also exist (td[colspan="5"] without that class)
    cy.get('td[colspan="5"]').then(($tds) => {
      const otmCount = [...$tds].filter(td => !td.className.includes('bg-emerald-50')).length
      expect(otmCount).to.be.greaterThan(0)
    })
  })

  // ── Part 3 ──────────────────────────────────────────────────────────────────

  it('Part 3: Denis creates a BUY Market order for MSFT with quantity 10', () => {
    // Login as Denis
    cy.visit('/login')
    cy.get('input[name="email"]').type(DENIS_EMAIL)
    cy.get('input[name="password"]').type(DENIS_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Search for MSFT and click Buy
    cy.visit('/securities')
    cy.get('input[placeholder="Search by ticker or name…"]').type('MSFT')
    cy.contains('tr', 'MSFT').contains('button', 'Buy').click()
    cy.url().should('include', '/orders/new')
    cy.url().should('include', 'ticker=MSFT')

    // Verify the order form loaded for MSFT
    cy.contains('h1', 'Buy MSFT').should('be.visible')

    // Verify the market price note is displayed
    cy.contains('If you leave limit/stop fields empty, market price is taken into account.').should('be.visible')

    // Enter quantity 10, leave limit and stop empty
    cy.get('input[type="number"][min="1"]').clear().type('10')
    cy.get('input[placeholder="Leave empty for market price"]').each(($input) => {
      expect($input.val()).to.equal('')
    })

    // Select the USD account
    cy.get('select.input-field').then(($select) => {
      const usdOption = [...$select[0].options].find(o => o.text.includes('USD'))
      expect(usdOption, 'USD account must exist').to.exist
      cy.get('select.input-field').select(usdOption.value)
    })

    // Verify the order type is displayed as Market Order
    cy.contains('Order Type').siblings().contains('Market Order').should('exist')

    // Intercept the order creation API call
    cy.intercept('POST', '**/orders').as('createOrder')

    // Click Review Order and verify the confirmation dialog
    cy.contains('button', 'Review Order').click()
    cy.contains('Confirm Order').should('be.visible')
    cy.contains('BUY MSFT').should('be.visible')
    cy.contains('Quantity:').siblings().contains('10').should('exist')
    cy.contains('Order Type:').siblings().contains('Market Order').should('exist')
    cy.contains('Approximate Price:').should('be.visible')

    // Confirm the order
    cy.contains('button', 'Confirm').click()
    cy.wait('@createOrder').its('response.statusCode').should('be.oneOf', [200, 201])

    // Verify success screen
    cy.contains('Order submitted').should('be.visible')
    cy.contains('Your order is being processed.').should('be.visible')
  })

  // ── Part 4 ──────────────────────────────────────────────────────────────────

  it('Part 4: Denis (NeedApproval=true) creates a BUY order → PENDING; Vasa (supervisor) approves it', () => {
    // ── Setup: ensure Denis has NeedApproval=true via API ───────────────────────
    cy.request('POST', `${API_BASE}/login`, { email: VASILIJE_EMAIL, password: VASILIJE_PASSWORD })
      .then(({ body }) => {
        const token = body.access_token
        // Find Marko in actuaries
        cy.request({
          method:  'GET',
          url:     `${API_BASE}/api/actuaries`,
          headers: { Authorization: `Bearer ${token}` },
        }).then(({ body: actuaries }) => {
          const denis = actuaries.find(a =>
            (a.first_name ?? a.firstName) === 'Denis' &&
            (a.last_name  ?? a.lastName)  === 'Elezovic'
          )
          expect(denis, 'Denis Elezovic must exist as an actuary').to.exist
          const denisId = denis.employee_id ?? denis.employeeId
          cy.request({
            method:  'PUT',
            url:     `${API_BASE}/api/actuaries/${denisId}/need-approval`,
            headers: { Authorization: `Bearer ${token}` },
            body:    { need_approval: true },
          })
        })
      })

    // ── Denis logs in and creates a BUY Market order for 10 MSFT ────────────────
    cy.visit('/login')
    cy.get('input[name="email"]').type(DENIS_EMAIL)
    cy.get('input[name="password"]').type(DENIS_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    cy.visit('/securities')
    cy.get('input[placeholder="Search by ticker or name…"]').type('MSFT')
    cy.contains('tr', 'MSFT').contains('button', 'Buy').click()
    cy.contains('h1', 'Buy MSFT').should('be.visible')

    cy.get('input[type="number"][min="1"]').clear().type('10')

    cy.intercept('POST', '**/orders').as('createOrder')
    cy.contains('button', 'Review Order').click()
    cy.contains('button', 'Confirm').click()
    cy.wait('@createOrder').its('response.statusCode').should('be.oneOf', [200, 201])
    cy.contains('Order submitted').should('be.visible')

    // ── Ana (supervisor) logs in and opens Order Review portal ──────────────────
    cy.visit('/login')
    cy.get('input[name="email"]').type(VASILIJE_EMAIL)
    cy.get('input[name="password"]').type(VASILIJE_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    cy.visit('/admin/orders')
    cy.contains('h1', 'Order Review').should('be.visible')

    // Verify all required columns are present
    const expectedColumns = ['Agent', 'Order Type', 'Asset', 'Qty', 'Contract Size', 'Price / Unit', 'Direction', 'Remaining', 'Status']
    expectedColumns.forEach(col => cy.contains('th', col).should('exist'))

    // Filter to PENDING only
    cy.contains('button', 'PENDING').click()

    // Find Marko's pending order for 10 MSFT
    cy.contains('tbody tr', 'Denis Elezovic')
      .should('contain.text', 'MSFT')
      .and('contain.text', '10')
      .and('contain.text', 'PENDING')
      .as('denisRow')

    // Approve the order
    cy.intercept('PUT', '**/orders/*/approve').as('approveOrder')
    cy.get('@denisRow').contains('button', 'Approve').click()
    cy.wait('@approveOrder').its('response.statusCode').should('be.oneOf', [200, 201])

    // Switch to APPROVED filter — the row was filtered out of PENDING view after approval
    cy.contains('button', 'APPROVED').click()

    // Re-find Denis's row and verify status badge changed to APPROVED
    cy.contains('tbody tr', 'Denis Elezovic')
      .should('contain.text', 'MSFT')
      .and('contain.text', 'APPROVED')
      .as('denisApprovedRow')
    cy.get('@denisApprovedRow').contains('APPROVED').should('be.visible')

    // Note: "Approved By"  is not displayed in the UI —
    // this is backend-only data not surfaced on the Order Review page.
  })

  // ── Part 5 ──────────────────────────────────────────────────────────────────

  it('Part 5: ', () => {

  })

  // ── Part 6 ──────────────────────────────────────────────────────────────────

  it('Part 6: ', () => {

  })

  // ── Part 7 ──────────────────────────────────────────────────────────────────

  it('Part 7: ', () => {

  })

  // ── Part 8 ──────────────────────────────────────────────────────────────────

  it('Part 8: ', () => {

  })

  // ── Part 9 ──────────────────────────────────────────────────────────────────

  it('Part 9: ', () => {

  })

  // ── Part 10 ─────────────────────────────────────────────────────────────────

  it('Part 10: ', () => {

  })

  // ── Part 11 ─────────────────────────────────────────────────────────────────

  it('Part 11: ', () => {

  })

  // ── Part 12 ─────────────────────────────────────────────────────────────────

  it('Part 12: ', () => {

  })

})
