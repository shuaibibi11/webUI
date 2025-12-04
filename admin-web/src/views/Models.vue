<template>
  <div class="models-container">
    <n-card title="模型配置" class="models-card">
      <div class="card-header">
        <n-button type="primary" @click="handleAddModel" :icon="plusIcon">
          添加模型
        </n-button>
      </div>
      
      <n-data-table
        :columns="columns"
        :data="models"
        :loading="loading"
        :row-key="(row: Model) => row.id"
        :bordered="false"
        :scroll-x="1200"
      >
        <template #body-cell-actions="{ row }">
          <div class="action-buttons">
            <n-button
              type="primary"
              size="small"
              @click="handleEdit(row.id)"
              :icon="editIcon"
            >
              编辑
            </n-button>
            <n-button
              type="warning"
              size="small"
              @click="testModelConnection(row)"
              :icon="checkIcon"
            >
              测试连接
            </n-button>
            <n-button
              type="error"
              size="small"
              @click="handleDelete(row.id)"
              :icon="deleteIcon"
            >
              删除
            </n-button>
          </div>
        </template>
      </n-data-table>
    </n-card>
    
    <!-- 模型配置模态框 -->
    <n-modal v-model:show="showModal" :title="isEditing ? '编辑模型' : '添加模型'" preset="card" :style="{ width: '600px' }">
      <n-form :model="form" label-placement="left" label-width="100px">
        <n-form-item label="提供商">
          <n-select v-model:value="form.provider" :options="[
            { label: 'Bisheng', value: 'Bisheng' },
            { label: 'OpenAI', value: 'OpenAI' },
            { label: 'Azure OpenAI', value: 'AzureOpenAI' }
          ]" />
        </n-form-item>
        <n-form-item label="模型名称">
          <n-input v-model:value="form.modelName" placeholder="请输入模型名称" />
        </n-form-item>
        <n-form-item label="端点">
          <n-input v-model:value="form.endpoint" placeholder="请输入API端点" />
        </n-form-item>
        <n-form-item label="API Key">
          <n-input v-model:value="form.apiKey" placeholder="请输入API Key" type="password" show-password-on="mousedown" />
        </n-form-item>
        <n-form-item label="状态">
          <n-switch v-model:checked="form.enabled" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave" :loading="loading">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { NIcon, NModal, NForm, NFormItem, NInput, NSelect, NSwitch, NButton, NTag, useMessage, useDialog } from 'naive-ui'
const message = useMessage()
const dialog = useDialog()
import { Pencil, Trash, Add, CheckmarkCircle } from '@vicons/ionicons5'
import { get, post, put, del } from '../utils/api'

// 模型数据接口
interface Model {
  id: string
  name: string
  type: string
  description: string
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

const loading = ref(false)
const showModal = ref(false)
const isEditing = ref(false)

interface Model {
  id: string
  provider: string
  modelName: string
  endpoint: string
  apiKey: string
  enabled: boolean
  createdAt: string
  _toggleLoading?: boolean
}

const models = ref<Model[]>([])

const form = reactive({
  id: '',
  provider: 'Bisheng',
  modelName: '',
  endpoint: '',
  apiKey: '',
  enabled: true
})

const columns = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '提供商', key: 'provider', width: 150 },
  { title: '模型名称', key: 'modelName', width: 150 },
  { title: '端点', key: 'endpoint', width: 250 },
  { title: 'API Key', key: 'apiKey', width: 200, render: (row: Model) => {
    return row.apiKey ? '••••••••' : ''
  } },
  { title: '状态', key: 'enabled', width: 120, render: (row: Model) => {
    return h(NSwitch, {
      value: row.enabled,
      onUpdateValue: (value: boolean) => handleToggleEnabled(row.id, value),
      loading: row._toggleLoading || false
    })
  } },
  { title: '创建时间', key: 'createdAt', width: 200 },
  { title: '操作', key: 'actions', width: 200, fixed: 'right' }
]

// 图标定义
const editIcon = () => h(NIcon, null, { default: () => h(Pencil) })
const deleteIcon = () => h(NIcon, null, { default: () => h(Trash) })
const plusIcon = () => h(NIcon, null, { default: () => h(Add) })
const checkIcon = () => h(NIcon, null, { default: () => h(CheckmarkCircle) })

// 获取模型列表
const fetchModels = async () => {
  loading.value = true
  try {
    const response = await get('/admin/models')
    // 后端返回格式为 { code: 200, data: { models: [...] } }
    models.value = response?.data?.models || []
  } catch (error) {
    console.error('获取模型列表失败', error)
    message.error('获取模型列表失败')
  } finally {
    loading.value = false
  }
}

// 打开添加模型模态框
const handleAddModel = () => {
  isEditing.value = false
  Object.assign(form, {
    id: '',
    provider: 'Bisheng',
    modelName: '',
    endpoint: '',
    apiKey: '',
    enabled: true
  })
  showModal.value = true
}

// 打开编辑模型模态框
const handleEdit = (id: string) => {
  isEditing.value = true
  const model = models.value.find(m => m.id === id)
  if (model) {
    Object.assign(form, model)
    showModal.value = true
  }
}

// 删除模型
const handleDelete = async (id: string) => {
  try {
    await del(`/admin/models/${id}`)
    message.success('删除模型成功')
    fetchModels()
  } catch (error) {
    console.error('删除模型失败', error)
    message.error('删除模型失败')
  }
}

// 保存模型
const handleSave = async () => {
  try {
    if (isEditing.value) {
      await put(`/admin/models/${form.id}`, form)
      message.success('更新模型成功')
    } else {
      await post('/admin/models', form)
      message.success('添加模型成功')
    }
    showModal.value = false
    fetchModels()
  } catch (error) {
    console.error('保存模型失败', error)
    message.error('保存模型失败')
  }
}

// 测试模型连接
const testModelConnection = async (model: Model) => {
  try {
    const response = await post('/admin/models/test-connection', {
      provider: model.provider,
      endpoint: model.endpoint,
      apiKey: model.apiKey
    })
    if (response.success) {
      message.success('模型连接测试成功')
    } else {
      message.error(`模型连接测试失败: ${response.message}`)
    }
  } catch (error) {
    console.error('测试模型连接失败', error)
    message.error('测试模型连接失败')
  }
}

// 切换模型启用/禁用状态
const handleToggleEnabled = async (id: string, enabled: boolean) => {
  const model = models.value.find(m => m.id === id)
  if (!model) return
  
  const statusText = enabled ? '启用' : '禁用'
  
  dialog.warning({
    title: '确认操作',
    content: `确定要${statusText}该模型吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      // 设置加载状态
      if (!model._toggleLoading) {
        model._toggleLoading = true
      }
      
      try {
        const response = await put(`/admin/models/${id}`, { enabled })
        if (response.code === 200) {
          message.success(`${statusText}成功`)
          model.enabled = enabled
          fetchModels()
        } else {
          message.error(response.message || `${statusText}失败`)
          // 恢复原状态
          model.enabled = !enabled
        }
      } catch (error: any) {
        console.error(`${statusText}失败`, error)
        message.error(error.message || `${statusText}失败`)
        // 恢复原状态
        model.enabled = !enabled
      } finally {
        model._toggleLoading = false
      }
    }
  })
}

// 初始化
onMounted(() => {
  fetchModels()
})
</script>

<style scoped>
.models-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.models-card {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>