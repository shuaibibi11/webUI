#!/bin/bash

# 政务问答系统一键部署脚本
# 使用方法: chmod +x deploy.sh && ./deploy.sh

set -e

echo "=========================================="
echo "  政务问答系统 - 一键部署脚本"
echo "=========================================="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "   运行: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose 未安装"
    exit 1
fi

echo "✅ Docker 已安装"

# 检查 Java
if ! command -v java &> /dev/null; then
    echo "❌ Java 未安装，请先安装 JDK 17"
    echo "   运行: sudo apt install openjdk-17-jdk -y"
    exit 1
fi
echo "✅ Java 已安装"

# 检查 Maven
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven 未安装，请先安装 Maven"
    echo "   运行: sudo apt install maven -y"
    exit 1
fi
echo "✅ Maven 已安装"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi
echo "✅ Node.js 已安装"

echo ""
echo ">>> 开始构建后端..."
mvn clean package -DskipTests -q

echo ""
echo ">>> 开始构建用户端前端..."
cd user-web
npm install --silent
npm run build
cd ..

echo ""
echo ">>> 开始构建管理端前端..."
cd admin-web
npm install --silent
npm run build
cd ..

echo ""
echo ">>> 启动 Docker 服务..."
docker compose up -d --build

echo ""
echo ">>> 等待服务启动..."
sleep 20

# 检查是否需要导入数据库
if [ -f "chatbot_backup.sql" ]; then
    echo ""
    read -p "是否导入数据库备份? (y/n): " import_db
    if [ "$import_db" = "y" ] || [ "$import_db" = "Y" ]; then
        echo ">>> 导入数据库..."
        docker exec -i $(docker compose ps -q mysql) mysql -uroot -ptvi888TVI chatbot < chatbot_backup.sql
        echo "✅ 数据库导入完成"
    fi
fi

echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  用户端: http://localhost:13089"
echo "  管理端: http://localhost:13085"
echo ""
echo "查看日志: docker compose logs -f"
echo "停止服务: docker compose down"
echo ""
