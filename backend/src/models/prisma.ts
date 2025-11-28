// 延迟加载 PrismaClient，确保在使用前已经生成
let prismaClient: any = null;

export const getPrismaClient = () => {
  if (!prismaClient) {
    const { PrismaClient } = require('@prisma/client');
    prismaClient = new PrismaClient();
  }
  return prismaClient;
};

// 导出一个代理对象，在访问时自动初始化
const proxyHandler = {
  get: (target: any, prop: string) => {
    const client = getPrismaClient();
    return client[prop];
  }
};

export const prisma = new Proxy({}, proxyHandler);