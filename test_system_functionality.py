#!/usr/bin/env python3
import requests
import json

# API基础URL
ADMIN_API_URL = "http://localhost:11025"
USER_API_URL = "http://localhost:11031/api"

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

# 用户登录
def user_login():
    login_url = f"{USER_API_URL}/users/login"
    headers = {"Content-Type": "application/json"}
    data = {
        "username": "testuser",
        "password": "Abcdef1!"
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
    print("开始测试系统功能...")
    
    # 1. 测试管理员登录
    admin_token = admin_login()
    if not admin_token:
        print("管理员登录失败，终止测试")
        return
    
    # 2. 测试用户登录
    user_token = user_login()
    if not user_token:
        print("用户登录失败，终止测试")
        return
    
    # 3. 创建对话
    conv_id = create_conversation(user_token)
    if not conv_id:
        print("创建对话失败，终止测试")
        return
    
    # 4. 发送消息测试
    test_message = "你好，请介绍一下你自己"
    if send_message(user_token, conv_id, test_message):
        print("大模型对话功能测试成功！")
    else:
        print("大模型对话功能测试失败")

if __name__ == "__main__":
    main()