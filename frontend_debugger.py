#!/usr/bin/env python3
"""
前端JavaScript调试程序
深入诊断前端登录功能的问题
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
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FrontendDebugger:
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
        self.console_errors = []
        
    def setup_debug_selenium(self):
        """设置调试用的Selenium"""
        logger.info("\n=== 设置调试用Selenium ===")
        
        try:
            # 配置Chrome选项
            chrome_options = Options()
            chrome_options.add_argument('--headless=new')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            # 启用控制台日志
            chrome_options.set_capability('goog:loggingPrefs', {
                'browser': 'ALL',
                'performance': 'ALL'
            })
            
            # 禁用图片加载以加快速度
            chrome_options.add_argument('--blink-settings=imagesEnabled=false')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            
            logger.info("✅ 调试用Selenium初始化成功")
            return True
            
        except Exception as e:
            logger.error(f"❌ Selenium初始化失败: {e}")
            return False
    
    def capture_console_errors(self):
        """捕获控制台错误"""
        try:
            logs = self.driver.get_log('browser')
            
            for log in logs:
                if log['level'] in ['SEVERE', 'ERROR']:
                    self.console_errors.append({
                        'level': log['level'],
                        'message': log['message'],
                        'timestamp': time.time()
                    })
                    
        except Exception as e:
            logger.debug(f"控制台错误捕获失败: {e}")
    
    def debug_frontend_login(self, app_type, username, password):
        """调试前端登录功能"""
        logger.info(f"\n=== 调试前端登录功能 - {app_type} ===")
        
        try:
            # 确定URL
            if app_type == "用户端":
                base_url = self.config['user_web_url']
            else:
                base_url = self.config['admin_web_url']
            
            login_url = f"{base_url}/login"
            logger.info(f"🌐 正在打开: {login_url}")
            
            # 清除之前的错误
            self.console_errors = []
            
            # 打开页面
            self.driver.get(login_url)
            
            # 等待页面加载
            wait = WebDriverWait(self.driver, self.config['timeout'])
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # 等待JavaScript执行
            time.sleep(3)
            
            # 1. 分析页面结构
            page_analysis = self._analyze_page_structure()
            
            # 2. 检查JavaScript框架
            framework_analysis = self._analyze_javascript_frameworks()
            
            # 3. 检查事件绑定
            event_analysis = self._analyze_event_bindings()
            
            # 4. 检查表单验证
            form_analysis = self._analyze_form_validation()
            
            # 5. 捕获控制台错误
            self.capture_console_errors()
            
            # 6. 执行JavaScript调试
            js_debug = self._execute_javascript_debug()
            
            # 7. 模拟登录并监控
            login_monitoring = self._monitor_login_behavior(username, password)
            
            # 汇总分析结果
            analysis_result = {
                'app_type': app_type,
                'page_analysis': page_analysis,
                'framework_analysis': framework_analysis,
                'event_analysis': event_analysis,
                'form_analysis': form_analysis,
                'console_errors': self.console_errors,
                'javascript_debug': js_debug,
                'login_monitoring': login_monitoring
            }
            
            # 输出分析结果
            self._output_analysis_results(analysis_result)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"❌ 前端调试失败: {e}")
            return None
    
    def _analyze_page_structure(self):
        """分析页面结构"""
        analysis = {}
        
        try:
            # 获取页面源代码
            page_source = self.driver.page_source
            analysis['page_size'] = len(page_source)
            analysis['title'] = self.driver.title
            
            # 检查关键元素
            analysis['app_element'] = self.driver.find_elements(By.ID, "app")
            analysis['vue_mount'] = self.driver.find_elements(By.CSS_SELECTOR, "[data-v-app]")
            
            # 检查Vue.js特征
            vue_features = [
                'v-model' in page_source,
                'v-bind' in page_source,
                'v-on' in page_source,
                'v-if' in page_source,
                'v-for' in page_source
            ]
            analysis['vue_features_present'] = any(vue_features)
            
            # 检查Vite特征
            analysis['vite_present'] = '/@vite/client' in page_source
            
            logger.info("✅ 页面结构分析完成")
            
        except Exception as e:
            logger.error(f"页面结构分析失败: {e}")
            analysis['error'] = str(e)
        
        return analysis
    
    def _analyze_javascript_frameworks(self):
        """分析JavaScript框架"""
        analysis = {'frameworks': []}
        
        try:
            page_source = self.driver.page_source
            
            # 检测框架
            if 'vue' in page_source.lower():
                analysis['frameworks'].append('Vue.js')
            if 'react' in page_source.lower():
                analysis['frameworks'].append('React')
            if 'vite' in page_source.lower():
                analysis['frameworks'].append('Vite')
            if 'axios' in page_source.lower() or 'fetch' in page_source.lower():
                analysis['frameworks'].append('HTTP Client')
            
            # 检查路由库
            if 'vue-router' in page_source.lower() or 'react-router' in page_source.lower():
                analysis['frameworks'].append('Router')
            
            logger.info("✅ JavaScript框架分析完成")
            
        except Exception as e:
            logger.error(f"框架分析失败: {e}")
            analysis['error'] = str(e)
        
        return analysis
    
    def _analyze_event_bindings(self):
        """分析事件绑定"""
        analysis = {}
        
        try:
            # 查找登录按钮
            login_buttons = self.driver.find_elements(By.CSS_SELECTOR, 
                "button, input[type='submit'], [onclick], [v-on:click], [@click]")
            
            analysis['login_buttons_count'] = len(login_buttons)
            
            # 分析按钮属性
            button_analysis = []
            for button in login_buttons:
                button_info = {
                    'tag': button.tag_name,
                    'text': button.text,
                    'type': button.get_attribute('type') or 'button',
                    'onclick': button.get_attribute('onclick'),
                    'v-on:click': button.get_attribute('v-on:click'),
                    'class': button.get_attribute('class')
                }
                button_analysis.append(button_info)
            
            analysis['buttons'] = button_analysis
            
            logger.info("✅ 事件绑定分析完成")
            
        except Exception as e:
            logger.error(f"事件绑定分析失败: {e}")
            analysis['error'] = str(e)
        
        return analysis
    
    def _analyze_form_validation(self):
        """分析表单验证"""
        analysis = {}
        
        try:
            # 查找表单
            forms = self.driver.find_elements(By.TAG_NAME, "form")
            analysis['forms_count'] = len(forms)
            
            form_analysis = []
            for form in forms:
                form_info = {
                    'id': form.get_attribute('id') or '无id',
                    'action': form.get_attribute('action') or '无action',
                    'method': form.get_attribute('method') or '无method',
                    'inputs': []
                }
                
                # 查找表单内的输入框
                inputs = form.find_elements(By.TAG_NAME, "input")
                for input_elem in inputs:
                    input_info = {
                        'type': input_elem.get_attribute('type'),
                        'name': input_elem.get_attribute('name'),
                        'id': input_elem.get_attribute('id'),
                        'placeholder': input_elem.get_attribute('placeholder'),
                        'required': input_elem.get_attribute('required') is not None
                    }
                    form_info['inputs'].append(input_info)
                
                form_analysis.append(form_info)
            
            analysis['forms'] = form_analysis
            
            logger.info("✅ 表单验证分析完成")
            
        except Exception as e:
            logger.error(f"表单验证分析失败: {e}")
            analysis['error'] = str(e)
        
        return analysis
    
    def _execute_javascript_debug(self):
        """执行JavaScript调试"""
        debug_results = {}
        
        try:
            # 检查Vue实例
            debug_results['vue_instance'] = self.driver.execute_script(
                "return typeof window.Vue !== 'undefined' ? 'Vue found' : 'Vue not found';"
            )
            
            # 检查全局变量
            debug_results['window_vars'] = self.driver.execute_script(
                "return Object.keys(window).filter(key => key.includes('app') || key.includes('login') || key.includes('vue') || key.includes('Vue'));"
            )
            
            # 检查是否有错误处理
            debug_results['error_handlers'] = self.driver.execute_script("""
                return {
                    'onerror': typeof window.onerror !== 'undefined',
                    'addEventListener_error': typeof window.addEventListener === 'function'
                };
            """)
            
            logger.info("✅ JavaScript调试完成")
            
        except Exception as e:
            logger.error(f"JavaScript调试失败: {e}")
            debug_results['error'] = str(e)
        
        return debug_results
    
    def _monitor_login_behavior(self, username, password):
        """监控登录行为"""
        monitoring = {}
        
        try:
            # 清除控制台错误
            self.console_errors = []
            
            # 查找并填写表单
            username_input = self.driver.find_element(By.CSS_SELECTOR, 
                "input[type='text'], input[type='email'], input[placeholder*='用户名'], input[placeholder*='user']")
            password_input = self.driver.find_element(By.CSS_SELECTOR, 
                "input[type='password'], input[placeholder*='密码'], input[placeholder*='password']")
            
            # 填写表单
            username_input.clear()
            username_input.send_keys(username)
            
            password_input.clear()
            password_input.send_keys(password)
            
            # 捕获填写过程中的错误
            self.capture_console_errors()
            monitoring['form_fill_errors'] = len(self.console_errors)
            
            # 查找登录按钮
            login_button = self.driver.find_element(By.CSS_SELECTOR, 
                "button[type='submit'], button:contains('登录'), button:contains('Login')")
            
            # 点击前记录状态
            monitoring['before_click_url'] = self.driver.current_url
            monitoring['before_click_title'] = self.driver.title
            
            # 点击登录按钮
            login_button.click()
            
            # 等待响应
            time.sleep(3)
            
            # 点击后记录状态
            monitoring['after_click_url'] = self.driver.current_url
            monitoring['after_click_title'] = self.driver.title
            
            # 捕获点击后的错误
            self.capture_console_errors()
            monitoring['after_click_errors'] = len(self.console_errors)
            
            # 检查是否有网络请求
            monitoring['url_changed'] = monitoring['before_click_url'] != monitoring['after_click_url']
            
            logger.info("✅ 登录行为监控完成")
            
        except Exception as e:
            logger.error(f"登录行为监控失败: {e}")
            monitoring['error'] = str(e)
        
        return monitoring
    
    def _output_analysis_results(self, analysis_result):
        """输出分析结果"""
        app_type = analysis_result['app_type']
        
        logger.info(f"\n📊 {app_type}前端分析结果:")
        logger.info("-" * 50)
        
        # 页面结构
        page = analysis_result['page_analysis']
        logger.info(f"📄 页面结构:")
        logger.info(f"   页面大小: {page.get('page_size', 'N/A')} 字符")
        logger.info(f"   页面标题: {page.get('title', 'N/A')}")
        logger.info(f"   Vue特征: {'✅ 存在' if page.get('vue_features_present') else '❌ 不存在'}")
        logger.info(f"   Vite特征: {'✅ 存在' if page.get('vite_present') else '❌ 不存在'}")
        
        # 框架分析
        framework = analysis_result['framework_analysis']
        logger.info(f"\n🛠️ JavaScript框架:")
        logger.info(f"   检测到的框架: {', '.join(framework.get('frameworks', [])) or '无'}")
        
        # 事件绑定
        event = analysis_result['event_analysis']
        logger.info(f"\n🔗 事件绑定:")
        logger.info(f"   登录按钮数量: {event.get('login_buttons_count', 0)}")
        
        buttons = event.get('buttons', [])
        for i, button in enumerate(buttons):
            logger.info(f"   按钮 {i+1}: {button.get('tag')} - 文本: '{button.get('text', '')}'")
            if button.get('onclick'):
                logger.info(f"      onclick: {button.get('onclick')}")
            if button.get('v-on:click'):
                logger.info(f"      v-on:click: {button.get('v-on:click')}")
        
        # 表单验证
        form = analysis_result['form_analysis']
        logger.info(f"\n📝 表单分析:")
        logger.info(f"   表单数量: {form.get('forms_count', 0)}")
        
        forms = form.get('forms', [])
        for i, form_info in enumerate(forms):
            logger.info(f"   表单 {i+1}: ID='{form_info.get('id')}', Action='{form_info.get('action')}'")
            for input_elem in form_info.get('inputs', []):
                logger.info(f"     输入框: type={input_elem.get('type')}, name={input_elem.get('name')}")
        
        # 控制台错误
        errors = analysis_result['console_errors']
        logger.info(f"\n❌ 控制台错误:")
        logger.info(f"   错误数量: {len(errors)}")
        
        for error in errors:
            logger.info(f"   {error.get('level')}: {error.get('message')}")
        
        # JavaScript调试
        js_debug = analysis_result['javascript_debug']
        logger.info(f"\n🔧 JavaScript调试:")
        logger.info(f"   Vue实例: {js_debug.get('vue_instance', 'N/A')}")
        
        # 登录监控
        monitoring = analysis_result['login_monitoring']
        logger.info(f"\n👤 登录行为监控:")
        logger.info(f"   表单填写错误: {monitoring.get('form_fill_errors', 0)}")
        logger.info(f"   点击后错误: {monitoring.get('after_click_errors', 0)}")
        logger.info(f"   URL是否变化: {'✅ 是' if monitoring.get('url_changed') else '❌ 否'}")
        logger.info(f"   点击前URL: {monitoring.get('before_click_url', 'N/A')}")
        logger.info(f"   点击后URL: {monitoring.get('after_click_url', 'N/A')}")
        
        # 问题诊断
        self._diagnose_problems(analysis_result)
    
    def _diagnose_problems(self, analysis_result):
        """诊断问题"""
        logger.info(f"\n🔍 问题诊断:")
        
        problems = []
        
        # 检查Vue.js是否存在
        if not analysis_result['page_analysis'].get('vue_features_present'):
            problems.append("❌ Vue.js特征未检测到，可能Vue应用未正确加载")
        
        # 检查控制台错误
        if analysis_result['console_errors']:
            problems.append(f"❌ 发现 {len(analysis_result['console_errors'])} 个控制台错误")
        
        # 检查登录按钮
        buttons_count = analysis_result['event_analysis'].get('login_buttons_count', 0)
        if buttons_count == 0:
            problems.append("❌ 未找到登录按钮")
        
        # 检查表单
        forms_count = analysis_result['form_analysis'].get('forms_count', 0)
        if forms_count == 0:
            problems.append("❌ 未找到表单元素")
        
        # 检查URL变化
        if not analysis_result['login_monitoring'].get('url_changed'):
            problems.append("❌ 点击登录后URL未变化，可能事件未触发或API调用失败")
        
        if problems:
            for problem in problems:
                logger.info(f"   {problem}")
            
            logger.info(f"\n💡 建议解决方案:")
            logger.info("   1. 检查前端控制台错误信息")
            logger.info("   2. 验证Vue组件是否正确挂载")
            logger.info("   3. 检查登录按钮的事件绑定")
            logger.info("   4. 验证表单提交逻辑")
            logger.info("   5. 检查前端API调用代码")
        else:
            logger.info("✅ 未发现明显问题，需要进一步调试")
    
    def run_comprehensive_debug(self):
        """运行全面的前端调试"""
        logger.info("🚀 开始前端JavaScript调试...")
        logger.info("=" * 60)
        
        # 1. 设置调试环境
        debug_ready = self.setup_debug_selenium()
        
        if not debug_ready:
            logger.error("❌ 调试环境初始化失败")
            return False
        
        # 2. 调试用户端
        user_analysis = self.debug_frontend_login(
            "用户端",
            self.config['test_user']['username'],
            self.config['test_user']['password']
        )
        
        # 3. 调试管理端
        admin_analysis = self.debug_frontend_login(
            "管理端",
            self.config['admin_user']['username'],
            self.config['admin_user']['password']
        )
        
        # 4. 保存详细分析报告
        self._save_debug_report(user_analysis, admin_analysis)
        
        # 清理资源
        if self.driver:
            self.driver.quit()
        
        logger.info("\n🎊 前端调试完成！")
        logger.info("📋 详细分析报告已保存")
        
        return True
    
    def _save_debug_report(self, user_analysis, admin_analysis):
        """保存调试报告"""
        try:
            report = {
                'timestamp': time.time(),
                'user_analysis': user_analysis,
                'admin_analysis': admin_analysis,
                'summary': {
                    'user_console_errors': len(user_analysis.get('console_errors', [])) if user_analysis else 0,
                    'admin_console_errors': len(admin_analysis.get('console_errors', [])) if admin_analysis else 0,
                    'user_url_changed': user_analysis.get('login_monitoring', {}).get('url_changed', False) if user_analysis else False,
                    'admin_url_changed': admin_analysis.get('login_monitoring', {}).get('url_changed', False) if admin_analysis else False
                }
            }
            
            with open('frontend_debug_report.json', 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            
            logger.info("📄 调试报告已保存: frontend_debug_report.json")
            
        except Exception as e:
            logger.error(f"❌ 调试报告保存失败: {e}")

def main():
    """主函数"""
    print("前端JavaScript调试程序")
    print("=" * 60)
    print("此程序深入诊断前端登录功能的问题")
    print("=" * 60)
    
    try:
        debugger = FrontendDebugger()
        success = debugger.run_comprehensive_debug()
        
        if success:
            print("\n🎊 前端调试完成！")
            print("📋 详细分析报告已生成")
        else:
            print("\n💡 调试过程中发现问题")
            
    except Exception as e:
        print(f"\n❌ 调试程序启动失败: {e}")

if __name__ == "__main__":
    main()