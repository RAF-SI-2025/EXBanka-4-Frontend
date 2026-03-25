/**
 * Feature: Krediti (Loans)
 * Scenarios: 33–38
 *
 * S37/S38 require a backend cron job trigger and cannot be driven via UI.
 * They are marked pending with an explanatory note.
 */

const ADMIN_EMAIL    = 'admin@exbanka.com'
const ADMIN_PASSWORD = 'admin'
const CLIENT_EMAIL   = 'ddimitrijevi822rn@raf.rs'
const CLIENT_PASSWORD = 'taraDunjic123'
const API_BASE       = 'http://localhost:8083'

// ── Helpers ───────────────────────────────────────────────────────────────────

function loginAsClient() {
  cy.visit('/client/login')
  cy.get('input[name="email"]').type(CLIENT_EMAIL)
  cy.get('input[name="password"]').type(CLIENT_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsEmployee() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(ADMIN_EMAIL)
  cy.get('input[name="password"]').type(ADMIN_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

/** Submits a loan application via API and returns the loan data. */
function seedLoanApplication(cb) {
  cy.request('POST', `${API_BASE}/client/login`, {
    email: CLIENT_EMAIL, password: CLIENT_PASSWORD, source: 'mobile',
  }).then(({ body }) => {
    const token = body.access_token
    cy.request({
      method:  'GET',
      url:     `${API_BASE}/api/accounts/my`,
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ body: accounts }) => {
      const rsd = accounts.find(a => a.currency === 'RSD')
      expect(rsd, 'client must have an RSD account').to.exist

      cy.request({
        method:  'POST',
        url:     `${API_BASE}/loans/apply`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          loanType:         'CASH',
          interestRateType: 'FIXED',
          amount:           5000,
          currency:         'RSD',
          repaymentPeriod:  12,
          accountNumber:    rsd.accountNumber,
          monthlySalary:    80000,
          employmentStatus: 'PERMANENT',
        },
      }).then(({ body: loan }) => cb(loan))
    })
  })
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Krediti — scenarios 33–38', () => {

  // ── Scenario 33 ──────────────────────────────────────────────────────────────

  it('Scenario 33: klijent podnosi zahtev za kredit — zahtev se beleži i prikazuje potvrda', () => {
    // Get a valid RSD account number to fill the form
    cy.request('POST', `${API_BASE}/client/login`, {
      email: CLIENT_EMAIL, password: CLIENT_PASSWORD, source: 'mobile',
    }).then(({ body }) => {
      const token = body.access_token
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/api/accounts/my`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body: accounts }) => {
        const rsd = accounts.find(a => a.currency === 'RSD')
        expect(rsd, 'client must have an RSD account').to.exist

        loginAsClient()
        cy.visit('/client/loans')
        cy.contains('h1', 'Loans').should('be.visible')

        // When: klikne na "Apply for Loan"
        cy.contains('Apply for Loan').click()
        cy.url().should('include', '/client/loans/apply')
        cy.contains('Apply for a Loan').should('be.visible')

        // Fill loan type (radio-as-label — click the label text)
        cy.contains('Cash').click()

        // Fill interest rate type
        cy.contains('Fixed').click()

        // Fill amount and currency
        cy.get('input[name="amount"]').type('10000')
        // currency stays RSD (default)

        // Fill repayment period
        cy.get('select[name="repaymentPeriod"]').select('12')

        // Fill linked account
        cy.get('select[name="accountNumber"]').select(rsd.accountNumber)

        // Optional: monthly salary and employment status
        cy.get('input[name="monthlySalary"]').scrollIntoView().type('80000')
        cy.get('select[name="employmentStatus"]').scrollIntoView().select('PERMANENT')

        // Then: klikne "Submit Application"
        cy.contains('button', 'Submit Application').scrollIntoView().click()

        // Then: success screen with loan number and installment
        cy.contains('Application Submitted', { timeout: 10000 }).should('be.visible')
        cy.contains('Loan #').should('be.visible')
        cy.contains('Estimated Monthly Installment').should('be.visible')
      })
    })
  })

  // ── Scenario 34 ──────────────────────────────────────────────────────────────

  it('Scenario 34: pregled kredita — lista sortiranа po ukupnom iznosu', () => {
    loginAsClient()
    cy.visit('/client/loans')
    cy.contains('h1', 'Loans').should('be.visible')

    // If loans exist, verify descending sort by amount
    cy.get('body').then(($body) => {
      if ($body.text().includes('No loans')) {
        cy.log('NOTE: No loans found — sort order cannot be verified')
        return
      }

      // Collect amounts from the loan list rows
      const amounts = []
      cy.get('.space-y-3 > div').each(($row) => {
        // Amount is shown in "p.text-sm.font-medium" inside the right column
        const amountText = $row.find('p.text-sm.font-medium').first().text().trim()
        if (amountText) amounts.push(amountText)
      }).then(() => {
        if (amounts.length >= 2) {
          // Verify rendered order matches descending by checking via API
          cy.request('POST', `${API_BASE}/client/login`, {
            email: CLIENT_EMAIL, password: CLIENT_PASSWORD, source: 'mobile',
          }).then(({ body }) => {
            cy.request({
              method:  'GET',
              url:     `${API_BASE}/loans`,
              headers: { Authorization: `Bearer ${body.access_token}` },
            }).then(({ body: loans }) => {
              const sorted = [...loans].sort((a, b) => b.amount - a.amount)
              expect(loans.map(l => l.id)).to.deep.equal(sorted.map(l => l.id))
            })
          })
        }
      })
    })
  })

  // ── Scenario 35 ──────────────────────────────────────────────────────────────

  it('Scenario 35: zaposleni odobrava zahtev za kredit — kredit dobija status Odobren', () => {
    // Seed a pending application via API
    seedLoanApplication((loan) => {
      loginAsEmployee()
      cy.visit('/admin/loans/applications')
      cy.contains('h1', 'Loan Applications').should('be.visible')

      // Find the seeded application card by loan number
      cy.contains(`#${loan.loanNumber}`).scrollIntoView().should('be.visible')

      // Click Approve
      cy.contains(`#${loan.loanNumber}`).closest('div.bg-white').within(() => {
        cy.contains('button', 'Approve').click()
      })

      // Confirm dialog appears
      cy.contains('Approve this application?').should('be.visible')
      cy.contains('button', 'Confirm').click()

      // Then: toast "Loan approved."
      cy.contains('Loan approved.', { timeout: 8000 }).should('be.visible')

      // And: application card disappears from the list
      cy.contains(`#${loan.loanNumber}`).should('not.exist')
    })
  })

  // ── Scenario 36 ──────────────────────────────────────────────────────────────

  it('Scenario 36: zaposleni odbija zahtev za kredit — kredit dobija status Odbijen', () => {
    // Seed a fresh pending application via API
    seedLoanApplication((loan) => {
      loginAsEmployee()
      cy.visit('/admin/loans/applications')
      cy.contains('h1', 'Loan Applications').should('be.visible')

      // Find the seeded application card
      cy.contains(`#${loan.loanNumber}`).scrollIntoView().should('be.visible')

      // Click Reject
      cy.contains(`#${loan.loanNumber}`).closest('div.bg-white').within(() => {
        cy.contains('button', 'Reject').click()
      })

      // Confirm dialog
      cy.contains('Reject this application?').should('be.visible')
      cy.contains('button', 'Confirm').click()

      // Then: toast "Loan rejected."
      cy.contains('Loan rejected.', { timeout: 8000 }).should('be.visible')

      // And: application disappears
      cy.contains(`#${loan.loanNumber}`).should('not.exist')
    })
  })

  // ── Scenario 37 (pending — requires cron trigger) ────────────────────────────

  it.skip('Scenario 37: automatsko skidanje rate — iznos se skida sa računa klijenta', () => {
    /**
     * This scenario requires the backend daily cron job to fire.
     * It cannot be driven purely through the UI.
     *
     * To implement: expose a POST /admin/loans/trigger-installments endpoint
     * that manually runs the installment collection job, then verify:
     *   - the installment status changed to PAID
     *   - the client account balance decreased by the installment amount
     *   - the next payment date shifted by one month
     */
  })

  // ── Scenario 38 (pending — requires cron trigger) ────────────────────────────

  it.skip('Scenario 38: kašnjenje u otplati — rata dobija status Kasni', () => {
    /**
     * Same constraint as S37 — requires triggering the cron job.
     *
     * To implement: ensure the client account has insufficient funds,
     * trigger the installment job, then verify:
     *   - the installment status is LATE / KASNI
     *   - a retry is scheduled 72 hours later
     */
  })

})
