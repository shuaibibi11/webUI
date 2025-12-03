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
import { MessageContent, TypingIndicator } from '@/components/chat/MessageContent';
import type { Message, Conversation, NewMessageEvent } from '@/types';

export default function Chat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [reactions, setReactions] = useState<Record<string, 'like' | 'dislike' | undefined>>({});
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
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

  // 选择会话（提前声明）
  const handleSelectConversation = React.useCallback(async (conv: Conversation) => {
    if (currentConversation?.id === conv.id) return;
    if (currentConversation) {
      webSocketService.leaveConversation(currentConversation.id);
    }
    setCurrentConversation(conv);
    webSocketService.joinConversation(conv.id);
    try {
      const res = await chatService.getMessages(conv.id);
      setMessages(conv.id, res.items);
      const unreadMessages = res.items
        .filter(msg => msg.role !== 'user' && msg.status !== 'read')
        .map(msg => msg.id);
      if (unreadMessages.length > 0) {
        webSocketService.markAsRead(conv.id, unreadMessages);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  }, [currentConversation, setCurrentConversation, setMessages]);

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
          const m = await api.get<{ model: { modelName: string; provider: string; tag: string } | null }>("/models/active");
          setActiveModel(m.model ? { modelName: m.model.modelName, provider: m.model.provider, tag: m.model.tag } : null);
        } catch {
          setActiveModel(null);
        }
        const params = new URLSearchParams(window.location.search);
        const convId = params.get('conv');
        if (!currentConversation) {
          if (res.items.length > 0) {
            const target = convId ? res.items.find(c => c.id === convId) || res.items[0] : res.items[0];
            handleSelectConversation(target);
          } else {
            const conv = await chatService.createConversation({ title: '新对话', type: 'private' });
            setConversations([conv]);
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
          }
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
  }, [navigate, currentConversation, handleSelectConversation, setConversations, setCurrentConversation, setMessages]);

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
  }, [messagesEndRef, messages.length]);

  // handleSelectConversation 已提前声明

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const content = inputText;
    setInputText('');
    try {
      let targetConversation = currentConversation;
      if (!targetConversation) {
        const title = content.slice(0, 20) || '新对话';
        const conv = await chatService.createConversation({ title, type: 'private' });
        setConversations([conv, ...conversations]);
        setCurrentConversation(conv);
        webSocketService.joinConversation(conv.id);
        targetConversation = conv;
      }
      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        conversationId: targetConversation.id,
        role: 'user',
        senderId: user?.id || '',
        content,
        type: 'text',
        status: 'sending',
        createdAt: new Date().toISOString(),
        sender: user || undefined
      };
      addMessage(targetConversation.id, tempMessage);
      let provider = activeModel?.provider?.toLowerCase() || '';
      if (!provider) {
        try {
          const m = await api.get<{ model: { modelName: string; provider: string; tag: string } | null }>("/models/active");
          if (m.model) {
            setActiveModel({ modelName: m.model.modelName, provider: m.model.provider, tag: m.model.tag });
            provider = m.model.provider.toLowerCase();
          }
        } catch { void 0; }
      }
      if (provider === 'bisheng') {
        updateMessage(targetConversation.id, tempId, { status: 'sent' });
        const controller = new AbortController();
        const tempAssistantId = `temp_ai_${Date.now()}`;
        addMessage(targetConversation.id, {
          id: tempAssistantId,
          conversationId: targetConversation.id,
          role: 'assistant',
          senderId: 'ai',
          content: '',
          type: 'text',
          status: 'sent',
          createdAt: new Date().toISOString(),
        } as Message);
        setStreamingMessageId(tempAssistantId);
        const timeoutId = setTimeout(() => {
          controller.abort();
          setStreamingMessageId(null);
          updateMessage(targetConversation.id, tempAssistantId, { content: '响应超时，请稍后重试' });
        }, 60000); // 增加到 60 秒
        try {
          const base = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL ?? ((import.meta as unknown as { env?: Record<string, string> }).env?.DEV ? '/api' : 'http://localhost:3003/api');
          // 多轮对话：传递 session_id, node_id, message_id
          const existingSessionId = targetConversation.bishengSessionId;
          const existingNodeId = targetConversation.bishengNodeId;
          const existingMessageId = targetConversation.bishengMessageId;
          
          console.log('[Chat] 发送消息，会话信息:', {
            conversationId: targetConversation.id,
            sessionId: existingSessionId,
            nodeId: existingNodeId,
            messageId: existingMessageId
          });
          
          let invokePayload: Record<string, unknown>;
          
          // 如果有 node_id，使用 { [node_id]: { user_input: value } } 格式
          if (existingSessionId && existingNodeId) {
            const nodeInput: Record<string, unknown> = {};
            nodeInput[existingNodeId] = { user_input: content };
            invokePayload = {
              input: nodeInput,
              stream: true,
              conversationId: targetConversation.id,
              session_id: existingSessionId,
              node_id: existingNodeId,
              message_id: existingMessageId,
            };
          } else {
            invokePayload = {
              input: { text: content, user_input: content },
              stream: true,
              conversationId: targetConversation.id,
            };
            if (existingSessionId) {
              invokePayload.session_id = existingSessionId;
            }
            if (existingNodeId) {
              invokePayload.node_id = existingNodeId;
            }
            if (existingMessageId) {
              invokePayload.message_id = existingMessageId;
            }
          }
          
          console.log('[Chat] 发送到 bisheng 的 payload:', invokePayload);
          const resp = await fetch(base.replace(/\/$/, '') + '/bisheng/invoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', 'Authorization': `Bearer ${authService.getToken() || ''}` },
            body: JSON.stringify(invokePayload),
            signal: controller.signal,
            credentials: 'include',
          });
          if (!resp.ok) {
            let txt = '';
            try { txt = await resp.text(); } catch (e) { void e; }
            updateMessage(targetConversation.id, tempAssistantId, { content: `工作流调用失败(${resp.status}) ${txt || ''}`.trim() });
            updateMessage(targetConversation.id, tempId, { status: 'sent' });
            return;
          }
          clearTimeout(timeoutId);
          const reader = resp.body?.getReader();
          const decoder = new TextDecoder('utf-8');
          if (!reader) throw new Error('stream not available');
          updateMessage(targetConversation.id, tempId, { status: 'sent' });
          let buffer = '';
          let acc = '';
          let hasContent = false;
          let receivedEvent = false;
          let pendingEvent = '';
          let pendingDataLines: string[] = [];
          let autoContinueTriggered = false;
          const continueInvoke = async (sessId?: string, nodeId?: string, msgId?: string) => {
            if (!nodeId) return;
            try {
              const nodeInput: Record<string, unknown> = {};
              nodeInput[nodeId] = { user_input: content };
              const payload: Record<string, unknown> = {
                input: nodeInput,
                stream: true,
                conversationId: targetConversation.id,
              };
              if (sessId) payload.session_id = sessId;
              if (nodeId) payload.node_id = nodeId;
              if (msgId) payload.message_id = msgId;
              setStreamingMessageId(tempAssistantId);
              const ctrl2 = new AbortController();
              const to2 = setTimeout(() => {
                ctrl2.abort();
                setStreamingMessageId(null);
                updateMessage(targetConversation.id, tempAssistantId, { content: '响应超时，请稍后重试' });
              }, 60000);
              const resp2 = await fetch(base.replace(/\/$/, '') + '/bisheng/invoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', 'Authorization': `Bearer ${authService.getToken() || ''}` },
                body: JSON.stringify(payload),
                signal: ctrl2.signal,
                credentials: 'include',
              });
              if (!resp2.ok) {
                let t = '';
                try { t = await resp2.text(); } catch (e) { void e; }
                updateMessage(targetConversation.id, tempAssistantId, { content: `工作流调用失败(${resp2.status}) ${t || ''}`.trim() });
                return;
              }
              clearTimeout(to2);
              const reader2 = resp2.body?.getReader();
              const decoder2 = new TextDecoder('utf-8');
              if (!reader2) return;
              let buffer2 = '';
              let acc2 = '';
              let pendingDataLines2: string[] = [];
              const flush2 = async () => {
                if (pendingDataLines2.length === 0) return;
                const raw2 = pendingDataLines2.join('\n').trim();
                let parsedUnknown2: unknown = null;
                try { parsedUnknown2 = JSON.parse(raw2); } catch (e) { void e; }
                if (parsedUnknown2 && typeof parsedUnknown2 === 'object') {
                  const p = parsedUnknown2 as Record<string, unknown>;
                  const d = p['data'] as unknown as Record<string, unknown> | undefined;
                  const dataOutputSchema2 = d?.output_schema as { message?: string | string[] } | undefined;
                  let chunk2 = '' as string;
                  if (dataOutputSchema2?.message) {
                    const out = dataOutputSchema2.message;
                    chunk2 = typeof out === 'string' ? out : (Array.isArray(out) ? out.filter(x => typeof x === 'string').join('\n') : '');
                  }
                  if (!chunk2) {
                    const tryStr = (key: string) => {
                      const v = (p as Record<string, unknown>)[key];
                      return typeof v === 'string' ? v : '';
                    };
                    chunk2 = tryStr('delta') || tryStr('content') || tryStr('text') || tryStr('message') || tryStr('msg') || tryStr('result');
                  }
                  if (!chunk2 && d) {
                    const o = d as Record<string, unknown>;
                    chunk2 = typeof o['text'] === 'string' ? (o['text'] as string) : (typeof o['content'] === 'string' ? (o['content'] as string) : '');
                  }
                  if (chunk2) {
                    acc2 += chunk2;
                    updateMessage(targetConversation.id, tempAssistantId, { content: acc2 });
                  }
                } else {
                  const t = raw2;
                  if (t) {
                    acc2 += t;
                    updateMessage(targetConversation.id, tempAssistantId, { content: acc2 });
                  }
                }
                pendingDataLines2 = [];
              };
              while (true) {
                const { done, value } = await reader2.read();
                if (done) break;
                buffer2 += decoder2.decode(value, { stream: true });
                const lines2 = buffer2.split(/\r?\n/);
                buffer2 = lines2.pop() || '';
                for (const line of lines2) {
                  const trimmed2 = line.trim();
                  if (trimmed2 === '') {
                    await flush2();
                    continue;
                  }
                  if (trimmed2.startsWith('data:')) {
                    pendingDataLines2.push(trimmed2.slice(5).trim());
                    continue;
                  }
                  pendingDataLines2.push(trimmed2);
                }
              }
              await flush2();
            } catch {
              updateMessage(targetConversation.id, tempAssistantId, { content: '网络错误，请检查连接后重试' });
            }
          };
          
          type WorkflowOutput = { value?: string; text?: string; content?: string; data?: string };
          type WorkflowEvent = {
            event?: string; type?: string;
            delta?: string; content?: string; text?: string; message?: string; msg?: string; result?: string;
            data?: Record<string, unknown>;
            choices?: Array<Record<string, unknown>>;
            outputs?: WorkflowOutput[] | WorkflowOutput;
            output?: WorkflowOutput[] | WorkflowOutput;
            summary?: string; final?: string;
            session_id?: string; sessionId?: string; session?: string;
          };
          const pickText = (obj: unknown): string => {
            if (!obj || typeof obj !== 'object') return '';
            const o = obj as Record<string, unknown>;
            const keys = ['delta', 'content', 'text', 'message', 'msg', 'result'];
            for (const k of keys) {
              const v = o[k];
              if (typeof v === 'string') return v;
            }
            return '';
          };
          const fromOutputs = (outputs: unknown): string => {
            if (!outputs) return '';
            if (Array.isArray(outputs)) {
              const parts = outputs.map((o) => {
                const oo = o as WorkflowOutput;
                return oo.value || oo.text || oo.content || oo.data || '';
              }).filter(Boolean);
              return parts.join('');
            }
            if (typeof outputs === 'object') {
              const oo = outputs as WorkflowOutput;
              return oo.value || oo.text || oo.content || oo.data || '';
            }
            return '';
          };
          const fromChoices = (choices: unknown): string => {
            if (!Array.isArray(choices) || choices.length === 0) return '';
            const c0 = choices[0];
            if (typeof c0 !== 'object' || !c0) return '';
            const co = c0 as Record<string, unknown>;
            const delta = co['delta'];
            if (delta && typeof delta === 'object') {
              const dc = (delta as Record<string, unknown>)['content'];
              if (typeof dc === 'string') return dc;
            }
            const text = co['text'];
            if (typeof text === 'string') return text;
            const msg = co['message'];
            if (msg && typeof msg === 'object') {
              const mc = (msg as Record<string, unknown>)['content'];
              if (typeof mc === 'string') return mc;
            }
            return '';
          };

          const flushEvent = async () => {
            if (pendingDataLines.length === 0) return;
            const raw = pendingDataLines.join('\n').trim();
            let parsedUnknown: unknown = null;
            try { parsedUnknown = JSON.parse(raw); } catch (e) { void e; }
            if (parsedUnknown && typeof parsedUnknown === 'object') {
              const parsed = parsedUnknown as WorkflowEvent & { output_schema?: { message?: string | string[] }; input_schema?: Record<string, unknown>; node_id?: string; message_id?: string };
              // bisheng 响应格式: { session_id, data: { event, status, node_id, message_id, output_schema: { message } } }
              const dataObj = parsed.data as Record<string, unknown> | undefined;
              const dataEvent = dataObj?.event as string | undefined;
              const dataStatus = dataObj?.status as string | undefined;
              const dataOutputSchema = dataObj?.output_schema as { message?: string | string[]; output_key?: string } | undefined;
              const dataNodeId = dataObj?.node_id as string | undefined;
              const dataMessageId = dataObj?.message_id as string | undefined;
              
              // 获取事件类型：优先从 data.event 获取，然后是顶层 event
              const evType = dataEvent || parsed.event || parsed.type || pendingEvent;
              if (evType) receivedEvent = true;
              
              // 获取 session_id（顶层字段）
              const sess = parsed.session_id || parsed.sessionId || parsed.session || '';
              
              // 处理 input 事件：初始化阶段，保存 session_id, node_id, message_id
              if (dataEvent === 'input' && sess && dataStatus !== 'stream') {
                receivedEvent = true;
                if (!autoContinueTriggered) {
                  autoContinueTriggered = true;
                  continueInvoke(sess, dataNodeId, dataMessageId);
                }
              }
              // 处理流式消息：data.status === 'stream'
              else if (dataStatus === 'stream') {
                receivedEvent = true;
                let chunk = '';
                if (dataOutputSchema?.message) {
                  const out = dataOutputSchema.message;
                  chunk = typeof out === 'string' ? out : (Array.isArray(out) ? out.filter(x => typeof x === 'string').join('\n') : '');
                }
                if (chunk) {
                  hasContent = true;
                  acc += chunk;
                  updateMessage(targetConversation.id, tempAssistantId, { content: acc });
                }
              }
              // 处理流结束：data.status === 'end'
              else if (dataStatus === 'end') {
                receivedEvent = true;
                let finalMsg = '';
                if (dataOutputSchema?.message) {
                  const out = dataOutputSchema.message;
                  finalMsg = typeof out === 'string' ? out : (Array.isArray(out) ? out.filter(x => typeof x === 'string').join('\n') : '');
                }
                if (finalMsg) {
                  hasContent = true;
                  acc = finalMsg;
                  updateMessage(targetConversation.id, tempAssistantId, { content: acc });
                }
              }
              // 兼容旧格式：顶层字段处理
              else {
                let chunk = '' as string;
                chunk = typeof parsed === 'string' ? String(parsed) : (
                  parsed.delta || parsed.content || parsed.text || parsed.message || parsed.msg || parsed.result || ''
                );
                if (!chunk && parsed.output_schema?.message) {
                  const out = parsed.output_schema.message;
                  chunk = typeof out === 'string' ? out : (Array.isArray(out) ? out.filter(x => typeof x === 'string').join('\n') : '');
                }
                if (!chunk && dataObj) chunk = pickText(dataObj);
                if (!chunk) chunk = fromChoices(parsed.choices);
                const outputs = parsed.outputs || parsed.output || (dataObj ? dataObj['outputs'] : undefined);
                if (!chunk && outputs) chunk = fromOutputs(outputs);
                
                if (evType === 'guide_word' || evType === 'guide_question' || evType === 'input') {
                  const msgId = parsed.message_id || (dataObj ? (dataObj['message_id'] as string) : undefined);
                  const nodeId = parsed.node_id || (dataObj ? (dataObj['node_id'] as string) : undefined);
                  if (!autoContinueTriggered) {
                    autoContinueTriggered = true;
                    continueInvoke(sess || targetConversation.bishengSessionId, nodeId, msgId);
                  }
                  
                } else if (chunk) {
                  hasContent = true;
                  acc += chunk;
                  updateMessage(targetConversation.id, tempAssistantId, { content: acc });
                } else if (evType === 'close' || evType === 'finish' || evType === 'done') {
                  const finalText = parsed.summary || (dataObj ? (dataObj['summary'] as string) : '') || parsed.final || (dataObj ? (dataObj['final'] as string) : '');
                  if (finalText) {
                    hasContent = true;
                    acc = finalText;
                    updateMessage(targetConversation.id, tempAssistantId, { content: acc });
                  }
                }
              }
              
              // 保存 session_id, node_id, message_id 并更新前端 conversation 对象
              if (sess || dataNodeId || dataMessageId) {
                console.log('[Chat] 收到 bisheng 会话信息:', { sess, dataNodeId, dataMessageId });
                try {
                  if (sess && !targetConversation.bishengSessionId) {
                    await api.post('/bisheng/session', { conversationId: targetConversation.id, sessionId: sess });
                    console.log('[Chat] 保存 session_id 到数据库成功');
                  }
                  // 更新前端的 conversation 对象，以便下次请求使用
                  if (sess) targetConversation.bishengSessionId = sess;
                  if (dataNodeId) targetConversation.bishengNodeId = dataNodeId;
                  if (dataMessageId) targetConversation.bishengMessageId = dataMessageId;
                  
                  // 同时更新 store 中的 conversation
                  const updatedConv = { 
                    ...targetConversation, 
                    bishengSessionId: sess || targetConversation.bishengSessionId,
                    bishengNodeId: dataNodeId || targetConversation.bishengNodeId,
                    bishengMessageId: dataMessageId || targetConversation.bishengMessageId,
                  };
                  setCurrentConversation(updatedConv);
                  console.log('[Chat] 更新会话状态:', {
                    sessionId: updatedConv.bishengSessionId,
                    nodeId: updatedConv.bishengNodeId,
                    messageId: updatedConv.bishengMessageId
                  });
                } catch (e) { 
                  console.error('[Chat] 保存会话信息失败:', e);
                }
              }
            } else {
              const evType = pendingEvent;
              if (evType) receivedEvent = true;
              const textChunk = raw;
              if (evType === 'guide_word' || evType === 'guide_question' || evType === 'input') {
                const mSess = raw.match(/"?session[_-]?id"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i) || raw.match(/"?sessionId"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i);
                const mNode = raw.match(/"?node[_-]?id"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i) || raw.match(/"?nodeId"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i);
                const mMsg = raw.match(/"?message[_-]?id"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i) || raw.match(/"?messageId"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i);
                const sess2 = mSess?.[1] || targetConversation.bishengSessionId;
                const node2 = mNode?.[1];
                const msg2 = mMsg?.[1];
                if (!autoContinueTriggered) {
                  autoContinueTriggered = true;
                  continueInvoke(sess2, node2, msg2);
                }
              } else if (textChunk) {
                hasContent = true;
                acc += textChunk;
                updateMessage(targetConversation.id, tempAssistantId, { content: acc });
              }
              const m = raw.match(/"?session[_-]?id"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i) || raw.match(/"?sessionId"?\s*[:=]\s*"?([A-Za-z0-9\-_.:]+)"?/i);
              const sess = m?.[1];
              if (sess && !targetConversation.bishengSessionId) {
                try {
                  await api.post('/bisheng/session', { conversationId: targetConversation.id, sessionId: sess });
                  targetConversation.bishengSessionId = sess;
                  const updatedConv = { ...targetConversation, bishengSessionId: sess };
                  setCurrentConversation(updatedConv);
                } catch (e) { void e; }
              }
            }
            pendingEvent = '';
            pendingDataLines = [];
          };
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed === '') {
                await flushEvent();
                continue;
              }
              if (trimmed.startsWith('event:')) {
                pendingEvent = trimmed.slice(6).trim();
                continue;
              }
              if (trimmed.startsWith('data:')) {
                pendingDataLines.push(trimmed.slice(5).trim());
                continue;
              }
              pendingDataLines.push(trimmed);
            }
          }
          await flushEvent();
          setStreamingMessageId(null);
          clearTimeout(timeoutId);
          if (!hasContent && !receivedEvent) {
            updateMessage(targetConversation.id, tempAssistantId, { content: '未收到回复内容，请重新发送' });
            updateMessage(targetConversation.id, tempId, { status: 'sent' });
          }
        } catch (e) {
          clearTimeout(timeoutId);
          setStreamingMessageId(null);
          console.error('bisheng stream failed', e);
          const errMsg = e instanceof Error && e.name === 'AbortError' 
            ? '请求已取消' 
            : '网络错误，请检查连接后重试';
          updateMessage(targetConversation.id, tempAssistantId, { content: errMsg });
          updateMessage(targetConversation.id, tempId, { status: 'sent' });
        }
      } else {
        const res = await chatService.chatUnified(content, targetConversation.id);
        res.messages.forEach(m => addMessage(res.conversationId, m));
        updateMessage(targetConversation.id, tempId, { status: 'sent' });
      }
    } catch (error) {
      console.error('Failed to send message', error);
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
                    "flex w-full animate-fadeInUp",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn("flex flex-col max-w-[70%]", msg.role === 'user' ? "items-end" : "items-start")}> 
                    <div
                      className={cn(
                        "rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed transition-all duration-200",
                        msg.role === 'user'
                          ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md"
                          : "bg-white text-secondary-900 rounded-bl-md border border-secondary-100"
                      )}
                    >
                      {msg.role === 'assistant' && msg.content === '' && streamingMessageId === msg.id ? (
                        <TypingIndicator />
                      ) : (
                        <MessageContent 
                          content={msg.content} 
                          role={msg.role}
                          isStreaming={streamingMessageId === msg.id}
                        />
                      )}
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
