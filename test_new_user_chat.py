#!/usr/bin/env python3
import requests
import json

# API基础URL
USER_API_URL = "http://localhost:11031/api"
ADMIN_API_URL = "http://localhost:11025"

# 创建测试用户
def create_test_user():
    register_url = f"{USER_API_URL}/users/register"
    headers = {"Content-Type": "application/json"}
    data = {
        "username": "testuser4",
        "password": "Test123456!",
        "phone": "13800138004",
        "email": "test4@example.com",
        "realName": "测试用户4",
        "idCard": "110101199001010004"
    }
    
    try:
        response = requests.post(register_url, json=data, headers=headers)
        if response.status_code == 200 or response.status_code == 201:
            print("测试用户创建成功")
            return True
        else:
            print(f"创建测试用户请求失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return False
    except Exception as e:
        print(f"创建测试用户异常: {e}")
        return False

# 管理员登录
def admin_login():
    login_url = f"{ADMIN_API_URL}/admin/auth/login"
    headers = {"Content-Type": "application/json"}
    data = {
        "username": "admin",
        "password": "Abcdef1!"
    }
    
    try:
        response = requests.post(login_url, json=data, headers=headers)
        if response.status_code == 200:
            token = response.json().get("data", {}).get("token")
            print("管理员登录成功")
            return token
        else:
            print(f"管理员登录失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
    except Exception as e:
        print(f"管理员登录异常: {e}")
        return None

# 获取用户列表
def get_users(admin_token):
    users_url = f"{ADMIN_API_URL}/admin/users"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }
    
    try:
        response = requests.get(users_url, headers=headers)
        if response.status_code == 200:
            users = response.json().get("data", {}).get("content", [])
            print(f"获取到用户列表，共 {len(users)} 个用户")
            return users
        else:
            print(f"获取用户列表失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return []
    except Exception as e:
        print(f"获取用户列表异常: {e}")
        return []

# 审核用户
def approve_user(admin_token, user_id):
    approve_url = f"{ADMIN_API_URL}/admin/users/{user_id}/approve"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }
    
    try:
        response = requests.put(approve_url, headers=headers)
        if response.status_code == 200:
            print(f"用户 {user_id} 审核成功")
            return True
        else:
            print(f"审核用户失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return False
    except Exception as e:
        print(f"审核用户异常: {e}")
        return False

# 用户登录
def user_login():
    login_url = f"{USER_API_URL}/users/login"
    headers = {"Content-Type": "application/json"}
    data = {
        "username": "testuser4",
        "password": "Test123456!"
    }
    
    try:
        response = requests.post(login_url, json=data, headers=headers)
        if response.status_code == 200:
            token = response.json().get("data", {}).get("token")
            print("用户登录成功")
            return token
        else:
            print(f"用户登录失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
    except Exception as e:
        print(f"用户登录异常: {e}")
        return None

# 创建对话
def create_conversation(token):
    conv_url = f"{USER_API_URL}/conversations"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "title": "测试对话"
    }
    
    try:
        response = requests.post(conv_url, json=data, headers=headers)
        if response.status_code == 200:
            conv_id = response.json().get("data", {}).get("id")
            print(f"创建对话成功，ID: {conv_id}")
            return conv_id
        else:
            print(f"创建对话失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
    except Exception as e:
        print(f"创建对话异常: {e}")
        return None

# 发送消息
def send_message(token, conversation_id, message):
    chat_url = f"{USER_API_URL}/chat"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "conversationId": conversation_id,
        "message": message
    }
    
    try:
        response = requests.post(chat_url, json=data, headers=headers)
        if response.status_code == 200:
            result = response.json().get("data", {})
            print(f"发送消息成功，回复: {result.get('reply', '无回复')}")
            return True
        else:
            print(f"发送消息失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return False
    except Exception as e:
        print(f"发送消息异常: {e}")
        return False

# 主函数
def main():
    print("开始测试大模型对话功能...")
    
    # 1. 创建测试用户
    if not create_test_user():
        print("创建测试用户失败，终止测试")
        return
    
    # 2. 管理员登录
    admin_token = admin_login()
    if not admin_token:
        print("管理员登录失败，终止测试")
        return
    
    # 3. 获取用户列表
    users = get_users(admin_token)
    if not users:
        print("获取用户列表失败，终止测试")
        return
    
    # 4. 找到测试用户并审核
    test_user = None
    for user in users:
        if user.get("username") == "testuser4":
            test_user = user
            break
    
    if not test_user:
        print("未找到测试用户，终止测试")
        return
    
    user_id = test_user.get("id")
    if not approve_user(admin_token, user_id):
        print("审核用户失败，终止测试")
        return
    
    # 5. 用户登录
    user_token = user_login()
    if not user_token:
        print("用户登录失败，终止测试")
        return
    
    # 6. 创建对话
    conv_id = create_conversation(user_token)
    if not conv_id:
        print("创建对话失败，终止测试")
        return
    
    # 7. 发送消息测试
    test_message = "你好，请介绍一下你自己"
    if send_message(user_token, conv_id, test_message):
        print("大模型对话功能测试成功！")
    else:
        print("大模型对话功能测试失败")

if __name__ == "__main__":
    main()