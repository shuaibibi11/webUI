#!/usr/bin/env python3
import requests
import json

# API基础URL
USER_API_URL = "http://localhost:11031/api"
ADMIN_API_URL = "http://localhost:11025"

# 创建测试用户
def create_test_user():
    register_url = f"{USER_API_URL}/users/register"
    user_data = {
        "username": "testuser",
        "password": "password123",
        "phone": "13800138001",
        "email": "testuser@example.com",
        "realName": "测试用户",
        "idCard": "110101199001010001"
    }
    
    try:
        response = requests.post(register_url, json=user_data)
        if response.status_code == 201:
            result = response.json()
            if result.get("code") == 201:
                print(f"创建测试用户成功: {result.get('message')}")
                return True
            else:
                print(f"创建测试用户失败: {result.get('message', '未知错误')}")
                return False
        else:
            print(f"创建测试用户请求失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return False
    except Exception as e:
        print(f"创建测试用户异常: {str(e)}")
        return False

# 登录管理员账号
def admin_login():
    login_url = f"{ADMIN_API_URL}/admin/auth/login"
    login_data = {
        "username": "admin",
        "password": "Abcdef1!"
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                token = result.get("token")
                print(f"管理员登录成功，获取到token: {token[:20]}...")
                return token
            else:
                print(f"管理员登录失败: {result.get('message', '未知错误')}")
                return None
        else:
            print(f"管理员登录请求失败，状态码: {response.status_code}")
            return None
    except Exception as e:
        print(f"管理员登录异常: {str(e)}")
        return None

# 审核测试用户
def approve_user(admin_token, user_id):
    approve_url = f"{ADMIN_API_URL}/admin/users/{user_id}/approve"
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.put(approve_url, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                print(f"用户审核成功: {result.get('message')}")
                return True
            else:
                print(f"用户审核失败: {result.get('message', '未知错误')}")
                return False
        else:
            print(f"用户审核请求失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"用户审核异常: {str(e)}")
        return False

# 获取用户列表
def get_users(admin_token):
    users_url = f"{ADMIN_API_URL}/admin/users"
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        response = requests.get(users_url, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                users = result.get("data", {}).get("users", [])
                return users
            else:
                print(f"获取用户列表失败: {result.get('message', '未知错误')}")
                return []
        else:
            print(f"获取用户列表请求失败，状态码: {response.status_code}")
            return []
    except Exception as e:
        print(f"获取用户列表异常: {str(e)}")
        return []

# 主函数
def main():
    print("开始创建测试用户...")
    
    # 1. 创建测试用户
    if not create_test_user():
        print("创建测试用户失败，终止流程")
        return
    
    # 2. 管理员登录
    admin_token = admin_login()
    if not admin_token:
        print("管理员登录失败，终止流程")
        return
    
    # 3. 获取用户列表
    users = get_users(admin_token)
    test_user_id = None
    for user in users:
        if user.get("username") == "testuser":
            test_user_id = user.get("id")
            break
    
    if not test_user_id:
        print("未找到测试用户ID，终止流程")
        return
    
    # 4. 审核测试用户
    if approve_user(admin_token, test_user_id):
        print("测试用户创建并审核成功，可以开始测试对话功能")
    else:
        print("测试用户审核失败")
    
    print("流程完成")

if __name__ == "__main__":
    main()