"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversation = exports.updateConversation = exports.getConversationById = exports.searchConversations = exports.getConversations = exports.createConversation = exports.createConversationValidation = void 0;
const express_validator_1 = require("express-validator");
const prisma_1 = require("../models/prisma");
// 创建会话验证规则
exports.createConversationValidation = [
    (0, express_validator_1.body)('title')
        .optional()
        .isLength({ max: 100 })
        .withMessage('会话标题长度不能超过100个字符')
        .trim()
];
const createConversation = async (req, res) => {
    try {
        // 验证输入
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '输入验证失败',
                details: errors.array().map(err => err.msg)
            });
        }
        const userId = req.user.userId;
        const { title } = req.body;
        const conversation = await prisma_1.prisma.conversation.create({
            data: {
                userId,
                title: title || '新对话'
            }
        });
        res.status(201).json({ message: '对话创建成功', conversation });
    }
    catch (error) {
        console.error('创建对话失败:', error);
        res.status(500).json({ error: error?.message || '创建对话失败，请稍后重试' });
    }
};
exports.createConversation = createConversation;
const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [conversations, total] = await Promise.all([
            prisma_1.prisma.conversation.findMany({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                include: {
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }),
            prisma_1.prisma.conversation.count({ where: { userId } })
        ]);
        // 格式化返回数据，提取最后一条消息
        const formattedConversations = conversations.map((conv) => {
            // 安全处理 lastMessage
            const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;
            return {
                ...conv,
                lastMessage
            };
        });
        res.json({
            conversations: formattedConversations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('获取对话列表失败:', error);
        res.status(500).json({ error: '获取对话列表失败，请稍后重试' });
    }
};
exports.getConversations = getConversations;
const searchConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const query = req.query.query;
        if (!query) {
            return res.json({ conversations: [] });
        }
        const conversations = await prisma_1.prisma.conversation.findMany({
            where: {
                userId,
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    {
                        messages: {
                            some: {
                                content: { contains: query, mode: 'insensitive' }
                            }
                        }
                    }
                ]
            },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        const formattedConversations = conversations.map((conv) => ({
            ...conv,
            lastMessage: conv.messages[0] || null
        }));
        res.json({ conversations: formattedConversations });
    }
    catch (error) {
        console.error('搜索对话失败:', error);
        res.status(500).json({ error: '搜索对话失败，请稍后重试' });
    }
};
exports.searchConversations = searchConversations;
const getConversationById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const conversation = await prisma_1.prisma.conversation.findFirst({
            where: { id, userId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } }
            }
        });
        if (!conversation) {
            return res.status(404).json({ error: '对话不存在' });
        }
        res.json({ conversation });
    }
    catch (error) {
        console.error('获取对话详情失败:', error);
        res.status(500).json({ error: '获取对话详情失败，请稍后重试' });
    }
};
exports.getConversationById = getConversationById;
const updateConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { title } = req.body;
        const own = await prisma_1.prisma.conversation.findFirst({ where: { id, userId } });
        if (!own) {
            return res.status(404).json({ error: '对话不存在或无权限' });
        }
        const conversation = await prisma_1.prisma.conversation.update({
            where: { id },
            data: { title }
        });
        res.json({ message: '对话更新成功', conversation });
    }
    catch (error) {
        console.error('更新对话失败:', error);
        res.status(500).json({ error: '更新对话失败，请稍后重试' });
    }
};
exports.updateConversation = updateConversation;
const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const own = await prisma_1.prisma.conversation.findFirst({ where: { id, userId } });
        if (!own) {
            return res.status(404).json({ error: '对话不存在或无权限' });
        }
        await prisma_1.prisma.conversation.delete({ where: { id } });
        res.json({ message: '对话删除成功' });
    }
    catch (error) {
        console.error('删除对话失败:', error);
        res.status(500).json({ error: '删除对话失败，请稍后重试' });
    }
};
exports.deleteConversation = deleteConversation;
