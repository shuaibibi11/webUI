<template>
  <div class="feedback-container">
    <!-- 背景动画元素 -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
        <div class="shape shape-4"></div>
        <div class="shape shape-5"></div>
      </div>
    </div>
    
    <div class="feedback-content">
      <div class="feedback-header">
        <div class="header-left">
          <n-button
            quaternary
            @click="handleBack"
            :icon="ArrowBackIcon"
            class="back-btn"
            size="large"
          >
            返回
          </n-button>
        </div>
        <div class="header-center">
          <div class="feedback-icon">
            <n-icon size="36">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
              </svg>
            </n-icon>
          </div>
          <h1 class="feedback-title">投诉 / 反馈 / 建议</h1>
          <p class="feedback-subtitle">我们重视您的每一条反馈，帮助我们不断改进</p>
        </div>
      </div>
      
      <div class="feedback-form-wrapper">
        <n-form :model="form" :rules="rules" ref="formRef" class="feedback-form">
          <n-form-item path="type">
            <div class="form-label">
              <n-icon class="label-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
              </n-icon>
              反馈类型
            </div>
            <n-select
              v-model:value="form.type"
              placeholder="请选择反馈类型"
              :options="feedbackTypes"
              class="feedback-input"
              size="large"
              :render-label="renderSelectLabel"
            />
          </n-form-item>
          
          <n-form-item path="content">
            <div class="form-label">
              <n-icon class="label-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </n-icon>
              内容
            </div>
            <n-input
              v-model:value="form.content"
              type="textarea"
              placeholder="请详细描述您的问题或建议，您的反馈对我们非常重要..."
              :autosize="{ minRows: 6, maxRows: 12 }"
              class="feedback-input"
              size="large"
              show-count
              maxlength="500"
            />
            <div class="input-hint">请至少输入10个字符，最多500字符</div>
          </n-form-item>
          
          <n-form-item path="contact">
            <div class="form-label">
              <n-icon class="label-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </n-icon>
              联系方式 (选填)
            </div>
            <n-input
              v-model:value="form.contact"
              placeholder="邮箱 / 手机 / 微信"
              class="feedback-input"
              size="large"
            />
            <div class="input-hint">提供联系方式有助于我们更好地回复您的反馈</div>
          </n-form-item>
          
          <n-form-item>
            <n-button
              type="primary"
              block
              @click="handleSubmit"
              :loading="loading"
              class="submit-button"
              size="large"
            >
              <template #icon>
                <n-icon v-if="!loading">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </n-icon>
              </template>
              提交反馈
            </n-button>
          </n-form-item>
        </n-form>
        
        <div class="feedback-footer">
          <div class="footer-text">
            <n-icon>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
            </n-icon>
            您的反馈将被安全处理，我们承诺保护您的隐私
          </div>
        </div>
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
  { label: '功能问题', value: 'bug' },
  { label: '使用建议', value: 'suggestion' },
  { label: '界面反馈', value: 'ui' },
  { label: '性能问题', value: 'performance' },
  { label: '其他', value: 'other' }
]

// 自定义选择器标签渲染
const renderSelectLabel = (option: any) => {
  return h('div', { class: 'select-option' }, [
    h('span', { class: 'option-icon', innerHTML: getIconForType(option.value) }),
    h('span', { class: 'option-label' }, option.label)
  ])
}

// 根据类型获取图标
const getIconForType = (type: string) => {
  const icons = {
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
      pattern: /^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|1[3-9]\d{9}|[a-zA-Z0-9_-]{6,20})?$/,
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
  background-color: #f5f7fa;
  position: relative;
  overflow: hidden;
}

/* 背景动画 */
.bg-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  filter: blur(40px);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  top: 60%;
  right: 10%;
  animation-delay: 3s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  bottom: 20%;
  left: 20%;
  animation-delay: 5s;
}

.shape-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  top: 30%;
  right: 30%;
  animation-delay: 7s;
}

.shape-5 {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  bottom: 10%;
  right: 20%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(30px, -30px) rotate(90deg);
  }
  50% {
    transform: translate(-20px, 20px) rotate(180deg);
  }
  75% {
    transform: translate(-30px, -20px) rotate(270deg);
  }
}

.feedback-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.feedback-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-left {
  flex: 0 0 auto;
}

.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.feedback-icon {
  margin-bottom: 8px;
  color: #5e72e4;
}

.feedback-title {
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  text-align: center;
}

.feedback-subtitle {
  font-size: 14px;
  color: #718096;
  margin: 0;
  text-align: center;
}

.back-btn {
  color: #5e72e4;
}

.feedback-form-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}

.feedback-form {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.feedback-form:hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
}

.label-icon {
  color: #5e72e4;
  font-size: 18px;
}

.feedback-input {
  transition: all 0.3s ease;
}

.feedback-input:focus-within {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(94, 114, 228, 0.15);
}

.input-hint {
  font-size: 12px;
  color: #718096;
  margin-top: 6px;
  margin-left: 2px;
}

.submit-button {
  height: 50px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  background: linear-gradient(135deg, #5e72e4 0%, #825ee4 100%);
  border: none;
  transition: all 0.3s ease;
  margin-top: 10px;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(94, 114, 228, 0.3);
}

.feedback-footer {
  margin-top: 20px;
  text-align: center;
}

.footer-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #718096;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(5px);
}

.footer-text .n-icon {
  color: #5e72e4;
  font-size: 14px;
}

/* 自定义选择器样式 */
:deep(.n-base-selection) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.n-base-selection:hover) {
  border-color: #5e72e4;
}

:deep(.n-base-selection:focus-within) {
  border-color: #5e72e4;
  box-shadow: 0 0 0 2px rgba(94, 114, 228, 0.2);
}

:deep(.n-input) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.n-input:hover) {
  border-color: #5e72e4;
}

:deep(.n-input:focus-within) {
  border-color: #5e72e4;
  box-shadow: 0 0 0 2px rgba(94, 114, 228, 0.2);
}

:deep(.n-form-item-feedback-wrapper) {
  min-height: 24px;
}

:deep(.n-form-item-feedback.n-form-item-feedback--error) {
  color: #f56565;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .feedback-form-wrapper {
    padding: 15px;
  }
  
  .feedback-form {
    padding: 20px;
  }
  
  .feedback-title {
    font-size: 20px;
  }
  
  .shape {
    filter: blur(30px);
  }
  
  .shape-1, .shape-2 {
    width: 200px;
    height: 200px;
  }
  
  .shape-3, .shape-4, .shape-5 {
    width: 120px;
    height: 120px;
  }
}

@media (max-width: 480px) {
  .feedback-header {
    padding: 15px;
  }
  
  .feedback-form-wrapper {
    padding: 10px;
  }
  
  .feedback-form {
    padding: 15px;
  }
  
  .feedback-title {
    font-size: 18px;
  }
  
  .feedback-subtitle {
    font-size: 12px;
  }
}
</style>