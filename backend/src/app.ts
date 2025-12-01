import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoutes';
import conversationRoutes from './routes/conversationRoutes';
import messageRoutes from './routes/messageRoutes';
import chatRoutes from './routes/chatRoutes';
import modelRoutes from './routes/modelRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import adminRoutes from './routes/adminRoutes';

const app = express();

// 安全配置
app.use(helmet());

// 速率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 限制每个IP最多100个请求
  message: '请求过于频繁，请稍后再试',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 更严格的速率限制用于认证接口
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100000'),
  message: '认证请求过于频繁，请稍后再试',
  skipSuccessfulRequests: true,
});

// 中间件配置
const origins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:11004,http://localhost:11010')
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由配置
app.use('/api/users', authLimiter, userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    } else if (err.code === 'P2025') {
      return res.status(404).json({ error: '记录不存在' });
    } else {
      return res.status(500).json({ error: '数据库操作失败' });
    }
  }

  // 处理JWT错误
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: '认证令牌已过期' });
  } else if (err.name === 'JsonWebTokenError') {
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

export default app;
