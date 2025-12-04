import requests
import json

def test_login():
    try:
        print("测试admin-api登录端点...")
        
        response = requests.post(
            'http://localhost:11025/api/admin/auth/login',
            json={
                'username': 'admin',
                'password': 'Abcdef1!'
            },
            headers={
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:13085'
            }
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应头: {dict(response.headers)}")
        print(f"响应数据: {response.text}")
        
    except Exception as e:
        print(f"错误: {str(e)}")

if __name__ == "__main__":
    test_login()