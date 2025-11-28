"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ error: '未提供认证令牌' });
        }
        // 验证Bearer格式
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '认证令牌格式错误' });
        }
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: '认证令牌为空' });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: '服务未安全配置' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // 验证必要字段
        if (!decoded.userId || !decoded.username) {
            return res.status(401).json({ error: '认证令牌数据不完整' });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('认证失败:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: '认证令牌已过期' });
        }
        else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: '认证令牌无效' });
        }
        else {
            return res.status(401).json({ error: '认证失败' });
        }
    }
};
exports.authMiddleware = authMiddleware;
