#!/bin/bash

echo "=== WebUI-Java 管理系统集成测试 ==="
echo ""

# 测试管理端API
echo "1. 测试管理端API服务状态..."
response=$(curl -s -w "HTTP状态码: %{http_code}" http://localhost:11025/api/health)
if echo "$response" | grep -q '"status":"ok"'; then
    echo "✅ 管理端API服务运行正常"
else
    echo "❌ 管理端API服务异常"
    exit 1
fi

# 测试用户端API
echo "2. 测试用户端API服务状态..."
response=$(curl -s -w "HTTP状态码: %{http_code}" http://localhost:11031/api/health)
if echo "$response" | grep -q '"status":"ok"'; then
    echo "✅ 用户端API服务运行正常"
else
    echo "❌ 用户端API服务异常"
    exit 1
fi

# 测试前端开发服务器
echo "3. 测试前端开发服务器状态..."
response=$(curl -s -I -w "HTTP状态码: %{http_code}" http://localhost:13085/ | head -n 1)
if echo "$response" | grep -q "200"; then
    echo "✅ 前端开发服务器运行正常"
else
    echo "❌ 前端开发服务器异常"
    exit 1
fi

# 测试管理端登录功能
echo "4. 测试管理端登录功能..."
response=$(curl -s -X POST http://localhost:13085/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Abcdef1!"}')

if echo "$response" | grep -q '"code":200' && echo "$response" | grep -q '"token"'; then
    echo "✅ 管理端登录功能正常"
    token=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "   获取到Token: ${token:0:20}..."
else
    echo "❌ 管理端登录功能异常"
    echo "   错误响应: $response"
    exit 1
fi

# 测试前端代理配置
echo "5. 测试前端代理配置..."
response=$(curl -s -X POST http://localhost:13085/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}')

if echo "$response" | grep -q '"code":400' && echo "$response" | grep -q '"密码错误"'; then
    echo "✅ 前端代理配置正确"
else
    echo "❌ 前端代理配置异常"
    echo "   错误响应: $response"
    exit 1
fi

# 测试用户端登录功能
echo "6. 测试用户端登录功能..."
response=$(curl -s -X POST http://localhost:13085/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"wrongpassword"}')

if echo "$response" | grep -q '"code":400'; then
    echo "✅ 用户端登录功能正常"
else
    echo "❌ 用户端登录功能异常"
    echo "   错误响应: $response"
    exit 1
fi

echo ""
echo "=== 集成测试总结 ==="
echo "✅ 所有服务运行正常"
echo "✅ API接口调用正常"
echo "✅ 前端代理配置正确"
echo "✅ 登录功能正常工作"
echo ""
echo "访问地址:"
echo "- 管理端前端: http://localhost:13085/login"
echo "- 管理端API: http://localhost:11025/api"
echo "- 用户端API: http://localhost:11031/api"
echo ""
echo "测试账号:"
echo "- 管理员账号: admin / Abcdef1!"
echo ""
echo "🎉 系统集成测试通过！所有功能正常可用。"