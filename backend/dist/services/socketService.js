"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const modelService_1 = require("./modelService");
const prisma = new client_1.PrismaClient();
class SocketService {
    constructor(server) {
        this.connectedUsers = new Map(); // userId -> socketId
        const origins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:11004,http://localhost:11010')
            .split(',')
            .map((s) => s.trim());
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: origins,
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('认证令牌缺失'));
                }
                if (!process.env.JWT_SECRET) {
                    return next(new Error('服务未安全配置'));
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                if (!decoded.userId || !decoded.username) {
                    return next(new Error('认证令牌数据不完整'));
                }
                // 验证用户是否存在
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId }
                });
                if (!user) {
                    return next(new Error('用户不存在'));
                }
                socket.userId = decoded.userId;
                socket.username = decoded.username;
                next();
            }
            catch (error) {
                if (error.name === 'TokenExpiredError') {
                    next(new Error('认证令牌已过期'));
                }
                else if (error.name === 'JsonWebTokenError') {
                    next(new Error('认证令牌无效'));
                }
                else {
                    next(new Error('认证失败'));
                }
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`用户 ${socket.username} 已连接: ${socket.id}`);
            if (socket.userId) {
                this.connectedUsers.set(socket.userId, socket.id);
                socket.join(`user_${socket.userId}`);
            }
            // 加入会话房间
            socket.on('join_conversation', (conversationId) => {
                if (!socket.userId)
                    return;
                socket.join(`conversation_${conversationId}`);
                console.log(`用户 ${socket.username} 加入会话 ${conversationId}`);
            });
            // 离开会话房间
            socket.on('leave_conversation', (conversationId) => {
                if (!socket.userId)
                    return;
                socket.leave(`conversation_${conversationId}`);
                console.log(`用户 ${socket.username} 离开会话 ${conversationId}`);
            });
            // 发送消息
            socket.on('send_message', async (data) => {
                if (!socket.userId || !socket.username)
                    return;
                try {
                    const { conversationId, content, messageType = 'text' } = data;
                    // 验证会话存在且用户有权限
                    const conversation = await prisma.conversation.findFirst({
                        where: {
                            id: conversationId,
                            userId: socket.userId
                        }
                    });
                    if (!conversation) {
                        socket.emit('error', { message: '会话不存在或无权限' });
                        return;
                    }
                    // 创建用户消息
                    const userMessage = await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'user',
                            content,
                            status: 'sent',
                            createdAt: new Date()
                        },
                        select: {
                            id: true,
                            conversationId: true,
                            role: true,
                            content: true,
                            status: true,
                            createdAt: true
                        }
                    });
                    const activeModel = await prisma.modelConfig.findFirst({ where: { enabled: true }, orderBy: { updatedAt: 'desc' }, select: { memoryEnabled: true, contextLength: true } });
                    let messages;
                    if (!activeModel || !activeModel.memoryEnabled) {
                        messages = [{ role: 'user', content }];
                    }
                    else {
                        const history = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, select: { role: true, content: true } });
                        let total = 0;
                        const picked = [];
                        for (let i = history.length - 1; i >= 0; i--) {
                            const h = history[i];
                            const len = h.content.length;
                            if (total + len > (activeModel.contextLength || 4096))
                                break;
                            picked.unshift({ role: h.role, content: h.content });
                            total += len;
                        }
                        messages = picked.concat([{ role: 'user', content }]);
                    }
                    const ai = await (0, modelService_1.invokeModel)(messages);
                    const aiMessage = await prisma.message.create({
                        data: {
                            conversationId,
                            role: 'assistant',
                            content: ai.content,
                            status: 'sent',
                            createdAt: new Date(),
                            promptTokens: ai.promptTokens,
                            completionTokens: ai.completionTokens,
                            totalTokens: ai.totalTokens,
                        },
                        select: {
                            id: true,
                            conversationId: true,
                            role: true,
                            content: true,
                            status: true,
                            createdAt: true,
                            promptTokens: true,
                            completionTokens: true,
                            totalTokens: true,
                        }
                    });
                    // 更新会话时间
                    await prisma.conversation.update({
                        where: { id: conversationId },
                        data: { updatedAt: new Date() }
                    });
                    // 向会话中的所有用户广播消息
                    this.io.to(`conversation_${conversationId}`).emit('new_message', {
                        id: userMessage.id,
                        conversationId: userMessage.conversationId,
                        role: 'user',
                        senderId: socket.userId,
                        content: userMessage.content,
                        messageType: messageType,
                        createdAt: userMessage.createdAt,
                        sender: {
                            id: socket.userId,
                            username: socket.username
                        }
                    });
                    // 广播AI回复
                    setTimeout(() => {
                        this.io.to(`conversation_${conversationId}`).emit('new_message', {
                            id: aiMessage.id,
                            conversationId: aiMessage.conversationId,
                            role: 'assistant',
                            senderId: 'ai',
                            content: aiMessage.content,
                            messageType: 'text',
                            createdAt: aiMessage.createdAt,
                            sender: {
                                id: 'ai',
                                username: 'AI助手'
                            }
                        });
                    }, 1000);
                }
                catch (error) {
                    console.error('发送消息错误:', error);
                    socket.emit('error', { message: '发送消息失败' });
                }
            });
            // 输入状态
            socket.on('typing_start', (data) => {
                if (!socket.userId)
                    return;
                socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
                    userId: socket.userId,
                    username: socket.username,
                    conversationId: data.conversationId,
                    isTyping: true
                });
            });
            socket.on('typing_stop', (data) => {
                if (!socket.userId)
                    return;
                socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
                    userId: socket.userId,
                    username: socket.username,
                    conversationId: data.conversationId,
                    isTyping: false
                });
            });
            // 消息已读
            socket.on('mark_as_read', async (data) => {
                if (!socket.userId)
                    return;
                try {
                    // 更新消息状态为已读
                    await prisma.message.updateMany({
                        where: {
                            id: { in: data.messageIds },
                            conversationId: data.conversationId,
                            role: 'assistant' // 只能标记AI消息为已读
                        },
                        data: { status: 'read' }
                    });
                    // 通知发送者消息已读（这里简化处理，只通知会话所有者）
                    const conversation = await prisma.conversation.findFirst({
                        where: {
                            id: data.conversationId,
                            userId: socket.userId
                        }
                    });
                    if (conversation) {
                        this.io.to(`user_${socket.userId}`).emit('messages_read', {
                            conversationId: data.conversationId,
                            messageIds: data.messageIds,
                            readBy: socket.userId
                        });
                    }
                }
                catch (error) {
                    console.error('标记已读错误:', error);
                    socket.emit('error', { message: '标记已读失败' });
                }
            });
            // 断开连接
            socket.on('disconnect', () => {
                console.log(`用户 ${socket.username} 已断开连接: ${socket.id}`);
                if (socket.userId) {
                    this.connectedUsers.delete(socket.userId);
                }
            });
        });
    }
    // 向特定用户发送消息
    sendToUser(userId, event, data) {
        this.io.to(`user_${userId}`).emit(event, data);
    }
    // 向特定会话发送消息
    sendToConversation(conversationId, event, data) {
        this.io.to(`conversation_${conversationId}`).emit(event, data);
    }
    // 广播给所有连接的用户
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    // 获取在线用户数
    getOnlineUserCount() {
        return this.connectedUsers.size;
    }
    // 获取在线用户列表
    getOnlineUsers() {
        return Array.from(this.connectedUsers.keys());
    }
}
exports.SocketService = SocketService;
