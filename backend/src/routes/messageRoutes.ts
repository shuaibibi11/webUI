import { Router } from 'express';
import { sendMessage, getMessages, sendMessageValidation, markMessagesAsRead, getUnreadCount, searchMessages } from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 发送消息
router.post('/', authMiddleware, sendMessageValidation, sendMessage);

// 获取对话消息
router.get('/:conversationId', authMiddleware, getMessages);

// 标记消息为已读
router.post('/read', authMiddleware, markMessagesAsRead);

// 获取未读消息数量
router.get('/unread-count', authMiddleware, getUnreadCount);

// 搜索消息
router.get('/:conversationId/search', authMiddleware, searchMessages);

export default router;
