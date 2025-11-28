import { Router } from 'express';
import { submitFeedback, getFeedbacks } from '../controllers/feedbackController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 提交反馈
router.post('/', authMiddleware, submitFeedback);

// 获取反馈列表
router.get('/', authMiddleware, getFeedbacks);

export default router;