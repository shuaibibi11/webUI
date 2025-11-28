# 创新凡星系统 - Docker部署指南

## 📋 系统架构

本项目采用Docker容器化部署，包含以下服务：

- **前端服务** (Frontend): React + Vite + Nginx
- **后端服务** (Backend): Node.js + Express + TypeScript
- **数据库服务** (Database): PostgreSQL 15

## 🚀 快速启动

### 方式一：使用启动脚本（推荐）

```bash
# 给脚本添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方式二：使用Docker Compose命令

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 或者使用新版本Docker
docker compose up -d --build
```

## 🌐 访问地址

启动成功后，可以通过以下地址访问：

| 服务 | 访问地址 | 说明 |
|------|---------|------|
| **前端应用** | http://localhost:11000 | 用户界面（登录/注册/聊天） |
| **后端API** | http://localhost:11001 | RESTful API接口 |
| **数据库** | localhost:11002 | PostgreSQL数据库 |

### 端口映射详情

```
宿主机端口  ->  容器端口  ->  服务
11000      ->  80        ->  前端 (Nginx)
11001      ->  3001      ->  后端 (Node.js)
11002      ->  5432      ->  数据库 (PostgreSQL)
```

## 📁 项目结构

```
webUI/
├── frontend/          # 前端服务
│   ├── Dockerfile
│   ├── nginx.conf     # Nginx配置
│   └── src/           # React源代码
├── backend/           # 后端服务
│   ├── Dockerfile
│   ├── start.sh       # 启动脚本
│   ├── prisma/        # 数据库Schema
│   └── src/           # Node.js源代码
├── docker-compose.yml # Docker编排配置
└── start.sh           # 一键启动脚本
```

## 🔧 常用命令

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启所有服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### 数据库管理

```bash
# 进入数据库容器
docker-compose exec db psql -U postgres -d chatbot

# 运行数据库迁移（如果需要）
docker-compose exec backend npx prisma migrate deploy

# 打开Prisma Studio（数据库管理界面）
docker-compose exec backend npx prisma studio
# 然后访问 http://localhost:5555
```

### 容器管理

```bash
# 重新构建镜像
docker-compose build --no-cache

# 删除所有容器和卷（⚠️ 会删除数据）
docker-compose down -v

# 查看容器资源使用情况
docker stats
```

## 🔐 环境变量配置

### 后端环境变量

在 `docker-compose.yml` 中配置：

```yaml
environment:
  - DATABASE_URL=postgresql://postgres:postgres@db:5432/chatbot
  - JWT_SECRET=your-secret-key-change-in-production  # ⚠️ 生产环境请修改
  - PORT=3001
```

### 数据库环境变量

```yaml
environment:
  - POSTGRES_USER=postgres
  - POSTGRES_PASSWORD=postgres  # ⚠️ 生产环境请修改
  - POSTGRES_DB=chatbot
```

⚠️ **重要**: 生产环境部署前，请务必修改以下敏感信息：
- `JWT_SECRET`: JWT密钥
- `POSTGRES_PASSWORD`: 数据库密码

## 📊 服务健康检查

### 检查服务是否正常运行

```bash
# 检查前端
curl http://localhost:11000

# 检查后端健康接口
curl http://localhost:11001/api/health

# 检查数据库连接
docker-compose exec db pg_isready -U postgres
```

## 🐛 故障排查

### 1. 容器启动失败

```bash
# 查看详细日志
docker-compose logs

# 检查端口是否被占用
netstat -tulpn | grep -E '11000|11001|11002'
```

### 2. 数据库连接失败

```bash
# 检查数据库是否启动
docker-compose ps db

# 检查数据库日志
docker-compose logs db

# 等待数据库完全启动（健康检查通过）
docker-compose exec db pg_isready -U postgres
```

### 3. 前端无法访问后端API

- 检查 `frontend/nginx.conf` 中的代理配置
- 确保后端服务正常运行：`docker-compose ps backend`
- 检查网络连接：`docker-compose network ls`

### 4. 重新初始化数据库

```bash
# 停止服务
docker-compose down

# 删除数据卷
docker volume rm webui_postgres-data

# 重新启动
docker-compose up -d
```

## 📝 开发模式

如果需要本地开发（不使用Docker）：

### 前端开发

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:11000
```

### 后端开发

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# API运行在 http://localhost:3001
```

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并启动
docker-compose up -d --build

# 3. 运行数据库迁移（如果有）
docker-compose exec backend npx prisma migrate deploy
```

## 📞 技术支持

如遇到问题，请检查：
1. Docker和Docker Compose版本是否满足要求
2. 端口11000、11001、11002是否被占用
3. 系统资源（内存、磁盘）是否充足
4. 查看服务日志定位具体错误

---

**祝使用愉快！** 🎉

