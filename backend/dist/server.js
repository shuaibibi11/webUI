"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// 先加载环境变量，避免其他模块在导入时读取到空的 env
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const http_1 = require("http");
const socketService_1 = require("./services/socketService");
const PORT = process.env.PORT || 3003;
// 创建HTTP服务器
const server = (0, http_1.createServer)(app_1.default);
// 初始化Socket.io服务
const socketService = new socketService_1.SocketService(server);
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`WebSocket服务已启动`);
});
