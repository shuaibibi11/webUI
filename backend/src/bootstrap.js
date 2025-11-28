#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('Generating Prisma client...');
try {
  // 生成 Prisma 客户端
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../')
  });
  
  console.log('Prisma client generated successfully!');
  
  // 启动服务器
  console.log('Starting server...');
  require('./server.js');
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
