import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Chat from './pages/Chat.vue'
import Feedback from './pages/Feedback.vue'
import Terms from './pages/Terms.vue'
import Privacy from './pages/Privacy.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/register', component: Register },
  { path: '/chat', component: Chat },
  { path: '/feedback', component: Feedback },
  { path: '/terms', component: Terms },
  { path: '/privacy', component: Privacy },
]

const router = createRouter({ history: createWebHistory(), routes })

createApp(App).use(router).mount('#app')
