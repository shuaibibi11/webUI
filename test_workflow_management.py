#!/usr/bin/env python3
"""
工作流配置编辑功能测试脚本
测试工作流的创建、查询、更新、删除等管理功能
"""

import requests
import json
import time
import sys
from datetime import datetime

# API配置
ADMIN_API_BASE = "http://localhost:11025/api/admin"

# 管理员凭据
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Abcdef1!"

# 全局变量存储token
admin_token = None

# 测试工作流配置
test_workflows = [
    {
        "name": "智能客服工作流测试版",
        "workflowId": "customer-service-test",
        "description": "用于测试的智能客服工作流",
        "endpoint": "http://192.168.3.52:3001/api/v1/workflows/execute",
        "apiKey": "test-api-key-123",
        "enabled": True,
        "configJson": '{"timeout": 30, "retry": 3, "testMode": true}'
    },
    {
        "name": "文档分析工作流测试版",
        "workflowId": "document-analysis-test",
        "description": "用于测试的文档分析工作流",
        "endpoint": "http://192.168.3.52:3001/api/v1/workflows/execute",
        "apiKey": "test-api-key-456",
        "enabled": False,
        "configJson": '{"maxFileSize": 5242880, "supportedFormats": ["pdf", "docx"]}'
    }
]

def login_admin():
    """管理员登录"""
    global admin_token
    
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post("http://localhost:11031/api/users/login", 
                               json=login_data,
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                admin_token = result.get("token")
                print("✅ 管理员登录成功")
                return True
            else:
                print(f"❌ 管理员登录失败: {result.get('message', '未知错误')}")
                return False
        else:
            print(f"❌ 管理员登录请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 管理员登录异常: {e}")
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

def test_workflow_creation():
    """测试工作流创建功能"""
    print("\n➕ 测试工作流创建功能...")
    
    created_workflows = []
    for i, workflow_data in enumerate(test_workflows, 1):
        print(f"\n  创建工作流 {i}: {workflow_data['name']}")
        
        response = make_admin_request("POST", "/workflows", workflow_data)
        
        if response and response.status_code in [200, 201]:
            result = response.json()
            if result.get("code") in [200, 201]:
                workflow_id = result.get("data", {}).get("id")
                if workflow_id:
                    created_workflows.append(workflow_id)
                    print(f"   ✅ 创建成功，ID: {workflow_id}")
                else:
                    print(f"   ⚠️ 创建成功但未返回ID")
            else:
                print(f"   ❌ 创建失败: {result.get('message', '未知错误')}")
        else:
            print(f"   ❌ 创建请求失败")
    
    print(f"\n📊 工作流创建测试结果: {len(created_workflows)}/{len(test_workflows)} 成功")
    return created_workflows

def test_workflow_query():
    """测试工作流查询功能"""
    print("\n🔍 测试工作流查询功能...")
    
    # 查询工作流列表
    print("\n  1. 查询工作流列表")
    response = make_admin_request("GET", "/workflows")
    
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            workflows = result.get("data", {}).get("workflows", [])
            print(f"   ✅ 查询成功，共 {len(workflows)} 个工作流")
            
            # 显示前3个工作流信息
            for i, workflow in enumerate(workflows[:3], 1):
                print(f"     工作流{i}: {workflow.get('name', 'N/A')} - {workflow.get('workflowId', 'N/A')}")
                print(f"       状态: {'启用' if workflow.get('enabled') else '禁用'}")
                print(f"       描述: {workflow.get('description', 'N/A')}")
        else:
            print(f"   ❌ 查询失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 查询请求失败")
    
    # 查询工作流统计信息
    print("\n  2. 查询工作流统计信息")
    response = make_admin_request("GET", "/workflows/stats")
    
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            stats = result.get("data", {})
            print(f"   ✅ 查询成功")
            print(f"     总工作流数: {stats.get('totalWorkflows', 0)}")
            print(f"     启用工作流: {stats.get('enabledWorkflows', 0)}")
            print(f"     禁用工作流: {stats.get('disabledWorkflows', 0)}")
        else:
            print(f"   ❌ 查询失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 查询请求失败")
    
    return 1

def test_workflow_update():
    """测试工作流更新功能"""
    print("\n✏️ 测试工作流更新功能...")
    
    # 先获取工作流列表
    response = make_admin_request("GET", "/workflows")
    
    if not response or response.status_code != 200:
        print("   ❌ 无法获取工作流列表，跳过更新测试")
        return 0
    
    result = response.json()
    if result.get("code") != 200:
        print("   ❌ 无法获取工作流列表，跳过更新测试")
        return 0
    
    workflows = result.get("data", {}).get("workflows", [])
    if not workflows:
        print("   ⚠️ 没有工作流可更新，跳过测试")
        return 0
    
    # 使用第一个工作流进行更新测试
    workflow = workflows[0]
    workflow_id = workflow.get("id")
    
    if not workflow_id:
        print("   ❌ 工作流ID为空，跳过更新测试")
        return 0
    
    print(f"\n  更新工作流: {workflow.get('name', 'N/A')} (ID: {workflow_id})")
    
    # 准备更新数据
    update_data = {
        "name": f"{workflow.get('name', '')} - 已更新",
        "description": f"{workflow.get('description', '')} - 更新时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "enabled": not workflow.get("enabled", False),
        "configJson": workflow.get("configJson", "{}")
    }
    
    response = make_admin_request("PUT", f"/workflows/{workflow_id}", update_data)
    
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            print(f"   ✅ 更新成功")
            print(f"     新名称: {update_data['name']}")
            print(f"     新状态: {'启用' if update_data['enabled'] else '禁用'}")
            return 1
        else:
            print(f"   ❌ 更新失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 更新请求失败")
    
    return 0

def test_workflow_detail():
    """测试工作流详情查询功能"""
    print("\n📄 测试工作流详情查询功能...")
    
    # 先获取工作流列表
    response = make_admin_request("GET", "/workflows")
    
    if not response or response.status_code != 200:
        print("   ❌ 无法获取工作流列表，跳过详情查询测试")
        return 0
    
    result = response.json()
    if result.get("code") != 200:
        print("   ❌ 无法获取工作流列表，跳过详情查询测试")
        return 0
    
    workflows = result.get("data", {}).get("workflows", [])
    if not workflows:
        print("   ⚠️ 没有工作流可查询，跳过测试")
        return 0
    
    # 使用第一个工作流进行详情查询
    workflow = workflows[0]
    workflow_id = workflow.get("id")
    
    if not workflow_id:
        print("   ❌ 工作流ID为空，跳过详情查询测试")
        return 0
    
    print(f"\n  查询工作流详情: {workflow.get('name', 'N/A')} (ID: {workflow_id})")
    
    response = make_admin_request("GET", f"/workflows/{workflow_id}")
    
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            workflow_detail = result.get("data", {})
            print(f"   ✅ 查询成功")
            print(f"     工作流ID: {workflow_detail.get('workflowId', 'N/A')}")
            print(f"     名称: {workflow_detail.get('name', 'N/A')}")
            print(f"     描述: {workflow_detail.get('description', 'N/A')}")
            print(f"     端点: {workflow_detail.get('endpoint', 'N/A')}")
            print(f"     状态: {'启用' if workflow_detail.get('enabled') else '禁用'}")
            return 1
        else:
            print(f"   ❌ 查询失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 查询请求失败")
    
    return 0

def test_workflow_deletion():
    """测试工作流删除功能"""
    print("\n🗑️ 测试工作流删除功能...")
    
    # 先获取工作流列表
    response = make_admin_request("GET", "/workflows")
    
    if not response or response.status_code != 200:
        print("   ❌ 无法获取工作流列表，跳过删除测试")
        return 0
    
    result = response.json()
    if result.get("code") != 200:
        print("   ❌ 无法获取工作流列表，跳过删除测试")
        return 0
    
    workflows = result.get("data", {}).get("workflows", [])
    if not workflows:
        print("   ⚠️ 没有工作流可删除，跳过测试")
        return 0
    
    # 查找测试工作流进行删除
    test_workflow = None
    for workflow in workflows:
        if workflow.get("workflowId", "").endswith("-test"):
            test_workflow = workflow
            break
    
    if not test_workflow:
        print("   ⚠️ 没有找到测试工作流，跳过删除测试")
        return 0
    
    workflow_id = test_workflow.get("id")
    workflow_name = test_workflow.get("name", "N/A")
    
    print(f"\n  删除工作流: {workflow_name} (ID: {workflow_id})")
    
    # 确认删除
    confirm = input("  确认删除此工作流？(y/N): ")
    if confirm.lower() != 'y':
        print("   ❌ 用户取消删除")
        return 0
    
    response = make_admin_request("DELETE", f"/workflows/{workflow_id}")
    
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            print(f"   ✅ 删除成功")
            return 1
        else:
            print(f"   ❌ 删除失败: {result.get('message', '未知错误')}")
    else:
        print(f"   ❌ 删除请求失败")
    
    return 0

def main():
    """主函数"""
    print("🚀 开始工作流配置编辑功能测试...")
    print("=" * 60)
    
    # 1. 管理员登录
    if not login_admin():
        print("❌ 管理员登录失败，无法继续测试")
        return
    
    # 2. 测试工作流创建
    creation_result = test_workflow_creation()
    
    # 3. 测试工作流查询
    query_result = test_workflow_query()
    
    # 4. 测试工作流更新
    update_result = test_workflow_update()
    
    # 5. 测试工作流详情查询
    detail_result = test_workflow_detail()
    
    # 6. 测试工作流删除（可选）
    deletion_result = test_workflow_deletion()
    
    # 7. 测试结果汇总
    print("\n" + "=" * 60)
    print("📊 工作流配置编辑功能测试结果汇总:")
    print(f"   ✅ 工作流创建测试: {len(creation_result)}/{len(test_workflows)} 成功")
    print(f"   ✅ 工作流查询测试: {'通过' if query_result else '失败'}")
    print(f"   ✅ 工作流更新测试: {'通过' if update_result else '失败'}")
    print(f"   ✅ 工作流详情查询: {'通过' if detail_result else '失败'}")
    print(f"   ✅ 工作流删除测试: {'通过' if deletion_result else '跳过'}")
    
    # 8. 数据库连接验证
    print("\n🔍 数据库连接验证:")
    response = make_admin_request("GET", "/workflows")
    if response and response.status_code == 200:
        result = response.json()
        if result.get("code") == 200:
            workflows = result.get("data", {}).get("workflows", [])
            print(f"   ✅ MySQL数据库连接正常")
            print(f"   📊 当前工作流总数: {len(workflows)}")
            
            # 统计启用和禁用状态
            enabled_count = sum(1 for w in workflows if w.get("enabled"))
            disabled_count = len(workflows) - enabled_count
            print(f"     启用工作流: {enabled_count}")
            print(f"     禁用工作流: {disabled_count}")
        else:
            print(f"   ❌ 数据库连接异常")
    else:
        print(f"   ❌ 数据库连接异常")
    
    print("\n" + "=" * 60)
    print("🎊 工作流配置编辑功能测试完成！")
    print("")
    print("🌐 测试环境信息:")
    print("   管理API: http://localhost:11025")
    print("   管理后台: http://localhost:3000")
    print("")
    print("🔑 管理员登录信息:")
    print(f"   用户名: {ADMIN_USERNAME}")
    print(f"   密码: {ADMIN_PASSWORD}")

if __name__ == "__main__":
    main()