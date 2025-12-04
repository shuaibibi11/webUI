const axios = require('axios');

// 测试前端API调用路径
async function testFrontendAPIs() {
  console.log('=== 测试前端API调用路径 ===\n');
  
  const baseURL = 'http://localhost:13085';
  
  // 测试用户列表API
  console.log('1. 测试用户列表API...');
  try {
    const response = await axios.get(`${baseURL}/admin/users`, {
      validateStatus: () => true // 不抛出错误
    });
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应类型: ${response.headers['content-type']}`);
    console.log(`   代理配置: ${response.status === 200 ? '✓ 正常工作' : '✗ 配置错误'}`);
  } catch (error) {
    console.log(`   错误: ${error.message}`);
  }
  
  console.log('\n2. 测试模型列表API...');
  try {
    const response = await axios.get(`${baseURL}/admin/models`, {
      validateStatus: () => true
    });
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应类型: ${response.headers['content-type']}`);
    console.log(`   代理配置: ${response.status === 200 ? '✓ 正常工作' : '✗ 配置错误'}`);
  } catch (error) {
    console.log(`   错误: ${error.message}`);
  }
  
  console.log('\n3. 测试统计数据API...');
  try {
    const response = await axios.get(`${baseURL}/admin/stats`, {
      validateStatus: () => true
    });
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应类型: ${response.headers['content-type']}`);
    console.log(`   代理配置: ${response.status === 200 ? '✓ 正常工作' : '✗ 配置错误'}`);
  } catch (error) {
    console.log(`   错误: ${error.message}`);
  }
  
  console.log('\n4. 测试工作流列表API...');
  try {
    const response = await axios.get(`${baseURL}/admin/workflows`, {
      validateStatus: () => true
    });
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应类型: ${response.headers['content-type']}`);
    console.log(`   代理配置: ${response.status === 200 ? '✓ 正常工作' : '✗ 配置错误'}`);
  } catch (error) {
    console.log(`   错误: ${error.message}`);
  }
  
  console.log('\n5. 测试对话列表API...');
  try {
    const response = await axios.get(`${baseURL}/admin/conversations`, {
      validateStatus: () => true
    });
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应类型: ${response.headers['content-type']}`);
    console.log(`   代理配置: ${response.status === 200 ? '✓ 正常工作' : '✗ 配置错误'}`);
  } catch (error) {
    console.log(`   错误: ${error.message}`);
  }
  
  console.log('\n6. 测试日志列表API...');
  try {
    const response = await axios.get(`${baseURL}/admin/logs`, {
      validateStatus: () => true
    });
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应类型: ${response.headers['content-type']}`);
    console.log(`   代理配置: ${response.status === 200 ? '✓ 正常工作' : '✗ 配置错误'}`);
  } catch (error) {
    console.log(`   错误: ${error.message}`);
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('\n说明:');
  console.log('- 状态码200: 代理配置正确，请求已转发到后端');
  console.log('- 状态码404: 后端接口不存在或路径错误');
  console.log('- 状态码其他: 网络或代理配置问题');
}

// 运行测试
testFrontendAPIs().catch(console.error);