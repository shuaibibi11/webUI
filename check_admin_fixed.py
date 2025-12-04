#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import uuid

# API URLs
ADMIN_API_URL = "http://localhost:11025/api/admin"
USER_API_URL = "http://localhost:11031/api"

# 管理员账号
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Abcdef1!"

def register_admin():
    """注册管理员账户"""
    print("尝试注册管理员账户...")
    register_url = f"{USER_API_URL}/users/register"
    admin_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD,
        "email": "admin@example.com",
        "phone": "13800138000",
        "realName": "系统管理员",
        "idCard": "110101199001011234"
    }
    
    response = requests.post(register_url, json=admin_data)
    print(f"注册请求: {register_url}")
    print(f"注册数据: {admin_data}")
    print(f"响应状态码: {response.status_code}")
    
    if response.status_code == 201:
        result = response.json()
        print(f"管理员注册成功: {result}")
        return True
    else:
        print(f"注册管理员失败: {response.text}")
        return False

def login_admin():
    """管理员登录"""
    print("\n尝试管理员登录...")
    login_url = f"{USER_API_URL}/users/login"
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(login_url, json=login_data)
    print(f"登录请求: {login_url}")
    print(f"登录数据: {login_data}")
    print(f"响应状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        if result.get("code") == 200 and result.get("token"):
            token = result["token"]
            print(f"管理员登录成功，token: {token[:20]}...")
            return token
        else:
            print(f"登录失败: {result}")
            return None
    else:
        print(f"登录失败，状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        return None

def login_admin_api():
    """管理员API登录"""
    print("\n尝试管理员API登录...")
    login_url = f"{ADMIN_API_URL}/auth/login"
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    response = requests.post(login_url, json=login_data)
    print(f"管理员API登录请求: {login_url}")
    print(f"登录数据: {login_data}")
    print(f"响应状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        if result.get("success") and result.get("data", {}).get("token"):
            token = result["data"]["token"]
            print(f"管理员API登录成功，token: {token[:20]}...")
            return token
        else:
            print(f"管理员API登录失败: {result}")
            return None
    else:
        print(f"管理员API登录失败，状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        return None

def get_users(token):
    """获取用户列表"""
    print("\n获取用户列表...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{ADMIN_API_URL}/users", headers=headers)
    
    print(f"用户列表响应状态码: {response.status_code}")
    if response.status_code == 200:
        users = response.json()
        print(f"用户列表: {json.dumps(users, indent=2, ensure_ascii=False)}")
        return users
    else:
        print(f"获取用户列表失败: {response.text}")
        return None

def approve_user(token, user_id):
    """审核用户"""
    print(f"\n审核用户 {user_id}...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(f"{ADMIN_API_URL}/users/{user_id}/approve", headers=headers)
    
    print(f"审核用户响应状态码: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"审核结果: {result}")
        return result
    else:
        print(f"审核用户失败: {response.text}")
        return None

def main():
    print("=== 检查并创建管理员账户 ===")
    
    # 1. 尝试注册管理员账户
    register_admin()
    
    # 2. 尝试用户API登录
    user_token = login_admin()
    
    # 3. 尝试管理员API登录
    admin_token = login_admin_api()
    
    # 4. 如果管理员API登录成功，获取用户列表并审核
    if admin_token:
        users = get_users(admin_token)
        if users and isinstance(users, list):
            for user in users:
                if user.get("status") == "PENDING":
                    approve_user(admin_token, user.get("id"))
    
    print("\n=== 完成管理员账户检查 ===")

if __name__ == "__main__":
    main()