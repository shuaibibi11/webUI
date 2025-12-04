#!/usr/bin/env python3
import json
import jwt
import time
import requests

# JWT密钥（与后端一致）
JWT_SECRET = "your-secret-key-change-in-production"

def generate_jwt_token():
    """生成有效的JWT令牌"""
    payload = {
        "userId": "1",
        "username": "admin",
        "role": "ADMIN",
        "exp": int(time.time()) + 3600  # 1小时后过期
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def test_model_edit():
    """测试模型编辑功能"""
    print("开始测试模型编辑功能...\n")
    
    # 生成JWT token
    token = generate_jwt_token()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    base_url = "http://localhost:11025/api"
    
    # 1. 首先创建一个测试模型
    print("1. 创建测试模型...")
    create_data = {
        "provider": "OpenAI",
        "modelName": "Test Model for Edit",
        "endpoint": "https://api.openai.com/v1",
        "apiKey": "test-key-123",
        "tag": "test",
        "enabled": True
    }
    
    create_response = requests.post(f"{base_url}/admin/models", 
                                   headers=headers, 
                                   json=create_data)
    
    print(f"创建响应状态码: {create_response.status_code}")
    print(f"创建响应内容: {create_response.text}")
    
    if create_response.status_code != 201:
        print("❌ 创建模型失败")
        return False
    
    print("✓ 创建模型成功\n")
    
    # 2. 获取模型列表，找到刚创建的模型ID
    print("2. 获取模型列表...")
    list_response = requests.get(f"{base_url}/admin/models", headers=headers)
    
    print(f"列表响应状态码: {list_response.status_code}")
    
    if list_response.status_code == 200:
        list_data = list_response.json()
        models = list_data.get('data', {}).get('models', [])
        
        if not models:
            print("❌ 模型列表为空")
            return False
        
        # 找到刚创建的测试模型
        test_model = None
        for model in models:
            if model.get('modelName') == "Test Model for Edit":
                test_model = model
                break
        
        if not test_model:
            print("❌ 未找到测试模型")
            return False
        
        model_id = test_model['id']
        print(f"找到测试模型ID: {model_id}")
        print("✓ 获取模型列表成功\n")
    else:
        print("❌ 获取模型列表失败")
        return False
    
    # 3. 测试模型编辑功能
    print("3. 测试模型编辑功能...")
    update_data = {
        "provider": "AzureOpenAI",
        "modelName": "Updated Test Model",
        "endpoint": "https://azure-openai-endpoint.com/v1",
        "apiKey": "updated-test-key-456",
        "tag": "updated-test",
        "enabled": False
    }
    
    print(f"更新数据: {json.dumps(update_data, indent=2)}")
    
    update_response = requests.put(f"{base_url}/admin/models/{model_id}", 
                                  headers=headers, 
                                  json=update_data)
    
    print(f"更新响应状态码: {update_response.status_code}")
    print(f"更新响应内容: {update_response.text}")
    
    if update_response.status_code == 200:
        print("✓ 模型更新成功\n")
    else:
        print("❌ 模型更新失败")
        return False
    
    # 4. 验证更新结果
    print("4. 验证更新结果...")
    verify_response = requests.get(f"{base_url}/admin/models", headers=headers)
    
    if verify_response.status_code == 200:
        verify_data = verify_response.json()
        updated_models = verify_data.get('data', {}).get('models', [])
        
        updated_model = None
        for model in updated_models:
            if model.get('id') == model_id:
                updated_model = model
                break
        
        if updated_model:
            print(f"更新后模型信息:")
            print(f"  - Provider: {updated_model.get('provider')}")
            print(f"  - ModelName: {updated_model.get('modelName')}")
            print(f"  - Endpoint: {updated_model.get('endpoint')}")
            print(f"  - Enabled: {updated_model.get('enabled')}")
            
            # 验证字段是否已更新
            if (updated_model.get('provider') == "AzureOpenAI" and 
                updated_model.get('modelName') == "Updated Test Model" and 
                updated_model.get('enabled') == False):
                print("✓ 模型更新验证成功")
            else:
                print("❌ 模型更新验证失败")
                return False
        else:
            print("❌ 未找到更新后的模型")
            return False
    else:
        print("❌ 验证更新结果失败")
        return False
    
    # 5. 清理测试数据
    print("\n5. 清理测试数据...")
    delete_response = requests.delete(f"{base_url}/admin/models/{model_id}", headers=headers)
    
    if delete_response.status_code == 200:
        print("✓ 测试数据清理成功")
    else:
        print("⚠ 测试数据清理失败（可忽略）")
    
    print("\n✅ 模型编辑功能测试通过！")
    return True

if __name__ == "__main__":
    try:
        test_model_edit()
    except Exception as e:
        print(f"❌ 测试过程中发生错误: {e}")