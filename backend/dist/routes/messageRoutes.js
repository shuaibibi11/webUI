"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController_1 = require("../controllers/messageController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 发送消息
router.post('/', auth_1.authMiddleware, messageController_1.sendMessageValidation, messageController_1.sendMessage);
// 获取对话消息
router.get('/:conversationId', auth_1.authMiddleware, messageController_1.getMessages);
// 标记消息为已读
router.post('/read', auth_1.authMiddleware, messageController_1.markMessagesAsRead);
// 获取未读消息数量
router.get('/unread-count', auth_1.authMiddleware, messageController_1.getUnreadCount);
// 搜索消息
router.get('/:conversationId/search', auth_1.authMiddleware, messageController_1.searchMessages);
exports.default = router;
