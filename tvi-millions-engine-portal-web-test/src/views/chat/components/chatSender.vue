<template>
  <div class="sender-content">
    <Sender :loading="!props.isCompleteProp" :disabled="!props.isCompleteProp" v-model="senderValue"  placeholder="给百千万AI助手发信息" @submit="handleSubmit" @cancel="handCancel">
      <!-- <template #action-list >
        <div class="sender-submit">
          <img src="@/assets/chat/sendIcon.png" alt="">
        </div>
      </template> -->
    </Sender>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { EditorSender,Sender } from 'vue-element-plus-x';

const props = withDefaults(
  defineProps<{
   
    isCompleteProp: boolean,
  }>(),
  {
    
    isCompleteProp: false
  }
)

const emits = defineEmits<{
  'updateSenderValue': [string]
}>()

// 会话加载标识
// const isChatLoading = ref(false)
// 输入框数据
const senderValue = ref('')

const handleSubmit = () => {
  const processedText = senderValue.value.replace(/[^\S\n\r]/g, '');
  // console.log('输入数据',processedText);
  if (processedText) {
    emits('updateSenderValue', processedText)
    senderValue.value = ''
  }
  
 
}
const handCancel = () => {
  // isChatLoading.value = false
  
}
</script>

<style scoped lang="less">
.sender-content {
  :deep(.el-editor-sender-wrap){
    background: #006aff33;
    border: 1px solid #006aff80;
    & .el-editor-sender-content {
      height: 126px;
    }
    .el-editor-sender-content .el-editor-sender-chat-room .el-editor-sender-chat .chat-placeholder-wrap {
      color: #ffffff;
    }
    .chat-grid-input {
      color: #ffffff;
      font-size: 16px;
    }
  }
  :deep(.el-sender-wrap){
     .el-sender-content {
       height: 126px;
       .el-sender-input .el-textarea__inner {
          color: #ffffff;
          font-size: 16px;
       }
    }
  }
  :deep(.el-sender) {
    background: #006aff33;
    border: 1px solid #006aff80;
    .el-sender-content .el-sender-input {
      flex-direction: column;
    }
  }
 
  // .sender-submit {
  //   width: 36px;
  //   height: 36px;
  //   border-radius: 50%;
  //   background-image: linear-gradient(180deg, #13EB9C 0%, #00B6B2 100%);
  //   display: flex;
  //   justify-content: center;
  //   align-items: center;
  //   img {
  //     width: 16px;
  //     height: 16px;
  //   }
  // }
  :deep(.el-button.is-circle) {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-image: linear-gradient(180deg, #13EB9C 0%, #00B6B2 100%);
    border-color: linear-gradient(180deg, #13EB9C 0%, #00B6B2 100%);
    .el-icon {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
    }
  }
  :deep(.el-send-button .loading-svg) {
    color: #ffffff;
  }
  // .el-button.is-disabled, .el-button.is-disabled:hover {

  // }
}
</style>