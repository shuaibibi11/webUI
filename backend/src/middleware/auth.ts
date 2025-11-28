import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}

function getTokenFromCookies(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((s) => s.trim());
  const tokenPart = parts.find((p) => p.startsWith('access_token='));
  if (!tokenPart) return null;
  try {
    const value = tokenPart.split('=')[1] || '';
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    let token: string | null = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else {
      token = getTokenFromCookies(req);
    }

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: '服务未安全配置' });
    }
    const decoded = jwt.verify(token, secret) as any;
    
    // 验证必要字段
    if (!decoded.userId || !decoded.username) {
      return res.status(401).json({ error: '认证令牌数据不完整' });
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('认证失败:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '认证令牌已过期' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '认证令牌无效' });
    } else {
      return res.status(401).json({ error: '认证失败' });
    }
  }
};

export const adminGuard = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (role !== 'ADMIN') {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
};
