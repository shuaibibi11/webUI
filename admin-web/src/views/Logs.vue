<template>
  <div class="logs-container">
    <!-- 页面标题和操作区域 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">日志管理</h2>
        <n-breadcrumb>
          <n-breadcrumb-item>系统管理</n-breadcrumb-item>
          <n-breadcrumb-item>日志管理</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="header-right">
        <n-button type="primary" @click="handleExport" :icon="downloadIcon" class="export-btn">
          导出日志数据
        </n-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <n-card class="search-card">
      <n-form :model="searchForm" label-placement="left" label-width="80">
        <n-grid :cols="24" :x-gap="24">
          <n-form-item-gi :span="8" label="用户ID">
            <n-input
              v-model:value="searchForm.userId"
              placeholder="请输入用户ID"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="8" label="操作类型">
            <n-select
              v-model:value="searchForm.action"
              placeholder="请选择操作类型"
              clearable
              :options="actionOptions"
              @clear="handleSearch"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="8" label="IP地址">
            <n-input
              v-model:value="searchForm.ip"
              placeholder="请输入IP地址"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="8" label="时间范围">
            <n-date-picker
              v-model:value="searchForm.dateRange"
              type="daterange"
              clearable
              @clear="handleSearch"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="排序">
            <n-select
              v-model:value="searchForm.sortOrder"
              :options="sortOptions"
              @update:value="handleSearch"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="10">
            <n-space>
              <n-button type="primary" @click="handleSearch" :icon="searchIcon">
                搜索
              </n-button>
              <n-button @click="handleReset" :icon="refreshIcon">
                重置
              </n-button>
            </n-space>
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-card>

    <!-- 日志数据表格 -->
    <n-card class="table-card">
      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="1200"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@vicons/tabler'
import { get } from '../utils/api'

const message = useMessage()

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  userId: '',
  action: null,
  ip: '',
  dateRange: null,
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
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 操作类型选项
const actionOptions = [
  { label: '登录', value: 'login' },
  { label: '登出', value: 'logout' },
  { label: '创建对话', value: 'create_conversation' },
  { label: '发送消息', value: 'send_message' },
  { label: '提交反馈', value: 'submit_feedback' },
  { label: '其他', value: 'other' }
]

// 表格列定义
const columns = [
  {
    title: 'ID',
    key: 'id',
    width: 80,
    fixed: 'left'
  },
  {
    title: '用户ID',
    key: 'userId',
    width: 150,
    fixed: 'left'
  },
  {
    title: '操作类型',
    key: 'action',
    width: 120,
    render(row: any) {
      const actionMap = {
        login: { type: 'success', text: '登录' },
        logout: { type: 'info', text: '登出' },
        create_conversation: { type: 'primary', text: '创建对话' },
        send_message: { type: 'primary', text: '发送消息' },
        submit_feedback: { type: 'warning', text: '提交反馈' },
        other: { type: 'default', text: '未知' }
      } as Record<string, { type: string; text: string }>
      const action = actionMap[row.action] || { type: 'default', text: '未知' }
      return h('n-tag', { type: action.type }, () => action.text)
    }
  },
  {
    title: 'IP地址',
    key: 'ip',
    width: 150
  },
  {
    title: '详情',
    key: 'details',
    width: 300,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render(row: any) {
      return new Date(row.createdAt).toLocaleString()
    }
  }
]

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    // 构建查询参数 - 后端支持 page, limit, query, sortOrder
    const params: Record<string, any> = {
      page: pagination.page,
      limit: pagination.pageSize,
      sortOrder: searchForm.sortOrder
    }

    // 如果有��户ID或操作类型，使用query参数
    if (searchForm.userId) {
      params.query = searchForm.userId
    } else if (searchForm.action) {
      params.query = searchForm.action
    }

    console.log('搜索参数:', params)
    const response = await get('/admin/logs', params)
    tableData.value = response.data?.logs || []
    pagination.itemCount = response.data?.pagination?.total || 0
  } catch (error) {
    console.error('获取日志列表失败', error)
    message.error('获取日志列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

// 重置
const handleReset = () => {
  searchForm.userId = ''
  searchForm.action = null
  searchForm.ip = ''
  searchForm.dateRange = null
  searchForm.sortOrder = 'desc'
  pagination.page = 1
  fetchLogs()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchLogs()
}

// 每页数量变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchLogs()
}

// 导出日志数据
const handleExport = async () => {
  try {
    // 获取所有符合当前筛选条件的日志数据
    const params = {
      userId: searchForm.userId,
      action: searchForm.action,
      ip: searchForm.ip,
      startDate: searchForm.dateRange ? searchForm.dateRange[0] : null,
      endDate: searchForm.dateRange ? searchForm.dateRange[1] : null,
      export: true // 标识为导出请求
    }

    const response = await get('/admin/logs/export', {
      params,
      responseType: 'blob'
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    message.success('日志导出成功')
  } catch (error) {
    console.error('导出失败', error)
    
    // 如果服务端不支持导出接口，则使用前端导出
    if (tableData.value.length === 0) {
      message.warning('没有可导出的日志')
      return
    }
    
    let csv = 'ID,用户ID,操作类型,IP地址,详情,创建时间\n'
    tableData.value.forEach((log: any) => {
      const actionText = actionOptions.find(opt => opt.value === log.action)?.label || log.action
      csv += `${log.id},${log.userId},${actionText},${log.ip},"${log.details}",${log.createdAt}\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    message.warning('使用前端导出，建议优化后端导出功能')
  }
}

// 图标定义
const downloadIcon = () => h(DownloadIcon)
const searchIcon = () => h(SearchIcon)
const refreshIcon = () => h(RefreshIcon)

// 组件挂载时获取数据
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.logs-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
}

.export-btn {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.search-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logs-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-right {
    width: 100%;
  }
  
  .export-btn {
    width: 100%;
  }
}
</style>