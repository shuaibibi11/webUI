import requests
import json
import base64
import hmac
import hashlib
import time

# 创建测试用户
def create_test_user():
    base_url = "http://localhost:11027/api"
    
    # 创建用户注册请求
    user_data = {
        "username": "testuser",
        "password": "TestPassword123!",
        "email": "test@example.com",
        "phone": "13800138000",
        "realName": "测试用户",
        "idCard": "110101199001011234"
    }
    
    print("创建测试用户...")
    try:
        response = requests.post(f"{base_url}/users/register", json=user_data)
        if response.status_code == 201:
            print(f"✓ 成功创建测试用户: {response.json()}")
            return True
        else:
            print(f"✗ 创建测试用户失败: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ 创建测试用户出错: {str(e)}")
        return False

# 测试用户API是否正常工作
def test_user_api():
    base_url = "http://localhost:11027/api"
    
    # 创建一个测试用户JWT令牌
    # 使用与服务器相同的密钥
    jwt_secret = "your-secret-key-change-in-production"
    
    # 创建JWT头部
    header = json.dumps({"alg": "HS256", "typ": "JWT"})
    header_encoded = base64.urlsafe_b64encode(header.encode()).decode().rstrip('=')
    
    # 创建JWT载荷
    payload = json.dumps({
        "userId": "test-user-id",
        "username": "testuser",
        "role": "user",
        "exp": int(time.time()) + 3600  # 1小时后过期
    })
    payload_encoded = base64.urlsafe_b64encode(payload.encode()).decode().rstrip('=')
    
    # 创建签名
    message = f"{header_encoded}.{payload_encoded}".encode()
    signature = hmac.new(jwt_secret.encode(), message, hashlib.sha256).digest()
    signature_encoded = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    
    # 组合成JWT令牌
    jwt_token = f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    
    # 设置请求头
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    
    # 测试获取模型列表
    print("\n测试获取模型列表...")
    try:
        response = requests.get(f"{base_url}/models")
        if response.status_code == 200:
            models = response.json()
            print(f"✓ 成功获取模型列表: {json.dumps(models, indent=2, ensure_ascii=False)}")
        else:
            print(f"✗ 获取模型列表失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 获取模型列表出错: {str(e)}")
    
    # 测试获取对话列表
    print("\n测试获取对话列表...")
    try:
        response = requests.get(f"{base_url}/conversations", headers=headers)
        if response.status_code == 200:
            conversations = response.json()
            print(f"✓ 成功获取对话列表: {json.dumps(conversations, indent=2, ensure_ascii=False)}")
        else:
            print(f"✗ 获取对话列表失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 获取对话列表出错: {str(e)}")
    
    # 测试获取消息列表
    print("\n测试获取消息列表...")
    try:
        # 先获取一个对话ID
        response = requests.get(f"{base_url}/conversations", headers=headers)
        if response.status_code == 200:
            conversations = response.json().get("data", {}).get("conversations", [])
            if conversations:
                conversation_id = conversations[0]["id"]
                response = requests.get(f"{base_url}/messages/{conversation_id}", headers=headers)
                if response.status_code == 200:
                    messages = response.json()
                    print(f"✓ 成功获取消息列表: {json.dumps(messages, indent=2, ensure_ascii=False)}")
                else:
                    print(f"✗ 获取消息列表失败: {response.status_code} - {response.text}")
            else:
                print("✗ 没有可用的对话")
        else:
            print(f"✗ 获取对话列表失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 获取消息列表出错: {str(e)}")

if __name__ == "__main__":
    if create_test_user():
        test_user_api()