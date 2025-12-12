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

    <div class="login-content">
      <div class="login-logo">
        <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
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
            <n-checkbox v-model:checked="allAgreed" @update:checked="handleCheckboxClick" class="agree-checkbox-item">
              <span class="agreement-text">
                我已阅读并同意
                <n-text type="primary" @click.stop="showAgreement" class="clickable-text">《用户服务协议》</n-text>
                与
                <n-text type="primary" @click.stop="showPrivacy" class="clickable-text">《隐私协议》</n-text>
              </span>
            </n-checkbox>
          </div>
        </n-form>
      </div>
    </div>

    <!-- 底部版权信息 -->
    <div class="footer-copyright">
      <p class="copyright-line">Copyright © www.techviewinfo.com , All Rights Reserved 和元达信息科技有限公司</p>
      <p class="copyright-line">粤ICP备16003606号 &nbsp;&nbsp; 电子邮箱：tvi@techviewinfo.com &nbsp;&nbsp; 服务热线：020-80927403</p>
    </div>

    <!-- 用户服务协议弹窗 -->
    <n-modal v-model:show="agreementVisible" preset="dialog" title="用户服务协议" :mask-closable="false" style="width: 600px;">
      <div class="agreement-content" v-html="serviceAgreementContent"></div>
      <template #action>
        <n-space>
          <n-button @click="agreementVisible = false">关闭</n-button>
          <n-button type="primary" @click="agreeService">同意</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 隐私协议弹窗 -->
    <n-modal v-model:show="privacyVisible" preset="dialog" title="隐私协议" :mask-closable="false" style="width: 600px;">
      <div class="agreement-content" v-html="privacyPolicyContent"></div>
      <template #action>
        <n-space>
          <n-button @click="privacyVisible = false">关闭</n-button>
          <n-button type="primary" @click="agreePrivacy">同意</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, useMessage, NModal, NSpace, NButton } from 'naive-ui'
import { Person, LockClosed, PhonePortrait } from '@vicons/ionicons5'
import { post, get } from '../utils/api'

const router = useRouter()
const message = useMessage()
const formRef = ref()
const loading = ref(false)
const agreementVisible = ref(false)
const privacyVisible = ref(false)
const loginType = ref('account') // 'account' 或 'phone'

// 条款同意状态（用户服务协议和隐私协议）
const userAgreementAgreed = ref(false)  // 用户服务协议
const privacyAgreed = ref(false)        // 隐私协议

// 总勾选状态
const allAgreed = ref(false)

// 协议内容
const serviceAgreementContent = ref('<p>加载中...</p>')
const privacyPolicyContent = ref('<p>加载中...</p>')

// 获取协议内容
const fetchAgreements = async () => {
  try {
    const response = await get('/users/agreements')
    if (response && response.code === 200 && response.data) {
      serviceAgreementContent.value = response.data.serviceAgreement?.content || '<p>暂无内容</p>'
      privacyPolicyContent.value = response.data.privacyAgreement?.content || '<p>暂无内容</p>'
    }
  } catch (error) {
    console.error('获取协议内容失败:', error)
    serviceAgreementContent.value = '<p>加载失败，请稍后重试</p>'
    privacyPolicyContent.value = '<p>加载失败，请稍后重试</p>'
  }
}

// 组件挂载时获取协议
onMounted(() => {
  fetchAgreements()
})

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

// 处理勾选框点击 - 如果协议未阅读则弹窗提示
const handleCheckboxClick = (checked: boolean) => {
  if (checked) {
    // 用户想要勾选
    if (!userAgreementAgreed.value || !privacyAgreed.value) {
      message.warning('请先阅读并同意《用户服务协议》和《隐私协议》')
      agreementVisible.value = true
      // 不允许勾选，保持未勾选状态
      nextTick(() => {
        allAgreed.value = false
      })
    } else {
      allAgreed.value = true
    }
  } else {
    // 用户想要取消勾选，直接允许
    allAgreed.value = false
    userAgreementAgreed.value = false
    privacyAgreed.value = false
  }
}

const handleLogin = async () => {
  // 检查条款同意状态
  if (!userAgreementAgreed.value && !privacyAgreed.value) {
    message.warning('请阅读并同意《用户服务协议》和《隐私协议》')
    return
  }
  if (!userAgreementAgreed.value) {
    message.warning('请阅读并同意《用户服务协议》')
    return
  }
  if (!privacyAgreed.value) {
    message.warning('请阅读并同意《隐私协议》')
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

// 同意用户服务协议
const agreeService = () => {
  userAgreementAgreed.value = true
  agreementVisible.value = false
  // 如果隐私协议还没阅读，提示用户
  if (!privacyAgreed.value) {
    message.info('请继续阅读《隐私协议》')
    setTimeout(() => {
      privacyVisible.value = true
    }, 300)
  } else {
    // 两个协议都已同意，自动勾选checkbox
    allAgreed.value = true
  }
}

// 同意隐私协议
const agreePrivacy = () => {
  privacyAgreed.value = true
  privacyVisible.value = false
  // 如果用户服务协议还没阅读，提示用户
  if (!userAgreementAgreed.value) {
    message.info('请继续阅读《用户服务协议》')
    setTimeout(() => {
      agreementVisible.value = true
    }, 300)
  } else {
    // 两个协议都已同意，自动勾选checkbox
    allAgreed.value = true
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url('@/assets/login-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
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
  flex: 1;
  justify-content: center;
  margin-bottom: 100px;
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

.logo-brand {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px 48px;
  background: linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1976D2 100%);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(13, 71, 161, 0.35);
  min-width: 480px;
}


.logo-text-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-text-main {
  font-size: 36px;
  font-weight: bold;
  color: #FFFFFF;
  letter-spacing: 3px;
}

.logo-divider {
  font-size: 36px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 300;
}

.logo-text-sub {
  font-size: 26px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 2px;
}

.logo-subtitle {
  font-size: 15px;
  color: #4E5969;
  margin: 0;
  max-width: 480px;
  text-align: center;
  line-height: 1.6;
}

.login-form-wrapper {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 36px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 0.8s ease-out;
  transition: all 0.3s ease;
}

.login-logo {
  text-align: center;
  margin-bottom: 24px;
  width: 100%;
}

.login-logo .logo-image {
  width: 100%;
  height: auto;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
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
  margin-bottom: 24px;
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

.login-form :deep(.n-form-item) {
  margin-bottom: 18px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  font-size: 12px;
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
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.8;
  font-size: 14px;
  color: #333;
}

.agreement-content p {
  margin-bottom: 12px;
  text-indent: 2em;
}

.agreement-content h1,
.agreement-content h2,
.agreement-content h3 {
  font-weight: bold;
  margin: 16px 0 8px 0;
  color: #1D2129;
}

.agreement-content h1 {
  font-size: 18px;
}

.agreement-content h2 {
  font-size: 16px;
}

.agreement-content h3 {
  font-size: 14px;
}

.agreement-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.agreement-content table th,
.agreement-content table td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.agreement-content table th {
  background-color: #f5f5f5;
  font-weight: bold;
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

/* 联系我们悬浮菜单 */
.contact-menu {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  transition: all 0.3s ease;
}

.contact-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  cursor: pointer;
  color: #1677FF;
  font-weight: 500;
  transition: all 0.2s ease;
}

.contact-toggle:hover {
  background: rgba(22, 119, 255, 0.05);
}

.contact-label {
  font-size: 14px;
}

.contact-content {
  padding: 16px 20px;
  border-top: 1px solid #EBEEF5;
  background: #FAFAFA;
}

.contact-item {
  text-align: center;
}

.contact-title {
  font-size: 14px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 4px;
}

.contact-value {
  font-size: 14px;
  color: #4E5969;
}

.contact-divider {
  height: 1px;
  background: #EBEEF5;
  margin: 12px 0;
}

/* 底部版权信息 */
.footer-copyright {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  text-align: center;
  background: transparent;
}

.copyright-line {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

/* 条款同意样式 */
.agreement {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #86909C;
}

.agree-checkbox-item {
  font-size: 12px;
}

.agreement-text {
  white-space: nowrap;
}

.agreement-separator {
  color: #86909C;
  margin: 0 2px;
}

.clickable-text {
  cursor: pointer;
  transition: opacity 0.2s;
}

.clickable-text:hover {
  opacity: 0.8;
}
</style>