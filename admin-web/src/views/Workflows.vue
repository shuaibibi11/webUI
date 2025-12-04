<template>
  <div class="workflows-container">
    <n-card title="Bisheng工作流配置" class="workflows-card">
      <div class="card-header">
        <n-button type="primary" @click="handleAddWorkflow" :icon="plusIcon">
          添加工作流
        </n-button>
      </div>
      
      <n-data-table
        :columns="columns"
        :data="workflows"
        :loading="loading"
        :row-key="(row: Workflow) => row.id"
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
              @click="testWorkflow(row)"
              :icon="checkIcon"
            >
              测试
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
    
    <!-- 工作流配置模态框 -->
    <n-modal v-model:show="showModal" :title="isEditing ? '编辑工作流' : '添加工作流'" preset="card" :style="{ width: '800px' }">
      <n-form :model="form" label-placement="left" label-width="120px">
        <n-form-item label="工作流名称">
          <n-input v-model:value="form.name" placeholder="请输入工作流名称" />
        </n-form-item>
        <n-form-item label="工作流ID">
          <n-input v-model:value="form.workflowId" placeholder="请输入Bisheng工作流ID" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input
            v-model:value="form.description"
            placeholder="请输入工作流描述"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />
        </n-form-item>
        <n-form-item label="API端点">
          <n-input v-model:value="form.endpoint" placeholder="请输入工作流API端点" />
        </n-form-item>
        <n-form-item label="API Key">
          <n-input v-model:value="form.apiKey" placeholder="请输入API Key" type="password" show-password-on="mousedown" />
        </n-form-item>
        <n-form-item label="状态">
          <n-switch v-model:checked="form.enabled" />
        </n-form-item>
        <n-form-item label="配置参数">
          <n-input
            v-model:value="form.configJson"
            placeholder="请输入JSON格式的配置参数"
            type="textarea"
            :autosize="{ minRows: 6, maxRows: 10 }"
            :style="{ fontFamily: 'monospace' }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" @click="handleSave" :loading="saving">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import { NIcon, NModal, NForm, NFormItem, NInput, NSwitch, NButton, NTag, useMessage, useDialog } from 'naive-ui'
const message = useMessage()
const dialog = useDialog()
import { Pencil, Trash, Add, CheckmarkCircle } from '@vicons/ionicons5'
import { get, post, put, del } from '../utils/api'

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)

interface Workflow {
  id: string
  name: string
  workflowId: string
  description: string
  endpoint: string
  apiKey: string
  enabled: boolean
  configJson: string
  createdAt: string
  updatedAt: string
}

const workflows = ref<Workflow[]>([])

const form = reactive({
  id: '',
  name: '',
  workflowId: '',
  description: '',
  endpoint: '',
  apiKey: '',
  enabled: true,
  configJson: '{}'
})

const columns = [
  { title: 'ID', key: 'id', width: 100 },
  { title: '工作流名称', key: 'name', width: 180 },
  { title: '工作流ID', key: 'workflowId', width: 180 },
  { title: '描述', key: 'description', width: 200 },
  { title: 'API端点', key: 'endpoint', width: 250 },
  { title: '状态', key: 'enabled', width: 120, render: (row: Workflow) => {
    return h(NSwitch, {
      value: row.enabled,
      onUpdateValue: (value: boolean) => handleToggleEnabled(row.id, value),
      loading: (row as any)._toggleLoading || false
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

// 获取工作流列表
const fetchWorkflows = async () => {
  loading.value = true
  try {
    const response = await get('/admin/workflows')
    workflows.value = response.data?.workflows || []
  } catch (error) {
    console.error('获取工作流列表失败', error)
    message.error('获取工作流列表失败')
  } finally {
    loading.value = false
  }
}

// 打开添加工作流模态框
const handleAddWorkflow = () => {
  isEditing.value = false
  Object.assign(form, {
    id: '',
    name: '',
    workflowId: '',
    description: '',
    endpoint: '',
    apiKey: '',
    enabled: true,
    configJson: '{}'
  })
  showModal.value = true
}

// 打开编辑工作流模态框
const handleEdit = (id: string) => {
  isEditing.value = true
  const workflow = workflows.value.find(w => w.id === id)
  if (workflow) {
    Object.assign(form, workflow)
    showModal.value = true
  }
}

// 删除工作流
const handleDelete = async (id: string) => {
  try {
    await del(`/admin/workflows/${id}`)
    message.success('删除工作流成功')
    fetchWorkflows()
  } catch (error) {
    console.error('删除工作流失败', error)
    message.error('删除工作流失败')
  }
}

// 保存工作流
const handleSave = async () => {
  try {
    // 验证JSON格式
    if (form.configJson) {
      JSON.parse(form.configJson)
    }
    
    saving.value = true
    if (isEditing.value) {
      await put(`/admin/workflows/${form.id}`, form)
      message.success('更新工作流成功')
    } else {
      await post('/admin/workflows', form)
      message.success('添加工作流成功')
    }
    showModal.value = false
    fetchWorkflows()
  } catch (error) {
    console.error('保存工作流失败', error)
    if (error instanceof SyntaxError) {
      message.error('配置参数必须是有效的JSON格式')
    } else {
      message.error('保存工作流失败')
    }
  } finally {
    saving.value = false
  }
}

// 测试工作流
const testWorkflow = async (workflow: Workflow) => {
  try {
    const response = await post('/admin/workflows/test', {
      workflowId: workflow.workflowId,
      endpoint: workflow.endpoint,
      apiKey: workflow.apiKey,
      configJson: workflow.configJson
    })
    if (response.success) {
      message.success('工作流测试成功')
    } else {
      message.error(`工作流测试失败: ${response.message}`)
    }
  } catch (error) {
    console.error('测试工作流失败', error)
    message.error('测试工作流失败')
  }
}

// 切换工作流启用/禁用状态
const handleToggleEnabled = async (id: string, enabled: boolean) => {
  const workflow = workflows.value.find(w => w.id === id)
  if (!workflow) return
  
  const statusText = enabled ? '启用' : '禁用'
  
  dialog.warning({
    title: '确认操作',
    content: `确定要${statusText}该工作流吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      // 设置加载状态
      if (!(workflow as any)._toggleLoading) {
        (workflow as any)._toggleLoading = true
      }
      
      try {
        // 构建更新数据，保持其他字段不变
        const updateData = {
          ...workflow,
          enabled: enabled
        }
        const response = await put(`/admin/workflows/${id}`, updateData)
        if (response.code === 200) {
          message.success(`${statusText}成功`)
          workflow.enabled = enabled
          fetchWorkflows()
        } else {
          message.error(response.message || `${statusText}失败`)
          // 恢复原状态
          workflow.enabled = !enabled
        }
      } catch (error: any) {
        console.error(`${statusText}失败`, error)
        message.error(error.message || `${statusText}失败`)
        // 恢复原状态
        workflow.enabled = !enabled
      } finally {
        (workflow as any)._toggleLoading = false
      }
    }
  })
}

// 初始化
onMounted(() => {
  fetchWorkflows()
})
</script>

<style scoped>
.workflows-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.workflows-card {
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
