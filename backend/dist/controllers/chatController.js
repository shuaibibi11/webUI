"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatHandler = exports.chatValidation = void 0;
const express_validator_1 = require("express-validator");
const prisma_1 = require("../models/prisma");
const modelService_1 = require("../services/modelService");
exports.chatValidation = [
    (0, express_validator_1.body)('content')
        .isLength({ min: 1, max: 10000 })
        .withMessage('消息内容长度必须在1-10000个字符之间')
        .trim(),
    (0, express_validator_1.body)('conversationId')
        .optional()
        .isString()
        .withMessage('会话ID必须是字符串')
];
const chatHandler = async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: '输入验证失败',
                details: errors.array().map(err => err.msg)
            });
        }
        const userId = req.user.userId;
        let { conversationId, content } = req.body;
        let conversation;
        // 如果提供了 conversationId，验证其存在性
        if (conversationId) {
            conversation = await prisma_1.prisma.conversation.findUnique({
                where: { id: conversationId, userId }
            });
            if (!conversation) {
                return res.status(404).json({ error: '对话不存在' });
            }
        }
        else {
            // 如果没有提供 conversationId，创建一个新对话
            // 使用消息内容的前20个字符作为标题
            const title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
            conversation = await prisma_1.prisma.conversation.create({
                data: {
                    userId,
                    title
                }
            });
            conversationId = conversation.id;
        }
        // 创建用户消息
        const userMessage = await prisma_1.prisma.message.create({
            data: {
                conversationId,
                role: 'user',
                content,
                status: 'sent'
            }
        });
        const { content: aiContent, promptTokens, completionTokens, totalTokens } = await (0, modelService_1.invokeModel)(content);
        const aiMessage = await prisma_1.prisma.message.create({
            data: {
                conversationId,
                role: 'assistant',
                content: aiContent,
                status: 'sent',
                promptTokens,
                completionTokens,
                totalTokens
            }
        });
        // 更新对话的更新时间
        await prisma_1.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });
        res.status(201).json({ message: '消息发送成功', conversationId, messages: [userMessage, aiMessage] });
    }
    catch (error) {
        console.error('聊天请求失败:', error);
        res.status(500).json({ error: '聊天请求失败，请稍后重试' });
    }
};
exports.chatHandler = chatHandler;
