import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Chat from '../views/Chat.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/chat', component: Chat, meta: { requiresAuth: true } },
    { path: '/register', component: () => import('../views/Register.vue') },
    { path: '/forgot-password', component: () => import('../views/ForgotPassword.vue') },
    { path: '/feedback', component: () => import('../views/Feedback.vue') }
  ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
