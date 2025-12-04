import requests
import json

def test_user_api_login():
    try:
        print("测试user-api登录端点...")
        
        response = requests.post(
            'http://localhost:11031/api/users/login',
            json={
                'username': 'admin',
                'password': 'Abcdef1!'
            },
            headers={
                'Content-Type': 'application/json'
            }
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应数据: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 200:
                print("✅ user-api登录成功")
                return True
            else:
                print(f"❌ user-api登录失败: {data.get('message', '未知错误')}")
                return False
        else:
            print(f"❌ user-api登录失败，状态码: {response.status_code}")
            return False
        
    except Exception as e:
        print(f"错误: {str(e)}")
        return False

def test_admin_api_login():
    try:
        print("\n测试admin-api登录端点...")
        
        response = requests.post(
            'http://localhost:11025/api/admin/auth/login',
            json={
                'username': 'admin',
                'password': 'Abcdef1!'
            },
            headers={
                'Content-Type': 'application/json'
            }
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应数据: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('code') == 200:
                print("✅ admin-api登录成功")
                return True
            else:
                print(f"❌ admin-api登录失败: {data.get('message', '未知错误')}")
                return False
        else:
            print(f"❌ admin-api登录失败，状态码: {response.status_code}")
            return False
        
    except Exception as e:
        print(f"错误: {str(e)}")
        return False

if __name__ == "__main__":
    user_api_success = test_user_api_login()
    admin_api_success = test_admin_api_login()
    
    print(f"\n总结:")
    print(f"user-api登录: {'成功' if user_api_success else '失败'}")
    print(f"admin-api登录: {'成功' if admin_api_success else '失败'}")