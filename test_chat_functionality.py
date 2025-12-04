#!/usr/bin/env python3
import requests
import json
import time

# 配置
BASE_URL = "http://localhost:11031"
API_BASE = f"{BASE_URL}/api"

def test_user_login():
    """测试用户登录功能"""
    print("测试用户登录功能...")
    
    # 先尝试登录管理员账号
    login_url = f"{API_BASE}/api/users/login"
    login_data = {
        "username": "admin",
        "password": "Abcdef1!"
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        print(f"登录请求状态码: {response.status_code}")
        print(f"登录响应: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                token = result.get("token")
                print(f"登录成功，获取到token: {token[:20]}...")
                return token
            else:
                print(f"登录失败: {result.get('message')}")
        else:
            print(f"登录请求失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
    except Exception as e:
        print(f"登录请求异常: {e}")
    
    return None

def test_chat_conversation(token):
    """测试对话功能"""
    print("\n测试对话功能...")
    
    # 创建对话
    conversation_url = f"{API_BASE}/api/conversations"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        # 创建新对话
        response = requests.post(conversation_url, json={"title": "测试对话"}, headers=headers)
        print(f"创建对话状态码: {response.status_code}")
        print(f"创建对话响应: {response.text}")
        
        if response.status_code == 201:
            result = response.json()
            conversation_id = result.get("conversation", {}).get("id")
            print(f"创建对话成功，对话ID: {conversation_id}")
            
            # 发送消息
            message_url = f"{API_BASE}/api/messages"
            message_data = {
                "conversationId": conversation_id,
                "content": "你好，请介绍一下你自己",
                "role": "user"
            }
            
            response = requests.post(message_url, json=message_data, headers=headers)
            print(f"发送消息状态码: {response.status_code}")
            print(f"发送消息响应: {response.text}")
            
            if response.status_code == 200:
                print("消息发送成功")
                # 等待一段时间，然后获取消息列表
                time.sleep(2)
                
                # 获取消息列表
                list_url = f"{API_BASE}/api/messages/{conversation_id}"
                response = requests.get(list_url, headers=headers)
                print(f"获取消息列表状态码: {response.status_code}")
                print(f"获取消息列表响应: {response.text}")
                
                if response.status_code == 200:
                    result = response.json()
                    messages = result.get("messages", [])
                    print(f"获取到 {len(messages)} 条消息")
                    for msg in messages:
                        print(f"  - {msg.get('role')}: {msg.get('content')[:50]}...")
            else:
                print("消息发送失败")
        else:
            print("创建对话失败")
    except Exception as e:
        print(f"对话测试异常: {e}")

def main():
    print("开始测试聊天功能...")
    
    # 测试登录
    token = test_user_login()
    
    if token:
        # 测试对话功能
        test_chat_conversation(token)
    else:
        print("无法获取token，跳过对话测试")

if __name__ == "__main__":
    main()