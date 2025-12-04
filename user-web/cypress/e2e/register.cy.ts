describe('Register Page', () => {
  beforeEach(() => {
    // 访问注册页面
    cy.visit('/register')
  })

  it('displays the register form correctly', () => {
    // 验证页面标题
    cy.title().should('contain', '注册')
    
    // 验证表单元素
    cy.get('input[name="username"]').should('exist')
    cy.get('input[name="password"]').should('exist')
    cy.get('input[name="confirmPassword"]').should('exist')
    cy.get('input[name="email"]').should('exist')
    cy.get('input[name="phone"]').should('exist')
    cy.get('input[name="realName"]').should('exist')
    cy.get('input[name="idCard"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
    
    // 验证链接
    cy.get('a[href="/login"]').should('exist')
  })

  it('validates the form correctly', () => {
    // 直接提交空表单
    cy.get('button[type="submit"]').click()
    
    // 验证错误提示
    cy.get('.n-message').should('exist')
  })

  it('registers successfully with valid credentials', () => {
    // 生成随机用户名和邮箱，避免重复注册
    const randomUsername = `testuser_${Math.floor(Math.random() * 10000)}`
    const randomEmail = `${randomUsername}@example.com`
    
    // 输入注册信息
    cy.get('input[name="username"]').type(randomUsername)
    cy.get('input[name="password"]').type('Password123!')
    cy.get('input[name="confirmPassword"]').type('Password123!')
    cy.get('input[name="email"]').type(randomEmail)
    cy.get('input[name="phone"]').type('13800138000')
    cy.get('input[name="realName"]').type('测试用户')
    cy.get('input[name="idCard"]').type('110101199001011234')
    
    // 提交表单
    cy.get('button[type="submit"]').click()
    
    // 验证注册成功后跳转到登录页面
    cy.url().should('eq', 'http://localhost:13080/login')
    cy.get('.n-message').should('exist')
    cy.get('.n-message__content').should('contain', '注册成功')
  })

  it('displays an error when passwords do not match', () => {
    // 输入不匹配的密码
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('Password123!')
    cy.get('input[name="confirmPassword"]').type('DifferentPassword!')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="phone"]').type('13800138000')
    cy.get('input[name="realName"]').type('测试用户')
    cy.get('input[name="idCard"]').type('110101199001011234')
    
    // 提交表单
    cy.get('button[type="submit"]').click()
    
    // 验证错误提示
    cy.get('.n-message').should('exist')
    cy.get('.n-message__content').should('contain', '两次输入的密码不一致')
  })

  it('navigates to login page when login link is clicked', () => {
    // 点击登录链接
    cy.get('a[href="/login"]').click()
    
    // 验证跳转到登录页面
    cy.url().should('eq', 'http://localhost:13080/login')
  })
})
