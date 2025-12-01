<template>
  <div class="row">
    <div class="col card">
      <h2 style="margin:0 0 10px">会话</h2>
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <button @click="loadConversations">刷新</button>
        <button class="secondary" @click="createConversation">新建会话</button>
        <span class="hint">API: /api/conversations</span>
      </div>
      <div v-for="c in conversations" :key="c.id" style="border:1px solid var(--border); border-radius:6px; padding:8px; margin-bottom:8px; cursor:pointer;" @click="selectConversation(c)">
        <div style="font-weight:600;">{{ c.title || '未命名会话' }}</div>
        <div class="hint">{{ c.id }}</div>
      </div>
    </div>
    <div class="col card">
      <h2 style="margin:0 0 10px">消息</h2>
      <div class="messages">
        <div v-for="m in messages" :key="m.id" class="msg" :class="m.role">
          <div style="font-size:12px; color:#6b7280;">{{ m.role }} · {{ m.createdAt }}</div>
          <div>{{ m.content }}</div>
        </div>
      </div>
      <div style="display:flex; gap:8px; margin-top:12px;">
        <input v-model="input" placeholder="输入消息..." />
        <button @click="send">发送</button>
      </div>
      <div class="error" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createApi } from '../lib/api'

const router = useRouter()
const api = createApi()
const token = sessionStorage.getItem('access_token')
const conversations = ref<any[]>([])
const currentConversation = ref<any | null>(null)
const messages = ref<any[]>([])
const input = ref('')
const error = ref('')

async function loadConversations(){
  try {
    const b = await api.req('/conversations')
    conversations.value = b.conversations || []
    if (conversations.value.length && !currentConversation.value) selectConversation(conversations.value[0])
  } catch(e: any){ error.value = e.message }
}

async function createConversation(){
  try { await api.req('/conversations', { method:'POST', body: JSON.stringify({ title:'新对话' }) }); await loadConversations() } catch(e: any){ error.value = e.message }
}

async function selectConversation(c: any){ currentConversation.value = c; await loadMessages() }

async function loadMessages(){
  if (!currentConversation.value) return
  try { const b = await api.req('/messages/' + currentConversation.value.id); messages.value = (b.messages||[]).map((m:any)=>({ id:m.id, role:(m.senderId==='assistant'?'assistant':'user'), content:m.content, createdAt:m.createdAt })) } catch(e: any){ error.value = e.message }
}

async function send(){
  if (!input.value || !currentConversation.value) return
  try { await api.req('/chat', { method:'POST', body: JSON.stringify({ conversationId: currentConversation.value.id, content: input.value }) }); input.value = ''; await loadMessages() } catch(e: any){ error.value = e.message }
}

onMounted(()=>{ if (!token) { router.push('/'); return } loadConversations() })
</script>
