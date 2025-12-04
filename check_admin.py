import requests

# 检查管理员账户是否存在
def check_admin():
    ADMIN_API_URL = "http://localhost:11025/api/admin"
    
    # 尝试使用默认管理员账户登录
    admin_login_data = {
        "username": "admin",
        "password": "Abcdef1!"
    }
    
    print(f"尝试使用默认管理员账户登录...")
    try:
        response = requests.post(f"{ADMIN_API_URL}/auth/login", json=admin_login_data)
        if response.status_code == 200:
            admin_result = response.json()
            print(f"✓ 管理员登录成功: {admin_result}")
        else:
            print(f"✗ 管理员登录失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 管理员登录出错: {str(e)}")
    
    # 尝试创建管理员账户
    print("\n尝试创建管理员账户...")
    admin_create_data = {
        "username": "admin",
        "password": "Abcdef1!",
        "email": "admin@example.com",
        "phone": "13800000000",
        "realName": "系统管理员",
        "idCard": "110101199001011234",
        "role": "ADMIN"
    }
    
    try:
        response = requests.post(f"http://localhost:11027/api/users/register", json=admin_create_data)
        if response.status_code == 201:
            print(f"✓ 成功创建管理员账户")
        else:
            print(f"✗ 创建管理员账户失败: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"✗ 创建管理员账户出错: {str(e)}")

if __name__ == "__main__":
    check_admin()