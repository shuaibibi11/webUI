import { Router } from 'express';
import {
  createConversation,
  getConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  createConversationValidation
} from '../controllers/conversationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 创建对话
router.post('/', authMiddleware, createConversationValidation, createConversation);

// 获取对话列表
router.get('/', authMiddleware, getConversations);

// 获取对话详情
router.get('/:id', authMiddleware, getConversationById);

// 更新对话
router.put('/:id', authMiddleware, updateConversation);

// 删除对话
router.delete('/:id', authMiddleware, deleteConversation);

export default router;