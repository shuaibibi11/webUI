import requests
import json

# API基础URL
BASE_URL = "http://localhost:11031/api"

print("=== 创建管理员账户 ===")

# 1. 使用bootstrap-admin端点创建管理员账户
try:
    response = requests.post(f"{BASE_URL}/users/bootstrap-admin")
    print(f"Bootstrap Admin状态码: {response.status_code}")
    print(f"Bootstrap Admin响应: {response.text}")
    
    if response.status_code == 200:
        print("管理员账户创建成功！")
    else:
        print("管理员账户创建失败！")
except Exception as e:
    print(f"Bootstrap Admin请求失败: {e}")

print("\n=== 测试管理员登录 ===")

# 2. 测试用户API登录
login_data = {
    "username": "admin",
    "password": "Abcdef1!"
}

try:
    response = requests.post(f"{BASE_URL}/users/login", json=login_data)
    print(f"用户API登录状态码: {response.status_code}")
    print(f"用户API登录响应: {response.text}")
    
    if response.status_code == 200:
        login_result = response.json()
        user_token = login_result.get("token")
        print(f"用户API登录成功，获取到token: {user_token[:20]}...")
    else:
        print("用户API登录失败！")
except Exception as e:
    print(f"用户API登录请求失败: {e}")

print("\n=== 测试管理员API登录 ===")

# 3. 测试管理员API登录
admin_login_data = {
    "username": "admin",
    "password": "Abcdef1!"
}

try:
    response = requests.post(f"http://localhost:11025/api/admin/auth/login", json=admin_login_data)
    print(f"管理员API登录状态码: {response.status_code}")
    print(f"管理员API登录响应: {response.text}")
    
    if response.status_code == 200:
        login_result = response.json()
        admin_token = login_result.get("token")
        print(f"管理员API登录成功，获取到token: {admin_token[:20]}...")
    else:
        print("管理员API登录失败！")
except Exception as e:
    print(f"管理员API登录请求失败: {e}")