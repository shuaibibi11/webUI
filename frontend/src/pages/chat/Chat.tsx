import React, { useEffect, useRef, useState } from 'react';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { Send, Smile, MoreHorizontal, FileText, Check, CheckCheck, Copy, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores';
import { webSocketService } from '@/services/websocket';
import { chatService } from '@/services/chat';
import { authService } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import type { Message, Conversation, NewMessageEvent } from '@/types';

export default function Chat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [reactions, setReactions] = useState<Record<string, 'like' | 'dislike' | undefined>>({});
  
  // Store hooks
  const user = useAppStore(state => state.user);
  const conversations = useAppStore(state => state.conversations);
  const currentConversation = useAppStore(state => state.currentConversation);
  const messagesMap = useAppStore(state => state.messages);
  
  const setConversations = useAppStore(state => state.setConversations);
  const setCurrentConversation = useAppStore(state => state.setCurrentConversation);
  const setMessages = useAppStore(state => state.setMessages);
  const addMessage = useAppStore(state => state.addMessage);
  const updateMessage = useAppStore(state => state.updateMessage);

  const messages = currentConversation ? (messagesMap[currentConversation.id] || []) : [];
  const [activeModel, setActiveModel] = useState<{ modelName: string; provider: string; tag: string } | null>(null);

  // 初始化检查和数据获取
  useEffect(() => {
    const init = async () => {
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      // 连接WebSocket
      if (!webSocketService.isConnected()) {
        webSocketService.connect(token);
      }

      // 获取会话列表
      try {
        const res = await chatService.getConversations();
        setConversations(res.items);

        try {
          const m = await api.get<{ model: any }>("/models/active");
          setActiveModel(m.model ? { modelName: m.model.modelName, provider: m.model.provider, tag: m.model.tag } : null);
        } catch {}
        const params = new URLSearchParams(window.location.search);
        const convId = params.get('conv');
        if (!currentConversation && res.items.length > 0) {
          const target = convId ? res.items.find(c => c.id === convId) || res.items[0] : res.items[0];
          handleSelectConversation(target);
        }
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      }
    };

    init();

    // 清理函数
    return () => {
      // 组件卸载时不一定要断开WebSocket，取决于需求
      // 这里我们移除监听器
      webSocketService.removeListeners();
    };
  }, []);

  // WebSocket 监听设置
  useEffect(() => {
    webSocketService.setListeners({
      onNewMessage: (data: NewMessageEvent['data']) => {
        // 转换后端消息格式到前端格式
        const role: Message['role'] = data.role ?? (data.senderId && data.senderId === user?.id ? 'user' : 'assistant');
        const newMessage: Message = {
          id: data.id,
          conversationId: data.conversationId,
          role,
          senderId: data.senderId,
          content: data.content,
          type: (data.messageType as Message['type']) || 'text',
          status: 'sent',
          createdAt: data.createdAt,
          sender: data.sender
        };
        
        addMessage(data.conversationId, newMessage);
        
        // 如果是当前会话且消息不是自己发的，标记为已读
        if (currentConversation?.id === data.conversationId && role !== 'user') {
          webSocketService.markAsRead(data.conversationId, [data.id]);
        }
      },
      onMessageStatus: (data) => {
        // 更新消息状态
        updateMessage(data.conversationId, data.messageId, { status: data.status });
      },
      onConnect: () => {
        console.log("Chat connected to WS");
        // 重连后可能需要重新加入房间
        if (currentConversation) {
          webSocketService.joinConversation(currentConversation.id);
        }
      }
    });
  }, [addMessage, updateMessage, currentConversation, user]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 选择会话
  const handleSelectConversation = async (conv: Conversation) => {
    // 如果已经在当前会话，不做处理
    if (currentConversation?.id === conv.id) return;

    // 离开旧会话房间
    if (currentConversation) {
      webSocketService.leaveConversation(currentConversation.id);
    }

    setCurrentConversation(conv);
    
    // 加入新会话房间
    webSocketService.joinConversation(conv.id);
    
    // 获取消息记录
    try {
      const res = await chatService.getMessages(conv.id);
      setMessages(conv.id, res.items);
      
      // 标记未读消息为已读
      const unreadMessages = res.items
        .filter(msg => msg.role !== 'user' && msg.status !== 'read')
        .map(msg => msg.id);
        
      if (unreadMessages.length > 0) {
        webSocketService.markAsRead(conv.id, unreadMessages);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentConversation) return;
    
    const content = inputText;
    setInputText(''); // 立即清空输入框
    
    try {
      // 1. 生成临时ID和消息对象
      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        conversationId: currentConversation.id,
        role: 'user',
        senderId: user?.id || '',
        content,
        type: 'text',
        status: 'sending',
        createdAt: new Date().toISOString(),
        sender: user || undefined
      };

      // 2. 立即在UI显示
      addMessage(currentConversation.id, tempMessage);

      // 3. 通过WebSocket发送
      webSocketService.sendMessage(currentConversation.id, content);
      
      // 注意：这里我们不手动将状态改为sent，而是等待WebSocket的'new_message'广播
      // 或者如果后端返回了ack，可以在那里更新状态。
      // 为了更好的体验，我们可以在收到自己的消息广播时，替换掉临时消息或者更新状态
    } catch (error) {
      console.error("Failed to send message", error);
      // TODO: 显示错误提示，并将消息状态改为failed
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return formatTime(dateStr);
    }
    return date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
  };

  // 渲染消息状态图标
  const renderMessageStatus = (msg: Message) => {
    if (msg.role !== 'user') return null;

    switch (msg.status) {
      case 'sending':
        return <div className="w-3 h-3 rounded-full border-2 border-secondary-300 border-t-transparent animate-spin" />;
      case 'sent':
        return <Check className="w-3 h-3 text-secondary-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-secondary-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-primary-500" />;
      default:
        return null;
    }
  };

  const handleCopy = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast({ title: '已复制', description: '内容已复制到剪贴板' });
    } catch {
      toast({ variant: 'destructive', title: '复制失败', description: '请在安全环境下重试' });
    }
  };

  const toggleLike = (id: string) => {
    setReactions(prev => ({ ...prev, [id]: prev[id] === 'like' ? undefined : 'like' }));
  };

  const toggleDislike = (id: string) => {
    setReactions(prev => ({ ...prev, [id]: prev[id] === 'dislike' ? undefined : 'dislike' }));
  };

  const shareConversationLink = (convId: string) => {
    const url = `${window.location.origin}/chat?conv=${convId}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
          toast({ title: '链接已复制', description: '可将链接分享给他人' });
        }).catch(() => {
          throw new Error('clipboard failed');
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast({ title: '链接已复制', description: '可将链接分享给他人' });
      }
    } catch {
      toast({ variant: 'destructive', title: '复制失败', description: '请手动选择并复制链接' });
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* 左侧边栏 - 会话列表 */}
      <div className="w-80 border-r border-secondary-200 flex flex-col bg-secondary-50">
        {/* 顶部新建会话按钮 */}
        <div className="p-4 border-b border-secondary-200">
          <button
            onClick={async () => {
              try {
                const conv = await chatService.createConversation({ title: '新对话', type: 'private' });
                setConversations([conv, ...conversations]);
                setCurrentConversation(conv);
                webSocketService.joinConversation(conv.id);
                setMessages(conv.id, [
                  {
                    id: `sys_${Date.now()}`,
                    conversationId: conv.id,
                    senderId: 'system',
                    content: '已为你创建新会话，输入内容开始与AI助手交流。',
                    type: 'text',
                    status: 'sent',
                    createdAt: new Date().toISOString(),
                  } as Message,
                ]);
              } catch (e) {
                console.error('创建会话失败', e);
              }
            }}
            className="w-full flex items-center justify-center space-x-2 bg-white border border-secondary-300 rounded-md py-2.5 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            <span>新建会话</span>
          </button>
        </div>

        {/* 会话列表区域 */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-3 space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-colors group relative",
                  currentConversation?.id === conv.id 
                    ? "bg-white shadow-sm border border-secondary-200" 
                    : "hover:bg-secondary-100"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-medium text-secondary-900 truncate">
                      {conv.title}
                    </h3>
                  </div>
                  <span className="text-xs text-secondary-400 whitespace-nowrap ml-2">
                    {formatDate(conv.updatedAt)}
                  </span>
                </div>
                <p className="text-xs text-secondary-500 pl-10 truncate">
                  {conv.lastMessage?.content || '暂无消息'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 底部用户信息 */}
        <div className="p-4 border-t border-secondary-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase() || 'User'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                {user?.username || '用户'}
              </p>
            </div>
            <button 
              onClick={() => {
                authService.logout();
                navigate('/login');
              }}
              className="text-secondary-400 hover:text-secondary-600"
              title="退出登录"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 右侧主聊天区域 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {currentConversation ? (
          <>
            {/* 顶部导航栏 */}
            <div className="h-16 border-b border-secondary-200 flex items-center justify-between px-6 bg-white shadow-sm z-10">
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-medium text-secondary-900">
                  {currentConversation.title}
                </h1>
                {activeModel && (
                  <span className="text-xs text-secondary-600 border border-secondary-300 rounded-md px-2 py-0.5 bg-white">
                    {activeModel.provider} / {activeModel.modelName}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="status-online">在线</span>
                  <span className="text-sm text-secondary-600">
                    {user?.username}
                  </span>
                </div>
              </div>
            </div>

            {/* 消息展示区域 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary-50 scrollbar-thin">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex w-full",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn("flex flex-col max-w-[70%]", msg.role === 'user' ? "items-end" : "items-start")}> 
                    <div
                      className={cn(
                        "rounded-lg px-5 py-3.5 shadow-sm text-sm leading-relaxed",
                        msg.role === 'user'
                          ? "bg-primary-50 text-secondary-900 rounded-br-none border border-primary-100"
                          : "bg-white text-secondary-900 rounded-bl-none border border-secondary-200"
                      )}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center space-x-1 mt-1 px-1">
                      <span className="text-xs text-secondary-400">
                        {formatTime(msg.createdAt)}
                      </span>
                      {msg.role === 'user' && renderMessageStatus(msg)}
                    </div>
                    {msg.role !== 'user' && (
                      <div className="flex items-center space-x-2 mt-2 px-1">
                        <button
                          className="px-2 py-1 text-xs text-secondary-600 hover:text-secondary-900 border border-secondary-300 rounded-md bg-white"
                          onClick={() => handleCopy(msg.content)}
                        >
                          <span className="inline-flex items-center space-x-1"><Copy className="w-3.5 h-3.5" /><span>复制</span></span>
                        </button>
                        <button
                          className={cn(
                            "px-2 py-1 text-xs border rounded-md bg-white",
                            reactions[msg.id] === 'like' ? "text-primary-600 border-primary-400" : "text-secondary-600 border-secondary-300 hover:text-secondary-900"
                          )}
                          onClick={() => toggleLike(msg.id)}
                        >
                          <span className="inline-flex items-center space-x-1"><ThumbsUp className="w-3.5 h-3.5" /><span>点赞</span></span>
                        </button>
                        <button
                          className={cn(
                            "px-2 py-1 text-xs border rounded-md bg-white",
                            reactions[msg.id] === 'dislike' ? "text-red-600 border-red-400" : "text-secondary-600 border-secondary-300 hover:text-secondary-900"
                          )}
                          onClick={() => toggleDislike(msg.id)}
                        >
                          <span className="inline-flex items-center space-x-1"><ThumbsDown className="w-3.5 h-3.5" /><span>不认同</span></span>
                        </button>
                        <button
                          className="px-2 py-1 text-xs text-secondary-600 hover:text-secondary-900 border border-secondary-300 rounded-md bg-white"
                          onClick={() => currentConversation && shareConversationLink(currentConversation.id)}
                        >
                          <span className="inline-flex items-center space-x-1"><Share2 className="w-3.5 h-3.5" /><span>转发</span></span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 会话结束分隔线 */}
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-4 w-full max-w-md">
                  <div className="h-px bg-secondary-200 flex-1 border-t border-dashed"></div>
                  <span className="text-xs text-secondary-400 font-medium">历史消息</span>
                  <div className="h-px bg-secondary-200 flex-1 border-t border-dashed"></div>
                </div>
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* 底部输入区域 */}
            <div className="p-6 bg-white border-t border-secondary-200">
              <div className="max-w-4xl mx-auto relative">
                <div className="relative rounded-xl border border-secondary-300 shadow-sm bg-white focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-400 transition-all">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    className="w-full min-h-[52px] max-h-32 py-3.5 pl-4 pr-12 bg-transparent border-none focus:ring-0 resize-none text-sm placeholder:text-secondary-400"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                    <button 
                      onClick={handleSendMessage}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        inputText.trim() 
                          ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm" 
                          : "bg-secondary-100 text-secondary-400 cursor-not-allowed"
                      )}
                      disabled={!inputText.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-center text-xs text-secondary-400 mt-3">
                  内容由AI生成，仅供参考
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-secondary-400">
            <div className="w-16 h-16 bg-secondary-100 rounded-lg flex items-center justify-center mb-4">
              <Smile className="w-8 h-8" />
            </div>
            <p>选择一个会话开始聊天</p>
          </div>
        )}
      </div>
    </div>
  );
}
