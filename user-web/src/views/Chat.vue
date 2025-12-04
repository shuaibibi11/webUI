<template>
  <div class="chat-container">
    <!-- 左侧侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <n-button
          type="primary"
          :block="!sidebarCollapsed"
          @click="newConversation"
          :icon="addIcon"
          class="new-conversation-btn"
          size="medium"
          :title="sidebarCollapsed ? '新建会话' : ''"
        >
          <span v-if="!sidebarCollapsed">新建会话</span>
        </n-button>
        <n-button
          quaternary
          circle
          size="small"
          @click="toggleSidebar"
          class="collapse-btn"
          :title="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <template #icon>
            <n-icon>
              <svg v-if="sidebarCollapsed" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </n-icon>
          </template>
        </n-button>
      </div>
      
      <div class="sidebar-content">
        <!-- 当前模型/工作流信息 -->
        <div class="current-model">
          <div class="model-label">当前模型/工作流</div>
          <div class="model-selector">
            <n-select
              v-model:value="selectedModelId"
              :options="modelOptions"
              placeholder="选择模型或工作流"
              size="small"
              @update:value="handleModelChange"
            />
          </div>
          <div class="model-status">
            <n-tag type="success" size="small">在线</n-tag>
          </div>
        </div>
        
        <!-- 历史会话列表 -->
        <div class="conversations-section">
          <div v-if="todayConversations.length > 0" class="section-title">今天</div>
          <div
            v-for="conv in todayConversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conv.id === currentConversationId }"
            @click="switchConversation(conv.id)"
            @contextmenu.prevent="handleConversationContextMenu($event, conv)"
          >
            <div class="conv-avatar">{{ getConversationAvatar(conv.title) }}</div>
            <div class="conv-content">
              <div class="conv-title">{{ conv.title }}</div>
              <div class="conv-time">{{ formatTime(conv.updatedAt) }}</div>
            </div>
            <div class="conv-actions" @click.stop>
              <n-button
                quaternary
                circle
                size="small"
                @click="handleDeleteConversation(conv.id)"
                class="delete-btn"
                :title="'删除会话'"
              >
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </div>
          </div>
          
          <div v-if="yesterdayConversations.length > 0" class="section-title">昨天</div>
          <div
            v-for="conv in yesterdayConversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conv.id === currentConversationId }"
            @click="switchConversation(conv.id)"
            @contextmenu.prevent="handleConversationContextMenu($event, conv)"
          >
            <div class="conv-avatar">{{ getConversationAvatar(conv.title) }}</div>
            <div class="conv-content">
              <div class="conv-title">{{ conv.title }}</div>
              <div class="conv-time">{{ formatTime(conv.updatedAt) }}</div>
            </div>
            <div class="conv-actions" @click.stop>
              <n-button
                quaternary
                circle
                size="small"
                @click="handleDeleteConversation(conv.id)"
                class="delete-btn"
                :title="'删除会话'"
              >
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </div>
          </div>
          
          <div v-if="olderConversations.length > 0" class="section-title">更早</div>
          <div
            v-for="conv in olderConversations"
            :key="conv.id"
            class="conversation-item"
            :class="{ active: conv.id === currentConversationId }"
            @click="switchConversation(conv.id)"
            @contextmenu.prevent="handleConversationContextMenu($event, conv)"
          >
            <div class="conv-avatar">{{ getConversationAvatar(conv.title) }}</div>
            <div class="conv-content">
              <div class="conv-title">{{ conv.title }}</div>
              <div class="conv-time">{{ formatTime(conv.updatedAt) }}</div>
            </div>
            <div class="conv-actions" @click.stop>
              <n-button
                quaternary
                circle
                size="small"
                @click="handleDeleteConversation(conv.id)"
                class="delete-btn"
                :title="'删除会话'"
              >
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </n-icon>
                </template>
              </n-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部用户信息 -->
      <div class="user-section">
        <n-dropdown
          trigger="click"
          :options="dropdownOptions"
          @select="handleDropdownSelect"
          placement="top-end"
        >
          <div class="user-info">
            <n-avatar round :size="32">
              <n-icon>
                <Person />
              </n-icon>
            </n-avatar>
            <span class="username">{{ userInfo?.username || '用户' }}</span>
          </div>
        </n-dropdown>
      </div>
    </div>
    
    <!-- 主对话区 -->
    <div class="main-chat-area">
      <!-- 顶部导航栏 -->
      <div class="chat-header">
        <div class="header-left">
          <h2 class="chat-title">{{ currentConversation?.title || '新会话' }}</h2>
        </div>
        <div class="header-right">
          <n-button
            quaternary
            circle
            @click="handleFeedback"
            :title="'反馈'"
            class="feedback-btn"
          >
            <template #icon>
              <n-icon>
                <ChatboxEllipses />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
      
      <!-- 对话流 - 统一对话框内左右分栏 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <n-icon size="64">
              <ChatboxEllipsesOutline />
            </n-icon>
          </div>
          <div class="empty-text">开始新的对话</div>
          <div class="empty-subtext">输入您的问题，我将为您提供帮助</div>
        </div>
        
        <!-- 统一对话框内的左右分栏 -->
        <div class="chat-messages">
          <div 
            v-for="message in messages" 
            :key="message.id" 
            class="message-item"
            :class="{ 
              'user-message': message.role === 'user', 
              'assistant-message': message.role === 'assistant' 
            }"
          >
            <!-- 左侧：模型回复 -->
            <div v-if="message.role === 'assistant'" class="message-left">
              <div class="message-avatar">
                <n-avatar round style="background-color: #1677FF;">
                  <n-icon>
                    <ChatboxEllipsesOutline />
                  </n-icon>
                </n-avatar>
              </div>
              <div class="message-content">
                <div class="message-bubble assistant-bubble">
                  <div class="message-text" v-html="formatMessageContent(message.content)"></div>
                  <div v-if="message.status === 'sending'" class="typing-cursor">|</div>
                  
                  <!-- 消息操作栏 -->
                  <div v-if="message.status === 'sent' || message.status === 'error'" class="message-actions">
                    <n-button
                      quaternary
                      circle
                      size="small"
                      :type="message.isLiked ? 'primary' : 'default'"
                      @click="handleLike(message)"
                      :title="message.isLiked ? '取消点赞' : '点赞'"
                    >
                      <template #icon>
                        <n-icon>
                          <ThumbsUp />
                        </n-icon>
                      </template>
                    </n-button>
                    <n-button
                      quaternary
                      circle
                      size="small"
                      :type="message.isDisliked ? 'primary' : 'default'"
                      @click="handleDislike(message)"
                      :title="message.isDisliked ? '取消不认同' : '不认同'"
                    >
                      <template #icon>
                        <n-icon>
                          <ThumbsDown />
                        </n-icon>
                      </template>
                    </n-button>
                    <n-button
                      quaternary
                      circle
                      size="small"
                      @click="handleCopy(message.content)"
                      :title="'复制'"
                    >
                      <template #icon>
                        <n-icon>
                          <Copy />
                        </n-icon>
                      </template>
                    </n-button>
                    <n-button
                      quaternary
                      circle
                      size="small"
                      @click="handleForward(message.id)"
                      :title="'转发'"
                    >
                      <template #icon>
                        <n-icon>
                          <Share />
                        </n-icon>
                      </template>
                    </n-button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 右侧：用户输入 -->
            <div v-if="message.role === 'user'" class="message-right">
              <div class="message-content">
                <div class="message-bubble user-bubble">
                  <div class="message-text" v-html="formatMessageContent(message.content)"></div>
                </div>
              </div>
              <div class="message-avatar">
                <n-avatar round style="background-color: #52C41A;">
                  <n-icon>
                    <Person />
                  </n-icon>
                </n-avatar>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 输入区域 -->
      <div class="input-area">
        <div class="input-container">
          <n-input
            v-model:value="inputContent"
            type="textarea"
            placeholder="输入您的问题..."
            :autosize="{ minRows: 1, maxRows: 4 }"
            @keydown.enter="handleSend"
            :disabled="generating"
            class="message-input"
          />
          <div class="input-actions">
            <n-button
              v-if="generating"
              type="warning"
              @click="pauseGeneration"
              :icon="stopIcon"
              size="medium"
              class="stop-btn"
            >
              停止生成
            </n-button>
            <n-button
              type="primary"
              @click="handleSend"
              :disabled="!inputContent.trim() || generating"
              size="medium"
              class="send-btn"
            >
              发送
            </n-button>
          </div>
        </div>
        <div class="ai-disclaimer">
          <n-icon size="16" color="#86909C" style="margin-right: 6px;">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </n-icon>
          <span class="disclaimer-text">内容由AI生成，仅供参考！</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, h } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NAvatar, NIcon, NSelect, NTag, NDropdown, useMessage, useDialog } from 'naive-ui'
import { Person, ChatboxEllipses, ChatboxEllipsesOutline, ThumbsUp, ThumbsDown, Copy, Share } from '@vicons/ionicons5'
import { get, post, del, sseRequest } from '../utils/api'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()

// 定义接口类型
interface Conversation {
  id: string
  title: string
  updatedAt: string
}

interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  status: 'sending' | 'sent' | 'error'
  feedbackStatus?: 'none' | 'like' | 'dislike'
  isLiked?: boolean
  isDisliked?: boolean
  createdAt: string
}

interface UserInfo {
  username: string
}

interface ModelOption {
  label: string
  value: string
  type?: string
  description?: string
}

// 响应式数据
const conversations = ref<Conversation[]>([])
const messages = ref<Message[]>([])
const currentConversationId = ref<string | null>(null)
const inputContent = ref('')
const generating = ref(false)
const messagesContainer = ref<HTMLElement>()
const userInfo = ref<UserInfo>({ username: '用户' })
const selectedModelId = ref<string>('')
const modelOptions = ref<ModelOption[]>([])
const sidebarCollapsed = ref(false)
let abortController: AbortController | null = null

// 当前会话
const currentConversation = computed(() => {
  return conversations.value.find(c => c.id === currentConversationId.value)
})


// 按时间分组的会话列表
const todayConversations = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return conversations.value.filter(conv => {
    const convDate = new Date(conv.updatedAt)
    convDate.setHours(0, 0, 0, 0)
    return convDate.getTime() === today.getTime()
  })
})

const yesterdayConversations = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  return conversations.value.filter(conv => {
    const convDate = new Date(conv.updatedAt)
    convDate.setHours(0, 0, 0, 0)
    return convDate.getTime() === yesterday.getTime()
  })
})

const olderConversations = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  return conversations.value.filter(conv => {
    const convDate = new Date(conv.updatedAt)
    convDate.setHours(0, 0, 0, 0)
    return convDate.getTime() < yesterday.getTime()
  })
})

// 图标定义
const addIcon = h('i', { class: 'i-ion-add' })
const stopIcon = h('i', { class: 'i-ion-stop' })

// 获取会话列表
const fetchConversations = async () => {
  try {
    console.log('开始获取会话列表...')
    const response = await get('/conversations')
    console.log('会话列表响应:', response)
    
    // 处理后端返回的数据格式
    let convList = []
    if (response.data && response.data.conversations) {
      // 后端返回格式: { code: 200, data: { conversations: [...] } }
      convList = response.data.conversations
    } else if (response.conversations) {
      // 后端返回格式: { code: 200, conversations: [...] }
      convList = response.conversations
    } else if (Array.isArray(response.data)) {
      // 后端直接返回数组
      convList = response.data
    } else if (Array.isArray(response)) {
      // 后端返回数组格式
      convList = response
    }
    
    // 确保conversations.value始终是数组
    conversations.value = Array.isArray(convList) ? convList : []
    
    console.log('处理后的会话列表，数量:', conversations.value.length, conversations.value)
    
    // 如果没有当前会话且有会话列表，选择第一个
    if (!currentConversationId.value && conversations.value.length > 0) {
      console.log('自动选择第一个会话:', conversations.value[0].id)
      await switchConversation(conversations.value[0].id)
    }
  } catch (error) {
    console.error('获取会话列表失败', error)
    // 确保会话列表在错误情况下仍然是数组
    conversations.value = []
  }
}

// 获取消息列表
const fetchMessages = async (conversationId: string) => {
  // 验证会话ID
  if (!conversationId || typeof conversationId !== 'string') {
    console.error('获取消息失败：无效的会话ID', conversationId)
    messages.value = []
    return
  }
  
  try {
    // 重置生成状态
    generating.value = false
    // 取消可能的正在进行的请求
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    
    console.log('开始获取消息列表，会话ID:', conversationId)
    const response = await get(`/messages/${conversationId}`)
    console.log('消息列表响应:', response)
    
    // 验证响应有效性
    if (!response) {
      console.error('获取消息失败：响应为空')
      messages.value = []
      return
    }
    
    // 处理后端返回的数据格式
    let msgList = []
    
    // 检查响应状态码
    if (response.code && response.code !== 200) {
      console.error('获取消息失败：服务器返回错误码', response.code, response.message)
      messages.value = []
      return
    }
    
    if (response.data && response.data.messages) {
      // 后端返回格式: { code: 200, data: { messages: [...] } }
      msgList = response.data.messages
    } else if (response.messages) {
      // 后端返回格式: { code: 200, messages: [...] }
      msgList = response.messages
    } else if (response.conversation && response.conversation.messages) {
      // 后端返回格式: { code: 200, conversation: { messages: [...] } }
      msgList = response.conversation.messages
    } else if (Array.isArray(response.data)) {
      // 后端直接返回数组
      msgList = response.data
    } else if (Array.isArray(response)) {
      // 后端返回数组格式
      msgList = response
    } else {
      console.warn('无法识别的消息列表格式，原始响应:', response)
      msgList = []
    }
    
    // 确保消息列表是数组，并按照createdAt排序
    const sortedMessages = Array.isArray(msgList) ? msgList : []
    
    // 规范化消息数据格式
    const normalizedMessages = sortedMessages.map((msg: any) => {
      return {
        id: msg.id || msg.messageId || '',
        conversationId: msg.conversationId || msg.conversation_id || currentConversationId.value || '',
        role: msg.role || msg.senderRole || (msg.senderId === 'assistant' ? 'assistant' : 'user'),
        content: msg.content || msg.text || msg.message || '',
        status: msg.status || 'sent',
        feedbackStatus: msg.feedbackStatus || 'none',
        createdAt: msg.createdAt || msg.created_at || msg.timestamp || new Date().toISOString()
      }
    })
    
    normalizedMessages.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || 0).getTime()
      const timeB = new Date(b.createdAt || 0).getTime()
      return timeA - timeB
    })
    
    messages.value = normalizedMessages
    console.log('处理后的消息列表，消息数量:', messages.value.length)
    console.log('消息详情:', messages.value.map(m => ({ 
      id: m.id, 
      role: m.role, 
      content: m.content?.substring(0, 30) || '(空)',
      status: m.status 
    })))
    
    // 确保滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error: any) {
    console.error('获取消息列表失败:', error)
    
    // 根据错误类型提供更具体的错误信息
    if (error.response && error.response.status === 404) {
      console.error('会话不存在或已被删除')
      // 重新获取会话列表
      await fetchConversations()
      // 如果当前会话不在列表中，创建新会话
      if (!conversations.value.find(c => c.id === conversationId)) {
        console.log('当前会话已不存在，创建新会话')
        await newConversation()
      }
    } else if (error.response && error.response.status >= 500) {
      console.error('服务器错误，请稍后重试')
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('网络连接失败，请检查网络连接')
    }
    
    messages.value = []
  }
}

// 创建新会话
const newConversation = async () => {
  try {
    const response = await post('/conversations', {
      title: '新会话',
      modelId: selectedModelId.value
    })
    
    // 确保conversations.value始终是数组
    if (!Array.isArray(conversations.value)) {
      conversations.value = []
    }
    
    // 正确处理API响应
    let newConv = null
    if (response.data && Array.isArray(response.data)) {
      // 如果返回的是数组，取第一个元素
      newConv = response.data[0]
    } else {
      newConv = response.conversation || response.data?.conversation || response.data
    }
    
    if (newConv && typeof newConv === 'object') {
      conversations.value.unshift(newConv)
      await switchConversation(newConv.id)
      
      // 如果是工作流配置，自动初始化工作流（发送空消息触发guide_word）
      const selectedModel = modelOptions.value.find(m => m.value === selectedModelId.value)
      const isWorkflow = selectedModel?.type === 'workflow'
      
      if (isWorkflow) {
        console.log('检测到工作流配置，自动初始化工作流...')
        // 延迟一下，确保会话切换完成和页面渲染完成
        await nextTick()
        setTimeout(() => {
          initializeWorkflow(newConv.id).catch(err => {
            console.error('工作流初始化失败:', err)
            generating.value = false
          })
        }, 1000) // 增加延迟，确保页面完全加载
      }
    }
  } catch (error) {
    console.error('创建会话失败', error)
    // 确保会话列表在错误情况下仍然是数组
    if (!Array.isArray(conversations.value)) {
      conversations.value = []
    }
  }
}

// 初始化工作流（发送空消息触发工作流的guide_word响应）
const initializeWorkflow = async (conversationId: string): Promise<void> => {
  if (!conversationId) {
    console.warn('初始化工作流失败：会话ID为空')
    return
  }
  
  if (generating.value) {
    console.warn('初始化工作流失败：已有请求正在进行')
    return
  }
  
  const selectedModel = modelOptions.value.find(m => m.value === selectedModelId.value)
  const isWorkflow = selectedModel?.type === 'workflow'
  
  if (!isWorkflow) {
    return
  }
  
  console.log('初始化工作流，会话ID:', conversationId, '工作流ID:', selectedModelId.value)
  
  // 创建AI消息占位符
  const aiMsg: Message = {
    id: (Date.now() + 1).toString(),
    conversationId: conversationId,
    role: 'assistant',
    content: '',
    status: 'sending', // 使用'sending'而不是'generating'
    feedbackStatus: 'none',
    createdAt: new Date().toISOString()
  }
  messages.value.push(aiMsg)
  
  generating.value = true
  
  // 设置超时，确保即使没有收到结束信号也能重置状态
  const timeoutId = setTimeout(() => {
    if (generating.value) {
      console.warn('工作流初始化超时，自动重置状态')
      generating.value = false
      abortController?.abort()
      abortController = null
    }
  }, 30000) // 30秒超时
  
  try {
    // 发送空内容的工作流初始化请求
    abortController = sseRequest(
      {
        url: `/chat/stream`,
        method: 'POST',
        data: { 
          content: '', // 空内容，触发工作流的guide_word
          conversationId: conversationId, 
          workflowId: selectedModelId.value 
        }
      },
      (data) => {
        console.log('收到工作流初始化SSE消息:', JSON.stringify(data, null, 2))
        
        if (data.role === 'assistant') {
          const targetId = data.id || aiMsg.id
          let msgIndex = messages.value.findIndex(m => m.id === targetId)
          
          if (msgIndex === -1) {
            msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
          }
          
          if (msgIndex === -1) {
            const newMsg: Message = {
              id: targetId || aiMsg.id,
              conversationId: conversationId,
              role: 'assistant',
              content: data.content || '',
              status: (data.status === 'generating' ? 'sending' : data.status) || 'sending', // 确保status符合类型定义
              feedbackStatus: 'none',
              createdAt: data.createdAt || new Date().toISOString()
            }
            messages.value.push(newMsg)
            msgIndex = messages.value.length - 1
          }
          
          if (msgIndex !== -1) {
            const newContent = data.content || ''
            // 确保status符合类型定义：'sending' | 'sent' | 'error'
            let newStatus: 'sending' | 'sent' | 'error' = 'sending'
            if (data.status === 'sent' || data.status === 'error') {
              newStatus = data.status
            } else if (data.status === 'generating') {
              newStatus = 'sending'
            }
            
            if (newContent || newStatus === 'sent' || newStatus === 'error') {
              messages.value[msgIndex].content = newContent
              messages.value[msgIndex].status = newStatus
              if (data.id && data.id !== messages.value[msgIndex].id) {
                messages.value[msgIndex].id = data.id
              }
              
              nextTick(() => {
                scrollToBottom()
              })
            }
            
            // 如果消息状态已经是sent，表示初始化完成
            if (newStatus === 'sent' || newStatus === 'error') {
              clearTimeout(timeoutId)
              generating.value = false
              if (abortController) {
                abortController.abort()
                abortController = null
              }
              console.log('工作流初始化完成（消息状态为sent），重置generating状态')
              nextTick(() => {
                scrollToBottom()
                fetchConversations()
              })
              return // 提前返回，避免重复处理
            }
            
            // 如果内容不为空且已经有一段时间没有更新，也认为初始化完成
            if (newContent && newContent.trim().length > 10) {
              // 延迟检查：如果3秒后消息状态还是sending，但内容已经完整，则重置状态
              setTimeout(() => {
                const currentMsg = messages.value[msgIndex]
                if (currentMsg && currentMsg.status === 'sending' && generating.value) {
                  // 如果内容已经完整显示，但状态还是sending，可能是后端没有发送status=sent
                  // 强制设置为sent并重置generating
                  currentMsg.status = 'sent'
                  clearTimeout(timeoutId)
                  generating.value = false
                  if (abortController) {
                    abortController.abort()
                    abortController = null
                  }
                  console.log('工作流初始化完成（内容完整但状态未更新），强制重置generating状态')
                }
              }, 3000)
            }
          }
          
          // 如果状态为sent或error，或者内容不为空且状态不是sending，表示初始化完成
          if (data.status === 'sent' || data.status === 'error') {
            clearTimeout(timeoutId)
            generating.value = false
            if (abortController) {
              abortController.abort()
              abortController = null
            }
            console.log('工作流初始化完成（通过data.status），重置generating状态')
            nextTick(() => {
              scrollToBottom()
              fetchConversations()
            })
          }
        } else if (data.type === 'end' || data.type === 'close' || data.type === 'error') {
          // 处理工作流结束事件
          clearTimeout(timeoutId)
          generating.value = false
          if (abortController) {
            abortController.abort()
            abortController = null
          }
          console.log('工作流初始化完成（通过事件类型），重置generating状态')
        }
        
        // 额外检查：如果收到内容且没有status字段，延迟检查消息状态
        if (data.content && data.content.trim() && !data.status && !data.type) {
          // 延迟检查最后一条消息的状态
          setTimeout(() => {
            const lastMsg = messages.value.find(m => m.role === 'assistant' && m.conversationId === conversationId)
            if (lastMsg && lastMsg.status === 'sent' && generating.value) {
              clearTimeout(timeoutId)
              generating.value = false
              if (abortController) {
                abortController.abort()
                abortController = null
              }
              console.log('工作流初始化完成（延迟检查消息状态），重置generating状态')
            }
          }, 3000) // 3秒后检查
        }
      },
      (error) => {
        console.error('工作流初始化失败:', error)
        clearTimeout(timeoutId)
        generating.value = false
        abortController = null
        
        // 移除占位消息
        const msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
        if (msgIndex !== -1) {
          messages.value.splice(msgIndex, 1)
        }
      }
    )
  } catch (error) {
    console.error('初始化工作流异常:', error)
    clearTimeout(timeoutId)
    generating.value = false
    abortController = null
    
    // 移除占位消息
    const msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
    if (msgIndex !== -1) {
      messages.value.splice(msgIndex, 1)
    }
  }
}

// 获取模型列表
const fetchModels = async () => {
  try {
    const response = await get('/users/models')
    const data = response.data || { items: [], workflows: [] }
    
    // 合并模型和工作流选项
    const models = data.items || []
    const workflows = data.workflows || []
    
    // 转换模型选项
    const modelItems = models.map((model: any) => ({
      label: model.name,
      value: model.id,
      type: 'model'
    }))
    
    // 转换工作流选项
    const workflowItems = workflows.map((workflow: any) => ({
      label: workflow.name,
      value: workflow.id,
      type: 'workflow',
      description: workflow.description
    }))
    
    // 合并所有选项
    modelOptions.value = [...modelItems, ...workflowItems]
    
    // 如果没有选择模型，默认选择第一个
    if (!selectedModelId.value && modelOptions.value.length > 0) {
      selectedModelId.value = modelOptions.value[0].value
    }
  } catch (error) {
    console.error('获取模型列表失败', error)
    // 设置默认选项
    modelOptions.value = [
      { label: '和元智擎-Chat', value: 'default', type: 'model' }
    ]
    selectedModelId.value = 'default'
  }
}

// 切换模型
const handleModelChange = (modelId: string) => {
  console.log('切换模型/工作流:', modelId, '当前选项:', modelOptions.value.find(m => m.value === modelId))
  const selectedModel = modelOptions.value.find(m => m.value === modelId)
  const isWorkflow = selectedModel?.type === 'workflow'
  
  selectedModelId.value = modelId
  // 保存到localStorage
  localStorage.setItem('selectedModelId', modelId)
  
  // 如果切换到工作流，强制创建新会话并自动初始化
  if (isWorkflow && currentConversationId.value) {
    dialog.warning({
      title: '切换工作流',
      content: '切换到工作流配置将创建新的对话并自动初始化，是否继续？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        await newConversation()
        // newConversation内部会自动初始化工作流
      }
    })
  } else if (currentConversationId.value) {
    // 普通模型切换提示
    dialog.warning({
      title: '切换模型',
      content: '切换模型将创建新的对话，是否继续？',
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => {
        newConversation()
      }
    })
  }
}

// 切换会话
const switchConversation = async (conversationId: string) => {
  // 验证会话ID有效性
  if (!conversationId || typeof conversationId !== 'string') {
    console.error('无效的会话ID:', conversationId)
    return
  }
  
  // 检查会话是否存在于列表中
  const targetConversation = conversations.value.find(c => c.id === conversationId)
  if (!targetConversation) {
    console.error('会话不存在于列表中:', conversationId)
    // 重新获取会话列表
    await fetchConversations()
    // 再次检查
    const refreshedConversation = conversations.value.find(c => c.id === conversationId)
    if (!refreshedConversation) {
      console.error('会话在重新获取后仍然不存在，创建新会话')
      await newConversation()
      return
    }
  }
  
  currentConversationId.value = conversationId
  // 保存当前会话ID到localStorage（用于刷新后恢复）
  localStorage.setItem('currentConversationId', conversationId)
  
  // 重置生成状态
  generating.value = false
  // 取消可能的正在进行的请求
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  
  // 注意：不要在这里清空消息，让fetchMessages来处理
  // 这样可以避免在切换会话时出现闪烁
  
  // 加载消息
  console.log('切换会话，开始加载消息，会话ID:', conversationId)
  await fetchMessages(conversationId)
  console.log('切换会话完成，消息数量:', messages.value.length)
}

// 页面初始化
onMounted(async () => {
  console.log('页面初始化开始...')
  // 重置所有状态
  generating.value = false
  abortController = null
  
  // 获取模型列表（必须先获取，因为后面需要用到）
  await fetchModels()
  
  // 从localStorage恢复选择的模型
  const savedModelId = localStorage.getItem('selectedModelId')
  if (savedModelId && modelOptions.value.find(m => m.value === savedModelId)) {
    selectedModelId.value = savedModelId
    console.log('恢复选择的模型:', savedModelId)
  }
  
  // 从localStorage恢复侧边栏状态
  const savedSidebarState = localStorage.getItem('sidebarCollapsed')
  if (savedSidebarState !== null) {
    sidebarCollapsed.value = savedSidebarState === 'true'
  }
  
  // 获取会话列表（必须先获取，才能知道有哪些会话）
  await fetchConversations()
  
  // 从localStorage恢复当前会话ID（用于刷新后恢复）
  const savedConversationId = localStorage.getItem('currentConversationId')
  console.log('保存的会话ID:', savedConversationId, '会话列表数量:', conversations.value.length)
  
  // 如果有保存的会话ID且存在于列表中，切换到该会话
  if (savedConversationId && conversations.value.find(c => c.id === savedConversationId)) {
    console.log('恢复保存的会话:', savedConversationId)
    currentConversationId.value = savedConversationId
    await switchConversation(savedConversationId)
  } else if (conversations.value.length > 0) {
    // 如果有会话列表，选择第一个
    console.log('选择第一个会话:', conversations.value[0].id)
    await switchConversation(conversations.value[0].id)
  } else {
    // 如果没有会话列表，创建新会话
    console.log('没有会话，创建新会话')
    await newConversation()
  }
  
  console.log('页面初始化完成，当前会话ID:', currentConversationId.value, '消息数量:', messages.value.length)
  
  // 确保页面内容可见
  await nextTick()
  console.log('页面渲染完成')
})

// 监听页面可见性变化，处理页面刷新/切换标签页的情况
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // 页面重新可见时，重置生成状态
    generating.value = false
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    
    // 重新获取当前会话的消息，确保状态同步
    if (currentConversationId.value) {
      fetchMessages(currentConversationId.value)
    }
  }
})

// 发送消息
const handleSend = async () => {
  if (!inputContent.value.trim() || !currentConversationId.value) return
  
  const content = inputContent.value.trim()
  inputContent.value = ''
  
  // 添加用户消息
  const userMsg: Message = {
    id: Date.now().toString(),
    conversationId: currentConversationId.value,
    role: 'user',
    content,
    status: 'sent',
    feedbackStatus: 'none',
    createdAt: new Date().toISOString()
  }
  messages.value.push(userMsg)

  // 滚动到底部
  nextTick(() => scrollToBottom())

  // 调用AI回复API
  generating.value = true
  const aiMsg: Message = {
    id: (Date.now() + 1).toString(),
    conversationId: currentConversationId.value,
    role: 'assistant',
    content: '',
    status: 'sending',
    feedbackStatus: 'none',
    createdAt: new Date().toISOString()
  }
  messages.value.push(aiMsg)

  // 滚动到底部
  nextTick(() => scrollToBottom())

  try {
    // 根据模型类型选择输出方式
    const selectedModel = modelOptions.value.find(m => m.value === selectedModelId.value)
    const isWorkflow = selectedModel?.type === 'workflow'
    
    console.log('发送消息 - 选择的模型:', selectedModel, 'isWorkflow:', isWorkflow, 'selectedModelId:', selectedModelId.value)
    
    if (isWorkflow) {
      // Bisheng工作流配置：采用流式输出方式
      // 注意：工作流时传workflowId，让后端识别为工作流模式
      console.log('使用工作流模式，workflowId:', selectedModelId.value)
      abortController = sseRequest(
        {
          url: `/chat/stream`,
          method: 'POST',
          data: { content, conversationId: currentConversationId.value, workflowId: selectedModelId.value }
        },
        (data) => {
          // 后端返回的是完整的消息对象，包含id, conversationId, role, senderId, content, status, createdAt
          console.log('收到SSE消息:', JSON.stringify(data, null, 2))
          
          // 处理用户消息（也需要显示）
          if (data.role === 'user') {
            const userMsgIndex = messages.value.findIndex(m => m.id === data.id)
            if (userMsgIndex === -1) {
              // 新用户消息，添加到列表
              const newUserMsg: Message = {
                id: data.id || Date.now().toString(),
                conversationId: data.conversationId || currentConversationId.value || '',
                role: 'user',
                content: data.content || '',
                status: data.status || 'sent',
                feedbackStatus: 'none',
                createdAt: data.createdAt || new Date().toISOString()
              }
              messages.value.push(newUserMsg)
              console.log('添加用户消息:', newUserMsg)
            } else {
              // 更新现有用户消息
              messages.value[userMsgIndex].content = data.content || ''
              messages.value[userMsgIndex].status = data.status || 'sent'
            }
            nextTick(() => scrollToBottom())
          } else if (data.role === 'assistant') {
            // 更新AI消息内容 - 流式显示
            // 优先使用后端返回的消息ID，如果没有则使用aiMsg.id
            const targetId = data.id || aiMsg.id
            let msgIndex = messages.value.findIndex(m => m.id === targetId)
            
            // 如果找不到，尝试使用aiMsg.id（可能是临时ID）
            if (msgIndex === -1) {
              msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
            }
            
            // 如果还是找不到，可能是新消息，需要添加
            if (msgIndex === -1) {
              console.log('未找到消息，创建新消息，ID:', targetId || aiMsg.id)
              const newMsg: Message = {
                id: targetId || aiMsg.id,
                conversationId: currentConversationId.value || '',
                role: 'assistant',
                content: data.content || '',
                status: (data.status === 'generating' ? 'sending' : (data.status || 'sending')) as 'sending' | 'sent' | 'error',
                feedbackStatus: 'none',
                createdAt: data.createdAt || new Date().toISOString()
              }
              messages.value.push(newMsg)
              msgIndex = messages.value.length - 1
            }
            
            if (msgIndex !== -1) {
              // 流式更新消息内容
              const newContent = data.content || ''
              // 确保status符合类型定义
              let newStatus: 'sending' | 'sent' | 'error' = 'sending'
              if (data.status === 'sent' || data.status === 'error') {
                newStatus = data.status
              } else if (data.status === 'generating') {
                newStatus = 'sending'
              }
              console.log('更新AI消息内容:', newContent.substring(0, 50) + (newContent.length > 50 ? '...' : ''), '状态:', newStatus, '内容长度:', newContent.length, '消息索引:', msgIndex)
              
              // 如果内容不为空，更新消息
              if (newContent || newStatus === 'sent' || newStatus === 'error') {
                messages.value[msgIndex].content = newContent
                messages.value[msgIndex].status = newStatus
                // 如果后端返回了新的ID，更新消息ID
                if (data.id && data.id !== messages.value[msgIndex].id) {
                  messages.value[msgIndex].id = data.id
                }
                
                // 强制更新视图并滚动到底部
                nextTick(() => {
                  scrollToBottom()
                })
              }
            } else {
              console.warn('无法创建或找到AI消息，ID:', targetId || aiMsg.id, '当前消息列表:', messages.value.map(m => m.id))
            }
            
            // 如果状态为sent或error，表示生成完成
            if (data.status === 'sent' || data.status === 'error') {
              generating.value = false
              if (abortController) {
                abortController.abort()
                abortController = null
              }
              console.log('工作流消息生成完成（通过data.status），重置generating状态')
              nextTick(() => {
                scrollToBottom()
                // 更新会话列表
                fetchConversations()
              })
            } else if (data.type === 'end' || data.type === 'close') {
              // 工作流结束事件
              generating.value = false
              if (abortController) {
                abortController.abort()
                abortController = null
              }
              console.log('工作流消息生成完成（通过事件类型），重置generating状态')
              nextTick(() => {
                scrollToBottom()
                fetchConversations()
              })
            }
            
            // 额外检查：如果消息状态已经是sent，也要重置generating
            if (msgIndex !== -1 && messages.value[msgIndex].status === 'sent') {
              generating.value = false
              if (abortController) {
                abortController.abort()
                abortController = null
              }
              console.log('工作流消息生成完成（通过消息状态），重置generating状态')
            }
          } else if (data.role === 'user') {
            // 用户消息，通常不需要更新
            console.log('收到用户消息:', data)
          } else if (data.type === 'error' || (data.code && data.code !== 200)) {
            const msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
            if (msgIndex !== -1) {
              messages.value[msgIndex].status = 'error'
              messages.value[msgIndex].content = data.error || data.message || '生成过程中发生错误，请稍后重试'
            }
            generating.value = false
            console.error(data.error || data.message || '生成失败')
            abortController?.abort()
            abortController = null
          }
        },
        () => {
          const msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
          if (msgIndex !== -1) {
            messages.value[msgIndex].status = 'error'
            messages.value[msgIndex].content = '连接失败，请稍后重试'
          }
          generating.value = false
          console.error('连接失败，请稍后重试')
          abortController?.abort()
          abortController = null
        }
      )
    } else {
      // 大模型配置：直接完整输出回复内容
      const response = await post('/chat', {
        content,
        conversationId: currentConversationId.value,
        modelId: selectedModelId.value
      })
      
      console.log('大模型响应:', response)
      
      // 处理后端返回的消息列表
      if (response && response.code === 201 && response.messages && Array.isArray(response.messages)) {
        // 从响应中提取AI回复消息
        const aiResponse = response.messages.find((msg: any) => msg.role === 'assistant')
        const userResponse = response.messages.find((msg: any) => msg.role === 'user')
        
        // 更新用户消息（如果有新的ID）
        if (userResponse) {
          const userMsgIndex = messages.value.findIndex(m => m.id === aiMsg.id || m.role === 'user')
          if (userMsgIndex !== -1 && messages.value[userMsgIndex].role === 'user') {
            messages.value[userMsgIndex].id = userResponse.id
            messages.value[userMsgIndex].status = 'sent'
          }
        }
        
        // 更新AI消息
        if (aiResponse) {
          const msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
          if (msgIndex !== -1) {
            messages.value[msgIndex].id = aiResponse.id
            messages.value[msgIndex].content = aiResponse.content || '收到回复'
            messages.value[msgIndex].status = aiResponse.status || 'sent'
            messages.value[msgIndex].createdAt = aiResponse.createdAt || new Date().toISOString()
          }
        }
        
        // 更新会话ID（如果返回了新的会话ID）
        if (response.conversationId && response.conversationId !== currentConversationId.value) {
          currentConversationId.value = response.conversationId
        }
        
        // 滚动到底部
        nextTick(() => {
          scrollToBottom()
          // 更新会话列表
          fetchConversations()
        })
      } else if (response && response.data && response.data.content) {
        // 兼容旧格式：response.data.content
        const msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
        if (msgIndex !== -1) {
          messages.value[msgIndex].content = response.data.content || '收到回复'
          messages.value[msgIndex].status = 'sent'
          
          nextTick(() => {
            scrollToBottom()
            fetchConversations()
          })
        }
      } else {
        console.error('响应数据格式错误:', response)
        throw new Error('响应数据格式错误')
      }
      
      generating.value = false
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    const msgIndex = messages.value.findIndex(m => m.id === aiMsg.id)
    if (msgIndex !== -1) {
      messages.value[msgIndex].status = 'error'
      messages.value[msgIndex].content = '发送失败，请稍后重试'
    }
    generating.value = false
  }
}

const pauseGeneration = () => {
  generating.value = false
  abortController?.abort()
  abortController = null
  // 调用API停止生成
  post(`/conversations/${currentConversationId.value}/stop`).catch(error => {
    console.error('停止生成失败', error)
  })
}

// 点赞处理
const handleLike = async (message: Message) => {
  try {
    console.log('点赞消息:', message);
    
    // 调用后端API记录点赞操作 - 使用正确的request函数
    const response = await post(`/messages/${message.id}/action`, {
      action: 'like',
      conversationId: message.conversationId || currentConversationId.value,
      details: '用户点赞了这条消息'
    });
    
    if (response && response.code === 200) {
      message.isLiked = true;
      message.isDisliked = false;
      console.log('点赞成功');
    } else {
      console.error('点赞失败:', response?.error || '未知错误');
    }
  } catch (error) {
    console.error('点赞失败:', error);
  }
};

// 不认可处理
const handleDislike = async (message: Message) => {
  try {
    console.log('不认可消息:', message);
    
    // 调用后端API记录不认可操作 - 使用正确的request函数
    const response = await post(`/messages/${message.id}/action`, {
      action: 'dislike',
      conversationId: message.conversationId || currentConversationId.value,
      details: '用户不认可这条消息'
    });
    
    if (response && response.code === 200) {
      message.isLiked = false;
      message.isDisliked = true;
      console.log('不认可成功');
    } else {
      console.error('不认可失败:', response?.error || '未知错误');
    }
  } catch (error) {
    console.error('不认可失败:', error);
  }
};

const handleCopy = async (content: string) => {
  try {
    await navigator.clipboard.writeText(content)
    message.success('复制成功')
    
    // 记录用户操作日志
    const currentMsg = messages.value.find(m => m.content === content && m.role === 'assistant')
    if (currentMsg) {
      await post(`/messages/${currentMsg.id}/action`, { 
        action: 'copy',
        timestamp: new Date().toISOString(),
        messageId: currentMsg.id,
        conversationId: currentConversationId.value
      }).catch(error => {
        console.error('复制操作记录失败', error)
      })
    }
  } catch (error) {
    console.error('复制失败:', error)
    message.error('复制失败，请手动复制')
  }
}

const handleForward = async (msgId: string) => {
  // 复制当前聊天对话页面的URL
  const currentUrl = window.location.href
  try {
    await navigator.clipboard.writeText(currentUrl)
    message.success('对话链接已复制到剪贴板')
    
    // 记录用户操作日志
    await post(`/messages/${msgId}/action`, { 
      action: 'forward',
      timestamp: new Date().toISOString(),
      messageId: msgId,
      conversationId: currentConversationId.value,
      url: currentUrl
    })
  } catch (err) {
    console.error('复制链接失败:', err)
    message.error('复制链接失败，请手动复制')
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}

// 添加下拉菜单选项
const dropdownOptions = [
  {
    label: '退出登录',
    key: 'logout'
  }
]

// 添加下拉菜单选择处理
const handleDropdownSelect = (key: string) => {
  if (key === 'logout') {
    handleLogout()
  }
}

const handleFeedback = () => {
  router.push('/feedback')
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
}

// 删除会话（软删除，用户看不到但后台和数据库还有）
const handleDeleteConversation = async (conversationId: string) => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个会话吗？删除后您将无法看到此会话，但数据仍会保留在系统中。',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        // 调用后端API删除会话（软删除）
        await del(`/conversations/${conversationId}`)
        message.success('会话已删除')
        
        // 从列表中移除
        const index = conversations.value.findIndex(c => c.id === conversationId)
        if (index !== -1) {
          conversations.value.splice(index, 1)
        }
        
        // 如果删除的是当前会话，切换到其他会话或创建新会话
        if (currentConversationId.value === conversationId) {
          if (conversations.value.length > 0) {
            await switchConversation(conversations.value[0].id)
          } else {
            await newConversation()
          }
        }
      } catch (error) {
        console.error('删除会话失败:', error)
        message.error('删除会话失败')
      }
    }
  })
}

// 处理会话右键菜单
const handleConversationContextMenu = (_event: MouseEvent, conv: Conversation) => {
  // 可以在这里添加右键菜单功能
  console.log('右键点击会话:', conv)
}

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const getConversationAvatar = (title: string | undefined) => {
  if (!title || !title.trim()) {
    return '会'
  }
  return title.trim().charAt(0).toUpperCase()
}

const formatMessageContent = (content: string | null | undefined) => {
  // 处理空内容
  if (!content || content.trim() === '') {
    return '<span style="color: #999;">(空消息)</span>'
  }
  // 简单的换行处理和HTML转义
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #F5F7FA;
  position: relative;
  overflow: hidden; /* 防止页面滚动 */
}

/* 左侧侧边栏 */
.sidebar {
  width: 280px;
  background-color: #FFFFFF;
  border-right: 1px solid #EBEEF5;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  transition: width 0.3s ease;
  position: relative;
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar.collapsed .current-model {
  display: none;
}

.sidebar.collapsed .sidebar-content {
  padding: 12px 8px;
}

.sidebar.collapsed .user-section {
  padding: 8px;
}

.sidebar.collapsed .user-info {
  justify-content: center;
}

.sidebar.collapsed .username {
  display: none;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.collapse-btn {
  align-self: flex-end;
}

.sidebar.collapsed .new-conversation-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  padding: 0;
}

.new-conversation-btn {
  border-radius: 8px;
  height: 40px;
  font-size: 14px;
  background: linear-gradient(90deg, #1677FF 0%, #40a9ff 100%);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.2);
}

.new-conversation-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 当前模型信息 */
.current-model {
  background-color: #F8F9FA;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.model-label {
  font-size: 12px;
  color: #86909C;
  margin-bottom: 4px;
}

.model-selector {
  margin-bottom: 8px;
}

.model-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.model-status {
  margin-top: 8px;
}

/* 历史会话列表 */
.conversations-section {
  margin-top: 16px;
}

.section-title {
  font-size: 12px;
  color: #86909C;
  margin: 16px 0 8px;
  font-weight: 600;
}

.conversation-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  background-color: #F8F9FA;
  border: 1px solid #EBEEF5;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.conversation-item:hover {
  background-color: #ECF5FF;
  transform: translateX(4px);
}

.conversation-item:hover .conv-actions {
  opacity: 1;
  visibility: visible;
}

.conversation-item.active {
  background-color: #ECF5FF;
  border-color: #1677FF;
}

.conv-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5e72e4 0%, #764ba2 100%);
  color: #FFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
}

.conv-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.conv-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 12px;
  color: #86909C;
}

.conv-actions {
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  margin-left: 8px;
  flex-shrink: 0;
}

.delete-btn {
  color: #f5365c;
}

.delete-btn:hover {
  background-color: #f5365c;
  color: white;
}

.sidebar.collapsed .conv-content,
.sidebar.collapsed .conv-actions {
  display: none;
}

/* 底部用户信息 */
.user-section {
  padding: 16px;
  border-top: 1px solid #EBEEF5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.user-info:hover {
  background-color: #F8F9FA;
}

.username {
  font-size: 14px;
  font-weight: 500;
}

/* 主对话区样式 */
.main-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
}

/* 顶部导航栏 */
.chat-header {
  height: 64px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
}

.chat-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #1D2129;
}

.header-right {
  display: flex;
  align-items: center;
}

.feedback-btn {
  transition: all 0.2s ease;
}

.feedback-btn:hover {
  color: #1677FF;
}

/* 对话流 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #F5F7FA;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #86909C;
}

/* 统一对话框内的左右分栏布局 */
.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100px; /* 确保容器有最小高度 */
}

.message-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.message-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 0 0 auto;
  max-width: 80%;
}

.message-right {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 0 0 auto;
  max-width: 80%;
  margin-left: auto;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  flex: 1;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  max-width: 100%;
}

.user-bubble {
  background: linear-gradient(135deg, #1677FF 0%, #40a9ff 100%);
  color: white;
}

.assistant-bubble {
  background-color: #FFFFFF;
  color: #1D2129;
  border: 1px solid #EBEEF5;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.typing-cursor {
  animation: blink 1s infinite;
  font-weight: bold;
  color: #1677FF;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease;
}

.message-actions:hover {
  opacity: 1;
}

.pause-container {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

/* 输入区域 */
.input-area {
  background-color: #FFFFFF;
  border-top: 1px solid #EBEEF5;
}

.ai-disclaimer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 24px;
  background-color: #F8F9FA;
  border-bottom: 1px solid #EBEEF5;
}

.disclaimer-text {
  font-size: 12px;
  color: #86909C;
  font-style: italic;
}

.input-container {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.chat-input:focus-within {
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
}

.send-button {
  border-radius: 12px;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
  background: linear-gradient(90deg, #1677FF 0%, #40a9ff 100%);
  border: none;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 135, 84, 0.3);
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

.input-hint {
  text-align: center;
  font-size: 12px;
  color: #86909C;
  padding: 8px 0;
  background-color: #FFFFFF;
  border-top: 1px solid #EBEEF5;
}

/* 右下角反馈按钮 */
.feedback-button-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.feedback-button {
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 12px;
  padding: 0 12px;
  white-space: nowrap;
  animation: pulse 2s infinite;
  background: linear-gradient(90deg, #1677FF 0%, #40a9ff 100%);
  border: none;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(22, 119, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(22, 119, 255, 0);
  }
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar,
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.messages-container::-webkit-scrollbar-track,
.sidebar-content::-webkit-scrollbar-track {
  background: #F5F7FA;
}

.messages-container::-webkit-scrollbar-thumb,
.sidebar-content::-webkit-scrollbar-thumb {
  background: #C0C4CC;
  border-radius: 3px;
}

.messages-container::-webkit-scrollbar-thumb:hover,
.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #909399;
}
</style>