<template>
  <div class="action-logs-container">
    <!-- 背景动画元素 -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title-wrapper">
          <svg class="page-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M14 9V5L21 3V7L14 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 9L21 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3 21V11C3 9.89543 3.89543 9 5 9H10C11.1046 9 12 9.89543 12 11V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 15V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h2 class="page-title">用户操作日志</h2>
        </div>
        <n-breadcrumb>
          <n-breadcrumb-item>日志管理</n-breadcrumb-item>
          <n-breadcrumb-item>用户操作日志</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <n-grid :cols="24" :x-gap="16">
        <n-gi :span="4">
          <n-card class="stat-card total" :bordered="false">
            <n-statistic label="总操作数" :value="stats.total">
              <template #prefix>
                <n-icon size="18" color="#5e72e4">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="5">
          <n-card class="stat-card like" :bordered="false">
            <n-statistic label="点赞" :value="stats.like">
              <template #prefix>
                <n-icon size="18" color="#2dce89">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="5">
          <n-card class="stat-card dislike" :bordered="false">
            <n-statistic label="不认可" :value="stats.dislike">
              <template #prefix>
                <n-icon size="18" color="#f5365c">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="5">
          <n-card class="stat-card copy" :bordered="false">
            <n-statistic label="复制" :value="stats.copy">
              <template #prefix>
                <n-icon size="18" color="#fb6340">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="5">
          <n-card class="stat-card forward" :bordered="false">
            <n-statistic label="转发" :value="stats.forward">
              <template #prefix>
                <n-icon size="18" color="#11cdef">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
      </n-grid>
    </div>

    <!-- 搜索区域 -->
    <n-card class="search-card">
      <n-form :model="searchForm" label-placement="left" label-width="80">
        <n-grid :cols="24" :x-gap="24">
          <n-form-item-gi :span="6" label="操作类型">
            <n-select
              v-model:value="searchForm.action"
              placeholder="请选择操作类型"
              clearable
              :options="actionOptions"
              @clear="handleSearch"
              class="search-select"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="用户名">
            <n-input
              v-model:value="searchForm.username"
              placeholder="请输入用户名"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              class="search-input"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="12">
            <n-space>
              <n-button type="primary" @click="handleSearch" class="search-btn">
                搜索
              </n-button>
              <n-button @click="handleReset" class="reset-btn">
                重置
              </n-button>
            </n-space>
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-card>

    <!-- 日志表格 -->
    <n-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <h3>操作日志列表</h3>
          <n-tag type="info" round>共 {{ pagination.itemCount }} 条记录</n-tag>
        </div>
      </div>

      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="1200"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        class="action-log-table"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage, NTag } from 'naive-ui'
import { get } from '../utils/api'

const message = useMessage()

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 统计数据
const stats = reactive({
  total: 0,
  like: 0,
  dislike: 0,
  copy: 0,
  forward: 0
})

// 搜索表单
const searchForm = reactive({
  action: null,
  username: ''
})

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 操作类型选项
const actionOptions = [
  { label: '点��', value: 'like' },
  { label: '不认可', value: 'dislike' },
  { label: '复制', value: 'copy' },
  { label: '转发', value: 'forward' }
]

// 表格列定义
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    title: '用户名',
    key: 'username',
    width: 120
  },
  {
    title: '操作类型',
    key: 'action',
    width: 100,
    render(row: any) {
      const actionMap: { [key: string]: { type: string; text: string } } = {
        like: { type: 'success', text: '点赞' },
        dislike: { type: 'error', text: '不认可' },
        copy: { type: 'warning', text: '复制' },
        forward: { type: 'info', text: '转发' }
      }
      const actionInfo = actionMap[row.action] || { type: 'default', text: row.action || '未知' }
      return h(NTag, { type: actionInfo.type, size: 'small' }, () => actionInfo.text)
    }
  },
  {
    title: '消息ID',
    key: 'messageId',
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: '会话ID',
    key: 'conversationId',
    width: 120,
    ellipsis: { tooltip: true }
  },
  {
    title: '详情',
    key: 'details',
    width: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: 'IP地址',
    key: 'ipAddress',
    width: 130
  },
  {
    title: '操作时间',
    key: 'createdAt',
    width: 170,
    render(row: any) {
      return h('span', {}, row.createdAt ? new Date(row.createdAt).toLocaleString() : '-')
    }
  }
]

// 获取操作日志列表
const fetchActionLogs = async () => {
  loading.value = true
  try {
    const queryParams: any = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (searchForm.action) queryParams.action = searchForm.action
    if (searchForm.username) queryParams.username = searchForm.username

    console.log('请求操作日志列表，参数:', queryParams)
    const response = await get('/admin/action-logs', queryParams)
    console.log('操作日志列表响应:', response)

    if (response && response.code === 200) {
      if (response.data && response.data.logs) {
        tableData.value = response.data.logs
        pagination.itemCount = response.data.pagination?.total || 0
        console.log('成功获取操作日志列表，数量:', tableData.value.length)
      } else {
        tableData.value = []
        pagination.itemCount = 0
      }
    } else {
      tableData.value = []
      pagination.itemCount = 0
      console.error('获取��作日志列表失败:', response)
      message.error(response?.error || response?.message || '获取操作日志列表失败')
    }
  } catch (error) {
    console.error('获取操作日志列表失败', error)
    message.error('获取操作日志列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchActionLogStats = async () => {
  try {
    const response = await get('/admin/action-logs/stats')
    if (response && response.code === 200 && response.data) {
      stats.total = response.data.total || 0
      stats.like = response.data.like || 0
      stats.dislike = response.data.dislike || 0
      stats.copy = response.data.copy || 0
      stats.forward = response.data.forward || 0
    }
  } catch (error) {
    console.error('获取操作日志统计数据失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchActionLogs()
}

// 重置
const handleReset = () => {
  searchForm.action = null
  searchForm.username = ''
  pagination.page = 1
  fetchActionLogs()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchActionLogs()
}

// 每页数量变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchActionLogs()
}

// 组件挂载
onMounted(() => {
  fetchActionLogs()
  fetchActionLogStats()
})
</script>

<style scoped>
.action-logs-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 背景动画元素 */
.bg-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -150px;
  right: -150px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -100px;
  left: -100px;
  animation-delay: 2s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  right: 10%;
  animation-delay: 4s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  top: 20%;
  left: -125px;
  animation-delay: 6s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-20px) rotate(5deg);
  }
  50% {
    transform: translateY(10px) rotate(-5deg);
  }
  75% {
    transform: translateY(-15px) rotate(3deg);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-icon {
  color: #667eea;
  flex-shrink: 0;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-cards {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.stat-card {
  transition: all 0.3s ease;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.search-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.search-input, .search-select {
  transition: all 0.3s ease;
}

.search-input:hover, .search-select:hover {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.search-btn, .reset-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.search-btn:hover, .reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.action-log-table {
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .action-logs-container {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .action-logs-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .shape {
    display: none;
  }
}
</style>
