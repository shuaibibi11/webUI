import requests
import json

# 创建管理员账户
def create_admin():
    USER_API_URL = "http://localhost:11027/api"
    ADMIN_API_URL = "http://localhost:11025/api/admin"
    
    # 创建管理员账户
    admin_data = {
        "username": "admin",
        "password": "Admin123!",
        "email": "admin@example.com",
        "phone": "13800000000",
        "realName": "系统管理员",
        "idCard": "110101199001011234",
        "role": "ADMIN"
    }
    
    print("创建管理员账户...")
    try:
        response = requests.post(f"{USER_API_URL}/users/register", json=admin_data)
        if response.status_code == 201:
            result = response.json()
            user_id = result.get("user", {}).get("id")
            print(f"✓ 成功创建管理员账户，ID: {user_id}")
            
            # 使用管理员账户登录获取token
            admin_login_data = {
                "username": "admin",
                "password": "Admin123!"
            }
            
            print("\n管理员登录...")
            try:
                response = requests.post(f"{ADMIN_API_URL}/auth/login", json=admin_login_data)
                if response.status_code == 200:
                    admin_result = response.json()
                    admin_token = admin_result.get("token")
                    print(f"✓ 管理员登录成功")
                    
                    # 审核管理员账户
                    print(f"\n审核管理员账户...")
                    approve_headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {admin_token}"
                    }
                    
                    try:
                        response = requests.put(f"{ADMIN_API_URL}/users/{user_id}/approve", headers=approve_headers)
                        if response.status_code == 200:
                            print(f"✓ 管理员账户审核成功")
                            
                            # 再次尝试登录
                            print(f"\n再次尝试管理员登录...")
                            try:
                                response = requests.post(f"{ADMIN_API_URL}/auth/login", json=admin_login_data)
                                if response.status_code == 200:
                                    admin_result = response.json()
                                    print(f"✓ 管理员登录成功: {json.dumps(admin_result, indent=2, ensure_ascii=False)}")
                                else:
                                    print(f"✗ 管理员登录失败: {response.status_code} - {response.text}")
                            except Exception as e:
                                print(f"✗ 管理员登录出错: {str(e)}")
                        else:
                            print(f"✗ 管理员账户审核失败: {response.status_code} - {response.text}")
                    except Exception as e:
                        print(f"✗ 管理员账户审核出错: {str(e)}")
                else:
                    print(f"✗ 管理员登录失败: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"✗ 管理员登录出错: {str(e)}")
        else:
            print(f"✗ 创建管理员账户失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 创建管理员账户出错: {str(e)}")

if __name__ == "__main__":
    create_admin()