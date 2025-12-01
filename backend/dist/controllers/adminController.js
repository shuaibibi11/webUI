"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeedbackStatus = exports.getFeedbackList = exports.updateUserFields = exports.searchConversationMessagesAdmin = exports.getConversationMessagesAdmin = exports.getUserConversations = exports.getLogs = exports.adminResetPassword = exports.banUser = exports.deleteModel = exports.updateModel = exports.createModel = exports.getModels = exports.getUserStats = exports.deleteUser = exports.verifyUser = exports.getAllUsers = void 0;
const prisma_1 = require("../models/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
// 获取所有用户（管理员）
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma_1.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                phone: true,
                email: true,
                realName: true,
                idCard: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ users });
    }
    catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ error: '获取用户列表失败，请稍后重试' });
    }
};
exports.getAllUsers = getAllUsers;
// 审批用户（通过/拒绝）
const verifyUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { isVerified: Boolean(isVerified) },
            select: {
                id: true,
                username: true,
                phone: true,
                email: true,
                realName: true,
                idCard: true,
                isVerified: true,
                createdAt: true
            }
        });
        await prisma_1.prisma.auditLog.create({ data: { userId: id, action: Boolean(isVerified) ? 'user_verify' : 'user_unverify', ip: req.headers['x-forwarded-for'] || req.ip, details: Boolean(isVerified) ? '审批通过' : '审批取消' } });
        res.json({ message: isVerified ? '用户审批通过' : '用户审批已拒绝', user });
    }
    catch (error) {
        console.error('审批用户失败:', error);
        res.status(500).json({ error: '审批用户失败，请稍后重试' });
    }
};
exports.verifyUser = verifyUser;
// 删除用户
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.user.delete({
            where: { id }
        });
        res.json({ message: '用户删除成功' });
    }
    catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({ error: '删除用户失败，请稍后重试' });
    }
};
exports.deleteUser = deleteUser;
// 获取用户统计
const getUserStats = async (req, res) => {
    try {
        const totalUsers = await prisma_1.prisma.user.count();
        const verifiedUsers = await prisma_1.prisma.user.count({ where: { isVerified: true } });
        const unverifiedUsers = await prisma_1.prisma.user.count({ where: { isVerified: false } });
        res.json({
            totalUsers,
            verifiedUsers,
            unverifiedUsers
        });
    }
    catch (error) {
        console.error('获取用户统计失败:', error);
        res.status(500).json({ error: '获取用户统计失败，请稍后重试' });
    }
};
exports.getUserStats = getUserStats;
const getModels = async (req, res) => {
    try {
        const models = await prisma_1.prisma.modelConfig.findMany({ orderBy: { updatedAt: 'desc' } });
        res.json({ models });
    }
    catch (error) {
        console.error('获取模型配置失败:', error);
        res.status(500).json({ error: '获取模型配置失败' });
    }
};
exports.getModels = getModels;
const createModel = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { provider, endpoint, apiKey, modelName, tag, protocol, temperature, maxTokens, topP, contextLength, memoryEnabled, enabled } = req.body;
        const model = await prisma_1.prisma.modelConfig.create({
            data: { provider, endpoint, apiKey, modelName, tag, protocol, temperature, maxTokens, topP, contextLength, memoryEnabled, enabled, createdBy: userId }
        });
        await prisma_1.prisma.auditLog.create({ data: { userId: userId, action: 'model_create', ip: req.headers['x-forwarded-for'] || req.ip, details: `${provider}/${modelName}` } });
        res.status(201).json({ message: '模型创建成功', model });
    }
    catch (error) {
        console.error('创建模型失败:', error);
        res.status(500).json({ error: '创建模型失败' });
    }
};
exports.createModel = createModel;
const updateModel = async (req, res) => {
    try {
        const { id } = req.params;
        const { provider, endpoint, apiKey, modelName, tag, protocol, temperature, maxTokens, topP, contextLength, memoryEnabled, enabled } = req.body;
        const data = {};
        if (typeof provider !== 'undefined')
            data.provider = provider;
        if (typeof endpoint !== 'undefined')
            data.endpoint = endpoint;
        if (typeof apiKey !== 'undefined')
            data.apiKey = apiKey;
        if (typeof modelName !== 'undefined')
            data.modelName = modelName;
        if (typeof tag !== 'undefined')
            data.tag = tag;
        if (typeof protocol !== 'undefined')
            data.protocol = protocol;
        if (typeof temperature !== 'undefined')
            data.temperature = temperature;
        if (typeof maxTokens !== 'undefined')
            data.maxTokens = maxTokens;
        if (typeof topP !== 'undefined')
            data.topP = topP;
        if (typeof contextLength !== 'undefined')
            data.contextLength = contextLength;
        if (typeof memoryEnabled !== 'undefined')
            data.memoryEnabled = Boolean(memoryEnabled);
        if (typeof enabled !== 'undefined')
            data.enabled = enabled;
        const model = await prisma_1.prisma.modelConfig.update({ where: { id }, data });
        await prisma_1.prisma.auditLog.create({ data: { userId: req.user.userId, action: 'model_update', ip: req.headers['x-forwarded-for'] || req.ip, details: `${model.provider}/${model.modelName}` } });
        res.json({ message: '模型更新成功', model });
    }
    catch (error) {
        console.error('更新模型失败:', error);
        res.status(500).json({ error: '更新模型失败' });
    }
};
exports.updateModel = updateModel;
const deleteModel = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.modelConfig.delete({ where: { id } });
        await prisma_1.prisma.auditLog.create({ data: { userId: req.user.userId, action: 'model_delete', ip: req.headers['x-forwarded-for'] || req.ip, details: id } });
        res.json({ message: '模型删除成功' });
    }
    catch (error) {
        console.error('删除模型失败:', error);
        res.status(500).json({ error: '删除模型失败' });
    }
};
exports.deleteModel = deleteModel;
const banUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { banned } = req.body;
        const user = await prisma_1.prisma.user.update({ where: { id }, data: { banned: Boolean(banned) } });
        await prisma_1.prisma.auditLog.create({ data: { userId: id, action: banned ? 'ban' : 'unban', ip: req.headers['x-forwarded-for'] || req.ip, details: banned ? '封禁账号' : '解除封禁' } });
        res.json({ message: banned ? '用户已封禁' : '用户已解封', user });
    }
    catch (error) {
        console.error('封禁/解封失败:', error);
        res.status(500).json({ error: '操作失败' });
    }
};
exports.banUser = banUser;
const adminResetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        const hashed = await bcrypt_1.default.hash(newPassword, bcryptRounds);
        const user = await prisma_1.prisma.user.update({ where: { id }, data: { password: hashed } });
        await prisma_1.prisma.auditLog.create({ data: { userId: req.user.userId, action: 'admin_reset_password', ip: req.headers['x-forwarded-for'] || req.ip, details: `reset:${id}` } });
        res.json({ message: '密码已重置', user: { id: user.id, username: user.username } });
    }
    catch (error) {
        console.error('管理员重置密码失败:', error);
        res.status(500).json({ error: '管理员重置密码失败' });
    }
};
exports.adminResetPassword = adminResetPassword;
const getLogs = async (req, res) => {
    try {
        const q = req.query.q || '';
        const logs = await prisma_1.prisma.auditLog.findMany({
            where: q ? { OR: [{ action: { contains: q } }, { ip: { contains: q } }] } : {},
            orderBy: { createdAt: 'desc' },
            take: 200
        });
        res.json({ logs });
    }
    catch (error) {
        console.error('获取日志失败:', error);
        res.status(500).json({ error: '获取日志失败' });
    }
};
exports.getLogs = getLogs;
const getUserConversations = async (req, res) => {
    try {
        const { id } = req.params; // userId
        const conversations = await prisma_1.prisma.conversation.findMany({
            where: { userId: id },
            orderBy: { updatedAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
        });
        const formatted = conversations.map((c) => ({ ...c, lastMessage: c.messages[0] || null }));
        res.json({ conversations: formatted });
    }
    catch (error) {
        console.error('获取用户会话失败:', error);
        res.status(500).json({ error: '获取用户会话失败' });
    }
};
exports.getUserConversations = getUserConversations;
const getConversationMessagesAdmin = async (req, res) => {
    try {
        const { id } = req.params; // conversationId
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const before = req.query.before;
        const where = { conversationId: id };
        if (before)
            where.createdAt = { lt: new Date(before) };
        const [messages, total] = await Promise.all([
            prisma_1.prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
            prisma_1.prisma.message.count({ where: { conversationId: id } })
        ]);
        res.json({ messages: messages.reverse(), pagination: { page, limit, total } });
    }
    catch (error) {
        console.error('获取会话消息失败:', error);
        res.status(500).json({ error: '获取会话消息失败' });
    }
};
exports.getConversationMessagesAdmin = getConversationMessagesAdmin;
const searchConversationMessagesAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const q = req.query.q || '';
        if (!q)
            return res.json({ messages: [] });
        const messages = await prisma_1.prisma.message.findMany({
            where: { conversationId: id, content: { contains: q, mode: 'insensitive' } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json({ messages: messages.reverse() });
    }
    catch (error) {
        console.error('搜索会话消息失败:', error);
        res.status(500).json({ error: '搜索会话消息失败' });
    }
};
exports.searchConversationMessagesAdmin = searchConversationMessagesAdmin;
const updateUserFields = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, phone, realName, idCard, role, isVerified, banned } = req.body;
        const exists = await prisma_1.prisma.user.findUnique({ where: { id } });
        if (!exists) {
            return res.status(404).json({ error: '用户不存在' });
        }
        if (username && username !== exists.username) {
            const u = await prisma_1.prisma.user.findUnique({ where: { username } });
            if (u)
                return res.status(400).json({ error: '用户名已存在' });
        }
        if (email && email !== exists.email) {
            const u = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (u)
                return res.status(400).json({ error: '邮箱已被注册' });
        }
        if (phone && phone !== exists.phone) {
            const u = await prisma_1.prisma.user.findUnique({ where: { phone } });
            if (u)
                return res.status(400).json({ error: '手机号已被注册' });
        }
        if (realName && idCard) {
            const pair = await prisma_1.prisma.user.findFirst({ where: { realName, idCard } });
            if (pair && pair.id !== id)
                return res.status(400).json({ error: '实名信息已存在' });
        }
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: {
                ...(username ? { username } : {}),
                ...(email ? { email } : {}),
                ...(phone ? { phone } : {}),
                ...(realName ? { realName } : {}),
                ...(idCard ? { idCard } : {}),
                ...(role ? { role } : {}),
                ...(isVerified !== undefined ? { isVerified: Boolean(isVerified) } : {}),
                ...(banned !== undefined ? { banned: Boolean(banned) } : {}),
            },
            select: {
                id: true, username: true, email: true, phone: true, realName: true, idCard: true, role: true, isVerified: true, banned: true
            }
        });
        await prisma_1.prisma.auditLog.create({ data: { userId: id, action: 'user_update', ip: req.headers['x-forwarded-for'] || req.ip, details: '管理员更新用户资料' } });
        res.json({ message: '用户信息更新成功', user });
    }
    catch (error) {
        console.error('更新用户失败:', error);
        const code = error?.code;
        if (code === 'P2002') {
            return res.status(400).json({ error: '数据已存在，请检查输入' });
        }
        if (code === 'P2025') {
            return res.status(404).json({ error: '用户不存在' });
        }
        res.status(500).json({ error: '更新用户失败，请稍后重试' });
    }
};
exports.updateUserFields = updateUserFields;
const getFeedbackList = async (req, res) => {
    try {
        const feedbacks = await prisma_1.prisma.feedback.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, username: true, email: true, phone: true, realName: true } } }
        });
        res.json({ feedbacks });
    }
    catch (error) {
        console.error('获取反馈列表失败:', error);
        res.status(500).json({ error: '获取反馈列表失败' });
    }
};
exports.getFeedbackList = getFeedbackList;
const updateFeedbackStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolution } = req.body;
        const valid = ['pending', 'processing', 'resolved'];
        if (!valid.includes(status)) {
            return res.status(400).json({ error: '无效的状态' });
        }
        const fb = await prisma_1.prisma.feedback.update({
            where: { id },
            data: { status, resolution, handlerId: req.user.userId, handledAt: new Date() },
            include: { user: { select: { id: true, username: true } } }
        });
        await prisma_1.prisma.auditLog.create({ data: { userId: req.user.userId, action: 'feedback_update', ip: req.headers['x-forwarded-for'] || req.ip, details: `${id}:${status}` } });
        res.json({ message: '反馈更新成功', feedback: fb });
    }
    catch (error) {
        console.error('更新反馈失败:', error);
        res.status(500).json({ error: '更新反馈失败' });
    }
};
exports.updateFeedbackStatus = updateFeedbackStatus;
