<template>
  <div class="card">
    <h2>提交反馈</h2>
    <label>类型
      <select v-model="type">
        <option value="complaint">投诉</option>
        <option value="report">举报</option>
        <option value="suggestion">建议</option>
      </select>
    </label>
    <label>内容
      <textarea v-model="content" style="width:100%;height:120px;border:1px solid var(--border);border-radius:6px;padding:10px;"></textarea>
    </label>
    <label>联系方式<input v-model="contact" /></label>
    <div style="margin-top:12px"><button @click="submit">提交</button></div>
    <div class="error" v-if="error">{{error}}</div>
    <pre v-if="last">{{ last }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { createApi } from '../lib/api'

const type = ref('complaint')
const content = ref('')
const contact = ref('')
const error = ref('')
const last = ref('')
const api = createApi()

async function submit(){
  try{ const j = await api.req('/feedbacks', { method:'POST', body: JSON.stringify({type:type.value, content:content.value, contact:contact.value}) }); last.value = JSON.stringify(j,null,2); error.value = '' }catch(e:any){ error.value = e.message }
}
</script>
