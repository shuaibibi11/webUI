#!/usr/bin/env python3
"""
Chromium浏览器登录测试程序
使用系统已安装的Chromium浏览器进行真实登录测试
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
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging
import subprocess

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ChromiumBrowserLoginTest:
    def __init__(self):
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'user_api_url': 'http://localhost:11031',
            'admin_api_url': 'http://localhost:11025',
            'test_user': {'username': 'testuser', 'password': 'password123'},
            'admin_user': {'username': 'admin', 'password': 'admin123'},
            'timeout': 10,
            'chromium_path': '/usr/bin/chromium-browser'
        }
        self.driver = None
        
    def setup_chromium_browser(self):
        """设置Chromium浏览器配置"""
        logger.info("正在设置Chromium浏览器配置...")
        
        # 检查Chromium是否可用
        try:
            result = subprocess.run([self.config['chromium_path'], '--version'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"✅ Chromium版本: {result.stdout.strip()}")
            else:
                logger.error(f"❌ Chromium检查失败: {result.stderr}")
                return False
        except Exception as e:
            logger.error(f"❌ Chromium检查异常: {e}")
            return False
        
        chrome_options = Options()
        
        # 使用系统已安装的Chromium
        chrome_options.binary_location = self.config['chromium_path']
        
        # 有头模式，显示浏览器窗口
        # chrome_options.add_argument("--headless")  # 注释掉，使用有头模式
        
        # 其他配置
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--start-maximized")
        
        # 禁用一些可能影响测试的功能
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-popup-blocking")
        
        # 启用日志
        chrome_options.add_argument("--enable-logging")
        chrome_options.add_argument("--log-level=0")
        
        try:
            # 使用系统ChromeDriver
            service = Service()
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            logger.info("✅ Chromium浏览器启动成功")
            return True
            
        except Exception as e:
            logger.error(f"❌ Chromium浏览器启动失败: {e}")
            
            # 尝试使用chromedriver自动管理
            try:
                from webdriver_manager.chrome import ChromeDriverManager
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
                logger.info("✅ 使用webdriver-manager启动Chromium成功")
                return True
            except Exception as e2:
                logger.error(f"❌ 备用启动方式也失败: {e2}")
                return False
    
    def analyze_page_structure(self, page_type="用户端"):
        """分析页面结构"""
        if not self.driver:
            return
            
        logger.info(f"\n📊 {page_type}页面结构分析:")
        
        try:
            # 获取页面标题
            title = self.driver.title
            logger.info(f"   页面标题: {title}")
            
            # 获取当前URL
            current_url = self.driver.current_url
            logger.info(f"   当前URL: {current_url}")
            
            # 查找表单元素
            forms = self.driver.find_elements(By.TAG_NAME, "form")
            logger.info(f"   表单数量: {len(forms)}")
            
            for i, form in enumerate(forms):
                logger.info(f"   表单{i+1}: action={form.get_attribute('action')}, method={form.get_attribute('method')}")
            
            # 查找输入框
            inputs = self.driver.find_elements(By.TAG_NAME, "input")
            logger.info(f"   输入框数量: {len(inputs)}")
            
            for input_elem in inputs:
                input_type = input_elem.get_attribute('type')
                input_name = input_elem.get_attribute('name')
                input_placeholder = input_elem.get_attribute('placeholder')
                if input_type in ['text', 'password', 'email']:
                    logger.info(f"      {input_type}输入框: name={input_name}, placeholder={input_placeholder}")
            
            # 查找按钮
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            logger.info(f"   按钮数量: {len(buttons)}")
            
            for button in buttons:
                button_text = button.text.strip()
                if button_text:
                    logger.info(f"     按钮文本: '{button_text}'")
                    
        except Exception as e:
            logger.error(f"页面结构分析失败: {e}")
    
    def test_login_with_detailed_analysis(self, web_type="user"):
        """详细分析登录过程"""
        if web_type == "user":
            url = f"{self.config['user_web_url']}/login"
            username = self.config['test_user']['username']
            password = self.config['test_user']['password']
            page_name = "用户端"
        else:
            url = f"{self.config['admin_web_url']}/login"
            username = self.config['admin_user']['username']
            password = self.config['admin_user']['password']
            page_name = "管理端"
        
        logger.info(f"\n=== 测试{page_name}网页登录 ===")
        
        if not self.driver:
            logger.error("❌ 浏览器未初始化")
            return False
        
        try:
            # 打开登录页面
            logger.info(f"🌐 正在打开: {url}")
            self.driver.get(url)
            
            # 等待页面加载
            WebDriverWait(self.driver, self.config['timeout']).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 分析页面结构
            self.analyze_page_structure(page_name)
            
            # 保存页面截图
            screenshot_name = f"{web_type}_login_page.png"
            self.driver.save_screenshot(screenshot_name)
            logger.info(f"📸 页面截图已保存: {screenshot_name}")
            
            # 尝试多种方式查找登录表单元素
            login_success = False
            
            # 方法1: 查找表单
            try:
                forms = self.driver.find_elements(By.TAG_NAME, "form")
                for form in forms:
                    logger.info(f"🔍 尝试在表单中查找登录元素...")
                    
                    # 在表单内查找输入框
                    username_inputs = form.find_elements(By.CSS_SELECTOR, "input[type='text'], input[name*='user'], input[placeholder*='用户'], input[placeholder*='账号']")
                    password_inputs = form.find_elements(By.CSS_SELECTOR, "input[type='password'], input[name*='pass']")
                    submit_buttons = form.find_elements(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], button:contains('登录')")
                    
                    if username_inputs and password_inputs and submit_buttons:
                        logger.info("✅ 找到完整的登录表单")
                        
                        username_input = username_inputs[0]
                        password_input = password_inputs[0]
                        submit_button = submit_buttons[0]
                        
                        # 输入用户名和密码
                        username_input.clear()
                        username_input.send_keys(username)
                        logger.info(f"📝 输入用户名: {username}")
                        
                        password_input.clear()
                        password_input.send_keys(password)
                        logger.info("🔑 输入密码")
                        
                        # 点击提交
                        submit_button.click()
                        logger.info("🖱️ 点击登录按钮")
                        
                        # 等待登录结果
                        time.sleep(5)
                        
                        # 检查登录结果
                        current_url = self.driver.current_url
                        page_source = self.driver.page_source.lower()
                        
                        if 'login' not in current_url.lower() or 'dashboard' in current_url.lower() or '欢迎' in page_source:
                            logger.info("✅ 登录成功")
                            self.driver.save_screenshot(f"{web_type}_login_success.png")
                            login_success = True
                        else:
                            logger.warning("⚠️ 登录状态不确定")
                            
                        break
                        
            except Exception as e:
                logger.warning(f"表单方式登录失败: {e}")
            
            # 方法2: 直接查找页面元素
            if not login_success:
                try:
                    logger.info("🔍 尝试直接查找页面登录元素...")
                    
                    # 查找所有可能的输入框
                    all_inputs = self.driver.find_elements(By.TAG_NAME, "input")
                    username_field = None
                    password_field = None
                    
                    for input_elem in all_inputs:
                        input_type = input_elem.get_attribute('type')
                        input_name = input_elem.get_attribute('name')
                        input_placeholder = input_elem.get_attribute('placeholder')
                        
                        if input_type == 'text' and (input_name and 'user' in input_name.lower() or input_placeholder and ('用户' in input_placeholder or '账号' in input_placeholder)):
                            username_field = input_elem
                        elif input_type == 'password':
                            password_field = input_elem
                    
                    if username_field and password_field:
                        logger.info("✅ 找到登录输入框")
                        
                        # 输入用户名和密码
                        username_field.clear()
                        username_field.send_keys(username)
                        
                        password_field.clear()
                        password_field.send_keys(password)
                        
                        # 尝试回车登录
                        password_field.send_keys(Keys.ENTER)
                        logger.info("⌨️ 使用回车键尝试登录")
                        
                        time.sleep(5)
                        
                        # 检查登录结果
                        current_url = self.driver.current_url
                        if 'login' not in current_url.lower():
                            logger.info("✅ 登录成功（URL跳转）")
                            login_success = True
                            
                except Exception as e:
                    logger.warning(f"直接查找方式登录失败: {e}")
            
            # 保存最终状态截图
            self.driver.save_screenshot(f"{web_type}_login_final.png")
            
            return login_success
            
        except Exception as e:
            logger.error(f"❌ {page_name}登录测试失败: {e}")
            self.driver.save_screenshot(f"{web_type}_login_error.png")
            return False
    
    def test_api_health(self):
        """测试API健康状态"""
        logger.info("\n=== 测试API健康状态 ===")
        
        endpoints = [
            ("用户端API", self.config['user_api_url']),
            ("管理端API", self.config['admin_api_url']),
            ("用户端网页", self.config['user_web_url']),
            ("管理端网页", self.config['admin_web_url'])
        ]
        
        for name, url in endpoints:
            try:
                response = requests.get(url, timeout=5)
                logger.info(f"✅ {name} ({url}) - 状态码: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ {name} ({url}) - 不可达: {e}")
    
    def run_comprehensive_test(self):
        """运行全面测试"""
        logger.info("🚀 开始Chromium浏览器全面登录测试...")
        logger.info("=" * 60)
        
        # 测试API健康状态
        self.test_api_health()
        
        # 设置浏览器
        if not self.setup_chromium_browser():
            logger.error("❌ 浏览器设置失败，无法继续测试")
            return False
        
        try:
            # 测试用户端登录
            user_success = self.test_login_with_detailed_analysis("user")
            
            # 测试管理端登录
            admin_success = self.test_login_with_detailed_analysis("admin")
            
            # 汇总结果
            logger.info("\n" + "=" * 60)
            logger.info("📊 测试结果汇总:")
            logger.info(f"   用户端网页登录: {'✅ 成功' if user_success else '❌ 失败'}")
            logger.info(f"   管理端网页登录: {'✅ 成功' if admin_success else '❌ 失败'}")
            
            if user_success and admin_success:
                logger.info("\n🎉 所有网页端登录测试通过！")
                return True
            else:
                logger.info("\n⚠️ 部分测试失败，需要进一步排查问题")
                return False
                
        except Exception as e:
            logger.error(f"\n❌ 测试执行过程中发生异常: {e}")
            return False
        finally:
            if self.driver:
                logger.info("🔄 正在关闭浏览器...")
                self.driver.quit()
                logger.info("✅ 浏览器已关闭")

def main():
    """主函数"""
    print("Chromium浏览器登录测试程序")
    print("=" * 60)
    print("此程序将使用系统Chromium浏览器进行真实登录测试")
    print("=" * 60)
    
    try:
        test = ChromiumBrowserLoginTest()
        success = test.run_comprehensive_test()
        
        if success:
            print("\n🎊 恭喜！Chromium浏览器测试完成！")
            print("📸 截图已保存到当前目录")
        else:
            print("\n💡 测试发现问题，请查看日志进行修复")
            
    except Exception as e:
        print(f"\n❌ 测试程序启动失败: {e}")

if __name__ == "__main__":
    main()