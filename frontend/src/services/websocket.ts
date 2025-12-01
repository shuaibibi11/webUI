import { io, Socket } from 'socket.io-client';
import type { 
  MessageStatusEvent, 
  Conversation 
} from '../types';

type WsNewMessagePayload = {
  id: string;
  conversationId: string;
  role?: 'user' | 'assistant' | 'system';
  senderId?: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  createdAt: string;
  sender?: { id: string; username: string };
};

interface WebSocketListeners {
  onNewMessage?: (data: WsNewMessagePayload) => void;
  onMessageStatus?: (data: MessageStatusEvent['data']) => void;
  onUserOnline?: (data: { userId: string; status: 'online' | 'offline' }) => void;
  onConversationUpdate?: (data: { conversation: Conversation }) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: WebSocketListeners = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isIntentionallyDisconnected = false;
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // 页面可见性变化处理
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          // 页面隐藏时，可以暂停WebSocket连接以节省资源
          if (this.socket?.connected) {
            this.socket.emit('pause');
          }
        } else {
          // 页面显示时，恢复WebSocket连接
          if (this.socket?.connected) {
            this.socket.emit('resume');
          }
        }
      });
    }
    
    // 窗口关闭处理
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }
  
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }
    
    this.isIntentionallyDisconnected = false;
    
    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3003';
    
    this.socket = io(wsUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000,
      forceNew: true
    });
    
    this.setupSocketListeners();
  }
  
  // 加入会话
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', conversationId);
      console.log(`Joined conversation: ${conversationId}`);
    }
  }

  // 离开会话
  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', conversationId);
      console.log(`Left conversation: ${conversationId}`);
    }
  }

  // 发送消息
  sendMessage(conversationId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { 
        conversationId, 
        content,
        messageType: type 
      });
    }
  }

  // 标记已读
  markAsRead(conversationId: string, messageIds: string[]): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_as_read', { conversationId, messageIds });
    }
  }

  // 开始输入
  startTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { conversationId });
    }
  }

  // 停止输入
  stopTyping(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { conversationId });
    }
  }
  
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.listeners.onConnect?.();
      this.startHeartbeat();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.listeners.onDisconnect?.(reason);
      
      // 如果不是主动断开，尝试重连
      if (!this.isIntentionallyDisconnected && reason !== 'io client disconnect') {
        this.attemptReconnection();
      }
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.listeners.onError?.(new Error('WebSocket connection error'));
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.listeners.onError?.(error);
      this.attemptReconnection();
    });
    
    // 监听新消息
    this.socket.on('new_message', (data: WsNewMessagePayload) => {
      console.log('Received new message:', data);
      this.listeners.onNewMessage?.(data);
    });

    // 监听正在输入
    this.socket.on('user_typing', (data: { userId: string; username: string; conversationId: string; isTyping: boolean }) => {
      console.log('User typing:', data);
      // TODO: 实现typing状态回调
    });

    // 监听消息已读
    this.socket.on('messages_read', (data: { conversationId: string; messageIds: string[]; readBy: string }) => {
      // 转换格式以匹配 MessageStatusEvent
      if (this.listeners.onMessageStatus) {
        // 对于批量已读，目前简化为只通知第一个，实际应用可能需要优化
        const messageId = Array.isArray(data.messageIds) ? data.messageIds[0] : data.messageIds;
        this.listeners.onMessageStatus({
          messageId,
          status: 'read',
          conversationId: data.conversationId,
          timestamp: new Date().toISOString()
        });
      }
    });
  }
  
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.listeners.onError?.(new Error('无法连接到服务器，请检查网络连接'));
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避
    
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.socket?.connected && !this.isIntentionallyDisconnected) {
        this.socket?.connect();
      }
    }, delay);
  }
  
  disconnect(): void {
    this.isIntentionallyDisconnected = true;
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  // 标记用户在线状态
  setUserStatus(status: 'online' | 'offline' | 'busy'): void {
    if (this.socket?.connected) {
      this.socket.emit('setUserStatus', { status });
      console.log(`User status set to ${status}`);
    }
  }
  
  // 设置事件监听器
  setListeners(listeners: WebSocketListeners): void {
    this.listeners = { ...this.listeners, ...listeners };
  }
  
  // 移除事件监听器
  removeListeners(): void {
    this.listeners = {};
  }
  
  // 获取连接状态
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    if (this.socket.active) return 'connecting';
    return 'disconnected';
  }
  
  // 获取重连尝试次数
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
  
  // 是否已连接
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  // 心跳检测
  startHeartbeat(): void {
    if (!this.socket?.connected) return;
    
    const heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // 30秒发送一次心跳
    
    // 监听pong响应
    this.socket.on('pong', () => {
      console.log('Heartbeat received');
    });
  }
  
  // 停止心跳检测
  stopHeartbeat(): void {
    // 心跳检测会在断开连接时自动停止
  }
}

// 创建WebSocket服务实例
export const webSocketService = new WebSocketService();

// 默认导出
export default webSocketService;
