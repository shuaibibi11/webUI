<template>
  <div class="registrations-container">
    <!-- 背景动画元素 -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon">
          <n-icon size="32">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </n-icon>
        </div>
        <div class="title-section">
          <h2 class="page-title">注册审批</h2>
          <n-breadcrumb>
            <n-breadcrumb-item>用户管理</n-breadcrumb-item>
            <n-breadcrumb-item>注册审批</n-breadcrumb-item>
          </n-breadcrumb>
        </div>
      </div>
      <div class="header-right">
        <n-button @click="fetchRegistrations" :icon="refreshIcon" class="refresh-btn">
          刷新
        </n-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <n-grid :cols="24" :x-gap="16">
        <n-grid-item :span="8">
          <n-card class="stat-card pending">
            <n-statistic label="待审核" :value="stats.pending">
              <template #prefix>
                <n-icon size="24" color="#fb6340">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item :span="8">
          <n-card class="stat-card today">
            <n-statistic label="今日新增" :value="stats.today">
              <template #prefix>
                <n-icon size="24" color="#11cdef">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item :span="8">
          <n-card class="stat-card processed">
            <n-statistic label="今日已处理" :value="stats.processed">
              <template #prefix>
                <n-icon size="24" color="#2dce89">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 主要内容区域 -->
    <n-card class="main-card">
      <div class="table-header">
        <div class="table-title">
          <h3>待审核用户</h3>
          <span class="table-count">共 {{ pagination.itemCount }} 条记录</span>
        </div>
        <div class="table-actions">
          <n-space>
            <n-button v-if="selectedRowKeys.length > 0" type="success" @click="handleBatchApprove" class="batch-btn">
              批量批准 ({{ selectedRowKeys.length }})
            </n-button>
            <n-button v-if="selectedRowKeys.length > 0" type="warning" @click="handleBatchReject" class="batch-btn">
              批量拒绝 ({{ selectedRowKeys.length }})
            </n-button>
            <n-button v-if="selectedRowKeys.length > 0" @click="handleClearSelection" class="clear-btn">
              清除选择
            </n-button>
          </n-space>
        </div>
      </div>

      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="1200"
        :row-key="rowKey"
        :checked-row-keys="selectedRowKeys"
        @update:checked-row-keys="handleSelectionChange"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        class="registration-table"
      />
    </n-card>

    <!-- 用户详情弹窗 -->
    <n-modal v-model:show="detailModalVisible" preset="dialog" title="用户注册信息" class="detail-modal" style="width: 600px">
      <div v-if="selectedUser" class="user-detail">
        <div class="detail-header">
          <div class="user-avatar-large">
            {{ selectedUser.username?.charAt(0).toUpperCase() }}
          </div>
          <div class="user-basic-info">
            <h3>{{ selectedUser.username }}</h3>
            <n-tag type="warning" size="small">待审核</n-tag>
          </div>
        </div>

        <n-divider />

        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="用户名">
            {{ selectedUser.username }}
          </n-descriptions-item>
          <n-descriptions-item label="真实姓名">
            {{ selectedUser.realName || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="手机号">
            {{ selectedUser.phone || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="邮箱">
            {{ selectedUser.email || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="身份证号">
            {{ maskIdCard(selectedUser.idCard) || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="实名认证">
            <n-tag :type="getVerificationStatusType(selectedUser.verificationStatus)" size="small">
              {{ getVerificationStatusText(selectedUser.verificationStatus) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="注册时间" :span="2">
            {{ formatDate(selectedUser.createdAt) }}
          </n-descriptions-item>
        </n-descriptions>

        <div class="detail-actions">
          <n-space justify="center">
            <n-button type="success" size="large" @click="handleApproveFromDetail">
              批准注册
            </n-button>
            <n-button type="warning" size="large" @click="handleRejectFromDetail">
              拒绝注册
            </n-button>
            <n-button type="error" size="large" @click="handleDeleteFromDetail">
              删除用户
            </n-button>
          </n-space>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage, useDialog, NButton, NTag, NPopconfirm } from 'naive-ui'
import { Refresh as RefreshIcon } from '@vicons/tabler'
import { get, put, post, del } from '../utils/api'

const message = useMessage()
const dialog = useDialog()

interface User {
  id: string
  username: string
  realName?: string
  phone?: string
  email?: string
  idCard?: string
  status: string
  createdAt: string
  verificationStatus?: number
  verificationMessage?: string
}

const tableData = ref<User[]>([])
const loading = ref(false)
const selectedRowKeys = ref<string[]>([])
const selectedUser = ref<User | null>(null)
const detailModalVisible = ref(false)

const stats = reactive({
  pending: 0,
  today: 0,
  processed: 0
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

const rowKey = (row: any) => row.id

// 表格列定义
const columns = [
  {
    type: 'selection',
    width: 50
  },
  {
    title: '用户名',
    key: 'username',
    width: 120,
    render(row: any) {
      return h('span', { style: { fontWeight: '500', color: '#2d3748' } }, row.username)
    }
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
    title: '邮箱',
    key: 'email',
    width: 180,
    ellipsis: { tooltip: true }
  },
  {
    title: '实名认证',
    key: 'verificationStatus',
    width: 120,
    render(row: any) {
      const status = row.verificationStatus
      if (status === null || status === undefined) {
        return h(NTag, { type: 'default', size: 'small' }, () => '未验证')
      }
      const statusMap: { [key: number]: { type: string; text: string } } = {
        1: { type: 'success', text: '三要素匹配' },
        2: { type: 'warning', text: '姓名不匹配' },
        3: { type: 'warning', text: '证件不匹配' },
        4: { type: 'error', text: '三者不匹配' },
        [-1]: { type: 'default', text: '非移动用户' },
        [-2]: { type: 'error', text: '数据异常' }
      }
      const verifyStatus = statusMap[status] || { type: 'default', text: `未知(${status})` }
      return h(NTag, { type: verifyStatus.type, size: 'small' }, () => verifyStatus.text)
    }
  },
  {
    title: '注册时间',
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return h('span', {}, formatDate(row.createdAt))
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 260,
    fixed: 'right',
    render(row: any) {
      return h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
        h(NButton, {
          size: 'small',
          type: 'info',
          onClick: () => handleViewDetail(row)
        }, () => '详情'),
        h(NButton, {
          size: 'small',
          type: 'success',
          onClick: () => handleApprove(row.id)
        }, () => '批准'),
        h(NButton, {
          size: 'small',
          type: 'warning',
          onClick: () => handleReject(row.id)
        }, () => '拒绝'),
        h(NButton, {
          size: 'small',
          type: 'error',
          onClick: () => confirmDelete(row)
        }, () => '删除')
      ])
    }
  }
]

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 脱敏身份证号
const maskIdCard = (idCard: string | undefined) => {
  if (!idCard || idCard.length < 10) return idCard
  return idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4)
}

// 获取实名认证状态类型
const getVerificationStatusType = (status: number | undefined) => {
  if (status === null || status === undefined) return 'default'
  const typeMap: { [key: number]: string } = {
    1: 'success',
    2: 'warning',
    3: 'warning',
    4: 'error',
    [-1]: 'default',
    [-2]: 'error'
  }
  return typeMap[status] || 'default'
}

// 获取实名认证状态文本
const getVerificationStatusText = (status: number | undefined) => {
  if (status === null || status === undefined) return '未验证'
  const textMap: { [key: number]: string } = {
    1: '三要素匹配',
    2: '姓名不匹配',
    3: '证件不匹配',
    4: '三者不匹配',
    [-1]: '非移动用户',
    [-2]: '数据异常'
  }
  return textMap[status] || `未知(${status})`
}

// 获取待审核用户列表
const fetchRegistrations = async () => {
  loading.value = true
  try {
    const response = await get('/admin/users', {
      page: pagination.page,
      limit: pagination.pageSize,
      status: 'PENDING'
    })
    console.log('注册审批列表响应:', response)

    tableData.value = response.data?.users || []
    pagination.itemCount = response.data?.pagination?.total || 0

    // 更新统计数据
    stats.pending = response.data?.pagination?.total || 0

    // 获取今日新增数据
    const todayResponse = await get('/admin/users/stats')
    if (todayResponse.code === 200) {
      stats.pending = todayResponse.data?.pending || 0
      // 计算今日新增和已处理（简单统计）
      stats.today = todayResponse.data?.todayRegistered || 0
      stats.processed = todayResponse.data?.todayProcessed || 0
    }
  } catch (error) {
    console.error('获取待审核用户列表失败', error)
    message.error('获取待审核用户列表失败')
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchRegistrations()
}

// 每页数量变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchRegistrations()
}

// 选择变化
const handleSelectionChange = (keys: string[]) => {
  selectedRowKeys.value = keys
}

// 清除选择
const handleClearSelection = () => {
  selectedRowKeys.value = []
}

// 查看用户详情
const handleViewDetail = (row: User) => {
  selectedUser.value = row
  detailModalVisible.value = true
}

// 批准用户
const handleApprove = (id: string) => {
  dialog.warning({
    title: '确认批准',
    content: '确定要批准该用户的注册申请吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await put(`/admin/users/${id}/approve`, {})
        if (response.code === 200) {
          message.success('批准成功')
          fetchRegistrations()
        } else {
          message.error(response.message || '批准失败')
        }
      } catch (error: any) {
        console.error('批准失败', error)
        message.error(error.message || '批准失败')
      }
    }
  })
}

// 拒绝用户
const handleReject = (id: string) => {
  dialog.warning({
    title: '确认拒绝',
    content: '确定要拒绝该用户的注册申请吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await put(`/admin/users/${id}/reject`, {})
        if (response.code === 200) {
          message.success('拒绝成功')
          fetchRegistrations()
        } else {
          message.error(response.message || '拒绝失败')
        }
      } catch (error: any) {
        console.error('拒绝失败', error)
        message.error(error.message || '拒绝失败')
      }
    }
  })
}

// 从详情页批准
const handleApproveFromDetail = () => {
  if (selectedUser.value) {
    detailModalVisible.value = false
    handleApprove(selectedUser.value.id)
  }
}

// 从详情页拒绝
const handleRejectFromDetail = () => {
  if (selectedUser.value) {
    detailModalVisible.value = false
    handleReject(selectedUser.value.id)
  }
}

// 批量批准
const handleBatchApprove = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要批准的用户')
    return
  }

  dialog.warning({
    title: '批量批准',
    content: `确定要批准选中的 ${selectedRowKeys.value.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await post('/admin/users/batch-approve', { userIds: selectedRowKeys.value })
        if (response.code === 200) {
          message.success(`成功批准 ${selectedRowKeys.value.length} 个用户`)
          selectedRowKeys.value = []
          fetchRegistrations()
        } else {
          message.error(response.message || '批量批准失败')
        }
      } catch (error: any) {
        console.error('批量批准失败', error)
        message.error(error.message || '批量批准失败')
      }
    }
  })
}

// 批量拒绝
const handleBatchReject = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要拒绝的用户')
    return
  }

  dialog.warning({
    title: '批量拒绝',
    content: `确定要拒绝选中的 ${selectedRowKeys.value.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await post('/admin/users/batch-reject', { userIds: selectedRowKeys.value })
        if (response.code === 200) {
          message.success(`成功拒绝 ${selectedRowKeys.value.length} 个用户`)
          selectedRowKeys.value = []
          fetchRegistrations()
        } else {
          message.error(response.message || '批量拒绝失败')
        }
      } catch (error: any) {
        console.error('批量拒绝失败', error)
        message.error(error.message || '批量拒绝失败')
      }
    }
  })
}

// 确认删除用户
const confirmDelete = (row: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户 "${row.username}" 吗？此操作不可撤销，将删除该用户的所有数据！`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: () => handleDelete(row.id)
  })
}

// 删除用户
const handleDelete = async (id: string) => {
  try {
    const response = await del(`/admin/users/${id}`)
    if (response.code === 200) {
      message.success('删除成功')
      fetchRegistrations()
    } else {
      message.error(response.message || '删除失败')
    }
  } catch (error: any) {
    console.error('删除失败', error)
    message.error(error.message || '删除失败')
  }
}

// 从详情页删除
const handleDeleteFromDetail = () => {
  if (selectedUser.value) {
    detailModalVisible.value = false
    confirmDelete(selectedUser.value)
  }
}

// 图标
const refreshIcon = () => h(RefreshIcon)

onMounted(() => {
  fetchRegistrations()
})
</script>

<style scoped>
.registrations-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

/* 背景动画 */
.bg-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
  filter: blur(40px);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #fb6340 0%, #fbb040 100%);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #2dce89 0%, #34d399 100%);
  top: 60%;
  right: 10%;
  animation-delay: 3s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #11cdef 0%, #1171ef 100%);
  bottom: 20%;
  left: 30%;
  animation-delay: 5s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -30px) rotate(90deg);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg);
  }
  75% {
    transform: translate(-30px, -20px) rotate(270deg);
  }
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: #fb6340;
  background: rgba(251, 99, 64, 0.1);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
}

.refresh-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 统计卡片 */
.stats-cards {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.stat-card {
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.pending {
  border-left: 4px solid #fb6340;
}

.stat-card.today {
  border-left: 4px solid #11cdef;
}

.stat-card.processed {
  border-left: 4px solid #2dce89;
}

/* 主内容卡片 */
.main-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.table-count {
  color: #718096;
  font-size: 14px;
  background: rgba(251, 99, 64, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

.batch-btn, .clear-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.batch-btn:hover, .clear-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 表格样式 */
.registration-table {
  border-radius: 16px;
  overflow: hidden;
}

/* 详情弹窗 */
:deep(.detail-modal) {
  border-radius: 16px;
  overflow: hidden;
}

.user-detail {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.user-avatar-large {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fb6340 0%, #fbb040 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(251, 99, 64, 0.3);
}

.user-basic-info {
  flex: 1;
}

.user-basic-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
}

.detail-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

/* 响应式 */
@media (max-width: 768px) {
  .registrations-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .header-right {
    width: 100%;
  }

  .refresh-btn {
    width: 100%;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
