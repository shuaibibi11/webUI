<template>
  <div class="login-container">
    <n-card class="login-card" title="后台管理系统" :bordered="false">
      <n-form :model="form" :rules="rules" ref="formRef">
        <n-form-item path="username">
          <n-input
            v-model:value="form.username"
            placeholder="请输入用户名"
            :prefix="userIcon"
          />
        </n-form-item>
        <n-form-item path="password">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix="lockIcon"
            show-password-on="mousedown"
          />
        </n-form-item>
        <n-form-item>
          <n-button
            type="primary"
            block
            @click="handleLogin"
            :loading="loading"
          >
            登录
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon } from 'naive-ui'
import { Person, LockClosed } from '@vicons/ionicons5'
import { post } from '../utils/api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const userIcon = h(NIcon, null, { default: () => h(Person) })
const lockIcon = h(NIcon, null, { default: () => h(LockClosed) })

const form = reactive({
  username: 'admin',
  password: 'Abcdef1!'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度不能少于8个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 调用登录API（使用user-api的登录端点，已验证可用）
    const response = await post('/users/login', {
      username: form.username,
      password: form.password
    })
    
    // 检查响应状态码
    if (response.code !== 200) {
      throw new Error(response.error || response.message || '登录失败')
    }
    
    // 保存token
    localStorage.setItem('admin_token', response.token)
    
    // 登录成功，跳转到仪表板
    router.push('/dashboard')
  } catch (error) {
    console.error('登录失败', error)
    // 显示错误信息给用户
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    alert('登录失败：' + errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #F5F7FA;
}

.login-card {
  width: 400px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>