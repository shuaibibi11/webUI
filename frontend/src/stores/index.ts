import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User, Conversation, Message } from '../types';

interface AppState {
  // 用户状态
  user: User | null;
  isAuthenticated: boolean;
  
  // 聊天状态
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<string, Message[]>; // conversationId -> messages
  unreadCounts: Record<string, number>; // conversationId -> unreadCount
  
  // UI状态
  sidebarCollapsed: boolean;
  isLoading: boolean;
  error: string | null;
  
  // WebSocket状态
  isConnected: boolean;
  reconnectAttempts: number;
  
  // 方法
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  
  setCurrentConversation: (conversation: Conversation | null) => void;
  
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnreadCount: (conversationId: string) => void;
  resetUnreadCount: (conversationId: string) => void;
  
  setSidebarCollapsed: (collapsed: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  setConnected: (isConnected: boolean) => void;
  setReconnectAttempts: (attempts: number) => void;
  
  clearChatData: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  conversations: [],
  currentConversation: null,
  messages: {},
  unreadCounts: {},
  sidebarCollapsed: false,
  isLoading: false,
  error: null,
  isConnected: false,
  reconnectAttempts: 0,
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // 用户状态管理
        setUser: (user) => set({ user }),
        setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
        
        // 会话管理
        setConversations: (conversations) => set({ conversations }),
        addConversation: (conversation) => set((state) => ({
          conversations: [conversation, ...state.conversations]
        })),
        updateConversation: (conversation) => set((state) => ({
          conversations: state.conversations.map(conv => 
            conv.id === conversation.id ? conversation : conv
          )
        })),
        removeConversation: (conversationId) => set((state) => ({
          conversations: state.conversations.filter(conv => conv.id !== conversationId),
          currentConversation: state.currentConversation?.id === conversationId ? null : state.currentConversation,
          messages: Object.fromEntries(
            Object.entries(state.messages).filter(([id]) => id !== conversationId)
          ),
          unreadCounts: Object.fromEntries(
            Object.entries(state.unreadCounts).filter(([id]) => id !== conversationId)
          )
        })),
        
        // 当前会话管理
        setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
        
        // 消息管理
        setMessages: (conversationId, messages) => set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: messages
          }
        })),
        addMessage: (conversationId, message) => set((state) => {
          const existingMessages = state.messages[conversationId] || [];
          const isDuplicate = existingMessages.some(msg => msg.id === message.id);
          
          if (isDuplicate) {
            return state; // 避免重复消息
          }
          
          return {
            messages: {
              ...state.messages,
              [conversationId]: [...existingMessages, message]
            }
          };
        }),
        updateMessage: (conversationId, messageId, updates) => set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            )
          }
        })),
        removeMessage: (conversationId, messageId) => set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] || []).filter(msg => msg.id !== messageId)
          }
        })),
        
        // 未读消息管理
        setUnreadCount: (conversationId, count) => set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: count
          }
        })),
        incrementUnreadCount: (conversationId) => set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: (state.unreadCounts[conversationId] || 0) + 1
          }
        })),
        resetUnreadCount: (conversationId) => set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: 0
          }
        })),
        
        // UI状态管理
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        
        // WebSocket状态管理
        setConnected: (isConnected) => set({ isConnected }),
        setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),
        
        // 清除聊天数据
        clearChatData: () => set({
          conversations: [],
          currentConversation: null,
          messages: {},
          unreadCounts: {},
        }),
        
        // 重置所有状态
        reset: () => set(initialState),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          sidebarCollapsed: state.sidebarCollapsed,
          conversations: state.conversations,
          unreadCounts: state.unreadCounts,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
);

// 导出常用选择器
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useConversations = () => useAppStore((state) => state.conversations);
export const useCurrentConversation = () => useAppStore((state) => state.currentConversation);
export const useMessages = (conversationId: string) => 
  useAppStore((state) => state.messages[conversationId] || []);
export const useUnreadCount = (conversationId: string) => 
  useAppStore((state) => state.unreadCounts[conversationId] || 0);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);
export const useIsConnected = () => useAppStore((state) => state.isConnected);
