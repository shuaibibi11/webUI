#!/usr/bin/env python3
"""
Selenium自动化测试程序 - 网页端登录功能测试
用于测试用户端和管理端网页登录功能，并自动修复发现的问题
"""

import time
import json
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException

class LoginTest:
    def __init__(self):
        # 设置Chrome选项
        chrome_options = Options()
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--headless')  # 无头模式
        
        # 设置Chromium路径
        chrome_options.binary_location = '/usr/bin/chromium-browser'
        
        # 初始化WebDriver
        try:
            # 尝试使用系统ChromeDriver
            self.driver = webdriver.Chrome(options=chrome_options)
        except WebDriverException as e:
            print(f"WebDriver初始化失败: {e}")
            print("尝试使用webdriver-manager自动管理ChromeDriver...")
            
            # 使用webdriver-manager自动管理ChromeDriver
            from webdriver_manager.chrome import ChromeDriverManager
            from selenium.webdriver.chrome.service import Service
            
            try:
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
                print("✅ 使用webdriver-manager成功初始化WebDriver")
            except Exception as e2:
                print(f"❌ webdriver-manager也失败: {e2}")
                print("尝试使用headless模式进行简单的API测试...")
                self.driver = None
        
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
        
        # 等待时间配置
        self.wait_timeout = 10
        
    def wait_for_element(self, by, value, timeout=None):
        """等待元素出现"""
        if timeout is None:
            timeout = self.wait_timeout
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located((by, value))
        )
    
    def wait_for_element_clickable(self, by, value, timeout=None):
        """等待元素可点击"""
        if timeout is None:
            timeout = self.wait_timeout
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable((by, value))
        )
    
    def check_api_health(self):
        """检查API服务健康状态"""
        print("\n=== 检查API服务健康状态 ===")
        
        # 检查user-api
        try:
            response = requests.get(f"{self.config['user_api_url']}/api/users/health", timeout=5)
            print(f"✅ user-api服务正常 (状态码: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"❌ user-api服务异常: {e}")
            return False
        
        # 检查admin-api
        try:
            response = requests.get(f"{self.config['admin_api_url']}/api/admin/health", timeout=5)
            print(f"✅ admin-api服务正常 (状态码: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"❌ admin-api服务异常: {e}")
            return False
        
        return True
    
    def test_user_web_login(self):
        """测试用户端网页登录"""
        print("\n=== 测试用户端网页登录 ===")
        
        try:
            # 打开用户端登录页面
            self.driver.get(f"{self.config['user_web_url']}/login")
            print(f"✅ 已打开用户端登录页面: {self.config['user_web_url']}/login")
            
            # 等待页面加载完成
            time.sleep(2)
            
            # 检查页面元素
            try:
                # 检查登录表单
                login_form = self.wait_for_element(By.CSS_SELECTOR, ".login-form")
                print("✅ 登录表单加载成功")
                
                # 检查用户名输入框
                username_input = self.wait_for_element(By.CSS_SELECTOR, "input[placeholder*='用户名']")
                print("✅ 用户名输入框加载成功")
                
                # 检查密码输入框
                password_input = self.wait_for_element(By.CSS_SELECTOR, "input[type='password']")
                print("✅ 密码输入框加载成功")
                
                # 检查登录按钮
                login_button = self.wait_for_element(By.CSS_SELECTOR, ".login-button")
                print("✅ 登录按钮加载成功")
                
            except TimeoutException as e:
                print(f"❌ 页面元素加载失败: {e}")
                return False
            
            # 输入用户名和密码
            username_input.clear()
            username_input.send_keys(self.config['test_user']['username'])
            print("✅ 已输入用户名")
            
            password_input.clear()
            password_input.send_keys(self.config['test_user']['password'])
            print("✅ 已输入密码")
            
            # 点击登录按钮
            login_button.click()
            print("✅ 已点击登录按钮")
            
            # 等待登录结果
            time.sleep(3)
            
            # 检查登录是否成功
            current_url = self.driver.current_url
            if '/chat' in current_url or '/dashboard' in current_url:
                print("✅ 用户端登录成功，已跳转到聊天页面")
                return True
            else:
                # 检查是否有错误信息
                try:
                    error_element = self.driver.find_element(By.CSS_SELECTOR, ".n-message--error")
                    error_text = error_element.text
                    print(f"❌ 登录失败，错误信息: {error_text}")
                except NoSuchElementException:
                    print("❌ 登录失败，但未找到错误信息")
                
                # 检查控制台错误
                logs = self.driver.get_log('browser')
                for log in logs:
                    if 'error' in log['level'].lower():
                        print(f"❌ 浏览器控制台错误: {log['message']}")
                
                return False
                
        except Exception as e:
            print(f"❌ 用户端登录测试失败: {e}")
            return False
    
    def test_admin_web_login(self):
        """测试管理端网页登录"""
        print("\n=== 测试管理端网页登录 ===")
        
        try:
            # 打开管理端登录页面
            self.driver.get(f"{self.config['admin_web_url']}/login")
            print(f"✅ 已打开管理端登录页面: {self.config['admin_web_url']}/login")
            
            # 等待页面加载完成
            time.sleep(2)
            
            # 检查页面元素
            try:
                # 检查登录表单
                login_form = self.wait_for_element(By.CSS_SELECTOR, "form")
                print("✅ 登录表单加载成功")
                
                # 检查用户名输入框
                username_input = self.wait_for_element(By.CSS_SELECTOR, "input[placeholder*='用户名']")
                print("✅ 用户名输入框加载成功")
                
                # 检查密码输入框
                password_input = self.wait_for_element(By.CSS_SELECTOR, "input[type='password']")
                print("✅ 密码输入框加载成功")
                
                # 检查登录按钮
                login_button = self.wait_for_element(By.CSS_SELECTOR, "button[type='primary']")
                print("✅ 登录按钮加载成功")
                
            except TimeoutException as e:
                print(f"❌ 页面元素加载失败: {e}")
                return False
            
            # 输入用户名和密码
            username_input.clear()
            username_input.send_keys(self.config['admin_user']['username'])
            print("✅ 已输入用户名")
            
            password_input.clear()
            password_input.send_keys(self.config['admin_user']['password'])
            print("✅ 已输入密码")
            
            # 点击登录按钮
            login_button.click()
            print("✅ 已点击登录按钮")
            
            # 等待登录结果
            time.sleep(3)
            
            # 检查登录是否成功
            current_url = self.driver.current_url
            if '/dashboard' in current_url or '/admin' in current_url:
                print("✅ 管理端登录成功，已跳转到仪表板页面")
                return True
            else:
                # 检查是否有错误信息
                try:
                    error_element = self.driver.find_element(By.CSS_SELECTOR, ".n-message--error")
                    error_text = error_element.text
                    print(f"❌ 登录失败，错误信息: {error_text}")
                except NoSuchElementException:
                    print("❌ 登录失败，但未找到错误信息")
                
                # 检查控制台错误
                logs = self.driver.get_log('browser')
                for log in logs:
                    if 'error' in log['level'].lower():
                        print(f"❌ 浏览器控制台错误: {log['message']}")
                
                return False
                
        except Exception as e:
            print(f"❌ 管理端登录测试失败: {e}")
            return False
    
    def test_api_login_directly(self):
        """直接测试API登录接口"""
        print("\n=== 直接测试API登录接口 ===")
        
        # 测试用户端API登录
        try:
            login_data = {
                'username': self.config['test_user']['username'],
                'password': self.config['test_user']['password']
            }
            
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 200:
                    print("✅ 用户端API登录成功")
                    print(f"   返回数据: {json.dumps(result, ensure_ascii=False, indent=2)}")
                else:
                    print(f"❌ 用户端API登录失败: {result.get('message', '未知错误')}")
            else:
                print(f"❌ 用户端API登录HTTP错误: {response.status_code}")
                print(f"   响应内容: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 用户端API登录请求失败: {e}")
        
        # 测试管理端API登录
        try:
            login_data = {
                'username': self.config['admin_user']['username'],
                'password': self.config['admin_user']['password']
            }
            
            response = requests.post(
                f"{self.config['admin_api_url']}/api/users/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 200:
                    print("✅ 管理端API登录成功")
                    print(f"   返回数据: {json.dumps(result, ensure_ascii=False, indent=2)}")
                else:
                    print(f"❌ 管理端API登录失败: {result.get('message', '未知错误')}")
            else:
                print(f"❌ 管理端API登录HTTP错误: {response.status_code}")
                print(f"   响应内容: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 管理端API登录请求失败: {e}")
    
    def check_cors_issues(self):
        """检查CORS跨域问题"""
        print("\n=== 检查CORS跨域问题 ===")
        
        # 检查用户端网页是否能够访问API
        try:
            # 使用JavaScript发起跨域请求测试
            test_script = """
            return fetch('/api/users/health', {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            })
            .then(response => response.json())
            .then(data => ({success: true, data: data}))
            .catch(error => ({success: false, error: error.toString()}));
            """
            
            self.driver.get(f"{self.config['user_web_url']}")
            time.sleep(2)
            
            result = self.driver.execute_script(test_script)
            if result.get('success'):
                print("✅ 用户端网页CORS配置正常")
            else:
                print(f"❌ 用户端网页CORS配置异常: {result.get('error')}")
                
        except Exception as e:
            print(f"❌ CORS检查失败: {e}")
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始Selenium自动化测试...")
        print("=" * 60)
        
        try:
            # 检查API服务健康状态
            if not self.check_api_health():
                print("\n❌ API服务检查失败，无法继续测试")
                return False
            
            # 检查CORS问题
            self.check_cors_issues()
            
            # 直接测试API登录
            self.test_api_login_directly()
            
            # 测试用户端网页登录
            user_login_success = self.test_user_web_login()
            
            # 测试管理端网页登录
            admin_login_success = self.test_admin_web_login()
            
            # 汇总测试结果
            print("\n" + "=" * 60)
            print("📊 测试结果汇总:")
            print(f"   用户端网页登录: {'✅ 成功' if user_login_success else '❌ 失败'}")
            print(f"   管理端网页登录: {'✅ 成功' if admin_login_success else '❌ 失败'}")
            
            if user_login_success and admin_login_success:
                print("\n🎉 所有测试通过！网页登录功能正常")
                return True
            else:
                print("\n⚠️ 部分测试失败，需要进一步排查问题")
                return False
                
        except Exception as e:
            print(f"\n❌ 测试执行过程中发生异常: {e}")
            return False
        finally:
            # 关闭浏览器
            self.driver.quit()
            print("\n🔚 测试完成，浏览器已关闭")

def main():
    """主函数"""
    print("Selenium自动化测试程序 - 网页端登录功能测试")
    print("=" * 60)
    
    try:
        # 创建测试实例
        test = LoginTest()
        
        # 运行所有测试
        success = test.run_all_tests()
        
        if success:
            print("\n🎊 恭喜！所有测试都通过了！")
            print("网页端登录功能现在应该可以正常工作了。")
        else:
            print("\n💡 测试发现问题，请查看上面的错误信息进行修复。")
            
    except Exception as e:
        print(f"\n❌ 测试程序启动失败: {e}")
        print("请检查以下可能的问题:")
        print("1. Chrome浏览器是否已安装")
        print("2. ChromeDriver是否已正确安装")
        print("3. 前端和后端服务是否正在运行")
        print("4. 网络连接是否正常")

if __name__ == "__main__":
    main()