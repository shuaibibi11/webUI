import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Users from '../views/Users.vue'
import Registrations from '../views/Registrations.vue'
import Models from '../views/Models.vue'
import Workflows from '../views/Workflows.vue'
import Logs from '../views/Logs.vue'
import Feedbacks from '../views/Feedbacks.vue'
import Conversations from '../views/Conversations.vue'
import PasswordResets from '../views/PasswordResets.vue'
import ActionLogs from '../views/ActionLogs.vue'
import SystemConfigs from '../views/SystemConfigs.vue'
import Agreements from '../views/Agreements.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    {
      path: '/',
      redirect: '/dashboard',
      meta: { requiresAuth: true }
    },
    { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/users', component: Users, meta: { requiresAuth: true } },
    { path: '/registrations', component: Registrations, meta: { requiresAuth: true } },
    { path: '/models', component: Models, meta: { requiresAuth: true } },
    { path: '/workflows', component: Workflows, meta: { requiresAuth: true } },
    { path: '/logs', component: Logs, meta: { requiresAuth: true } },
    { path: '/feedbacks', component: Feedbacks, meta: { requiresAuth: true } },
    { path: '/conversations', component: Conversations, meta: { requiresAuth: true } },
    { path: '/password-resets', component: PasswordResets, meta: { requiresAuth: true } },
    { path: '/action-logs', component: ActionLogs, meta: { requiresAuth: true } },
    { path: '/mute-configs', component: SystemConfigs, meta: { requiresAuth: true } },
    { path: '/agreements', component: Agreements, meta: { requiresAuth: true } }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router