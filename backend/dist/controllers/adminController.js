"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.banUser = exports.deleteModel = exports.updateModel = exports.createModel = exports.getModels = exports.getUserStats = exports.deleteUser = exports.verifyUser = exports.getAllUsers = void 0;
const prisma_1 = require("../models/prisma");
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
        const { provider, endpoint, apiKey, modelName, tag, temperature, maxTokens, topP, enabled } = req.body;
        const model = await prisma_1.prisma.modelConfig.create({
            data: { provider, endpoint, apiKey, modelName, tag, temperature, maxTokens, topP, enabled, createdBy: userId }
        });
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
        const { provider, endpoint, apiKey, modelName, tag, temperature, maxTokens, topP, enabled } = req.body;
        const model = await prisma_1.prisma.modelConfig.update({
            where: { id },
            data: { provider, endpoint, apiKey, modelName, tag, temperature, maxTokens, topP, enabled }
        });
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
        await prisma_1.prisma.auditLog.create({ userId: id, action: banned ? 'ban' : 'unban', details: banned ? '封禁账号' : '解除封禁' });
        res.json({ message: banned ? '用户已封禁' : '用户已解封', user });
    }
    catch (error) {
        console.error('封禁/解封失败:', error);
        res.status(500).json({ error: '操作失败' });
    }
};
exports.banUser = banUser;
