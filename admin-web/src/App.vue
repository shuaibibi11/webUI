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
                :default-expanded-keys="['system']"
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
import { ref, computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NIcon, NDropdown } from 'naive-ui'
import {
  PersonCircle,
  Settings,
  DocumentText,
  Chatbubble,
  ChevronDown,
  ChatboxEllipses
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()

// 检查当前是否为登录页面
const isLoginPage = computed(() => route.path === '/login')

const currentMenu = ref('dashboard')
const pageTitles = ref({
  dashboard: '控制台',
  users: '用户管理',
  models: '模型配置',
  workflows: '工作流配置',
  logs: '日志管理',
  feedbacks: '反馈管理',
  conversations: '对话历史'
})

const currentPageTitle = computed(() => pageTitles.value[currentMenu.value as keyof typeof pageTitles.value] || '控制台')

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
</style>