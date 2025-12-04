#!/usr/bin/env python3
"""
Vue.js SPA登录测试程序
专门针对Vite + Vue.js单页面应用的登录功能进行测试
"""

import requests
import json
import time
import re
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class VueSPALoginTest:
    def __init__(self):
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'user_api_url': 'http://localhost:11031',
            'admin_api_url': 'http://localhost:11025',
            'test_user': {'username': 'testuser', 'password': 'Test123456!'},
            'admin_user': {'username': 'admin', 'password': 'Abcdef1!'},
            'timeout': 15
        }
        self.driver = None
        
    def setup_selenium(self):
        """设置Selenium WebDriver"""
        logger.info("\n=== 设置Selenium WebDriver ===")
        
        try:
            # 配置Chrome选项
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # 无头模式
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            # 尝试使用系统Chrome
            self.driver = webdriver.Chrome(options=chrome_options)
            
            logger.info("✅ Selenium WebDriver初始化成功")
            return True
            
        except Exception as e:
            logger.error(f"❌ Selenium初始化失败: {e}")
            logger.info("💡 尝试使用requests模拟Vue.js SPA行为")
            return False
    
    def test_vue_spa_directly(self):
        """直接测试Vue.js SPA"""
        logger.info("\n=== 直接测试Vue.js SPA ===")
        
        # 测试用户端Vue SPA
        user_success = self._test_single_vue_spa(
            self.config['user_web_url'],
            self.config['test_user']['username'],
            self.config['test_user']['password'],
            "用户端"
        )
        
        # 测试管理端Vue SPA
        admin_success = self._test_single_vue_spa(
            self.config['admin_web_url'],
            self.config['admin_user']['username'],
            self.config['admin_user']['password'],
            "管理端"
        )
        
        return user_success or admin_success
    
    def _test_single_vue_spa(self, base_url, username, password, app_type):
        """测试单个Vue SPA"""
        logger.info(f"\n--- 测试{app_type}Vue SPA ---")
        
        if self.driver:
            return self._test_with_selenium(base_url, username, password, app_type)
        else:
            return self._test_with_requests(base_url, username, password, app_type)
    
    def _test_with_selenium(self, base_url, username, password, app_type):
        """使用Selenium测试Vue SPA"""
        try:
            login_url = f"{base_url}/login"
            logger.info(f"🌐 正在打开: {login_url}")
            
            self.driver.get(login_url)
            
            # 等待Vue应用加载完成
            wait = WebDriverWait(self.driver, self.config['timeout'])
            
            # 等待Vue应用挂载到#app元素
            wait.until(EC.presence_of_element_located((By.ID, "app")))
            logger.info("✅ Vue应用已挂载")
            
            # 等待页面内容加载
            time.sleep(3)
            
            # 查找Vue.js特定的元素
            vue_elements = self._find_vue_elements()
            
            if vue_elements:
                logger.info("✅ 发现Vue.js元素")
                
                # 尝试登录
                login_success = self._attempt_vue_login(username, password)
                
                if login_success:
                    logger.info("✅ Vue SPA登录成功")
                    return True
                else:
                    logger.warning("⚠️ Vue SPA登录失败")
                    
                    # 保存截图用于调试
                    screenshot_name = f"{app_type.lower()}_vue_spa.png"
                    self.driver.save_screenshot(screenshot_name)
                    logger.info(f"📸 页面截图已保存: {screenshot_name}")
                    
                    # 检查控制台错误
                    self._check_console_errors()
                    
                    return False
            else:
                logger.warning("⚠️ 未发现明显的Vue.js元素")
                return False
                
        except Exception as e:
            logger.error(f"❌ {app_type}Vue SPA测试失败: {e}")
            return False
    
    def _find_vue_elements(self):
        """查找Vue.js特定元素"""
        vue_elements = []
        
        # 查找Vue.js特定的属性
        vue_selectors = [
            "[v-model]",
            "[v-bind]",
            "[v-on]",
            "[v-if]",
            "[v-for]",
            "[v-show]",
            ".vue-component",
            "[data-v-app]",
            "[__vue__]",
            "[data-v-]"
        ]
        
        for selector in vue_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    vue_elements.extend(elements)
            except:
                pass
        
        return vue_elements
    
    def _attempt_vue_login(self, username, password):
        """尝试Vue SPA登录"""
        try:
            # 查找用户名输入框
            username_selectors = [
                "input[type='text']",
                "input[type='email']",
                "input[placeholder*='用户名']",
                "input[placeholder*='user']",
                "input[placeholder*='账号']",
                "[v-model*='username']",
                "[v-model*='user']"
            ]
            
            username_input = None
            for selector in username_selectors:
                try:
                    username_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if username_input:
                        break
                except:
                    continue
            
            if not username_input:
                logger.warning("⚠️ 未找到用户名输入框")
                return False
            
            # 查找密码输入框
            password_selectors = [
                "input[type='password']",
                "input[placeholder*='密码']",
                "input[placeholder*='password']",
                "[v-model*='password']"
            ]
            
            password_input = None
            for selector in password_selectors:
                try:
                    password_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if password_input:
                        break
                except:
                    continue
            
            if not password_input:
                logger.warning("⚠️ 未找到密码输入框")
                return False
            
            # 查找登录按钮
            button_selectors = [
                "button[type='submit']",
                "button:contains('登录')",
                "button:contains('Login')",
                "input[type='submit']",
                ".login-button",
                "[v-on:click*='login']"
            ]
            
            login_button = None
            for selector in button_selectors:
                try:
                    login_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if login_button:
                        break
                except:
                    continue
            
            if not login_button:
                logger.warning("⚠️ 未找到登录按钮")
                return False
            
            # 输入用户名和密码
            username_input.clear()
            username_input.send_keys(username)
            logger.info("✅ 已输入用户名")
            
            password_input.clear()
            password_input.send_keys(password)
            logger.info("✅ 已输入密码")
            
            # 点击登录按钮
            login_button.click()
            logger.info("✅ 已点击登录按钮")
            
            # 等待登录结果
            time.sleep(3)
            
            # 检查是否登录成功
            current_url = self.driver.current_url
            if '/chat' in current_url or '/dashboard' in current_url or '/admin' in current_url:
                logger.info("✅ 登录成功，页面已跳转")
                return True
            else:
                # 检查错误信息
                error_selectors = [
                    ".error-message",
                    ".n-message--error",
                    "[v-if*='error']",
                    "[v-show*='error']"
                ]
                
                for selector in error_selectors:
                    try:
                        error_element = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if error_element:
                            error_text = error_element.text
                            logger.error(f"❌ 登录失败，错误信息: {error_text}")
                            return False
                    except:
                        continue
                
                logger.warning("⚠️ 登录失败，但未发现错误信息")
                return False
                
        except Exception as e:
            logger.error(f"❌ Vue SPA登录尝试失败: {e}")
            return False
    
    def _check_console_errors(self):
        """检查控制台错误"""
        try:
            logs = self.driver.get_log('browser')
            for log in logs:
                if log['level'] == 'SEVERE':
                    logger.error(f"❌ 浏览器控制台错误: {log['message']}")
        except:
            pass
    
    def _test_with_requests(self, base_url, username, password, app_type):
        """使用requests模拟Vue SPA行为"""
        logger.info(f"💡 使用requests模拟{app_type}Vue SPA行为")
        
        # 1. 获取页面HTML
        try:
            response = requests.get(f"{base_url}/login", timeout=self.config['timeout'])
            
            if response.status_code != 200:
                logger.error(f"❌ {app_type}页面访问失败")
                return False
            
            # 检查是否是Vue SPA
            html_content = response.text
            
            # 检查Vue.js特征
            vue_features = [
                '/@vite/client' in html_content,  # Vite特征
                '/src/main.ts' in html_content,   # Vue main文件
                '<div id="app">' in html_content,  # Vue挂载点
                'vite.svg' in html_content        # Vite图标
            ]
            
            if any(vue_features):
                logger.info("✅ 确认是Vite + Vue.js SPA")
                
                # 分析Vue SPA的API调用模式
                api_success = self._analyze_vue_api_calls(base_url, username, password, app_type)
                
                if api_success:
                    logger.info("✅ Vue SPA API分析成功")
                    return True
                else:
                    logger.warning("⚠️ Vue SPA API分析失败")
                    return False
            else:
                logger.warning("⚠️ 未确认是Vue SPA")
                return False
                
        except Exception as e:
            logger.error(f"❌ {app_type}Vue SPA requests测试失败: {e}")
            return False
    
    def _analyze_vue_api_calls(self, base_url, username, password, app_type):
        """分析Vue SPA的API调用模式"""
        logger.info(f"🔍 分析{app_type}Vue SPA API调用模式")
        
        # 模拟Vue SPA的登录API调用
        login_data = {
            'username': username,
            'password': password
        }
        
        # 尝试不同的API端点（Vue SPA常用的）
        api_endpoints = [
            '/api/users/login',
            '/api/auth/login',
            '/auth/login',
            '/user/login'
        ]
        
        session = requests.Session()
        
        # 设置模拟浏览器头
        headers = {
            'Content-Type': 'application/json',
            'Origin': base_url,
            'Referer': f"{base_url}/login",
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        }
        
        for endpoint in api_endpoints:
            try:
                # 用户端和管理端都使用user-api
                api_url = f"{self.config['user_api_url']}{endpoint}"
                
                response = session.post(
                    api_url,
                    json=login_data,
                    headers=headers,
                    timeout=self.config['timeout']
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if result.get('code') == 200:
                        logger.info(f"✅ {app_type}Vue SPA API调用成功: {endpoint}")
                        logger.info(f"   返回消息: {result.get('message')}")
                        logger.info(f"   Token: {result.get('token', 'N/A')}")
                        
                        # 检查用户信息
                        if 'user' in result:
                            user_info = result['user']
                            logger.info(f"   用户信息: {json.dumps(user_info, ensure_ascii=False, indent=4)}")
                        
                        return True
                    else:
                        logger.info(f"⚠️ {app_type}API端点存在但登录失败: {endpoint}")
                
            except Exception as e:
                logger.debug(f"❌ {app_type}API端点测试失败: {endpoint}, 错误: {e}")
                continue
        
        return False
    
    def test_vue_router_navigation(self):
        """测试Vue路由导航"""
        logger.info("\n=== 测试Vue路由导航 ===")
        
        if not self.driver:
            logger.info("💡 跳过路由导航测试（需要Selenium）")
            return True
        
        try:
            # 测试用户端路由
            user_routes = ['/', '/login', '/register', '/chat']
            user_success = self._test_routes(self.config['user_web_url'], user_routes, "用户端")
            
            # 测试管理端路由
            admin_routes = ['/', '/login', '/dashboard', '/admin']
            admin_success = self._test_routes(self.config['admin_web_url'], admin_routes, "管理端")
            
            return user_success or admin_success
            
        except Exception as e:
            logger.error(f"❌ Vue路由导航测试失败: {e}")
            return False
    
    def _test_routes(self, base_url, routes, app_type):
        """测试路由"""
        logger.info(f"\n--- 测试{app_type}路由 ---")
        
        success_count = 0
        
        for route in routes:
            try:
                url = f"{base_url}{route}"
                self.driver.get(url)
                
                # 等待页面加载
                WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                
                current_url = self.driver.current_url
                
                if route in current_url or '#' in current_url:  # 支持hash路由
                    logger.info(f"✅ 路由 {route} 导航成功")
                    success_count += 1
                else:
                    logger.warning(f"⚠️ 路由 {route} 导航异常，当前URL: {current_url}")
                    
            except Exception as e:
                logger.error(f"❌ 路由 {route} 测试失败: {e}")
        
        logger.info(f"   {app_type}路由测试结果: {success_count}/{len(routes)} 成功")
        return success_count > 0
    
    def run_comprehensive_vue_test(self):
        """运行全面的Vue SPA测试"""
        logger.info("🚀 开始Vue.js SPA登录分析...")
        logger.info("=" * 60)
        
        # 1. 设置Selenium
        selenium_ready = self.setup_selenium()
        
        # 2. 测试Vue SPA登录
        spa_success = self.test_vue_spa_directly()
        
        # 3. 测试Vue路由导航
        router_success = self.test_vue_router_navigation()
        
        # 4. 直接API测试（确保后端正常）
        api_success = self._analyze_vue_api_calls(
            self.config['user_web_url'],
            self.config['test_user']['username'],
            self.config['test_user']['password'],
            "用户端"
        )
        
        # 清理资源
        if self.driver:
            self.driver.quit()
        
        # 汇总结果
        logger.info("\n" + "=" * 60)
        logger.info("📊 Vue.js SPA分析结果汇总:")
        logger.info(f"   Selenium可用: {'✅ 是' if selenium_ready else '❌ 否'}")
        logger.info(f"   Vue SPA登录: {'✅ 成功' if spa_success else '❌ 失败'}")
        logger.info(f"   路由导航: {'✅ 成功' if router_success else '❌ 失败'}")
        logger.info(f"   API直接测试: {'✅ 成功' if api_success else '❌ 失败'}")
        
        if api_success:
            logger.info("\n🎉 后端API功能正常")
            logger.info("💡 Vue.js SPA问题诊断:")
            
            if not spa_success:
                logger.info("   1. 前端Vue应用可能未正确加载")
                logger.info("   2. 前端路由配置可能有问题")
                logger.info("   3. 前端JavaScript可能存在错误")
            
            logger.info("🔧 建议解决方案:")
            logger.info("   1. 检查前端控制台错误")
            logger.info("   2. 验证Vue路由配置")
            logger.info("   3. 检查前端API调用代码")
            logger.info("   4. 验证Vue组件是否正确渲染")
        else:
            logger.info("\n⚠️ 后端API存在问题")
            logger.info("🔧 需要进一步排查后端服务")
        
        return api_success

def main():
    """主函数"""
    print("Vue.js SPA登录分析程序")
    print("=" * 60)
    print("此程序专门分析Vite + Vue.js单页面应用的登录功能")
    print("=" * 60)
    
    try:
        test = VueSPALoginTest()
        success = test.run_comprehensive_vue_test()
        
        if success:
            print("\n🎊 Vue.js SPA分析完成！")
            print("📋 详细分析结果已记录在日志中")
        else:
            print("\n💡 发现问题，请查看日志进行修复")
            
    except Exception as e:
        print(f"\n❌ 分析程序启动失败: {e}")

if __name__ == "__main__":
    main()