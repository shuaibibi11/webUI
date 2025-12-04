const axios = require('axios');

async function testLogin() {
    try {
        console.log('测试admin-api登录端点...');
        
        const response = await axios.post('http://localhost:11025/api/admin/auth/login', {
            username: 'admin',
            password: 'Abcdef1!'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:13085'
            },
            validateStatus: function (status) {
                return true; // 允许任何状态码，以便我们可以查看错误
            }
        });
        
        console.log('状态码:', response.status);
        console.log('响应头:', response.headers);
        console.log('响应数据:', response.data);
        
    } catch (error) {
        console.error('错误:', error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

testLogin();