#!/usr/bin/env python3
import requests
import json
import time

# API基础URL
BASE_URL = "http://localhost:11031/api"

# 登录获取token
def login():
    login_url = f"{BASE_URL}/users/login"
    login_data = {
        "username": "testuser",
        "password": "password123"
    }
    
    try:
        response = requests.post(login_url, json=login_data)
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                token = result.get("data", {}).get("token")
                print(f"登录成功，获取到token: {token[:20]}...")
                return token
            else:
                print(f"登录失败: {result.get('message', '未知错误')}")
                print(f"响应内容: {response.text}")
                return None
        else:
            print(f"登录请求失败，状态码: {response.status_code}")
            print(f"响应内容: {response.text}")
            return None
    except Exception as e:
        print(f"登录异常: {str(e)}")
        return None

# 创建对话
def create_conversation(token):
    conv_url = f"{BASE_URL}/conversations"
    headers = {"Authorization": f"Bearer {token}"}
    conv_data = {"title": "测试大模型对话"}
    
    try:
        response = requests.post(conv_url, json=conv_data, headers=headers)
        if response.status_code == 201:
            result = response.json()
            if result.get("code") == 201:
                conv_id = result.get("conversation", {}).get("id")
                print(f"创建对话成功，对话ID: {conv_id}")
                return conv_id
            else:
                print(f"创建对话失败: {result.get('message', '未知错误')}")
                return None
        else:
            print(f"创建对话请求失败，状态码: {response.status_code}")
            return None
    except Exception as e:
        print(f"创建对话异常: {str(e)}")
        return None

# 发送消息
def send_message(token, conversation_id, message):
    chat_url = f"{BASE_URL}/chat"
    headers = {"Authorization": f"Bearer {token}"}
    chat_data = {
        "content": message,
        "conversationId": conversation_id
    }
    
    try:
        response = requests.post(chat_url, json=chat_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                reply = result.get("data", {}).get("reply", "无回复")
                print(f"发送消息成功，回复: {reply[:100]}...")
                return reply
            else:
                print(f"发送消息失败: {result.get('message', '未知错误')}")
                return None
        else:
            print(f"发送消息请求失败，状态码: {response.status_code}")
            return None
    except Exception as e:
        print(f"发送消息异常: {str(e)}")
        return None

# 测试流式对话
def test_stream_chat(token, conversation_id, message):
    chat_url = f"{BASE_URL}/chat/stream"
    headers = {"Authorization": f"Bearer {token}"}
    chat_data = {
        "content": message,
        "conversationId": conversation_id
    }
    
    try:
        response = requests.post(chat_url, json=chat_data, headers=headers, stream=True)
        if response.status_code == 200:
            print("开始接收流式响应:")
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith('data:'):
                        data_str = decoded_line[5:].strip()
                        if data_str:
                            try:
                                data = json.loads(data_str)
                                if data.get("role") == "assistant":
                                    content = data.get("content", "")
                                    print(content, end='', flush=True)
                            except json.JSONDecodeError:
                                print(f"\n解析JSON失败: {data_str}")
            print("\n流式响应结束")
            return True
        else:
            print(f"流式对话请求失败，状态码: {response.status_code}")
            return False
    except Exception as e:
        print(f"流式对话异常: {str(e)}")
        return False

# 主函数
def main():
    print("开始测试大模型对话功能...")
    
    # 1. 登录获取token
    token = login()
    if not token:
        print("登录失败，终止测试")
        return
    
    # 2. 创建新对话
    conversation_id = create_conversation(token)
    if not conversation_id:
        print("创建对话失败，终止测试")
        return
    
    # 3. 测试普通对话
    print("\n=== 测试普通对话 ===")
    test_message = "你好，请介绍一下你自己"
    reply = send_message(token, conversation_id, test_message)
    if reply:
        print("普通对话测试成功")
    else:
        print("普通对话测试失败")
    
    # 等待一下
    time.sleep(2)
    
    # 4. 测试流式对话
    print("\n=== 测试流式对话 ===")
    test_message = "请用三个段落介绍人工智能的发展历程"
    success = test_stream_chat(token, conversation_id, test_message)
    if success:
        print("流式对话测试成功")
    else:
        print("流式对话测试失败")
    
    print("\n测试完成")

if __name__ == "__main__":
    main()