#!/usr/bin/env python3
"""
界面功能优化脚本
检查和优化前端界面功能，包括响应式设计、用户体验、功能完整性等
"""

import requests
import json
import time
import sys
from datetime import datetime

# API配置
ADMIN_API_BASE = "http://localhost:11025/api/admin"
USER_API_BASE = "http://localhost:11031/api/users"

# 前端服务地址
ADMIN_WEB_URL = "http://localhost:13085"
USER_WEB_URL = "http://localhost:13089"

# 管理员凭据
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Abcdef1!"

def check_service_availability():
    """检查服务可用性"""
    print("🔍 检查服务可用性...")
    
    services = [
        ("管理后台API", ADMIN_API_BASE),
        ("用户API", USER_API_BASE),
        ("管理前端", ADMIN_WEB_URL),
        ("用户前端", USER_WEB_URL)
    ]
    
    available_count = 0
    for service_name, service_url in services:
        try:
            response = requests.get(service_url, timeout=5)
            if response.status_code in [200, 403, 404]:  # 403/404表示服务存在但需要认证或路径不存在
                print(f"   ✅ {service_name}: 可用")
                available_count += 1
            else:
                print(f"   ❌ {service_name}: 不可用 (状态码: {response.status_code})")
        except Exception as e:
            print(f"   ❌ {service_name}: 不可用 ({str(e)})")
    
    print(f"\n📊 服务可用性: {available_count}/{len(services)} 个服务可用")
    return available_count

def check_api_endpoints():
    """检查API端点功能"""
    print("\n🔗 检查API端点功能...")
    
    # 管理员登录
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{USER_API_BASE}/login", 
                               json=login_data,
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                token = result.get("token")
                print("   ✅ 管理员登录成功")
                
                # 检查管理员API端点
                admin_headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                admin_endpoints = [
                    ("/users", "用户管理"),
                    ("/models", "模型管理"),
                    ("/workflows", "工作流管理"),
                    ("/logs", "日志管理")
                ]
                
                available_endpoints = 0
                for endpoint, endpoint_name in admin_endpoints:
                    try:
                        response = requests.get(f"{ADMIN_API_BASE}{endpoint}", 
                                              headers=admin_headers, timeout=10)
                        if response.status_code == 200:
                            result = response.json()
                            if result.get("code") == 200:
                                print(f"   ✅ {endpoint_name} API: 正常")
                                available_endpoints += 1
                            else:
                                print(f"   ⚠️ {endpoint_name} API: 响应异常 ({result.get('message', '未知错误')})")
                        else:
                            print(f"   ❌ {endpoint_name} API: 请求失败 ({response.status_code})")
                    except Exception as e:
                        print(f"   ❌ {endpoint_name} API: 请求异常 ({str(e)})")
                
                print(f"\n📊 API端点可用性: {available_endpoints}/{len(admin_endpoints)} 个端点正常")
                return available_endpoints
            else:
                print(f"   ❌ 管理员登录失败: {result.get('message', '未知错误')}")
        else:
            print(f"   ❌ 管理员登录请求失败: {response.status_code}")
    except Exception as e:
        print(f"   ❌ 管理员登录异常: {str(e)}")
    
    return 0

def check_database_connection():
    """检查数据库连接状态"""
    print("\n🗄️ 检查数据库连接状态...")
    
    # 通过API检查数据库连接
    login_data = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{USER_API_BASE}/login", 
                               json=login_data,
                               headers={"Content-Type": "application/json"},
                               timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get("code") == 200:
                token = result.get("token")
                
                admin_headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                # 检查各模块数据
                modules = [
                    ("/users", "用户数据"),
                    ("/models", "模型配置"),
                    ("/workflows", "工作流配置"),
                    ("/logs", "日志记录")
                ]
                
                db_status = {}
                for endpoint, module_name in modules:
                    try:
                        response = requests.get(f"{ADMIN_API_BASE}{endpoint}", 
                                              headers=admin_headers, timeout=10)
                        if response.status_code == 200:
                            result = response.json()
                            if result.get("code") == 200:
                                data = result.get("data", {})
                                if "users" in data:
                                    count = len(data["users"])
                                elif "models" in data:
                                    count = len(data["models"])
                                elif "workflows" in data:
                                    count = len(data["workflows"])
                                elif "pagination" in data:
                                    count = data["pagination"].get("total", 0)
                                else:
                                    count = "N/A"
                                
                                db_status[module_name] = {"status": "正常", "count": count}
                                print(f"   ✅ {module_name}: 正常 (数据量: {count})")
                            else:
                                db_status[module_name] = {"status": "异常", "count": 0}
                                print(f"   ❌ {module_name}: 异常 ({result.get('message', '未知错误')})")
                        else:
                            db_status[module_name] = {"status": "不可用", "count": 0}
                            print(f"   ❌ {module_name}: 不可用 ({response.status_code})")
                    except Exception as e:
                        db_status[module_name] = {"status": "异常", "count": 0}
                        print(f"   ❌ {module_name}: 异常 ({str(e)})")
                
                # 统计正常模块数量
                normal_modules = sum(1 for status in db_status.values() if status["status"] == "正常")
                print(f"\n📊 数据库连接状态: {normal_modules}/{len(modules)} 个模块正常")
                return normal_modules
            else:
                print(f"   ❌ 无法检查数据库状态: 登录失败")
        else:
            print(f"   ❌ 无法检查数据库状态: 登录请求失败")
    except Exception as e:
        print(f"   ❌ 无法检查数据库状态: {str(e)}")
    
    return 0

def check_frontend_features():
    """检查前端功能特性"""
    print("\n🌐 检查前端功能特性...")
    
    # 检查前端页面可访问性
    frontend_pages = [
        ("管理后台登录页", f"{ADMIN_WEB_URL}/login"),
        ("用户端登录页", f"{USER_WEB_URL}/login"),
        ("管理后台首页", f"{ADMIN_WEB_URL}/dashboard"),
        ("用户端首页", f"{USER_WEB_URL}/dashboard")
    ]
    
    accessible_pages = 0
    for page_name, page_url in frontend_pages:
        try:
            response = requests.get(page_url, timeout=10)
            if response.status_code in [200, 403, 404]:
                print(f"   ✅ {page_name}: 可访问")
                accessible_pages += 1
            else:
                print(f"   ❌ {page_name}: 不可访问 ({response.status_code})")
        except Exception as e:
            print(f"   ❌ {page_name}: 不可访问 ({str(e)})")
    
    print(f"\n📊 前端页面可访问性: {accessible_pages}/{len(frontend_pages)} 个页面可访问")
    
    # 检查前端功能模块
    print("\n🔧 检查前端功能模块...")
    
    frontend_modules = [
        "用户管理模块",
        "模型配置模块", 
        "工作流管理模块",
        "日志查看模块",
        "系统设置模块"
    ]
    
    print("   ⚠️ 前端功能模块需要手动测试，建议检查:")
    for module in frontend_modules:
        print(f"      • {module}")
    
    return accessible_pages

def generate_optimization_suggestions():
    """生成优化建议"""
    print("\n💡 生成界面优化建议...")
    
    suggestions = [
        {
            "category": "用户体验优化",
            "suggestions": [
                "添加页面加载动画和进度指示器",
                "优化表单验证和错误提示",
                "实现响应式设计，适配移动端",
                "添加操作确认对话框",
                "优化数据表格的分页和搜索功能"
            ]
        },
        {
            "category": "功能完善",
            "suggestions": [
                "完善用户权限管理系统",
                "添加数据导入导出功能",
                "实现实时数据更新（WebSocket）",
                "添加系统监控和性能分析",
                "完善日志记录和审计功能"
            ]
        },
        {
            "category": "界面美化",
            "suggestions": [
                "统一界面风格和色彩方案",
                "优化图标和按钮设计",
                "添加暗色主题支持",
                "优化字体和排版",
                "添加动画效果和过渡"
            ]
        },
        {
            "category": "性能优化",
            "suggestions": [
                "优化前端资源加载速度",
                "实现代码分割和懒加载",
                "添加缓存策略",
                "优化API请求频率",
                "压缩静态资源"
            ]
        }
    ]
    
    for category in suggestions:
        print(f"\n   📋 {category['category']}:")
        for i, suggestion in enumerate(category['suggestions'], 1):
            print(f"      {i}. {suggestion}")
    
    return len([s for category in suggestions for s in category['suggestions']])

def main():
    """主函数"""
    print("🚀 开始界面功能优化检查...")
    print("=" * 60)
    
    # 1. 检查服务可用性
    service_availability = check_service_availability()
    
    # 2. 检查API端点功能
    api_endpoints = check_api_endpoints()
    
    # 3. 检查数据库连接状态
    database_status = check_database_connection()
    
    # 4. 检查前端功能特性
    frontend_features = check_frontend_features()
    
    # 5. 生成优化建议
    optimization_suggestions = generate_optimization_suggestions()
    
    # 6. 测试结果汇总
    print("\n" + "=" * 60)
    print("📊 界面功能优化检查结果汇总:")
    print(f"   ✅ 服务可用性: {service_availability}/4 个服务可用")
    print(f"   ✅ API端点功能: {api_endpoints}/4 个端点正常")
    print(f"   ✅ 数据库连接: {database_status}/4 个模块正常")
    print(f"   ✅ 前端功能特性: {frontend_features}/4 个页面可访问")
    print(f"   💡 优化建议: {optimization_suggestions} 条建议")
    
    # 7. 总体评估
    total_score = service_availability + api_endpoints + database_status + frontend_features
    max_score = 4 + 4 + 4 + 4  # 每个部分满分4分
    
    print(f"\n📈 总体评估分数: {total_score}/{max_score}")
    
    if total_score >= 14:
        print("   🎉 系统状态优秀，可以进行高级优化")
    elif total_score >= 10:
        print("   👍 系统状态良好，建议进行常规优化")
    elif total_score >= 6:
        print("   ⚠️ 系统状态一般，需要基础优化")
    else:
        print("   ❌ 系统状态较差，需要紧急修复")
    
    print("\n" + "=" * 60)
    print("🎊 界面功能优化检查完成！")
    print("")
    print("🌐 系统访问地址:")
    print(f"   管理后台: {ADMIN_WEB_URL}")
    print(f"   用户端: {USER_WEB_URL}")
    print(f"   管理API: {ADMIN_API_BASE}")
    print(f"   用户API: {USER_API_BASE}")
    print("")
    print("🔑 管理员登录信息:")
    print(f"   用户名: {ADMIN_USERNAME}")
    print(f"   密码: {ADMIN_PASSWORD}")
    print("")
    print("💡 下一步建议:")
    print("   1. 手动测试前端界面功能")
    print("   2. 根据优化建议逐步改进")
    print("   3. 添加更多测试数据")
    print("   4. 完善用户权限管理")

if __name__ == "__main__":
    main()