# 企业级认证与聊天系统部署指南

## 部署架构

```mermaid
graph TD
  A[用户] --> B[CDN]
  B --> C[负载均衡器]
  C --> D[应用服务器]
  D --> E[(PostgreSQL)]
  D --> F[Redis缓存]
  D --> G[文件存储]
  
  subgraph "前端部署"
    B
  end
  
  subgraph "后端部署"
    C
    D
  end
  
  subgraph "数据存储"
    E
    F
    G
  end
```

## 环境要求

### 系统要求
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8
- **内存**: 最少4GB，推荐8GB
- **CPU**: 最少2核，推荐4核
- **存储**: 最少50GB SSD
- **网络**: 稳定的外网连接

### 软件依赖
- **Node.js**: 18.x LTS
- **PostgreSQL**: 14.x
- **Redis**: 7.x
- **Nginx**: 1.20+
- **PM2**: 最新版
- **Docker**: 20.x (可选)
- **Docker Compose**: 2.x (可选)

## 环境准备

### 1. 系统更新

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. 安装Node.js

```bash
# 使用NodeSource安装
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 安装PostgreSQL

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
```

```sql
-- PostgreSQL命令
CREATE DATABASE enterprise_chat_prod;
CREATE USER chat_app WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE enterprise_chat_prod TO chat_app;
\q
```

### 4. 安装Redis

```bash
# Ubuntu/Debian
sudo apt install redis-server

# 启动服务
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 5. 安装Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

## 应用部署

### 1. 代码部署

```bash
# 创建应用目录
sudo mkdir -p /var/www/enterprise-chat
cd /var/www/enterprise-chat

# 克隆代码
sudo git clone https://github.com/your-org/enterprise-chat.git .

# 设置权限
sudo chown -R www-data:www-data /var/www/enterprise-chat
sudo chmod -R 755 /var/www/enterprise-chat
```

### 2. 后端部署

```bash
cd /var/www/enterprise-chat/backend

# 安装依赖
npm ci --only=production

# 构建应用
npm run build

# 数据库迁移
npx prisma migrate deploy

# 生成Prisma客户端
npx prisma generate

# 创建环境变量文件
cp .env.example .env.production
```

**生产环境配置 (.env.production)**
```env
NODE_ENV=production
PORT=3001

# 数据库配置
DATABASE_URL="postgresql://chat_app:your_secure_password@localhost:5432/enterprise_chat_prod"

# JWT配置
JWT_SECRET="your_production_jwt_secret_key"
JWT_EXPIRES_IN="7d"

# Redis配置
REDIS_URL="redis://localhost:6379"

# 短信服务配置
SMS_API_KEY="your_sms_api_key"
SMS_API_SECRET="your_sms_api_secret"

# 文件上传配置
UPLOAD_MAX_SIZE=10485760
UPLOAD_PATH="/var/www/enterprise-chat/uploads"

# 日志配置
LOG_LEVEL="info"
LOG_FILE="/var/log/enterprise-chat/app.log"
```

### 3. 前端部署

```bash
cd /var/www/enterprise-chat/frontend

# 安装依赖
npm ci --only=production

# 创建生产环境配置
cp .env.example .env.production
```

**前端生产环境配置 (.env.production)**
```env
NODE_ENV=production
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com
VITE_APP_NAME="和元智擎"
VITE_APP_VERSION="1.3.1"
```

```bash
# 构建前端
npm run build

# 复制构建文件到Nginx目录
sudo cp -r dist/* /var/www/html/
```

### 4. 使用PM2管理进程

```bash
# 全局安装PM2
sudo npm install -g pm2

# 创建PM2配置文件
cd /var/www/enterprise-chat/backend
```

**ecosystem.config.js**
```javascript
module.exports = {
  apps: [{
    name: 'enterprise-chat-api',
    script: 'dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/enterprise-chat/error.log',
    out_file: '/var/log/enterprise-chat/out.log',
    log_file: '/var/log/enterprise-chat/combined.log',
    time: true
  }]
};
```

```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机启动
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u www-data --hp /home/www-data
```

## Nginx配置

### 1. 前端配置

**文件**: `/etc/nginx/sites-available/enterprise-chat`

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # 强制HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL配置
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 前端文件
    root /var/www/html;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
        
        # 缓存控制
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket代理
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 文件上传限制
    client_max_body_size 10M;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
}
```

### 2. 启用配置

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/enterprise-chat /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

## SSL证书配置

### 1. 使用Let's Encrypt (推荐)

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo crontab -e
```

```cron
# 添加定时任务
0 2 * * * /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx
```

### 2. 手动配置SSL证书

```bash
# 创建证书目录
sudo mkdir -p /etc/ssl/certs
sudo mkdir -p /etc/ssl/private

# 复制证书文件
sudo cp yourdomain.com.crt /etc/ssl/certs/
sudo cp yourdomain.com.key /etc/ssl/private/

# 设置权限
sudo chmod 644 /etc/ssl/certs/yourdomain.com.crt
sudo chmod 600 /etc/ssl/private/yourdomain.com.key
```

## Docker部署 (可选)

### 1. Docker Compose配置

**docker-compose.yml**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: chat_postgres
    environment:
      POSTGRES_DB: enterprise_chat_prod
      POSTGRES_USER: chat_app
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - chat_network

  redis:
    image: redis:7-alpine
    container_name: chat_redis
    ports:
      - "6379:6379"
    networks:
      - chat_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chat_backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://chat_app:your_secure_password@postgres:5432/enterprise_chat_prod
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret_key
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    networks:
      - chat_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: chat_frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - chat_network

volumes:
  postgres_data:

networks:
  chat_network:
    driver: bridge
```

### 2. 后端Dockerfile

**backend/Dockerfile**
```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### 3. 前端Dockerfile

**frontend/Dockerfile**
```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## 监控和日志

### 1. 应用监控

```bash
# 安装PM2监控
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# 查看应用状态
pm2 status
pm2 logs
pm2 monit
```

### 2. 系统监控

```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 查看系统资源
htop
iotop
nethogs
```

### 3. 日志管理

```bash
# 创建日志目录
sudo mkdir -p /var/log/enterprise-chat
sudo chown www-data:www-data /var/log/enterprise-chat

# 配置logrotate
sudo nano /etc/logrotate.d/enterprise-chat
```

```
/var/log/enterprise-chat/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload all
    endscript
}
```

## 备份策略

### 1. 数据库备份

```bash
#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="enterprise_chat_prod"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U chat_app -h localhost $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### 2. 文件备份

```bash
#!/bin/bash
# 文件备份脚本

BACKUP_DIR="/backup/files"
SOURCE_DIR="/var/www/enterprise-chat/uploads"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz $SOURCE_DIR

# 删除30天前的备份
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +30 -delete
```

### 3. 自动备份

```bash
# 添加定时任务
crontab -e
```

```cron
# 数据库备份 (每天凌晨2点)
0 2 * * * /backup/scripts/db_backup.sh

# 文件备份 (每周日凌晨3点)
0 3 * * 0 /backup/scripts/files_backup.sh
```

## 性能优化

### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- 配置优化
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
```

### 2. Redis优化

```bash
# 配置Redis
sudo nano /etc/redis/redis.conf
```

```
maxmemory 256mb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
```

### 3. Node.js优化

```javascript
// 集群模式
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // 启动应用
  require('./dist/main.js');
}
```

## 安全加固

### 1. 防火墙配置

```bash
# 安装UFW
sudo apt install ufw

# 配置防火墙
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. 系统安全

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置自动更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 禁用root登录
sudo nano /etc/ssh/sshd_config
```

```
PermitRootLogin no
PasswordAuthentication no
```

### 3. 应用安全

- 定期更新依赖包
- 使用HTTPS强制加密
- 配置CSP安全头
- 限制API访问频率
- 启用审计日志

## 故障排查

### 1. 常见问题

**应用无法启动**
```bash
# 检查日志
pm2 logs

# 检查端口占用
netstat -tlnp | grep 3001

# 检查数据库连接
npx prisma db ping
```

**数据库连接失败**
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查数据库配置
sudo -u postgres psql -l

# 检查用户权限
sudo -u postgres psql -c "\du"
```

**Nginx配置错误**
```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 重载配置
sudo systemctl reload nginx
```

### 2. 性能问题

**内存使用过高**
```bash
# 查看内存使用
free -h

# 查看进程内存
ps aux --sort=-%mem | head

# 检查内存泄漏
valgrind --tool=memcheck node dist/main.js
```

**数据库查询慢**
```bash
# 查看慢查询日志
tail -f /var/log/postgresql/postgresql-slow.log

# 分析查询计划
EXPLAIN ANALYZE SELECT * FROM messages WHERE conversation_id = 'xxx';
```

## 维护计划

### 每日任务
- [ ] 检查应用状态
- [ ] 查看错误日志
- [ ] 监控资源使用
- [ ] 检查数据库连接

### 每周任务
- [ ] 清理日志文件
- [ ] 更新系统包
- [ ] 备份数据库
- [ ] 性能监控

### 每月任务
- [ ] 安全扫描
- [ ] 依赖包更新
- [ ] 备份恢复测试
- [ ] 性能优化

### 每季度任务
- [ ] 安全审计
- [ ] 灾难恢复演练
- [ ] 容量规划
- [ ] 文档更新