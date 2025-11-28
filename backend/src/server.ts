import dotenv from 'dotenv';
// 先加载环境变量，避免其他模块在导入时读取到空的 env
dotenv.config();
import app from './app';
import { createServer } from 'http';
import { SocketService } from './services/socketService';

const PORT = process.env.PORT || 3003;

// 创建HTTP服务器
const server = createServer(app);

// 初始化Socket.io服务
const socketService = new SocketService(server);

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket服务已启动`);
});
