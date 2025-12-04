#!/usr/bin/env python3
import requests
import json
import base64
import hmac
import hashlib
import time

def generate_jwt_token():
    """生成一个有效的JWT token"""
    # 使用与服务器相同的密钥
    secret = "your-secret-key-change-in-production"
    
    # 创建JWT头部
    header = json.dumps({"alg": "HS256", "typ": "JWT"})
    header_encoded = base64.urlsafe_b64encode(header.encode()).decode().rstrip('=')
    
    # 创建JWT载荷（包含管理员信息）
    payload = json.dumps({
        "userId": "1",
        "username": "admin",
        "role": "ADMIN",
        "exp": int(time.time()) + 3600  # 1小时后过期
    })
    payload_encoded = base64.urlsafe_b64encode(payload.encode()).decode().rstrip('=')
    
    # 创建签名
    message = f"{header_encoded}.{payload_encoded}".encode()
    signature = hmac.new(secret.encode(), message, hashlib.sha256).digest()
    signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    # 组合成JWT令牌
    jwt_token = f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    return jwt_token

def test_model_save():
    """测试模型保存功能"""
    base_url = "http://localhost:11025/api/admin"
    jwt_token = generate_jwt_token()
    
    # 设置请求头
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    
    # 测试数据
    model_data = {
        "provider": "OpenAI",
        "modelName": "Test Model",
        "endpoint": "https://api.openai.com/v1",
        "apiKey": "test-key",
        "tag": "test",
        "enabled": True
    }
    
    print("测试模型保存功能...")
    print(f"JWT Token: {jwt_token}")
    print(f"请求数据: {json.dumps(model_data, indent=2)}")
    
    try:
        # 发送POST请求
        response = requests.post(f"{base_url}/models", headers=headers, json=model_data)
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 201:
            print("✓ 模型保存成功")
            return True
        else:
            print("✗ 模型保存失败")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

def test_model_list():
    """测试获取模型列表"""
    base_url = "http://localhost:11025/api/admin"
    jwt_token = generate_jwt_token()
    
    # 设置请求头
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    
    print("\n测试获取模型列表...")
    
    try:
        # 发送GET请求
        response = requests.get(f"{base_url}/models", headers=headers)
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            print("✓ 获取模型列表成功")
            return True
        else:
            print("✗ 获取模型列表失败")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

if __name__ == "__main__":
    print("开始测试模型管理功能...")
    
    # 先测试获取模型列表
    list_success = test_model_list()
    
    # 再测试模型保存
    save_success = test_model_save()
    
    if list_success and save_success:
        print("\n✓ 所有测试通过")
    else:
        print("\n✗ 部分测试失败")