<template>
  <div class="share-container">
    <!-- ���景动画元素 -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- 顶部导航 -->
    <div class="top-nav">
      <div class="brand">
        <n-icon size="24">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </n-icon>
        <span class="brand-text">和元智擎</span>
      </div>
      <n-button text type="primary" @click="goToLogin" class="login-btn">
        登录使用
      </n-button>
    </div>

    <n-card class="share-card" :bordered="false">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <n-spin size="large" />
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <n-icon size="64" color="#f5365c">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </n-icon>
        <div class="error-text">{{ errorMessage }}</div>
        <n-button type="primary" @click="goToLogin">返回首页</n-button>
      </div>

      <!-- 分享内容 -->
      <div v-else class="share-content">
        <div class="share-header">
          <div class="share-info">
            <h2 class="share-title">{{ shareData?.title || '分享的对话' }}</h2>
            <div class="share-meta">
              <span>分享者: {{ shareData?.sharedBy || '用户' }}</span>
              <span class="separator">|</span>
              <span>{{ formatDate(shareData?.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="messages-list">
          <div v-for="(msg, index) in shareData?.messages" :key="index" class="message-item"
            :class="{ 'user-message': msg.role === 'user', 'assistant-message': msg.role === 'assistant' }">
            <div v-if="msg.role === 'assistant'" class="message-left">
              <div class="message-avatar">
                <n-avatar round style="background-color: #1677FF;">
                  <n-icon>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                  </n-icon>
                </n-avatar>
              </div>
              <div class="message-bubble assistant-bubble">
                <div class="message-text" v-html="formatMessageContent(msg.content)"></div>
              </div>
            </div>
            <div v-else class="message-right">
              <div class="message-bubble user-bubble">
                <div class="message-text" v-html="formatMessageContent(msg.content)"></div>
              </div>
              <div class="message-avatar">
                <n-avatar round style="background-color: #52C41A;">
                  <n-icon>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </n-icon>
                </n-avatar>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作 -->
        <div class="share-footer">
          <n-button type="primary" @click="goToLogin" size="large" class="try-btn">
            立即体验
          </n-button>
          <div class="footer-tip">登录后即可开始您的智能对话之旅</div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

interface ShareMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ShareData {
  id: string
  title: string
  sharedBy: string
  messages: ShareMessage[]
  createdAt: string
}

const loading = ref(true)
const error = ref(false)
const errorMessage = ref('')
const shareData = ref<ShareData | null>(null)

const fetchShareData = async () => {
  const shareId = route.params.id as string
  if (!shareId) {
    error.value = true
    errorMessage.value = '无效的分享链接'
    loading.value = false
    return
  }

  try {
    // 从URL中获取分享数据（URL参数方式）
    const encodedData = route.query.data as string
    if (encodedData) {
      // 从URL参数解码分享数据
      const decodedData = JSON.parse(decodeURIComponent(atob(encodedData)))
      shareData.value = decodedData
      loading.value = false
      return
    }

    // 如果没有URL参数，尝试从API获取
    const response = await fetch(`/api/shares/${shareId}`)
    if (!response.ok) {
      throw new Error('分享内容不存在或已过期')
    }
    const data = await response.json()
    if (data.code === 200 && data.data) {
      shareData.value = data.data
    } else {
      throw new Error(data.message || '获取分享内容失败')
    }
  } catch (e: any) {
    error.value = true
    errorMessage.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const formatMessageContent = (content: string | null | undefined) => {
  if (!content || content.trim() === '') {
    return ''
  }
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  fetchShareData()
})
</script>

<style scoped>
.share-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  padding: 20px;
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
  pointer-events: none;
}

.floating-shapes {
  position: relative;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  background: linear-gradient(45deg, #1677ff, #40a9ff);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 150px;
  height: 150px;
  top: 10%;
  left: 10%;
}

.shape-2 {
  width: 100px;
  height: 100px;
  top: 60%;
  right: 15%;
  animation-delay: 3s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 6s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-20px) rotate(5deg); }
  50% { transform: translateY(10px) rotate(-5deg); }
  75% { transform: translateY(-15px) rotate(3deg); }
}

/* 顶部导航 */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1677FF;
}

.brand-text {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #1677FF, #40a9ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.login-btn {
  font-weight: 500;
}

/* 分享卡片 */
.share-card {
  width: 100%;
  max-width: 800px;
  margin-top: 80px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-text {
  margin-top: 16px;
  color: #86909C;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.error-text {
  margin: 16px 0 24px;
  font-size: 16px;
  color: #86909C;
}

/* 分享内容 */
.share-content {
  padding: 24px;
}

.share-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #EBEEF5;
}

.share-title {
  font-size: 20px;
  font-weight: 600;
  color: #1D2129;
  margin: 0 0 8px 0;
}

.share-meta {
  font-size: 13px;
  color: #86909C;
}

.separator {
  margin: 0 8px;
}

/* 消息列表 */
.messages-list {
  max-height: 500px;
  overflow-y: auto;
  padding: 16px 0;
}

.message-item {
  margin-bottom: 16px;
}

.message-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.message-right {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  justify-content: flex-end;
}

.message-avatar {
  flex-shrink: 0;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 70%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-bubble {
  background: linear-gradient(135deg, #1677FF 0%, #40a9ff 100%);
  color: white;
}

.assistant-bubble {
  background-color: #FFFFFF;
  color: #1D2129;
  border: 1px solid #EBEEF5;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

/* 底部 */
.share-footer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #EBEEF5;
  text-align: center;
}

.try-btn {
  padding: 0 48px;
  height: 48px;
  font-size: 16px;
  border-radius: 24px;
  background: linear-gradient(90deg, #1677FF 0%, #40a9ff 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
}

.try-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
}

.footer-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #86909C;
}

/* 滚动条 */
.messages-list::-webkit-scrollbar {
  width: 6px;
}

.messages-list::-webkit-scrollbar-track {
  background: #F5F7FA;
}

.messages-list::-webkit-scrollbar-thumb {
  background: #C0C4CC;
  border-radius: 3px;
}
</style>
