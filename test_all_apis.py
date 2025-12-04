#!/usr/bin/env python3
"""
全面测试所有前后端API接口
"""
import requests
import json
import sys
from typing import Dict, Optional

# 服务地址配置
ADMIN_API = "http://localhost:11025/api"
USER_API = "http://localhost:11031/api"
ADMIN_WEB = "http://localhost:13085"
USER_WEB = "http://localhost:13089"

# 测试结果统计
results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "errors": []
}

def test_endpoint(name: str, method: str, url: str, expected_status: int = 200, 
                 headers: Optional[Dict] = None, data: Optional[Dict] = None, 
                 description: str = "") -> bool:
    """测试单个API端点"""
    results["total"] += 1
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=5)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=5)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=5)
        else:
            print(f"❌ {name}: 不支持的HTTP方法 {method}")
            results["failed"] += 1
            results["errors"].append(f"{name}: 不支持的HTTP方法")
            return False
        
        if response.status_code == expected_status:
            print(f"✅ {name}: {method} {url} - {response.status_code} {description}")
            results["passed"] += 1
            return True
        else:
            print(f"❌ {name}: {method} {url} - 期望 {expected_status}, 实际 {response.status_code}")
            try:
                error_data = response.json()
                print(f"   错误信息: {error_data}")
            except:
                print(f"   响应内容: {response.text[:200]}")
            results["failed"] += 1
            results["errors"].append(f"{name}: 期望 {expected_status}, 实际 {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ {name}: {method} {url} - 连接失败（服务可能未启动）")
        results["failed"] += 1
        results["errors"].append(f"{name}: 连接失败")
        return False
    except Exception as e:
        print(f"❌ {name}: {method} {url} - 异常: {str(e)}")
        results["failed"] += 1
        results["errors"].append(f"{name}: {str(e)}")
        return False

def main():
    print("=" * 80)
    print("开始测试所有前后端API接口")
    print("=" * 80)
    print()
    
    # 1. 测试服务健康检查
    print("【1. 服务健康检查】")
    test_endpoint("admin-api健康检查", "GET", f"{ADMIN_API}/actuator/health", 200, description="admin-api服务状态")
    test_endpoint("user-api健康检查", "GET", f"{USER_API}/actuator/health", 200, description="user-api服务状态")
    test_endpoint("admin-web前端", "GET", f"{ADMIN_WEB}/", 200, description="admin-web前端页面")
    test_endpoint("user-web前端", "GET", f"{USER_WEB}/", 200, description="user-web前端页面")
    print()
    
    # 2. 测试用户API（user-api）
    print("【2. 用户API测试 (user-api)】")
    
    # 2.1 用户注册
    test_data = {
        "username": "testuser_api",
        "phone": "13800000001",
        "email": "testuser_api@test.com",
        "password": "Test123456",
        "realName": "测试用户",
        "idCard": "110101199001011234"
    }
    test_endpoint("用户注册", "POST", f"{USER_API}/users/register", 201, data=test_data, description="注册新用户")
    
    # 2.2 用户登录
    login_data = {
        "username": "testuser_api",
        "password": "Test123456"
    }
    login_response = requests.post(f"{USER_API}/users/login", json=login_data, timeout=5)
    user_token = None
    if login_response.status_code == 200:
        try:
            login_result = login_response.json()
            user_token = login_result.get("token")
            print(f"✅ 用户登录成功，获取token: {user_token[:20]}...")
            results["passed"] += 1
        except:
            print(f"❌ 用户登录响应解析失败")
            results["failed"] += 1
    else:
        print(f"❌ 用户登录失败: {login_response.status_code}")
        results["failed"] += 1
    
    # 2.3 需要认证的接口
    user_headers = {"Authorization": f"Bearer {user_token}"} if user_token else {}
    test_endpoint("获取用户信息", "GET", f"{USER_API}/users/info", 200 if user_token else 401, 
                 headers=user_headers, description="获取当前用户信息")
    test_endpoint("获取可用模型", "GET", f"{USER_API}/models", 200, description="获取模型列表")
    test_endpoint("获取模型列表(备用路径)", "GET", f"{USER_API}/api/models", 200, description="获取模型列表(备用路径)")
    print()
    
    # 3. 测试管理API（admin-api）
    print("【3. 管理API测试 (admin-api)】")
    
    # 3.1 管理员登录
    admin_login_data = {
        "username": "admin",
        "password": "Abcdef1!"
    }
    admin_login_response = requests.post(f"{ADMIN_API}/admin/auth/login", json=admin_login_data, timeout=5)
    admin_token = None
    if admin_login_response.status_code == 200:
        try:
            admin_result = admin_login_response.json()
            admin_token = admin_result.get("token")
            print(f"✅ 管理员登录成功，获取token: {admin_token[:20] if admin_token else 'None'}...")
            results["passed"] += 1
        except:
            print(f"❌ 管理员登录响应解析失败")
            results["failed"] += 1
    else:
        print(f"❌ 管理员登录失败: {admin_login_response.status_code}")
        print(f"   尝试创建管理员账号...")
        bootstrap_response = requests.post(f"{ADMIN_API}/admin/auth/bootstrap-admin", timeout=5)
        if bootstrap_response.status_code == 200:
            print(f"✅ 管理员账号创建/更新成功")
            # 再次尝试登录
            admin_login_response = requests.post(f"{ADMIN_API}/admin/auth/login", json=admin_login_data, timeout=5)
            if admin_login_response.status_code == 200:
                try:
                    admin_result = admin_login_response.json()
                    admin_token = admin_result.get("token")
                    print(f"✅ 管理员登录成功，获取token: {admin_token[:20] if admin_token else 'None'}...")
                    results["passed"] += 1
                except:
                    pass
    
    # 3.2 需要认证的管理接口
    admin_headers = {"Authorization": f"Bearer {admin_token}"} if admin_token else {}
    test_endpoint("获取统计信息", "GET", f"{ADMIN_API}/admin/stats", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取系统统计")
    test_endpoint("获取用户列表", "GET", f"{ADMIN_API}/admin/users", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取所有用户")
    test_endpoint("获取用户统计", "GET", f"{ADMIN_API}/admin/users/stats", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取用户统计")
    test_endpoint("获取对话列表", "GET", f"{ADMIN_API}/admin/conversations", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取对话列表")
    test_endpoint("获取模型列表", "GET", f"{ADMIN_API}/admin/models", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取模型配置")
    test_endpoint("获取反馈列表", "GET", f"{ADMIN_API}/admin/feedbacks", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取反馈列表")
    test_endpoint("获取审计日志", "GET", f"{ADMIN_API}/admin/logs", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取审计日志")
    test_endpoint("获取工作流列表", "GET", f"{ADMIN_API}/admin/workflows", 200 if admin_token else 401, 
                 headers=admin_headers, description="获取工作流配置")
    print()
    
    # 4. 测试前端代理
    print("【4. 前端代理测试】")
    test_endpoint("admin-web代理admin-api", "GET", f"{ADMIN_WEB}/api/admin/stats", 
                 200 if admin_token else 401, headers=admin_headers, description="admin-web代理到admin-api")
    test_endpoint("admin-web代理user-api", "GET", f"{ADMIN_WEB}/api/models", 200, 
                 description="admin-web代理到user-api")
    test_endpoint("user-web代理user-api", "GET", f"{USER_WEB}/api/models", 200, 
                 description="user-web代理到user-api")
    print()
    
    # 5. 测试聊天API（需要认证）
    print("【5. 聊天API测试】")
    if user_token:
        chat_data = {
            "content": "你好",
            "modelId": None
        }
        test_endpoint("发送聊天消息", "POST", f"{USER_API}/api/chat", 201, 
                     headers=user_headers, data=chat_data, description="发送聊天消息")
    else:
        print("⚠️  跳过聊天API测试（需要用户token）")
    print()
    
    # 6. 测试其他Controller
    print("【6. 其他Controller测试】")
    test_endpoint("HealthController (admin-api)", "GET", f"{ADMIN_API}/health", 200, description="admin-api健康检查")
    test_endpoint("HealthController (user-api)", "GET", f"{USER_API}/health", 200, description="user-api健康检查")
    print()
    
    # 输出测试结果
    print("=" * 80)
    print("测试结果汇总")
    print("=" * 80)
    print(f"总测试数: {results['total']}")
    print(f"通过: {results['passed']} ✅")
    print(f"失败: {results['failed']} ❌")
    print(f"通过率: {results['passed']/results['total']*100:.1f}%")
    print()
    
    if results['errors']:
        print("错误详情:")
        for error in results['errors']:
            print(f"  - {error}")
    
    print()
    if results['failed'] == 0:
        print("🎉 所有测试通过！")
        return 0
    else:
        print(f"⚠️  有 {results['failed']} 个测试失败")
        return 1

if __name__ == "__main__":
    sys.exit(main())

