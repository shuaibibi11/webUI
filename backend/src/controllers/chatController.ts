import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../models/prisma';
import { invokeModel } from '../services/modelService';

export const chatValidation = [
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('消息内容长度必须在1-10000个字符之间')
    .trim(),
  body('conversationId')
    .optional()
    .isString()
    .withMessage('会话ID必须是字符串')
];

export const chatHandler = async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: '输入验证失败',
        details: errors.array().map(err => err.msg)
      });
    }

    const userId = req.user.userId;

    // 校验用户状态
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { banned: true, isVerified: true } });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    if (user.banned) {
      return res.status(403).json({ error: '账号已封禁，无法对话' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: '账号未审批，无法对话' });
    }
    let { conversationId, content } = req.body;

    let conversation;

    // 如果提供了 conversationId，验证其存在性（且属于当前用户）
    if (conversationId) {
      conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId }
      });

      if (!conversation) {
        return res.status(404).json({ error: '对话不存在' });
      }
    } else {
      // 如果没有提供 conversationId，创建一个新对话
      // 使用消息内容的前20个字符作为标题
      const title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
      conversation = await prisma.conversation.create({
        data: {
          userId,
          title
        }
      });
      conversationId = conversation.id;
    }

    // 创建用户消息
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
        status: 'sent'
      },
      select: {
        id: true,
        conversationId: true,
        role: true,
        content: true,
        status: true,
        createdAt: true,
      }
    });

    const activeModel = await prisma.modelConfig.findFirst({ where: { enabled: true }, orderBy: { updatedAt: 'desc' }, select: { memoryEnabled: true, contextLength: true, provider: true, modelName: true } })
    let messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
    if (!activeModel || !activeModel.memoryEnabled) {
      messages = [{ role: 'user', content }]
    } else {
      const history = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, select: { role: true, content: true } })
      let total = 0
      const picked: { role: 'user' | 'assistant' | 'system'; content: string }[] = []
      for (let i = history.length - 1; i >= 0; i--) {
        const h = history[i]
        const len = h.content.length
        if (total + len > (activeModel.contextLength || 4096)) break
        picked.unshift({ role: h.role as any, content: h.content })
        total += len
      }
      messages = picked
      if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
        messages = messages.concat([{ role: 'user', content }])
      }
    }
    const { content: aiContent, promptTokens, completionTokens, totalTokens } = await invokeModel(messages)

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'model_invoke',
        ip: (req.headers['x-forwarded-for'] as string) || req.ip,
        details: JSON.stringify({ conversationId, provider: activeModel?.provider, modelName: activeModel?.modelName })
      }
    })

    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiContent,
        status: 'sent',
        promptTokens,
        completionTokens,
        totalTokens
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

    // 更新对话的更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ message: '消息发送成功', conversationId, messages: [userMessage, aiMessage] });

  } catch (error) {
    console.error('聊天请求失败:', error);
    res.status(500).json({ error: '聊天请求失败，请稍后重试' });
  }
};
