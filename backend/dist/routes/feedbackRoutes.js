"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedbackController_1 = require("../controllers/feedbackController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 提交反馈
router.post('/', auth_1.authMiddleware, feedbackController_1.submitFeedback);
// 获取反馈列表
router.get('/', auth_1.authMiddleware, feedbackController_1.getFeedbacks);
exports.default = router;
