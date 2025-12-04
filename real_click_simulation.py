#!/usr/bin/env python3
"""
真实点击模拟程序
模拟用户在Vue.js SPA中的真实点击和输入操作
"""

import requests
import json
import time
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RealClickSimulation:
    def __init__(self):
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'user_api_url': 'http://localhost:11031',
            'admin_api_url': 'http://localhost:11025',
            'test_user': {'username': 'testuser', 'password': 'Test123456!'},
            'admin_user': {'username': 'admin', 'password': 'Abcdef1!'},
            'timeout': 15,
            'headless': False  # 设置为False以显示浏览器窗口
        }
        self.driver = None
        self.network_requests = []
        
    def setup_selenium_with_network_monitoring(self):
        """设置带有网络监控的Selenium"""
        logger.info("\n=== 设置带有网络监控的Selenium ===")
        
        try:
            # 配置Chrome选项
            chrome_options = Options()
            
            # 设置为非无头模式以显示浏览器
            if not self.config['headless']:
                chrome_options.add_argument('--headless=new')  # 使用新的headless模式
            
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            # 启用性能日志以捕获网络请求
            chrome_options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})
            
            # 尝试使用系统Chrome
            self.driver = webdriver.Chrome(options=chrome_options)
            
            logger.info("✅ Selenium WebDriver初始化成功（带网络监控）")
            return True
            
        except Exception as e:
            logger.error(f"❌ Selenium初始化失败: {e}")
            return False
    
    def capture_network_requests(self):
        """捕获网络请求"""
        try:
            logs = self.driver.get_log('performance')
            
            for log in logs:
                message = json.loads(log['message'])
                
                if message['message'].get('method') == 'Network.requestWillBeSent':
                    request = message['message']['params']['request']
                    
                    network_request = {
                        'url': request.get('url', ''),
                        'method': request.get('method', ''),
                        'headers': request.get('headers', {}),
                        'timestamp': time.time(),
                        'type': 'request'
                    }
                    
                    self.network_requests.append(network_request)
                    
                elif message['message'].get('method') == 'Network.responseReceived':
                    response = message['message']['params']['response']
                    
                    network_response = {
                        'url': response.get('url', ''),
                        'status': response.get('status', ''),
                        'headers': response.get('headers', {}),
                        'timestamp': time.time(),
                        'type': 'response'
                    }
                    
                    self.network_requests.append(network_response)
                    
        except Exception as e:
            logger.debug(f"网络请求捕获错误: {e}")
    
    def simulate_real_user_actions(self, app_type, username, password):
        """模拟真实用户操作"""
        logger.info(f"\n=== 模拟真实用户操作 - {app_type} ===")
        
        try:
            # 确定URL
            if app_type == "用户端":
                base_url = self.config['user_web_url']
            else:
                base_url = self.config['admin_web_url']
            
            login_url = f"{base_url}/login"
            logger.info(f"🌐 正在打开登录页面: {login_url}")
            
            # 清除之前的网络请求
            self.network_requests = []
            
            # 打开登录页面
            self.driver.get(login_url)
            
            # 等待页面加载
            wait = WebDriverWait(self.driver, self.config['timeout'])
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # 等待Vue应用加载
            time.sleep(3)
            
            # 捕获网络请求
            self.capture_network_requests()
            
            # 分析页面结构
            page_analysis = self._analyze_page_structure()
            logger.info(f"📊 页面结构分析: {json.dumps(page_analysis, ensure_ascii=False, indent=2)}")
            
            # 模拟真实用户行为：延迟、随机点击等
            logger.info("👤 开始模拟真实用户行为...")
            
            # 1. 模拟鼠标移动和点击
            self._simulate_mouse_behavior()
            
            # 2. 查找并填写表单
            form_filled = self._find_and_fill_login_form(username, password)
            
            if form_filled:
                logger.info("✅ 表单填写成功")
                
                # 3. 模拟点击登录按钮
                login_clicked = self._simulate_login_click()
                
                if login_clicked:
                    logger.info("✅ 登录按钮点击成功")
                    
                    # 4. 捕获登录过程中的网络请求
                    time.sleep(5)
                    self.capture_network_requests()
                    
                    # 5. 检查登录结果
                    login_success = self._check_login_result()
                    
                    if login_success:
                        logger.info("🎉 登录成功！")
                        
                        # 6. 模拟登录后的用户操作
                        self._simulate_post_login_actions()
                        
                        return True
                    else:
                        logger.warning("⚠️ 登录失败")
                        
                        # 保存截图用于调试
                        screenshot_name = f"{app_type.lower()}_login_failed.png"
                        self.driver.save_screenshot(screenshot_name)
                        logger.info(f"📸 登录失败截图已保存: {screenshot_name}")
                        
                        return False
                else:
                    logger.error("❌ 登录按钮点击失败")
                    return False
            else:
                logger.error("❌ 表单填写失败")
                return False
                
        except Exception as e:
            logger.error(f"❌ 用户操作模拟失败: {e}")
            return False
    
    def _analyze_page_structure(self):
        """分析页面结构"""
        analysis = {
            'title': '',
            'form_elements': [],
            'buttons': [],
            'vue_elements': [],
            'javascript_frameworks': [],
            'page_size': 0
        }
        
        try:
            # 获取页面标题
            analysis['title'] = self.driver.title
            
            # 获取页面源代码大小
            analysis['page_size'] = len(self.driver.page_source)
            
            # 查找表单元素
            form_elements = self.driver.find_elements(By.TAG_NAME, "form")
            analysis['form_elements'] = [{
                'id': element.get_attribute('id') or '无id',
                'action': element.get_attribute('action') or '无action',
                'method': element.get_attribute('method') or '无method'
            } for element in form_elements]
            
            # 查找按钮
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            analysis['buttons'] = [{
                'text': element.text,
                'type': element.get_attribute('type') or 'button',
                'class': element.get_attribute('class') or '无class'
            } for element in buttons]
            
            # 查找Vue.js元素
            vue_selectors = ["[v-model]", "[v-bind]", "[v-on]", "[v-if]", "[v-for]", "[v-show]"]
            for selector in vue_selectors:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    analysis['vue_elements'].append({
                        'selector': selector,
                        'count': len(elements)
                    })
            
            # 检测JavaScript框架
            page_source = self.driver.page_source
            if 'vue' in page_source.lower():
                analysis['javascript_frameworks'].append('Vue.js')
            if 'react' in page_source.lower():
                analysis['javascript_frameworks'].append('React')
            if 'angular' in page_source.lower():
                analysis['javascript_frameworks'].append('Angular')
            if 'vite' in page_source.lower():
                analysis['javascript_frameworks'].append('Vite')
                
        except Exception as e:
            logger.error(f"页面结构分析失败: {e}")
        
        return analysis
    
    def _simulate_mouse_behavior(self):
        """模拟鼠标行为"""
        try:
            actions = ActionChains(self.driver)
            
            # 模拟鼠标移动
            actions.move_by_offset(100, 100).perform()
            time.sleep(0.5)
            
            actions.move_by_offset(-50, 50).perform()
            time.sleep(0.5)
            
            logger.info("🖱️ 鼠标行为模拟完成")
            
        except Exception as e:
            logger.debug(f"鼠标行为模拟失败: {e}")
    
    def _find_and_fill_login_form(self, username, password):
        """查找并填写登录表单"""
        logger.info("📝 正在查找并填写登录表单...")
        
        try:
            # 尝试多种方式查找用户名输入框
            username_input = None
            username_selectors = [
                "input[type='text']",
                "input[type='email']",
                "input[placeholder*='用户名']",
                "input[placeholder*='user']",
                "input[placeholder*='账号']",
                "input[name*='username']",
                "input[name*='user']",
                "input[id*='username']",
                "input[id*='user']"
            ]
            
            for selector in username_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        username_input = elements[0]
                        logger.info(f"✅ 找到用户名输入框: {selector}")
                        break
                except:
                    continue
            
            if not username_input:
                logger.warning("⚠️ 未找到用户名输入框，尝试更广泛的搜索")
                
                # 尝试所有输入框
                all_inputs = self.driver.find_elements(By.TAG_NAME, "input")
                for input_element in all_inputs:
                    input_type = input_element.get_attribute('type')
                    if input_type in ['text', 'email']:
                        username_input = input_element
                        logger.info("✅ 通过广泛搜索找到用户名输入框")
                        break
            
            if not username_input:
                logger.error("❌ 无法找到用户名输入框")
                return False
            
            # 查找密码输入框
            password_input = None
            password_selectors = [
                "input[type='password']",
                "input[placeholder*='密码']",
                "input[placeholder*='password']",
                "input[name*='password']",
                "input[id*='password']"
            ]
            
            for selector in password_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        password_input = elements[0]
                        logger.info(f"✅ 找到密码输入框: {selector}")
                        break
                except:
                    continue
            
            if not password_input:
                logger.error("❌ 无法找到密码输入框")
                return False
            
            # 模拟真实用户输入：清除、延迟输入
            username_input.clear()
            time.sleep(0.5)
            
            # 逐个字符输入用户名（模拟真实打字）
            for char in username:
                username_input.send_keys(char)
                time.sleep(0.1)  # 模拟打字延迟
            
            logger.info("✅ 用户名输入完成")
            
            # 输入密码
            password_input.clear()
            time.sleep(0.5)
            
            for char in password:
                password_input.send_keys(char)
                time.sleep(0.1)
            
            logger.info("✅ 密码输入完成")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ 表单填写失败: {e}")
            return False
    
    def _simulate_login_click(self):
        """模拟点击登录按钮"""
        logger.info("🖱️ 正在查找并点击登录按钮...")
        
        try:
            # 尝试多种方式查找登录按钮
            login_button = None
            button_selectors = [
                "button[type='submit']",
                "button:contains('登录')",
                "button:contains('Login')",
                "input[type='submit']",
                ".login-button",
                "[onclick*='login']",
                "button"
            ]
            
            for selector in button_selectors:
                try:
                    if ':contains' in selector:
                        # 处理文本包含选择器
                        button_text = selector.split("('")[1].split("')")[0]
                        buttons = self.driver.find_elements(By.TAG_NAME, "button")
                        for button in buttons:
                            if button_text in button.text:
                                login_button = button
                                logger.info(f"✅ 找到登录按钮（文本包含）: {button_text}")
                                break
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            login_button = elements[0]
                            logger.info(f"✅ 找到登录按钮: {selector}")
                            break
                except:
                    continue
            
            if not login_button:
                logger.error("❌ 无法找到登录按钮")
                return False
            
            # 模拟真实点击：鼠标悬停、延迟点击
            actions = ActionChains(self.driver)
            actions.move_to_element(login_button).pause(1).click().perform()
            
            logger.info("✅ 登录按钮点击成功")
            return True
            
        except Exception as e:
            logger.error(f"❌ 登录按钮点击失败: {e}")
            return False
    
    def _check_login_result(self):
        """检查登录结果"""
        logger.info("🔍 正在检查登录结果...")
        
        try:
            # 检查URL是否变化
            current_url = self.driver.current_url
            logger.info(f"当前URL: {current_url}")
            
            # 检查是否跳转到成功页面
            success_indicators = ['/chat', '/dashboard', '/admin', '/home', '/main']
            for indicator in success_indicators:
                if indicator in current_url:
                    logger.info(f"✅ 检测到成功跳转: {indicator}")
                    return True
            
            # 检查页面标题变化
            page_title = self.driver.title
            logger.info(f"页面标题: {page_title}")
            
            # 检查是否有错误信息
            error_selectors = [
                ".error",
                ".error-message",
                ".alert-danger",
                "[role='alert']"
            ]
            
            for selector in error_selectors:
                try:
                    error_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in error_elements:
                        error_text = element.text
                        if error_text:
                            logger.error(f"❌ 发现错误信息: {error_text}")
                            return False
                except:
                    continue
            
            # 如果URL没有变化但也没有错误，可能是SPA内部状态变化
            logger.info("💡 可能是SPA内部状态变化，检查网络请求...")
            
            # 分析网络请求
            api_calls = [req for req in self.network_requests if '/api/' in req.get('url', '')]
            if api_calls:
                logger.info(f"📡 检测到API调用: {len(api_calls)} 次")
                
                # 检查是否有成功的登录API调用
                for call in api_calls:
                    if 'login' in call.get('url', '').lower():
                        logger.info(f"🔍 登录API调用: {call}")
            
            return False
            
        except Exception as e:
            logger.error(f"❌ 登录结果检查失败: {e}")
            return False
    
    def _simulate_post_login_actions(self):
        """模拟登录后的用户操作"""
        logger.info("🔧 模拟登录后的用户操作...")
        
        try:
            # 等待页面稳定
            time.sleep(2)
            
            # 模拟用户浏览页面
            actions = ActionChains(self.driver)
            
            # 滚动页面
            self.driver.execute_script("window.scrollTo(0, 200);")
            time.sleep(1)
            
            self.driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(1)
            
            # 捕获最终的网络请求
            self.capture_network_requests()
            
            logger.info("✅ 登录后操作模拟完成")
            
        except Exception as e:
            logger.debug(f"登录后操作模拟失败: {e}")
    
    def analyze_network_requests(self):
        """分析网络请求"""
        logger.info("\n=== 网络请求分析 ===")
        
        if not self.network_requests:
            logger.info("📡 未捕获到网络请求")
            return
        
        # 按类型分类请求
        requests = [req for req in self.network_requests if req['type'] == 'request']
        responses = [resp for resp in self.network_requests if resp['type'] == 'response']
        
        logger.info(f"📊 网络请求统计:")
        logger.info(f"   总请求数: {len(requests)}")
        logger.info(f"   总响应数: {len(responses)}")
        
        # 分析API调用
        api_calls = [req for req in requests if '/api/' in req.get('url', '')]
        logger.info(f"   API调用数: {len(api_calls)}")
        
        for api_call in api_calls:
            logger.info(f"   🔗 API调用: {api_call.get('method', '')} {api_call.get('url', '')}")
        
        # 分析登录相关的API调用
        login_calls = [call for call in api_calls if 'login' in call.get('url', '').lower()]
        if login_calls:
            logger.info("\n🔐 登录相关API调用:")
            for call in login_calls:
                logger.info(f"   📡 {call}")
    
    def run_comprehensive_simulation(self):
        """运行全面的模拟测试"""
        logger.info("🚀 开始真实用户操作模拟...")
        logger.info("=" * 60)
        
        # 1. 设置Selenium
        selenium_ready = self.setup_selenium_with_network_monitoring()
        
        if not selenium_ready:
            logger.error("❌ Selenium初始化失败，无法继续")
            return False
        
        # 2. 模拟用户端操作
        user_success = self.simulate_real_user_actions(
            "用户端",
            self.config['test_user']['username'],
            self.config['test_user']['password']
        )
        
        # 3. 模拟管理端操作
        admin_success = self.simulate_real_user_actions(
            "管理端",
            self.config['admin_user']['username'],
            self.config['admin_user']['password']
        )
        
        # 4. 分析网络请求
        self.analyze_network_requests()
        
        # 5. 保存详细日志
        self._save_detailed_logs()
        
        # 清理资源
        if self.driver:
            self.driver.quit()
        
        # 汇总结果
        logger.info("\n" + "=" * 60)
        logger.info("📊 真实用户操作模拟结果汇总:")
        logger.info(f"   用户端模拟: {'✅ 成功' if user_success else '❌ 失败'}")
        logger.info(f"   管理端模拟: {'✅ 成功' if admin_success else '❌ 失败'}")
        logger.info(f"   网络请求捕获: {len(self.network_requests)} 条")
        
        if user_success or admin_success:
            logger.info("\n🎉 部分或全部模拟成功！")
            logger.info("💡 详细操作日志和网络请求已保存")
        else:
            logger.info("\n💡 模拟失败，请查看详细日志进行问题诊断")
        
        return user_success or admin_success
    
    def _save_detailed_logs(self):
        """保存详细日志"""
        try:
            log_data = {
                'timestamp': time.time(),
                'config': self.config,
                'network_requests': self.network_requests,
                'summary': {
                    'total_requests': len([r for r in self.network_requests if r['type'] == 'request']),
                    'api_calls': len([r for r in self.network_requests if '/api/' in r.get('url', '')]),
                    'login_calls': len([r for r in self.network_requests if 'login' in r.get('url', '').lower()])
                }
            }
            
            with open('real_click_simulation_log.json', 'w', encoding='utf-8') as f:
                json.dump(log_data, f, ensure_ascii=False, indent=2)
            
            logger.info("📄 详细日志已保存: real_click_simulation_log.json")
            
        except Exception as e:
            logger.error(f"❌ 日志保存失败: {e}")

def main():
    """主函数"""
    print("真实用户操作模拟程序")
    print("=" * 60)
    print("此程序模拟真实用户在Vue.js SPA中的点击和输入操作")
    print("=" * 60)
    
    try:
        simulation = RealClickSimulation()
        success = simulation.run_comprehensive_simulation()
        
        if success:
            print("\n🎊 真实用户操作模拟完成！")
            print("📋 详细操作日志和网络请求已记录")
        else:
            print("\n💡 发现问题，请查看日志进行修复")
            
    except Exception as e:
        print(f"\n❌ 模拟程序启动失败: {e}")

if __name__ == "__main__":
    main()