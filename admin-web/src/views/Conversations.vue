<template>
  <div class="conversations-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">对话历史管理</h1>
        <p class="page-description">查看和管理所有用户的对话记录</p>
      </div>
      <div class="header-actions">
        <n-button type="primary" @click="handleExport" :loading="exportLoading">
          <template #icon>
            <n-icon><DownloadIcon /></n-icon>
          </template>
          导出对话记录
        </n-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <n-card class="search-card">
        <n-form :model="searchForm" inline>
          <n-form-item label="用户名">
            <n-input v-model:value="searchForm.username" placeholder="请输入用户名" clearable />
          </n-form-item>
          <n-form-item label="对话标题">
            <n-input v-model:value="searchForm.title" placeholder="请输入对话标题" clearable />
          </n-form-item>
          <n-form-item label="创建时间">
            <n-date-picker
              v-model:value="searchForm.dateRange"
              type="daterange"
              clearable
              format="yyyy-MM-dd"
            />
          </n-form-item>
          <n-form-item label="排序">
            <n-select
              v-model:value="searchForm.sortOrder"
              :options="sortOptions"
              style="width: 140px"
            />
          </n-form-item>
          <n-form-item>
            <n-button type="primary" @click="handleSearch">
              <template #icon>
                <n-icon><SearchIcon /></n-icon>
              </template>
              搜索
            </n-button>
            <n-button @click="handleReset">
              <template #icon>
                <n-icon><RefreshIcon /></n-icon>
              </template>
              重置
            </n-button>
          </n-form-item>
        </n-form>
      </n-card>
    </div>

    <!-- 对话列表区域 -->
    <div class="table-section">
      <n-card class="table-card">
        <n-data-table
          v-loading="loading"
          :columns="columns"
          :data="tableData"
          :pagination="pagination"
          :scroll-x="1200"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </n-card>
    </div>

    <!-- 消息详情模态框 -->
    <n-modal
      v-model:show="messageModalVisible"
      preset="dialog"
      title="对话消息详情"
      style="width: 70%; max-width: 900px;"
    >
      <div class="message-container">
        <div class="conversation-info">
          <h3>{{ currentConversation.title }}</h3>
          <p>用户: {{ currentConversation.username }} | 对话ID: {{ currentConversation.id }}</p>
        </div>
        <div class="message-list" v-loading="messageLoading">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }"
          >
            <div class="message-header">
              <span class="message-role">{{ message.role === 'user' ? '用户' : 'AI助手' }}</span>
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
            <div class="message-footer" v-if="message.promptTokens || message.completionTokens || message.totalTokens">
              <span class="token-info">Tokens: {{ message.totalTokens || ((message.promptTokens || 0) + (message.completionTokens || 0)) }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #action>
        <n-button @click="messageModalVisible = false">关闭</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import {
  Eye as ViewIcon,
  Trash as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@vicons/tabler'
import { get, del } from '../utils/api'

// 类型定义
interface Conversation {
  id: string
  title: string
  username: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

const message = useMessage()
const dialog = useDialog()

// 响应式数据
const loading = ref(false)
const exportLoading = ref(false)
const messageLoading = ref(false)
const tableData = ref<Conversation[]>([])
const messages = ref<Message[]>([])
const messageModalVisible = ref(false)
const currentConversation = ref<Conversation>({} as Conversation)
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 搜索表单
const searchForm = reactive({
  username: '',
  title: '',
  dateRange: null as any,
  sortOrder: 'desc' as string
})

// 排序选项
const sortOptions = [
  { label: '最新优先', value: 'desc' },
  { label: '最早优先', value: 'asc' }
]

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 表格列定义
const columns = [
  {
    title: '对话ID',
    key: 'id',
    width: 220,
    fixed: 'left',
    className: 'id-column'
  },
  {
    title: '用户名',
    key: 'username',
    width: 120,
    fixed: 'left',
    className: 'username-column'
  },
  {
    title: '对话标题',
    key: 'title',
    minWidth: 200,
    className: 'title-column',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '消息数量',
    key: 'messageCount',
    width: 100,
    align: 'center' as const,
    className: 'count-column'
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    className: 'date-column',
    render(row: Conversation) {
      return formatTime(row.createdAt)
    }
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    className: 'date-column',
    render(row: Conversation) {
      return formatTime(row.updatedAt)
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right' as const,
    className: 'actions-column',
    render(row: Conversation) {
      return h('div', { class: 'action-buttons' }, [
        h(
          'n-button',
          {
            size: 'small',
            type: 'primary',
            onClick: () => viewMessages(row)
          },
          { default: () => [
              h('n-icon', { style: { marginRight: '4px' } }, { default: () => h(ViewIcon) }),
              '查看消息'
            ]
          }
        ),
        h(
          'n-button',
          {
            size: 'small',
            type: 'error',
            style: { marginLeft: '8px' },
            onClick: () => deleteConversation(row)
          },
          { default: () => [
              h('n-icon', { style: { marginRight: '4px' } }, { default: () => h(DeleteIcon) }),
              '删除'
            ]
          }
        )
      ])
    }
  }
]

// 获取对话列表
const fetchConversations = async () => {
  loading.value = true
  try {
    // 构建查询参数 - 后端支持 page, limit, query(标题搜索), sortOrder
    const params: Record<string, any> = {
      page: pagination.page,
      limit: pagination.pageSize,
      sortOrder: searchForm.sortOrder
    }

    // 如果有标题搜索，使用query参数
    if (searchForm.title) {
      params.query = searchForm.title
    }

    console.log('搜索参数:', params)
    const response = await get<any>('/admin/conversations', params)
    
    if (response && response.code === 200) {
      tableData.value = response.data?.conversations || []
      pagination.itemCount = response.data?.pagination?.total || 0
    } else {
      message.error(response?.message || '获取对话列表失败')
    }
  } catch (error) {
    console.error('获取对话列表错误:', error)
    message.error('获取对话列表失败')
  } finally {
    loading.value = false
  }
}

// 获取对话消息
const fetchMessages = async (conversationId: string) => {
  messageLoading.value = true
  try {
    const response = await get<any>(`/admin/conversations/${conversationId}/messages`)
    
    if (response && response.code === 200) {
      messages.value = response.data?.messages || []
    } else {
      message.error(response?.message || '获取消息列表失败')
    }
  } catch (error) {
    console.error('获取消息列表错误:', error)
    message.error('获取消息列表失败')
  } finally {
    messageLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchConversations()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.title = ''
  searchForm.dateRange = null
  searchForm.sortOrder = 'desc'
  pagination.page = 1
  fetchConversations()
}

// 分页处理
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchConversations()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchConversations()
}

// 查看消息
const viewMessages = (row: Conversation) => {
  currentConversation.value = row
  messageModalVisible.value = true
  fetchMessages(row.id)
}

// 删除对话
const deleteConversation = (row: Conversation) => {
  dialog.warning({
    title: '删除确认',
    content: `确定要删除对话 "${row.title}" 吗？此操作不可恢复！`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await del<any>(`/admin/conversations/${row.id}`)
        
        if (response && response.code === 200) {
          message.success('对话删除成功')
          fetchConversations()
        } else {
          message.error(response?.message || '删除对话失败')
        }
      } catch (error) {
        console.error('删除对话错误:', error)
        message.error('删除对话失败')
      }
    }
  })
}

// 导出对话记录
const handleExport = async () => {
  exportLoading.value = true
  try {
    const params: any = {
      username: searchForm.username,
      title: searchForm.title
    }

    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      params.startDate = formatDateForApi(searchForm.dateRange[0])
      params.endDate = formatDateForApi(searchForm.dateRange[1])
    }

    const response = await get<any>('/admin/conversations/export', params)
    
    if (response && response.code === 200) {
      // 创建下载链接
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `conversations_${new Date().toISOString().slice(0,10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      message.success('对话记录导出成功')
    } else {
      message.error(response?.message || '导出对话记录失败')
    }
  } catch (error) {
    console.error('导出对话记录错误:', error)
    message.error('导出对话记录失败')
  } finally {
    exportLoading.value = false
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化日期为API所需格式
const formatDateForApi = (date: number) => {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

// 组件挂载时获取数据并启动自动刷新
onMounted(() => {
  fetchConversations()
  // 每5秒自动刷新一次对话列表
  refreshTimer = setInterval(() => {
    fetchConversations()
  }, 5000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.conversations-container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
}

/* 背景动画元素 */
.conversations-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(255, 119, 198, 0.1) 0%, transparent 50%);
  z-index: -1;
}

/* 页面标题区域 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 16px;
  color: #7f8c8d;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 20px;
}

.search-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 表格区域 */
.table-section {
  margin-bottom: 20px;
}

.table-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 消息详情模态框 */
.message-container {
  max-height: 60vh;
  overflow-y: auto;
}

.conversation-info {
  padding: 16px;
  border-bottom: 1px solid #eee;
  margin-bottom: 16px;
}

.conversation-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #2c3e50;
}

.conversation-info p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.message-list {
  padding: 0 16px;
}

.message-item {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f9f9f9;
}

.user-message {
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.assistant-message {
  background: #f3e5f5;
  border-left: 4px solid #9c27b0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.message-role {
  font-weight: 600;
  color: #2c3e50;
}

.message-time {
  color: #7f8c8d;
  font-size: 12px;
}

.message-content {
  margin-bottom: 8px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-footer {
  text-align: right;
}

.token-info {
  font-size: 12px;
  color: #7f8c8d;
  background: #eee;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .search-card :deep(.n-form) {
    flex-direction: column;
  }
  
  .search-card :deep(.n-form-item) {
    margin-right: 0;
    margin-bottom: 12px;
  }
}
</style>