"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 注册路由
router.post('/register', userController_1.registerValidation, userController_1.register);
// 登录路由
router.post('/login', userController_1.loginValidation, userController_1.login);
// 获取用户信息路由（需要认证）
router.get('/info', auth_1.authMiddleware, userController_1.getUserInfo);
exports.default = router;
