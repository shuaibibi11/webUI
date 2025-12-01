import api from './api';
import type { 
  Conversation, 
  Message, 
  CreateMessageRequest, 
  CreateConversationRequest,
  ConversationQueryParams,
  MessageQueryParams,
  PaginatedResponse
} from '../types';

class ChatService {
  // 获取会话列表
  async getConversations(params?: ConversationQueryParams): Promise<PaginatedResponse<Conversation>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await api.get<{ conversations: Conversation[]; pagination: any }>(
      `/conversations?${queryParams.toString()}`
    );
    return {
      items: response.conversations,
      pagination: response.pagination
    };
  }
  
  // 创建新会话
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    const response = await api.post<{ conversation: Conversation }>(
      '/conversations', data
    );
    return response.conversation;
  }
  
  // 获取会话消息
  async getMessages(conversationId: string, params?: MessageQueryParams): Promise<PaginatedResponse<Message>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.before) queryParams.append('before', params.before);
    const response = await api.get<{ messages: Message[]; pagination: any }>(
      `/messages/${conversationId}?${queryParams.toString()}`
    );
    return {
      items: response.messages,
      pagination: response.pagination
    };
  }
  
  // 发送消息
  async sendMessage(data: CreateMessageRequest): Promise<Message> {
    try {
      const response = await api.post<{ message: Message }>('/messages', data);
      return response.message;
    } catch (error) {
      throw error;
    }
  }
  
  // 标记消息为已读
  async markAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    try {
      const response = await api.post<{ success: boolean }>('/messages/read', {
        conversationId,
        messageIds
      });
      if (!response.success) {
        throw new Error('标记已读失败');
      }
    } catch (error) {
      throw error;
    }
  }
  
  // 删除消息
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean }>(`/messages/${messageId}`);
      if (!response.success) {
        throw new Error('删除消息失败');
      }
    } catch (error) {
      throw error;
    }
  }
  
  // 编辑消息
  async editMessage(messageId: string, content: string): Promise<Message> {
    try {
      const response = await api.put<{ message: Message }>(`/messages/${messageId}`, {
        content
      });
      return response.message;
    } catch (error) {
      throw error;
    }
  }
  
  // 上传文件
  async uploadFile(file: File): Promise<{ url: string; filename: string; size: number }> {
    try {
      const response = await api.upload<{ file: { url: string; filename: string; size: number } }>(
        '/chat/upload',
        file
      );
      
      if (response.success && response.data?.file) {
        return response.data.file;
      }
      
      throw new Error(response.message || '文件上传失败');
    } catch (error) {
      throw error;
    }
  }
  
  // 搜索会话
  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const response = await api.get<{ conversations: Conversation[] }>(
        `/conversations/search?query=${encodeURIComponent(query)}`
      );
      return response.conversations || [];
    } catch (error) {
      console.error('搜索会话失败:', error);
      return [];
    }
  }
  
  // 搜索消息
  async searchMessages(conversationId: string, query: string): Promise<Message[]> {
    try {
      const response = await api.get<{ messages: Message[] }>(
        `/messages/${conversationId}/search?query=${encodeURIComponent(query)}`
      );
      return response.messages || [];
    } catch (error) {
      console.error('搜索消息失败:', error);
      return [];
    }
  }
  
  // 获取未读消息数量
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<{ unreadCount: number }>('/messages/unread-count');
      return typeof response.unreadCount === 'number' ? response.unreadCount : 0;
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
      return 0;
    }
  }
}

// 创建聊天服务实例
export const chatService = new ChatService();

// 默认导出
export default chatService;
