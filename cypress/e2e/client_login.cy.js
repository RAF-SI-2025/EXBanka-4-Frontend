describe('Client Login', () => {
  it('logs in successfully', () => {
    cy.visit('http://localhost:5173/client/login')

    cy.get('input[type="email"]').type('client@test.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    cy.url().should('include', '/client')
  })
})
