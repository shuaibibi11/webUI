import { Router } from 'express';
import { register, login, getUserInfo, registerValidation, loginValidation, requestPasswordReset, confirmPasswordReset } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 注册路由
router.post('/register', registerValidation, register);

// 登录路由
router.post('/login', loginValidation, login);

// 密码重置
router.post('/password-reset/request', requestPasswordReset);
router.post('/password-reset/confirm', confirmPasswordReset);

// 获取用户信息路由（需要认证）
router.get('/info', authMiddleware, getUserInfo);

export default router;
