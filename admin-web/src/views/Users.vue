<template>
  <div class="users-container">
    <!-- 背景动画元素 -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
    </div>

    <!-- 页面标题和操作区域 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon">
          <n-icon size="32">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </n-icon>
        </div>
        <div class="title-section">
          <h2 class="page-title">用户管理</h2>
          <n-breadcrumb>
            <n-breadcrumb-item>系统管理</n-breadcrumb-item>
            <n-breadcrumb-item>用户管理</n-breadcrumb-item>
          </n-breadcrumb>
        </div>
      </div>
      <div class="header-right">
        <n-button type="primary" @click="handleExport" :icon="downloadIcon" class="export-btn">
          导出用户数据
        </n-button>
      </div>
    </div>

    <!-- 用户统计卡片 -->
    <div class="stats-cards">
      <n-grid :cols="24" :x-gap="16">
        <n-grid-item :span="6">
          <n-card class="stat-card total">
            <n-statistic label="总用户数" :value="stats.total">
              <template #prefix>
                <n-icon size="24" color="#5e72e4">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item :span="6">
          <n-card class="stat-card active">
            <n-statistic label="活跃用户" :value="stats.active">
              <template #prefix>
                <n-icon size="24" color="#2dce89">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item :span="6">
          <n-card class="stat-card pending">
            <n-statistic label="待审核" :value="stats.pending">
              <template #prefix>
                <n-icon size="24" color="#fb6340">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item :span="6">
          <n-card class="stat-card banned">
            <n-statistic label="已封禁" :value="stats.banned">
              <template #prefix>
                <n-icon size="24" color="#f5365c">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.56c-.23.66-.46 1.33-.7 1.99-.17.49-.35.98-.53 1.47-.08.22-.16.44-.25.65-.04.1-.08.2-.13.3-.02.05-.05.1-.07.15-.01.02-.02.04-.03.06-.01.01-.01.02-.02.03-.01 0-.01.01-.02.01-.01 0-.02 0-.03-.01-.02-.01-.04-.02-.06-.03-.05-.02-.1-.05-.15-.07-.1-.04-.2-.09-.3-.13-.22-.08-.44-.16-.65-.25-.49-.18-.98-.36-1.47-.53-.66-.24-1.33-.47-1.99-.7.66-.23 1.33-.46 1.99-.7.49-.17.98-.35 1.47-.53.22-.08.44-.16.65-.25.1-.04.2-.08.3-.13.05-.02.1-.05.15-.07.02-.01.04-.02.06-.03.01 0 .02 0 .03-.01.01 0 .01 0 .02.01.01.01.01.02.02.03.01.02.02.04.03.06.02.05.05.1.07.15.04.1.09.2.13.3.08.22.16.44.25.65.18.49.36.98.53 1.47.24.66.47 1.33.7 1.99zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <!-- 搜索和筛选区域 -->
    <n-card class="search-card">
      <n-form :model="searchForm" label-placement="left" label-width="80">
        <n-grid :cols="24" :x-gap="24">
          <n-form-item-gi :span="6" label="用户名">
            <n-input v-model:value="searchForm.username" placeholder="请输入用户名" clearable @clear="handleSearch"
              @keyup.enter="handleSearch" class="search-input" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="手机号">
            <n-input v-model:value="searchForm.phone" placeholder="请输入手机号" clearable @clear="handleSearch"
              @keyup.enter="handleSearch" class="search-input" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="邮箱">
            <n-input v-model:value="searchForm.email" placeholder="请输入邮箱" clearable @clear="handleSearch"
              @keyup.enter="handleSearch" class="search-input" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="状态">
            <n-select v-model:value="searchForm.status" placeholder="请选择状态" clearable :options="statusOptions"
              @clear="handleSearch" class="search-select" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="角色">
            <n-select v-model:value="searchForm.role" placeholder="请选择角色" clearable :options="roleOptions"
              @clear="handleSearch" class="search-select" />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="注册时间">
            <n-date-picker v-model:value="searchForm.dateRange" type="daterange" clearable @clear="handleSearch"
              class="search-date" />
          </n-form-item-gi>
          <n-form-item-gi :span="12">
            <n-space>
              <n-button type="primary" @click="handleSearch" :icon="searchIcon" class="search-btn">
                搜索
              </n-button>
              <n-button @click="handleReset" :icon="refreshIcon" class="reset-btn">
                重置
              </n-button>
              <n-button @click="handleAdvancedSearch" class="advanced-search-btn">
                高级搜索
              </n-button>
            </n-space>
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-card>

    <!-- 用户数据表格 -->
    <n-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <h3>用户列表</h3>
          <span class="table-count">共 {{ pagination.itemCount }} 条记录</span>
        </div>
        <div class="table-actions">
          <n-space>
            <n-button v-if="selectedRowKeys.length > 0" type="primary" ghost @click="handleBatchApprove"
              :disabled="!hasPendingUsers" class="batch-btn">
              批量批准 ({{ getPendingSelectedCount() }})
            </n-button>
            <n-button v-if="selectedRowKeys.length > 0" type="warning" ghost @click="handleBatchReject"
              :disabled="!hasPendingUsers" class="batch-btn">
              批量拒绝 ({{ getPendingSelectedCount() }})
            </n-button>
            <n-button v-if="selectedRowKeys.length > 0" type="error" ghost @click="handleBatchBan"
              :disabled="!hasActiveUsers" class="batch-btn">
              批量封禁 ({{ getActiveSelectedCount() }})
            </n-button>
            <n-button v-if="selectedRowKeys.length > 0" type="success" ghost @click="handleBatchUnban"
              :disabled="!hasBannedUsers" class="batch-btn">
              批量解封 ({{ getBannedSelectedCount() }})
            </n-button>
            <n-button v-if="selectedRowKeys.length > 0" @click="handleClearSelection" class="clear-selection-btn">
              清除选择
            </n-button>
          </n-space>
        </div>
      </div>
      <n-data-table :columns="columns" :data="tableData" :pagination="pagination" :loading="loading" :scroll-x="1400"
        :row-key="rowKey" :checked-row-keys="selectedRowKeys" @update:checked-row-keys="handleSelectionChange"
        @update:page="handlePageChange" @update:page-size="handlePageSizeChange" class="user-table">
        <template #body-cell-actions="{ row }">
          <div class="action-buttons">
            <n-button size="small" type="info" @click="handleViewDetail(row)" class="action-btn view-btn">
              详情
            </n-button>
            <n-button size="small" type="primary" @click="handleEdit(row)" class="action-btn edit-btn">
              编辑
            </n-button>
            <n-button v-if="(row.status && (row.status.toUpperCase() === 'PENDING'))" size="small" type="success"
              @click="handleApprove(row.id)" class="action-btn approve-btn">
              批准
            </n-button>
            <n-button v-if="(row.status && (row.status.toUpperCase() === 'PENDING'))" size="small" type="warning"
              @click="handleReject(row.id)" class="action-btn reject-btn">
              拒绝
            </n-button>
            <n-button v-if="(row.status && (row.status.toUpperCase() === 'ACTIVE'))" size="small" type="error"
              @click="handleBan(row.id)" class="action-btn ban-btn">
              封禁
            </n-button>
            <n-button v-if="(row.status && (row.status.toUpperCase() === 'BANNED'))" size="small" type="success"
              @click="handleUnban(row.id)" class="action-btn unban-btn">
              解封
            </n-button>
          </div>
        </template>
      </n-data-table>
    </n-card>

    <!-- 编辑用户模态框 -->
    <n-modal v-model:show="editModalVisible" preset="dialog" :title="editModalTitle" class="edit-modal">
      <n-form ref="formRef" :model="editForm" :rules="formRules" label-placement="left" label-width="80"
        require-mark-placement="right-hanging" class="edit-form">
        <n-form-item label="用户名" path="username">
          <n-input v-model:value="editForm.username" placeholder="请输入用户名" class="form-input" />
        </n-form-item>
        <n-form-item label="手机号" path="phone">
          <n-input v-model:value="editForm.phone" placeholder="请输入手机号" class="form-input" />
        </n-form-item>
        <n-form-item label="邮箱" path="email">
          <n-input v-model:value="editForm.email" placeholder="请输入邮箱" class="form-input" />
        </n-form-item>
        <n-form-item label="状态" path="status">
          <n-select v-model:value="editForm.status" placeholder="请选择状态" :options="statusOptions" class="form-select" />
        </n-form-item>
        <n-form-item label="角色" path="role">
          <n-select v-model:value="editForm.role" placeholder="请选择角色" :options="roleOptions" class="form-select" />
        </n-form-item>
        <n-form-item label="真实姓名" path="realName">
          <n-input v-model:value="editForm.realName" placeholder="请输入真实姓名" class="form-input" />
        </n-form-item>
        <n-form-item label="修改密码" path="password">
          <n-input v-model:value="editForm.password" placeholder="留空则不修改密码，至少8个字符" type="password"
            show-password-on="mousedown" class="form-input" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="editModalVisible = false" class="cancel-btn">取消</n-button>
          <n-button type="primary" @click="handleSaveEdit" :loading="saveLoading" class="save-btn">
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 用户详情模态框 -->
    <n-modal v-model:show="detailModalVisible" preset="dialog" title="用户详情" class="detail-modal">
      <div v-if="selectedUser" class="user-detail">
        <div class="detail-header">
          <div class="user-avatar-large">
            {{ selectedUser.username.charAt(0).toUpperCase() }}
          </div>
          <div class="user-basic-info">
            <h3>{{ selectedUser.username }}</h3>
            <n-tag :type="getStatusType(selectedUser.status)" size="small">
              {{ getStatusText(selectedUser.status) }}
            </n-tag>
            <n-tag :type="getRoleType(selectedUser.role)" size="small" class="role-tag">
              {{ getRoleText(selectedUser.role) }}
            </n-tag>
          </div>
        </div>

        <n-divider />

        <div class="detail-content">
          <n-descriptions :column="2" bordered>
            <n-descriptions-item label="用户ID">
              {{ selectedUser.id }}
            </n-descriptions-item>
            <n-descriptions-item label="用户名">
              {{ selectedUser.username }}
            </n-descriptions-item>
            <n-descriptions-item label="手机号">
              {{ selectedUser.phone || '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="邮箱">
              {{ selectedUser.email || '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="状态">
              <n-tag :type="getStatusType(selectedUser.status)" size="small">
                {{ getStatusText(selectedUser.status) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="角色">
              <n-tag :type="getRoleType(selectedUser.role)" size="small">
                {{ getRoleText(selectedUser.role) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="注册时间">
              {{ formatDate(selectedUser.createdAt) }}
            </n-descriptions-item>
            <n-descriptions-item label="最后登录">
              {{ selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : '从未登录' }}
            </n-descriptions-item>
          </n-descriptions>

          <n-divider />

          <div class="detail-actions">
            <n-space>
              <n-button type="primary" @click="handleEditFromDetail" class="edit-from-detail-btn">
                编辑用户
              </n-button>
              <n-button v-if="selectedUser.status === 'pending'" type="success" @click="handleApproveFromDetail"
                class="approve-from-detail-btn">
                批准
              </n-button>
              <n-button v-if="selectedUser.status === 'pending'" type="warning" @click="handleRejectFromDetail"
                class="reject-from-detail-btn">
                拒绝
              </n-button>
              <n-button v-if="selectedUser.status === 'active'" type="error" @click="handleBanFromDetail"
                class="ban-from-detail-btn">
                封禁
              </n-button>
              <n-button v-if="selectedUser.status === 'banned'" type="success" @click="handleUnbanFromDetail"
                class="unban-from-detail-btn">
                解封
              </n-button>
            </n-space>
          </div>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed } from 'vue'
import { useMessage, useDialog, NButton, NTag } from 'naive-ui'
import {
  Download as DownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@vicons/tabler'
import { get, post, put } from '../utils/api'

const message = useMessage()
const dialog = useDialog()

// 表格数据
interface User {
  id: string
  username: string
  realName?: string
  email?: string
  phone?: string
  idCard?: string
  role: string
  status: string
  tokensUsed: number
  createdAt: string
  lastLoginAt?: string
  lastLoginIp?: string
}
const tableData = ref<User[]>([])
const loading = ref(false)
const editModalVisible = ref(false)
const detailModalVisible = ref(false)
const editModalTitle = ref('编辑用户')
const saveLoading = ref(false)
const formRef = ref()

// 选中行
const selectedRowKeys = ref<string[]>([])
const selectedUser = ref<any>(null)

// 用户统计数据
const stats = reactive({
  total: 0,
  active: 0,
  pending: 0,
  banned: 0
})

// 搜索表单
const searchForm = reactive({
  username: '',
  phone: '',
  email: '',
  status: null,
  role: null,
  dateRange: null
})

// 编辑表单
const editForm = reactive({
  id: '',
  username: '',
  phone: '',
  email: '',
  status: '',
  role: '',
  realName: '',
  password: ''
})

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 用户状态选项
const statusOptions = [
  { label: '待审核', value: 'PENDING' },
  { label: '正常', value: 'ACTIVE' },
  { label: '已封禁', value: 'BANNED' },
  { label: '已拒绝', value: 'REJECTED' }
]

// 角色选项
const roleOptions = [
  { label: '普通用户', value: 'USER' },
  { label: '管理员', value: 'ADMIN' }
]

// 计算属性
const hasPendingUsers = computed(() => {
  return selectedRowKeys.value.some(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'pending'
  })
})

const hasActiveUsers = computed(() => {
  return selectedRowKeys.value.some(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'active'
  })
})

const hasBannedUsers = computed(() => {
  return selectedRowKeys.value.some(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'banned'
  })
})

// 获取选中用户中待审核的数量
const getPendingSelectedCount = () => {
  return selectedRowKeys.value.filter(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'pending'
  }).length
}

// 获取选中用户中活跃用户的数量
const getActiveSelectedCount = () => {
  return selectedRowKeys.value.filter(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'active'
  }).length
}

// 获取选中用户中已封禁用户的数量
const getBannedSelectedCount = () => {
  return selectedRowKeys.value.filter(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'banned'
  }).length
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: { [key: string]: string } = {
    PENDING: 'warning',
    ACTIVE: 'success',
    BANNED: 'error',
    REJECTED: 'error',
    pending: 'warning',
    active: 'success',
    banned: 'error',
    rejected: 'error'
  }
  return statusMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    PENDING: '待审核',
    ACTIVE: '正常',
    BANNED: '已封禁',
    REJECTED: '已拒绝',
    pending: '待审核',
    active: '正常',
    banned: '已封禁',
    rejected: '已拒绝'
  }
  return statusMap[status] || '未知'
}

// 获取角色类型
const getRoleType = (role: string) => {
  const roleMap: { [key: string]: string } = {
    USER: 'info',
    ADMIN: 'primary',
    user: 'info',
    admin: 'primary'
  }
  return roleMap[role] || 'default'
}

// 表格行键值
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
      return h('span', { style: { fontWeight: '500' } }, row.username)
    }
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
    title: '状态',
    key: 'status',
    width: 90,
    render(row: any) {
      const statusMap: { [key: string]: { type: string; text: string } } = {
        PENDING: { type: 'warning', text: '待审核' },
        ACTIVE: { type: 'success', text: '正常' },
        BANNED: { type: 'error', text: '已封禁' },
        REJECTED: { type: 'error', text: '已拒绝' },
        pending: { type: 'warning', text: '待审核' },
        active: { type: 'success', text: '正常' },
        banned: { type: 'error', text: '已封禁' },
        rejected: { type: 'error', text: '已拒绝' }
      }
      const status = statusMap[row.status] || { type: 'default', text: '未知' }
      return h(NTag, { type: status.type, size: 'small' }, () => status.text)
    }
  },
  {
    title: '封禁次数',
    key: 'banCount',
    width: 90,
    render(row: any) {
      const count = row.banCount || 0
      if (count > 0) {
        return h(NTag, { type: 'error', size: 'small' }, () => `${count}次`)
      }
      return h('span', { style: { color: '#999' } }, '-')
    }
  },
  {
    title: '封禁信息',
    key: 'bannedUntil',
    width: 180,
    render(row: any) {
      if (!row.bannedUntil && !row.bannedAt) {
        return h('span', { style: { color: '#999' } }, '-')
      }

      const elements = []

      // 显示封禁开始时间
      if (row.bannedAt) {
        const bannedAt = new Date(row.bannedAt)
        elements.push(
          h('div', { style: { fontSize: '12px', color: '#666', marginBottom: '2px' } }, [
            h('span', { style: { color: '#999' } }, '封禁于: '),
            bannedAt.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
          ])
        )
      }

      // 显示封禁到期时间和剩余时间
      if (row.bannedUntil) {
        const bannedUntil = new Date(row.bannedUntil)
        const now = new Date()

        if (bannedUntil > now) {
          // 计算剩余时间
          const remainingMs = bannedUntil.getTime() - now.getTime()
          const remainingMinutes = Math.ceil(remainingMs / 60000)
          const hours = Math.floor(remainingMinutes / 60)
          const mins = remainingMinutes % 60

          let remainingText = ''
          if (hours > 0) {
            remainingText = `${hours}小时${mins}分钟`
          } else {
            remainingText = `${remainingMinutes}分钟`
          }

          elements.push(
            h(NTag, { type: 'error', size: 'small', style: { marginBottom: '2px' } }, () => `剩余${remainingText}`)
          )
          elements.push(
            h('div', { style: { fontSize: '11px', color: '#999' } }, [
              h('span', {}, '解封于: '),
              bannedUntil.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
            ])
          )
        } else {
          elements.push(
            h(NTag, { type: 'success', size: 'small' }, () => '临时封禁已过期')
          )
        }
      }

      return h('div', { style: { lineHeight: '1.4' } }, elements)
    }
  },
  {
    title: '角色',
    key: 'role',
    width: 90,
    render(row: any) {
      const roleMap: { [key: string]: { type: string; text: string } } = {
        USER: { type: 'info', text: '用户' },
        ADMIN: { type: 'primary', text: '管理员' },
        user: { type: 'info', text: '用户' },
        admin: { type: 'primary', text: '管理员' }
      }
      const role = roleMap[row.role] || { type: 'default', text: '未知' }
      return h(NTag, { type: role.type, size: 'small' }, () => role.text)
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
    width: 280,
    fixed: 'right',

    render(row: any) {
      const buttons = [
        h(NButton, {
          size: 'small',
          type: 'primary',
          style: { marginRight: '4px' },
          onClick: () => handleEdit(row)
        }, () => '编辑')
      ]

      // 根据用户状态添加不同的操作按钮
      const status = row.status?.toUpperCase()
      if (status === 'PENDING') {
        buttons.push(
          h(NButton, {
            size: 'small',
            type: 'success',
            style: { marginRight: '4px' },
            onClick: () => handleApprove(row.id)
          }, () => '批准'),
          h(NButton, {
            size: 'small',
            type: 'warning',
            style: { marginRight: '4px' },
            onClick: () => handleReject(row.id)
          }, () => '拒绝')
        )
      } else if (status === 'ACTIVE') {
        buttons.push(
          h(NButton, {
            size: 'small',
            type: 'error',
            style: { marginRight: '4px' },
            onClick: () => handleBan(row.id)
          }, () => '封禁')
        )
      } else if (status === 'BANNED') {
        buttons.push(
          h(NButton, {
            size: 'small',
            type: 'success',
            style: { marginRight: '4px' },
            onClick: () => handleUnban(row.id)
          }, () => '解封')
        )
      }

      return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '2px' } }, buttons)
    }
  }
]

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3456789]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap: { [key: string]: string } = {
    USER: '普通用户',
    ADMIN: '管理员',
    user: '普通用户',
    admin: '管理员'
  }
  return roleMap[role] || '未知'
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    // 构建查询参数，只传递非空值
    const queryParams: Record<string, any> = {
      page: pagination.page,
      limit: pagination.pageSize
    }

    // 只添加有值的搜索参数
    if (searchForm.username) queryParams.username = searchForm.username
    if (searchForm.phone) queryParams.phone = searchForm.phone
    if (searchForm.email) queryParams.email = searchForm.email
    if (searchForm.status) queryParams.status = searchForm.status
    if (searchForm.role) queryParams.role = searchForm.role

    console.log('搜索参数:', queryParams)
    const response = await get('/admin/users', queryParams)
    console.log('用户列表响应:', response)

    tableData.value = response.data?.users || []
    pagination.itemCount = response.data?.pagination?.total || 0

    // 更新统计数据
    stats.total = response.data?.stats?.total || 0
    stats.active = response.data?.stats?.active || 0
    stats.pending = response.data?.stats?.pending || 0
    stats.banned = response.data?.stats?.banned || 0
  } catch (error) {
    console.error('获取用户列表失败', error)
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取用户统计数据
const fetchUserStats = async () => {
  try {
    const response = await get('/admin/users/stats')
    stats.total = response.data?.total || 0
    stats.active = response.data?.active || 0
    stats.pending = response.data?.pending || 0
    stats.banned = response.data?.banned || 0
  } catch (error) {
    console.error('获取用户统计数据失败', error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.phone = ''
  searchForm.email = ''
  searchForm.status = null
  searchForm.role = null
  searchForm.dateRange = null
  pagination.page = 1
  fetchUsers()
}

// 高级搜索
const handleAdvancedSearch = () => {
  // 这里可以实现高级搜索功能，例如打开一个更复杂的搜索模态框
  message.info('高级搜索功能开发中...')
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchUsers()
}

// 每页数量变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchUsers()
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
const handleViewDetail = (row: any) => {
  selectedUser.value = row
  detailModalVisible.value = true
}

// 从详情页编辑用户
const handleEditFromDetail = () => {
  detailModalVisible.value = false
  handleEdit(selectedUser.value)
}

// 从详情页批准用户
const handleApproveFromDetail = () => {
  detailModalVisible.value = false
  handleApprove(selectedUser.value.id)
}

// 从详情页拒绝用户
const handleRejectFromDetail = () => {
  detailModalVisible.value = false
  handleReject(selectedUser.value.id)
}

// 从详情页封禁用户
const handleBanFromDetail = () => {
  detailModalVisible.value = false
  handleBan(selectedUser.value.id)
}

// 从详情页解封用户
const handleUnbanFromDetail = () => {
  detailModalVisible.value = false
  handleUnban(selectedUser.value.id)
}

// 批量批准
const handleBatchApprove = () => {
  const pendingUsers = selectedRowKeys.value.filter(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'pending'
  })

  if (pendingUsers.length === 0) {
    message.warning('没有待审核的用户')
    return
  }

  dialog.warning({
    title: '批量批准',
    content: `确定要批准选中的 ${pendingUsers.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await post('/admin/users/batch-approve', { userIds: pendingUsers })
        message.success(`成功批准 ${pendingUsers.length} 个用户`)
        selectedRowKeys.value = []
        fetchUsers()
      } catch (error) {
        console.error('批量批准失败', error)
        message.error('批量批准失败')
      }
    }
  })
}

// 批量拒绝
const handleBatchReject = () => {
  const pendingUsers = selectedRowKeys.value.filter(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'pending'
  })

  if (pendingUsers.length === 0) {
    message.warning('没有待审核的用户')
    return
  }

  dialog.warning({
    title: '批量拒绝',
    content: `确定要拒绝选中的 ${pendingUsers.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await post('/admin/users/batch-reject', { userIds: pendingUsers })
        message.success(`成功拒绝 ${pendingUsers.length} 个用户`)
        selectedRowKeys.value = []
        fetchUsers()
      } catch (error) {
        console.error('批量拒绝失败', error)
        message.error('批量拒绝失败')
      }
    }
  })
}

// 批量封禁
const handleBatchBan = () => {
  const activeUsers = selectedRowKeys.value.filter(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'active'
  })

  if (activeUsers.length === 0) {
    message.warning('没有活跃的用户')
    return
  }

  dialog.warning({
    title: '批量封禁',
    content: `确定要封禁选中的 ${activeUsers.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await post('/admin/users/batch-ban', { userIds: activeUsers })
        message.success(`成功封禁 ${activeUsers.length} 个用户`)
        selectedRowKeys.value = []
        fetchUsers()
      } catch (error) {
        console.error('批量封禁失败', error)
        message.error('批量封禁失败')
      }
    }
  })
}

// 批量解封
const handleBatchUnban = () => {
  const bannedUsers = selectedRowKeys.value.filter(key => {
    const user = tableData.value.find(u => u.id === key)
    return user && user.status === 'banned'
  })

  if (bannedUsers.length === 0) {
    message.warning('没有已封禁的用户')
    return
  }

  dialog.warning({
    title: '批量解封',
    content: `确定要解封选中的 ${bannedUsers.length} 个用户吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await post('/admin/users/batch-unban', { userIds: bannedUsers })
        message.success(`成功解封 ${bannedUsers.length} 个用户`)
        selectedRowKeys.value = []
        fetchUsers()
      } catch (error) {
        console.error('批量解封失败', error)
        message.error('批量解封失败')
      }
    }
  })
}

// 编辑用户
const handleEdit = (row: any) => {
  editForm.id = row.id
  editForm.username = row.username || ''
  editForm.phone = row.phone || ''
  editForm.email = row.email || ''
  editForm.status = row.status || 'PENDING'
  editForm.role = row.role || 'USER'
  editForm.realName = row.realName || ''
  editForm.password = ''
  editModalTitle.value = '编辑用户'
  editModalVisible.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
  try {
    await formRef.value?.validate()
    saveLoading.value = true

    const updateData: any = {
      username: editForm.username,
      phone: editForm.phone,
      email: editForm.email,
      status: editForm.status,
      role: editForm.role
    }

    // 如果填写了真实姓名，添加到更新数据
    if (editForm.realName) {
      updateData.realName = editForm.realName
    }

    // 如果填写了密码，添加到更新数据（密码长度验证在后端）
    if (editForm.password && editForm.password.trim()) {
      if (editForm.password.length < 8) {
        message.error('密码长度必须至少为8个字符')
        return
      }
      updateData.password = editForm.password
    }

    const response = await put(`/admin/users/${editForm.id}`, updateData)

    if (response.code === 200) {
      message.success('保存成功')
      editModalVisible.value = false
      fetchUsers()
    } else {
      message.error(response.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败', error)
    message.error(error.message || '保存失败')
  } finally {
    saveLoading.value = false
  }
}

// 批准用户
const handleApprove = (id: string) => {
  dialog.warning({
    title: '确认批准',
    content: '确定要批准该用户吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await put(`/admin/users/${id}/approve`, {})
        if (response.code === 200) {
          message.success('批准成功')
          fetchUsers()
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
    content: '确定要拒绝该用户吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await put(`/admin/users/${id}/reject`, {})
        if (response.code === 200) {
          message.success('拒绝成功')
          fetchUsers()
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

// 封禁用户
const handleBan = (id: string) => {
  dialog.warning({
    title: '确认封禁',
    content: '确定要封禁该用户吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await put(`/admin/users/${id}/ban`, {})
        if (response.code === 200) {
          message.success('封禁成功')
          fetchUsers()
        } else {
          message.error(response.message || '封禁失败')
        }
      } catch (error: any) {
        console.error('封禁失败', error)
        message.error(error.message || '封禁失败')
      }
    }
  })
}

// 解封用户
const handleUnban = (id: string) => {
  dialog.warning({
    title: '确认解封',
    content: '确定要解封该用户吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await put(`/admin/users/${id}/unban`, {})
        if (response.code === 200) {
          message.success('解封成功')
          fetchUsers()
        } else {
          message.error(response.message || '解封失败')
        }
      } catch (error: any) {
        console.error('解封失败', error)
        message.error(error.message || '解封失败')
      }
    }
  })
}

// 导出用户数据
const handleExport = async () => {
  try {
    const response = await get('/admin/users/export', {
      responseType: 'blob'
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    message.success('导出成功')
  } catch (error) {
    console.error('导出失败', error)
    message.error('导出失败')
  }
}

// 图标定义
const downloadIcon = () => h(DownloadIcon)
const searchIcon = () => h(SearchIcon)
const refreshIcon = () => h(RefreshIcon)

// 组件挂载时获取数据
onMounted(() => {
  fetchUsers()
  fetchUserStats()
})
</script>

<style scoped>
.users-container {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  top: 60%;
  right: 10%;
  animation-delay: 3s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  bottom: 20%;
  left: 20%;
  animation-delay: 5s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  top: 30%;
  right: 30%;
  animation-delay: 7s;
}

.shape-5 {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  bottom: 10%;
  right: 20%;
  animation-delay: 10s;
}

@keyframes float {

  0%,
  100% {
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
  color: #5e72e4;
  background: rgba(94, 114, 228, 0.1);
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

.export-btn {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.search-input,
.search-select,
.search-date {
  transition: all 0.3s ease;
}

.search-input:focus-within,
.search-select:focus-within,
.search-date:focus-within {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(94, 114, 228, 0.15);
}

.search-btn,
.reset-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.search-btn:hover,
.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 表格卡片 */
.table-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.user-table {
  border-radius: 16px;
  overflow: hidden;
}

/* 表格列样式 */
:deep(.id-column) {
  font-weight: 600;
  color: #5e72e4;
}

:deep(.username-column) {
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #5e72e4 0%, #825ee4 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  color: #2d3748;
}

.user-role {
  font-size: 12px;
  color: #718096;
}

:deep(.phone-column) {
  color: #4a5568;
}

:deep(.email-column) {
  color: #4a5568;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon {
  font-size: 14px;
}

.role-badge {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-icon {
  font-size: 14px;
}

:deep(.date-column) {
  font-size: 12px;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-value {
  font-weight: 500;
  color: #2d3748;
}

.date-label {
  color: #718096;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.action-btn {
  border-radius: 6px;
  transition: all 0.2s ease;
  font-size: 13px;
  padding: 0 12px;
  height: 32px;
  font-weight: 500;
  min-width: 60px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.edit-btn:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.approve-btn {
  background: linear-gradient(135deg, #2dce89 0%, #34d399 100%);
  border: none;
  color: white;
}

.approve-btn:hover {
  box-shadow: 0 4px 16px rgba(45, 206, 137, 0.4);
}

.reject-btn {
  background: linear-gradient(135deg, #fb6340 0%, #fbb040 100%);
  border: none;
  color: white;
}

.reject-btn:hover {
  box-shadow: 0 4px 16px rgba(251, 99, 64, 0.4);
}

.ban-btn {
  background: linear-gradient(135deg, #f5365c 0%, #f56036 100%);
  border: none;
  color: white;
}

.ban-btn:hover {
  box-shadow: 0 4px 16px rgba(245, 54, 92, 0.4);
}

.unban-btn {
  background: linear-gradient(135deg, #2dce89 0%, #34d399 100%);
  border: none;
  color: white;
}

.unban-btn:hover {
  box-shadow: 0 4px 16px rgba(45, 206, 137, 0.4);
}

/* 编辑模态框 */
:deep(.edit-modal) {
  border-radius: 16px;
  overflow: hidden;
}

.edit-form {
  padding: 8px 0;
}

.form-input,
.form-select {
  transition: all 0.3s ease;
}

.form-input:focus-within,
.form-select:focus-within {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(94, 114, 228, 0.15);
}

.cancel-btn,
.save-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.cancel-btn:hover,
.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .users-container {
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

@media (max-width: 768px) {
  .users-container {
    padding: 12px;
  }

  .page-header {
    padding: 16px;
  }

  .search-card {
    padding: 16px;
  }

  .table-card {
    padding: 16px;
  }

  .shape {
    filter: blur(30px);
  }

  .shape-1,
  .shape-2 {
    width: 200px;
    height: 200px;
  }

  .shape-3,
  .shape-4,
  .shape-5 {
    width: 120px;
    height: 120px;
  }
}

/* 用户统计卡片样式 */
.stats-cards {
  margin-bottom: 24px;
}

.stat-card {
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.total {
  border-left: 4px solid #5e72e4;
}

.stat-card.active {
  border-left: 4px solid #2dce89;
}

.stat-card.pending {
  border-left: 4px solid #fb6340;
}

.stat-card.banned {
  border-left: 4px solid #f5365c;
}

/* 表格头部样式 */
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
  background: rgba(94, 114, 228, 0.1);
  padding: 4px 12px;
  border-radius: 12px;
}

/* 批量操作按钮样式 */
.batch-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
  font-size: 13px;
}

.batch-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.clear-selection-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.clear-selection-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 用户详情模态框样式 */
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
  background: linear-gradient(135deg, #5e72e4 0%, #825ee4 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(94, 114, 228, 0.3);
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

.role-tag {
  margin-left: 8px;
}

.detail-content {
  margin-top: 16px;
}

.detail-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.edit-from-detail-btn,
.approve-from-detail-btn,
.reject-from-detail-btn,
.ban-from-detail-btn,
.unban-from-detail-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.edit-from-detail-btn:hover,
.approve-from-detail-btn:hover,
.reject-from-detail-btn:hover,
.ban-from-detail-btn:hover,
.unban-from-detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>