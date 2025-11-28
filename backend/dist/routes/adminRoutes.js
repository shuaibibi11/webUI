"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const adminController_2 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 所有管理路由都需要认证
router.use(auth_1.authMiddleware);
// 获取用户统计
router.get('/stats', adminController_1.getUserStats);
// 获取所有用户
router.get('/users', adminController_1.getAllUsers);
// 审批用户
router.put('/users/:id/verify', adminController_1.verifyUser);
// 删除用户
router.delete('/users/:id', adminController_1.deleteUser);
// 管理用户封禁
router.put('/users/:id/ban', adminController_2.banUser);
// 模型配置管理
router.get('/models', adminController_2.getModels);
router.post('/models', adminController_2.createModel);
router.put('/models/:id', adminController_2.updateModel);
router.delete('/models/:id', adminController_2.deleteModel);
exports.default = router;
