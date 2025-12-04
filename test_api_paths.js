const axios = require('axios');

// 测试前端API调用路径
async function testAPIPaths() {
  console.log('=== 测试前端API调用路径 ===\n');
  
  const baseURL = 'http://localhost:13085';
  
  // 测试不同的API路径
  const testPaths = [
    { path: '/api/admin/users', description: '用户列表API (通过/api/admin)' },
    { path: '/api/admin/models', description: '模型列表API (通过/api/admin)' },
    { path: '/api/admin/stats', description: '统计数据API (通过/api/admin)' },
    { path: '/api/admin/workflows', description: '工作流列表API (通过/api/admin)' },
    { path: '/api/admin/conversations', description: '对话列表API (通过/api/admin)' },
    { path: '/api/admin/logs', description: '日志列表API (通过/api/admin)' },
    { path: '/admin/users', description: '用户列表API (直接/admin)' },
    { path: '/admin/models', description: '模型列表API (直接/admin)' },
    { path: '/admin/stats', description: '统计数据API (直接/admin)' }
  ];
  
  for (const test of testPaths) {
    console.log(`${test.description}...`);
    try {
      const response = await axios.get(`${baseURL}${test.path}`, {
        validateStatus: () => true // 不抛出错误
      });
      console.log(`   状态码: ${response.status}`);
      console.log(`   响应类型: ${response.headers['content-type']}`);
      
      if (response.status === 200) {
        console.log(`   ✓ 代理配置正确`);
      } else if (response.status === 404) {
        console.log(`   ✗ 后端接口不存在`);
      } else {
        console.log(`   ? 其他错误`);
      }
    } catch (error) {
      console.log(`   错误: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('=== 测试完成 ===');
  console.log('\n说明:');
  console.log('- 状态码200: 代理配置正确，请求已转发到后端');
  console.log('- 状态码404: 后端接口不存在或路径错误');
  console.log('- 状态码其他: 网络或代理配置问题');
}

// 运行测试
testAPIPaths().catch(console.error);