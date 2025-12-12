<template>
  <div class="agreements-container">
    <!-- 背景动画元素 -->
    <div class="bg-animation">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-icon">
          <n-icon size="32">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </n-icon>
        </div>
        <div class="title-section">
          <h2 class="page-title">协议管理</h2>
          <n-breadcrumb>
            <n-breadcrumb-item>系统管理</n-breadcrumb-item>
            <n-breadcrumb-item>协议管理</n-breadcrumb-item>
          </n-breadcrumb>
        </div>
      </div>
      <div class="header-right">
        <n-button @click="fetchAgreements" :icon="refreshIcon" class="refresh-btn">
          刷新
        </n-button>
      </div>
    </div>

    <!-- 协议卡片 -->
    <div class="agreements-grid">
      <!-- 用户服务协议 -->
      <n-card class="agreement-card" title="用户服务协议">
        <template #header-extra>
          <n-tag :type="serviceAgreement.enabled ? 'success' : 'default'" size="small">
            {{ serviceAgreement.enabled ? '已启用' : '未启用' }}
          </n-tag>
        </template>
        <div class="agreement-preview">
          <div v-if="serviceAgreement.configValue" v-html="formatContent(serviceAgreement.configValue)" class="preview-content"></div>
          <div v-else class="preview-empty">暂无内容，请点击编辑添加</div>
        </div>
        <template #footer>
          <div class="agreement-footer">
            <span class="update-time" v-if="serviceAgreement.updatedAt">
              更新时间: {{ formatDate(serviceAgreement.updatedAt) }}
            </span>
            <n-space>
              <n-button type="primary" @click="editAgreement('service')">编辑</n-button>
            </n-space>
          </div>
        </template>
      </n-card>

      <!-- 隐私协议 -->
      <n-card class="agreement-card" title="隐私协议">
        <template #header-extra>
          <n-tag :type="privacyAgreement.enabled ? 'success' : 'default'" size="small">
            {{ privacyAgreement.enabled ? '已启用' : '未启用' }}
          </n-tag>
        </template>
        <div class="agreement-preview">
          <div v-if="privacyAgreement.configValue" v-html="formatContent(privacyAgreement.configValue)" class="preview-content"></div>
          <div v-else class="preview-empty">暂无内容，请点击编辑添加</div>
        </div>
        <template #footer>
          <div class="agreement-footer">
            <span class="update-time" v-if="privacyAgreement.updatedAt">
              更新时间: {{ formatDate(privacyAgreement.updatedAt) }}
            </span>
            <n-space>
              <n-button type="primary" @click="editAgreement('privacy')">编辑</n-button>
            </n-space>
          </div>
        </template>
      </n-card>
    </div>

    <!-- 编辑弹窗 -->
    <n-modal v-model:show="editModalVisible" preset="dialog" :title="editTitle" class="edit-modal" style="width: 800px">
      <n-form :model="editForm" label-placement="top">
        <n-form-item label="协议状态">
          <n-switch v-model:value="editForm.enabled">
            <template #checked>启用</template>
            <template #unchecked>禁用</template>
          </n-switch>
        </n-form-item>
        <n-form-item label="协议内容">
          <n-input
            v-model:value="editForm.content"
            type="textarea"
            placeholder="请输入协议内容，支持HTML格式"
            :rows="15"
            class="agreement-editor"
          />
        </n-form-item>
      </n-form>
      <template #action>
        <n-space>
          <n-button @click="editModalVisible = false">取消</n-button>
          <n-button type="primary" @click="saveAgreement" :loading="saving">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, h, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { Refresh as RefreshIcon } from '@vicons/tabler'
import { get, post, put } from '../utils/api'

const message = useMessage()

interface Agreement {
  id?: string
  configKey: string
  configValue: string
  description?: string
  enabled: boolean
  updatedAt?: string
}

const serviceAgreement = ref<Agreement>({
  configKey: 'user_service_agreement',
  configValue: '',
  enabled: true
})

const privacyAgreement = ref<Agreement>({
  configKey: 'privacy_agreement',
  configValue: '',
  enabled: true
})

const editModalVisible = ref(false)
const editTitle = ref('')
const editType = ref<'service' | 'privacy'>('service')
const saving = ref(false)

const editForm = reactive({
  enabled: true,
  content: ''
})

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化内容预览
const formatContent = (content: string) => {
  if (!content) return ''
  // 截取前500字符作为预览
  const preview = content.length > 500 ? content.substring(0, 500) + '...' : content
  return preview.replace(/\n/g, '<br>')
}

// 获取协议配置
const fetchAgreements = async () => {
  try {
    const response = await get('/admin/system-configs')
    if (response.code === 200 && response.data?.configs) {
      const configs = response.data.configs

      // 查找用户服务协议
      const serviceConfig = configs.find((c: any) => c.configKey === 'user_service_agreement')
      if (serviceConfig) {
        serviceAgreement.value = {
          id: serviceConfig.id,
          configKey: serviceConfig.configKey,
          configValue: serviceConfig.configValue || '',
          description: serviceConfig.description,
          enabled: serviceConfig.enabled !== false,
          updatedAt: serviceConfig.updatedAt
        }
      }

      // 查找隐私协议
      const privacyConfig = configs.find((c: any) => c.configKey === 'privacy_agreement')
      if (privacyConfig) {
        privacyAgreement.value = {
          id: privacyConfig.id,
          configKey: privacyConfig.configKey,
          configValue: privacyConfig.configValue || '',
          description: privacyConfig.description,
          enabled: privacyConfig.enabled !== false,
          updatedAt: privacyConfig.updatedAt
        }
      }
    }
  } catch (error) {
    console.error('获取协议配置失败', error)
    message.error('获取协议配置失败')
  }
}

// 编辑协议
const editAgreement = (type: 'service' | 'privacy') => {
  editType.value = type
  if (type === 'service') {
    editTitle.value = '编辑用户服务协议'
    editForm.enabled = serviceAgreement.value.enabled
    editForm.content = serviceAgreement.value.configValue
  } else {
    editTitle.value = '编辑隐私协议'
    editForm.enabled = privacyAgreement.value.enabled
    editForm.content = privacyAgreement.value.configValue
  }
  editModalVisible.value = true
}

// 保存协议
const saveAgreement = async () => {
  saving.value = true
  try {
    const agreement = editType.value === 'service' ? serviceAgreement.value : privacyAgreement.value
    const configKey = editType.value === 'service' ? 'user_service_agreement' : 'privacy_agreement'
    const description = editType.value === 'service' ? '用户服务协议内容' : '隐私协议内容'

    if (agreement.id) {
      // 更新现有配置
      const response = await put(`/admin/system-configs/${agreement.id}`, {
        configValue: editForm.content,
        enabled: editForm.enabled
      })
      if (response.code === 200) {
        message.success('保存成功')
        editModalVisible.value = false
        fetchAgreements()
      } else {
        message.error(response.message || '保存失败')
      }
    } else {
      // 创建新配置
      const response = await post('/admin/system-configs', {
        configKey,
        configValue: editForm.content,
        description,
        enabled: editForm.enabled
      })
      if (response.code === 201) {
        message.success('保存成功')
        editModalVisible.value = false
        fetchAgreements()
      } else {
        message.error(response.message || '保存失败')
      }
    }
  } catch (error: any) {
    console.error('保存协议失败', error)
    message.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 图标
const refreshIcon = () => h(RefreshIcon)

onMounted(() => {
  fetchAgreements()
})
</script>

<style scoped>
.agreements-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
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
  opacity: 0.05;
  filter: blur(40px);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #5e72e4 0%, #825ee4 100%);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #2dce89 0%, #34d399 100%);
  top: 60%;
  right: 10%;
  animation-delay: 3s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #11cdef 0%, #1171ef 100%);
  bottom: 20%;
  left: 30%;
  animation-delay: 5s;
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

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-icon {
  color: #5e72e4;
  background: rgba(94, 114, 228, 0.1);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
}

.refresh-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 协议卡片网格 */
.agreements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  position: relative;
  z-index: 1;
}

.agreement-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.agreement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.agreement-preview {
  min-height: 200px;
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-content {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 150px;
  color: #a0aec0;
  font-size: 14px;
}

.agreement-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-time {
  font-size: 12px;
  color: #718096;
}

/* 编辑弹窗 */
:deep(.edit-modal) {
  border-radius: 16px;
  overflow: hidden;
}

.agreement-editor {
  font-family: monospace;
  font-size: 14px;
}

/* 响应式 */
@media (max-width: 768px) {
  .agreements-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
  }

  .header-right {
    width: 100%;
  }

  .refresh-btn {
    width: 100%;
  }

  .agreements-grid {
    grid-template-columns: 1fr;
  }
}
</style>
