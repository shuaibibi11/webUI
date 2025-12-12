<template>
  <div class="dashboard-container">
    <n-spin :show="loading">
      <!-- 核心统计卡片 -->
      <n-card title="系统概览" class="stats-card">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
            <div class="stat-sub">活跃: {{ stats.activeUsers }} / 待审批: {{ stats.pendingUsers }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalConversations }}</div>
            <div class="stat-label">总对话数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalMessages }}</div>
            <div class="stat-label">总消息数</div>
          </div>
          <div class="stat-item warning" v-if="stats.pendingFeedbacks > 0">
            <div class="stat-value">{{ stats.pendingFeedbacks }}</div>
            <div class="stat-label">待处理反馈</div>
          </div>
          <div class="stat-item" v-else>
            <div class="stat-value">{{ stats.totalFeedbacks }}</div>
            <div class="stat-label">总反馈数</div>
          </div>
        </div>
      </n-card>

      <!-- 模型和工作流配置 -->
      <n-card title="模型与工作流配置" class="config-card">
        <div class="config-grid">
          <div class="config-item">
            <n-icon size="32" color="#1677FF"><ServerOutline /></n-icon>
            <div class="config-info">
              <div class="config-value">{{ stats.enabledModels }} / {{ stats.totalModels }}</div>
              <div class="config-label">启用模型 / 总模型</div>
            </div>
          </div>
          <div class="config-item">
            <n-icon size="32" color="#722ED1"><GitNetworkOutline /></n-icon>
            <div class="config-info">
              <div class="config-value">{{ stats.enabledWorkflows }} / {{ stats.totalWorkflows }}</div>
              <div class="config-label">启用工作流 / 总工作流</div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- 其他统计 -->
      <div class="secondary-stats">
        <n-card title="用户状态" class="secondary-card">
          <div class="status-list">
            <div class="status-item">
              <span class="status-dot active"></span>
              <span class="status-label">活跃用户</span>
              <span class="status-value">{{ stats.activeUsers }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot pending"></span>
              <span class="status-label">待审批</span>
              <span class="status-value">{{ stats.pendingUsers }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot banned"></span>
              <span class="status-label">已封禁</span>
              <span class="status-value">{{ stats.bannedUsers }}</span>
            </div>
          </div>
        </n-card>

        <n-card title="待处理事项" class="secondary-card">
          <div class="todo-list">
            <div class="todo-item" v-if="stats.pendingUsers > 0">
              <n-badge :value="stats.pendingUsers" :max="99">
                <span class="todo-label">待审批注册</span>
              </n-badge>
            </div>
            <div class="todo-item" v-if="stats.pendingFeedbacks > 0">
              <n-badge :value="stats.pendingFeedbacks" :max="99">
                <span class="todo-label">待处理反馈</span>
              </n-badge>
            </div>
            <div class="todo-item" v-if="stats.pendingPasswordResets > 0">
              <n-badge :value="stats.pendingPasswordResets" :max="99">
                <span class="todo-label">密码重置申请</span>
              </n-badge>
            </div>
            <div class="todo-empty" v-if="stats.pendingUsers === 0 && stats.pendingFeedbacks === 0 && stats.pendingPasswordResets === 0">
              <n-icon size="24" color="#52C41A"><CheckmarkCircle /></n-icon>
              <span>暂无待处理事项</span>
            </div>
          </div>
        </n-card>

        <n-card title="安全统计" class="secondary-card">
          <div class="status-list">
            <div class="status-item">
              <span class="status-dot warning"></span>
              <span class="status-label">违规记录</span>
              <span class="status-value">{{ stats.totalViolations }}</span>
            </div>
            <div class="status-item">
              <span class="status-dot banned"></span>
              <span class="status-label">封禁用户</span>
              <span class="status-value">{{ stats.bannedUsers }}</span>
            </div>
          </div>
        </n-card>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard, NSpin, NIcon, NBadge, useMessage } from 'naive-ui'
import { ServerOutline, GitNetworkOutline, CheckmarkCircle } from '@vicons/ionicons5'
import { get } from '../utils/api'

const message = useMessage()
const loading = ref(false)

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  bannedUsers: number
  totalConversations: number
  totalMessages: number
  totalFeedbacks: number
  pendingFeedbacks: number
  totalModels: number
  enabledModels: number
  totalWorkflows: number
  enabledWorkflows: number
  totalViolations: number
  pendingPasswordResets: number
}

const stats = ref<DashboardStats>({
  totalUsers: 0,
  activeUsers: 0,
  pendingUsers: 0,
  bannedUsers: 0,
  totalConversations: 0,
  totalMessages: 0,
  totalFeedbacks: 0,
  pendingFeedbacks: 0,
  totalModels: 0,
  enabledModels: 0,
  totalWorkflows: 0,
  enabledWorkflows: 0,
  totalViolations: 0,
  pendingPasswordResets: 0
})

const fetchDashboardStats = async () => {
  loading.value = true
  try {
    const response = await get('/admin/dashboard')
    if (response && response.code === 200 && response.data) {
      stats.value = {
        totalUsers: response.data.totalUsers || 0,
        activeUsers: response.data.activeUsers || 0,
        pendingUsers: response.data.pendingUsers || 0,
        bannedUsers: response.data.bannedUsers || 0,
        totalConversations: response.data.totalConversations || 0,
        totalMessages: response.data.totalMessages || 0,
        totalFeedbacks: response.data.totalFeedbacks || 0,
        pendingFeedbacks: response.data.pendingFeedbacks || 0,
        totalModels: response.data.totalModels || 0,
        enabledModels: response.data.enabledModels || 0,
        totalWorkflows: response.data.totalWorkflows || 0,
        enabledWorkflows: response.data.enabledWorkflows || 0,
        totalViolations: response.data.totalViolations || 0,
        pendingPasswordResets: response.data.pendingPasswordResets || 0
      }
    }
  } catch (error) {
    console.error('获取控制台数据失败:', error)
    message.error('获取控制台数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-card {
  margin-bottom: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 24px;
  background-color: #F5F7FA;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-item.warning {
  background-color: #FFF7E6;
  border: 1px solid #FFD591;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #1677FF;
  margin-bottom: 8px;
}

.stat-item.warning .stat-value {
  color: #FA8C16;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-sub {
  font-size: 12px;
  color: #C0C4CC;
  margin-top: 4px;
}

/* 配置卡片 */
.config-card {
  margin-bottom: 0;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background-color: #F5F7FA;
  border-radius: 12px;
}

.config-info {
  flex: 1;
}

.config-value {
  font-size: 24px;
  font-weight: bold;
  color: #1D2129;
}

.config-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 次要统计 */
.secondary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.secondary-card {
  height: auto;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #F5F7FA;
  border-radius: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.active {
  background-color: #52C41A;
}

.status-dot.pending {
  background-color: #FAAD14;
}

.status-dot.banned {
  background-color: #FF4D4F;
}

.status-dot.warning {
  background-color: #FA8C16;
}

.status-label {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.status-value {
  font-size: 18px;
  font-weight: 600;
  color: #1D2129;
}

/* 待办事项 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todo-item {
  padding: 12px;
  background-color: #FFF7E6;
  border-radius: 8px;
  border: 1px solid #FFD591;
}

.todo-label {
  font-size: 14px;
  color: #D46B08;
  margin-left: 8px;
}

.todo-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background-color: #F6FFED;
  border-radius: 8px;
  color: #52C41A;
  font-size: 14px;
}
</style>
