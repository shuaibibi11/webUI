describe('Chat Page', () => {
  beforeEach(() => {
    // 先登录
    cy.login('testuser', 'password123')
  })

  it('displays the chat interface correctly', () => {
    // 验证页面标题
    cy.title().should('contain', '聊天')
    
    // 验证聊天界面元素
    cy.get('.chat-container').should('exist')
    cy.get('.message-list').should('exist')
    cy.get('.input-area').should('exist')
    cy.get('input[name="message"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
  })

  it('sends a message successfully', () => {
    // 输入消息
    const testMessage = 'Hello, Cypress!'
    cy.get('input[name="message"]').type(testMessage)
    
    // 发送消息
    cy.get('button[type="submit"]').click()
    
    // 验证消息已发送
    cy.get('.message-item').should('contain', testMessage)
  })

  it('clears the input field after sending a message', () => {
    // 输入消息
    const testMessage = 'Hello, Cypress!'
    cy.get('input[name="message"]').type(testMessage)
    
    // 发送消息
    cy.get('button[type="submit"]').click()
    
    // 验证输入框已清空
    cy.get('input[name="message"]').should('have.value', '')
  })

  it('displays error message when sending empty message', () => {
    // 发送空消息
    cy.get('button[type="submit"]').click()
    
    // 验证错误提示
    cy.get('.n-message').should('exist')
    cy.get('.n-message__content').should('contain', '消息不能为空')
  })

  it('navigates to feedback page when feedback button is clicked', () => {
    // 点击反馈按钮
    cy.get('.feedback-btn').click()
    
    // 验证跳转到反馈页面
    cy.url().should('eq', 'http://localhost:13080/feedback')
  })

  it('logs out successfully when logout button is clicked', () => {
    // 点击用户菜单
    cy.get('.user-menu').click()
    
    // 点击退出登录按钮
    cy.get('.logout-button').click()
    
    // 验证跳转到登录页面
    cy.url().should('eq', 'http://localhost:13080/login')
  })
})
