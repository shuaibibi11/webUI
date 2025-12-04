#!/usr/bin/env python3
"""
API登录功能测试程序
直接测试后端API接口，不依赖浏览器
"""

import time
import json
import requests
from requests.exceptions import RequestException

class APILoginTest:
    def __init__(self):
        # 测试配置
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'user_api_url': 'http://localhost:11031',
            'admin_api_url': 'http://localhost:11025',
            'test_user': {
                'username': 'testuser',
                'password': 'Test123456!',
                'phone': '13800138000',
                'email': 'test@example.com',
                'realName': '测试用户',
                'idCard': '110101199001011234'
            },
            'admin_user': {
                'username': 'admin',
                'password': 'Abcdef1!'
            }
        }
        
        # 请求超时时间
        self.timeout = 10
    
    def check_service_health(self):
        """检查所有服务健康状态"""
        print("\n=== 检查服务健康状态 ===")
        
        services = {
            'user-api': self.config['user_api_url'],
            'admin-api': self.config['admin_api_url'],
            'user-web': self.config['user_web_url'],
            'admin-web': self.config['admin_web_url']
        }
        
        all_healthy = True
        
        for service_name, url in services.items():
            try:
                if 'api' in service_name:
                    # API服务检查 - 直接测试根路径
                    response = requests.get(url, timeout=5)
                    if response.status_code in [200, 404, 403]:
                        print(f"✅ {service_name} 服务正常 (状态码: {response.status_code})")
                    else:
                        print(f"❌ {service_name} 服务异常 (状态码: {response.status_code})")
                        all_healthy = False
                else:
                    # Web服务检查
                    response = requests.get(url, timeout=5)
                    if response.status_code == 200:
                        print(f"✅ {service_name} 服务正常 (状态码: {response.status_code})")
                    else:
                        print(f"❌ {service_name} 服务异常 (状态码: {response.status_code})")
                        all_healthy = False
                        
            except RequestException as e:
                print(f"❌ {service_name} 服务不可达: {e}")
                all_healthy = False
        
        return all_healthy
    
    def test_cors_configuration(self):
        """测试CORS配置"""
        print("\n=== 测试CORS配置 ===")
        
        # 测试用户端API的CORS配置
        try:
            # 发送OPTIONS请求测试CORS
            headers = {
                'Origin': self.config['user_web_url'],
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(
                f"{self.config['user_api_url']}/api/users/login",
                headers=headers,
                timeout=5
            )
            
            # 检查CORS头
            cors_headers = response.headers
            
            if 'Access-Control-Allow-Origin' in cors_headers:
                print(f"✅ 用户端API CORS配置正常")
                print(f"   允许的源: {cors_headers.get('Access-Control-Allow-Origin')}")
            else:
                print("❌ 用户端API缺少CORS头")
                
        except RequestException as e:
            print(f"❌ CORS测试失败: {e}")
        
        # 测试管理端API的CORS配置
        try:
            headers = {
                'Origin': self.config['admin_web_url'],
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(
                f"{self.config['admin_api_url']}/api/users/login",
                headers=headers,
                timeout=5
            )
            
            cors_headers = response.headers
            
            if 'Access-Control-Allow-Origin' in cors_headers:
                print(f"✅ 管理端API CORS配置正常")
                print(f"   允许的源: {cors_headers.get('Access-Control-Allow-Origin')}")
            else:
                print("❌ 管理端API缺少CORS头")
                
        except RequestException as e:
            print(f"❌ CORS测试失败: {e}")
    
    def test_user_api_login(self):
        """测试用户端API登录"""
        print("\n=== 测试用户端API登录 ===")
        
        login_data = {
            'username': self.config['test_user']['username'],
            'password': self.config['test_user']['password']
        }
        
        try:
            # 发送登录请求
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=self.timeout
            )
            
            print(f"HTTP状态码: {response.status_code}")
            print(f"响应头: {dict(response.headers)}")
            print(f"响应内容: {response.text}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    if result.get('code') == 200:
                        print("✅ 用户端API登录成功")
                        print(f"   返回数据: {json.dumps(result, ensure_ascii=False, indent=2)}")
                        
                        # 检查token是否存在
                        if 'token' in result:
                            print("✅ Token返回正常")
                            return True
                        else:
                            print("❌ Token未返回或格式错误")
                            return False
                    else:
                        print(f"❌ 用户端API登录失败: {result.get('message', '未知错误')}")
                        return False
                        
                except json.JSONDecodeError as e:
                    print(f"❌ 响应不是有效的JSON格式: {e}")
                    print(f"   原始响应: {response.text}")
                    return False
            else:
                print(f"❌ 用户端API登录HTTP错误: {response.status_code}")
                return False
                
        except RequestException as e:
            print(f"❌ 用户端API登录请求失败: {e}")
            return False
    
    def test_admin_api_login(self):
        """测试管理端API登录"""
        print("\n=== 测试管理端API登录 ===")
        
        login_data = {
            'username': self.config['admin_user']['username'],
            'password': self.config['admin_user']['password']
        }
        
        try:
            # 管理端网页的/api/users路径是代理到user-api的
            # 所以应该使用user-api的地址进行测试
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=self.timeout
            )
            
            print(f"HTTP状态码: {response.status_code}")
            print(f"响应头: {dict(response.headers)}")
            print(f"响应内容: {response.text}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    if result.get('code') == 200:
                        print("✅ 管理端API登录成功")
                        print(f"   返回数据: {json.dumps(result, ensure_ascii=False, indent=2)}")
                        
                        # 检查token是否存在
                        if 'token' in result:
                            print("✅ Token返回正常")
                            return True
                        else:
                            print("❌ Token未返回或格式错误")
                            return False
                    else:
                        print(f"❌ 管理端API登录失败: {result.get('message', '未知错误')}")
                        return False
                        
                except json.JSONDecodeError as e:
                    print(f"❌ 响应不是有效的JSON格式: {e}")
                    print(f"   原始响应: {response.text}")
                    return False
            else:
                print(f"❌ 管理端API登录HTTP错误: {response.status_code}")
                return False
                
        except RequestException as e:
            print(f"❌ 管理端API登录请求失败: {e}")
            return False
    
    def test_web_page_accessibility(self):
        """测试网页可访问性"""
        print("\n=== 测试网页可访问性 ===")
        
        # 测试用户端网页
        try:
            response = requests.get(f"{self.config['user_web_url']}/login", timeout=5)
            if response.status_code == 200:
                print("✅ 用户端登录页面可访问")
            else:
                print(f"❌ 用户端登录页面不可访问 (状态码: {response.status_code})")
        except RequestException as e:
            print(f"❌ 用户端登录页面不可达: {e}")
        
        # 测试管理端网页
        try:
            response = requests.get(f"{self.config['admin_web_url']}/login", timeout=5)
            if response.status_code == 200:
                print("✅ 管理端登录页面可访问")
            else:
                print(f"❌ 管理端登录页面不可访问 (状态码: {response.status_code})")
        except RequestException as e:
            print(f"❌ 管理端登录页面不可达: {e}")
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始API登录功能测试...")
        print("=" * 60)
        
        try:
            # 检查服务健康状态
            if not self.check_service_health():
                print("\n❌ 服务检查失败，无法继续测试")
                return False
            
            # 测试CORS配置
            self.test_cors_configuration()
            
            # 测试网页可访问性
            self.test_web_page_accessibility()
            
            # 测试用户端API登录
            user_login_success = self.test_user_api_login()
            
            # 测试管理端API登录
            admin_login_success = self.test_admin_api_login()
            
            # 汇总测试结果
            print("\n" + "=" * 60)
            print("📊 测试结果汇总:")
            print(f"   用户端API登录: {'✅ 成功' if user_login_success else '❌ 失败'}")
            print(f"   管理端API登录: {'✅ 成功' if admin_login_success else '❌ 失败'}")
            
            if user_login_success and admin_login_success:
                print("\n🎉 所有API测试通过！后端登录功能正常")
                print("💡 如果前端仍有问题，可能是前端代码或配置问题")
                return True
            else:
                print("\n⚠️ 部分测试失败，需要进一步排查问题")
                return False
                
        except Exception as e:
            print(f"\n❌ 测试执行过程中发生异常: {e}")
            return False

def main():
    """主函数"""
    print("API登录功能测试程序")
    print("=" * 60)
    
    try:
        # 创建测试实例
        test = APILoginTest()
        
        # 运行所有测试
        success = test.run_all_tests()
        
        if success:
            print("\n🎊 恭喜！API登录功能正常！")
            print("现在可以尝试在浏览器中访问登录页面进行测试。")
        else:
            print("\n💡 测试发现问题，请查看上面的错误信息进行修复。")
            
    except Exception as e:
        print(f"\n❌ 测试程序启动失败: {e}")
        print("请检查以下可能的问题:")
        print("1. 后端服务是否正在运行")
        print("2. 网络连接是否正常")
        print("3. 防火墙或端口配置是否正确")

if __name__ == "__main__":
    main()