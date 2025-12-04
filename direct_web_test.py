#!/usr/bin/env python3
"""
直接网页登录测试程序
通过HTTP请求直接模拟浏览器行为，分析页面内容和API调用
"""

import requests
import json
import time
from bs4 import BeautifulSoup
import re
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DirectWebLoginTest:
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
        self.session = requests.Session()
        
    def analyze_login_page(self, url, page_type="用户端"):
        """分析登录页面结构"""
        logger.info(f"\n=== 分析{page_type}登录页面 ===")
        
        try:
            response = self.session.get(url, timeout=self.config['timeout'])
            
            if response.status_code != 200:
                logger.error(f"❌ {page_type}页面访问失败: {response.status_code}")
                return None
            
            logger.info(f"✅ {page_type}页面访问成功")
            
            # 使用BeautifulSoup解析HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 分析页面标题
            title = soup.find('title')
            if title:
                logger.info(f"   页面标题: {title.text.strip()}")
            
            # 查找表单
            forms = soup.find_all('form')
            logger.info(f"   表单数量: {len(forms)}")
            
            for i, form in enumerate(forms):
                form_action = form.get('action', '')
                form_method = form.get('method', 'GET').upper()
                logger.info(f"   表单{i+1}: action={form_action}, method={form_method}")
                
                # 查找输入框
                inputs = form.find_all('input')
                for input_elem in inputs:
                    input_type = input_elem.get('type', 'text')
                    input_name = input_elem.get('name', '')
                    input_placeholder = input_elem.get('placeholder', '')
                    
                    if input_type in ['text', 'password', 'email']:
                        logger.info(f"     {input_type}输入框: name={input_name}, placeholder={input_placeholder}")
            
            # 查找JavaScript代码中的API调用
            scripts = soup.find_all('script')
            api_patterns = [
                r'/api/[\w/-]*',
                r'login.*url.*["\']([^"\']+)["\']',
                r'fetch.*["\']([^"\']+)["\']',
                r'axios.*["\']([^"\']+)["\']'
            ]
            
            api_endpoints = []
            for script in scripts:
                if script.string:
                    script_content = script.string
                    for pattern in api_patterns:
                        matches = re.findall(pattern, script_content, re.IGNORECASE)
                        api_endpoints.extend(matches)
            
            if api_endpoints:
                logger.info("   发现的API端点:")
                for endpoint in set(api_endpoints):
                    logger.info(f"     {endpoint}")
            
            # 返回页面内容用于进一步分析
            return {
                'html': response.text,
                'url': response.url,
                'headers': dict(response.headers)
            }
            
        except Exception as e:
            logger.error(f"❌ {page_type}页面分析失败: {e}")
            return None
    
    def test_api_login_directly(self, username, password, api_type="用户端"):
        """直接测试API登录"""
        logger.info(f"\n=== 直接测试{api_type}API登录 ===")
        
        login_data = {
            'username': username,
            'password': password
        }
        
        # 用户端和管理端都使用user-api进行登录
        api_url = self.config['user_api_url']
        
        try:
            response = requests.post(
                f"{api_url}/api/users/login",
                json=login_data,
                headers={
                    'Content-Type': 'application/json',
                    'Origin': self.config['user_web_url']  # 模拟浏览器Origin
                },
                timeout=self.config['timeout']
            )
            
            logger.info(f"HTTP状态码: {response.status_code}")
            logger.info(f"响应头: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get('code') == 200:
                    logger.info("✅ API登录成功")
                    logger.info(f"   返回消息: {result.get('message')}")
                    logger.info(f"   Token: {result.get('token', 'N/A')}")
                    
                    # 检查CORS头
                    cors_headers = {k: v for k, v in response.headers.items() 
                                  if k.lower() in ['access-control-allow-origin', 
                                                  'access-control-allow-credentials',
                                                  'access-control-allow-methods',
                                                  'access-control-allow-headers']}
                    if cors_headers:
                        logger.info("   CORS头信息:")
                        for k, v in cors_headers.items():
                            logger.info(f"     {k}: {v}")
                    
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
    
    def simulate_browser_behavior(self):
        """模拟浏览器完整行为"""
        logger.info("\n=== 模拟浏览器完整登录流程 ===")
        
        # 1. 分析用户端登录页面
        user_page = self.analyze_login_page(
            f"{self.config['user_web_url']}/login", 
            "用户端"
        )
        
        # 2. 分析管理端登录页面
        admin_page = self.analyze_login_page(
            f"{self.config['admin_web_url']}/login", 
            "管理端"
        )
        
        # 3. 直接测试API登录
        user_api_success = self.test_api_login_directly(
            self.config['test_user']['username'],
            self.config['test_user']['password'],
            "用户端"
        )
        
        admin_api_success = self.test_api_login_directly(
            self.config['admin_user']['username'],
            self.config['admin_user']['password'],
            "管理端"
        )
        
        # 4. 检查前端资源加载
        self.check_frontend_resources()
        
        return user_api_success and admin_api_success
    
    def check_frontend_resources(self):
        """检查前端资源加载情况"""
        logger.info("\n=== 检查前端资源加载 ===")
        
        resources_to_check = [
            ("用户端CSS", f"{self.config['user_web_url']}/assets/index.css"),
            ("用户端JS", f"{self.config['user_web_url']}/assets/index.js"),
            ("管理端CSS", f"{self.config['admin_web_url']}/assets/index.css"),
            ("管理端JS", f"{self.config['admin_web_url']}/assets/index.js")
        ]
        
        for resource_name, resource_url in resources_to_check:
            try:
                response = self.session.head(resource_url, timeout=5)
                if response.status_code == 200:
                    logger.info(f"✅ {resource_name}可正常加载")
                else:
                    logger.warning(f"⚠️ {resource_name}加载异常: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ {resource_name}加载失败: {e}")
    
    def test_cors_configuration(self):
        """测试CORS配置"""
        logger.info("\n=== 测试CORS配置 ===")
        
        origins_to_test = [
            self.config['user_web_url'],
            self.config['admin_web_url'],
            'http://localhost:13080',
            'http://localhost:13086'
        ]
        
        for origin in origins_to_test:
            try:
                response = requests.options(
                    f"{self.config['user_api_url']}/api/users/login",
                    headers={
                        'Origin': origin,
                        'Access-Control-Request-Method': 'POST',
                        'Access-Control-Request-Headers': 'Content-Type'
                    },
                    timeout=5
                )
                
                cors_header = response.headers.get('Access-Control-Allow-Origin', '')
                if cors_header in ['*', origin]:
                    logger.info(f"✅ CORS配置正确 - Origin: {origin}")
                else:
                    logger.warning(f"⚠️ CORS配置可能有问题 - Origin: {origin}, 允许的Origin: {cors_header}")
                    
            except Exception as e:
                logger.error(f"❌ CORS测试失败 - Origin: {origin}, 错误: {e}")
    
    def run_comprehensive_analysis(self):
        """运行全面分析"""
        logger.info("🚀 开始直接网页登录分析...")
        logger.info("=" * 60)
        
        # 测试CORS配置
        self.test_cors_configuration()
        
        # 模拟浏览器行为
        success = self.simulate_browser_behavior()
        
        # 汇总结果
        logger.info("\n" + "=" * 60)
        logger.info("📊 分析结果汇总:")
        
        if success:
            logger.info("🎉 API登录功能正常")
            logger.info("💡 如果网页端仍有问题，可能是:")
            logger.info("   1. 前端JavaScript代码问题")
            logger.info("   2. 前端路由配置问题")
            logger.info("   3. 前端表单提交逻辑问题")
        else:
            logger.info("⚠️ API登录存在问题")
            logger.info("🔧 需要进一步排查后端服务")
        
        return success

def main():
    """主函数"""
    print("直接网页登录分析程序")
    print("=" * 60)
    print("此程序将通过HTTP请求直接分析网页登录功能")
    print("=" * 60)
    
    try:
        test = DirectWebLoginTest()
        success = test.run_comprehensive_analysis()
        
        if success:
            print("\n🎊 分析完成！")
            print("📋 详细分析结果已记录在日志中")
        else:
            print("\n💡 发现问题，请查看日志进行修复")
            
    except Exception as e:
        print(f"\n❌ 分析程序启动失败: {e}")

if __name__ == "__main__":
    main()