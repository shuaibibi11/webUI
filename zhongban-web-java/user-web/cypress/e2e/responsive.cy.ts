describe('Responsive Design', () => {
  // 定义测试的屏幕尺寸
  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ]

  // 测试登录页面的响应式设计
  viewports.forEach(viewport => {
    it(`Login page displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      // 设置视口尺寸
      cy.viewport(viewport.width, viewport.height)
      
      // 访问登录页面
      cy.visit('/login')
      
      // 验证页面元素
      cy.get('.login-container').should('exist')
      cy.get('form').should('exist')
      cy.get('input[name="username"]').should('exist')
      cy.get('input[name="password"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
      
      // 验证布局
      cy.get('.login-container').should('have.css', 'width').and('be.lessThan', `${viewport.width + 1}px`)
    })
  })

  // 测试注册页面的响应式设计
  viewports.forEach(viewport => {
    it(`Register page displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      // 设置视口尺寸
      cy.viewport(viewport.width, viewport.height)
      
      // 访问注册页面
      cy.visit('/register')
      
      // 验证页面元素
      cy.get('.register-container').should('exist')
      cy.get('form').should('exist')
      cy.get('input[name="username"]').should('exist')
      cy.get('input[name="password"]').should('exist')
      cy.get('input[name="confirmPassword"]').should('exist')
      cy.get('input[name="email"]').should('exist')
      cy.get('input[name="phone"]').should('exist')
      cy.get('input[name="realName"]').should('exist')
      cy.get('input[name="idCard"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
      
      // 验证布局
      cy.get('.register-container').should('have.css', 'width').and('be.lessThan', `${viewport.width + 1}px`)
    })
  })

  // 测试聊天页面的响应式设计
  viewports.forEach(viewport => {
    it(`Chat page displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      // 设置视口尺寸
      cy.viewport(viewport.width, viewport.height)
      
      // 登录
      cy.login('testuser', 'password123')
      
      // 验证页面元素
      cy.get('.chat-container').should('exist')
      cy.get('.message-list').should('exist')
      cy.get('.input-area').should('exist')
      cy.get('input[name="message"]').should('exist')
      cy.get('button[type="submit"]').should('exist')
      
      // 验证布局
      cy.get('.chat-container').should('have.css', 'width').and('be.lessThan', `${viewport.width + 1}px`)
      cy.get('.input-area').should('have.css', 'width').and('be.lessThan', `${viewport.width + 1}px`)
      
      // 验证移动端布局调整
      if (viewport.width < 768) {
        // 在移动端，菜单应该折叠
        cy.get('.mobile-menu-button').should('exist')
      } else {
        // 在桌面端，菜单应该展开
        cy.get('.desktop-menu').should('exist')
      }
    })
  })

  // 测试反馈组件的响应式设计
  viewports.forEach(viewport => {
    it(`Feedback component displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      // 设置视口尺寸
      cy.viewport(viewport.width, viewport.height)
      
      // 访问首页
      cy.visit('/')
      
      // 验证反馈按钮显示
      cy.get('.floating-btn').should('exist')
      
      // 点击反馈按钮
      cy.get('.floating-btn').click()
      
      // 验证反馈表单显示
      cy.get('.feedback-form').should('exist')
      
      // 验证表单元素
      cy.get('n-select').should('exist')
      cy.get('n-input').should('exist')
      cy.get('n-button').should('exist')
    })
  })

  // 测试导航栏的响应式设计
  viewports.forEach(viewport => {
    it(`Navigation bar displays correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      // 设置视口尺寸
      cy.viewport(viewport.width, viewport.height)
      
      // 访问首页
      cy.visit('/')
      
      // 验证导航栏存在
      cy.get('.navbar').should('exist')
      
      // 验证导航栏布局
      cy.get('.navbar').should('have.css', 'width').and('be.lessThan', `${viewport.width + 1}px`)
      
      // 验证移动端和桌面端导航栏的差异
      if (viewport.width < 768) {
        // 在移动端，导航栏应该有汉堡菜单
        cy.get('.hamburger-menu').should('exist')
      } else {
        // 在桌面端，导航栏应该有完整菜单
        cy.get('.nav-menu').should('exist')
      }
    })
  })
})
