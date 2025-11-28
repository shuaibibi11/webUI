#!/bin/bash

echo "=========================================="
echo "  创新凡星系统 - Docker容器启动脚本"
echo "=========================================="
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "📦 正在构建和启动容器..."
echo ""

# 使用docker-compose或docker compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

# 停止并删除旧容器（如果存在）
echo "🧹 清理旧容器..."
$COMPOSE_CMD down

# 构建并启动容器
echo "🚀 构建镜像并启动服务..."
$COMPOSE_CMD up -d --build

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态检查:"
$COMPOSE_CMD ps

echo ""
echo "=========================================="
echo "  ✅ 服务启动完成！"
echo "=========================================="
echo ""
echo "🌐 访问地址:"
echo "  - 前端应用:    http://localhost:11000"
echo "  - 后端API:     http://localhost:11001"
echo "  - 数据库:      localhost:11002"
echo ""
echo "📝 服务端口映射:"
echo "  - 前端 (Nginx):  11000 -> 80"
echo "  - 后端 (Node):   11013 -> 3013"
echo "  - 数据库 (PG):   11002 -> 5432"
echo ""
echo "🔧 常用命令:"
echo "  - 查看日志:     $COMPOSE_CMD logs -f"
echo "  - 停止服务:     $COMPOSE_CMD down"
echo "  - 重启服务:     $COMPOSE_CMD restart"
echo "  - 查看状态:     $COMPOSE_CMD ps"
echo ""
echo "💡 提示: 首次启动需要初始化数据库，请稍等片刻..."
echo ""
