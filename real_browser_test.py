#!/usr/bin/env python3
"""
真实浏览器登录测试程序
模拟真实用户操作，使用有头浏览器进行登录测试，并获取网络控制信息
"""

import time
import json
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RealBrowserLoginTest:
    def __init__(self):
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'user_api_url': 'http://localhost:11031',
            'admin_api_url': 'http://localhost:11025',
            'test_user': {'username': 'testuser', 'password': 'password123'},
            'admin_user': {'username': 'admin', 'password': 'admin123'},
            'timeout': 10
        }
        self.driver = None
        self.network_logs = []
        
    def setup_browser(self):
        """设置浏览器配置"""
        logger.info("正在设置浏览器配置...")
        
        chrome_options = Options()
        
        # 有头模式，显示浏览器窗口
        # chrome_options.add_argument("--headless")  # 注释掉这行，使用有头模式
        
        # 其他配置
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--start-maximized")
        
        # 启用性能日志记录
        chrome_options.set_capability("goog:loggingPrefs", {
            'performance': 'ALL',
            'browser': 'ALL'
        })
        
        try:
            # 尝试使用系统ChromeDriver
            service = Service()
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            logger.info("✅ 使用系统ChromeDriver成功")
        except Exception as e:
            logger.warning(f"系统ChromeDriver失败: {e}")
            try:
                # 使用webdriver-manager自动管理
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
                logger.info("✅ 使用webdriver-manager成功")
            except Exception as e2:
                logger.error(f"浏览器初始化失败: {e2}")
                self.driver = None
                return False
        
        return True
    
    def capture_network_requests(self):
        """捕获网络请求信息"""
        if not self.driver:
            return []
        
        try:
            # 获取性能日志
            logs = self.driver.get_log('performance')
            network_requests = []
            
            for log in logs:
                try:
                    message = json.loads(log['message'])
                    message_params = message.get('message', {})
                    
                    if message_params.get('method') == 'Network.requestWillBeSent':
                        request_info = message_params.get('params', {})
                        url = request_info.get('request', {}).get('url', '')
                        method = request_info.get('request', {}).get('method', '')
                        
                        # 只记录API请求
                        if '/api/' in url:
                            network_requests.append({
                                'url': url,
                                'method': method,
                                'timestamp': log['timestamp'],
                                'type': 'REQUEST'
                            })
                            
                    elif message_params.get('method') == 'Network.responseReceived':
                        response_info = message_params.get('params', {})
                        url = response_info.get('response', {}).get('url', '')
                        status = response_info.get('response', {}).get('status', 0)
                        
                        if '/api/' in url:
                            network_requests.append({
                                'url': url,
                                'status': status,
                                'timestamp': log['timestamp'],
                                'type': 'RESPONSE'
                            })
                            
                except Exception as e:
                    continue
            
            return network_requests
            
        except Exception as e:
            logger.error(f"捕获网络请求失败: {e}")
            return []
    
    def test_user_web_login(self):
        """测试用户端网页登录"""
        logger.info("\n=== 测试用户端网页登录 ===")
        
        if not self.driver:
            logger.error("❌ 浏览器未初始化")
            return False
        
        try:
            # 打开用户端登录页面
            self.driver.get(f"{self.config['user_web_url']}/login")
            logger.info(f"✅ 已打开用户端登录页面: {self.config['user_web_url']}/login")
            
            # 等待页面加载
            WebDriverWait(self.driver, self.config['timeout']).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 截取页面截图
            self.driver.save_screenshot("user_login_page.png")
            logger.info("📸 已保存用户端登录页面截图: user_login_page.png")
            
            # 查找用户名输入框
            username_input = WebDriverWait(self.driver, self.config['timeout']).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'], input[name='username'], input[placeholder*='用户名'], input[placeholder*='账号']"))
            )
            
            # 查找密码输入框
            password_input = WebDriverWait(self.driver, self.config['timeout']).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password'], input[name='password'], input[placeholder*='密码']"))
            )
            
            # 查找登录按钮
            login_button = WebDriverWait(self.driver, self.config['timeout']).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit'], button:contains('登录'), input[type='submit']"))
            )
            
            logger.info("✅ 找到登录表单元素")
            
            # 清空输入框并输入用户名
            username_input.clear()
            username_input.send_keys(self.config['test_user']['username'])
            logger.info(f"📝 输入用户名: {self.config['test_user']['username']}")
            
            # 输入密码
            password_input.clear()
            password_input.send_keys(self.config['test_user']['password'])
            logger.info("🔑 输入密码: ***")
            
            # 捕获登录前的网络请求
            before_login_network = self.capture_network_requests()
            
            # 点击登录按钮
            login_button.click()
            logger.info("🖱️ 点击登录按钮")
            
            # 等待登录结果
            time.sleep(3)
            
            # 捕获登录后的网络请求
            after_login_network = self.capture_network_requests()
            
            # 分析网络请求
            login_requests = [req for req in after_login_network if req not in before_login_network]
            
            logger.info("🌐 网络请求分析:")
            for req in login_requests:
                logger.info(f"   {req['type']}: {req['method'] if 'method' in req else ''} {req['url']} - Status: {req.get('status', 'N/A')}")
            
            # 检查是否登录成功
            # 方法1: 检查URL变化
            current_url = self.driver.current_url
            if 'login' not in current_url.lower() and 'dashboard' in current_url.lower():
                logger.info("✅ 登录成功 - URL跳转到仪表板")
                self.driver.save_screenshot("user_login_success.png")
                return True
            
            # 方法2: 检查页面元素
            try:
                # 查找登录成功后的元素
                success_elements = [
                    "h1:contains('欢迎')",
                    "h1:contains('仪表板')",
                    "h1:contains('Dashboard')",
                    ".dashboard",
                    ".welcome",
                    "[data-testid='dashboard']"
                ]
                
                for selector in success_elements:
                    try:
                        element = WebDriverWait(self.driver, 5).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                        )
                        if element:
                            logger.info(f"✅ 登录成功 - 找到成功元素: {selector}")
                            self.driver.save_screenshot("user_login_success.png")
                            return True
                    except:
                        continue
                        
            except Exception as e:
                logger.warning(f"检查成功元素时出错: {e}")
            
            # 方法3: 检查错误信息
            try:
                error_elements = [
                    ".error",
                    ".alert-error",
                    ".login-error",
                    "[role='alert']",
                    "text():contains('错误')",
                    "text():contains('失败')",
                    "text():contains('invalid')",
                    "text():contains('incorrect')"
                ]
                
                for selector in error_elements:
                    try:
                        element = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if element and element.is_displayed():
                            error_text = element.text
                            logger.error(f"❌ 登录失败 - 错误信息: {error_text}")
                            self.driver.save_screenshot("user_login_error.png")
                            return False
                    except:
                        continue
                        
            except Exception as e:
                logger.warning(f"检查错误信息时出错: {e}")
            
            # 如果无法确定登录状态，检查页面内容
            page_source = self.driver.page_source
            if '登录成功' in page_source or '欢迎' in page_source:
                logger.info("✅ 登录成功 - 页面包含成功关键词")
                return True
            elif '登录失败' in page_source or '错误' in page_source:
                logger.error("❌ 登录失败 - 页面包含失败关键词")
                return False
            else:
                logger.warning("⚠️ 无法确定登录状态")
                return False
                
        except TimeoutException as e:
            logger.error(f"❌ 用户端登录超时: {e}")
            self.driver.save_screenshot("user_login_timeout.png")
            return False
        except Exception as e:
            logger.error(f"❌ 用户端登录测试失败: {e}")
            self.driver.save_screenshot("user_login_exception.png")
            return False
    
    def test_admin_web_login(self):
        """测试管理端网页登录"""
        logger.info("\n=== 测试管理端网页登录 ===")
        
        if not self.driver:
            logger.error("❌ 浏览器未初始化")
            return False
        
        try:
            # 打开管理端登录页面
            self.driver.get(f"{self.config['admin_web_url']}/login")
            logger.info(f"✅ 已打开管理端登录页面: {self.config['admin_web_url']}/login")
            
            # 等待页面加载
            WebDriverWait(self.driver, self.config['timeout']).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 截取页面截图
            self.driver.save_screenshot("admin_login_page.png")
            logger.info("📸 已保存管理端登录页面截图: admin_login_page.png")
            
            # 查找用户名输入框
            username_input = WebDriverWait(self.driver, self.config['timeout']).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='text'], input[name='username'], input[placeholder*='用户名'], input[placeholder*='账号'], input[placeholder*='admin']"))
            )
            
            # 查找密码输入框
            password_input = WebDriverWait(self.driver, self.config['timeout']).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='password'], input[name='password'], input[placeholder*='密码']"))
            )
            
            # 查找登录按钮
            login_button = WebDriverWait(self.driver, self.config['timeout']).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit'], button:contains('登录'), input[type='submit']"))
            )
            
            logger.info("✅ 找到登录表单元素")
            
            # 清空输入框并输入用户名
            username_input.clear()
            username_input.send_keys(self.config['admin_user']['username'])
            logger.info(f"📝 输入管理员用户名: {self.config['admin_user']['username']}")
            
            # 输入密码
            password_input.clear()
            password_input.send_keys(self.config['admin_user']['password'])
            logger.info("🔑 输入管理员密码: ***")
            
            # 捕获登录前的网络请求
            before_login_network = self.capture_network_requests()
            
            # 点击登录按钮
            login_button.click()
            logger.info("🖱️ 点击登录按钮")
            
            # 等待登录结果
            time.sleep(3)
            
            # 捕获登录后的网络请求
            after_login_network = self.capture_network_requests()
            
            # 分析网络请求
            login_requests = [req for req in after_login_network if req not in before_login_network]
            
            logger.info("🌐 网络请求分析:")
            for req in login_requests:
                logger.info(f"   {req['type']}: {req['method'] if 'method' in req else ''} {req['url']} - Status: {req.get('status', 'N/A')}")
            
            # 检查是否登录成功
            current_url = self.driver.current_url
            if 'login' not in current_url.lower() and ('admin' in current_url.lower() or 'dashboard' in current_url.lower()):
                logger.info("✅ 管理员登录成功 - URL跳转")
                self.driver.save_screenshot("admin_login_success.png")
                return True
            
            # 检查页面内容
            page_source = self.driver.page_source
            if '管理员' in page_source or '后台' in page_source or 'Dashboard' in page_source:
                logger.info("✅ 管理员登录成功 - 页面包含管理员相关关键词")
                return True
            else:
                logger.warning("⚠️ 无法确定管理员登录状态")
                return False
                
        except TimeoutException as e:
            logger.error(f"❌ 管理端登录超时: {e}")
            self.driver.save_screenshot("admin_login_timeout.png")
            return False
        except Exception as e:
            logger.error(f"❌ 管理端登录测试失败: {e}")
            self.driver.save_screenshot("admin_login_exception.png")
            return False
    
    def test_api_direct_login(self):
        """直接测试API登录"""
        logger.info("\n=== 直接测试API登录 ===")
        
        # 测试用户端API登录
        user_login_data = {
            'username': self.config['test_user']['username'],
            'password': self.config['test_user']['password']
        }
        
        try:
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/login",
                json=user_login_data,
                headers={'Content-Type': 'application/json'},
                timeout=self.config['timeout']
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 200:
                    logger.info("✅ 用户端API登录成功")
                    logger.info(f"   Token: {result.get('token', 'N/A')}")
                else:
                    logger.error(f"❌ 用户端API登录失败: {result.get('message', '未知错误')}")
            else:
                logger.error(f"❌ 用户端API登录HTTP错误: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ 用户端API登录请求失败: {e}")
        
        # 测试管理端API登录
        admin_login_data = {
            'username': self.config['admin_user']['username'],
            'password': self.config['admin_user']['password']
        }
        
        try:
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/login",  # 管理端也使用user-api
                json=admin_login_data,
                headers={'Content-Type': 'application/json'},
                timeout=self.config['timeout']
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 200:
                    logger.info("✅ 管理端API登录成功")
                    logger.info(f"   Token: {result.get('token', 'N/A')}")
                else:
                    logger.error(f"❌ 管理端API登录失败: {result.get('message', '未知错误')}")
            else:
                logger.error(f"❌ 管理端API登录HTTP错误: {response.status_code}")
                
        except Exception as e:
            logger.error(f"❌ 管理端API登录请求失败: {e}")
    
    def run_all_tests(self):
        """运行所有测试"""
        logger.info("🚀 开始真实浏览器登录测试...")
        logger.info("=" * 60)
        
        try:
            # 设置浏览器
            if not self.setup_browser():
                logger.error("❌ 浏览器设置失败，无法继续测试")
                return False
            
            # 测试用户端网页登录
            user_web_success = self.test_user_web_login()
            
            # 测试管理端网页登录
            admin_web_success = self.test_admin_web_login()
            
            # 直接测试API登录
            self.test_api_direct_login()
            
            # 汇总测试结果
            logger.info("\n" + "=" * 60)
            logger.info("📊 测试结果汇总:")
            logger.info(f"   用户端网页登录: {'✅ 成功' if user_web_success else '❌ 失败'}")
            logger.info(f"   管理端网页登录: {'✅ 成功' if admin_web_success else '❌ 失败'}")
            
            if user_web_success and admin_web_success:
                logger.info("\n🎉 所有网页端登录测试通过！")
                return True
            else:
                logger.info("\n⚠️ 部分测试失败，需要进一步排查问题")
                return False
                
        except Exception as e:
            logger.error(f"\n❌ 测试执行过程中发生异常: {e}")
            return False
        finally:
            # 关闭浏览器
            if self.driver:
                logger.info("🔄 正在关闭浏览器...")
                self.driver.quit()
                logger.info("✅ 浏览器已关闭")

def main():
    """主函数"""
    print("真实浏览器登录测试程序")
    print("=" * 60)
    print("此程序将:")
    print("1. 启动有头Chrome浏览器")
    print("2. 模拟真实用户操作登录")
    print("3. 捕获网络请求信息")
    print("4. 分析登录结果")
    print("=" * 60)
    
    try:
        # 创建测试实例
        test = RealBrowserLoginTest()
        
        # 运行所有测试
        success = test.run_all_tests()
        
        if success:
            print("\n🎊 恭喜！真实浏览器登录测试完成！")
            print("📸 截图已保存到当前目录")
            print("🌐 网络请求信息已记录在日志中")
        else:
            print("\n💡 测试发现问题，请查看上面的错误信息进行修复。")
            print("📸 错误截图已保存，可用于问题分析")
            
    except Exception as e:
        print(f"\n❌ 测试程序启动失败: {e}")
        print("请检查以下可能的问题:")
        print("1. Chrome浏览器是否已安装")
        print("2. ChromeDriver是否可用")
        print("3. 网络连接是否正常")

if __name__ == "__main__":
    main()