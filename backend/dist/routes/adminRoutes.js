"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const adminController_2 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有管理路由都需要认证
router.use(auth_1.authMiddleware, auth_1.adminGuard);
// 获取用户统计
router.get('/stats', adminController_1.getUserStats);
// 获取所有用户
router.get('/users', adminController_1.getAllUsers);
router.get('/users/:id/conversations', adminController_2.getUserConversations);
router.get('/conversations/:id/messages', adminController_2.getConversationMessagesAdmin);
// 审批用户
router.put('/users/:id/verify', adminController_1.verifyUser);
router.put('/users/:id', adminController_2.updateUserFields);
// 删除用户
router.delete('/users/:id', adminController_1.deleteUser);
// 管理用户封禁
router.put('/users/:id/ban', adminController_2.banUser);
router.put('/users/:id/password', adminController_2.adminResetPassword);
// 模型配置管理
router.get('/models', adminController_2.getModels);
router.post('/models', adminController_2.createModel);
router.put('/models/:id', adminController_2.updateModel);
router.delete('/models/:id', adminController_2.deleteModel);
// 日志
router.get('/logs', adminController_2.getLogs);
// 反馈管理
router.get('/feedbacks', adminController_2.getFeedbackList);
router.put('/feedbacks/:id', adminController_2.updateFeedbackStatus);
exports.default = router;
