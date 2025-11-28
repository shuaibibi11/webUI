import { Router } from 'express';
import {
  getAllUsers,
  verifyUser,
  deleteUser,
  getUserStats
} from '../controllers/adminController';
import { getModels, createModel, updateModel, deleteModel, banUser, getLogs, updateUserFields, getUserConversations, getConversationMessagesAdmin, getFeedbackList, updateFeedbackStatus, adminResetPassword } from '../controllers/adminController';
import { authMiddleware, adminGuard } from '../middleware/auth';

const router = Router();

// 所有管理路由都需要认证
router.use(authMiddleware, adminGuard);

// 获取用户统计
router.get('/stats', getUserStats);

// 获取所有用户
router.get('/users', getAllUsers);
router.get('/users/:id/conversations', getUserConversations);
router.get('/conversations/:id/messages', getConversationMessagesAdmin);

// 审批用户
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id', updateUserFields);

// 删除用户
router.delete('/users/:id', deleteUser);

// 管理用户封禁
router.put('/users/:id/ban', banUser);
router.put('/users/:id/password', adminResetPassword);

// 模型配置管理
router.get('/models', getModels);
router.post('/models', createModel);
router.put('/models/:id', updateModel);
router.delete('/models/:id', deleteModel);

// 日志
router.get('/logs', getLogs);

// 反馈管理
router.get('/feedbacks', getFeedbackList);
router.put('/feedbacks/:id', updateFeedbackStatus);

export default router;
