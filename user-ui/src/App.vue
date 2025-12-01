<template>
  <header class="header"><h1>用户前端</h1></header>
  <main class="main"><router-view /></main>
</template>

<script setup lang="ts">
</script>

<style>
:root { --primary:#1E40AF; --border:#e5e7eb; --bg:#f3f4f6; --text:#111827; }
* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, Segoe UI, Roboto; margin:0; background:#fff; color:var(--text); }
.header { padding:16px 24px; border-bottom:1px solid var(--border); }
.header h1 { margin:0; font-size:20px; color:var(--primary); }
.main { max-width:1024px; margin:0 auto; padding:24px; }
.card { background:#fff; border:1px solid var(--border); border-radius:8px; padding:20px; }
label { display:block; margin-top:12px; font-size:14px; }
input, select, textarea { width:100%; border:1px solid var(--border); border-radius:6px; padding:10px; }
button { border:1px solid var(--primary); background:var(--primary); color:#fff; padding:10px 14px; border-radius:6px; cursor:pointer; }
button.secondary { background:#fff; color:var(--primary); }
.messages { height:360px; overflow:auto; border:1px solid var(--border); border-radius:8px; padding:12px; background:#fafafa; }
.msg { padding:8px; margin-bottom:8px; border-radius:6px; border:1px solid var(--border); }
.msg.user { border-color:#d1fae5; background:#ecfdf5; }
.msg.assistant { border-color:#e5e7eb; background:#f9fafb; }
.error { color:#b91c1c; margin-top:10px; }
.hint { color:#6b7280; font-size:12px; }
</style>
