#!/usr/bin/env python3
"""
MySQL数据库数据填充脚本
向MySQL数据库添加完整的测试数据，包括用户、模型配置、工作流配置、日志记录等
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# API配置
ADMIN_API_BASE = "http://localhost:11025/api/admin"
USER_API_BASE = "http://localhost:11031/api/users"

# 管理员凭据
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Abcdef1!"

# 全局变量存储token
admin_token = None

def login_admin():
    """管理员登录"""
    global admin_token
    
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{USER_API_BASE}/login", 
                               json=login_data,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                admin_token = result.get("token")
                print("✅ 管理员登录成功")
                return True
            else:
                print(f"❌ 登录失败: {result.get('message', '未知错误')}")
                return False
        else:
            print(f"❌ 登录请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 登录异常: {e}")
        return False

def make_admin_request(method, endpoint, data=None):
    """发送管理员API请求"""
    if not admin_token:
        print("❌ 请先登录管理员账号")
        return None
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    try:
        if method.upper() == "GET":
            response = requests.get(f"{ADMIN_API_BASE}{endpoint}", headers=headers)
        elif method.upper() == "POST":
            response = requests.post(f"{ADMIN_API_BASE}{endpoint}", 
                                   json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(f"{ADMIN_API_BASE}{endpoint}", 
                                  json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(f"{ADMIN_API_BASE}{endpoint}", headers=headers)
        else:
            print(f"❌ 不支持的HTTP方法: {method}")
            return None
        
        return response
    except Exception as e:
        print(f"❌ API请求异常: {e}")
        return None

def create_test_users():
    """创建测试用户"""
    test_users = [
        {
            "username": "testuser1",
            "password": "Test123456!",
            "email": "test1@example.com",
            "phone": "13800138001",
            "realName": "测试用户一",
            "idCard": "110101199001011235"
        },
        {
            "username": "testuser2", 
            "password": "Test123456!",
            "email": "test2@example.com",
            "phone": "13800138002",
            "realName": "测试用户二",
            "idCard": "110101199001011236"
        },
        {
            "username": "developer1",
            "password": "Dev123456!",
            "email": "dev1@example.com",
            "phone": "13800138003",
            "realName": "开发人员一",
            "idCard": "110101199001011237"
        },
        {
            "username": "operator1",
            "password": "Op123456!",
            "email": "op1@example.com",
            "phone": "13800138004",
            "realName": "运营人员一",
            "idCard": "110101199001011238"
        }
    ]
    
    created_count = 0
    for user_data in test_users:
        response = requests.post(f"{USER_API_BASE}/register", 
                               json=user_data,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code in [200, 201]:
            result = response.json()
            if result.get("code") in [200, 201]:
                print(f"✅ 创建用户 {user_data['username']} 成功")
                created_count += 1
            else:
                print(f"⚠️ 用户 {user_data['username']} 可能已存在: {result.get('message', '未知错误')}")
        else:
            print(f"❌ 创建用户 {user_data['username']} 失败: {response.status_code}")
    
    return created_count

def create_model_configs():
    """创建模型配置"""
    model_configs = [
        {
            "name": "GPT-4 Turbo",
            "modelId": "gpt-4-turbo-preview",
            "description": "OpenAI最新GPT-4 Turbo模型",
            "provider": "OpenAI",
            "apiKey": "sk-your-openai-key-here",
            "baseUrl": "https://api.openai.com/v1",
            "enabled": True,
            "maxTokens": 4096,
            "temperature": 0.7,
            "timeout": 30
        },
        {
            "name": "Claude 3 Opus",
            "modelId": "claude-3-opus-20240229",
            "description": "Anthropic Claude 3 Opus模型",
            "provider": "Anthropic",
            "apiKey": "your-anthropic-key-here",
            "baseUrl": "https://api.anthropic.com",
            "enabled": True,
            "maxTokens": 4096,
            "temperature": 0.7,
            "timeout": 60
        },
        {
            "name": "Gemini Pro",
            "modelId": "gemini-pro",
            "description": "Google Gemini Pro模型",
            "provider": "Google",
            "apiKey": "your-google-key-here",
            "baseUrl": "https://generativelanguage.googleapis.com",
            "enabled": True,
            "maxTokens": 2048,
            "temperature": 0.8,
            "timeout": 45
        }
    ]
    
    created_count = 0
    for model_data in model_configs:
        response = make_admin_request("POST", "/models", model_data)
        
        if response and response.status_code in [200, 201]:
            result = response.json()
            if result.get("code") in [200, 201]:
                print(f"✅ 创建模型配置 {model_data['name']} 成功")
                created_count += 1
            else:
                print(f"❌ 创建模型配置 {model_data['name']} 失败: {result.get('message', '未知错误')}")
        else:
            print(f"❌ 创建模型配置 {model_data['name']} 失败")
    
    return created_count

def create_workflow_configs():
    """创建工作流配置"""
    workflow_configs = [
        {
            "name": "智能客服工作流",
            "workflowId": "customer-service-workflow",
            "description": "用于处理客户咨询的智能客服工作流",
            "endpoint": "http://192.168.3.52:3001/api/v1/workflows/execute",
            "apiKey": "your-api-key-here",
            "enabled": True,
            "configJson": '{"timeout": 30, "retry": 3}'
        },
        {
            "name": "文档处理工作流",
            "workflowId": "document-processing-workflow",
            "description": "用于处理文档分析和提取的工作流",
            "endpoint": "http://192.168.3.52:3001/api/v1/workflows/execute",
            "apiKey": "your-api-key-here",
            "enabled": True,
            "configJson": '{"maxFileSize": 10485760, "supportedFormats": ["pdf", "docx", "txt"]}'
        },
        {
            "name": "数据分析工作流",
            "workflowId": "data-analysis-workflow",
            "description": "用于数据分析和报告生成的工作流",
            "endpoint": "http://192.168.3.52:3001/api/v1/workflows/execute",
            "apiKey": "your-api-key-here",
            "enabled": False,
            "configJson": '{"batchSize": 100, "concurrency": 5}'
        }
    ]
    
    created_count = 0
    for workflow_data in workflow_configs:
        response = make_admin_request("POST", "/workflows", workflow_data)
        
        if response and response.status_code in [200, 201]:
            result = response.json()
            if result.get("code") in [200, 201]:
                print(f"✅ 创建工作流配置 {workflow_data['name']} 成功")
                created_count += 1
            else:
                print(f"❌ 创建工作流配置 {workflow_data['name']} 失败: {result.get('message', '未知错误')}")
        else:
            print(f"❌ 创建工作流配置 {workflow_data['name']} 失败")
    
    return created_count

def create_sample_logs():
    """创建示例日志记录"""
    # 这里模拟一些日志记录，实际日志应该由系统自动生成
    print("📝 日志系统已准备就绪，系统运行时会自动生成日志记录")
    return True

def verify_data():
    """验证数据创建结果"""
    print("\n🔍 验证数据创建结果...")
    
    # 验证用户数据
    response = make_admin_request("GET", "/users")
    if response and response.status_code == 200:
        result = response.json()
        user_count = len(result.get("data", {}).get("users", []))
        print(f"👥 用户数量: {user_count}")
    
    # 验证模型配置
    response = make_admin_request("GET", "/models")
    if response and response.status_code == 200:
        result = response.json()
        model_count = len(result.get("data", {}).get("models", []))
        print(f"🤖 模型配置数量: {model_count}")
    
    # 验证工作流配置
    response = make_admin_request("GET", "/workflows")
    if response and response.status_code == 200:
        result = response.json()
        workflow_count = len(result.get("data", {}).get("workflows", []))
        print(f"⚙️ 工作流配置数量: {workflow_count}")
    
    # 验证日志记录
    response = make_admin_request("GET", "/logs")
    if response and response.status_code == 200:
        result = response.json()
        log_count = result.get("data", {}).get("pagination", {}).get("total", 0)
        print(f"📊 日志记录数量: {log_count}")

def main():
    """主函数"""
    print("🚀 开始向MySQL数据库填充测试数据...")
    print("=" * 60)
    
    # 1. 管理员登录
    if not login_admin():
        print("❌ 管理员登录失败，无法继续执行")
        return
    
    # 2. 创建测试用户
    print("\n👥 创建测试用户...")
    user_count = create_test_users()
    print(f"✅ 成功创建 {user_count} 个测试用户")
    
    # 3. 创建模型配置
    print("\n🤖 创建模型配置...")
    model_count = create_model_configs()
    print(f"✅ 成功创建 {model_count} 个模型配置")
    
    # 4. 创建工作流配置
    print("\n⚙️ 创建工作流配置...")
    workflow_count = create_workflow_configs()
    print(f"✅ 成功创建 {workflow_count} 个工作流配置")
    
    # 5. 准备日志系统
    print("\n📝 准备日志系统...")
    create_sample_logs()
    
    # 6. 验证数据
    print("\n🔍 验证数据创建结果...")
    verify_data()
    
    print("\n" + "=" * 60)
    print("🎊 MySQL数据库数据填充完成！")
    print("📊 数据统计:")
    print(f"   ✅ 测试用户: {user_count} 个")
    print(f"   ✅ 模型配置: {model_count} 个")
    print(f"   ✅ 工作流配置: {workflow_count} 个")
    print("")
    print("🌐 管理后台访问地址:")
    print("   http://localhost:3000")
    print("")
    print("🔑 管理员登录信息:")
    print(f"   用户名: {ADMIN_USERNAME}")
    print(f"   密码: {ADMIN_PASSWORD}")

if __name__ == "__main__":
    main()