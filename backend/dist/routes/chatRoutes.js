"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 统一聊天接口
// 如果不带 conversationId，则创建新会话并发送消息
// 如果带 conversationId，则在现有会话中发送消息
router.post('/', auth_1.authMiddleware, chatController_1.chatValidation, chatController_1.chatHandler);
exports.default = router;
