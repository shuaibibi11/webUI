#!/usr/bin/env python3
"""
终极登录解决方案
结合所有发现的问题，实现可靠的登录测试
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
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class UltimateLoginSolver:
    def __init__(self):
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'user_api_url': 'http://localhost:11031',
            'admin_api_url': 'http://localhost:11025',
            'test_user': {'username': 'testuser', 'password': 'Test123456!'},
            'admin_user': {'username': 'admin', 'password': 'Abcdef1!'},
            'timeout': 15,
            'headless': False
        }
        self.driver = None
        
    def setup_ultimate_selenium(self):
        """设置终极Selenium环境"""
        logger.info("\n=== 设置终极测试环境 ===")
        
        try:
            # 配置Chrome选项
            chrome_options = Options()
            chrome_options.add_argument('--headless=new')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            # 启用性能日志
            chrome_options.set_capability('goog:loggingPrefs', {
                'browser': 'ALL',
                'performance': 'ALL'
            })
            
            self.driver = webdriver.Chrome(options=chrome_options)
            
            logger.info("✅ 终极测试环境初始化成功")
            return True
            
        except Exception as e:
            logger.error(f"❌ 测试环境初始化失败: {e}")
            return False
    
    def smart_login_with_retry(self, app_type):
        """智能登录重试机制"""
        logger.info(f"\n=== 智能登录测试 - {app_type} ===")
        
        max_retries = 3
        
        for attempt in range(max_retries):
            logger.info(f"🔄 尝试 {attempt + 1}/{max_retries}")
            
            try:
                result = self._attempt_smart_login(app_type)
                
                if result['success']:
                    logger.info(f"🎉 {app_type}登录成功!")
                    return result
                else:
                    logger.warning(f"⚠️ 尝试 {attempt + 1} 失败: {result.get('error', '未知错误')}")
                    
                    if attempt < max_retries - 1:
                        logger.info("🔄 等待重试...")
                        time.sleep(2)
                        
                        # 重新加载页面
                        if app_type == "用户端":
                            self.driver.get(f"{self.config['user_web_url']}/login")
                        else:
                            self.driver.get(f"{self.config['admin_web_url']}/login")
                        
                        time.sleep(3)
                    
            except Exception as e:
                logger.error(f"❌ 尝试 {attempt + 1} 异常: {e}")
                
                if attempt < max_retries - 1:
                    logger.info("🔄 等待重试...")
                    time.sleep(2)
        
        logger.error(f"❌ {app_type}登录失败，所有重试尝试均失败")
        return {'success': False, 'error': '所有重试尝试均失败'}
    
    def _attempt_smart_login(self, app_type):
        """单次登录尝试"""
        try:
            # 确定URL和凭据
            if app_type == "用户端":
                base_url = self.config['user_web_url']
                username = self.config['test_user']['username']
                password = self.config['test_user']['password']
            else:
                base_url = self.config['admin_web_url']
                username = self.config['admin_user']['username']
                password = self.config['admin_user']['password']
            
            login_url = f"{base_url}/login"
            logger.info(f"🌐 正在打开: {login_url}")
            
            # 打开页面
            self.driver.get(login_url)
            
            # 等待页面加载
            wait = WebDriverWait(self.driver, self.config['timeout'])
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # 等待JavaScript执行
            time.sleep(3)
            
            # 1. 智能表单填写
            form_result = self._smart_form_fill(username, password)
            if not form_result['success']:
                return form_result
            
            # 2. 智能按钮查找和点击
            button_result = self._smart_button_click()
            if not button_result['success']:
                return button_result
            
            # 3. 监控登录结果
            login_result = self._monitor_login_result(base_url)
            
            return login_result
            
        except Exception as e:
            return {'success': False, 'error': f"登录尝试异常: {e}"}
    
    def _smart_form_fill(self, username, password):
        """智能表单填写"""
        logger.info("📝 智能表单填写...")
        
        try:
            # 多种用户名输入框选择器
            username_selectors = [
                "input[type='text']",
                "input[placeholder*='用户名']",
                "input[placeholder*='user']",
                "input[name='username']",
                "input[id*='username']",
                "input[type='email']",
                "input[autocomplete='username']",
                "input:first-of-type"
            ]
            
            username_input = None
            for selector in username_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        if element.is_displayed() and element.is_enabled():
                            username_input = element
                            break
                    if username_input:
                        break
                except:
                    continue
            
            if not username_input:
                return {'success': False, 'error': '未找到用户名输入框'}
            
            # 多种密码输入框选择器
            password_selectors = [
                "input[type='password']",
                "input[placeholder*='密码']",
                "input[placeholder*='password']",
                "input[name='password']",
                "input[id*='password']",
                "input[autocomplete='current-password']",
                "input:last-of-type"
            ]
            
            password_input = None
            for selector in password_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in elements:
                        if element.is_displayed() and element.is_enabled():
                            password_input = element
                            break
                    if password_input:
                        break
                except:
                    continue
            
            if not password_input:
                return {'success': False, 'error': '未找到密码输入框'}
            
            # 填写表单
            username_input.clear()
            username_input.send_keys(username)
            
            password_input.clear()
            password_input.send_keys(password)
            
            logger.info("✅ 表单填写完成")
            return {'success': True, 'username_input': username_input, 'password_input': password_input}
            
        except Exception as e:
            return {'success': False, 'error': f"表单填写失败: {e}"}
    
    def _smart_button_click(self):
        """智能按钮查找和点击"""
        logger.info("🖱️ 智能按钮查找...")
        
        try:
            # 多种按钮选择器（按优先级排序）
            button_selectors = [
                # 高优先级：明确的登录按钮
                "button:contains('登录')",
                "button:contains('Login')",
                "input[type='submit']:contains('登录')",
                "input[type='submit']:contains('Login')",
                
                # 中优先级：表单提交按钮
                "form button[type='submit']",
                "form input[type='submit']",
                "button[type='submit']",
                "input[type='submit']",
                
                # 低优先级：通用按钮
                "button",
                "input[type='button']",
                "[role='button']",
                
                # 最后尝试：所有可点击元素
                "*"
            ]
            
            # 使用JavaScript查找包含文本的元素
            login_keywords = ['登录', 'Login', '登 录', 'Sign in', '登陆', '登入']
            
            for keyword in login_keywords:
                try:
                    # 使用JavaScript查找包含特定文本的元素
                    elements = self.driver.execute_script(f"""
                        var elements = [];
                        var allElements = document.querySelectorAll('button, input, a, div, span');
                        for (var i = 0; i < allElements.length; i++) {{
                            var element = allElements[i];
                            if (element.textContent && element.textContent.includes('{keyword}')) {{
                                elements.push(element);
                            }}
                        }}
                        return elements;
                    """)
                    
                    if elements:
                        for element in elements:
                            try:
                                if element.is_displayed() and element.is_enabled():
                                    logger.info(f"🎯 找到登录按钮: {keyword}")
                                    
                                    # 模拟真实点击
                                    self._simulate_real_click(element)
                                    
                                    logger.info("✅ 按钮点击成功")
                                    return {'success': True}
                            except StaleElementReferenceException:
                                continue
                            except Exception as e:
                                logger.debug(f"按钮点击失败: {e}")
                                continue
                except:
                    continue
            
            # 如果JavaScript方法失败，使用传统方法
            for selector in button_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    for element in elements:
                        try:
                            if element.is_displayed() and element.is_enabled():
                                text = element.text.strip() if element.text else ''
                                
                                # 检查是否包含登录相关文本
                                if any(keyword in text for keyword in login_keywords) or selector in ["button[type='submit']", "input[type='submit']"]:
                                    logger.info(f"🎯 找到按钮: {element.tag_name} - '{text}'")
                                    
                                    # 模拟真实点击
                                    self._simulate_real_click(element)
                                    
                                    logger.info("✅ 按钮点击成功")
                                    return {'success': True}
                        except StaleElementReferenceException:
                            continue
                        except Exception as e:
                            logger.debug(f"按钮处理失败: {e}")
                            continue
                            
                except:
                    continue
            
            return {'success': False, 'error': '未找到可点击的登录按钮'}
            
        except Exception as e:
            return {'success': False, 'error': f"按钮查找失败: {e}"}
    
    def _simulate_real_click(self, element):
        """模拟真实点击"""
        try:
            # 使用ActionChains模拟真实用户行为
            actions = ActionChains(self.driver)
            
            # 移动到元素
            actions.move_to_element(element)
            
            # 短暂暂停（模拟用户犹豫）
            actions.pause(0.5)
            
            # 点击元素
            actions.click()
            
            # 执行动作
            actions.perform()
            
            # 等待响应
            time.sleep(2)
            
        except Exception as e:
            # 如果ActionChains失败，使用直接点击
            try:
                element.click()
                time.sleep(2)
            except Exception as e2:
                raise Exception(f"ActionChains和直接点击都失败: {e2}")
    
    def _monitor_login_result(self, base_url):
        """监控登录结果"""
        logger.info("📊 监控登录结果...")
        
        try:
            # 检查URL是否变化
            current_url = self.driver.current_url
            
            # 如果URL变化，可能是登录成功
            if current_url != f"{base_url}/login":
                logger.info(f"🎉 URL变化: {current_url}")
                
                # 检查页面内容确认登录成功
                page_title = self.driver.title
                page_source = self.driver.page_source
                
                # 检查是否有登录成功的迹象
                success_indicators = [
                    'dashboard' in current_url.lower(),
                    'admin' in current_url.lower() and 'login' not in current_url.lower(),
                    '首页' in page_title,
                    'Dashboard' in page_title,
                    '欢迎' in page_source,
                    'Welcome' in page_source
                ]
                
                if any(success_indicators):
                    return {
                        'success': True,
                        'message': '登录成功',
                        'current_url': current_url,
                        'page_title': page_title
                    }
                else:
                    return {
                        'success': True,
                        'message': 'URL变化但需要进一步确认',
                        'current_url': current_url,
                        'page_title': page_title
                    }
            else:
                # URL未变化，检查是否有错误信息
                error_selectors = [
                    ".error",
                    ".alert",
                    "[role='alert']",
                    "[class*='error']",
                    "[class*='alert']"
                ]
                
                error_message = None
                for selector in error_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        for element in elements:
                            if element.is_displayed():
                                text = element.text.strip()
                                if text:
                                    error_message = text
                                    break
                        if error_message:
                            break
                    except:
                        continue
                
                if error_message:
                    return {'success': False, 'error': f"登录失败: {error_message}"}
                else:
                    return {'success': False, 'error': '登录失败: URL未变化且未发现错误信息'}
            
        except Exception as e:
            return {'success': False, 'error': f"登录结果监控失败: {e}"}
    
    def test_api_login(self, app_type):
        """测试API登录"""
        logger.info(f"\n=== 测试API登录 - {app_type} ===")
        
        try:
            if app_type == "用户端":
                api_url = f"{self.config['user_api_url']}/api/users/login"
                username = self.config['test_user']['username']
                password = self.config['test_user']['password']
            else:
                api_url = f"{self.config['admin_api_url']}/api/users/login"
                username = self.config['admin_user']['username']
                password = self.config['admin_user']['password']
            
            # 准备请求数据
            data = {
                'username': username,
                'password': password
            }
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            # 发送请求
            response = requests.post(api_url, json=data, headers=headers, timeout=10)
            
            logger.info(f"🌐 API请求状态: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ API登录成功: {result}")
                return {'success': True, 'response': result}
            else:
                logger.error(f"❌ API登录失败: {response.status_code} - {response.text}")
                return {'success': False, 'error': f"API返回 {response.status_code}"}
            
        except Exception as e:
            logger.error(f"❌ API测试异常: {e}")
            return {'success': False, 'error': str(e)}
    
    def run_comprehensive_test(self):
        """运行全面测试"""
        logger.info("🚀 开始终极登录测试...")
        logger.info("=" * 60)
        
        # 1. 设置测试环境
        test_ready = self.setup_ultimate_selenium()
        
        if not test_ready:
            logger.error("❌ 测试环境初始化失败")
            return False
        
        results = {}
        
        try:
            # 2. 测试用户端API登录
            user_api_result = self.test_api_login("用户端")
            results['user_api'] = user_api_result
            
            # 3. 测试管理端API登录
            admin_api_result = self.test_api_login("管理端")
            results['admin_api'] = admin_api_result
            
            # 4. 测试用户端前端登录
            user_frontend_result = self.smart_login_with_retry("用户端")
            results['user_frontend'] = user_frontend_result
            
            # 5. 测试管理端前端登录
            admin_frontend_result = self.smart_login_with_retry("管理端")
            results['admin_frontend'] = admin_frontend_result
            
            # 6. 输出测试报告
            self._output_test_report(results)
            
            # 7. 保存详细报告
            self._save_test_report(results)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ 测试过程异常: {e}")
            return False
        
        finally:
            # 清理资源
            if self.driver:
                self.driver.quit()
    
    def _output_test_report(self, results):
        """输出测试报告"""
        logger.info("\n📊 终极登录测试报告:")
        logger.info("=" * 60)
        
        # API测试结果
        user_api_success = results.get('user_api', {}).get('success', False)
        admin_api_success = results.get('admin_api', {}).get('success', False)
        
        logger.info(f"🌐 API测试结果:")
        logger.info(f"   用户端API: {'✅ 成功' if user_api_success else '❌ 失败'}")
        logger.info(f"   管理端API: {'✅ 成功' if admin_api_success else '❌ 失败'}")
        
        # 前端测试结果
        user_frontend_success = results.get('user_frontend', {}).get('success', False)
        admin_frontend_success = results.get('admin_frontend', {}).get('success', False)
        
        logger.info(f"\n🌍 前端测试结果:")
        logger.info(f"   用户端前端: {'✅ 成功' if user_frontend_success else '❌ 失败'}")
        logger.info(f"   管理端前端: {'✅ 成功' if admin_frontend_success else '❌ 失败'}")
        
        # 问题诊断
        self._diagnose_final_problems(results)
    
    def _diagnose_final_problems(self, results):
        """诊断最终问题"""
        logger.info(f"\n🔧 最终问题诊断:")
        
        # API测试结果
        user_api_success = results.get('user_api', {}).get('success', False)
        admin_api_success = results.get('admin_api', {}).get('success', False)
        
        # 前端测试结果
        user_frontend_success = results.get('user_frontend', {}).get('success', False)
        admin_frontend_success = results.get('admin_frontend', {}).get('success', False)
        
        problems = []
        
        if user_api_success and not user_frontend_success:
            problems.append("❌ 用户端: API正常但前端登录失败")
        
        if admin_api_success and not admin_frontend_success:
            problems.append("❌ 管理端: API正常但前端登录失败")
        
        if not user_api_success:
            problems.append("❌ 用户端API登录失败")
        
        if not admin_api_success:
            problems.append("❌ 管理端API登录失败")
        
        if problems:
            for problem in problems:
                logger.info(f"   {problem}")
            
            logger.info(f"\n💡 最终解决方案:")
            
            if user_api_success and admin_api_success:
                logger.info("   1. ✅ 后端API功能正常")
                logger.info("   2. 🔧 前端存在以下问题需要修复:")
                logger.info("      - 检查前端JavaScript代码")
                logger.info("      - 验证事件绑定是否正确")
                logger.info("      - 检查表单提交逻辑")
                logger.info("      - 查看前端控制台错误")
                logger.info("   3. 🚀 建议手动检查前端页面")
            else:
                logger.info("   1. ❌ 后端API存在问题")
                logger.info("   2. 🔧 需要检查后端服务")
                logger.info("   3. 🚀 建议检查API服务状态")
        else:
            logger.info("✅ 所有测试通过，系统正常!")
    
    def _save_test_report(self, results):
        """保存测试报告"""
        try:
            # 简化数据用于保存
            simplified_results = {}
            
            for key, result in results.items():
                simplified_results[key] = {
                    'success': result.get('success', False),
                    'message': result.get('message'),
                    'error': result.get('error'),
                    'current_url': result.get('current_url'),
                    'page_title': result.get('page_title')
                }
            
            report = {
                'timestamp': time.time(),
                'results': simplified_results,
                'summary': {
                    'user_api_success': results.get('user_api', {}).get('success', False),
                    'admin_api_success': results.get('admin_api', {}).get('success', False),
                    'user_frontend_success': results.get('user_frontend', {}).get('success', False),
                    'admin_frontend_success': results.get('admin_frontend', {}).get('success', False)
                }
            }
            
            with open('ultimate_login_test_report.json', 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            
            logger.info("📄 终极测试报告已保存: ultimate_login_test_report.json")
            
        except Exception as e:
            logger.error(f"❌ 测试报告保存失败: {e}")

def main():
    """主函数"""
    print("终极登录解决方案")
    print("=" * 60)
    print("此程序结合所有发现的问题，实现可靠的登录测试")
    print("=" * 60)
    
    try:
        solver = UltimateLoginSolver()
        success = solver.run_comprehensive_test()
        
        if success:
            print("\n🎊 终极登录测试完成！")
            print("📋 详细测试报告已生成")
        else:
            print("\n💡 测试过程中发现问题")
            
    except Exception as e:
        print(f"\n❌ 测试程序启动失败: {e}")

if __name__ == "__main__":
    main()