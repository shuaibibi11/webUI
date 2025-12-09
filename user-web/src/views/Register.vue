<template>
  <div class="register-container">
    <div class="register-content">
      <div class="register-header">
        <div class="logo">
          <div class="logo-icon">
            <n-icon size="48">
              <Person />
            </n-icon>
          </div>
          <h1 class="logo-text">和元智擎</h1>
          <p class="logo-subtitle">便捷、灵活、可靠的企业级大模型应用开发平台</p>
        </div>
        <h2 class="register-title">创建新账号</h2>
        <p class="register-subtitle">加入和元智擎，开启企业级AI应用开发之旅</p>
      </div>

      <div class="register-form-wrapper">
        <n-form :model="form" :rules="rules" ref="formRef" class="register-form">
          <!-- 用户名 -->
          <n-form-item label="用户名" path="username">
            <n-input v-model:value="form.username" placeholder="4-20位，字母/数字/下划线" :prefix="userIcon"
              class="register-input" @blur="checkUsernameUnique" />
            <template #feedback>
              <div class="form-hint">允许字符: a-z、A-Z、0-9、_</div>
              <n-text v-if="usernameCheckStatus === 'checking'" type="info">正在检查...</n-text>
              <n-text v-else-if="usernameCheckStatus === 'exist'" type="error">该用户名不可用</n-text>
              <n-text v-else-if="usernameCheckStatus === 'unique'" type="success">该用户名可用</n-text>
            </template>
          </n-form-item>

          <!-- 手机号码 -->
          <n-form-item label="手机号码" path="phone">
            <n-input v-model:value="form.phone" placeholder="中国大陆11位手机号" :prefix="phoneIcon" class="register-input"
              @blur="checkPhoneUnique" />
            <template #feedback>
              <div class="form-hint">示例: 13812345678</div>
              <n-text v-if="phoneCheckStatus === 'checking'" type="info">正在检查...</n-text>
              <n-text v-else-if="phoneCheckStatus === 'exist'" type="error">该手机号不可用</n-text>
              <n-text v-else-if="phoneCheckStatus === 'unique'" type="success">该手机号可用</n-text>
            </template>
          </n-form-item>

          <!-- 姓名 -->
          <n-form-item label="姓名 (实名认证)" path="realName">
            <n-input v-model:value="form.realName" placeholder="中文姓名" :prefix="personIcon"
              class="register-input" />
            <template #feedback>
              <div class="form-hint">不允许数字或符号</div>
            </template>
          </n-form-item>

          <!-- 身份证号码 -->
          <n-form-item label="身份证号码 (实名认证)" path="idCard">
            <n-input v-model:value="form.idCard" placeholder="15-18位数字，末位可为X" :prefix="idCardIcon"
              class="register-input" @blur="checkIdCardUnique" />
            <template #feedback>
              <div class="form-hint">示例: 3401111976****451X</div>
              <n-text v-if="idCardCheckStatus === 'checking'" type="info">正在检查...</n-text>
              <n-text v-else-if="idCardCheckStatus === 'exist'" type="error">该身份证号不可用</n-text>
              <n-text v-else-if="idCardCheckStatus === 'unique'" type="success">该身份证号可用</n-text>
            </template>
          </n-form-item>

          <!-- 设置密码 -->
          <n-form-item label="设置密码" path="password">
            <n-input v-model:value="form.password" type="password" placeholder="8-20位，含大小写字母、数字及特殊字符" :prefix="lockIcon"
              show-password-on="mousedown" class="register-input" />
            <template #feedback>
              <div class="form-hint">必须同时包含：大小写字母、数字、特殊字符</div>
            </template>
          </n-form-item>

          <!-- 确认密码 -->
          <n-form-item label="确认密码" path="confirmPassword">
            <n-input v-model:value="form.confirmPassword" type="password" placeholder="请再次输入密码" :prefix="lockIcon"
              show-password-on="mousedown" class="register-input" />
          </n-form-item>

          <!-- 协议同意 -->
          
            <n-checkbox v-model:checked="form.agree" class="agree-checkbox">
              我已阅读并同意
              <n-text type="primary" @click="showAgreement">《服务条款》</n-text>
              与
              <n-text type="primary" @click="showPrivacy">《隐私政策》</n-text>
            </n-checkbox>
         

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

      <div class="register-version">
        v1.3.1
      </div>
    </div>

    <!-- 协议弹窗 -->
    <n-modal v-model:show="agreementVisible" preset="dialog" title="服务协议"  negative-text="关闭" :mask-closable="false">
  <div class="agreement-content">
    <h3>服务协议</h3>
    <p>这里是服务协议的内容...</p>
  </div>
</n-modal>

<!-- 隐私政策弹窗 -->
<n-modal v-model:show="privacyVisible" preset="dialog" title="隐私政策"  negative-text="关闭" :mask-closable="false">
  <div class="agreement-content">
    <h3>隐私政策</h3>
    <p>这里是隐私政策的内容...</p>
  </div>
</n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue'
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
  NModal
} from 'naive-ui'
import { Person, PhonePortrait, IdCard, LockClosed } from '@vicons/ionicons5'
import { post, get } from '../utils/api'

const message = useMessage()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const agreementVisible = ref(false)
const privacyVisible = ref(false)

// 唯一性检查状态
const usernameCheckStatus = ref('') // checking, exist, unique
const phoneCheckStatus = ref('')
const idCardCheckStatus = ref('')

// 图标定义 - 直接生成VNode
const userIcon = h(NIcon, null, { default: () => h(Person) })
const phoneIcon = h(NIcon, null, { default: () => h(PhonePortrait) })
const personIcon = h(NIcon, null, { default: () => h(Person) })
const idCardIcon = h(NIcon, null, { default: () => h(IdCard) })
const lockIcon = h(NIcon, null, { default: () => h(LockClosed) })

const form = reactive({
  username: '',
  phone: '',
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
  form.realName = ''
  form.idCard = ''
  form.password = ''
  form.confirmPassword = ''
  form.agree = false
  usernameCheckStatus.value = ''
  phoneCheckStatus.value = ''
  idCardCheckStatus.value = ''
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
  if (!form.agree) {
    message.warning('请先同意服务条款和隐私政策')
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
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #FFFFFF;
}

.register-content {
  width: 100%;
  max-width: 600px;
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

.logo-icon {
  margin-bottom: 16px;
  color: #1677FF;
}

.logo-text {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #1D2129;
}

.logo-subtitle {
  font-size: 14px;
  color: #86909C;
  margin: 0;
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
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.register-form {
  width: 100%;
}

/* 优化表单样式 */
:deep(.n-form-item-label) {
  font-size: 14px;
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 0px;
  padding-bottom: 0px;
  margin-top: 5px;
  /* bottom: 3px; */
}

.register-input {
  width: 100%;
  border-radius: 8px;
  margin-bottom: 0px;
}

.form-hint {
  font-size: 12px;
  color: #86909C;
  margin-top: 4px;
  display: block;
}

.agree-checkbox {
  font-size: 14px;
  margin-bottom: 24px;
}

.register-button {
  width: 100%;
  height: 44px;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 20px;
}

.register-footer {
  text-align: center;
  font-size: 14px;
  color: #86909C;
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
}

.agreement-content h3 {
  margin-bottom: 16px;
  color: #1D2129;
}

.agreement-content p {
  line-height: 1.6;
  color: #4E5969;
}
</style>