"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const conversationRoutes_1 = __importDefault(require("./routes/conversationRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const feedbackRoutes_1 = __importDefault(require("./routes/feedbackRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const app = (0, express_1.default)();
// 安全配置
app.use((0, helmet_1.default)());
// 速率限制
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 限制每个IP最多100个请求
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// 更严格的速率限制用于认证接口
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'), // 限制每个IP最多5次认证请求
    message: '认证请求过于频繁，请15分钟后再试',
    skipSuccessfulRequests: true, // 成功的请求不计入限制
});
// 中间件配置
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 路由配置
app.use('/api/users', authLimiter, userRoutes_1.default);
app.use('/api/conversations', conversationRoutes_1.default);
app.use('/api/messages', messageRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/feedbacks', feedbackRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
// 健康检查路由
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行正常' });
});
// 404 处理
app.use('*', (req, res) => {
    res.status(404).json({ error: '接口不存在' });
});
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误详情:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    // 处理Prisma错误
    if (err.code && err.code.startsWith('P')) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: '数据已存在，请检查输入' });
        }
        else if (err.code === 'P2025') {
            return res.status(404).json({ error: '记录不存在' });
        }
        else {
            return res.status(500).json({ error: '数据库操作失败' });
        }
    }
    // 处理JWT错误
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: '认证令牌已过期' });
    }
    else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: '认证令牌无效' });
    }
    // 处理验证错误
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: '输入数据验证失败', details: err.message });
    }
    // 默认错误响应
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({
        error: '服务器内部错误',
        ...(isDevelopment && {
            message: err.message,
            stack: err.stack
        })
    });
});
exports.default = app;
