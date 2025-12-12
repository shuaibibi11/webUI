# 政务问答系统部署指南

## 一、服务器环境要求

### 1.1 硬件要求
- CPU: 4核以上
- 内存: 8GB以上（推荐16GB）
- 硬盘: 50GB以上

### 1.2 软件要求
- 操作系统: Ubuntu 20.04/22.04 或 CentOS 7/8
- Docker: 20.10+
- Docker Compose: 2.0+
- JDK: 17+（仅构建时需要）
- Maven: 3.8+（仅构建时需要）
- Node.js: 18+（仅构建时需要）

## 二、环境安装

### 2.1 安装 Docker
```bash
# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 验证安装
docker --version
docker compose version
```

### 2.2 安装 JDK 17（构建时需要）
```bash
# Ubuntu
sudo apt update
sudo apt install openjdk-17-jdk -y

# 验证
java -version
```

### 2.3 安装 Maven（构建时需要）
```bash
sudo apt install maven -y
mvn -version
```

### 2.4 安装 Node.js 18+（构建时需要）
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y
node -v
npm -v
```

## 三、项目部署

### 3.1 上传项目文件
将 `zhongban-web-java` 文件夹上传到服务器，例如 `/data/zhongban-web-java`

### 3.2 构建后端
```bash
cd /data/zhongban-web-java

# 构建所有 Java 模块
mvn clean package -DskipTests
```

### 3.3 构建前端
```bash
# 构建用户端前端
cd /data/zhongban-web-java/user-web
npm install
npm run build

# 构建管理端前端
cd /data/zhongban-web-java/admin-web
npm install
npm run build
```

### 3.4 启动服务
```bash
cd /data/zhongban-web-java

# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 3.5 导入数据库（如需恢复数据）
```bash
# 等待 MySQL 启动完成（约30秒）
sleep 30

# 导入数据
docker exec -i zhongban-web-java-mysql-1 mysql -uroot -ptvi888TVI chatbot < chatbot_backup.sql
```

## 四、配置说明

### 4.1 端口配置
| 服务 | 端口 | 说明 |
|------|------|------|
| user-web | 13089 | 用户端前端 |
| admin-web | 13085 | 管理端前端 |
| user-api | 11031 | 用户端API |
| admin-api | 11025 | 管理端API |
| MySQL | 3306 | 数据库（仅内部访问） |

### 4.2 修改服务器IP/域名

#### 方法一：修改 CORS 配置（推荐）
编辑以下文件，将 `192.168.3.52` 替换为新服务器IP或域名：

1. `user-api/src/main/resources/application.yml`
2. `admin-api/src/main/resources/application.yml`

找到 `cors.allowed-origins` 配置项，添加新的IP/域名：
```yaml
cors:
  allowed-origins: http://新IP:13089,http://新IP:13085,http://新域名:13089,http://新域名:13085
```

修改后需要重新构建：
```bash
mvn clean package -DskipTests
docker compose build user-api admin-api --no-cache
docker compose up -d
```

#### 方法二：使用 Nginx 反向代理（生产环境推荐）
如果使用域名访问，建议在服务器上安装 Nginx 作为反向代理。

### 4.3 修改工作流/大模型配置
编辑 `user-api/src/main/resources/application.yml`：
```yaml
# 大模型API配置
model:
  api:
    url: http://你的大模型API地址/v1/chat/completions
    key: 你的API密钥
    name: 模型名称

# bisheng工作流配置
bisheng:
  api:
    url: http://你的bisheng地址
    key: 你的API密钥
  workflow:
    id: 工作流ID
```

### 4.4 修改数据库密码
1. 修改 `docker-compose.yml` 中的 `MYSQL_ROOT_PASSWORD`
2. 修改 `user-api/src/main/resources/application.yml` 中的 `spring.datasource.password`
3. 修改 `admin-api/src/main/resources/application.yml` 中的 `spring.datasource.password`

## 五、Nginx 外部代理配置（可选）

如果需要通过 80/443 端口访问，可以在服务器上安装 Nginx：

```bash
sudo apt install nginx -y
```

创建配置文件 `/etc/nginx/sites-available/zhongban`:
```nginx
# 用户端
server {
    listen 80;
    server_name user.yourdomain.com;  # 替换为你的域名

    location / {
        proxy_pass http://127.0.0.1:13089;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE 支持
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}

# 管理端
server {
    listen 80;
    server_name admin.yourdomain.com;  # 替换为你的域名

    location / {
        proxy_pass http://127.0.0.1:13085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/zhongban /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 六、常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f user-api
docker compose logs -f admin-api

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 重新构建并启动
docker compose up -d --build

# 进入 MySQL
docker exec -it zhongban-web-java-mysql-1 mysql -uroot -ptvi888TVI chatbot
```

## 七、故障排查

### 7.1 服务无法启动
```bash
# 查看详细日志
docker compose logs user-api
docker compose logs admin-api

# 检查端口占用
netstat -tlnp | grep -E "13089|13085|11031|11025"
```

### 7.2 数据库连接失败
```bash
# 检查 MySQL 是否启动
docker compose ps mysql

# 检查 MySQL 日志
docker compose logs mysql
```

### 7.3 前端无法访问API
1. 检查 CORS 配置是否包含当前访问的域名/IP
2. 检查浏览器控制台是否有跨域错误
3. 检查 Nginx 代理配置是否正确

## 八、备份与恢复

### 8.1 备份数据库
```bash
docker exec zhongban-web-java-mysql-1 mysqldump -uroot -ptvi888TVI chatbot > backup_$(date +%Y%m%d).sql
```

### 8.2 恢复数据库
```bash
docker exec -i zhongban-web-java-mysql-1 mysql -uroot -ptvi888TVI chatbot < backup_20241212.sql
```

## 九、性能优化配置

当前已配置的高并发优化：
- MySQL: max_connections=500, innodb_buffer_pool_size=1G
- HikariCP: maximum-pool-size=100 (user-api), 50 (admin-api)
- JVM: -Xmx2g (user-api), -Xmx1g (admin-api), G1GC
- Nginx: keepalive_timeout=300s, proxy_read_timeout=300s

如需调整，请修改 `docker-compose.yml` 和对应的 `application.yml` 文件。
