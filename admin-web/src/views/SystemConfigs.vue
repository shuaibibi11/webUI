<template>
  <div class="system-configs-container">
    <n-card title="禁言配置管理">
      <template #header-extra>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon>
            <n-icon><AddIcon /></n-icon>
          </template>
          新增配置
        </n-button>
      </template>

      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="configs"
          :row-key="rowKey"
          striped
        />
      </n-spin>
    </n-card>

    <!-- 新增/编辑配置弹窗 -->
    <n-modal v-model:show="showCreateModal" preset="dialog" :title="editingConfig ? '编辑配置' : '新增配置'">
      <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="100px">
        <n-form-item label="配置键" path="configKey">
          <n-input v-model:value="formData.configKey" placeholder="请输入配置键" :disabled="!!editingConfig" />
        </n-form-item>
        <n-form-item label="配置值" path="configValue">
          <n-input v-model:value="formData.configValue" type="textarea" :rows="3" placeholder="请输入配置值" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input v-model:value="formData.description" placeholder="请输入描述" />
        </n-form-item>
        <n-form-item label="启用状态" path="enabled">
          <n-switch v-model:value="formData.enabled" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showCreateModal = false">取消</n-button>
        <n-button type="primary" @click="handleSave">保存</n-button>
      </template>
    </n-modal>

    <!-- 违规配置说明卡片 -->
    <n-card title="禁言配置说明" style="margin-top: 16px">
      <n-descriptions :column="1" bordered>
        <n-descriptions-item label="violation_tip">
          <n-text>违规提示词，当AI返回的内容包含此提示词时，会记录为违规。支持部分匹配。</n-text>
        </n-descriptions-item>
        <n-descriptions-item label="violation_threshold">
          <n-text>违规阈值，单个会话内违规达到此次数后会自动封禁用户（默认5次）</n-text>
        </n-descriptions-item>
        <n-descriptions-item label="ban_duration_minutes">
          <n-text>封禁时长（分钟），自动封禁的持续时间（默认10分钟）</n-text>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { NCard, NButton, NIcon, NDataTable, NModal, NForm, NFormItem, NInput, NSwitch, NTag, NSpin, NDescriptions, NDescriptionsItem, NText, useMessage, useDialog } from 'naive-ui'
import { Add as AddIcon } from '@vicons/ionicons5'
import { get, post, put, del } from '../utils/api'

interface SystemConfig {
  id: string
  configKey: string
  configValue: string
  description: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

const message = useMessage()
const dialog = useDialog()

const loading = ref(false)
const configs = ref<SystemConfig[]>([])
const showCreateModal = ref(false)
const editingConfig = ref<SystemConfig | null>(null)
const formRef = ref()

const formData = ref({
  configKey: '',
  configValue: '',
  description: '',
  enabled: true
})

const formRules = {
  configKey: [{ required: true, message: '请输入配置键', trigger: 'blur' }],
  configValue: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

const rowKey = (row: SystemConfig) => row.id

const columns = [
  {
    title: '配置键',
    key: 'configKey',
    width: 200
  },
  {
    title: '配置值',
    key: 'configValue',
    ellipsis: { tooltip: true }
  },
  {
    title: '描述',
    key: 'description',
    width: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: '状态',
    key: 'enabled',
    width: 80,
    render(row: SystemConfig) {
      return h(NTag, { type: row.enabled ? 'success' : 'default', size: 'small' }, () => row.enabled ? '启用' : '禁用')
    }
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    render(row: SystemConfig) {
      return row.updatedAt ? new Date(row.updatedAt).toLocaleString('zh-CN') : '-'
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row: SystemConfig) {
      return h('div', { style: { display: 'flex', gap: '8px' } }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => handleEdit(row) }, () => '编辑'),
        h(NButton, { size: 'small', type: 'error', onClick: () => handleDelete(row) }, () => '删除')
      ])
    }
  }
]

const fetchConfigs = async () => {
  loading.value = true
  try {
    const response = await get('/admin/system-configs')
    if (response.code === 200) {
      configs.value = response.data?.configs || []
    }
  } catch (error) {
    console.error('获取配置失败', error)
    message.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

const handleEdit = (row: SystemConfig) => {
  editingConfig.value = row
  formData.value = {
    configKey: row.configKey,
    configValue: row.configValue,
    description: row.description || '',
    enabled: row.enabled
  }
  showCreateModal.value = true
}

const handleSave = async () => {
  try {
    if (editingConfig.value) {
      // 编辑
      const response = await put(`/admin/system-configs/${editingConfig.value.id}`, {
        configValue: formData.value.configValue,
        description: formData.value.description,
        enabled: formData.value.enabled
      })
      if (response.code === 200) {
        message.success('更新成功')
        showCreateModal.value = false
        editingConfig.value = null
        fetchConfigs()
      } else {
        message.error(response.error || '更新失败')
      }
    } else {
      // 新增
      const response = await post('/admin/system-configs', formData.value)
      if (response.code === 201) {
        message.success('创建成功')
        showCreateModal.value = false
        fetchConfigs()
      } else {
        message.error(response.error || '创建失败')
      }
    }
  } catch (error: any) {
    console.error('保存失败', error)
    message.error(error.message || '保存失败')
  }
}

const handleDelete = (row: SystemConfig) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除配置"${row.configKey}"吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await del(`/admin/system-configs/${row.id}`)
        if (response.code === 200) {
          message.success('删除成功')
          fetchConfigs()
        } else {
          message.error(response.error || '删除失败')
        }
      } catch (error: any) {
        console.error('删除失败', error)
        message.error(error.message || '删除失败')
      }
    }
  })
}

// 监听弹窗关闭，重置表单
const resetForm = () => {
  editingConfig.value = null
  formData.value = {
    configKey: '',
    configValue: '',
    description: '',
    enabled: true
  }
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style scoped>
.system-configs-container {
  padding: 20px;
}
</style>
