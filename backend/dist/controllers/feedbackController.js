"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeedbacks = exports.submitFeedback = void 0;
const prisma_1 = require("../models/prisma");
const submitFeedback = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type, content, contact } = req.body;
        // 验证反馈类型
        const validTypes = ['complaint', 'report', 'suggestion'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: '无效的反馈类型' });
        }
        const feedback = await prisma_1.prisma.feedback.create({
            data: {
                userId,
                type,
                content,
                contact
            }
        });
        res.status(201).json({ message: '反馈提交成功', feedback });
    }
    catch (error) {
        console.error('提交反馈失败:', error);
        res.status(500).json({ error: '提交反馈失败，请稍后重试' });
    }
};
exports.submitFeedback = submitFeedback;
const getFeedbacks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const feedbacks = await prisma_1.prisma.feedback.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ feedbacks });
    }
    catch (error) {
        console.error('获取反馈列表失败:', error);
        res.status(500).json({ error: '获取反馈列表失败，请稍后重试' });
    }
};
exports.getFeedbacks = getFeedbacks;
