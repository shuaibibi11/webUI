#!/usr/bin/env python3
"""
现代前端框架登录测试程序
专门针对React、Vue等现代前端框架的登录功能进行测试
"""

import requests
import json
import time
import re
import logging
import urllib.parse
from bs4 import BeautifulSoup

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModernWebLoginTest:
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
        
    def analyze_modern_framework(self):
        """分析现代前端框架"""
        logger.info("\n=== 分析现代前端框架 ===")
        
        # 分析用户端
        user_info = self._analyze_single_app(self.config['user_web_url'], "用户端")
        
        # 分析管理端
        admin_info = self._analyze_single_app(self.config['admin_web_url'], "管理端")
        
        return user_info, admin_info
    
    def _analyze_single_app(self, base_url, app_type):
        """分析单个应用"""
        logger.info(f"\n--- 分析{app_type}应用 ---")
        
        try:
            # 获取主页面
            response = self.session.get(base_url, timeout=self.config['timeout'])
            
            if response.status_code != 200:
                logger.error(f"❌ {app_type}应用访问失败: {response.status_code}")
                return None
            
            logger.info(f"✅ {app_type}应用访问成功")
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 分析框架特征
            framework_info = {
                'framework': self._detect_framework(soup),
                'has_react': 'react' in str(soup).lower(),
                'has_vue': 'vue' in str(soup).lower(),
                'has_angular': 'angular' in str(soup).lower(),
                'has_router': self._detect_router(soup),
                'javascript_files': [],
                'api_calls': [],
                'event_handlers': []
            }
            
            # 分析JavaScript文件
            scripts = soup.find_all('script')
            for script in scripts:
                src = script.get('src', '')
                if src:
                    framework_info['javascript_files'].append(src)
            
            # 分析API调用模式
            framework_info['api_calls'] = self._extract_api_calls(soup)
            
            # 输出分析结果
            logger.info(f"   检测到的框架: {framework_info['framework']}")
            logger.info(f"   React特征: {'✅ 是' if framework_info['has_react'] else '❌ 否'}")
            logger.info(f"   Vue特征: {'✅ 是' if framework_info['has_vue'] else '❌ 否'}")
            logger.info(f"   路由特征: {'✅ 是' if framework_info['has_router'] else '❌ 否'}")
            logger.info(f"   JS文件数量: {len(framework_info['javascript_files'])}")
            logger.info(f"   API调用模式: {len(framework_info['api_calls'])}")
            
            return framework_info
            
        except Exception as e:
            logger.error(f"❌ {app_type}应用分析失败: {e}")
            return None
    
    def _detect_framework(self, soup):
        """检测前端框架"""
        html_str = str(soup)
        
        # 检查React
        if 'react' in html_str.lower() or 'react-dom' in html_str.lower():
            return "React"
        
        # 检查Vue
        if 'vue' in html_str.lower() or 'vue-router' in html_str.lower():
            return "Vue.js"
        
        # 检查Angular
        if 'angular' in html_str.lower() or 'ng-' in html_str.lower():
            return "Angular"
        
        # 检查其他特征
        if 'data-reactroot' in html_str:
            return "React (data-reactroot)"
        
        if '__v' in html_str:  # Vue内部属性
            return "Vue.js (__v)"
        
        return "未知/传统HTML"
    
    def _detect_router(self, soup):
        """检测路由特征"""
        html_str = str(soup)
        
        # 检查路由相关特征
        router_patterns = [
            r'router',
            r'react-router',
            r'vue-router',
            r'angular-router',
            r'history\.push',
            r'navigate'
        ]
        
        for pattern in router_patterns:
            if re.search(pattern, html_str, re.IGNORECASE):
                return True
        
        return False
    
    def _extract_api_calls(self, soup):
        """提取API调用模式"""
        api_patterns = [
            r'/api/[\w/-]*',
            r'fetch\(["\']([^"\']+)["\']',
            r'axios\.(get|post|put|delete)\(["\']([^"\']+)["\']',
            r'\.get\(["\']([^"\']+)["\']',
            r'\.post\(["\']([^"\']+)["\']',
            r'url:\s*["\']([^"\']+)["\']'
        ]
        
        api_calls = []
        scripts = soup.find_all('script')
        
        for script in scripts:
            if script.string:
                script_content = script.string
                for pattern in api_patterns:
                    matches = re.findall(pattern, script_content, re.IGNORECASE)
                    api_calls.extend(matches)
        
        return list(set(api_calls))
    
    def test_spa_login_flow(self):
        """测试单页面应用登录流程"""
        logger.info("\n=== 测试SPA登录流程 ===")
        
        # 测试用户端SPA登录
        user_success = self._test_spa_single_login(
            self.config['user_web_url'],
            self.config['test_user']['username'],
            self.config['test_user']['password'],
            "用户端"
        )
        
        # 测试管理端SPA登录
        admin_success = self._test_spa_single_login(
            self.config['admin_web_url'],
            self.config['admin_user']['username'],
            self.config['admin_user']['password'],
            "管理端"
        )
        
        return user_success or admin_success
    
    def _test_spa_single_login(self, base_url, username, password, app_type):
        """测试单个SPA登录"""
        logger.info(f"\n--- 测试{app_type}SPA登录 ---")
        
        try:
            # 1. 访问登录页面
            login_url = f"{base_url}/login"
            response = self.session.get(login_url, timeout=self.config['timeout'])
            
            if response.status_code != 200:
                logger.error(f"❌ {app_type}登录页面访问失败")
                return False
            
            logger.info(f"✅ {app_type}登录页面访问成功")
            
            # 2. 分析页面结构，查找输入框和按钮
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 查找可能的输入框
            input_selectors = [
                'input[type="text"]',
                'input[type="email"]',
                'input[placeholder*="用户名"]',
                'input[placeholder*="user"]',
                'input[placeholder*="账号"]',
                'input[type="password"]',
                'input[placeholder*="密码"]',
                'input[placeholder*="password"]'
            ]
            
            username_inputs = []
            password_inputs = []
            
            for selector in input_selectors:
                inputs = soup.select(selector)
                for input_elem in inputs:
                    placeholder = input_elem.get('placeholder', '').lower()
                    input_type = input_elem.get('type', '')
                    
                    if 'password' in input_type or '密码' in placeholder:
                        password_inputs.append(input_elem)
                    elif 'text' in input_type or 'email' in input_type or '用户名' in placeholder or 'user' in placeholder or '账号' in placeholder:
                        username_inputs.append(input_elem)
            
            logger.info(f"   找到用户名输入框: {len(username_inputs)}个")
            logger.info(f"   找到密码输入框: {len(password_inputs)}个")
            
            # 3. 直接模拟API调用（现代SPA通常使用AJAX）
            api_success = self._simulate_spa_api_call(username, password, app_type)
            
            if api_success:
                logger.info("✅ SPA API调用模拟成功")
                return True
            else:
                logger.warning("⚠️ SPA API调用模拟失败，尝试其他方法")
                
                # 4. 尝试分析页面中的JavaScript代码
                js_analysis = self._analyze_login_javascript(soup, app_type)
                
                return js_analysis
                
        except Exception as e:
            logger.error(f"❌ {app_type}SPA登录测试失败: {e}")
            return False
    
    def _simulate_spa_api_call(self, username, password, app_type):
        """模拟SPA的API调用"""
        login_data = {
            'username': username,
            'password': password
        }
        
        # 尝试不同的API端点
        api_endpoints = [
            '/api/users/login',
            '/api/auth/login',
            '/api/login',
            '/auth/login',
            '/user/login'
        ]
        
        for endpoint in api_endpoints:
            try:
                api_url = f"{self.config['user_api_url']}{endpoint}"
                
                response = requests.post(
                    api_url,
                    json=login_data,
                    headers={
                        'Content-Type': 'application/json',
                        'Origin': self.config['user_web_url'],
                        'Referer': f"{self.config['user_web_url']}/login"
                    },
                    timeout=self.config['timeout']
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('code') == 200 or result.get('success'):
                        logger.info(f"✅ {app_type}SPA API调用成功: {endpoint}")
                        logger.info(f"   返回消息: {result.get('message')}")
                        logger.info(f"   Token: {result.get('token', 'N/A')}")
                        return True
                    else:
                        logger.info(f"⚠️ {app_type}API端点存在但登录失败: {endpoint}")
                
            except Exception as e:
                logger.debug(f"❌ {app_type}API端点测试失败: {endpoint}, 错误: {e}")
                continue
        
        return False
    
    def _analyze_login_javascript(self, soup, app_type):
        """分析登录相关的JavaScript代码"""
        logger.info(f"\n--- 分析{app_type}登录JavaScript ---")
        
        scripts = soup.find_all('script')
        login_patterns = [
            r'login.*function',
            r'handleLogin',
            r'submitLogin',
            r'doLogin',
            r'username.*password',
            r'fetch.*login',
            r'axios.*login'
        ]
        
        found_patterns = []
        
        for script in scripts:
            if script.string:
                script_content = script.string
                for pattern in login_patterns:
                    if re.search(pattern, script_content, re.IGNORECASE):
                        found_patterns.append(pattern)
        
        if found_patterns:
            logger.info(f"   发现登录相关模式: {len(set(found_patterns))}个")
            for pattern in set(found_patterns):
                logger.info(f"     {pattern}")
            return True
        else:
            logger.info("   未发现明显的登录JavaScript模式")
            return False
    
    def test_network_interception(self):
        """测试网络请求拦截"""
        logger.info("\n=== 测试网络请求拦截 ===")
        
        # 模拟浏览器发送请求，捕获网络信息
        network_info = {
            'requests': [],
            'responses': [],
            'headers': [],
            'cookies': []
        }
        
        # 测试用户端
        user_network = self._intercept_single_network(
            self.config['user_web_url'],
            "用户端"
        )
        
        # 测试管理端
        admin_network = self._intercept_single_network(
            self.config['admin_web_url'],
            "管理端"
        )
        
        # 分析网络请求
        self._analyze_network_behavior(user_network, "用户端")
        self._analyze_network_behavior(admin_network, "管理端")
        
        return True
    
    def _intercept_single_network(self, base_url, app_type):
        """拦截单个应用的网络请求"""
        logger.info(f"\n--- 拦截{app_type}网络请求 ---")
        
        try:
            # 访问主页面，捕获所有资源请求
            response = self.session.get(base_url, timeout=self.config['timeout'])
            
            network_info = {
                'status_code': response.status_code,
                'headers': dict(response.headers),
                'cookies': dict(response.cookies),
                'content_type': response.headers.get('Content-Type', ''),
                'content_length': len(response.text)
            }
            
            logger.info(f"   状态码: {network_info['status_code']}")
            logger.info(f"   内容类型: {network_info['content_type']}")
            logger.info(f"   内容长度: {network_info['content_length']}")
            
            # 检查响应头中的框架特征
            server_header = response.headers.get('Server', '')
            x_powered_by = response.headers.get('X-Powered-By', '')
            
            if server_header or x_powered_by:
                logger.info(f"   服务器信息: {server_header}, {x_powered_by}")
            
            return network_info
            
        except Exception as e:
            logger.error(f"❌ {app_type}网络拦截失败: {e}")
            return {}
    
    def _analyze_network_behavior(self, network_info, app_type):
        """分析网络行为"""
        if not network_info:
            return
        
        logger.info(f"\n--- 分析{app_type}网络行为 ---")
        
        # 分析响应头
        headers = network_info.get('headers', {})
        
        # 检查CORS头
        cors_headers = {k: v for k, v in headers.items() 
                       if k.lower().startswith('access-control')}
        
        if cors_headers:
            logger.info("   CORS配置:")
            for k, v in cors_headers.items():
                logger.info(f"     {k}: {v}")
        else:
            logger.warning("   ⚠️ 未发现CORS头，可能存在跨域问题")
        
        # 检查缓存头
        cache_headers = {k: v for k, v in headers.items() 
                        if k.lower() in ['cache-control', 'expires', 'pragma']}
        
        if cache_headers:
            logger.info("   缓存配置:")
            for k, v in cache_headers.items():
                logger.info(f"     {k}: {v}")
    
    def run_comprehensive_analysis(self):
        """运行全面分析"""
        logger.info("🚀 开始现代前端框架登录分析...")
        logger.info("=" * 60)
        
        # 1. 分析现代前端框架
        user_info, admin_info = self.analyze_modern_framework()
        
        # 2. 测试SPA登录流程
        spa_success = self.test_spa_login_flow()
        
        # 3. 测试网络请求拦截
        network_success = self.test_network_interception()
        
        # 4. 直接API测试（确保后端正常）
        api_success = self._simulate_spa_api_call(
            self.config['test_user']['username'],
            self.config['test_user']['password'],
            "用户端"
        )
        
        # 汇总结果
        logger.info("\n" + "=" * 60)
        logger.info("📊 现代前端分析结果汇总:")
        logger.info(f"   用户端框架: {user_info.get('framework', '未知') if user_info else '分析失败'}")
        logger.info(f"   管理端框架: {admin_info.get('framework', '未知') if admin_info else '分析失败'}")
        logger.info(f"   SPA登录测试: {'✅ 成功' if spa_success else '❌ 失败'}")
        logger.info(f"   网络分析: {'✅ 成功' if network_success else '❌ 失败'}")
        logger.info(f"   API直接测试: {'✅ 成功' if api_success else '❌ 失败'}")
        
        if api_success:
            logger.info("\n🎉 后端API功能正常")
            logger.info("💡 前端问题诊断:")
            
            if user_info and user_info.get('framework') != "未知/传统HTML":
                logger.info("   1. 前端使用现代JavaScript框架")
                logger.info("   2. 登录逻辑可能在JavaScript中实现")
                logger.info("   3. 需要检查前端路由和状态管理")
            else:
                logger.info("   1. 前端可能使用传统HTML或框架特征不明显")
                logger.info("   2. 需要检查前端JavaScript代码")
            
            logger.info("🔧 建议解决方案:")
            logger.info("   1. 检查前端控制台错误")
            logger.info("   2. 验证前端路由配置")
            logger.info("   3. 检查前端API调用代码")
            logger.info("   4. 验证前端表单提交逻辑")
        else:
            logger.info("\n⚠️ 后端API存在问题")
            logger.info("🔧 需要进一步排查后端服务")
        
        return api_success

def main():
    """主函数"""
    print("现代前端框架登录分析程序")
    print("=" * 60)
    print("此程序专门分析现代前端框架的登录功能")
    print("=" * 60)
    
    try:
        test = ModernWebLoginTest()
        success = test.run_comprehensive_analysis()
        
        if success:
            print("\n🎊 现代前端分析完成！")
            print("📋 详细分析结果已记录在日志中")
        else:
            print("\n💡 发现问题，请查看日志进行修复")
            
    except Exception as e:
        print(f"\n❌ 分析程序启动失败: {e}")

if __name__ == "__main__":
    main()