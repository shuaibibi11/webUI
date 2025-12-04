#!/usr/bin/env python3
"""
数据库数据填充脚本
通过管理后台API接口向数据库添加测试数据
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
    """管理员登录获取token"""
    global admin_token
    
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{USER_API_BASE}/login", json=login_data)
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                admin_token = result.get("token")
                print("✅ 管理员登录成功")
                return True
            else:
                print(f"❌ 登录失败: {result.get('error', '未知错误')}")
        else:
            print(f"❌ 登录请求失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 登录异常: {e}")
    
    return False

def make_admin_request(method, endpoint, data=None):
    """发送管理后台API请求"""
    if not admin_token:
        print("❌ 请先登录管理员账号")
        return None
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    url = f"{ADMIN_API_BASE}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            print(f"❌ 不支持的HTTP方法: {method}")
            return None
        
        return response
    except Exception as e:
        print(f"❌ API请求异常: {e}")
        return None

def create_test_users():
    """创建测试用户"""
    print("\n📝 创建测试用户...")
    
    test_users = [
        {
            "username": "testuser1",
            "phone": "13800138001",
            "email": "testuser1@example.com",
            "password": "Test123456!",
            "realName": "测试用户一",
            "idCard": "110101199001011234",
            "role": "USER",
            "status": "ACTIVE"
        },
        {
            "username": "testuser2", 
            "phone": "13800138002",
            "email": "testuser2@example.com",
            "password": "Test123456!",
            "realName": "测试用户二",
            "idCard": "110101199001012345",
            "role": "USER",
            "status": "PENDING"
        },
        {
            "username": "developer1",
            "phone": "13800138003",
            "email": "developer1@example.com",
            "password": "Dev123456!",
            "realName": "开发人员一",
            "idCard": "110101199001013456",
            "role": "DEVELOPER",
            "status": "ACTIVE"
        }
    ]
    
    created_count = 0
    
    for user_data in test_users:
        # 通过用户注册接口创建用户
        try:
            response = requests.post(f"{USER_API_BASE}/register", json=user_data)
            if response.status_code == 200:
                result = response.json()
                if result.get("code") == 200:
                    print(f"✅ 创建用户 {user_data['username']} 成功")
                    created_count += 1
                else:
                    print(f"⚠️ 用户 {user_data['username']} 可能已存在: {result.get('error', '未知错误')}")
            else:
                print(f"⚠️ 创建用户 {user_data['username']} 失败: {response.status_code}")
        except Exception as e:
            print(f"❌ 创建用户 {user_data['username']} 异常: {e}")
    
    print(f"📊 成功创建 {created_count} 个测试用户")
    return created_count

def create_model_configs():
    """创建模型配置"""
    print("\n🤖 创建模型配置...")
    
    model_configs = [
        {
            "provider": "OpenAI",
            "endpoint": "https://api.openai.com/v1/chat/completions",
            "modelName": "gpt-3.5-turbo",
            "tag": "chat",
            "protocol": "openai",
            "temperature": 0.7,
            "maxTokens": 4096,
            "topP": 0.9,
            "enabled": True
        },
        {
            "provider": "OpenAI",
            "endpoint": "https://api.openai.com/v1/chat/completions",
            "modelName": "gpt-4",
            "tag": "advanced-chat",
            "protocol": "openai",
            "temperature": 0.7,
            "maxTokens": 8192,
            "topP": 0.9,
            "enabled": True
        },
        {
            "provider": "Bisheng",
            "endpoint": "http://192.168.3.52:3001/api/v1/chat/completions",
            "modelName": "Qwen-7B-Chat",
            "tag": "local-chat",
            "protocol": "openai",
            "temperature": 0.8,
            "maxTokens": 4096,
            "topP": 0.95,
            "enabled": True
        },
        {
            "provider": "Azure",
            "endpoint": "https://your-resource.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completions",
            "modelName": "gpt-35-turbo",
            "tag": "azure-chat",
            "protocol": "azure",
            "temperature": 0.7,
            "maxTokens": 4096,
            "topP": 0.9,
            "enabled": False
        }
    ]
    
    created_count = 0
    
    for model_data in model_configs:
        response = make_admin_request("POST", "/models", model_data)
        if response and response.status_code == 201:
            print(f"✅ 创建模型 {model_data['provider']}/{model_data['modelName']} 成功")
            created_count += 1
        else:
            print(f"⚠️ 创建模型 {model_data['provider']}/{model_data['modelName']} 失败")
    
    print(f"📊 成功创建 {created_count} 个模型配置")
    return created_count

def create_workflow_configs():
    """创建工作流配置"""
    print("\n⚙️ 创建工作流配置...")
    
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
        if response and response.status_code == 201:
            print(f"✅ 创建工作流 {workflow_data['name']} 成功")
            created_count += 1
        else:
            print(f"⚠️ 创建工作流 {workflow_data['name']} 失败")
    
    print(f"📊 成功创建 {created_count} 个工作流配置")
    return created_count

def create_audit_logs():
    """创建审计日志"""
    print("\n📋 创建审计日志...")
    
    # 获取用户列表
    response = make_admin_request("GET", "/users")
    if not response or response.status_code != 200:
        print("❌ 无法获取用户列表，跳过创建审计日志")
        return 0
    
    users_data = response.json().get("data", {}).get("users", [])
    if not users_data:
        print("❌ 没有可用的用户数据，跳过创建审计日志")
        return 0
    
    # 模拟一些审计日志
    audit_actions = [
        "user_login", "user_logout", "model_create", "model_update", 
        "workflow_create", "conversation_create", "feedback_submit"
    ]
    
    # 由于审计日志通常由系统自动创建，我们通过模拟一些管理操作来生成日志
    print("📝 通过管理操作生成审计日志...")
    
    # 模拟一些用户状态变更操作
    for user in users_data[:3]:  # 只处理前3个用户
        user_id = user.get("id")
        username = user.get("username")
        
        if username == "admin":
            continue  # 跳过管理员
        
        # 模拟用户审批操作
        response = make_admin_request("PUT", f"/users/{user_id}/approve")
        if response and response.status_code == 200:
            print(f"✅ 审批用户 {username} 成功，生成审计日志")
        
        # 模拟用户状态更新
        update_data = {"status": "ACTIVE"}
        response = make_admin_request("PUT", f"/users/{user_id}", update_data)
        if response and response.status_code == 200:
            print(f"✅ 更新用户 {username} 状态成功，生成审计日志")
    
    print("📊 审计日志已通过系统操作自动生成")
    return len(audit_actions)

def verify_data():
    """验证数据是否成功创建"""
    print("\n🔍 验证数据创建结果...")
    
    endpoints_to_check = [
        ("/users", "用户数据"),
        ("/models", "模型配置"),
        ("/workflows", "工作流配置"),
        ("/logs", "审计日志")
    ]
    
    for endpoint, description in endpoints_to_check:
        response = make_admin_request("GET", endpoint)
        if response and response.status_code == 200:
            result = response.json()
            data = result.get("data", {})
            
            if "users" in data:
                count = len(data["users"])
                print(f"✅ {description}: {count} 条记录")
            elif "models" in data:
                count = len(data["models"])
                print(f"✅ {description}: {count} 条记录")
            elif "workflows" in data:
                count = len(data["workflows"])
                print(f"✅ {description}: {count} 条记录")
            elif "logs" in data:
                count = len(data["logs"])
                print(f"✅ {description}: {count} 条记录")
            else:
                print(f"⚠️ {description}: 数据结构异常")
        else:
            print(f"❌ 无法获取{description}")

def main():
    """主函数"""
    print("🚀 开始数据库数据填充...")
    
    # 检查服务是否可用
    print("🔍 检查服务状态...")
    try:
        # 检查管理后台API
        response = requests.get(f"{ADMIN_API_BASE}/users", timeout=5)
        if response.status_code == 401:  # 需要认证是正常的
            print("✅ 管理后台API服务正常")
        else:
            print("⚠️ 管理后台API响应异常")
    except:
        print("❌ 管理后台API服务不可用")
        return
    
    # 管理员登录
    if not login_admin():
        print("❌ 管理员登录失败，无法继续")
        return
    
    # 创建测试数据
    create_test_users()
    time.sleep(1)  # 短暂延迟确保数据同步
    
    create_model_configs()
    time.sleep(1)
    
    create_workflow_configs()
    time.sleep(1)
    
    create_audit_logs()
    time.sleep(1)
    
    # 验证数据
    verify_data()
    
    print("\n🎉 数据库数据填充完成！")
    print("📊 现在可以访问管理后台查看数据：http://localhost:13085/")

if __name__ == "__main__":
    main()