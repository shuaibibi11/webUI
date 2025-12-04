const axios = require('axios');

// 测试管理端登录API
async function testAdminLogin() {
  try {
    console.log('=== 测试管理端登录API ===');
    
    const response = await axios.post('http://localhost:11025/admin/auth/login', {
      username: 'admin',
      password: 'Abcdef1!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 管理端登录API测试成功');
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 检查响应结构
    if (response.data.code === 200 && response.data.token) {
      console.log('✅ Token获取成功');
      return response.data.token;
    } else {
      console.log('❌ Token获取失败');
      return null;
    }
  } catch (error) {
    console.log('❌ 管理端登录API测试失败');
    if (error.response) {
      console.log('HTTP状态码:', error.response.status);
      console.log('错误响应:', error.response.data);
    } else {
      console.log('错误信息:', error.message);
    }
    return null;
  }
}

// 测试前端代理配置
async function testFrontendProxy() {
  try {
    console.log('\n=== 测试前端代理配置 ===');
    
    const response = await axios.post('http://localhost:13085/api/admin/auth/login', {
      username: 'admin',
      password: 'Abcdef1!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 前端代理配置测试成功');
    console.log('响应状态码:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ 前端代理配置测试失败');
    if (error.response) {
      console.log('HTTP状态码:', error.response.status);
      console.log('错误响应:', error.response.data);
    } else {
      console.log('错误信息:', error.message);
    }
    return null;
  }
}

// 主测试函数
async function main() {
  console.log('开始测试登录流程...\n');
  
  // 测试管理端API
  const token = await testAdminLogin();
  
  // 测试前端代理
  await testFrontendProxy();
  
  console.log('\n=== 测试总结 ===');
  if (token) {
    console.log('✅ 管理端登录API工作正常');
    console.log('✅ Token生成成功');
  } else {
    console.log('❌ 管理端登录API存在问题');
  }
  
  console.log('\n前端开发服务器运行在: http://localhost:13085');
  console.log('管理端API运行在: http://localhost:11025');
  console.log('用户端API运行在: http://localhost:11031');
}

// 运行测试
main().catch(console.error);