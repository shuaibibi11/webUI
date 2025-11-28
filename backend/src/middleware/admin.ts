import { Request, Response, NextFunction } from 'express';

export const adminGuard = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: '权限不足，仅管理员可访问' });
    }
    next();
  } catch (e) {
    return res.status(403).json({ error: '权限校验失败' });
  }
};
