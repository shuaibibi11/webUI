<template>
  <div class="feedbacks-container">
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
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 14H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h2 class="page-title">反馈管理</h2>
        </div>
        <n-breadcrumb>
          <n-breadcrumb-item>系统管理</n-breadcrumb-item>
          <n-breadcrumb-item>反馈管理</n-breadcrumb-item>
        </n-breadcrumb>
      </div>
      <div class="header-right">
        <n-space>
          <n-button @click="handleExport" :icon="downloadIcon" class="export-btn">
            导出反馈数据
          </n-button>
          <n-button type="primary" @click="showStatisticsModal" class="statistics-btn">
            统计分析
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 反馈统计卡片 -->
    <div class="stats-cards">
      <n-grid :cols="24" :x-gap="16">
        <n-gi :span="6">
          <n-card class="stat-card total" :bordered="false">
            <n-statistic label="总反馈数" :value="stats.total">
              <template #prefix>
                <n-icon size="18" color="#5e72e4">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"/>
                  </svg>
                </n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-gi>
        <n-gi :span="6">
          <n-card class="stat-card pending" :bordered="false">
            <n-statistic label="待处理" :value="stats.pending">
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
          <n-card class="stat-card processed" :bordered="false">
            <n-statistic label="已处理" :value="stats.processed">
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
          <n-card class="stat-card closed" :bordered="false">
            <n-statistic label="已关闭" :value="stats.closed">
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

    <!-- 搜索和筛选区域 -->
    <n-card class="search-card">
      <n-form :model="searchForm" label-placement="left" label-width="80">
        <n-grid :cols="24" :x-gap="24">
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
          <n-form-item-gi :span="6" label="反馈类型">
            <n-select
              v-model:value="searchForm.type"
              placeholder="请选择反馈类型"
              clearable
              :options="typeOptions"
              @clear="handleSearch"
              class="search-select"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="状态">
            <n-select
              v-model:value="searchForm.status"
              placeholder="请选择状态"
              clearable
              :options="statusOptions"
              @clear="handleSearch"
              class="search-select"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="优先级">
            <n-select
              v-model:value="searchForm.priority"
              placeholder="请选择优先级"
              clearable
              :options="priorityOptions"
              @clear="handleSearch"
              class="search-select"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="提交时间">
            <n-date-picker
              v-model:value="searchForm.dateRange"
              type="daterange"
              clearable
              @clear="handleSearch"
              class="search-date"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="6" label="关键词">
            <n-input
              v-model:value="searchForm.keyword"
              placeholder="搜索反馈内容"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              class="search-input"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="12">
            <n-space>
              <n-button type="primary" @click="handleSearch" :icon="searchIcon" class="search-btn">
                搜索
              </n-button>
              <n-button @click="handleReset" :icon="refreshIcon" class="reset-btn">
                重置
              </n-button>
              <n-button @click="showAdvancedSearch" :icon="filterIcon" class="advanced-search-btn">
                高级搜索
              </n-button>
            </n-space>
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-card>

    <!-- 反馈数据表格 -->
    <n-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <h3>反馈列表</h3>
          <n-tag type="info" round>共 {{ pagination.itemCount }} 条记录</n-tag>
        </div>
        <div class="table-actions">
          <n-space>
            <n-button 
              v-if="selectedRowKeys.length > 0"
              @click="handleClearSelection" 
              size="small" 
              class="clear-selection-btn"
            >
              清除选择 ({{ selectedRowKeys.length }})
            </n-button>
          </n-space>
        </div>
      </div>
      
      <!-- 批量操作按钮 -->
      <div v-if="selectedRowKeys.length > 0" class="batch-actions">
        <n-space>
          <n-button 
            type="success" 
            size="small" 
            @click="handleBatchProcess" 
            class="batch-btn"
            :disabled="!hasPendingFeedbacks"
          >
            批量处理
          </n-button>
          <n-button 
            type="error" 
            size="small" 
            @click="handleBatchClose" 
            class="batch-btn"
            :disabled="!hasPendingFeedbacks"
          >
            批量关闭
          </n-button>
          <n-button 
            type="warning" 
            size="small" 
            @click="handleBatchReply" 
            class="batch-btn"
            :disabled="!hasPendingFeedbacks"
          >
            批量回复
          </n-button>
        </n-space>
      </div>
      
      <n-data-table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        :scroll-x="1400"
        :row-key="(row: any) => row.id"
        :checked-row-keys="selectedRowKeys"
        @update:checked-row-keys="handleSelectionChange"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        class="feedback-table"
      >
        <template #body-cell-actions="{ row }">
          <div class="action-buttons">
            <n-button
              size="small"
              type="info"
              @click="handleViewDetail(row)"
              class="view-btn"
            >
              查看详情
            </n-button>
            <n-button
              size="small"
              type="primary"
              @click="handleEdit(row)"
              class="edit-btn"
            >
              编辑
            </n-button>
            <n-space size="small" style="margin-left: 8px;">
              <n-button
                size="small"
                :type="row.status === 'pending' ? 'warning' : 'default'"
                @click="handleStatusChange(row.id, 'pending')"
                :disabled="row.status === 'pending'"
                class="status-btn"
              >
                未处理
              </n-button>
              <n-button
                size="small"
                :type="row.status === 'processing' ? 'info' : 'default'"
                @click="handleStatusChange(row.id, 'processing')"
                :disabled="row.status === 'processing'"
                class="status-btn"
              >
                处理中
              </n-button>
              <n-button
                size="small"
                :type="row.status === 'processed' ? 'success' : 'default'"
                @click="handleStatusChange(row.id, 'processed')"
                :disabled="row.status === 'processed'"
                class="status-btn"
              >
                处理完成
              </n-button>
            </n-space>
          </div>
        </template>
      </n-data-table>
    </n-card>

    <!-- 反馈详情模态框 -->
    <n-modal v-model:show="detailModalVisible" preset="dialog" :title="detailModalTitle" style="width: 700px;" class="detail-modal">
      <div v-if="currentFeedback" class="feedback-detail">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="ID">
            {{ currentFeedback.id }}
          </n-descriptions-item>
          <n-descriptions-item label="用户名">
            {{ currentFeedback.username }}
          </n-descriptions-item>
          <n-descriptions-item label="反馈类型">
            <n-tag :type="getTypeTagType(currentFeedback.type)">
              {{ getTypeText(currentFeedback.type) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="状态">
            <n-tag :type="getStatusTagType(currentFeedback.status)">
              {{ getStatusText(currentFeedback.status) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="联系方式">
            {{ currentFeedback.contact || '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="提交时间">
            {{ formatDate(currentFeedback.createdAt) }}
          </n-descriptions-item>
          <n-descriptions-item label="处理时间" span="2">
            {{ currentFeedback.processedAt ? formatDate(currentFeedback.processedAt) : '-' }}
          </n-descriptions-item>
          <n-descriptions-item label="反馈内容" span="2">
            <div class="feedback-content">
              {{ currentFeedback.content }}
            </div>
          </n-descriptions-item>
          <n-descriptions-item v-if="currentFeedback.reply" label="回复内容" span="2">
            <div class="feedback-reply">
              {{ currentFeedback.reply }}
            </div>
          </n-descriptions-item>
        </n-descriptions>
      </div>
      <template #action>
        <n-space>
          <n-button @click="detailModalVisible = false" class="close-btn">关闭</n-button>
          <n-button
            v-if="currentFeedback && currentFeedback.status === 'pending'"
            type="primary"
            @click="showReplyModal"
            class="reply-btn"
          >
            回复
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 编辑反馈模态框 -->
    <n-modal v-model:show="editModalVisible" preset="dialog" title="编辑反馈" style="width: 700px;" class="edit-modal">
      <n-form :model="editForm" label-placement="left" label-width="100" class="edit-form">
        <n-form-item label="反馈类型">
          <n-select
            v-model:value="editForm.type"
            :options="typeOptions"
            placeholder="请选择反馈类型"
            class="form-select"
          />
        </n-form-item>
        <n-form-item label="反馈内容">
          <n-input
            v-model:value="editForm.content"
            type="textarea"
            placeholder="请输入反馈内容"
            :autosize="{ minRows: 4, maxRows: 8 }"
            class="form-textarea"
          />
        </n-form-item>
        <n-form-item label="联系方式">
          <n-input
            v-model:value="editForm.contact"
            placeholder="请输入联系方式"
            class="form-input"
          />
        </n-form-item>
        <n-form-item label="状态">
          <n-select
            v-model:value="editForm.status"
            :options="statusOptions"
            placeholder="请选择状态"
            class="form-select"
          />
        </n-form-item>
        <n-form-item label="处理结果">
          <n-input
            v-model:value="editForm.resolution"
            type="textarea"
            placeholder="请输入处理结果（可选）"
            :autosize="{ minRows: 3, maxRows: 6 }"
            class="form-textarea"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="editModalVisible = false" class="cancel-btn">取消</n-button>
          <n-button type="primary" @click="handleSaveEdit" :loading="editLoading" class="save-btn">
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 回复模态框 -->
    <n-modal v-model:show="replyModalVisible" preset="dialog" title="回复反馈" class="reply-modal">
      <n-form :model="replyForm" label-placement="left" label-width="80" class="reply-form">
        <n-form-item label="回复内容">
          <n-input
            v-model:value="replyForm.content"
            type="textarea"
            placeholder="请输入回复内容"
            :autosize="{ minRows: 4, maxRows: 8 }"
            class="reply-textarea"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="replyModalVisible = false" class="cancel-btn">取消</n-button>
          <n-button type="primary" @click="handleReply" :loading="replyLoading" class="send-btn">
            发送回复
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 高级搜索模态框 -->
    <n-modal v-model:show="advancedSearchModalVisible" preset="card" title="高级搜索" class="advanced-search-modal">
      <n-form :model="advancedSearchForm" label-placement="left" label-width="100">
        <n-grid :cols="24" :x-gap="16" :y-gap="16">
          <n-form-item-gi :span="12" label="用户ID">
            <n-input
              v-model:value="advancedSearchForm.userId"
              placeholder="请输入用户ID"
              clearable
            />
          </n-form-item-gi>
          <n-form-item-gi :span="12" label="联系方式">
            <n-input
              v-model:value="advancedSearchForm.contact"
              placeholder="请输入联系方式"
              clearable
            />
          </n-form-item-gi>
          <n-form-item-gi :span="12" label="处理人">
            <n-input
              v-model:value="advancedSearchForm.processor"
              placeholder="请输入处理人"
              clearable
            />
          </n-form-item-gi>
          <n-form-item-gi :span="12" label="处理时间">
            <n-date-picker
              v-model:value="advancedSearchForm.processedDateRange"
              type="daterange"
              clearable
            />
          </n-form-item-gi>
          <n-form-item-gi :span="24" label="内容包含">
            <n-input
              v-model:value="advancedSearchForm.content"
              type="textarea"
              placeholder="请输入反馈内容关键词"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </n-form-item-gi>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="advancedSearchModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleAdvancedSearch">搜索</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 统计分析模态框 -->
    <n-modal v-model:show="statisticsModalVisible" preset="card" title="反馈统计分析" class="statistics-modal">
      <div class="statistics-content">
        <n-tabs type="line" default-value="type">
          <n-tab-pane name="type" tab="按类型统计">
            <div class="chart-container">
              <n-spin :show="statisticsLoading">
                <div ref="typeChartRef" class="chart"></div>
              </n-spin>
            </div>
          </n-tab-pane>
          <n-tab-pane name="status" tab="按状态统计">
            <div class="chart-container">
              <n-spin :show="statisticsLoading">
                <div ref="statusChartRef" class="chart"></div>
              </n-spin>
            </div>
          </n-tab-pane>
          <n-tab-pane name="trend" tab="趋势分析">
            <div class="chart-container">
              <n-spin :show="statisticsLoading">
                <div ref="trendChartRef" class="chart"></div>
              </n-spin>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-modal>

    <!-- 批量回复模态框 -->
    <n-modal v-model:show="batchReplyModalVisible" preset="dialog" title="批量回复反馈" class="batch-reply-modal">
      <n-form :model="batchReplyForm" label-placement="left" label-width="80">
        <n-form-item label="回复内容">
          <n-input
            v-model:value="batchReplyForm.content"
            type="textarea"
            placeholder="请输入回复内容"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="batchReplyModalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleBatchReplySubmit" :loading="batchReplyLoading">
            批量回复
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted, computed, nextTick } from 'vue'
import { useMessage, useDialog, NButton, NTag } from 'naive-ui'
import {
  Eye as EyeIcon,
  Check as ProcessIcon,
  X as CloseIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Filter as FilterIcon
} from '@vicons/tabler'
import { get, post, put } from '../utils/api'

const message = useMessage()
const dialog = useDialog()

// 表格数据
const tableData = ref([])
const loading = ref(false)
const detailModalVisible = ref(false)
const replyModalVisible = ref(false)
const editModalVisible = ref(false)
const replyLoading = ref(false)
const editLoading = ref(false)

// Feedback 类型定义
interface Feedback {
  id: string
  type: string
  content: string
  status: string
  username?: string
  reply?: string
  createdAt: string
  updatedAt?: string
}

const currentFeedback = ref<Feedback | null>(null)
const selectedRowKeys = ref<string[]>([])

// 模态框状态
const advancedSearchModalVisible = ref(false)
const statisticsModalVisible = ref(false)
const batchReplyModalVisible = ref(false)
const statisticsLoading = ref(false)
const batchReplyLoading = ref(false)

// 图表引用
const typeChartRef = ref(null)
const statusChartRef = ref(null)
const trendChartRef = ref(null)

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  processed: 0,
  closed: 0
})

// 搜索表单
const searchForm = reactive({
  username: '',
  type: null,
  status: null,
  priority: null,
  dateRange: null,
  keyword: ''
})

// 高级搜索表单
const advancedSearchForm = reactive({
  userId: '',
  contact: '',
  processor: '',
  processedDateRange: null,
  content: ''
})

// 回复表单
const replyForm = reactive({
  content: ''
})

// 编辑表单
const editForm = reactive({
  id: '',
  type: '',
  content: '',
  contact: '',
  status: '',
  resolution: ''
})

// 批量回复表单
const batchReplyForm = reactive({
  content: ''
})

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 反馈类型选项
const typeOptions = [
  { label: '投诉', value: 'complaint' },
  { label: '举报', value: 'report' },
  { label: '建议', value: 'suggestion' },
  { label: '其他', value: 'other' }
]

// 状态选项
const statusOptions = [
  { label: '未处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '处理完成', value: 'processed' },
  { label: '已关闭', value: 'closed' }
]

// 优先级选项
const priorityOptions = [
  { label: '高', value: 1 },
  { label: '中', value: 2 },
  { label: '低', value: 3 }
]

// 显示高级搜索模态框
const showAdvancedSearch = () => {
  advancedSearchModalVisible.value = true
}

// 显示统计分析模态框
const showStatisticsModal = () => {
  statisticsModalVisible.value = true
  nextTick(() => {
    initCharts()
  })
}

// 清除选择
const handleClearSelection = () => {
  selectedRowKeys.value = []
}

// 批量处理
const handleBatchProcess = () => {
  batchProcess()
}

// 批量关闭
const handleBatchClose = () => {
  batchClose()
}

// 批量回复
const handleBatchReply = () => {
  batchReply()
}

// 批量回复提交
const handleBatchReplySubmit = () => {
  submitBatchReply()
}

// 表格列定义
const columns = [
  {
    type: 'selection',
    width: 50
  },
  {
    title: 'ID',
    key: 'id',
    width: 100,
    ellipsis: { tooltip: true }
  },
  {
    title: '用户名',
    key: 'username',
    width: 100
  },
  {
    title: '反馈类型',
    key: 'type',
    width: 100,
    render(row: any) {
      const typeMap: { [key: string]: { type: string; text: string } } = {
        complaint: { type: 'error', text: '投诉' },
        report: { type: 'warning', text: '举报' },
        suggestion: { type: 'success', text: '建议' },
        other: { type: 'default', text: '其他' }
      }
      const typeInfo = typeMap[row.type] || { type: 'default', text: row.type || '未知' }
      return h(NTag, { type: typeInfo.type, size: 'small' }, () => typeInfo.text)
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: any) {
      const statusMap: { [key: string]: { type: string; text: string } } = {
        pending: { type: 'warning', text: '未处理' },
        processing: { type: 'info', text: '处理中' },
        processed: { type: 'success', text: '已处理' },
        closed: { type: 'error', text: '已关闭' }
      }
      const statusInfo = statusMap[row.status] || { type: 'default', text: row.status || '未知' }
      return h(NTag, { type: statusInfo.type, size: 'small' }, () => statusInfo.text)
    }
  },
  {
    title: '反馈内容',
    key: 'content',
    width: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: '联系方式',
    key: 'contact',
    width: 150,
    ellipsis: { tooltip: true }
  },
  {
    title: '提交时间',
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return h('span', {}, new Date(row.createdAt).toLocaleString())
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right',
    render(row: any) {
      return h('div', { style: { display: 'flex', gap: '4px' } }, [
        h(NButton, {
          size: 'small',
          type: row.status === 'pending' ? 'warning' : 'default',
          onClick: () => handleStatusChange(row.id, 'pending')
        }, () => '未处理'),
        h(NButton, {
          size: 'small',
          type: row.status === 'processing' ? 'info' : 'default',
          onClick: () => handleStatusChange(row.id, 'processing')
        }, () => '处理中'),
        h(NButton, {
          size: 'small',
          type: row.status === 'processed' ? 'success' : 'default',
          onClick: () => handleStatusChange(row.id, 'processed')
        }, () => '已处理')
      ])
    }
  }
]

// 获取反馈列表
const fetchFeedbacks = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      username: searchForm.username,
      type: searchForm.type,
      status: searchForm.status,
      priority: searchForm.priority,
      startDate: searchForm.dateRange ? searchForm.dateRange[0] : null,
      endDate: searchForm.dateRange ? searchForm.dateRange[1] : null,
      keyword: searchForm.keyword
    }

    // 注意：admin-web的API路径是/admin/feedbacks
    // 构建查询参数，注意后端使用的是page和limit，不是pageSize
    const queryParams: any = {
      page: pagination.page,
      limit: pagination.pageSize
    }
    if (searchForm.username) queryParams.username = searchForm.username
    if (searchForm.type) queryParams.type = searchForm.type
    if (searchForm.status) queryParams.status = searchForm.status
    
    console.log('请求反馈列表，参数:', queryParams)
    const response = await get('/admin/feedbacks', queryParams)
    console.log('反馈列表响应:', response)
    
    // 处理后端返回的数据格式
    if (response && response.code === 200) {
      if (response.data && response.data.feedbacks) {
        tableData.value = response.data.feedbacks
        pagination.itemCount = response.data.pagination?.total || 0
        console.log('成功获取反馈列表，数量:', tableData.value.length)
        // 更新统计数据，确保与表格数据一致
        stats.total = response.data.pagination?.total || 0
        // 重新获取统计数据以确保一致性
        fetchFeedbackStats()
      } else if (response.feedbacks) {
        tableData.value = response.feedbacks
        pagination.itemCount = response.pagination?.total || 0
        stats.total = response.pagination?.total || 0
        fetchFeedbackStats()
      } else {
        tableData.value = []
        pagination.itemCount = 0
        stats.total = 0
        stats.pending = 0
        stats.processed = 0
        stats.closed = 0
        console.warn('响应中没有反馈数据')
      }
    } else {
      tableData.value = []
      pagination.itemCount = 0
      stats.total = 0
      stats.pending = 0
      stats.processed = 0
      stats.closed = 0
      console.error('获取反馈列表失败:', response)
      message.error(response?.error || response?.message || '获取反馈列表失败')
    }
  } catch (error) {
    console.error('获取反馈列表失败', error)
    message.error('获取反馈列表失败')
  } finally {
    loading.value = false
  }
}

// 获取反馈统计数据
const fetchFeedbackStats = async () => {
  try {
    const response = await get('/admin/feedbacks/stats')
    if (response && response.code === 200 && response.data) {
      stats.total = response.data.total || 0
      stats.pending = response.data.pending || 0
      stats.processed = response.data.processed || 0
      stats.closed = response.data.closed || 0
    } else {
      // 如果API失败，从表格数据计算统计
      calculateStatsFromTable()
    }
  } catch (error) {
    console.error('获取反馈统计数据失败:', error)
    // API失败时从表格数据计算统计
    calculateStatsFromTable()
  }
}

// 从表格数据计算统计（作为备用方案）
const calculateStatsFromTable = () => {
  stats.total = tableData.value.length
  stats.pending = tableData.value.filter((f: any) => f.status === 'pending').length
  stats.processed = tableData.value.filter((f: any) => f.status === 'processed').length
  stats.closed = tableData.value.filter((f: any) => f.status === 'closed').length
}

// 高级搜索
const handleAdvancedSearch = () => {
  advancedSearchModalVisible.value = true
}

// 选择变化
const handleSelectionChange = (keys: any) => {
  selectedRowKeys.value = keys
}

// 清除选择
const clearSelection = () => {
  selectedRowKeys.value = []
}

// 批量处理
const batchProcess = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要处理的反馈')
    return
  }

  dialog.warning({
    title: '批量处理确认',
    content: `确定要处理选中的 ${selectedRowKeys.value.length} 条反馈吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await post('/admin/feedbacks/batch-process', {
          ids: selectedRowKeys.value
        })
        if (res.code === 200) {
          message.success('批量处理成功')
          clearSelection()
          fetchFeedbacks()
          fetchFeedbackStats()
        } else {
          message.error(res.message || '批量处理失败')
        }
      } catch (error) {
        console.error('批量处理失败:', error)
        message.error('批量处理失败')
      }
    }
  })
}

// 批量关闭
const batchClose = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要关闭的反馈')
    return
  }

  dialog.warning({
    title: '批量关闭确认',
    content: `确定要关闭选中的 ${selectedRowKeys.value.length} 条反馈吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await post('/admin/feedbacks/batch-close', {
          ids: selectedRowKeys.value
        })
        if (res.code === 200) {
          message.success('批量关闭成功')
          clearSelection()
          fetchFeedbacks()
          fetchFeedbackStats()
        } else {
          message.error(res.message || '批量关闭失败')
        }
      } catch (error) {
        console.error('批量关闭失败:', error)
        message.error('批量关闭失败')
      }
    }
  })
}

// 批量回复
const batchReply = () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要回复的反馈')
    return
  }
  batchReplyForm.content = ''
  batchReplyModalVisible.value = true
}

// 提交批量回复
const submitBatchReply = async () => {
  if (!batchReplyForm.content.trim()) {
    message.warning('请输入回复内容')
    return
  }

  batchReplyLoading.value = true
  try {
    const res = await post('/admin/feedbacks/batch-reply', {
      ids: selectedRowKeys.value,
      content: batchReplyForm.content
    })
    if (res.code === 200) {
      message.success('批量回复成功')
      batchReplyModalVisible.value = false
      clearSelection()
      fetchFeedbacks()
      fetchFeedbackStats()
    } else {
      message.error(res.message || '批量回复失败')
    }
  } catch (error) {
    console.error('批量回复失败:', error)
    message.error('批量回复失败')
  } finally {
    batchReplyLoading.value = false
  }
}

// 查看统计
const viewStatistics = () => {
  statisticsModalVisible.value = true
  // 延迟加载图表，确保DOM已渲染
  nextTick(() => {
    initCharts()
  })
}

// 初始化图表
const initCharts = () => {
  // 这里可以初始化图表，例如使用ECharts
  // 由于需要引入图表库，这里只是示例
  console.log('初始化图表')
}

// 执行高级搜索
const executeAdvancedSearch = () => {
  // 将高级搜索条件合并到搜索表单
  Object.assign(searchForm, advancedSearchForm)
  advancedSearchModalVisible.value = false
  handleSearch()
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchFeedbacks()
}

// 重置
const handleReset = () => {
  searchForm.username = ''
  searchForm.type = null
  searchForm.status = null
  searchForm.priority = null
  searchForm.dateRange = null
  searchForm.keyword = ''
  pagination.page = 1
  fetchFeedbacks()
}

// 重置高级搜索
const resetAdvancedSearch = () => {
  advancedSearchForm.userId = ''
  advancedSearchForm.contact = ''
  advancedSearchForm.processor = ''
  advancedSearchForm.processedDateRange = null
  advancedSearchForm.content = ''
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchFeedbacks()
}

// 每页数量变化
const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchFeedbacks()
}

// 查看详情
const handleViewDetail = (row: any) => {
  currentFeedback.value = row
  detailModalVisible.value = true
}

// 编辑反馈
const handleEdit = (row: any) => {
  editForm.id = row.id
  editForm.type = row.type || ''
  editForm.content = row.content || ''
  editForm.contact = row.contact || ''
  editForm.status = row.status || 'pending'
  editForm.resolution = row.resolution || ''
  editModalVisible.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!editForm.content.trim()) {
    message.error('反馈内容不能为空')
    return
  }
  
  editLoading.value = true
  try {
    const updateData: any = {
      content: editForm.content,
      contact: editForm.contact,
      status: editForm.status
    }
    
    if (editForm.resolution) {
      updateData.resolution = editForm.resolution
    }
    
    const response = await put(`/admin/feedbacks/${editForm.id}`, updateData)
    if (response.code === 200) {
      message.success('保存成功')
      editModalVisible.value = false
      fetchFeedbacks()
      fetchFeedbackStats()
    } else {
      message.error(response.message || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    message.error(error.message || '保存失败')
  } finally {
    editLoading.value = false
  }
}

// 更新反馈状态
const handleStatusChange = async (id: string, status: string) => {
  try {
    const statusMap: { [key: string]: string } = {
      'pending': '未处理',
      'processing': '处理中',
      'processed': '处理完成'
    }
    const statusText = statusMap[status] || status
    
    dialog.warning({
      title: '确认更新状态',
      content: `确定要将该反馈状态更新为"${statusText}"吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const response = await put(`/admin/feedbacks/${id}`, { status })
          if (response.code === 200) {
            message.success('状态更新成功')
            fetchFeedbacks()
            fetchFeedbackStats()
          } else {
            message.error(response.message || '状态更新失败')
          }
        } catch (error: any) {
          console.error('状态更新失败:', error)
          message.error(error.message || '状态更新失败')
        }
      }
    })
  } catch (error: any) {
    console.error('状态更新失败:', error)
    message.error('状态更新失败')
  }
}

// 处理反馈
const handleProcess = (id: string) => {
  handleStatusChange(id, 'processed')
}

// 关闭反馈
const handleClose = (id: string) => {
  handleStatusChange(id, 'closed')
}

// 显示回复模态框
const showReplyModal = () => {
  replyForm.content = ''
  replyModalVisible.value = true
}

// 回复反馈
const handleReply = async () => {
  if (!replyForm.content.trim()) {
    message.error('请输入回复内容')
    return
  }

  replyLoading.value = true
  try {
    await post(`/feedbacks/${currentFeedback.value.id}/reply`, {
      content: replyForm.content
    })

    message.success('回复成功')
    replyModalVisible.value = false
    detailModalVisible.value = false
    fetchFeedbacks()
  } catch (error) {
    console.error('回复失败', error)
    message.error('回复失败')
  } finally {
    replyLoading.value = false
  }
}

// 导出反馈数据
const handleExport = async () => {
  try {
    const response = await get('/feedbacks/export', {
      responseType: 'blob'
    })

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `feedbacks_${new Date().toISOString().split('T')[0]}.csv`)
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

// 获取类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    complaint: 'error',
    report: 'warning',
    suggestion: 'success',
    other: 'default'
  }
  return typeMap[type] || 'default'
}

// 获取类型文本
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    complaint: '投诉',
    report: '举报',
    suggestion: '建议',
    other: '其他'
  }
  return typeMap[type] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap = {
    pending: 'warning',
    processed: 'success',
    closed: 'error'
  }
  return statusMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processed: '已处理',
    closed: '已关闭'
  }
  return statusMap[status] || '未知'
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

// 计算属性：详情模态框标题
const detailModalTitle = computed(() => {
  return currentFeedback.value ? `反馈详情 - ${getTypeText(currentFeedback.value.type)}` : '反馈详情'
})

// 计算属性
const hasPendingFeedbacks = computed(() => stats.pending > 0)

// 格式化优先级
const _formatPriority = (priority: number) => {
  switch (priority) {
    case 1: return '高'
    case 2: return '中'
    case 3: return '低'
    default: return '未知'
  }
}

// 图标定义
const downloadIcon = () => h(DownloadIcon)
const searchIcon = () => h(SearchIcon)
const refreshIcon = () => h(RefreshIcon)
const filterIcon = () => h(FilterIcon)

// 组件挂载
onMounted(() => {
  fetchFeedbacks()
  fetchFeedbackStats()
})
</script>

<style scoped>
.feedbacks-container {
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

.header-right {
  display: flex;
  gap: 10px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s ease;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
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
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.search-input, .search-select, .search-date {
  transition: all 0.3s ease;
}

.search-input:hover, .search-select:hover, .search-date:hover {
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

.feedback-table {
  border-radius: 8px;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.table-count {
  font-size: 14px;
  color: #666;
}

.batch-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.batch-actions .n-button {
  border-radius: 4px;
}

/* 表格列样式 */
.id-column {
  font-weight: 600;
  color: #666;
}

.username-cell {
  display: flex;
  align-items: center;
}

.username-text {
  font-weight: 500;
}

.type-cell, .status-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-icon, .status-icon {
  font-size: 16px;
}

.priority-column {
  text-align: center;
}

.priority-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.priority-icon {
  font-size: 16px;
}

.date-cell {
  display: flex;
  align-items: center;
}

.no-date {
  color: #ccc;
  font-style: italic;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.view-btn, .edit-btn, .process-btn, .close-btn, .status-btn {
  border-radius: 6px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.view-btn:hover, .edit-btn:hover, .process-btn:hover, .close-btn:hover, .status-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.edit-btn:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.detail-modal, .reply-modal {
  border-radius: 12px;
}

.feedback-detail {
  margin-top: 16px;
  line-height: 1.6;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-label {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.detail-content {
  color: #666;
}

.feedback-content,
.feedback-reply {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #1677ff;
}

.feedback-reply {
  background-color: #f0f7ff;
  border-left-color: #52c41a;
}

.reply-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.reply-content {
  color: #666;
}

.reply-form {
  margin-top: 16px;
}

.reply-textarea {
  transition: all 0.3s ease;
}

.reply-textarea:focus {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.close-btn, .reply-btn, .cancel-btn, .send-btn {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.close-btn:hover, .reply-btn:hover, .cancel-btn:hover, .send-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .feedbacks-container {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .feedbacks-container {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .export-btn {
    width: 100%;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .batch-actions {
    flex-wrap: wrap;
  }
  
  .stats-container {
    margin-bottom: 16px;
  }
  
  .shape {
    display: none;
  }
}
</style>