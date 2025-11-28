import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../models/prisma';

// 发送消息验证规则
export const sendMessageValidation = [
  body('conversationId')
    .isLength({ min: 1 })
    .withMessage('会话ID不能为空'),
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('消息内容长度必须在1-10000个字符之间')
    .trim()
];

export const sendMessage = async (req: any, res: Response) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: '输入验证失败', 
        details: errors.array().map(err => err.msg) 
      });
    }

    const userId = req.user.userId;
    const { conversationId, content } = req.body;

    // 检查对话是否存在且属于当前用户
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }

    // 创建用户消息
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content,
        status: 'sent'
      }
    });

    // 模拟AI回复（实际项目中这里会调用大模型API）
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: `这是AI对"${content}"的回复。`,
        status: 'sent'
      }
    });

    // 更新对话的更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json({ 
      message: '消息发送成功', 
      messages: [userMessage, aiMessage] 
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ error: '发送消息失败，请稍后重试' });
  }
};

export const getMessages = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string; // 获取指定时间之前的消息（用于上拉加载）

    // 检查对话是否存在且属于当前用户
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }

    // 构建查询条件
    const whereCondition: any = { conversationId };
    if (before) {
      whereCondition.createdAt = { lt: new Date(before) };
    }

    // 并行查询消息和总数
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' }, // 倒序获取最新的消息
        take: limit
      }),
      prisma.message.count({ where: { conversationId } })
    ]);

    // 返回时反转数组，使其按时间正序排列（旧 -> 新）
    res.json({ 
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('获取消息失败:', error);
    res.status(500).json({ error: '获取消息失败，请稍后重试' });
  }
};

export const markMessagesAsRead = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { conversationId, messageIds } = req.body;

    // 验证会话权限
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }

    // 更新消息状态
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        conversationId,
        role: 'assistant' // 只能标记AI回复为已读
      },
      data: { status: 'read' }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({ error: '操作失败，请稍后重试' });
  }
};

export const getUnreadCount = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;

    // 获取所有属于该用户的会话ID
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      select: { id: true }
    });

    const conversationIds = conversations.map((c: any) => c.id);

    // 统计所有会话中的未读消息（AI发送的且状态不是read的）
    const count = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        role: 'assistant',
        status: { not: 'read' }
      }
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('获取未读数失败:', error);
    res.status(500).json({ error: '获取未读数失败' });
  }
};

export const searchMessages = async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.params;
    const query = req.query.query as string;

    if (!query) {
      return res.json({ messages: [] });
    }

    // 验证权限
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: '对话不存在' });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        content: { contains: query, mode: 'insensitive' }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('搜索消息失败:', error);
    res.status(500).json({ error: '搜索消息失败' });
  }
};
