"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.getPrismaClient = void 0;
// 延迟加载 PrismaClient，确保在使用前已经生成
let prismaClient = null;
const getPrismaClient = () => {
    if (!prismaClient) {
        const { PrismaClient } = require('@prisma/client');
        prismaClient = new PrismaClient();
    }
    return prismaClient;
};
exports.getPrismaClient = getPrismaClient;
// 导出一个代理对象，在访问时自动初始化
const proxyHandler = {
    get: (target, prop) => {
        const client = (0, exports.getPrismaClient)();
        return client[prop];
    }
};
exports.prisma = new Proxy({}, proxyHandler);
