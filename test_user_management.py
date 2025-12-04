#!/usr/bin/env python3
"""
用户管理功能测试脚本
测试用户注册、登录、信息查询、密码重置等功能
"""

import requests
import json
import time
import sys
from datetime import datetime

# API配置
USER_API_BASE = "http://localhost:11031/api/users"
ADMIN_API_BASE = "http://localhost:11025/api/admin"

# 测试用户信息
test_users = [
    {
        "username": "testuser_001",
        "password": "Test123456!",
        "email": "test001@example.com",
        "phone": "13800138010",
        "realName": "测试用户001",
        "idCard": "110101199001011001"
    },
    {
        "username": "testuser_002",
        "password": "Test123456!",
        "email": "test002@example.com",
        "phone": "13800138011",
        "realName": "测试用户002",
        "idCard": "110101199001011002"
    }
]

# 管理员凭据
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Abcdef1!"

# 全局变量存储token
admin_token = None
user_tokens = {}

def login_admin():
    """管理员登录"""
    global admin_token
    
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{USER_API_BASE}/login", 
                               json=login_data,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                admin_token = result.get("token")
                print("✅ 管理员登录成功")
                return True
            else:
                print(f"❌ 管理员登录失败: {result.get('message', '未知错误')}")
                return False
        else:
            print(f"❌ 管理员登录请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 管理员登录异常: {e}")
        return False

def make_admin_request(method, endpoint, data=None):
    """发送管理员API请求"""
    if not admin_token:
        print("❌ 请先登录管理员账号")
        return None
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    try:
        if method.upper() == "GET":
            response = requests.get(f"{ADMIN_API_BASE}{endpoint}", headers=headers)
        elif method.upper() == "POST":
            response = requests.post(f"{ADMIN_API_BASE}{endpoint}", 
                                   json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(f"{ADMIN_API_BASE}{endpoint}", 
                                  json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(f"{ADMIN_API_BASE}{endpoint}", headers=headers)
        else:
            print(f"❌ 不支持的HTTP方法: {method}")
            return None
        
        return response
    except Exception as e:
        print(f"❌ API请求异常: {e}")
        return None

def test_user_registration():
    """测试用户注册功能"""
    print("\n📋 测试用户注册功能...")
    
    success_count = 0
    for i, user_data in enumerate(test_users, 1):
        print(f"\n  测试用户 {i}: {user_data['username']}")
        
        response = requests.post(f"{USER_API_BASE}/register", 
                               json=user_data,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("code") in [200, 201]:
                print(f"   ✅ 注册成功")
                success_count += 1
            else:
                print(f"   ⚠️ 注册失败: {result.get('message', '未知错误')}")
        else:
            print(f"   ❌ 注册请求失败: {response.status_code}")
    
    print(f"\n📊 用户注册测试结果: {success_count}/{len(test_users)} 成功")
    return success_count

def test_user_login():
    """测试用户登录功能"""
    print("\n🔐 测试用户登录功能...")
    
    success_count = 0
    for i, user_data in enumerate(test_users, 1):
        print(f"\n  测试用户 {i}: {user_data['username']}")
        
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"]
        }
        
        response = requests.post(f"{USER_API_BASE}/login", 
                               json=login_data,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                token = result.get("token")
                user_tokens[user_data["username"]] = token
                print(f"   ✅ 登录成功")
                success_count += 1
            else:
                print(f"   ❌ 登录失败: {result.get('message', '未知错误')}")
        else:
            print(f"   ❌ 登录请求失败: {response.status_code}")
    
    print(f"\n📊 用户登录测试结果: {success_count}/{len(test_users)} 成功")
    return success_count

def test_user_info_query():
    """测试用户信息查询功能"""
    print("\n👤 测试用户信息查询功能...")
    
    success_count = 0
    for i, user_data in enumerate(test_users, 1):
        username = user_data["username"]
        token = user_tokens.get(username)
        
        if not token:
            print(f"\n  测试用户 {i}: {username} - ❌ 未登录，跳过查询")
            continue
        
        print(f"\n  测试用户 {i}: {username}")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{USER_API_BASE}/info", headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                user_info = result.get("data", {})
                print(f"   ✅ 查询成功")
                print(f"     用户名: {user_info.get('username', 'N/A')}")
                print(f"     邮箱: {user_info.get('email', 'N/A')}")
                print(f"     手机: {user_info.get('phone', 'N/A')}")
                print(f"     真实姓名: {user_info.get('realName', 'N/A')}")
                success_count += 1
            else:
                print(f"   ❌ 查询失败: {result.get('message', '未知错误')}")
        else:
            print(f"   ❌ 查询请求失败: {response.status_code}")
    
    print(f"\n📊 用户信息查询测试结果: {success_count}/{len(test_users)} 成功")
    return success_count

def test_admin_user_management():
    """测试管理员用户管理功能"""
    print("\n👨‍💼 测试管理员用户管理功能...")
    
    if not admin_token:
        print("   ❌ 管理员未登录，跳过测试")
        return 0
    
    # 获取用户列表
    print("\n  1. 获取用户列表")
    response = make_admin_request("GET", "/users")
    
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            users = result.get("data", {}).get("users", [])
            print(f"   ✅ 获取成功，共 {len(users)} 个用户")
            
            # 显示部分用户信息
            for i, user in enumerate(users[:3], 1):
                print(f"     用户{i}: {user.get('username', 'N/A')} - {user.get('email', 'N/A')}")
        else:
            print(f"   ❌ 获取失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 获取请求失败")
    
    # 获取用户统计信息
    print("\n  2. 获取用户统计信息")
    response = make_admin_request("GET", "/users/stats")
    
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            stats = result.get("data", {})
            print(f"   ✅ 获取成功")
            print(f"     总用户数: {stats.get('totalUsers', 0)}")
            print(f"     活跃用户: {stats.get('activeUsers', 0)}")
            print(f"     今日注册: {stats.get('todayRegistrations', 0)}")
        else:
            print(f"   ❌ 获取失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 获取请求失败")
    
    return 1

def test_password_reset():
    """测试密码重置功能"""
    print("\n🔑 测试密码重置功能...")
    
    if not test_users:
        print("   ⚠️ 没有测试用户，跳过测试")
        return 0
    
    # 使用第一个测试用户进行密码重置测试
    user_data = test_users[0]
    username = user_data["username"]
    
    print(f"\n  测试用户: {username}")
    
    # 请求密码重置
    reset_data = {
        "email": user_data["email"]
    }
    
    response = requests.post(f"{USER_API_BASE}/password/reset", 
                           json=reset_data,
                           headers={"Content-Type": "application/json"})
    
    if response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            print(f"   ✅ 密码重置请求成功")
            print(f"     消息: {result.get('message', 'N/A')}")
            return 1
        else:
            print(f"   ⚠️ 密码重置请求失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 密码重置请求失败: {response.status_code}")
    
    return 0

def main():
    """主函数"""
    print("🚀 开始用户管理功能测试...")
    print("=" * 60)
    
    # 1. 管理员登录
    if not login_admin():
        print("❌ 管理员登录失败，部分功能无法测试")
    
    # 2. 测试用户注册
    reg_result = test_user_registration()
    
    # 3. 测试用户登录
    login_result = test_user_login()
    
    # 4. 测试用户信息查询
    info_result = test_user_info_query()
    
    # 5. 测试管理员用户管理
    admin_result = test_admin_user_management()
    
    # 6. 测试密码重置
    reset_result = test_password_reset()
    
    # 7. 测试结果汇总
    print("\n" + "=" * 60)
    print("📊 用户管理功能测试结果汇总:")
    print(f"   ✅ 用户注册测试: {reg_result}/{len(test_users)} 成功")
    print(f"   ✅ 用户登录测试: {login_result}/{len(test_users)} 成功")
    print(f"   ✅ 用户信息查询: {info_result}/{len(test_users)} 成功")
    print(f"   ✅ 管理员用户管理: {'通过' if admin_result else '失败'}")
    print(f"   ✅ 密码重置功能: {'通过' if reset_result else '失败'}")
    
    # 8. 数据库连接验证
    print("\n🔍 数据库连接验证:")
    response = make_admin_request("GET", "/users")
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            users = result.get("data", {}).get("users", [])
            print(f"   ✅ MySQL数据库连接正常")
            print(f"   📊 当前用户总数: {len(users)}")
        else:
            print(f"   ❌ 数据库连接异常")
    else:
        print(f"   ❌ 数据库连接异常")
    
    print("\n" + "=" * 60)
    print("🎊 用户管理功能测试完成！")
    print("")
    print("🌐 测试环境信息:")
    print("   用户API: http://localhost:11031")
    print("   管理API: http://localhost:11025")
    print("   管理后台: http://localhost:3000")
    print("")
    print("🔑 管理员登录信息:")
    print(f"   用户名: {ADMIN_USERNAME}")
    print(f"   密码: {ADMIN_PASSWORD}")

if __name__ == "__main__":
    main()