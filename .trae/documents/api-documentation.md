# 企业级认证与聊天系统 API 文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证相关 API

### 用户注册

**POST** `/auth/register`

用户注册接口，需要完成手机号验证。

#### 请求参数

```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "password": "SecurePass123!",
  "verificationCode": "123456"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名，4-20位字符 |
| email | string | 是 | 邮箱地址 |
| phone | string | 是 | 手机号，11位数字 |
| password | string | 是 | 密码，8-20位，需包含大小写字母和特殊字符 |
| verificationCode | string | 是 | 6位短信验证码 |

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "phone": "13800138000",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**错误响应** (400)

```json
{
  "success": false,
  "message": "用户名已存在",
  "errorCode": "USERNAME_EXISTS"
}
```

### 用户登录

**POST** `/auth/login`

用户登录接口，支持邮箱或手机号登录。

#### 请求参数

```json
{
  "identifier": "zhangsan@example.com",
  "password": "SecurePass123!"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| identifier | string | 是 | 邮箱或手机号 |
| password | string | 是 | 密码 |

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "phone": "13800138000",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 发送短信验证码

**POST** `/auth/send-sms`

发送短信验证码，用于注册验证。

#### 请求参数

```json
{
  "phone": "13800138000"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "message": "验证码已发送",
  "data": {
    "expireTime": 300
  }
}
```

### 刷新Token

**POST** `/auth/refresh`

刷新JWT令牌。

#### 请求头

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 聊天相关 API

### 获取会话列表

**GET** `/chat/conversations`

获取用户的会话列表。

#### 请求头

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认20 |

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "conv_123",
        "title": "ERP数据管理应用_Demo数据",
        "type": "private",
        "lastMessage": {
          "content": "天地自动化-云平台管设备项目中的采购订单...",
          "createdAt": "2024-01-15T10:30:00.000Z"
        },
        "unreadCount": 0,
        "createdAt": "2024-01-15T09:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### 获取消息列表

**GET** `/chat/conversations/{conversationId}/messages`

获取指定会话的消息列表。

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| conversationId | string | 是 | 会话ID |

#### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认50 |
| before | string | 否 | 获取此时间之前的消息 |

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "conversationId": "conv_123",
        "senderId": "user_123",
        "content": "天地自动化-云平台管设备项目中的采购订单...",
        "type": "text",
        "status": "sent",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "sender": {
          "id": "user_123",
          "username": "张三",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 200,
      "pages": 4
    }
  }
}
```

### 发送消息

**POST** `/chat/messages`

发送新消息。

#### 请求头

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 请求参数

```json
{
  "conversationId": "conv_123",
  "content": "这是一条测试消息",
  "type": "text"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| conversationId | string | 是 | 会话ID |
| content | string | 是 | 消息内容 |
| type | string | 是 | 消息类型：text, image, file |

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "message": "消息发送成功",
  "data": {
    "message": {
      "id": "msg_124",
      "conversationId": "conv_123",
      "senderId": "user_123",
      "content": "这是一条测试消息",
      "type": "text",
      "status": "sending",
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  }
}
```

### 创建新会话

**POST** `/chat/conversations`

创建新的会话。

#### 请求头

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 请求参数

```json
{
  "title": "新项目讨论",
  "type": "private"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 会话标题 |
| type | string | 是 | 会话类型：private, group |

#### 响应参数

**成功响应** (200)

```json
{
  "success": true,
  "message": "会话创建成功",
  "data": {
    "conversation": {
      "id": "conv_124",
      "title": "新项目讨论",
      "type": "private",
      "createdAt": "2024-01-15T10:40:00.000Z"
    }
  }
}
```

## 错误码定义

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| INVALID_REQUEST | 请求参数错误 | 400 |
| USERNAME_EXISTS | 用户名已存在 | 400 |
| EMAIL_EXISTS | 邮箱已存在 | 400 |
| PHONE_EXISTS | 手机号已存在 | 400 |
| INVALID_CREDENTIALS | 用户名或密码错误 | 401 |
| TOKEN_EXPIRED | Token已过期 | 401 |
| TOKEN_INVALID | Token无效 | 401 |
| SMS_CODE_ERROR | 短信验证码错误 | 400 |
| SMS_CODE_EXPIRED | 短信验证码已过期 | 400 |
| USER_NOT_FOUND | 用户不存在 | 404 |
| CONVERSATION_NOT_FOUND | 会话不存在 | 404 |
| PERMISSION_DENIED | 权限不足 | 403 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 | 429 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

## 分页规范

列表接口统一支持分页参数：

- `page`: 页码，从1开始
- `limit`: 每页数量，默认20，最大100

分页响应格式：

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## WebSocket事件

### 连接事件

**连接建立**
```javascript
socket.emit('join', { conversationId: 'conv_123' });
```

**新消息事件**
```javascript
socket.on('newMessage', (data) => {
  console.log('收到新消息:', data);
});
```

**消息状态更新**
```javascript
socket.on('messageStatus', (data) => {
  console.log('消息状态更新:', data);
});
```

### 事件格式

**新消息事件**
```json
{
  "event": "newMessage",
  "data": {
    "message": {
      "id": "msg_125",
      "conversationId": "conv_123",
      "senderId": "user_456",
      "content": "收到消息",
      "type": "text",
      "status": "sent",
      "createdAt": "2024-01-15T10:45:00.000Z",
      "sender": {
        "id": "user_456",
        "username": "李四"
      }
    }
  }
}
