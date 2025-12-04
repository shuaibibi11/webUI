<template>
  <div class="chat-list-content">
    <BubbleList :list="listProp" max-height="calc(100vh - 249px)" :showBackButton="false" ref="BubbleListRef">
      <template #header="{ item }">
        <Thinking :status="item.thinkingStatus" v-if=" item.role === 'ai' ">
          <template #arrow>
            <span></span>
          </template>
          <template #label>
            <!-- <span v-if="item.thinkingStatus === 'start'">开始思考</span> -->
            <span v-if="item.thinkingStatus === 'thinking'">正在思考</span>
            <span v-if="item.thinkingStatus === 'end'">思考已完成</span>
          </template>
        </Thinking>

      </template>
      <template #content="{ item }">
        <!-- chat 内容走 markdown -->
        <XMarkdown v-if="item.content && item.role === 'ai'" :markdown="item.content" class="markdown-body" allow-html :themes="{ light: 'github-light', dark: 'github-dark' }" />
        <!-- user 内容 纯文本 -->
        <div v-if="item.content && item.role === 'user'" class="user-content">
          {{ item.content }}
        </div>
      </template>

    </BubbleList>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, useTemplateRef } from 'vue'
import { BubbleList, Thinking, XMarkdown } from 'vue-element-plus-x'

const props = withDefaults(
  defineProps<{
    listProp?: any
  }>(),
  {
    listProp: () => []
  }
)

const BubbleListRef = useTemplateRef('BubbleListRef')

defineExpose({
  // scrollToBottom: (data: { behavior: 'auto' | 'smooth'}) => {
  //   const el = document.querySelector<HTMLDivElement>('.t-chat__list')
  //   nextTick(() => {
  //     if (el) {
  //       el.scrollTo({
  //         top: el.scrollHeight
  //       })
  //     }
  //   })

  // }
  scrollToBottom: () => {
    if (BubbleListRef.value) {
      BubbleListRef.value.scrollToBottom()
    }
  }
})
</script>

<style scoped lang="less">
.chat-list-content {
  :deep(.el-bubble .el-bubble-content-wrapper) {
    .el-bubble-content {
      background-color: #006aff1a;
      border-radius: 0;
      max-width: 90%;
      // width: fit-content;
      color: #ffffff;
      border: 1px solid #006aff80;
    }
    .el-bubble-content-filled {
      background-color: #006aff1a;
      border: 1px solid #006aff80;
    }
  }
  :deep(.el-bubble-content-wrapper .el-bubble-content-loading .dot) {
    background-color: #ffffff;
  }
  :deep(.elx-xmarkdown-container) {
    color: #ffffff;
    img {
      max-width: 100%;
    }
  }
  :deep(.el-thinking .trigger) {
    cursor: auto;
    padding: 3px;
    background-color: transparent;
    color: #ffffff;
    border-color: transparent;
    font-size: 12px;
  }
}
</style>