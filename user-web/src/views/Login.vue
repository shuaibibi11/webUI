<template>
  <div class="login-container">
    <!-- 顶部反馈按钮 -->
    <div class="top-nav">
      <div></div>
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

    <div class="login-content">
      <div class="login-header">
        <div class="logo">
          <div class="logo-icon">
            <n-icon size="48">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </n-icon>
          </div>
          <h1 class="logo-text">和元智擎</h1>
          <p class="logo-subtitle">便捷、灵活、可靠的企业级大模型应用开发平台</p>
        </div>
      </div>

      <div class="login-form-wrapper">
        <div class="login-tabs">
          <div class="tab-item" :class="{ active: loginType === 'account' }" @click="switchTab('account')">
            账号登录
          </div>
          <div class="tab-item" :class="{ active: loginType === 'phone' }" @click="switchTab('phone')">
            手机登录
          </div>
        </div>

        <n-form :model="form" :rules="rules" ref="formRef" class="login-form">
          <!-- 账号登录 -->
          <n-form-item v-if="loginType === 'account'" path="username">
            <n-input v-model:value="form.username" placeholder="请输入用户名或邮箱" :prefix="userIcon" class="login-input"
              size="large" @keydown.enter="handleLogin" />
          </n-form-item>

          <!-- 手机登录 -->
          <n-form-item v-else path="phone">
            <n-input v-model:value="form.phone" placeholder="请输入手机号" :prefix="phoneIcon" class="login-input"
              size="large" @keydown.enter="handleLogin" />
          </n-form-item>

          <n-form-item path="password">
            <n-input v-model:value="form.password" type="password" placeholder="请输入密码" :prefix="lockIcon"
              show-password-on="mousedown" class="login-input" size="large" @keydown.enter="handleLogin" />
          </n-form-item>

          <div class="login-options">
            <n-checkbox v-model:checked="form.remember">
              记住我
            </n-checkbox>
            <n-text type="primary" @click="$router.push('/forgot-password')" class="forgot-password">
              忘记密码?
            </n-text>
          </div>

          <n-form-item>
            <n-button type="primary" block @click="handleLogin" :loading="loading" class="login-button" size="large">
              <template #icon>
                <n-icon v-if="!loading">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 17l5-5-5-5v10z" />
                  </svg>
                </n-icon>
              </template>
              登录
            </n-button>
          </n-form-item>

          <div class="login-footer">
            <span>没有账号?</span>
            <n-text type="primary" @click="$router.push('/register')" class="register-link">
              立即注册
            </n-text>
          </div>

          <div class="agreement">
            <n-checkbox v-model:checked="form.agree" class="agree-checkbox">
              我已阅读并同意
              <n-text type="primary" @click="showAgreement">《服务条款》</n-text>
              与
              <n-text type="primary" @click="showPrivacy">《隐私政策》</n-text>
            </n-checkbox>
          </div>
        </n-form>
      </div>

      <div class="login-version">
        v1.3.1
      </div>
    </div>

    <!-- 协议弹窗 -->
    <n-modal v-model:show="agreementVisible" preset="dialog" title="服务协议" positive-text="同意" negative-text="关闭"
      :mask-closable="false">
      <div class="agreement-content">
        <h3>服务协议</h3>
        <p>这里是服务协议的内容...</p>
      </div>
    </n-modal>

    <!-- 隐私政策弹窗 -->
    <n-modal v-model:show="privacyVisible" preset="dialog" title="隐私政策" negative-text="关闭" :mask-closable="false">
      <div class="agreement-content">
        <h3>隐私政策</h3>
        <p>这里是隐私政策的内容...</p>
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, useMessage, NModal } from 'naive-ui'
import { Person, LockClosed, PhonePortrait } from '@vicons/ionicons5'
import { post } from '../utils/api'

const router = useRouter()
const message = useMessage()
const formRef = ref()
const loading = ref(false)
const agreementVisible = ref(false)
const privacyVisible = ref(false)
const loginType = ref('account') // 'account' 或 'phone'

// 图标定义 - 直接生成VNode
const userIcon = h(NIcon, null, { default: () => h(Person) })
const lockIcon = h(NIcon, null, { default: () => h(LockClosed) })
const phoneIcon = h(NIcon, null, { default: () => h(PhonePortrait) })

const form = reactive({
  username: '',
  phone: '',
  password: '',
  remember: false,
  agree: false
})

// 动态验证规则
const rules = computed(() => {
  return {
    ...(loginType.value === 'account' ? {
      username: [
        { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
        { min: 3, message: '用户名长度不能少于3个字符', trigger: 'blur' }
      ]
    } : {
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ]
    }),
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
    ]
  }
})

// 切换登录方式
const switchTab = (type: 'account' | 'phone') => {
  if (loading.value) return

  loginType.value = type

  // 清空表单验证错误
  if (formRef.value) {
    formRef.value.restoreValidation()
  }

  // 清空表单数据
  form.username = ''
  form.phone = ''
  form.password = ''
}

const handleLogin = async () => {
  if (!form.agree) {
    message.warning('请先同意服务条款和隐私政策')
    return
  }

  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 调用登录API
    const response = await post('/users/login', {
      ...(loginType.value === 'account' ? {
        username: form.username
      } : {
        phone: form.phone
      }),
      password: form.password,
      remember: form.remember
    })

    // 检查响应状态码
    if (response.code !== 200) {
      throw new Error(response.message || response.error || '登录失败')
    }

    // 保存token和用户信息
    localStorage.setItem('token', response.token || response.data?.token)
    if (response.user) {
      localStorage.setItem('username', response.user.username || '')
      localStorage.setItem('role', response.user.role || 'USER')
    }

    // 登录成功提示
    message.success('登录成功')

    // 登录成功，直接跳转到聊天页面
    router.push('/chat')
  } catch (error) {
    console.error('登录失败', error)
    // 显示错误信息给用户
    let errorMessage = '登录失败，请稍后重试'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (Array.isArray(error)) {
      errorMessage = error.join(', ')
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    message.error(errorMessage)
  } finally {
    loading.value = false
  }
}

const showAgreement = () => {
  agreementVisible.value = true
}

const showPrivacy = () => {
  privacyVisible.value = true
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
  width: 80px;
  height: 80px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
  animation-duration: 25s;
}

.shape-2 {
  width: 120px;
  height: 120px;
  top: 70%;
  left: 80%;
  animation-delay: 2s;
  animation-duration: 30s;
}

.shape-3 {
  width: 60px;
  height: 60px;
  top: 40%;
  left: 30%;
  animation-delay: 4s;
  animation-duration: 20s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 70%;
  animation-delay: 1s;
  animation-duration: 35s;
}

.shape-5 {
  width: 90px;
  height: 90px;
  top: 60%;
  left: 20%;
  animation-delay: 3s;
  animation-duration: 28s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  25% {
    transform: translateY(-20px) rotate(90deg);
  }

  50% {
    transform: translateY(0) rotate(180deg);
  }

  75% {
    transform: translateY(20px) rotate(270deg);
  }
}

.login-content {
  width: 100%;
  max-width: 400px;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.login-header {
  margin-bottom: 40px;
  text-align: center;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-icon {
  margin-bottom: 16px;
  color: #1677FF;
  background-color: rgba(22, 119, 255, 0.1);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(22, 119, 255, 0.2);
  transition: all 0.3s ease;
}

.logo-icon:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 20px rgba(22, 119, 255, 0.3);
}

.logo-text {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #1D2129;
  background: linear-gradient(90deg, #1677FF, #40a9ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.logo-subtitle {
  font-size: 14px;
  color: #86909C;
  margin: 0;
  max-width: 300px;
  text-align: center;
}

.login-form-wrapper {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 0.8s ease-out;
  transition: all 0.3s ease;
}

.login-form-wrapper:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-tabs {
  display: flex;
  margin-bottom: 32px;
  border-bottom: 1px solid #EBEEF5;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  cursor: pointer;
  font-size: 16px;
  color: #86909C;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.tab-item:hover {
  color: #1677FF;
}

.tab-item.active {
  color: #1677FF;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #1677FF;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

.login-form {
  width: 100%;
}

.login-input {
  width: 100%;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.login-input:focus-within {
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2);
  transform: translateY(-2px);
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.forgot-password {
  cursor: pointer;
  transition: color 0.2s ease;
}

.forgot-password:hover {
  color: #40a9ff;
}

.login-button {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  background: linear-gradient(90deg, #1677FF 0%, #40a9ff 100%);
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.login-button:hover::before {
  left: 100%;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #86909C;
}

.register-link {
  cursor: pointer;
  margin-left: 8px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.register-link:hover {
  color: #40a9ff;
}

.agreement {
  margin-top: 24px;
  font-size: 12px;
  color: #86909C;
  text-align: center;
}

.agree-checkbox {
  font-size: 12px;
}

.login-version {
  margin-top: 24px;
  font-size: 12px;
  color: #86909C;
}

.agreement-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-content {
    max-width: 100%;
    padding: 0 16px;
  }

  .login-form-wrapper {
    padding: 24px;
  }

  .logo-text {
    font-size: 24px;
  }

  .logo-subtitle {
    font-size: 12px;
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
  color: #1677FF;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.feedback-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>