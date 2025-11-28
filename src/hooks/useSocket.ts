import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface TypingEvent {
  userId: string;
  username: string;
  conversationId: string;
  isTyping: boolean;
}

interface ConversationUpdate {
  conversationId: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { token, user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    // 创建Socket连接
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3004', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket连接成功');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket连接断开');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket连接错误:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket错误:', error);
      setConnectionError(error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  // 加入会话
  const joinConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  };

  // 离开会话
  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  };

  // 发送消息
  const sendMessage = (conversationId: string, content: string, messageType: string = 'text') => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        conversationId,
        content,
        messageType
      });
    }
  };

  // 开始输入
  const startTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', { conversationId });
    }
  };

  // 停止输入
  const stopTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', { conversationId });
    }
  };

  // 标记消息已读
  const markMessagesAsRead = (conversationId: string, messageIds: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_as_read', {
        conversationId,
        messageIds
      });
    }
  };

  // 监听新消息
  const onNewMessage = (callback: (message: SocketMessage) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off('new_message', callback);
        }
      };
    }
    return () => {};
  };

  // 监听用户输入状态
  const onUserTyping = (callback: (data: TypingEvent) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off('user_typing', callback);
        }
      };
    }
    return () => {};
  };

  // 监听会话更新
  const onConversationUpdate = (callback: (update: ConversationUpdate) => void) => {
    if (socketRef.current) {
      socketRef.current.on('conversation_updated', callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off('conversation_updated', callback);
        }
      };
    }
    return () => {};
  };

  // 监听消息已读
  const onMessagesRead = (callback: (data: { conversationId: string; messageIds: string[]; readBy: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('messages_read', callback);
      return () => {
        if (socketRef.current) {
          socketRef.current.off('messages_read', callback);
        }
      };
    }
    return () => {};
  };

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesAsRead,
    onNewMessage,
    onUserTyping,
    onConversationUpdate,
    onMessagesRead
  };
};