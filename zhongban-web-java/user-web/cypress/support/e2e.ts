// 导入Cypress命令
import './commands'

// 全局beforeEach钩子，在每个测试前执行
beforeEach(() => {
  // 访问应用首页
  cy.visit('/')
})

// 全局afterEach钩子，在每个测试后执行
afterEach(() => {
  // 清除所有cookies和localStorage
  cy.clearAllCookies()
  cy.clearLocalStorage()
})
