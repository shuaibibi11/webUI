<template>
  <div class="feedback-container">
    <!-- 右下角悬浮按钮 - 长方形显示"意见反馈"文字 -->
    <!-- <n-button
      type="primary"
      size="large"
      :icon="ChatboxEllipsesIcon"
      @click="showFeedbackForm"
      class="floating-btn"
    >意见反馈</n-button> -->

    <!-- 反馈表单弹窗 - 使用正确的NModal组件 -->
    <n-modal v-model:show="formVisible" preset="card" title="意见反馈" size="large" :mask-closable="true"
      :close-on-esc="true" style="width: 500px">

      <n-form :model="form" :rules="rules" ref="formRef" class="feedback-form">
        <n-form-item path="type" label="反馈类型">
          <n-select v-model:value="form.type" placeholder="请选择反馈类型" :options="feedbackTypes" />
        </n-form-item>
        <n-form-item path="content" label="反馈内容">
          <n-input v-model:value="form.content" type="textarea" placeholder="请详细描述您的问题或建议..."
            :autosize="{ minRows: 6, maxRows: 12 }" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" block @click="handleSubmit" :loading="submitting">
            提交反馈
          </n-button>
        </n-form-item>
      </n-form>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NButton, NForm, NFormItem, NSelect, NInput, useMessage } from 'naive-ui'
// 使用useMessage
const message = useMessage()

// 初始状态设为false，确保弹窗默认不显示
const formVisible = ref(false)
const submitting = ref(false)
const formRef = ref()

const feedbackTypes = [
  { label: 'Bug报告', value: 'bug' },
  { label: '功能建议', value: 'suggestion' },
  { label: '投诉', value: 'complaint' },
  { label: '其他', value: 'other' }
]

const form = reactive({
  type: '',
  content: ''
})

const rules = {
  type: [
    { required: true, message: '请选择反馈类型', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' },
    { min: 10, message: '反馈内容至少10个字符', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 这里应该调用API提交反馈
    console.log('提交反馈', form)

    // 模拟提交成功
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 重置表单和关闭弹窗
    form.type = ''
    form.content = ''
    formVisible.value = false

    // 显示成功提示 - 使用Naive UI消息组件
    message.success('反馈成功，感谢您的支持！')
  } catch (error) {
    console.error('提交失败', error)
    // 错误提示也使用Naive UI组件
    message.error('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 确保按钮固定在右下角 */
.feedback-container {
  position: fixed;
  bottom: 133px;
  right: 32px;
  z-index: 1000;
}

/* 样式化按钮为长方形 */
.floating-btn {
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
  transition: all 0.3s ease;
  background-color: #1677FF;
  color: white;
  border-radius: 4px;
  /* 确保文字显示完整 */
  white-space: nowrap;

}

.floating-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(22, 119, 255, 0.4);
}

/* 弹窗内表单样式 */
.feedback-form {
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

:deep(.n-form-item) {
  margin-bottom: 20px;
}
</style>