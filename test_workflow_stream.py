#!/usr/bin/env python3
"""
测试bisheng工作流流式输出
"""
import requests
import json
import sys

# 测试配置
WORKFLOW_ID = "84bf8fb2-cd25-46c4-b8dd-0133cbc27d8e"
TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJmY2M1MzZjMy00YTE1LTQ2YzgtOGQ2Ny1mMTBmNjZmMDljOWYiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6IkFETUlOIn0.B8OQElebr0AIBSqBBa20T0-vZ-48oU_tjyb1zooJMbw"

def test_workflow_stream():
    print("=" * 80)
    print("测试bisheng工作流流式输出")
    print("=" * 80)
    print()
    
    # 1. 创建会话
    print("【1】创建会话...")
    create_conv_url = "http://localhost:11031/api/conversations"
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    create_data = {"title": "测试工作流", "modelId": None}
    
    try:
        response = requests.post(create_conv_url, json=create_data, headers=headers, timeout=5)
        if response.status_code == 201:
            conv_data = response.json()
            conversation_id = conv_data.get("data", {}).get("id") or conv_data.get("conversation", {}).get("id") or conv_data.get("id")
            print(f"✅ 会话创建成功，ID: {conversation_id}")
        else:
            print(f"❌ 会话创建失败: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ 会话创建异常: {e}")
        return
    
    print()
    
    # 2. 测试流式输出
    print("【2】测试工作流流式输出...")
    stream_url = "http://localhost:11031/api/chat/stream"
    stream_data = {
        "content": "你好",
        "conversationId": conversation_id,
        "workflowId": WORKFLOW_ID
    }
    
    print(f"请求URL: {stream_url}")
    print(f"请求数据: {json.dumps(stream_data, indent=2, ensure_ascii=False)}")
    print()
    
    try:
        response = requests.post(stream_url, json=stream_data, headers=headers, stream=True, timeout=30)
        print(f"响应状态码: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print()
        
        if response.status_code == 200:
            print("开始接收流式数据:")
            print("-" * 80)
            
            message_count = 0
            for line in response.iter_lines():
                if line:
                    decoded = line.decode('utf-8')
                    if decoded.startswith('data: '):
                        json_str = decoded[6:].strip()
                        try:
                            data = json.loads(json_str)
                            role = data.get('role', 'unknown')
                            content = data.get('content', '')
                            status = data.get('status', 'unknown')
                            
                            print(f"[{message_count}] 角色: {role}, 状态: {status}")
                            if content:
                                print(f"     内容: {content[:100]}{'...' if len(content) > 100 else ''}")
                            else:
                                print(f"     内容: (空)")
                            print()
                            
                            message_count += 1
                            if message_count >= 10:  # 限制输出数量
                                break
                        except json.JSONDecodeError as e:
                            print(f"JSON解析失败: {json_str[:100]}")
                            print(f"错误: {e}")
                    elif decoded.startswith('event: '):
                        print(f"事件: {decoded}")
            
            print("-" * 80)
            print(f"✅ 共接收到 {message_count} 条消息")
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ 流式请求异常: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_workflow_stream()

