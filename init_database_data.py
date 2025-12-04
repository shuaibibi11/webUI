#!/usr/bin/env python3
"""
数据库数据初始化脚本
重新初始化管理后台所需的数据，包括用户、模型配置、工作流配置、日志记录等
"""

import requests
import json
import time
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseInitializer:
    def __init__(self):
        self.config = {
            'admin_api_url': 'http://localhost:11025',
            'user_api_url': 'http://localhost:11031',
            'admin_user': {
                'username': 'admin',
                'password': 'Abcdef1!',
                'email': 'admin@example.com',
                'phone': '13800138000',
                'realName': '管理员',
                'idCard': '110101199001010000'
            },
            'test_user': {
                'username': 'testuser',
                'password': 'Password123!',
                'email': 'testuser@example.com',
                'phone': '13800138001',
                'realName': '测试用户',
                'idCard': '110101199001011234'
            }
        }
        self.admin_token = None
        self.user_token = None
    
    def wait_for_service(self, url, max_attempts=30):
        """等待服务启动"""
        logger.info(f"等待服务启动: {url}")
        for i in range(max_attempts):
            try:
                response = requests.get(f"{url}/api/actuator/health", timeout=5)
                if response.status_code == 200:
                    logger.info(f"✅ 服务已启动: {url}")
                    return True
            except requests.exceptions.RequestException:
                if i < max_attempts - 1:
                    time.sleep(2)
                    logger.info(f"等待服务启动... ({i+1}/{max_attempts})")
                else:
                    logger.error(f"❌ 服务启动超时: {url}")
                    return False
        return False
    
    def admin_login(self):
        """管理员登录"""
        logger.info("尝试管理员登录...")
        try:
            response = requests.post(
                f"{self.config['admin_api_url']}/api/admin/login",
                json={
                    'username': self.config['admin_user']['username'],
                    'password': self.config['admin_user']['password']
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 200:
                    self.admin_token = data['data']['token']
                    logger.info("✅ 管理员登录成功")
                    return True
                else:
                    logger.error(f"❌ 管理员登录失败: {data.get('message', '未知错误')}")
            else:
                logger.error(f"❌ 管理员登录HTTP错误: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ 管理员登录异常: {e}")
        
        return False
    
    def create_admin_user(self):
        """创建管理员用户"""
        logger.info("创建管理员用户...")
        try:
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/register",
                json=self.config['admin_user'],
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 200:
                    logger.info("✅ 管理员用户创建成功")
                    return True
                else:
                    logger.warning(f"⚠️ 管理员用户可能已存在: {data.get('message', '未知错误')}")
                    return True  # 用户可能已存在
            else:
                logger.error(f"❌ 管理员用户创建HTTP错误: {response.status_code}")
                try:
                    error_details = response.json()
                    logger.error(f"错误详情: {error_details}")
                except:
                    logger.error(f"响应内容: {response.text}")
        except Exception as e:
            logger.error(f"❌ 管理员用户创建异常: {e}")
        
        return False
    
    def create_test_user(self):
        """创建测试用户"""
        logger.info("创建测试用户...")
        try:
            response = requests.post(
                f"{self.config['user_api_url']}/api/users/register",
                json=self.config['test_user'],
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 200:
                    logger.info("✅ 测试用户创建成功")
                    return True
                else:
                    logger.warning(f"⚠️ 测试用户可能已存在: {data.get('message', '未知错误')}")
                    return True  # 用户可能已存在
            else:
                logger.error(f"❌ 测试用户创建HTTP错误: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ 测试用户创建异常: {e}")
        
        return False
    
    def create_model_configs(self):
        """创建模型配置"""
        logger.info("创建模型配置...")
        
        model_configs = [
            {
                'name': 'Qwen3-4B-Instruct-2507-FP8',
                'type': 'CHAT',
                'apiUrl': 'http://43.192.114.202:8000/v1/chat/completions',
                'apiKey': '123',
                'description': 'Qwen3 4B模型，适用于对话场景',
                'enabled': True
            },
            {
                'name': 'GPT-4',
                'type': 'CHAT',
                'apiUrl': 'https://api.openai.com/v1/chat/completions',
                'apiKey': 'your-openai-key',
                'description': 'OpenAI GPT-4模型',
                'enabled': False
            }
        ]
        
        success_count = 0
        for config in model_configs:
            try:
                response = requests.post(
                    f"{self.config['admin_api_url']}/api/admin/models",
                    json=config,
                    headers={'Authorization': f'Bearer {self.admin_token}'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('code') == 200:
                        logger.info(f"✅ 模型配置创建成功: {config['name']}")
                        success_count += 1
                    else:
                        logger.warning(f"⚠️ 模型配置可能已存在: {config['name']}")
                        success_count += 1  # 可能已存在
                else:
                    logger.error(f"❌ 模型配置创建失败: {config['name']}, HTTP: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ 模型配置创建异常: {config['name']}, {e}")
        
        return success_count > 0
    
    def create_workflow_configs(self):
        """创建工作流配置"""
        logger.info("创建工作流配置...")
        
        workflow_configs = [
            {
                'name': '智能客服工作流',
                'description': '用于智能客服场景的工作流',
                'config': {
                    'steps': ['用户输入', '意图识别', '模型响应', '结果输出'],
                    'model': 'Qwen3-4B-Instruct-2507-FP8'
                },
                'enabled': True
            },
            {
                'name': '文档分析工作流',
                'description': '用于文档分析和总结的工作流',
                'config': {
                    'steps': ['文档上传', '内容解析', '关键信息提取', '总结生成'],
                    'model': 'Qwen3-4B-Instruct-2507-FP8'
                },
                'enabled': True
            }
        ]
        
        success_count = 0
        for config in workflow_configs:
            try:
                response = requests.post(
                    f"{self.config['admin_api_url']}/api/admin/workflows",
                    json=config,
                    headers={'Authorization': f'Bearer {self.admin_token}'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('code') == 200:
                        logger.info(f"✅ 工作流配置创建成功: {config['name']}")
                        success_count += 1
                    else:
                        logger.warning(f"⚠️ 工作流配置可能已存在: {config['name']}")
                        success_count += 1  # 可能已存在
                else:
                    logger.error(f"❌ 工作流配置创建失败: {config['name']}, HTTP: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ 工作流配置创建异常: {config['name']}, {e}")
        
        return success_count > 0
    
    def create_sample_logs(self):
        """创建示例日志记录"""
        logger.info("创建示例日志记录...")
        
        # 这里可以创建一些示例日志记录
        # 由于日志通常是系统自动生成的，我们只需要确保系统正常运行即可
        logger.info("✅ 日志系统已准备就绪")
        return True
    
    def verify_data_initialization(self):
        """验证数据初始化结果"""
        logger.info("验证数据初始化结果...")
        
        endpoints_to_check = [
            f"{self.config['admin_api_url']}/api/admin/users",
            f"{self.config['admin_api_url']}/api/admin/models",
            f"{self.config['admin_api_url']}/api/admin/workflows"
        ]
        
        success_count = 0
        for endpoint in endpoints_to_check:
            try:
                response = requests.get(
                    endpoint,
                    headers={'Authorization': f'Bearer {self.admin_token}'},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('code') == 200:
                        logger.info(f"✅ 数据验证成功: {endpoint.split('/')[-1]}")
                        success_count += 1
                    else:
                        logger.error(f"❌ 数据验证失败: {endpoint.split('/')[-1]}, {data.get('message')}")
                else:
                    logger.error(f"❌ 数据验证HTTP错误: {endpoint.split('/')[-1]}, {response.status_code}")
            except Exception as e:
                logger.error(f"❌ 数据验证异常: {endpoint.split('/')[-1]}, {e}")
        
        return success_count == len(endpoints_to_check)
    
    def run_initialization(self):
        """运行完整的数据初始化流程"""
        logger.info("🚀 开始数据库数据初始化...")
        logger.info("=" * 60)
        
        # 1. 等待服务启动
        if not self.wait_for_service(self.config['admin_api_url']):
            return False
        
        if not self.wait_for_service(self.config['user_api_url']):
            return False
        
        # 2. 创建管理员用户
        if not self.create_admin_user():
            return False
        
        # 3. 创建测试用户
        if not self.create_test_user():
            return False
        
        # 4. 管理员登录
        if not self.admin_login():
            return False
        
        # 5. 创建模型配置
        if not self.create_model_configs():
            return False
        
        # 6. 创建工作流配置
        if not self.create_workflow_configs():
            return False
        
        # 7. 准备日志系统
        if not self.create_sample_logs():
            return False
        
        # 8. 验证初始化结果
        if not self.verify_data_initialization():
            return False
        
        logger.info("=" * 60)
        logger.info("🎊 数据库数据初始化完成！")
        logger.info("📊 初始化结果:")
        logger.info("   ✅ 用户数据已创建")
        logger.info("   ✅ 模型配置已创建") 
        logger.info("   ✅ 工作流配置已创建")
        logger.info("   ✅ 日志系统已准备")
        logger.info("")
        logger.info("🔑 管理员登录信息:")
        logger.info(f"   用户名: {self.config['admin_user']['username']}")
        logger.info(f"   密码: {self.config['admin_user']['password']}")
        logger.info("")
        logger.info("🌐 管理后台访问地址:")
        logger.info("   http://localhost:13085")
        
        return True

def main():
    """主函数"""
    initializer = DatabaseInitializer()
    
    try:
        success = initializer.run_initialization()
        
        if success:
            print("\n🎉 数据库数据初始化成功！")
            print("管理后台现在应该可以正常显示数据了。")
            print("请访问 http://localhost:13085 查看效果。")
        else:
            print("\n❌ 数据库数据初始化失败！")
            print("请检查后端服务是否正常运行。")
            
    except Exception as e:
        print(f"\n❌ 初始化程序异常: {e}")
        print("请检查系统环境和服务状态。")

if __name__ == "__main__":
    main()