# 企业级认证与聊天系统测试策略

## 测试目标

- **单元测试覆盖率**: ≥80%
- **集成测试覆盖率**: ≥90%
- **端到端测试**: 核心业务流程100%覆盖
- **性能测试**: 响应时间<200ms，并发用户>1000

## 测试分类

### 1. 单元测试 (Unit Tests)

#### 前端单元测试

**测试框架**: Vitest + React Testing Library

**测试范围**:
- 表单验证函数
- 工具函数
- 自定义Hooks
- 纯组件渲染

**示例测试用例**:

```typescript
// 表单验证测试
describe('表单验证', () => {
  test('邮箱格式验证', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  test('密码强度验证', () => {
    expect(validatePassword('Strong123!')).toBe(true);
    expect(validatePassword('weak')).toBe(false);
    expect(validatePassword('NoSpecial123')).toBe(false);
  });

  test('手机号格式验证', () => {
    expect(validatePhone('13800138000')).toBe(true);
    expect(validatePhone('12345678901')).toBe(false);
    expect(validatePhone('1380013800')).toBe(false);
  });
});
```

#### 后端单元测试

**测试框架**: Jest

**测试范围**:
- Service层业务逻辑
- 工具函数
- 数据验证
- 错误处理

**示例测试用例**:

```typescript
// 用户服务测试
describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    // 初始化测试环境
  });

  describe('用户注册', () => {
    test('成功注册新用户', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        phone: '13800138000',
        password: 'Secure123!'
      };

      const result = await service.register(userData);
      
      expect(result.success).toBe(true);
      expect(result.user.username).toBe('testuser');
      expect(result.user.password).toBeUndefined();
    });

    test('用户名重复检查', async () => {
      // 先创建一个用户
      await service.register({
        username: 'existinguser',
        email: 'test1@example.com',
        phone: '13800138001',
        password: 'Secure123!'
      });

      // 尝试创建同名用户
      await expect(service.register({
        username: 'existinguser',
        email: 'test2@example.com',
        phone: '13800138002',
        password: 'Secure123!'
      })).rejects.toThrow('用户名已存在');
    });
  });

  describe('用户登录', () => {
    test('正确凭证登录', async () => {
      // 先创建用户
      await service.register({
        username: 'logintest',
        email: 'login@example.com',
        phone: '13800138003',
        password: 'Secure123!'
      });

      const result = await service.login({
        identifier: 'login@example.com',
        password: 'Secure123!'
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    test('错误密码登录', async () => {
      await expect(service.login({
        identifier: 'login@example.com',
        password: 'WrongPassword'
      })).rejects.toThrow('用户名或密码错误');
    });
  });
});
```

### 2. 集成测试 (Integration Tests)

#### API集成测试

**测试范围**:
- 数据库操作
- API端点
- 认证流程
- 错误处理

**测试用例**:

```typescript
describe('认证API集成测试', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // 初始化测试应用
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('POST /api/auth/register', () => {
    test('完整注册流程', async () => {
      // 1. 发送短信验证码
      const smsResponse = await request(app.getHttpServer())
        .post('/api/auth/send-sms')
        .send({ phone: '13800138000' })
        .expect(200);

      expect(smsResponse.body.success).toBe(true);

      // 2. 用户注册
      const registerResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'integrationtest',
          email: 'integration@example.com',
          phone: '13800138000',
          password: 'Secure123!',
          verificationCode: '123456'
        })
        .expect(200);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user.username).toBe('integrationtest');
      expect(registerResponse.body.data.token).toBeDefined();
    });

    test('重复用户名注册', async () => {
      // 创建第一个用户
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'duplicate1@example.com',
          phone: '13800138001',
          password: 'Secure123!',
          verificationCode: '123456'
        });

      // 尝试创建同名用户
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'duplicate2@example.com',
          phone: '13800138002',
          password: 'Secure123!',
          verificationCode: '123456'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('USERNAME_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    test('成功登录', async () => {
      // 先注册用户
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'logintest@example.com',
          phone: '13800138003',
          password: 'Secure123!',
          verificationCode: '123456'
        });

      // 用户登录
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          identifier: 'logintest@example.com',
          password: 'Secure123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });
});
```

#### 数据库集成测试

```typescript
describe('数据库集成测试', () => {
  test('用户数据完整性', async () => {
    // 测试用户创建和查询
    const user = await prisma.user.create({
      data: {
        username: 'dbtest',
        email: 'dbtest@example.com',
        phone: '13800138004',
        passwordHash: 'hashed_password'
      }
    });

    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();

    // 测试用户查询
    const foundUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    expect(foundUser).toBeDefined();
    expect(foundUser.username).toBe('dbtest');
  });

  test('会话和消息关联', async () => {
    // 创建用户
    const user = await prisma.user.create({
      data: {
        username: 'chattest',
        email: 'chattest@example.com',
        phone: '13800138005',
        passwordHash: 'hashed_password'
      }
    });

    // 创建会话
    const conversation = await prisma.conversation.create({
      data: {
        title: '测试会话',
        type: 'private'
      }
    });

    // 创建消息
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: '测试消息',
        type: 'text',
        status: 'sent'
      },
      include: {
        sender: true,
        conversation: true
      }
    });

    expect(message.sender.username).toBe('chattest');
    expect(message.conversation.title).toBe('测试会话');
  });
});
```

### 3. 端到端测试 (E2E Tests)

**测试框架**: Cypress

**测试范围**:
- 用户注册登录完整流程
- 聊天功能完整流程
- 错误处理和边界情况

**测试用例**:

```typescript
describe('用户注册登录E2E测试', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('完整注册登录流程', () => {
    // 1. 访问注册页面
    cy.contains('没有账号？注册').click();
    cy.url().should('include', '/register');

    // 2. 填写注册信息
    cy.get('input[placeholder="用户名"]').type('e2etest');
    cy.get('input[placeholder="邮箱"]').type('e2e@example.com');
    cy.get('input[placeholder="手机号"]').type('13800138006');
    cy.get('input[placeholder="验证码"]').type('123456');
    cy.get('input[placeholder="密码"]').type('Secure123!');
    cy.get('input[placeholder="确认密码"]').type('Secure123!');
    
    // 3. 同意协议
    cy.get('input[type="checkbox"]').first().check();
    cy.get('input[type="checkbox"]').last().check();

    // 4. 提交注册
    cy.contains('注册').click();

    // 5. 验证注册成功并跳转到登录页
    cy.url().should('include', '/login');
    cy.contains('注册成功').should('be.visible');

    // 6. 用户登录
    cy.get('input[placeholder="邮箱/手机号"]').type('e2e@example.com');
    cy.get('input[placeholder="密码"]').type('Secure123!');
    cy.contains('登录').click();

    // 7. 验证登录成功并跳转到聊天页
    cy.url().should('include', '/chat');
    cy.contains('ERP数据管理应用').should('be.visible');
  });
});

describe('聊天功能E2E测试', () => {
  beforeEach(() => {
    // 使用已注册用户登录
    cy.visit('http://localhost:5173/login');
    cy.get('input[placeholder="邮箱/手机号"]').type('test@example.com');
    cy.get('input[placeholder="密码"]').type('Test123!');
    cy.contains('登录').click();
    cy.url().should('include', '/chat');
  });

  it('发送和接收消息', () => {
    // 1. 等待页面加载
    cy.contains('ERP数据管理应用').should('be.visible');

    // 2. 输入消息
    const testMessage = '这是一条测试消息';
    cy.get('textarea[placeholder="输入消息..."]').type(testMessage);

    // 3. 发送消息
    cy.get('button[type="submit"]').click();

    // 4. 验证消息显示
    cy.contains(testMessage).should('be.visible');
    
    // 5. 验证消息状态
    cy.get('.message-status').should('contain', '已发送');
  });

  it('创建新会话', () => {
    // 1. 点击新建会话
    cy.contains('新建会话').click();

    // 2. 输入会话标题
    cy.get('input[placeholder="会话标题"]').type('新测试会话');
    
    // 3. 确认创建
    cy.contains('创建').click();

    // 4. 验证新会话在列表中
    cy.contains('新测试会话').should('be.visible');
  });
});
```

### 4. 性能测试

**测试指标**:
- API响应时间 < 200ms
- 页面加载时间 < 3s
- 并发用户支持 > 1000
- 内存使用 < 500MB

**测试用例**:

```typescript
describe('性能测试', () => {
  test('API响应时间', async () => {
    const startTime = Date.now();
    
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identifier: 'test@example.com',
        password: 'Test123!'
      });

    const responseTime = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(200); // 响应时间小于200ms
  });

  test('并发用户登录', async () => {
    const promises = [];
    
    // 模拟100个并发登录请求
    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            identifier: `test${i}@example.com`,
            password: 'Test123!'
          })
      );
    }

    const results = await Promise.all(promises);
    
    // 验证所有请求都成功
    results.forEach(result => {
      expect(result.status).toBe(200);
    });
  });
});
```

### 5. 安全测试

**测试范围**:
- SQL注入防护
- XSS攻击防护
- CSRF防护
- 认证绕过测试

**测试用例**:

```typescript
describe('安全测试', () => {
  test('SQL注入防护', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identifier: "admin' OR '1'='1",
        password: "password' OR '1'='1"
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('XSS防护', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app.getHttpServer())
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        conversationId: 'conv_123',
        content: xssPayload,
        type: 'text'
      });

    expect(response.status).toBe(200);
    
    // 验证内容被正确转义
    const message = response.body.data.message;
    expect(message.content).not.toContain('<script>');
  });

  test('未授权访问', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/chat/conversations')
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
```

## 测试执行计划

### 开发阶段
1. **TDD开发**: 先写测试，再实现功能
2. **持续集成**: 每次提交都运行测试
3. **代码审查**: 测试覆盖率作为审查标准

### 测试阶段
1. **单元测试**: 开发过程中持续执行
2. **集成测试**: 功能完成后执行
3. **E2E测试**: 发布前执行
4. **性能测试**: 发布前执行
5. **安全测试**: 发布前执行

### 自动化测试
- **CI/CD集成**: GitHub Actions或GitLab CI
- **测试报告**: 自动生成测试覆盖率报告
- **监控告警**: 测试失败时发送通知

## 测试环境要求

### 开发环境
- Node.js 18+
- PostgreSQL 14+
- Redis (可选)
- Docker (可选)

### 测试数据
- 使用独立的测试数据库
- 测试数据自动清理
- 模拟真实业务场景

### 测试工具
- **前端**: Vitest, React Testing Library, Cypress
- **后端**: Jest, Supertest
- **API**: Postman, Insomnia
- **性能**: k6, Artillery
- **安全**: OWASP Z