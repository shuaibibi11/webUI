#!/usr/bin/env python3
"""
测试管理后台API接口
"""
import requests
import json

BASE_URL = "http://localhost:11025/api/admin"

# 测试用的token（需要从实际登录获取）
# 这里先测试接口是否存在
def test_feedback_update():
    """测试反馈状态更新接口"""
    print("=" * 50)
    print("测试反馈状态更新接口")
    print("=" * 50)
    
    # 测试PUT请求格式
    url = f"{BASE_URL}/feedbacks/test-id"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }
    data = {"status": "processing"}
    
    try:
        response = requests.put(url, json=data, headers=headers, timeout=5)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:200]}")
        if response.status_code in [200, 401, 403]:
            print("✅ 接口存在（需要认证）")
        else:
            print("❌ 接口可能不存在")
    except Exception as e:
        print(f"❌ 请求失败: {e}")

def test_user_update():
    """测试用户更新接口"""
    print("\n" + "=" * 50)
    print("测试用户更新接口")
    print("=" * 50)
    
    url = f"{BASE_URL}/users/test-id"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }
    data = {
        "username": "test",
        "phone": "13800138000",
        "email": "test@example.com",
        "status": "ACTIVE",
        "role": "USER"
    }
    
    try:
        response = requests.put(url, json=data, headers=headers, timeout=5)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:200]}")
        if response.status_code in [200, 401, 403]:
            print("✅ 接口存在（需要认证）")
        else:
            print("❌ 接口可能不存在")
    except Exception as e:
        print(f"❌ 请求失败: {e}")

def test_user_approve():
    """测试用户审批接口"""
    print("\n" + "=" * 50)
    print("测试用户审批接口")
    print("=" * 50)
    
    url = f"{BASE_URL}/users/test-id/approve"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }
    
    try:
        response = requests.put(url, json={}, headers=headers, timeout=5)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:200]}")
        if response.status_code in [200, 401, 403]:
            print("✅ 接口存在（需要认证）")
        else:
            print("❌ 接口可能不存在")
    except Exception as e:
        print(f"❌ 请求失败: {e}")

def test_user_ban():
    """测试用户封禁接口"""
    print("\n" + "=" * 50)
    print("测试用户封禁接口")
    print("=" * 50)
    
    url = f"{BASE_URL}/users/test-id/ban"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-token"
    }
    
    try:
        response = requests.put(url, json={}, headers=headers, timeout=5)
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text[:200]}")
        if response.status_code in [200, 401, 403]:
            print("✅ 接口存在（需要认证）")
        else:
            print("❌ 接口可能不存在")
    except Exception as e:
        print(f"❌ 请求失败: {e}")

if __name__ == "__main__":
    print("开始测试管理后台API接口...")
    print(f"后端地址: {BASE_URL}\n")
    
    test_feedback_update()
    test_user_update()
    test_user_approve()
    test_user_ban()
    
    print("\n" + "=" * 50)
    print("测试完成！")
    print("=" * 50)
    print("\n注意：如果返回401或403，说明接口存在但需要正确的认证token")
    print("如果返回404，说明接口路径可能不正确")

