import requests

# 检查用户列表
def check_users():
    USER_API_URL = "http://localhost:11027/api"
    
    # 尝试获取所有用户
    print("尝试获取用户列表...")
    try:
        response = requests.get(f"{USER_API_URL}/users")
        if response.status_code == 200:
            users = response.json()
            print(f"✓ 成功获取用户列表: {users}")
        else:
            print(f"✗ 获取用户列表失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 获取用户列表出错: {str(e)}")
    
    # 尝试重置管理员密码
    print("\n尝试重置管理员密码...")
    try:
        # 首先尝试使用不同的管理员凭证
        admin_credentials = [
            {"username": "admin", "password": "admin123"},
            {"username": "admin", "password": "admin"},
            {"username": "admin", "password": "123456"},
            {"username": "admin", "password": "password"},
            {"username": "admin", "password": "Admin123!"}
        ]
        
        for creds in admin_credentials:
            print(f"尝试使用管理员账户: {creds['username']}/{creds['password']}")
            response = requests.post(f"http://localhost:11025/api/admin/auth/login", json=creds)
            if response.status_code == 200:
                admin_result = response.json()
                print(f"✓ 管理员登录成功: {admin_result}")
                return
            else:
                print(f"✗ 管理员登录失败: {response.status_code} - {response.text}")
        
        print("所有管理员凭证都无效")
    except Exception as e:
        print(f"✗ 检查管理员凭证出错: {str(e)}")

if __name__ == "__main__":
    check_users()