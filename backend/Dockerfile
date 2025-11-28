# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖
RUN npm install

# 复制Prisma配置和源代码
COPY prisma ./prisma
COPY . .

# 生成Prisma Client
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/chatbot
RUN npx prisma generate

# 构建TypeScript代码
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装生产依赖
RUN npm install --only=production

# 复制生成的Prisma客户端和构建产物
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/start.sh ./start.sh

# 给启动脚本添加执行权限
RUN chmod +x ./start.sh

# 暴露端口
EXPOSE 3001

# 启动应用 - 使用shell脚本生成Prisma客户端并启动服务
CMD ["./start.sh"]