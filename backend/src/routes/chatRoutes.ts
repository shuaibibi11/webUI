import { Router } from 'express';
import { chatHandler, chatValidation } from '../controllers/chatController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 统一聊天接口
// 如果不带 conversationId，则创建新会话并发送消息
// 如果带 conversationId，则在现有会话中发送消息
router.post('/', authMiddleware, chatValidation, chatHandler);

export default router;
