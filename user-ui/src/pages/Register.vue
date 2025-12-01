<template>
  <div class="card">
    <h2 style="margin:0 0 10px">注册</h2>
    <label>用户名<input v-model="username" /></label>
    <label>手机号<input v-model="phone" /></label>
    <label>邮箱<input v-model="email" type="email" /></label>
    <label>密码<input v-model="password" type="password" /></label>
    <label>实名<input v-model="realName" /></label>
    <label>身份证<input v-model="idCard" /></label>
    <label style="display:flex; align-items:center; gap:8px; margin-top:12px;">
      <input type="checkbox" v-model="agree" /> 我已阅读并同意 <a href="/terms">服务条款</a> 和 <a href="/privacy">隐私政策</a>
    </label>
    <div style="margin-top:12px; display:flex; gap:8px;">
      <button @click="register">提交</button>
      <button class="secondary" @click="back">返回登录</button>
      <span class="hint">API: /api/users/register</span>
    </div>
    <div class="error" v-if="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createApi } from '../lib/api'

const router = useRouter()
const api = createApi()
const username = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const realName = ref('')
const idCard = ref('')
const agree = ref(false)
const error = ref('')

async function register(){
  error.value=''
  if (!agree.value) { error.value='请勾选同意服务条款与隐私政策'; return }
  try {
    const res = await api.req('/users/register',{ method:'POST', body: JSON.stringify({ username:username.value, phone:phone.value, email:email.value, password:password.value, realName:realName.value, idCard:idCard.value }) })
    router.push('/')
  } catch(e:any){ error.value=e.message }
}

function back(){ router.push('/') }
</script>
