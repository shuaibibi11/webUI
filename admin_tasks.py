#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time
import uuid

# API URLs
ADMIN_API_URL = "http://localhost:11025/api/admin"
USER_API_URL = "http://localhost:11027/api"

# 管理员账号
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Abcdef1!"

def login_admin():
    """管理员登录"""
    print("尝试管理员登录...")
    login_url = f"{ADMIN_API_URL}/auth/login"
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
        if result.get("success") and result.get("data", {}).get("token"):
            token = result["data"]["token"]
            print(f"管理员登录成功，token: {token[:20]}...")
            return token
        else:
            print(f"登录失败: {result}")
            return None
    else:
        print(f"登录失败，状态码: {response.status_code}")
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

def get_models(token):
    """获取模型列表"""
    print("\n获取模型列表...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{ADMIN_API_URL}/models", headers=headers)
    
    print(f"模型列表响应状态码: {response.status_code}")
    if response.status_code == 200:
        models = response.json()
        print(f"模型列表: {json.dumps(models, indent=2, ensure_ascii=False)}")
        return models
    else:
        print(f"获取模型列表失败: {response.text}")
        return None

def get_workflows(token):
    """获取工作流列表"""
    print("\n获取工作流列表...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{ADMIN_API_URL}/workflows", headers=headers)
    
    print(f"工作流列表响应状态码: {response.status_code}")
    if response.status_code == 200:
        workflows = response.json()
        print(f"工作流列表: {json.dumps(workflows, indent=2, ensure_ascii=False)}")
        return workflows
    else:
        print(f"获取工作流列表失败: {response.text}")
        return None

def main():
    print("=== 开始管理员任务 ===")
    
    # 1. 管理员登录
    token = login_admin()
    if not token:
        print("管理员登录失败，无法继续执行任务")
        return
    
    # 2. 获取用户列表
    users = get_users(token)
    
    # 3. 审核待审核用户
    if users and isinstance(users, list):
        for user in users:
            if user.get("status") == "PENDING":
                approve_user(token, user.get("id"))
    
    # 4. 获取模型列表
    models = get_models(token)
    
    # 5. 获取工作流列表
    workflows = get_workflows(token)
    
    print("\n=== 管理员任务完成 ===")

if __name__ == "__main__":
    main()