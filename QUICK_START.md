# 🚀 快速启动指南

## 一键启动

```bash
# 方式一：使用启动脚本（推荐）
./start.sh

# 方式二：使用Docker Compose
docker-compose up -d --build
```

## 📍 访问地址

启动成功后，访问以下地址：

### 🌐 前端应用
**http://localhost:11000**

- 登录页面
- 注册页面  
- 聊天界面
- 反馈页面
- 管理后台

### 🔧 后端API
**http://localhost:11013**

- API基础路径: `http://localhost:11013/api`
- 健康检查: `http://localhost:11013/api/health`

### 💾 数据库
**localhost:11002**

- 用户名: `postgres`
- 密码: `postgres`
- 数据库: `chatbot`

## 📊 端口映射

| 宿主机端口 | 容器端口 | 服务 |
|-----------|---------|------|
| 11000 | 80 | 前端 (Nginx) |
| 11013 | 3013 | 后端 (Node.js) |
| 11002 | 5432 | 数据库 (PostgreSQL) |

## 📋 查看详细信息

运行以下命令查看完整的访问信息：

```bash
./show-info.sh
```

## 🔧 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart
```

---

**详细文档请查看**: [README_DOCKER.md](./README_DOCKER.md)
