// 自定义命令：登录
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
      visitHome(): Chainable<void>
      visitAbout(): Chainable<void>
      visitContact(): Chainable<void>
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
})

Cypress.Commands.add('logout', () => {
  cy.get('.user-menu').click()
  cy.get('.logout-button').click()
})

Cypress.Commands.add('visitHome', () => {
  cy.visit('/')
})

Cypress.Commands.add('visitAbout', () => {
  cy.visit('/about')
})

Cypress.Commands.add('visitContact', () => {
  cy.visit('/contact')
})

Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`)
})
