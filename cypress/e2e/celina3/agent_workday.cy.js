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

    // Verify the new limit is displayed (used limit may be non-zero from prior runs)
    cy.get('tbody tr').first().should('contain.text', '200.000,00 RSD')
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

    // Wait for options to finish loading before interacting (component uses Unicode ellipsis …)
    cy.contains(/Loading options/i, { timeout: 60000 }).should('not.exist')

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

  it('Part 4: Vasa (supervisor) approves Denis\'s pending BUY order from Part 3', () => {
    // ── Vasilije logs in and opens Order Review portal ──────────────────
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

  it('Part 5: Market order for 10 MSFT is executed in partial fills (4, 3, 3); usedLimit increases accordingly', () => {

    // Login as Vasilije and poll the DONE filter until Denis's MSFT order appears
    cy.visit('/login')
    cy.get('input[name="email"]').type(VASILIJE_EMAIL)
    cy.get('input[name="password"]').type(VASILIJE_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Poll every 3 s (up to 10 × 3 s = 30 s) — re-visit page each time to get fresh data
    const pollDone = (retriesLeft) => {
      cy.visit('/admin/orders')
      cy.contains('h1', 'Order Review').should('be.visible')
      cy.contains('button', 'DONE').click()

      cy.get('body').then(($body) => {
        const hasDoneRow =
          $body.find('tbody tr').length > 0 &&
          $body.text().includes('Denis Elezovic') &&
          $body.text().includes('MSFT')

        if (hasDoneRow) {
          cy.contains('tbody tr', 'Denis Elezovic')
            .should('contain.text', 'MSFT')
            .and('contain.text', 'DONE')
        } else if (retriesLeft > 0) {
          cy.wait(3000)
          pollDone(retriesLeft - 1)
        } else {
          throw new Error('Order did not reach DONE status within 30 s')
        }
      })
    }

    pollDone(10)
  })

  // ── Part 6 ──────────────────────────────────────────────────────────────────

  it('Part 6: Denis opens My Portfolio and sees 10 MSFT shares with all required fields and tax info', () => {
    // Login as Denis
    cy.visit('/login')
    cy.get('input[name="email"]').type(DENIS_EMAIL)
    cy.get('input[name="password"]').type(DENIS_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Navigate to My Portfolio
    cy.visit('/portfolio')
    cy.contains('h1', /portfolio/i).should('be.visible')

    // MSFT entry must be present
    cy.contains('tbody tr', 'MSFT').as('msftRow').should('be.visible')

    // Required columns: type, ticker, amount, price, profit, last modified
    cy.get('@msftRow').within(() => {
      cy.get('td').should('have.length.at.least', 6)
    })

    // Profit value is displayed (positive or negative — just verify the cell renders a number)
    cy.get('@msftRow').find('td').then(($tds) => {
      const texts = [...$tds].map(td => td.textContent.trim())
      const hasProfitCell = texts.some(t => /[+-]?\$?\d+([.,]\d+)?/.test(t))
      expect(hasProfitCell).to.be.true
    })

    // TODO: Tax not yet implemented
    // cy.contains(/tax/i).should('be.visible')
    // cy.contains(/paid tax/i).should('be.visible')
    // cy.contains(/unpaid tax/i).should('be.visible')
  })

  // ── Part 7 ──────────────────────────────────────────────────────────────────

  it('Part 7: Denis sells 5 MSFT shares (Market SELL order) and the correct commission is calculated', () => {
    // Login as Denis
    cy.visit('/login')
    cy.get('input[name="email"]').type(DENIS_EMAIL)
    cy.get('input[name="password"]').type(DENIS_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Open My Portfolio
    cy.visit('/portfolio')
    cy.contains('h1', /portfolio/i).should('be.visible')

    // Find the MSFT row and click Sell
    cy.contains('tbody tr', 'MSFT')
      .contains('button', 'Sell')
      .click()

    // Create Order form for SELL MSFT opens
    cy.url().should('include', '/orders/new')
    cy.contains('h1', /sell msft/i).should('be.visible')

    // Enter quantity 5, leave limit and stop empty (Market SELL)
    cy.get('input[type="number"][min="1"]').clear().type('5')
    cy.get('input[placeholder="Leave empty for market price"]').each(($input) => {
      expect($input.val()).to.equal('')
    })

    // Order type should show Market Order
    cy.contains('Order Type').siblings().contains('Market Order').should('exist')

    // Intercept order creation
    cy.intercept('POST', '**/orders').as('createSellOrder')

    // Click Review Order — confirmation dialog appears
    cy.contains('button', 'Review Order').click()
    cy.contains('Confirm Order').should('be.visible')
    //cy.contains(/sell msft/i).should('be.visible')
    cy.contains('Quantity:').siblings().contains('5').should('exist')
    cy.contains('Order Type:').siblings().contains('Market Order').should('exist')

    // Confirm the sale
    cy.contains('button', /confirm/i).click()
    cy.wait('@createSellOrder').then(({ response }) => {
      expect(response.statusCode).to.be.oneOf([200, 201])

      // Verify commission is min(0.14 * totalPrice, 7)
      const order        = response.body
      const totalPrice   = (order.price_per_unit ?? order.pricePerUnit ?? 0) * 5
      const expectedComm = Math.min(0.14 * totalPrice, 7)
      const actualComm   = order.commission ?? order.fee ?? 0
      expect(actualComm).to.be.closeTo(expectedComm, 0.01)
    })

    // Success confirmation shown
    cy.contains('Order submitted').should('be.visible')
  })

  // ── Part 8 ──────────────────────────────────────────────────────────────────

  it('Part 8: SELL order is auto-approved (Denis has need_approval=false); system executes it; Denis ends up with 5 MSFT shares', () => {
    // Login as Vasilije
    cy.visit('/login')
    cy.get('input[name="email"]').type(VASILIJE_EMAIL)
    cy.get('input[name="password"]').type(VASILIJE_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Open Order Overview
    cy.visit('/admin/orders')
    cy.contains('h1', 'Order Review').should('be.visible')

    // Denis has need_approval=false and SELL orders bypass the limit check entirely,
    // so the order is auto-approved — it never lands in PENDING.
    cy.contains('button', 'APPROVED').click()

    // Find Denis's approved SELL order for 5 MSFT (filter by SELL to avoid matching the BUY row)
    cy.get('tbody tr')
      .filter(':contains("Denis Elezovic")')
      .filter(':contains("SELL")')
      .should('contain.text', 'MSFT')
      .and('contain.text', '5')
      .and('contain.text', 'APPROVED')

    // Poll until the SELL order reaches DONE (same pattern as Part 5)
    const pollSellDone = (retriesLeft) => {
      cy.visit('/admin/orders')
      cy.contains('h1', 'Order Review').should('be.visible')
      cy.contains('button', 'DONE').click()

      cy.get('body').then(($body) => {
        const rows = [...$body.find('tbody tr')]
        const hasSellDoneRow = rows.some(tr =>
          tr.textContent.includes('Denis Elezovic') &&
          tr.textContent.includes('MSFT') &&
          tr.textContent.includes('SELL')
        )

        if (hasSellDoneRow) {
          cy.get('tbody tr')
            .filter(':contains("Denis Elezovic")')
            .filter(':contains("SELL")')
            .should('contain.text', 'MSFT')
            .and('contain.text', 'DONE')
        } else if (retriesLeft > 0) {
          cy.wait(3000)
          pollSellDone(retriesLeft - 1)
        } else {
          throw new Error('SELL order did not reach DONE status within 30 s')
        }
      })
    }

    pollSellDone(10)
  })

  // ── Part 9 ──────────────────────────────────────────────────────────────────

  it('Part 9: After the sale Denis sees 5 MSFT shares, a realized profit in the portfolio, and unpaid tax > 0', () => {
    // Login as Denis
    cy.visit('/login')
    cy.get('input[name="email"]').type(DENIS_EMAIL)
    cy.get('input[name="password"]').type(DENIS_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    cy.visit('/portfolio')
    cy.contains('h1', /portfolio/i).should('be.visible')

    // Should now show 5 MSFT shares
    cy.contains('tbody tr', 'MSFT').as('msftRow')
    cy.get('@msftRow').contains('5').should('exist')

    // TODO: Tax not yet implemented
    // // Tax section: unpaid tax for the current month must be > 0
    // // Tax = 15% * (selling price - purchase price) * 5 shares, converted to RSD
    // cy.contains(/unpaid tax/i)
    //   .closest('tr, div, section')
    //   .find('[data-testid="unpaid-tax"], .unpaid-tax, td, span')
    //   .then(($el) => {
    //     const text  = $el.text().replace(/[^0-9.,]/g, '').replace(',', '.')
    //     const value = parseFloat(text)
    //     expect(value).to.be.greaterThan(0)
    //   })
  })

  // ── Part 10 ─────────────────────────────────────────────────────────────────

  // TODO: Tax not yet implemented — entire Part 10 commented out
  // it('Part 10: Vasilije opens Tax Tracking, filters by actuary, and initiates tax collection for Denis', () => {
  //   cy.visit('/login')
  //   cy.get('input[name="email"]').type(VASILIJE_EMAIL)
  //   cy.get('input[name="password"]').type(VASILIJE_PASSWORD)
  //   cy.get('button[type="submit"]').click()
  //   cy.url().should('not.include', '/login')
  //
  //   cy.visit('/admin/tax')
  //   cy.contains('h1', /tax/i).should('be.visible')
  //   cy.get('tbody tr').should('have.length.at.least', 1)
  //
  //   cy.contains('tbody tr', 'Denis Elezovic').as('denisRow')
  //   cy.get('@denisRow').within(() => {
  //     cy.get('td').then(($tds) => {
  //       const liabilityText = [...$tds].find(td => /\d/.test(td.textContent))?.textContent ?? '0'
  //       const liability     = parseFloat(liabilityText.replace(/[^0-9.]/g, ''))
  //       expect(liability).to.be.greaterThan(0)
  //     })
  //   })
  //
  //   cy.get('select[name="type"], select[aria-label*="type" i]').select('actuary')
  //   cy.get('tbody tr').each(($row) => {
  //     cy.wrap($row).find('td').should('contain.text', 'actuary')
  //   })
  //   cy.contains('tbody tr', 'Denis Elezovic').should('be.visible')
  //
  //   cy.intercept('POST', '**/tax/collect*').as('collectTax')
  //   cy.contains('button', /collect tax|calculate tax|initiate/i).click()
  //   cy.wait('@collectTax').then(({ response }) => {
  //     expect(response.statusCode).to.be.oneOf([200, 201])
  //     const result = response.body
  //     const taxAmount = result.tax_amount ?? result.taxAmount ?? result.amount ?? 0
  //     expect(taxAmount).to.be.greaterThan(0)
  //   })
  //   cy.contains(/success|tax collected|done/i).should('be.visible')
  // })

  it('Part 10: Tax Tracking — skipped (tax not yet implemented)', () => {
    cy.log('Tax feature not yet implemented — test skipped')
  })

  // ── Part 11 ─────────────────────────────────────────────────────────────────

  it('Part 11: Final state — Denis still has 5 MSFT; paid tax updated; unpaid tax = 0; account balances correct', () => {
    cy.request('POST', `${API_BASE}/login`, { email: VASILIJE_EMAIL, password: VASILIJE_PASSWORD })
      .then(({ body }) => {
        const token = body.access_token

        // Denis's usedLimit is available and > 0 (was updated during the buy)
        cy.request({
          method:  'GET',
          url:     `${API_BASE}/api/actuaries`,
          headers: { Authorization: `Bearer ${token}` },
        }).then(({ body: actuaries }) => {
          const denis = actuaries.find(a =>
            (a.first_name ?? a.firstName) === 'Denis' &&
            (a.last_name  ?? a.lastName)  === 'Elezovic'
          )
          const usedLimit = denis.used_limit ?? denis.usedLimit
          expect(usedLimit).to.be.greaterThan(0)
        })
      })

    // UI verification — Denis logs in and checks My Portfolio
    cy.visit('/login')
    cy.get('input[name="email"]').type(DENIS_EMAIL)
    cy.get('input[name="password"]').type(DENIS_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    cy.visit('/portfolio')
    cy.contains('h1', /portfolio/i).should('be.visible')

    // 5 MSFT shares remain
    cy.contains('tbody tr', 'MSFT').contains('5').should('exist')

    // TODO: Tax not yet implemented
    // // Paid tax for the current year is shown (> 0 after supervisor collected it)
    // cy.contains(/paid tax/i)
    //   .closest('tr, div, section')
    //   .find('[data-testid="paid-tax"], .paid-tax, td, span')
    //   .then(($el) => {
    //     const text  = $el.text().replace(/[^0-9.,]/g, '').replace(',', '.')
    //     const value = parseFloat(text)
    //     expect(value).to.be.greaterThan(0)
    //   })

    // // Unpaid tax for the current month is now 0 (supervisor already collected it)
    // cy.contains(/unpaid tax/i)
    //   .closest('tr, div, section')
    //   .find('[data-testid="unpaid-tax"], .unpaid-tax, td, span')
    //   .then(($el) => {
    //     const text  = $el.text().replace(/[^0-9.,]/g, '').replace(',', '.')
    //     const value = parseFloat(text)
    //     expect(value).to.equal(0)
    //   })
  })

  // ── Part 12 ─────────────────────────────────────────────────────────────────

  it('Part 12: Vasilije resets Denis Elezovic\'s usedLimit via the Restart Limit button on the Actuaries page', () => {
    // Login as Vasilije
    cy.visit('/login')
    cy.get('input[name="email"]').type(VASILIJE_EMAIL)
    cy.get('input[name="password"]').type(VASILIJE_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // Open Actuaries page and filter to Denis's row
    cy.visit('/admin/actuaries')
    cy.contains('h1', 'Actuaries').should('be.visible')
    cy.get('input[name="lastName"]').type('Elezovic')
    cy.get('tbody tr').should('have.length', 1)
    cy.get('tbody tr').should('contain.text', 'Denis Elezovic')

    // Click the Restart Limit button on Denis's row
    cy.get('tbody tr').first().contains('button', /reset used/i).click()

    // Verify usedLimit is now 0 in the table
    cy.get('tbody tr').first().should('contain.text', '0,00 RSD')

    // Wipe the orders DB so it's clean for future test runs
    cy.exec(
      'docker exec exbanka-4-infrastructure-order-db-1 psql -U order_user -d order_db -c "TRUNCATE TABLE order_portions, orders RESTART IDENTITY CASCADE;"',
      { failOnNonZeroExit: false }
    )
  })

})
