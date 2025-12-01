<template>
  <div class="card">
    <h2 style="margin:0 0 10px">登录</h2>
    <label>用户名/邮箱/手机号<input v-model="username" placeholder="admin" /></label>
    <label>密码<input v-model="password" type="password" placeholder="Abcdef1!" /></label>
    <div style="margin-top:12px; display:flex; gap:8px;">
      <button @click="login">登录</button>
      <button class="secondary" @click="goRegister">注册</button>
      <span class="hint">API: /api/users/login</span>
    </div>
    <div class="error" v-if="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createApi } from '../lib/api'

const router = useRouter()
const username = ref('admin')
const password = ref('Abcdef1!')
const error = ref('')
const api = createApi()

async function login(){
  error.value = ''
  try {
    const b = await api.req('/users/login', { method:'POST', body: JSON.stringify({ username: username.value, password: password.value }) })
    sessionStorage.setItem('access_token', b.token)
    router.push('/chat')
  } catch(e: any) {
    error.value = e.message
  }
}

function goRegister(){ router.push('/register') }
</script>
