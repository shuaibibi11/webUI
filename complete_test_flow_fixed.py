import requests
import json
import random
import string

# 完整测试流程：创建用户 -> 管理员审核 -> 用户登录 -> 测试API
def complete_test_flow():
    USER_API_URL = "http://localhost:11027/api"
    ADMIN_API_URL = "http://localhost:11025/api/admin"
    
    # 生成随机用户信息
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    username = f"testuser_{random_suffix}"
    phone = f"138{random.randint(10000000, 99999999)}"
    email = f"{username}@example.com"
    
    # 生成随机的实名信息
    real_name = f"测试用户{random_suffix}"
    # 生成随机的身份证号（前6位地区码，中间8位生日（YYYYMMDD），后3位顺序码，最后1位校验码）
    area_code = f"{random.randint(110000, 659000)}"
    birth_date = f"{random.randint(1980, 2000)}{random.randint(1, 12):02d}{random.randint(1, 28):02d}"
    sequence_code = f"{random.randint(1, 999):03d}"
    # 简单的校验码计算（这里使用随机数代替，实际应该按照国家标准计算）
    check_code = f"{random.randint(0, 9)}"
    id_card = f"{area_code}{birth_date}{sequence_code}{check_code}"
    
    # 创建用户注册请求
    user_data = {
        "username": username,
        "password": "TestPassword123!",
        "email": email,
        "phone": phone,
        "realName": real_name,
        "idCard": id_card
    }
    
    print(f"1. 创建测试用户: {username}...")
    try:
        response = requests.post(f"{USER_API_URL}/users/register", json=user_data)
        if response.status_code == 201:
            result = response.json()
            user_id = result.get("user", {}).get("id")
            print(f"✓ 成功创建测试用户，ID: {user_id}")
            
            # 管理员登录
            print("\n2. 管理员登录...")
            admin_login_data = {
                "username": "admin",
                "password": "Abcdef1!"
            }
            
            try:
                response = requests.post(f"{ADMIN_API_URL}/auth/login", json=admin_login_data)
                if response.status_code == 200:
                    admin_result = response.json()
                    admin_token = admin_result.get("token")
                    print(f"✓ 管理员登录成功")
                    
                    # 审核用户
                    print(f"\n3. 审核用户 {username}...")
                    approve_headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {admin_token}"
                    }
                    
                    try:
                        response = requests.put(f"{ADMIN_API_URL}/users/{user_id}/approve", headers=approve_headers)
                        if response.status_code == 200:
                            print(f"✓ 用户审核成功")
                            
                            # 用户登录
                            print(f"\n4. 用户 {username} 登录...")
                            user_login_data = {
                                "username": username,
                                "password": "TestPassword123!"
                            }
                            
                            try:
                                response = requests.post(f"{USER_API_URL}/users/login", json=user_login_data)
                                if response.status_code == 200:
                                    user_result = response.json()
                                    user_token = user_result.get("token")
                                    print(f"✓ 用户登录成功")
                                    
                                    # 设置用户请求头
                                    user_headers = {
                                        "Authorization": f"Bearer {user_token}",
                                        "Content-Type": "application/json"
                                    }
                                    
                                    # 测试获取模型列表
                                    print(f"\n5. 测试获取模型列表...")
                                    try:
                                        response = requests.get(f"{USER_API_URL}/models")
                                        if response.status_code == 200:
                                            models = response.json()
                                            print(f"✓ 成功获取模型列表: {json.dumps(models, indent=2, ensure_ascii=False)}")
                                        else:
                                            print(f"✗ 获取模型列表失败: {response.status_code} - {response.text}")
                                    except Exception as e:
                                        print(f"✗ 获取模型列表出错: {str(e)}")
                                    
                                    # 测试获取对话列表
                                    print(f"\n6. 测试获取对话列表...")
                                    try:
                                        response = requests.get(f"{USER_API_URL}/conversations", headers=user_headers)
                                        if response.status_code == 200:
                                            conversations = response.json()
                                            print(f"✓ 成功获取对话列表: {json.dumps(conversations, indent=2, ensure_ascii=False)}")
                                        else:
                                            print(f"✗ 获取对话列表失败: {response.status_code} - {response.text}")
                                    except Exception as e:
                                        print(f"✗ 获取对话列表出错: {str(e)}")
                                    
                                    # 测试创建对话
                                    print(f"\n7. 测试创建对话...")
                                    try:
                                        conversation_data = {
                                            "title": "测试对话"
                                        }
                                        response = requests.post(f"{USER_API_URL}/conversations", json=conversation_data, headers=user_headers)
                                        if response.status_code == 201:
                                            conversation = response.json()
                                            print(f"✓ 成功创建对话: {json.dumps(conversation, indent=2, ensure_ascii=False)}")
                                            
                                            # 获取对话ID用于测试消息
                                            conversation_id = conversation.get("conversation", {}).get("id")
                                            
                                            # 测试获取消息列表
                                            print(f"\n8. 测试获取消息列表...")
                                            try:
                                                response = requests.get(f"{USER_API_URL}/messages/{conversation_id}", headers=user_headers)
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
                                    print(f"✗ 用户登录失败: {response.status_code} - {response.text}")
                            except Exception as e:
                                print(f"✗ 用户登录出错: {str(e)}")
                        else:
                            print(f"✗ 用户审核失败: {response.status_code} - {response.text}")
                    except Exception as e:
                        print(f"✗ 用户审核出错: {str(e)}")
                else:
                    print(f"✗ 管理员登录失败: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"✗ 管理员登录出错: {str(e)}")
        else:
            print(f"✗ 创建测试用户失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 创建测试用户出错: {str(e)}")

if __name__ == "__main__":
    complete_test_flow()