"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGuard = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getTokenFromCookies(req) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader)
        return null;
    const parts = cookieHeader.split(';').map((s) => s.trim());
    const tokenPart = parts.find((p) => p.startsWith('access_token='));
    if (!tokenPart)
        return null;
    try {
        const value = tokenPart.split('=')[1] || '';
        return decodeURIComponent(value);
    }
    catch {
        return null;
    }
}
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }
        else {
            token = getTokenFromCookies(req);
        }
        if (!token) {
            return res.status(401).json({ error: '未提供认证令牌' });
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
const adminGuard = (req, res, next) => {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
        return res.status(403).json({ error: '权限不足' });
    }
    next();
};
exports.adminGuard = adminGuard;
