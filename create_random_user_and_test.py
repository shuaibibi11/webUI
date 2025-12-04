import requests
import json
import random
import string

# 创建随机测试用户并测试API
def create_random_user_and_test():
    base_url = "http://localhost:11027/api"
    
    # 生成随机用户名和手机号
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    username = f"testuser_{random_suffix}"
    phone = f"138{random.randint(10000000, 99999999)}"
    email = f"{username}@example.com"
    
    # 创建用户注册请求
    user_data = {
        "username": username,
        "password": "TestPassword123!",
        "email": email,
        "phone": phone,
        "realName": "测试用户",
        "idCard": "110101199001011234"
    }
    
    print(f"创建测试用户: {username}...")
    try:
        response = requests.post(f"{base_url}/users/register", json=user_data)
        if response.status_code == 201:
            print(f"✓ 成功创建测试用户: {response.json()}")
            
            # 登录用户
            login_data = {
                "username": username,
                "password": "TestPassword123!"
            }
            
            print(f"\n登录测试用户: {username}...")
            try:
                response = requests.post(f"{base_url}/users/login", json=login_data)
                if response.status_code == 200:
                    login_result = response.json()
                    print(f"✓ 成功登录: {json.dumps(login_result, indent=2, ensure_ascii=False)}")
                    
                    # 提取JWT令牌
                    jwt_token = login_result.get("token")
                    if not jwt_token:
                        print("✗ 登录响应中没有找到token")
                        return
                        
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
                    
                    # 测试创建对话
                    print("\n测试创建对话...")
                    try:
                        conversation_data = {
                            "title": "测试对话"
                        }
                        response = requests.post(f"{base_url}/conversations", json=conversation_data, headers=headers)
                        if response.status_code == 201:
                            conversation = response.json()
                            print(f"✓ 成功创建对话: {json.dumps(conversation, indent=2, ensure_ascii=False)}")
                            
                            # 获取对话ID用于测试消息
                            conversation_id = conversation.get("conversation", {}).get("id")
                            
                            # 测试获取消息列表
                            print("\n测试获取消息列表...")
                            try:
                                response = requests.get(f"{base_url}/messages/{conversation_id}", headers=headers)
                                if response.status_code == 200:
                                    messages = response.json()
                                    print(f"✓ 成功获取消息列表: {json.dumps(messages, indent=2, ensure_ascii=False)}")
                                else:
                                    print(f"✗ 获取消息列表失败: {response.status_code} - {response.text}")
                            except Exception as e:
                                print(f"✗ 获取消息列表出错: {str(e)}")
                        else:
                            print(f"✗ 创建对话失败: {response.status_code} - {response.text}")
                    except Exception as e:
                        print(f"✗ 创建对话出错: {str(e)}")
                        
                else:
                    print(f"✗ 登录失败: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"✗ 登录出错: {str(e)}")
        else:
            print(f"✗ 创建测试用户失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 创建测试用户出错: {str(e)}")

if __name__ == "__main__":
    create_random_user_and_test()