// 用户类型定义
export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 认证相关类型
export interface AuthResponse {
  success: boolean;
  message: string;
  data?: AuthData;
  errorCode?: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  phone: string;
  password: string;
  realName: string;
  idCard: string;
}

export interface SendSmsRequest {
  phone: string;
}

// 聊天相关类型
export interface Conversation {
  id: string;
  title: string;
  type: 'private' | 'group';
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
  sender?: User;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'file';
}

export interface CreateConversationRequest {
  title: string;
  type: 'private' | 'group';
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
}

export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// WebSocket事件类型
export interface WebSocketEvent {
  event: string;
  data: any;
}

export interface NewMessageEvent extends WebSocketEvent {
  event: 'newMessage';
  data: {
    message: Message;
  };
}

export interface MessageStatusEvent extends WebSocketEvent {
  event: 'messageStatus';
  data: {
    messageId: string;
    status: Message['status'];
    conversationId: string;
    timestamp: string;
  };
}

// 表单验证错误类型
export interface ValidationError {
  field: string;
  message: string;
}

// 分页参数类型
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 消息列表查询参数
export interface MessageQueryParams extends PaginationParams {
  conversationId: string;
  before?: string; // 时间戳，用于获取更早的消息
}

// 会话列表查询参数
export interface ConversationQueryParams extends PaginationParams {}

// 错误码定义
export const ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  USERNAME_EXISTS: 'USERNAME_EXISTS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  PHONE_EXISTS: 'PHONE_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SMS_CODE_ERROR: 'SMS_CODE_ERROR',
  SMS_CODE_EXPIRED: 'SMS_CODE_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
