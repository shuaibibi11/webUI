<template>
  <div class="password-resets-container">
    <!-- 背景动画元素 -->
    <div class="bg-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
    </div>

    <!-- 页面标题和操作区域 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title-wrapper">
          <svg class="page-icon" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 17V15M12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M5 12H3M21 12H19M12 5V3M12 21V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.364 5.636L16.95 7.05M7.05 16.95L5.636 18.364M18.364 18.364L16.95 16.95M7.05 7.05L5.636 5.636" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h2 class="page-title">密码重置审批</h2>
        </div>
        <n-breadcrumb>
          <n-breadcrumb-item>系统管理</n-breadcrumb-item>
          <n-breadcrumb-item>密码重置审批</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="header-right">
        <n-space>
          <n-button @click="fetchData" :loading="loading">
            <template #icon>
              <n-icon><RefreshIcon /></n-icon>
            </template>
            刷新
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <n-grid :cols="24" :x-gap="16">
        <n-gi :span="6">
          <n-card class="stat-card total" :bordered="false">
            <n-statistic label="总申请数" :value="stats.total">
              <template #prefix>
                <n-icon size="18" color="#5e72e4">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="6">
          <n-card class="stat-card pending" :bordered="false">
            <n-statistic label="待审核" :value="stats.pending">
              <template #prefix>
                <n-icon size="18" color="#fb6340">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="6">
          <n-card class="stat-card approved" :bordered="false">
            <n-statistic label="已通过" :value="stats.approved">
              <template #prefix>
                <n-icon size="18" color="#2dce89">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="6">
          <n-card class="stat-card rejected" :bordered="false">
            <n-statistic label="已拒绝" :value="stats.rejected">
              <template #prefix>
                <n-icon size="18" color="#f5365c">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
      </n-grid>
    </div>

    <!-- 筛选区域 -->
    <n-card class="filter-card">
      <n-space>
        <n-select
          v-model:value="filterStatus"
          placeholder="状态筛选"
          clearable
          :options="statusOptions"
          style="width: 150px"
          @update:value="handleFilterChange"
        />
        <n-button type="primary" @click="fetchData">筛选</n-button>
        <n-button @click="handleReset">重置</n-button>
      </n-space>
    </n-card>

    <!-- 数据表格 -->
    <n-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <h3>密码重置申请列表</h3>
          <n-tag type="info" round>共 {{ pagination.itemCount }} 条记录</n-tag>
        </div>
      </div>

      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="1200"
        :row-key="(row: any) => row.id"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        class="data-table"
      />
    </n-card>

    <!-- 审批备注模态框 -->
    <n-modal v-model:show="remarkModalVisible" preset="dialog" :title="remarkModalTitle">
      <n-form :model="remarkForm" label-placement="left" label-width="80">
        <n-form-item label="备注">
          <n-input
            v-model:value="remarkForm.remark"
            type="textarea"
            placeholder="请输入审批备注（可选）"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="remarkModalVisible = false">取消</n-button>
          <n-button :type="remarkForm.action === 'approve' ? 'success' : 'error'" @click="submitAction" :loading="actionLoading">
            {{ remarkForm.action === 'approve' ? '确认通过' : '确认拒绝' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 详情模态框 -->
    <n-modal v-model:show="detailModalVisible" preset="card" title="申请详情" style="width: 600px;">
      <n-descriptions :column="2" bordered v-if="currentItem">
        <n-descriptions-item label="申请ID">{{ currentItem.id }}</n-descriptions-item>
        <n-descriptions-item label="状态">
          <n-tag :type="getStatusType(currentItem.status)">{{ getStatusText(currentItem.status) }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="用户名">{{ currentItem.username }}</n-descriptions-item>
        <n-descriptions-item label="真实姓名">{{ currentItem.realName || '-' }}</n-descriptions-item>
        <n-descriptions-item label="手机号">{{ currentItem.phone || '-' }}</n-descriptions-item>
        <n-descriptions-item label="邮箱">{{ currentItem.email || '-' }}</n-descriptions-item>
        <n-descriptions-item label="联系方式" :span="2">{{ currentItem.contact || '-' }}</n-descriptions-item>
        <n-descriptions-item label="申请时间" :span="2">{{ formatDate(currentItem.createdAt) }}</n-descriptions-item>
        <n-descriptions-item label="过期时间" :span="2">{{ formatDate(currentItem.expiresAt) }}</n-descriptions-item>
        <n-descriptions-item v-if="currentItem.processedAt" label="处理时间" :span="2">{{ formatDate(currentItem.processedAt) }}</n-descriptions-item>
        <n-descriptions-item v-if="currentItem.processRemark" label="审批备注" :span="2">{{ currentItem.processRemark }}</n-descriptions-item>
      </n-descriptions>
      <template #footer>
        <n-space justify="end">
          <n-button @click="detailModalVisible = false">关闭</n-button>
          <template v-if="currentItem && currentItem.status === 'pending'">
            <n-button type="error" @click="showRemarkModal(currentItem, 'reject')">拒绝</n-button>
            <n-button type="success" @click="showRemarkModal(currentItem, 'approve')">通过</n-button>
          </template>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage, useDialog, NButton, NTag, NSpace } from 'naive-ui'
import { Refresh as RefreshIcon } from '@vicons/tabler'
import { get, put } from '../utils/api'

const message = useMessage()
const dialog = useDialog()

// 表格数据
const tableData = ref<any[]>([])
const loading = ref(false)
const filterStatus = ref<string | null>(null)

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50]
})

// 模态框
const remarkModalVisible = ref(false)
const remarkModalTitle = ref('')
const detailModalVisible = ref(false)
const currentItem = ref<any>(null)
const actionLoading = ref(false)

const remarkForm = reactive({
  id: '',
  action: '',
  remark: ''
})

// 状态选项
const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' }
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
    title: '真实姓名',
    key: 'realName',
    width: 100
  },
  {
    title: '手机号',
    key: 'phone',
    width: 130
  },
  {
    title: '联系方式',
    key: 'contact',
    width: 150,
    ellipsis: { tooltip: true },
    render(row: any) {
      return row.contact || '-'
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: any) {
      const statusMap: { [key: string]: { type: string; text: string } } = {
        pending: { type: 'warning', text: '待审核' },
        approved: { type: 'success', text: '已通过' },
        rejected: { type: 'error', text: '已拒绝' }
      }
      const statusInfo = statusMap[row.status] || { type: 'default', text: row.status }
      return h(NTag, { type: statusInfo.type as any, size: 'small' }, () => statusInfo.text)
    }
  },
  {
    title: '申请时间',
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return formatDate(row.createdAt)
    }
  },
  {
    title: '过期时间',
    key: 'expiresAt',
    width: 160,
    render(row: any) {
      const isExpired = new Date(row.expiresAt) < new Date()
      const text = formatDate(row.expiresAt)
      return h('span', { style: { color: isExpired ? '#f5365c' : 'inherit' } }, text + (isExpired ? ' (已过期)' : ''))
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render(row: any) {
      const buttons = [
        h(NButton, {
          size: 'small',
          type: 'info',
          onClick: () => showDetail(row)
        }, () => '详情')
      ]

      if (row.status === 'pending') {
        buttons.push(
          h(NButton, {
            size: 'small',
            type: 'success',
            onClick: () => showRemarkModal(row, 'approve'),
            style: { marginLeft: '8px' }
          }, () => '通过'),
          h(NButton, {
            size: 'small',
            type: 'error',
            onClick: () => showRemarkModal(row, 'reject'),
            style: { marginLeft: '8px' }
          }, () => '拒绝')
        )
      }

      return h(NSpace, { size: 'small' }, () => buttons)
    }
  }
]

// 获取统计数据
const fetchStats = async () => {
  try {
    const response = await get('/admin/password-resets/stats')
    if (response && response.code === 200 && response.data) {
      stats.total = response.data.total || 0
      stats.pending = response.data.pending || 0
      stats.approved = response.data.approved || 0
      stats.rejected = response.data.rejected || 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取列表数据
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }

    const response = await get('/admin/password-resets', params)
    if (response && response.code === 200 && response.data) {
      tableData.value = response.data.resets || []
      pagination.itemCount = response.data.pagination?.total || 0
    } else {
      tableData.value = []
      pagination.itemCount = 0
      if (response?.error) {
        message.error(response.error)
      }
    }

    // 同时更新统计数据
    await fetchStats()
  } catch (error) {
    console.error('获取数据失败:', error)
    message.error('获取数据失败')
    tableData.value = []
    pagination.itemCount = 0
  } finally {
    loading.value = false
  }
}

// 筛选变化
const handleFilterChange = () => {
  pagination.page = 1
  fetchData()
}

// 重置筛选
const handleReset = () => {
  filterStatus.value = null
  pagination.page = 1
  fetchData()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchData()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchData()
}

// 显示详情
const showDetail = (row: any) => {
  currentItem.value = row
  detailModalVisible.value = true
}

// 显示审批备注模态框
const showRemarkModal = (row: any, action: string) => {
  remarkForm.id = row.id
  remarkForm.action = action
  remarkForm.remark = ''
  remarkModalTitle.value = action === 'approve' ? '通过申请' : '拒绝申请'
  remarkModalVisible.value = true
}

// 提交审批操作
const submitAction = async () => {
  actionLoading.value = true
  try {
    const endpoint = remarkForm.action === 'approve'
      ? `/admin/password-resets/${remarkForm.id}/approve`
      : `/admin/password-resets/${remarkForm.id}/reject`

    const response = await put(endpoint, { remark: remarkForm.remark })

    if (response && response.code === 200) {
      message.success(response.message || (remarkForm.action === 'approve' ? '已通过申请' : '已拒绝申请'))
      remarkModalVisible.value = false
      detailModalVisible.value = false
      fetchData()
    } else {
      message.error(response?.error || response?.message || '操作失败')
    }
  } catch (error: any) {
    console.error('操作失败:', error)
    message.error(error.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return statusMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

// 组件挂载
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.password-resets-container {
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
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
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

.data-table {
  border-radius: 8px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .password-resets-container {
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
