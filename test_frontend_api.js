// 前端API调用验证测试脚本
const axios = require('axios');

// 测试管理端登录API
async function testAdminLoginAPI() {
    try {
        console.log('=== 测试管理端登录API ===');
        
        const response = await axios.post('http://localhost:11025/api/admin/auth/login', {
            username: 'admin',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 管理端登录API调用成功');
        console.log('状态码:', response.status);
        console.log('响应数据:', response.data);
        
        return true;
    } catch (error) {
        console.log('❌ 管理端登录API调用失败');
        if (error.response) {
            console.log('状态码:', error.response.status);
            console.log('错误信息:', error.response.data);
        } else {
            console.log('错误信息:', error.message);
        }
        return false;
    }
}

// 测试前端代理配置
async function testFrontendProxy() {
    try {
        console.log('\n=== 测试前端代理配置 ===');
        
        // 测试通过前端代理访问管理端API
        const response = await axios.post('http://localhost:13085/api/admin/auth/login', {
            username: 'admin',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 前端代理配置正确');
        console.log('状态码:', response.status);
        console.log('响应数据:', response.data);
        
        return true;
    } catch (error) {
        console.log('❌ 前端代理配置可能有问题');
        if (error.response) {
            console.log('状态码:', error.response.status);
            console.log('错误信息:', error.response.data);
        } else {
            console.log('错误信息:', error.message);
        }
        return false;
    }
}

// 测试用户端登录API（作为对比）
async function testUserLoginAPI() {
    try {
        console.log('\n=== 测试用户端登录API ===');
        
        const response = await axios.post('http://localhost:11031/api/users/login', {
            username: 'admin',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 用户端登录API调用成功');
        console.log('状态码:', response.status);
        console.log('响应数据:', response.data);
        
        return true;
    } catch (error) {
        console.log('❌ 用户端登录API调用失败');
        if (error.response) {
            console.log('状态码:', error.response.status);
            console.log('错误信息:', error.response.data);
        } else {
            console.log('错误信息:', error.message);
        }
        return false;
    }
}

// 运行测试
async function runTests() {
    console.log('开始前端API调用验证测试...\n');
    
    const adminAPISuccess = await testAdminLoginAPI();
    const proxySuccess = await testFrontendProxy();
    const userAPISuccess = await testUserLoginAPI();
    
    console.log('\n=== 测试结果汇总 ===');
    console.log('管理端API直接调用:', adminAPISuccess ? '✅ 通过' : '❌ 失败');
    console.log('前端代理配置测试:', proxySuccess ? '✅ 通过' : '❌ 失败');
    console.log('用户端API直接调用:', userAPISuccess ? '✅ 通过' : '❌ 失败');
    
    if (adminAPISuccess && proxySuccess) {
        console.log('\n🎉 前端API调用逻辑验证通过！');
        console.log('前端登录功能应该能正常工作。');
    } else {
        console.log('\n⚠️ 前端API调用逻辑存在问题，需要进一步调试。');
    }
}

runTests().catch(console.error);