<template>
  <div class="forgot-password-container">
    <n-card class="forgot-password-card" title="找回密码" :bordered="false">
      <n-form :model="form" :rules="rules" ref="formRef">
        <n-form-item path="identifier">
          <n-input
            v-model:value="form.identifier"
            placeholder="请输入账号/邮箱/手机号"
          />
        </n-form-item>
        <n-form-item>
          <n-button
            type="primary"
            block
            @click="handleForgotPassword"
            :loading="loading"
          >
            发送重置链接
          </n-button>
        </n-form-item>
        <div class="forgot-password-footer">
          <n-text type="primary" @click="$router.push('/login')">返回登录</n-text>
          <n-text type="primary" @click="$router.push('/register')">立即注册</n-text>
        </div>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

// 图标定义 - 使用组件形式
// const UserIcon = { render() { return h(NIcon, null, { default: () => h(Person) }) } }

const form = reactive({
  identifier: ''
})

const rules = {
  identifier: [
    { required: true, message: '请输入账号/邮箱/手机号', trigger: 'blur' }
  ]
}

const handleForgotPassword = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    // 这里应该调用找回密码API
    console.log('发送重置链接', form)
    // 模拟发送成功
    router.push('/login')
  } catch (error) {
    console.error('发送失败', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #F5F7FA;
}

.forgot-password-card {
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.forgot-password-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}
</style>