<template>
  <n-config-provider>
    <n-message-provider>
      <n-dialog-provider>
        <!-- 登录页面不显示导航栏 -->
        <div v-if="isLoginPage" class="login-page-container">
          <router-view />
        </div>

        <!-- 其他页面显示完整布局 -->
        <div v-else class="admin-container">
          <!-- 侧边栏导航 -->
          <div class="sidebar">
            <div class="sidebar-header">
              <h2 class="logo">和元智擎</h2>
            </div>
            <div class="sidebar-menu">
              <n-menu
                :options="menuOptions"
                v-model:value="currentMenu"
                @update:value="handleMenuChange"
                :default-expanded-keys="['system', 'approvals']"
              />
            </div>
          </div>

          <!-- 主内容区域 -->
          <div class="main-content">
            <!-- 顶部导航栏 -->
            <div class="top-nav">
              <div class="nav-left">
                <h3 class="page-title">{{ currentPageTitle }}</h3>
              </div>
              <div class="nav-right">
                <!-- 通知铃铛 -->
                <n-popover trigger="click" placement="bottom-end" :width="360" @update:show="handleNotificationShow">
                  <template #trigger>
                    <n-badge :value="notificationCount" :max="99" :show="notificationCount > 0">
                      <n-button quaternary circle size="medium">
                        <template #icon>
                          <n-icon size="20"><NotificationsOutline /></n-icon>
                        </template>
                      </n-button>
                    </n-badge>
                  </template>
                  <div class="notification-panel">
                    <div class="notification-header">
                      <span class="notification-title">通知提醒</span>
                      <n-button text size="small" @click="fetchNotifications">刷新</n-button>
                    </div>
                    <div v-if="notifications.length === 0" class="notification-empty">
                      <n-icon size="40" color="#ccc"><CheckmarkCircleOutline /></n-icon>
                      <p>暂无待处理事项</p>
                    </div>
                    <div v-else class="notification-list">
                      <div
                        v-for="notification in notifications"
                        :key="notification.id"
                        class="notification-item"
                        :class="notification.level"
                        @click="handleNotificationClick(notification)"
                      >
                        <div class="notification-icon">
                          <n-icon size="20" :color="getNotificationColor(notification.level)">
                            <AlertCircleOutline v-if="notification.level === 'warning'" />
                            <InformationCircleOutline v-else />
                          </n-icon>
                        </div>
                        <div class="notification-content">
                          <div class="notification-item-title">{{ notification.title }}</div>
                          <div class="notification-message">{{ notification.message }}</div>
                        </div>
                        <div class="notification-badge">
                          <n-tag :type="notification.level === 'warning' ? 'warning' : 'info'" size="small">
                            {{ notification.count }}
                          </n-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </n-popover>

                <n-dropdown trigger="hover" :options="dropdownOptions" @select="handleDropdownSelect">
                  <n-button type="primary" ghost>
                    <template #icon>
                      <n-icon><ChevronDown /></n-icon>
                    </template>
                    管理员
                  </n-button>
                </n-dropdown>
              </div>
            </div>

            <!-- 页面内容 -->
            <div class="page-content">
              <router-view />
            </div>
          </div>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon, NDropdown, NBadge, NPopover, NTag, NButton } from 'naive-ui'
import {
  PersonCircle,
  Settings,
  DocumentText,
  Chatbubble,
  ChevronDown,
  ChatboxEllipses,
  NotificationsOutline,
  AlertCircleOutline,
  InformationCircleOutline,
  CheckmarkCircleOutline,
  KeyOutline
} from '@vicons/ionicons5'
import { get } from './utils/api'

const router = useRouter()
const route = useRoute()

// 检查当前是否为登录页面
const isLoginPage = computed(() => route.path === '/login')

const currentMenu = ref('dashboard')
const pageTitles = ref({
  dashboard: '控制台',
  users: '用户管理',
  registrations: '注册审批',
  models: '模型配置',
  workflows: '工作流配置',
  logs: '日志管理',
  feedbacks: '反馈管理',
  conversations: '对话历史',
  'password-resets': '密码重置审批',
  'action-logs': '用户操作日志',
  'mute-configs': '禁言配置',
  'agreements': '协议管理'
})

const currentPageTitle = computed(() => pageTitles.value[currentMenu.value as keyof typeof pageTitles.value] || '控制台')

// 通知相关
const notifications = ref<any[]>([])
const notificationCount = computed(() => notifications.value.reduce((sum, n) => sum + (n.count || 0), 0))
let notificationInterval: ReturnType<typeof setInterval> | null = null

const menuOptions = [
  {
    label: '控制台',
    key: 'dashboard',
    icon: () => h(NIcon, null, { default: () => h(DocumentText) })
  },
  {
    label: '系统管理',
    key: 'system',
    icon: () => h(NIcon, null, { default: () => h(Settings) }),
    children: [
      {
        label: '用户管理',
        key: 'users',
        icon: () => h(NIcon, null, { default: () => h(PersonCircle) })
      },
      {
        label: '模型配置',
        key: 'models',
        icon: () => h(NIcon, null, { default: () => h(Settings) })
      },
      {
        label: '工作流配置',
        key: 'workflows',
        icon: () => h(NIcon, null, { default: () => h(Settings) })
      },
      {
        label: '禁言配置',
        key: 'mute-configs',
        icon: () => h(NIcon, null, { default: () => h(Settings) })
      },
      {
        label: '协议管理',
        key: 'agreements',
        icon: () => h(NIcon, null, { default: () => h(DocumentText) })
      }
    ]
  },
  {
    label: '审批管理',
    key: 'approvals',
    icon: () => h(NIcon, null, { default: () => h(KeyOutline) }),
    children: [
      {
        label: '注册审批',
        key: 'registrations',
        icon: () => h(NIcon, null, { default: () => h(PersonCircle) })
      },
      {
        label: '密码重置审批',
        key: 'password-resets',
        icon: () => h(NIcon, null, { default: () => h(KeyOutline) })
      }
    ]
  },
  {
    label: '对话历史',
    key: 'conversations',
    icon: () => h(NIcon, null, { default: () => h(ChatboxEllipses) })
  },
  {
    label: '日志管理',
    key: 'logs',
    icon: () => h(NIcon, null, { default: () => h(DocumentText) })
  },
  {
    label: '用户操作日志',
    key: 'action-logs',
    icon: () => h(NIcon, null, { default: () => h(DocumentText) })
  },
  {
    label: '反馈管理',
    key: 'feedbacks',
    icon: () => h(NIcon, null, { default: () => h(Chatbubble) })
  }
]

const handleMenuChange = (key: string) => {
  currentMenu.value = key
  router.push(`/${key}`)
}

// Dropdown选项
const dropdownOptions = [
  { label: '退出登录', key: 'logout' }
]

// Dropdown选择处理
const handleDropdownSelect = (key: string) => {
  if (key === 'logout') {
    handleLogout()
  }
}

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  router.push('/login')
}

// 获取通知
const fetchNotifications = async () => {
  try {
    const response = await get('/admin/notifications')
    if (response && response.code === 200 && response.data) {
      notifications.value = response.data.notifications || []
    }
  } catch (error) {
    console.error('获取通知失败:', error)
  }
}

// 通知面板显示时刷新
const handleNotificationShow = (show: boolean) => {
  if (show) {
    fetchNotifications()
  }
}

// 点击通知
const handleNotificationClick = (notification: any) => {
  if (notification.link) {
    // 从 link 中提取路由路径
    const path = notification.link.split('?')[0]
    currentMenu.value = path.replace('/', '')
    router.push(notification.link)
  }
}

// 获取通知颜色
const getNotificationColor = (level: string) => {
  const colors: { [key: string]: string } = {
    warning: '#fb6340',
    info: '#5e72e4',
    success: '#2dce89',
    error: '#f5365c'
  }
  return colors[level] || '#5e72e4'
}

// 组件挂载
onMounted(() => {
  // 只在非登录页面加载通知
  if (!isLoginPage.value) {
    fetchNotifications()
    // 每60秒刷新一次通知
    notificationInterval = setInterval(fetchNotifications, 60000)
  }
})

// 组件卸载
onUnmounted(() => {
  if (notificationInterval) {
    clearInterval(notificationInterval)
    notificationInterval = null
  }
})
</script>

<style scoped>
/* 登录页面容器样式 */
.login-page-container {
  height: 100vh;
  background-color: #F5F7FA;
}

.admin-container {
  display: flex;
  height: 100vh;
  background-color: #F5F7FA;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background-color: #FFFFFF;
  border-right: 1px solid #EBEEF5;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #EBEEF5;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: #1677FF;
  margin: 0;
}

.sidebar-menu {
  flex: 1;
  padding: 16px 0;
}

/* 主内容区域样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航栏样式 */
.top-nav {
  height: 64px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.username {
  margin-left: 8px;
  font-weight: 500;
}

/* 页面内容样式 */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #F5F7FA;
}

/* 通知面板样式 */
.notification-panel {
  max-height: 400px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.notification-empty p {
  margin-top: 12px;
  font-size: 14px;
}

.notification-list {
  padding: 8px 0;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f5f5f5;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.warning {
  border-left: 3px solid #fb6340;
}

.notification-item.info {
  border-left: 3px solid #5e72e4;
}

.notification-icon {
  flex-shrink: 0;
  margin-right: 12px;
  margin-top: 2px;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.notification-badge {
  flex-shrink: 0;
  margin-left: 12px;
}
</style>
