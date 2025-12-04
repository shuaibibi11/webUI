describe('Login Page', () => {
  beforeEach(() => {
    // 访问登录页面
    cy.visit('/login')
  })

  it('displays the login form correctly', () => {
    // 验证页面标题
    cy.title().should('contain', '登录')
    
    // 验证表单元素
    cy.get('input[name="username"]').should('exist')
    cy.get('input[name="password"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
    
    // 验证链接
    cy.get('a[href="/register"]').should('exist')
    cy.get('a[href="/forgot-password"]').should('exist')
  })

  it('validates the form correctly', () => {
    // 直接提交空表单
    cy.get('button[type="submit"]').click()
    
    // 验证错误提示
    cy.get('.n-message').should('exist')
  })

  it('logs in successfully with valid credentials', () => {
    // 输入正确的用户名和密码
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('password123')
    
    // 提交表单
    cy.get('button[type="submit"]').click()
    
    // 验证登录成功后跳转到聊天页面
    cy.url().should('eq', 'http://localhost:13080/')
  })

  it('displays an error message with invalid credentials', () => {
    // 输入错误的用户名和密码
    cy.get('input[name="username"]').type('invaliduser')
    cy.get('input[name="password"]').type('invalidpassword')
    
    // 提交表单
    cy.get('button[type="submit"]').click()
    
    // 验证错误提示
    cy.get('.n-message').should('exist')
    cy.get('.n-message__content').should('contain', '用户名或密码错误')
  })

  it('navigates to register page when register link is clicked', () => {
    // 点击注册链接
    cy.get('a[href="/register"]').click()
    
    // 验证跳转到注册页面
    cy.url().should('eq', 'http://localhost:13080/register')
  })

  it('navigates to forgot password page when forgot password link is clicked', () => {
    // 点击忘记密码链接
    cy.get('a[href="/forgot-password"]').click()
    
    // 验证跳转到忘记密码页面
    cy.url().should('eq', 'http://localhost:13080/forgot-password')
  })
})
