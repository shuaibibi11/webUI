#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import uuid

# API URLs
ADMIN_API_URL = "http://localhost:11025/api/admin"
USER_API_URL = "http://localhost:11027/api"

# 管理员账号
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Abcdef1!"

def create_admin():
    """创建管理员账户"""
    print("尝试创建管理员账户...")
    register_url = f"{USER_API_URL}/auth/register"
    admin_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD,
        "email": "admin@example.com",
        "role": "ADMIN"
    }
    
    response = requests.post(register_url, json=admin_data)
    print(f"注册请求: {register_url}")
    print(f"注册数据: {admin_data}")
    print(f"响应状态码: {response.status_code}")
    
    if response.status_code == 201:
        result = response.json()
        print(f"管理员创建成功: {result}")
        return True
    else:
        print(f"创建管理员失败: {response.text}")
        return False

def check_admin_exists():
    """检查管理员是否存在"""
    print("检查管理员账户是否存在...")
    register_url = f"{USER_API_URL}/auth/check-username"
    data = {"username": ADMIN_USERNAME}
    
    response = requests.post(register_url, json=data)
    print(f"检查用户名请求: {register_url}")
    print(f"请求数据: {data}")
    print(f"响应状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        exists = result.get("exists", False)
        print(f"用户名 {ADMIN_USERNAME} 存在: {exists}")
        return exists
    else:
        print(f"检查用户名失败: {response.text}")
        return False

def reset_admin_password():
    """重置管理员密码"""
    print("尝试重置管理员密码...")
    reset_url = f"{USER_API_URL}/auth/reset-password"
    data = {
        "username": ADMIN_USERNAME,
        "newPassword": ADMIN_PASSWORD
    }
    
    response = requests.post(reset_url, json=data)
    print(f"重置密码请求: {reset_url}")
    print(f"请求数据: {data}")
    print(f"响应状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"密码重置成功: {result}")
        return True
    else:
        print(f"密码重置失败: {response.text}")
        return False

def main():
    print("=== 检查并创建管理员账户 ===")
    
    # 1. 检查管理员是否存在
    admin_exists = check_admin_exists()
    
    if admin_exists:
        print("管理员账户已存在，尝试重置密码...")
        reset_admin_password()
    else:
        print("管理员账户不存在，尝试创建...")
        create_admin()
    
    print("\n=== 完成管理员账户检查 ===")

if __name__ == "__main__":
    main()