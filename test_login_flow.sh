#!/bin/bash

echo "=== 测试管理端登录API (带上下文路径) ==="

# 测试管理端登录API（带上下文路径）
echo "测试管理端登录API (直接调用，带上下文路径)..."
response=$(curl -s -w "\nHTTP状态码: %{http_code}\n" -X POST http://localhost:11025/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Abcdef1!"}')

echo "响应内容:"
echo "$response"

# 检查响应中是否包含token
if echo "$response" | grep -q '"token"'; then
    echo "✅ Token获取成功"
else
    echo "❌ Token获取失败"
fi

echo -e "\n=== 测试前端代理配置 ==="

# 测试前端代理配置
echo "测试前端代理配置 (通过前端代理)..."
response=$(curl -s -w "\nHTTP状态码: %{http_code}\n" -X POST http://localhost:13085/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Abcdef1!"}')

echo "响应内容:"
echo "$response"

echo -e "\n=== 测试管理端API健康检查 ==="

# 测试管理端API健康检查
echo "测试管理端API健康检查..."
response=$(curl -s -w "\nHTTP状态码: %{http_code}\n" http://localhost:11025/api/health)

echo "响应内容:"
echo "$response"

echo -e "\n=== 测试总结 ==="
echo "管理端API运行在: http://localhost:11025/api"
echo "前端开发服务器运行在: http://localhost:13085"
echo "用户端API运行在: http://localhost:11031"
echo ""
echo "前端登录页面: http://localhost:13085/login"
echo "管理端仪表板: http://localhost:13085/dashboard"
echo ""
echo "前端代理配置说明:"
echo "- 前端代理将 /api/admin/* 转发到 http://localhost:11025/api/admin/*"
echo "- 前端代理将 /api/users/* 转发到 http://localhost:11031/api/users/*"