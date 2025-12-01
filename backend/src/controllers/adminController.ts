import { Request, Response } from 'express';
import { prisma } from '../models/prisma';
import bcrypt from 'bcrypt';

// 获取所有用户（管理员）
export const getAllUsers = async (req: any, res: Response) => {
  try {
    const users = await prisma.user.findMany({
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
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '获取用户列表失败，请稍后重试' });
  }
};

// 审批用户（通过/拒绝）
export const verifyUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await prisma.user.update({
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

    await prisma.auditLog.create({ data: { userId: id, action: Boolean(isVerified) ? 'user_verify' : 'user_unverify', details: Boolean(isVerified) ? '审批通过' : '审批取消' } });
    res.json({ message: isVerified ? '用户审批通过' : '用户审批已拒绝', user });
  } catch (error) {
    console.error('审批用户失败:', error);
    res.status(500).json({ error: '审批用户失败，请稍后重试' });
  }
};

// 删除用户
export const deleteUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ error: '删除用户失败，请稍后重试' });
  }
};

// 获取用户统计
export const getUserStats = async (req: any, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({ where: { isVerified: true } });
    const unverifiedUsers = await prisma.user.count({ where: { isVerified: false } });

    res.json({
      totalUsers,
      verifiedUsers,
      unverifiedUsers
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ error: '获取用户统计失败，请稍后重试' });
  }
};
export const getModels = async (req: any, res: Response) => {
  try {
    const models = await prisma.modelConfig.findMany({ orderBy: { updatedAt: 'desc' } });
    res.json({ models });
  } catch (error) {
    console.error('获取模型配置失败:', error);
    res.status(500).json({ error: '获取模型配置失败' });
  }
};

export const createModel = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { provider, endpoint, apiKey, modelName, tag, protocol, temperature, maxTokens, topP, enabled } = req.body;
    const model = await prisma.modelConfig.create({
      data: { provider, endpoint, apiKey, modelName, tag, protocol, temperature, maxTokens, topP, enabled, createdBy: userId }
    });
    await prisma.auditLog.create({ data: { userId: userId, action: 'model_create', details: `${provider}/${modelName}` } });
    res.status(201).json({ message: '模型创建成功', model });
  } catch (error) {
    console.error('创建模型失败:', error);
    res.status(500).json({ error: '创建模型失败' });
  }
};

export const updateModel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { provider, endpoint, apiKey, modelName, tag, protocol, temperature, maxTokens, topP, enabled } = req.body;
    const data: any = {};
    if (typeof provider !== 'undefined') data.provider = provider;
    if (typeof endpoint !== 'undefined') data.endpoint = endpoint;
    if (typeof apiKey !== 'undefined') data.apiKey = apiKey;
    if (typeof modelName !== 'undefined') data.modelName = modelName;
    if (typeof tag !== 'undefined') data.tag = tag;
    if (typeof protocol !== 'undefined') data.protocol = protocol;
    if (typeof temperature !== 'undefined') data.temperature = temperature;
    if (typeof maxTokens !== 'undefined') data.maxTokens = maxTokens;
    if (typeof topP !== 'undefined') data.topP = topP;
    if (typeof enabled !== 'undefined') data.enabled = enabled;

    const model = await prisma.modelConfig.update({ where: { id }, data });
    await prisma.auditLog.create({ data: { userId: req.user.userId, action: 'model_update', details: `${model.provider}/${model.modelName}` } });
    res.json({ message: '模型更新成功', model });
  } catch (error) {
    console.error('更新模型失败:', error);
    res.status(500).json({ error: '更新模型失败' });
  }
};

export const deleteModel = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.modelConfig.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: req.user.userId, action: 'model_delete', details: id } });
    res.json({ message: '模型删除成功' });
  } catch (error) {
    console.error('删除模型失败:', error);
    res.status(500).json({ error: '删除模型失败' });
  }
};

export const banUser = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;
    const user = await prisma.user.update({ where: { id }, data: { banned: Boolean(banned) } });
    await prisma.auditLog.create({ data: { userId: id, action: banned ? 'ban' : 'unban', details: banned ? '封禁账号' : '解除封禁' } });
    res.json({ message: banned ? '用户已封禁' : '用户已解封', user });
  } catch (error) {
    console.error('封禁/解封失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
};

export const adminResetPassword = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashed = await bcrypt.hash(newPassword, bcryptRounds);
    const user = await prisma.user.update({ where: { id }, data: { password: hashed } });
    await prisma.auditLog.create({ data: { userId: req.user.userId, action: 'admin_reset_password', details: `reset:${id}` } });
    res.json({ message: '密码已重置', user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('管理员重置密码失败:', error);
    res.status(500).json({ error: '管理员重置密码失败' });
  }
};
export const getLogs = async (req: any, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const logs = await prisma.auditLog.findMany({
      where: q ? { OR: [ { action: { contains: q } }, { ip: { contains: q } } ] } : {},
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ logs });
  } catch (error) {
    console.error('获取日志失败:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
};

export const getUserConversations = async (req: any, res: Response) => {
  try {
    const { id } = req.params; // userId
    const conversations = await prisma.conversation.findMany({
      where: { userId: id },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
    const formatted = conversations.map((c: any) => ({ ...c, lastMessage: c.messages[0] || null }));
    res.json({ conversations: formatted });
  } catch (error) {
    console.error('获取用户会话失败:', error);
    res.status(500).json({ error: '获取用户会话失败' });
  }
};

export const getConversationMessagesAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params; // conversationId
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string | undefined;
    const where: any = { conversationId: id };
    if (before) where.createdAt = { lt: new Date(before) };
    const [messages, total] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
      prisma.message.count({ where: { conversationId: id } })
    ]);
    res.json({ messages: messages.reverse(), pagination: { page, limit, total } });
  } catch (error) {
    console.error('获取会话消息失败:', error);
    res.status(500).json({ error: '获取会话消息失败' });
  }
};

export const searchConversationMessagesAdmin = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const q = (req.query.q as string) || '';
    if (!q) return res.json({ messages: [] });
    const messages = await prisma.message.findMany({
      where: { conversationId: id, content: { contains: q, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('搜索会话消息失败:', error);
    res.status(500).json({ error: '搜索会话消息失败' });
  }
};
export const updateUserFields = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, phone, realName, idCard, role, isVerified, banned } = req.body;
    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (username && username !== exists.username) {
      const u = await prisma.user.findUnique({ where: { username } });
      if (u) return res.status(400).json({ error: '用户名已存在' });
    }
    if (email && email !== exists.email) {
      const u = await prisma.user.findUnique({ where: { email } });
      if (u) return res.status(400).json({ error: '邮箱已被注册' });
    }
    if (phone && phone !== exists.phone) {
      const u = await prisma.user.findUnique({ where: { phone } });
      if (u) return res.status(400).json({ error: '手机号已被注册' });
    }
    if (realName && idCard) {
      const pair = await prisma.user.findFirst({ where: { realName, idCard } });
      if (pair && pair.id !== id) return res.status(400).json({ error: '实名信息已存在' });
    }

    const user = await prisma.user.update({
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
    await prisma.auditLog.create({ data: { userId: id, action: 'user_update', details: '管理员更新用户资料' } });
    res.json({ message: '用户信息更新成功', user });
  } catch (error) {
    console.error('更新用户失败:', error);
    const code = (error as any)?.code;
    if (code === 'P2002') {
      return res.status(400).json({ error: '数据已存在，请检查输入' });
    }
    if (code === 'P2025') {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.status(500).json({ error: '更新用户失败，请稍后重试' });
  }
};
export const getFeedbackList = async (req: any, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, email: true, phone: true, realName: true } } }
    });
    res.json({ feedbacks });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    res.status(500).json({ error: '获取反馈列表失败' });
  }
};

export const updateFeedbackStatus = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    const valid = ['pending','processing','resolved'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: '无效的状态' });
    }
    const fb = await prisma.feedback.update({
      where: { id },
      data: { status, resolution, handlerId: req.user.userId, handledAt: new Date() },
      include: { user: { select: { id: true, username: true } } }
    });
    await prisma.auditLog.create({ data: { userId: req.user.userId, action: 'feedback_update', details: `${id}:${status}` } });
    res.json({ message: '反馈更新成功', feedback: fb });
  } catch (error) {
    console.error('更新反馈失败:', error);
    res.status(500).json({ error: '更新反馈失败' });
  }
};
