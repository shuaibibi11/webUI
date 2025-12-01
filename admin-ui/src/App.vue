<template>
  <header class="header"><h1>后台管理</h1></header>
  <main class="main">
    <div class="card" v-if="!token">
      <h2 style="margin:0 0 10px">管理员登录</h2>
      <label>用户名/邮箱/手机号<input v-model="username" placeholder="admin" /></label>
      <label>密码<input v-model="password" type="password" placeholder="Abcdef1!" /></label>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button @click="login">登录</button>
        <span class="hint">API: /api/users/login</span>
      </div>
      <div class="error" v-if="error">{{ error }}</div>
    </div>

    <div v-else class="card">
      <div style="display:flex; gap:8px; margin-bottom:12px;">
        <button @click="loadStats">统计</button>
        <button class="secondary" @click="loadUsers">用户</button>
        <button class="secondary" @click="loadModels">模型</button>
        <button class="secondary" @click="loadLogs">日志</button>
      </div>
      <div v-if="tab==='stats'">
        <pre>{{ pretty(stats) }}</pre>
      </div>
      <div v-else-if="tab==='users'">
        <table>
          <thead><tr><th>用户名</th><th>邮箱</th><th>已审批</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.username }}</td><td>{{ u.email }}</td><td>{{ u.isVerified ? '是' : '否' }}</td>
              <td>
                <button @click="verifyUser(u.id)">审批</button>
                <button class="secondary" @click="banUser(u.id,false)">解封</button>
                <button class="secondary" @click="banUser(u.id,true)">封禁</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="tab==='models'">
        <pre>{{ pretty(models) }}</pre>
      </div>
      <div v-else-if="tab==='logs'">
        <pre>{{ pretty(logs) }}</pre>
      </div>
      <div class="error" v-if="error">{{ error }}</div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const token = ref<string | null>(null)
const username = ref('admin')
const password = ref('Abcdef1!')
const error = ref('')
const tab = ref<'stats'|'users'|'models'|'logs'>('stats')
const stats = ref<any>(null)
const users = ref<any[]>([])
const models = ref<any[]>([])
const logs = ref<any[]>([])

function pretty(o:any){ try { return JSON.stringify(o,null,2);} catch(e){ return String(o) } }

async function req(path:string, opt:RequestInit={}){
  const headers: Record<string,string> = { 'Content-Type':'application/json' }
  const t = sessionStorage.getItem('access_token')
  if (t) headers['Authorization'] = 'Bearer ' + t
  const r = await fetch('/api' + path, { ...opt, headers: { ...headers, ...(opt.headers||{}) } })
  let b:any = {}; try{ b = await r.json() }catch{}
  if (!r.ok) throw new Error(b.error || ('HTTP ' + r.status))
  return b
}

async function login(){ error.value=''; try{ const b=await fetch('/users/login',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username: username.value, password: password.value })}).then(r=>r.json()); if (b.token){ sessionStorage.setItem('access_token', b.token); token.value=b.token; loadStats(); } else { throw new Error(b.error || '登录失败') } }catch(e:any){ error.value=e.message }}
async function loadStats(){ tab.value='stats'; try{ stats.value=await req('/admin/stats'); }catch(e:any){ error.value=e.message } }
async function loadUsers(){ tab.value='users'; try{ const r=await req('/admin/users'); users.value=r.users||[]; }catch(e:any){ error.value=e.message } }
async function verifyUser(id:string){ try{ await req('/admin/users/'+id+'/verify',{method:'PUT'}); loadUsers(); }catch(e:any){ error.value=e.message } }
async function banUser(id:string,b:boolean){ try{ await req('/admin/users/'+id+'/ban',{method:'PUT',body:JSON.stringify({banned:b})}); loadUsers(); }catch(e:any){ error.value=e.message } }
async function loadModels(){ tab.value='models'; try{ const r=await req('/admin/models'); models.value=r.models||[]; }catch(e:any){ error.value=e.message } }
async function loadLogs(){ tab.value='logs'; try{ const r=await req('/admin/logs'); logs.value=r.logs||[]; }catch(e:any){ error.value=e.message } }

onMounted(()=>{ const t=sessionStorage.getItem('access_token'); if (t){ token.value=t; loadStats(); } })
</script>

<style>
:root { --primary:#1E40AF; --border:#e5e7eb; --bg:#f3f4f6; --text:#111827; }
* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, Segoe UI, Roboto; margin:0; color:var(--text); }
.header { padding:16px 24px; border-bottom:1px solid var(--border); }
.header h1 { margin:0; font-size:20px; color:var(--primary); }
.main { max-width:1100px; margin:0 auto; padding:24px; }
.card { background:#fff; border:1px solid var(--border); border-radius:8px; padding:20px; }
label { display:block; margin-top:12px; }
input { width:100%; border:1px solid var(--border); border-radius:6px; padding:10px; }
button { border:1px solid var(--primary); background:var(--primary); color:#fff; padding:10px 14px; border-radius:6px; cursor:pointer; }
button.secondary { background:#fff; color:var(--primary); }
table { width:100%; border-collapse:collapse; }
th, td { border:1px solid var(--border); padding:8px; text-align:left; }
.hint { color:#6b7280; font-size:12px; }
.error { color:#b91c1c; margin-top:10px; }
</style>
