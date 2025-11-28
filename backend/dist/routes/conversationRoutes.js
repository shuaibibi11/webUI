"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversationController_1 = require("../controllers/conversationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 创建对话
router.post('/', auth_1.authMiddleware, conversationController_1.createConversationValidation, conversationController_1.createConversation);
// 获取对话列表
router.get('/', auth_1.authMiddleware, conversationController_1.getConversations);
// 获取对话详情
router.get('/:id', auth_1.authMiddleware, conversationController_1.getConversationById);
// 更新对话
router.put('/:id', auth_1.authMiddleware, conversationController_1.updateConversation);
// 删除对话
router.delete('/:id', auth_1.authMiddleware, conversationController_1.deleteConversation);
exports.default = router;
