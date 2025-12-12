<template>
  <div class="register-container">
    <!-- 顶部导航 -->
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

    <div class="register-content">
      <div class="register-logo">
        <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
      </div>
      <div class="register-form-wrapper">
        <n-form :model="form" :rules="rules" ref="formRef" class="register-form">
          <!-- 第一行：用户名和手机号 -->
          <div class="form-row">
            <n-form-item label="用户名" path="username" class="form-col">
              <n-input v-model:value="form.username" placeholder="4-20位" :prefix="userIcon"
                class="register-input" @blur="checkUsernameUnique" />
              <template #feedback>
                <n-text v-if="usernameCheckStatus === 'checking'" type="info">检查中...</n-text>
                <n-text v-else-if="usernameCheckStatus === 'exist'" type="error">不可用</n-text>
                <n-text v-else-if="usernameCheckStatus === 'unique'" type="success">可用</n-text>
              </template>
            </n-form-item>

            <n-form-item label="手机号码" path="phone" class="form-col">
              <n-input v-model:value="form.phone" placeholder="11位手机号" :prefix="phoneIcon" class="register-input"
                @blur="checkPhoneUnique" />
              <template #feedback>
                <n-text v-if="phoneCheckStatus === 'checking'" type="info">检查中...</n-text>
                <n-text v-else-if="phoneCheckStatus === 'exist'" type="error">不可用</n-text>
                <n-text v-else-if="phoneCheckStatus === 'unique'" type="success">可用</n-text>
              </template>
            </n-form-item>
          </div>

          <!-- 第二行：邮箱 -->
          <n-form-item label="邮箱" path="email">
            <n-input v-model:value="form.email" placeholder="用于找回密码" :prefix="emailIcon" class="register-input"
              @blur="checkEmailUnique" />
            <template #feedback>
              <n-text v-if="emailCheckStatus === 'checking'" type="info">检查中...</n-text>
              <n-text v-else-if="emailCheckStatus === 'exist'" type="error">已被使用</n-text>
              <n-text v-else-if="emailCheckStatus === 'unique'" type="success">可用</n-text>
            </template>
          </n-form-item>

          <!-- 第三行：姓名和身份证 -->
          <div class="form-row">
            <n-form-item label="姓名" path="realName" class="form-col">
              <n-input v-model:value="form.realName" placeholder="中文姓名" :prefix="personIcon"
                class="register-input" />
            </n-form-item>

            <n-form-item label="身份证号码" path="idCard" class="form-col">
              <n-input v-model:value="form.idCard" placeholder="18位" :prefix="idCardIcon"
                class="register-input" @blur="checkIdCardUnique" />
              <template #feedback>
                <n-text v-if="idCardCheckStatus === 'checking'" type="info">检查中...</n-text>
                <n-text v-else-if="idCardCheckStatus === 'exist'" type="error">不可用</n-text>
                <n-text v-else-if="idCardCheckStatus === 'unique'" type="success">可用</n-text>
              </template>
            </n-form-item>
          </div>

          <!-- 第四行：密码和确认密码 -->
          <div class="form-row">
            <n-form-item label="设置密码" path="password" class="form-col">
              <n-input v-model:value="form.password" type="password" placeholder="8-20位" :prefix="lockIcon"
                show-password-on="mousedown" class="register-input" />
            </n-form-item>

            <n-form-item label="确认密码" path="confirmPassword" class="form-col">
              <n-input v-model:value="form.confirmPassword" type="password" placeholder="再次输入" :prefix="lockIcon"
                show-password-on="mousedown" class="register-input" />
            </n-form-item>
          </div>

          <!-- 协议同意 -->
          <div class="agreement">
            <n-checkbox :checked="allAgreed" @update:checked="handleCheckboxClick" class="agree-checkbox-item">
              <span class="agreement-text">
                我已阅读并同意
                <n-text type="primary" @click.stop="showAgreement" class="clickable-text">《用户服务协议》</n-text>
                与
                <n-text type="primary" @click.stop="showPrivacy" class="clickable-text">《隐私协议》</n-text>
              </span>
            </n-checkbox>
          </div>

          <!-- 注册按钮 -->
          <n-form-item>
            <n-button type="primary" block @click="handleRegister" :loading="loading" class="register-button">
              立即注册
            </n-button>
          </n-form-item>

          <!-- 登录链接 -->
          <div class="register-footer">
            <span>已有账号?</span>
            <n-text type="primary" @click="$router.push('/login')" class="login-link">
              立即登录
            </n-text>
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
import { ref, reactive, h, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  NIcon,
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCheckbox,
  NText,
  NModal,
  NSpace
} from 'naive-ui'
import { Person, PhonePortrait, IdCard, LockClosed, Mail } from '@vicons/ionicons5'
import { post, get } from '../utils/api'

const message = useMessage()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const agreementVisible = ref(false)
const privacyVisible = ref(false)

// 条款同意状态（用户服务协议和隐私协议）
const userAgreementAgreed = ref(false)  // 用户服务协议
const privacyAgreed = ref(false)        // 隐私协议
const allAgreed = ref(false)  // checkbox勾选状态

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

// 唯一性检查状态
const usernameCheckStatus = ref('') // checking, exist, unique
const phoneCheckStatus = ref('')
const emailCheckStatus = ref('')
const idCardCheckStatus = ref('')

// 图标定义 - 直接生成VNode
const userIcon = h(NIcon, null, { default: () => h(Person) })
const phoneIcon = h(NIcon, null, { default: () => h(PhonePortrait) })
const emailIcon = h(NIcon, null, { default: () => h(Mail) })
const personIcon = h(NIcon, null, { default: () => h(Person) })
const idCardIcon = h(NIcon, null, { default: () => h(IdCard) })
const lockIcon = h(NIcon, null, { default: () => h(LockClosed) })

const form = reactive({
  username: '',
  phone: '',
  email: '',
  realName: '',
  idCard: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度在4到20个字符之间', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/, message: '姓名只能包含中文、英文和空格', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在8到20个字符之间', trigger: 'blur' },
    { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, message: '密码必须同时包含大小写字母、数字和特殊字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string) => {
        return value === form.password
      },
      message: '两次输入的密码不一致',
      trigger: 'blur'
    }
  ]
}

// 重置表单
const resetForm = () => {
  form.username = ''
  form.phone = ''
  form.email = ''
  form.realName = ''
  form.idCard = ''
  form.password = ''
  form.confirmPassword = ''
  form.agree = false
  usernameCheckStatus.value = ''
  phoneCheckStatus.value = ''
  emailCheckStatus.value = ''
  idCardCheckStatus.value = ''
  userAgreementAgreed.value = false
  privacyAgreed.value = false
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

// 检查用户名唯一性
const checkUsernameUnique = async () => {
  if (!form.username) return
  usernameCheckStatus.value = 'checking'
  try {
    // 调用API检查用户名唯一性
    await get('/users/check-username', { username: form.username })
    usernameCheckStatus.value = 'unique'
  } catch (error) {
    usernameCheckStatus.value = 'exist'
  }
}

// 检查手机号唯一性
const checkPhoneUnique = async () => {
  if (!form.phone) return
  phoneCheckStatus.value = 'checking'
  try {
    // 调用API检查手机号唯一性
    await get('/users/check-phone', { phone: form.phone })
    phoneCheckStatus.value = 'unique'
  } catch (error) {
    phoneCheckStatus.value = 'exist'
  }
}

// 检查邮箱唯一性
const checkEmailUnique = async () => {
  if (!form.email) return
  emailCheckStatus.value = 'checking'
  try {
    // 调用API检查邮箱唯一性
    await get('/users/check-email', { email: form.email })
    emailCheckStatus.value = 'unique'
  } catch (error) {
    emailCheckStatus.value = 'exist'
  }
}

// 检查身份证号唯一性
const checkIdCardUnique = async () => {
  if (!form.idCard) return
  idCardCheckStatus.value = 'checking'
  try {
    // 调用API检查身份证号唯一性
    await get('/users/check-idcard', { idCard: form.idCard })
    idCardCheckStatus.value = 'unique'
  } catch (error) {
    idCardCheckStatus.value = 'exist'
  }
}

const handleRegister = async () => {
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

    // 调用注册API
    await post('/users/register', {
      username: form.username,
      phone: form.phone,
      email: form.email || null,
      realName: form.realName,
      idCard: form.idCard,
      password: form.password
    })

    // 注册成功，重置表单并跳转到登录页面
    message.success('注册成功，请登录')
    resetForm()
    router.push('/login')
  } catch (error) {
    console.error('注册失败', error)
    message.error('注册失败，请稍后重试')
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
.register-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url('@/assets/login-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  padding: 60px 20px;
  position: relative;
  overflow-x: hidden;
}

/* 顶部导航 */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  z-index: 100;
}

.nav-btn {
  font-size: 14px;
  font-weight: 500;
  color: #1677FF;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  opacity: 0.8;
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

.register-content {
  width: 100%;
  max-width: 440px;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.register-header {
  margin-bottom: 32px;
  text-align: center;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
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

.register-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #1D2129;
}

.register-subtitle {
  font-size: 14px;
  color: #86909C;
  margin: 0;
}

.register-form-wrapper {
  width: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px 28px 24px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.register-logo {
  text-align: center;
  margin-bottom: 16px;
  width: 100%;
}

.register-logo .logo-image {
  width: 100%;
  max-width: 240px;
  height: auto;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.register-form {
  width: 100%;
}

/* 横向布局 */
.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
}

.form-col {
  flex: 1;
  margin-bottom: 0 !important;
}

/* 优化表单样式 */
:deep(.n-form-item) {
  margin-bottom: 6px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 3px;
  padding-bottom: 0px;
}

:deep(.n-form-item-blank) {
  min-height: auto;
}

:deep(.n-form-item-feedback-wrapper) {
  min-height: 16px;
  padding-top: 1px;
}

.register-input {
  width: 100%;
  border-radius: 6px;
  height: 34px;
}

:deep(.register-input .n-input__input-el) {
  font-size: 13px;
}

.form-hint {
  font-size: 10px;
  color: #86909C;
  margin-top: 1px;
  display: block;
  line-height: 1.2;
}

.agree-checkbox {
  font-size: 14px;
  margin-bottom: 12px;
}

.register-button {
  width: 100%;
  height: 38px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 0px;
  margin-bottom: 12px;
}

.register-footer {
  text-align: center;
  font-size: 12px;
  color: #86909C;
  margin-top: 0px;
}

.login-link {
  cursor: pointer;
  margin-left: 8px;
}

.register-version {
  margin-top: 24px;
  font-size: 12px;
  color: #86909C;
}

/* 弹窗内容样式 */
.agreement-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 20px;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.8;
  font-size: 14px;
  color: #333;
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

.agreement-content p {
  margin-bottom: 12px;
  text-indent: 2em;
  line-height: 1.6;
  color: #4E5969;
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

/* 条款同意样式 */
.agreement {
  margin-bottom: 12px;
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #86909C;
}

.agree-checkbox-item {
  font-size: 11px;
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

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: 70px 12px 80px;
  }

  .top-nav {
    padding: 12px 16px;
  }

  .register-content {
    max-width: 100%;
  }

  .register-form-wrapper {
    padding: 20px 24px;
  }

  .register-logo .logo-image {
    max-width: 240px;
  }

  :deep(.n-form-item) {
    margin-bottom: 14px;
  }

  .footer-copyright {
    padding: 12px;
  }

  .copyright-line {
    font-size: 10px;
  }
}
</style>