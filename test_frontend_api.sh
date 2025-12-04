#!/bin/bash

echo "=== 前端API调用验证测试 ==="
echo ""

# 测试管理端登录API直接调用
echo "1. 测试管理端登录API直接调用..."
curl -s -X POST http://localhost:11025/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -w "\n状态码: %{http_code}\n"

echo ""
echo "2. 测试前端代理配置..."
# 测试通过前端代理访问管理端API
curl -s -X POST http://localhost:13085/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -w "\n状态码: %{http_code}\n"

echo ""
echo "3. 测试用户端登录API直接调用..."
# 测试用户端登录API
curl -s -X POST http://localhost:11031/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -w "\n状态码: %{http_code}\n"

echo ""
echo "=== 测试完成 ==="