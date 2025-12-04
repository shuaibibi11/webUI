#!/usr/bin/env python3
"""
高级按钮调试程序
专门解决前端登录按钮识别问题
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

class AdvancedButtonDebugger:
    def __init__(self):
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'timeout': 15,
            'headless': False
        }
        self.driver = None
        
    def setup_selenium(self):
        """设置Selenium"""
        logger.info("\n=== 设置高级调试环境 ===")
        
        try:
            # 配置Chrome选项
            chrome_options = Options()
            chrome_options.add_argument('--headless=new')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            
            self.driver = webdriver.Chrome(options=chrome_options)
            
            logger.info("✅ 高级调试环境初始化成功")
            return True
            
        except Exception as e:
            logger.error(f"❌ 调试环境初始化失败: {e}")
            return False
    
    def find_all_possible_buttons(self, app_type):
        """查找所有可能的按钮元素"""
        logger.info(f"\n=== 查找所有可能的按钮 - {app_type} ===")
        
        try:
            # 确定URL
            if app_type == "用户端":
                base_url = self.config['user_web_url']
            else:
                base_url = self.config['admin_web_url']
            
            login_url = f"{base_url}/login"
            logger.info(f"🌐 正在打开: {login_url}")
            
            # 打开页面
            self.driver.get(login_url)
            
            # 等待页面加载
            wait = WebDriverWait(self.driver, self.config['timeout'])
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # 等待JavaScript执行
            time.sleep(3)
            
            # 1. 使用多种选择器查找按钮
            all_buttons = self._find_buttons_with_multiple_selectors()
            
            # 2. 分析按钮属性
            button_analysis = self._analyze_button_attributes(all_buttons)
            
            # 3. 检查按钮可见性
            visibility_analysis = self._check_button_visibility(all_buttons)
            
            # 4. 模拟点击测试
            click_test_results = self._test_button_clicks(all_buttons, app_type)
            
            # 汇总结果
            analysis_result = {
                'app_type': app_type,
                'total_buttons_found': len(all_buttons),
                'button_analysis': button_analysis,
                'visibility_analysis': visibility_analysis,
                'click_test_results': click_test_results,
                'page_source_snippet': self.driver.page_source[:1000] + "..." if len(self.driver.page_source) > 1000 else self.driver.page_source
            }
            
            # 输出结果
            self._output_button_analysis(analysis_result)
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"❌ 按钮查找失败: {e}")
            return None
    
    def _find_buttons_with_multiple_selectors(self):
        """使用多种选择器查找按钮"""
        all_elements = []
        
        # 标准按钮选择器
        selectors = [
            # 标准按钮
            "button",
            "input[type='submit']",
            "input[type='button']",
            
            # 链接按钮
            "a[role='button']",
            "a.btn",
            "a.button",
            
            # 自定义按钮
            "[role='button']",
            "[type='button']",
            "[type='submit']",
            
            # Vue.js按钮
            "[v-on:click]",
            "[@click]",
            "[v-bind:click]",
            
            # 常见类名
            ".btn",
            ".button",
            ".login-btn",
            ".submit-btn",
            ".el-button",
            ".ant-btn",
            ".ivu-btn",
            
            # 包含登录文本的元素
            "*:contains('登录')",
            "*:contains('Login')",
            "*:contains('登 录')",
            "*:contains('Sign in')",
            
            # 表单相关
            "form *",
            ".form *",
            
            # 通用可点击元素
            "[onclick]",
            "[tabindex]",
            "[cursor='pointer']",
            
            # 可能的按钮容器
            "div[role='button']",
            "span[role='button']",
            "p[role='button']",
            
            # 图标按钮
            "i[role='button']",
            "svg[role='button']",
            
            # 所有可点击元素
            "[clickable]",
            "[data-click]",
            "[data-action]",
            
            # 最后尝试：所有元素
            "*"
        ]
        
        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                
                # 去重
                for element in elements:
                    if element not in all_elements:
                        all_elements.append(element)
                        
            except Exception as e:
                logger.debug(f"选择器 {selector} 查找失败: {e}")
        
        logger.info(f"✅ 使用 {len(selectors)} 种选择器找到 {len(all_elements)} 个元素")
        return all_elements
    
    def _analyze_button_attributes(self, elements):
        """分析按钮属性"""
        analysis = []
        
        for i, element in enumerate(elements):
            try:
                element_info = {
                    'index': i,
                    'tag': element.tag_name,
                    'text': element.text.strip() if element.text else '',
                    'id': element.get_attribute('id') or '无id',
                    'class': element.get_attribute('class') or '无class',
                    'type': element.get_attribute('type') or '无type',
                    'onclick': element.get_attribute('onclick') or '无onclick',
                    'v-on:click': element.get_attribute('v-on:click') or '无v-on:click',
                    'role': element.get_attribute('role') or '无role',
                    'disabled': element.get_attribute('disabled') is not None,
                    'style': element.get_attribute('style') or '无style',
                    'is_displayed': element.is_displayed(),
                    'is_enabled': element.is_enabled(),
                    'location': element.location,
                    'size': element.size
                }
                
                analysis.append(element_info)
                
            except Exception as e:
                logger.debug(f"元素 {i} 属性分析失败: {e}")
        
        return analysis
    
    def _check_button_visibility(self, elements):
        """检查按钮可见性"""
        visibility = {
            'total': len(elements),
            'displayed': 0,
            'enabled': 0,
            'has_text': 0,
            'login_related': 0
        }
        
        for element in elements:
            try:
                if element.is_displayed():
                    visibility['displayed'] += 1
                
                if element.is_enabled():
                    visibility['enabled'] += 1
                
                text = element.text.strip() if element.text else ''
                if text:
                    visibility['has_text'] += 1
                    
                    # 检查是否包含登录相关文本
                    login_keywords = ['登录', 'Login', '登 录', 'Sign in', '登陆', '登入']
                    if any(keyword in text for keyword in login_keywords):
                        visibility['login_related'] += 1
                        
            except Exception as e:
                logger.debug(f"可见性检查失败: {e}")
        
        return visibility
    
    def _test_button_clicks(self, elements, app_type):
        """测试按钮点击"""
        test_results = []
        
        # 先填写表单
        try:
            if app_type == "用户端":
                username = "testuser"
                password = "Test123456!"
            else:
                username = "admin"
                password = "Abcdef1!"
            
            # 查找并填写用户名
            username_selectors = [
                "input[type='text']",
                "input[placeholder*='用户名']",
                "input[placeholder*='user']",
                "input[name='username']",
                "input[id*='username']"
            ]
            
            username_input = None
            for selector in username_selectors:
                try:
                    username_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if username_input:
                        username_input.clear()
                        username_input.send_keys(username)
                        break
                except:
                    continue
            
            # 查找并填写密码
            password_selectors = [
                "input[type='password']",
                "input[placeholder*='密码']",
                "input[placeholder*='password']",
                "input[name='password']",
                "input[id*='password']"
            ]
            
            password_input = None
            for selector in password_selectors:
                try:
                    password_input = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if password_input:
                        password_input.clear()
                        password_input.send_keys(password)
                        break
                except:
                    continue
            
            logger.info("✅ 表单填写完成")
            
        except Exception as e:
            logger.error(f"❌ 表单填写失败: {e}")
        
        # 测试每个按钮的点击
        for i, element in enumerate(elements):
            try:
                # 记录点击前状态
                before_url = self.driver.current_url
                before_title = self.driver.title
                
                # 检查元素是否可点击
                if not element.is_displayed() or not element.is_enabled():
                    test_results.append({
                        'index': i,
                        'tag': element.tag_name,
                        'text': element.text.strip() if element.text else '',
                        'status': '不可点击',
                        'reason': '元素不可见或已禁用',
                        'url_changed': False
                    })
                    continue
                
                # 尝试点击
                element.click()
                
                # 等待响应
                time.sleep(2)
                
                # 记录点击后状态
                after_url = self.driver.current_url
                after_title = self.driver.title
                
                url_changed = before_url != after_url
                
                test_results.append({
                    'index': i,
                    'tag': element.tag_name,
                    'text': element.text.strip() if element.text else '',
                    'status': '点击成功',
                    'reason': '元素被点击',
                    'url_changed': url_changed,
                    'before_url': before_url,
                    'after_url': after_url
                })
                
                # 如果URL变化，可能是登录成功，回到登录页面继续测试
                if url_changed:
                    logger.info(f"🎉 发现可能有效的按钮: {element.tag_name} - '{element.text}'")
                    # 回到登录页面
                    if app_type == "用户端":
                        self.driver.get(f"{self.config['user_web_url']}/login")
                    else:
                        self.driver.get(f"{self.config['admin_web_url']}/login")
                    time.sleep(2)
                    
                    # 重新填写表单
                    if username_input and password_input:
                        username_input.clear()
                        username_input.send_keys(username)
                        password_input.clear()
                        password_input.send_keys(password)
                
            except Exception as e:
                test_results.append({
                    'index': i,
                    'tag': element.tag_name,
                    'text': element.text.strip() if element.text else '',
                    'status': '点击失败',
                    'reason': str(e),
                    'url_changed': False
                })
        
        return test_results
    
    def _output_button_analysis(self, analysis_result):
        """输出按钮分析结果"""
        app_type = analysis_result['app_type']
        
        logger.info(f"\n🎯 {app_type}按钮分析结果:")
        logger.info("=" * 60)
        
        # 总体统计
        logger.info(f"📊 总体统计:")
        logger.info(f"   找到的元素总数: {analysis_result['total_buttons_found']}")
        
        visibility = analysis_result['visibility_analysis']
        logger.info(f"   可见的元素: {visibility['displayed']}/{visibility['total']}")
        logger.info(f"   启用的元素: {visibility['enabled']}/{visibility['total']}")
        logger.info(f"   包含文本的元素: {visibility['has_text']}/{visibility['total']}")
        logger.info(f"   登录相关元素: {visibility['login_related']}/{visibility['total']}")
        
        # 详细分析
        button_analysis = analysis_result['button_analysis']
        logger.info(f"\n🔍 详细元素分析:")
        
        for button in button_analysis[:10]:  # 只显示前10个
            if button['is_displayed'] and button['is_enabled']:
                status = "✅ 可点击"
            else:
                status = "❌ 不可点击"
            
            logger.info(f"   元素 {button['index']}: {button['tag']} - 文本: '{button['text']}' - {status}")
            if button['text'] and any(keyword in button['text'] for keyword in ['登录', 'Login']):
                logger.info(f"     🔥 可能是登录按钮!")
        
        # 点击测试结果
        click_results = analysis_result['click_test_results']
        logger.info(f"\n🖱️ 点击测试结果:")
        
        successful_clicks = [r for r in click_results if r['status'] == '点击成功']
        url_changes = [r for r in click_results if r['url_changed']]
        
        logger.info(f"   成功点击: {len(successful_clicks)}/{len(click_results)}")
        logger.info(f"   URL变化: {len(url_changes)}/{len(click_results)}")
        
        for result in click_results:
            if result['url_changed']:
                logger.info(f"   🎉 元素 {result['index']} ({result['tag']}): '{result['text']}' - URL变化成功!")
                logger.info(f"       前: {result['before_url']}")
                logger.info(f"       后: {result['after_url']}")
        
        # 问题诊断
        self._diagnose_button_problems(analysis_result)
    
    def _diagnose_button_problems(self, analysis_result):
        """诊断按钮问题"""
        logger.info(f"\n🔧 问题诊断:")
        
        problems = []
        
        # 检查是否有元素
        if analysis_result['total_buttons_found'] == 0:
            problems.append("❌ 未找到任何元素，页面可能未正确加载")
        
        # 检查可见元素
        visibility = analysis_result['visibility_analysis']
        if visibility['displayed'] == 0:
            problems.append("❌ 没有可见的元素，可能被CSS隐藏")
        
        # 检查登录相关元素
        if visibility['login_related'] == 0:
            problems.append("❌ 未找到包含'登录'文本的元素")
        
        # 检查点击结果
        click_results = analysis_result['click_test_results']
        url_changes = [r for r in click_results if r['url_changed']]
        
        if len(url_changes) == 0:
            problems.append("❌ 没有元素点击后导致URL变化，登录功能可能有问题")
        
        if problems:
            for problem in problems:
                logger.info(f"   {problem}")
            
            logger.info(f"\n💡 建议解决方案:")
            logger.info("   1. 检查前端页面是否正常加载")
            logger.info("   2. 验证CSS样式是否影响按钮显示")
            logger.info("   3. 检查JavaScript事件绑定")
            logger.info("   4. 查看前端控制台错误信息")
            logger.info("   5. 可能需要手动检查前端代码")
        else:
            logger.info("✅ 未发现明显问题")
    
    def run_comprehensive_button_debug(self):
        """运行全面的按钮调试"""
        logger.info("🚀 开始高级按钮调试...")
        logger.info("=" * 60)
        
        # 1. 设置调试环境
        debug_ready = self.setup_selenium()
        
        if not debug_ready:
            logger.error("❌ 调试环境初始化失败")
            return False
        
        # 2. 调试用户端
        user_analysis = self.find_all_possible_buttons("用户端")
        
        # 3. 调试管理端
        admin_analysis = self.find_all_possible_buttons("管理端")
        
        # 4. 保存详细报告
        self._save_debug_report(user_analysis, admin_analysis)
        
        # 清理资源
        if self.driver:
            self.driver.quit()
        
        logger.info("\n🎊 高级按钮调试完成！")
        
        return True
    
    def _save_debug_report(self, user_analysis, admin_analysis):
        """保存调试报告"""
        try:
            # 简化数据，避免序列化问题
            def simplify_analysis(analysis):
                if not analysis:
                    return None
                
                return {
                    'app_type': analysis.get('app_type'),
                    'total_buttons_found': analysis.get('total_buttons_found'),
                    'visibility_analysis': analysis.get('visibility_analysis'),
                    'click_test_results': [
                        {
                            'index': r.get('index'),
                            'tag': r.get('tag'),
                            'text': r.get('text'),
                            'status': r.get('status'),
                            'url_changed': r.get('url_changed')
                        }
                        for r in analysis.get('click_test_results', [])
                    ]
                }
            
            report = {
                'timestamp': time.time(),
                'user_analysis': simplify_analysis(user_analysis),
                'admin_analysis': simplify_analysis(admin_analysis)
            }
            
            with open('advanced_button_debug_report.json', 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            
            logger.info("📄 高级调试报告已保存: advanced_button_debug_report.json")
            
        except Exception as e:
            logger.error(f"❌ 调试报告保存失败: {e}")

def main():
    """主函数"""
    print("高级按钮调试程序")
    print("=" * 60)
    print("此程序专门解决前端登录按钮识别问题")
    print("=" * 60)
    
    try:
        debugger = AdvancedButtonDebugger()
        success = debugger.run_comprehensive_button_debug()
        
        if success:
            print("\n🎊 高级按钮调试完成！")
            print("📋 详细分析报告已生成")
        else:
            print("\n💡 调试过程中发现问题")
            
    except Exception as e:
        print(f"\n❌ 调试程序启动失败: {e}")

if __name__ == "__main__":
    main()