#!/usr/bin/env python3
"""
智能网页登录测试程序
通过多种方式测试登录功能，包括API直接测试、页面分析、表单模拟等
"""

import requests
import json
import time
from bs4 import BeautifulSoup
import re
import logging
import sys

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SmartWebLoginTest:
    def __init__(self):
        self.config = {
            'user_web_url': 'http://localhost:13080',
            'admin_web_url': 'http://localhost:13086',
            'user_api_url': 'http://localhost:11031',
            'admin_api_url': 'http://localhost:11025',
            'test_user': {'username': 'testuser', 'password': 'Test123456!'},
            'admin_user': {'username': 'admin', 'password': 'Abcdef1!'},
            'timeout': 10
        }
        self.session = requests.Session()
        
    def test_api_login_with_correct_password(self):
        """使用正确密码测试API登录"""
        logger.info("\n=== 使用正确密码测试API登录 ===")
        
        # 测试用户端API登录
        user_success = self._test_single_api_login(
            self.config['test_user']['username'],
            self.config['test_user']['password'],
            "用户端"
        )
        
        # 测试管理端API登录
        admin_success = self._test_single_api_login(
            self.config['admin_user']['username'],
            self.config['admin_user']['password'],
            "管理端"
        )
        
        return user_success and admin_success
    
    def _test_single_api_login(self, username, password, api_type):
        """测试单个API登录"""
        logger.info(f"\n--- 测试{api_type}API登录 ---")
        
        login_data = {
            'username': username,
            'password': password
        }
        
        try:
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/login",
                json=login_data,
                headers={
                    'Content-Type': 'application/json',
                    'Origin': self.config['user_web_url']
                },
                timeout=self.config['timeout']
            )
            
            logger.info(f"HTTP状态码: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 200:
                    logger.info("✅ API登录成功")
                    logger.info(f"   返回消息: {result.get('message')}")
                    logger.info(f"   Token: {result.get('token', 'N/A')}")
                    
                    # 检查用户信息
                    if 'user' in result:
                        user_info = result['user']
                        logger.info(f"   用户信息: {json.dumps(user_info, ensure_ascii=False, indent=4)}")
                    
                    return True
                else:
                    logger.error(f"❌ API登录失败: {result.get('message', '未知错误')}")
                    return False
            else:
                logger.error(f"❌ API登录HTTP错误: {response.status_code}")
                logger.error(f"   响应内容: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ {api_type}API登录请求失败: {e}")
            return False
    
    def analyze_web_page_interaction(self):
        """分析网页交互逻辑"""
        logger.info("\n=== 分析网页交互逻辑 ===")
        
        # 分析用户端登录页面
        user_page_info = self._analyze_single_page(
            f"{self.config['user_web_url']}/login", 
            "用户端"
        )
        
        # 分析管理端登录页面
        admin_page_info = self._analyze_single_page(
            f"{self.config['admin_web_url']}/login", 
            "管理端"
        )
        
        # 分析JavaScript事件绑定
        self._analyze_javascript_events(user_page_info, "用户端")
        self._analyze_javascript_events(admin_page_info, "管理端")
        
        return user_page_info is not None and admin_page_info is not None
    
    def _analyze_single_page(self, url, page_type):
        """分析单个页面"""
        logger.info(f"\n--- 分析{page_type}页面 ---")
        
        try:
            response = self.session.get(url, timeout=self.config['timeout'])
            
            if response.status_code != 200:
                logger.error(f"❌ {page_type}页面访问失败: {response.status_code}")
                return None
            
            logger.info(f"✅ {page_type}页面访问成功")
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 分析页面结构
            page_info = {
                'title': soup.find('title').text.strip() if soup.find('title') else '无标题',
                'forms': [],
                'buttons': [],
                'inputs': [],
                'scripts': [],
                'api_endpoints': []
            }
            
            # 分析表单
            forms = soup.find_all('form')
            for form in forms:
                form_info = {
                    'action': form.get('action', ''),
                    'method': form.get('method', 'GET'),
                    'inputs': []
                }
                
                inputs = form.find_all('input')
                for input_elem in inputs:
                    input_info = {
                        'type': input_elem.get('type', 'text'),
                        'name': input_elem.get('name', ''),
                        'placeholder': input_elem.get('placeholder', ''),
                        'id': input_elem.get('id', ''),
                        'class': input_elem.get('class', [])
                    }
                    form_info['inputs'].append(input_info)
                
                page_info['forms'].append(form_info)
            
            # 分析按钮
            buttons = soup.find_all('button')
            for button in buttons:
                button_info = {
                    'text': button.text.strip(),
                    'type': button.get('type', ''),
                    'class': button.get('class', []),
                    'onclick': button.get('onclick', '')
                }
                page_info['buttons'].append(button_info)
            
            # 分析JavaScript
            scripts = soup.find_all('script')
            for script in scripts:
                if script.get('src'):
                    page_info['scripts'].append(f"外部脚本: {script.get('src')}")
                elif script.string:
                    # 查找API调用
                    api_patterns = [
                        r'/api/[\w/-]*',
                        r'login.*url.*["\']([^"\']+)["\']',
                        r'fetch.*["\']([^"\']+)["\']',
                        r'axios.*["\']([^"\']+)["\']',
                        r'POST.*["\']([^"\']+)["\']'
                    ]
                    
                    for pattern in api_patterns:
                        matches = re.findall(pattern, script.string, re.IGNORECASE)
                        page_info['api_endpoints'].extend(matches)
            
            # 输出分析结果
            logger.info(f"   页面标题: {page_info['title']}")
            logger.info(f"   表单数量: {len(page_info['forms'])}")
            logger.info(f"   按钮数量: {len(page_info['buttons'])}")
            logger.info(f"   脚本数量: {len(page_info['scripts'])}")
            logger.info(f"   API端点: {len(set(page_info['api_endpoints']))}")
            
            # 详细输出表单信息
            for i, form in enumerate(page_info['forms']):
                logger.info(f"    表单{i+1}: action={form['action']}, method={form['method']}")
                for input_info in form['inputs']:
                    if input_info['type'] in ['text', 'password', 'email']:
                        logger.info(f"      输入框: {input_info['type']}, name={input_info['name']}, placeholder={input_info['placeholder']}")
            
            return page_info
            
        except Exception as e:
            logger.error(f"❌ {page_type}页面分析失败: {e}")
            return None
    
    def _analyze_javascript_events(self, page_info, page_type):
        """分析JavaScript事件"""
        if not page_info:
            return
        
        logger.info(f"\n--- 分析{page_type}JavaScript事件 ---")
        
        # 查找事件处理函数
        event_patterns = [
            r'\.addEventListener\(["\'](click|submit)["\']',
            r'\.onclick\s*=',
            r'\.onsubmit\s*=',
            r'@click\s*=',
            r'@submit\s*='
        ]
        
        events_found = []
        
        # 检查按钮的onclick属性
        for button in page_info['buttons']:
            if button['onclick']:
                events_found.append(f"按钮点击事件: {button['onclick']}")
        
        # 检查表单的onsubmit属性
        for form in page_info['forms']:
            # 这里需要检查HTML中的onsubmit属性
            pass
        
        if events_found:
            logger.info(f"   发现{len(events_found)}个事件处理器:")
            for event in events_found:
                logger.info(f"     {event}")
        else:
            logger.info("   未发现显式事件处理器，可能使用现代框架绑定")
    
    def simulate_form_submission(self):
        """模拟表单提交"""
        logger.info("\n=== 模拟表单提交 ===")
        
        # 模拟用户端表单提交
        user_success = self._simulate_single_form_submission(
            f"{self.config['user_web_url']}/login",
            self.config['test_user']['username'],
            self.config['test_user']['password'],
            "用户端"
        )
        
        # 模拟管理端表单提交
        admin_success = self._simulate_single_form_submission(
            f"{self.config['admin_web_url']}/login",
            self.config['admin_user']['username'],
            self.config['admin_user']['password'],
            "管理端"
        )
        
        return user_success or admin_success
    
    def _simulate_single_form_submission(self, url, username, password, page_type):
        """模拟单个表单提交"""
        logger.info(f"\n--- 模拟{page_type}表单提交 ---")
        
        try:
            # 首先获取页面内容分析表单
            response = self.session.get(url, timeout=self.config['timeout'])
            
            if response.status_code != 200:
                logger.error(f"❌ {page_type}页面访问失败")
                return False
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 查找登录表单
            forms = soup.find_all('form')
            login_form = None
            
            for form in forms:
                # 检查是否有用户名和密码输入框
                username_inputs = form.find_all('input', {'type': ['text', 'email']})
                password_inputs = form.find_all('input', {'type': 'password'})
                
                if username_inputs and password_inputs:
                    login_form = form
                    break
            
            if not login_form:
                logger.warning(f"⚠️ 未找到明显的登录表单")
                return False
            
            # 获取表单信息
            form_action = login_form.get('action', '')
            form_method = login_form.get('method', 'POST').upper()
            
            # 构建提交数据
            submit_data = {}
            for input_elem in login_form.find_all('input'):
                input_name = input_elem.get('name')
                input_type = input_elem.get('type', 'text')
                
                if input_name:
                    if input_type in ['text', 'email']:
                        submit_data[input_name] = username
                    elif input_type == 'password':
                        submit_data[input_name] = password
                    else:
                        # 对于隐藏字段等，使用默认值
                        submit_data[input_name] = input_elem.get('value', '')
            
            logger.info(f"   表单action: {form_action}")
            logger.info(f"   表单method: {form_method}")
            logger.info(f"   提交数据: {submit_data}")
            
            # 确定提交URL
            if form_action.startswith('http'):
                submit_url = form_action
            elif form_action.startswith('/'):
                submit_url = f"{self.config['user_web_url']}{form_action}"
            else:
                submit_url = f"{url}/{form_action}"
            
            # 模拟表单提交
            if form_method == 'GET':
                response = self.session.get(submit_url, params=submit_data, timeout=self.config['timeout'])
            else:
                response = self.session.post(submit_url, data=submit_data, timeout=self.config['timeout'])
            
            logger.info(f"   提交响应状态: {response.status_code}")
            logger.info(f"   提交后重定向URL: {response.url}")
            
            # 检查是否登录成功
            if response.status_code in [200, 302]:
                # 检查是否跳转到成功页面
                if '/dashboard' in response.url or '/chat' in response.url or '/admin' in response.url:
                    logger.info("✅ 表单提交可能成功（已跳转）")
                    return True
                else:
                    logger.info("⚠️ 表单提交但未跳转到成功页面")
                    return False
            else:
                logger.error("❌ 表单提交失败")
                return False
                
        except Exception as e:
            logger.error(f"❌ {page_type}表单提交失败: {e}")
            return False
    
    def run_comprehensive_test(self):
        """运行全面测试"""
        logger.info("🚀 开始智能网页登录分析...")
        logger.info("=" * 60)
        
        # 1. 使用正确密码测试API登录
        api_success = self.test_api_login_with_correct_password()
        
        # 2. 分析网页交互逻辑
        page_analysis_success = self.analyze_web_page_interaction()
        
        # 3. 模拟表单提交
        form_success = self.simulate_form_submission()
        
        # 汇总结果
        logger.info("\n" + "=" * 60)
        logger.info("📊 智能分析结果汇总:")
        logger.info(f"   API登录测试: {'✅ 成功' if api_success else '❌ 失败'}")
        logger.info(f"   页面分析: {'✅ 成功' if page_analysis_success else '❌ 失败'}")
        logger.info(f"   表单提交: {'✅ 成功' if form_success else '❌ 失败'}")
        
        if api_success:
            logger.info("\n🎉 API登录功能正常")
            logger.info("💡 如果网页端仍有问题，可能是:")
            logger.info("   1. 前端JavaScript代码问题")
            logger.info("   2. 前端路由配置问题")
            logger.info("   3. 前端表单提交逻辑问题")
            logger.info("   4. 前端框架事件绑定问题")
        else:
            logger.info("\n⚠️ API登录存在问题")
            logger.info("🔧 需要进一步排查后端服务")
        
        return api_success

def main():
    """主函数"""
    print("智能网页登录分析程序")
    print("=" * 60)
    print("此程序将通过多种方式分析网页登录功能")
    print("=" * 60)
    
    try:
        test = SmartWebLoginTest()
        success = test.run_comprehensive_test()
        
        if success:
            print("\n🎊 智能分析完成！")
            print("📋 详细分析结果已记录在日志中")
        else:
            print("\n💡 发现问题，请查看日志进行修复")
            
    except Exception as e:
        print(f"\n❌ 分析程序启动失败: {e}")

if __name__ == "__main__":
    main()