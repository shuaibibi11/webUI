<template>
  <div class="feedback-container">
    <!-- 顶部返回按钮 -->
    <div class="top-nav">
      <n-button text type="primary" @click="handleBack" class="nav-btn back-btn">
        <template #icon>
          <n-icon size="18">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </n-icon>
        </template>
        返回
      </n-button>
    </div>

    <div class="feedback-content">
      <div class="feedback-logo">
        <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
      </div>

      <div class="feedback-form-wrapper">
        <div class="feedback-header">
          <n-icon size="24" class="feedback-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
            </svg>
          </n-icon>
          <h1 class="feedback-title">投诉 / 反馈 / 建议</h1>
        </div>

        <n-form :model="form" :rules="rules" ref="formRef" class="feedback-form" label-placement="top">
          <n-form-item label="反馈类型" path="type">
            <n-select v-model:value="form.type" placeholder="请选择反馈类型" :options="feedbackTypes" />
          </n-form-item>

          <n-form-item label="反馈内容" path="content">
            <n-input v-model:value="form.content" type="textarea" placeholder="请详细描述您的问题或建议..."
              :autosize="{ minRows: 4, maxRows: 6 }" show-count maxlength="500" />
          </n-form-item>

          <n-form-item label="联系方式" path="contact">
            <n-input v-model:value="form.contact" placeholder="请输入邮箱、手机号或微信号" />
          </n-form-item>

          <n-form-item>
            <n-button type="primary" block @click="handleSubmit" :loading="loading" class="submit-button">
              提交反馈
            </n-button>
          </n-form-item>

          <div class="feedback-notice">
            收到您的意见反馈后，我们将在7个工作日内回复您！
          </div>
        </n-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { ArrowBack as ArrowBackIcon } from '@vicons/ionicons5'
import type { FormInst, FormRules } from 'naive-ui'
import { post } from '../utils/api'

const router = useRouter()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const form = reactive({
  type: '',
  content: '',
  contact: ''
})

const feedbackTypes = [
  { label: '投诉', value: 'complaint' },
  { label: '举报', value: 'report' },
  { label: '建议', value: 'suggestion' },
  { label: '其他', value: 'other' }
]

// 不使用图标的简单选择器标签渲染
const renderSelectLabel = (option: any) => {
  return h('span', { style: { padding: '4px 0' } }, option.label)
}

// 根据类型获取图标
const getIconForType = (type: string) => {
  const icons: Record<string, string> = {
    bug: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.42.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>',
    suggestion: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/></svg>',
    ui: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v2H5z"/></svg>',
    performance: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
    other: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
  }
  return icons[type] || icons.other
}

// 表单验证规则
const rules: FormRules = {
  type: [
    {
      required: true,
      message: '请选择反馈类型',
      trigger: ['change', 'blur']
    }
  ],
  content: [
    {
      required: true,
      message: '请输入反馈内容',
      trigger: ['input', 'blur']
    },
    {
      min: 10,
      max: 500,
      message: '内容长度应在10-500个字符之间',
      trigger: ['input', 'blur']
    }
  ],
  contact: [
    {
      required: true,
      message: '请输入联系方式',
      trigger: ['input', 'blur']
    },
    {
      pattern: /^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|1[3-9]\d{9}|[a-zA-Z0-9_-]{6,20})$/,
      message: '请输入有效的邮箱、手机号或微信号',
      trigger: ['input', 'blur']
    }
  ]
}

const handleBack = () => {
  router.back()
}

const handleSubmit = () => {
  if (!formRef.value) return

  formRef.value.validate((errors) => {
    if (!errors) {
      loading.value = true

      // 发送实际API请求
      post('/feedbacks', {
        type: form.type,
        content: form.content,
        contact: form.contact
      })
        .then(() => {
          loading.value = false
          message.success('反馈提交成功，我们会尽快处理您的反馈！')

          // 重置表单
          form.type = ''
          form.content = ''
          form.contact = ''

          // 返回上一页
          setTimeout(() => {
            router.back()
          }, 1500)
        })
        .catch(error => {
          loading.value = false
          message.error('反馈提交失败，请稍后重试')
          console.error('反馈提交失败', error)
        })
    } else {
      message.error('请填写完整的反馈信息')
    }
  })
}
</script>

<style scoped>
.feedback-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-image: url('@/assets/login-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  padding: 60px 20px;
}

/* 顶部导航 */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-start;
  padding: 16px 24px;
  z-index: 100;
}

.nav-btn {
  font-size: 14px;
  font-weight: 500;
  color: #1677FF;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  opacity: 0.8;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.feedback-content {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.feedback-logo {
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
}

.feedback-logo .logo-image {
  width: 100%;
  max-width: 240px;
  height: auto;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.feedback-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.feedback-icon {
  color: #1677FF;
}

.feedback-title {
  font-size: 20px;
  font-weight: 600;
  color: #1D2129;
  margin: 0;
}

.feedback-form-wrapper {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feedback-form {
  width: 100%;
}

.submit-button {
  height: 42px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  margin-top: 4px;
}

.feedback-notice {
  text-align: center;
  font-size: 12px;
  color: #86909C;
  margin-top: 12px;
  line-height: 1.5;
}

/* 表单项样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 13px;
  font-weight: 500;
  color: #1D2129;
  margin-bottom: 6px;
}

:deep(.n-input) {
  border-radius: 8px;
}

:deep(.n-base-selection) {
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .feedback-content {
    max-width: 100%;
  }

  .feedback-form {
    padding: 24px;
  }

  .feedback-title {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .feedback-container {
    padding: 40px 16px;
  }

  .feedback-form {
    padding: 20px;
  }

  .feedback-title {
    font-size: 18px;
  }

  .feedback-subtitle {
    font-size: 12px;
  }
}
</style>