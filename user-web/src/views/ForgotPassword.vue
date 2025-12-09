<template>
  <div class="forgot-password-container">
    <!-- 顶部导航按钮 -->
    <div class="top-nav">
      <n-button text type="primary" @click="$router.push('/login')" class="nav-btn back-btn">
        <template #icon>
          <n-icon size="18">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </n-icon>
        </template>
        返回登录
      </n-button>
      <n-button text type="primary" @click="$router.push('/feedback')" class="nav-btn feedback-btn">
        意见反馈
        <template #icon>
          <n-icon size="18">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
            </svg>
          </n-icon>
        </template>
      </n-button>
    </div>

    <!-- 背景动画 -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
      </div>
    </div>

    <n-card class="forgot-password-card" :bordered="false">
      <div class="card-header">
        <div class="icon-wrapper">
          <n-icon size="48" color="#5e72e4">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </n-icon>
        </div>
        <h2 class="title">找回密码</h2>
        <p class="subtitle">请填写账号信息和新密码，提交后等待管理员审核</p>
      </div>

      <n-form :model="form" :rules="rules" ref="formRef" class="forgot-form">
        <n-form-item path="identifier" label="账号信息">
          <n-input
            v-model:value="form.identifier"
            placeholder="请输入账号/邮箱/手机号"
            size="large"
            :input-props="{ autocomplete: 'username' }"
          >
            <template #prefix>
              <n-icon color="#86909C">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="newPassword" label="新密码">
          <n-input
            v-model:value="form.newPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入新密码（8-20位，含大小写字母、数字和特殊字符）"
            size="large"
            :input-props="{ autocomplete: 'new-password' }"
          >
            <template #prefix>
              <n-icon color="#86909C">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </n-icon>
            </template>
            <template #suffix>
              <n-button text @click="showPassword = !showPassword" :title="showPassword ? '隐藏密码' : '显示密码'">
                <n-icon size="20" color="#86909C">
                  <svg v-if="showPassword" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </n-icon>
              </n-button>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="confirmPassword" label="确认密码">
          <n-input
            v-model:value="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="请再次输入新密码"
            size="large"
            :input-props="{ autocomplete: 'new-password' }"
          >
            <template #prefix>
              <n-icon color="#86909C">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                </svg>
              </n-icon>
            </template>
            <template #suffix>
              <n-button text @click="showConfirmPassword = !showConfirmPassword" :title="showConfirmPassword ? '隐藏密码' : '显示密码'">
                <n-icon size="20" color="#86909C">
                  <svg v-if="showConfirmPassword" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                </n-icon>
              </n-button>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item path="contact" label="联系方式（选填）">
          <n-input
            v-model:value="form.contact"
            placeholder="请输入手机号或邮箱，方便工作人员联系您"
            size="large"
          >
            <template #prefix>
              <n-icon color="#86909C">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </n-icon>
            </template>
          </n-input>
        </n-form-item>

        <n-form-item>
          <n-button
            type="primary"
            block
            @click="handleSubmit"
            :loading="loading"
            class="submit-btn"
            size="large"
          >
            提交申请
          </n-button>
        </n-form-item>

        <div class="form-footer">
          <n-button text type="primary" @click="$router.push('/login')">返回登录</n-button>
          <n-button text type="primary" @click="$router.push('/register')">立即注册</n-button>
        </div>
      </n-form>

      <div class="tips-section">
        <div class="tip-item">
          <n-icon size="16" color="#5e72e4">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </n-icon>
          <span>审核时间通常在24小时内完成</span>
        </div>
        <div class="tip-item">
          <n-icon size="16" color="#5e72e4">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </n-icon>
          <span>如需加急请通过意见反馈入口联系我们</span>
        </div>
      </div>
    </n-card>

    <!-- 成功提示弹窗 -->
    <n-modal v-model:show="showSuccessModal" preset="dialog" type="success" :closable="false" :mask-closable="false">
      <template #header>
        <div class="success-header">
          <n-icon size="48" color="#52c41a">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </n-icon>
          <h3>申请已提交</h3>
        </div>
      </template>
      <div class="success-content">
        <p>您的密码重置申请已成功提交！</p>
        <p class="highlight">请等待工作人员进行审核</p>
        <p class="time-info">审核时间：<strong>24小时内</strong></p>
        <p class="contact-info">如需加急，可通过<n-text type="primary" @click="goToFeedback" style="cursor: pointer;">意见反馈</n-text>入口联系我们</p>
      </div>
      <template #action>
        <n-button type="primary" @click="handleCloseSuccess" size="large">
          我知道了
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { post } from '../utils/api'

const router = useRouter()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showSuccessModal = ref(false)

const form = reactive({
  identifier: '',
  newPassword: '',
  confirmPassword: '',
  contact: ''
})

const rules: FormRules = {
  identifier: [
    { required: true, message: '请输入账号/邮箱/手机号', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度必须在8-20个字符之间', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      message: '密码必须包含大小写字母、数字和特殊字符(@$!%*?&)',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        if (value !== form.newPassword) {
          return new Error('两次输入的密码不一致')
        }
        return true
      },
      trigger: 'blur'
    }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const response = await post('/users/password-reset/request', {
      identifier: form.identifier,
      newPassword: form.newPassword,
      contact: form.contact
    })

    if (response.code === 200) {
      showSuccessModal.value = true
    } else {
      message.error(response.error || response.message || '提交失败')
    }
  } catch (error: any) {
    console.error('提交失败', error)
    message.error(error.response?.data?.error || error.message || '提交失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleCloseSuccess = () => {
  showSuccessModal.value = false
  router.push('/login')
}

const goToFeedback = () => {
  showSuccessModal.value = false
  router.push('/feedback')
}
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 背景动画 */
.bg-animation {
  position: absolute;
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
  opacity: 0.15;
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -50px;
  left: -50px;
  animation-delay: 3s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 40%;
  left: 10%;
  animation-delay: 5s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  bottom: 20%;
  right: 5%;
  animation-delay: 7s;
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

.forgot-password-card {
  width: 480px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.card-header {
  text-align: center;
  margin-bottom: 24px;
}

.icon-wrapper {
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.forgot-form {
  padding: 0 20px;
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #5e72e4 0%, #825ee4 100%);
  border: none;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(94, 114, 228, 0.4);
}

.form-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.tips-section {
  margin-top: 24px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #718096;
  margin-bottom: 8px;
}

.tip-item:last-child {
  margin-bottom: 0;
}

/* 成功弹窗样式 */
.success-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.success-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
}

.success-content {
  text-align: center;
  padding: 16px 0;
}

.success-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #718096;
}

.success-content .highlight {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.success-content .time-info {
  background: #f0f7ff;
  padding: 8px 16px;
  border-radius: 6px;
  margin: 16px 0;
}

.success-content .time-info strong {
  color: #5e72e4;
}

.success-content .contact-info {
  font-size: 13px;
}

/* 响应式 */
@media (max-width: 520px) {
  .forgot-password-card {
    width: calc(100% - 32px);
    margin: 16px;
  }

  .forgot-form {
    padding: 0 10px;
  }

  .top-nav {
    padding: 12px 16px;
  }
}

/* 顶部导航样式 */
.top-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 20px 24px;
  z-index: 10;
}

.nav-btn {
  font-size: 14px;
  font-weight: 500;
  color: white;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.feedback-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
