
<template>
  <div class="chat">
    <div :class="['chat-list',{'chat-list-new':list?.length > 0}]" v-if="list?.length">
      <chatList :listProp="list" ref="chatListRef"></chatList>
    </div>
    <div class="chat-welcome" v-else>
      <chatWelcome />
    </div>
    <div class="chat-add">
      <!-- {'chat-add-btn-disabled':!isComplete} -->
      <div :class="['chat-add-btn']" @click="addChat">
        <img src="@/assets/chat/addChatIcon.png" alt="">
        <div>开启新对话</div>
      </div>
    </div>
    <div class="chat-sender">
      <ChatPaneSend :isCompleteProp="isComplete" @updateSenderValue="updateSenderValue" />
    </div>

  </div>

</template>

<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted, useTemplateRef, watch } from 'vue'
import { BubbleList, Thinking, XMarkdown } from 'vue-element-plus-x'
import { workflowAPI, stopWorkflowAPI } from '@/apis/chat/index.ts'
import chatList from '@/views/chat/components/chatList.vue'
import ChatPaneSend from '@/views/chat/components/chatSender.vue'
import chatWelcome from '@/views/chat/components/chatWelcome.vue'
// import { fetchEventSource } from '@microsoft/fetch-event-source';
import robot from '@/assets/chat/robot.png'
import { uuid } from '@/libs/utils'

const list: any = ref([])
const workflowId: any = ref('c9b933f918354d2ba526d1d85cbff7e4')

const chatListRef = useTemplateRef('chatListRef')
// const isStreaming = ref(false)

const envUrl = computed(() => import.meta.env.VITE_HOST)
// 开始新会话
const addChat = async () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }

  // if (!isComplete.value)  return
  const res = await stopWorkflowAPI({
    workflow_id: workflowId.value,
    session_id: sessionId.value
    // stream: true
  })
  if (res.status_code === 200) {
    firstKey.value = ''
    sessionId.value = ''
    nodeId.value = ''
    messageId.value = ''
    isComplete.value = false
    list.value = []
    // isStreaming.value = false

    //  startStream({
    //   workflow_id: "6d2c810e3a2b4bf89ca63f65874de724",
    //   stream: true
    // },'/api/v2/workflow/invoke')

    await startFetchStream(
      {
        workflow_id: workflowId.value,
        stream: true
      },
      '/api/v2/workflow/invoke'
    )
  }
}

// 会话所需id
const sessionId = ref('')
const nodeId = ref('')
const messageId = ref('')
const firstKey = ref('')
// 会话初始化成功标识、会话是否完整结束标识
const isComplete = ref(false)
// 输入框数据
// const senderValue = ref('')

// 创建自己会话的基础数据
const creatUserMsg = (input: any) => {
  return {
    key: uuid(32), // 唯一标识
    role: 'user', // user | ai 自行更据模型定义
    placement: 'end', // start | end 气泡位置
    content: input, // 消息内容 流式接受的时候，只需要改这个值即可
    loading: false, // 当前气泡的加载状态
    // shape:'corner', // 气泡的形状
    // variant, // 气泡的样式
    isMarkdown: false, // 是否渲染为 markdown
    typing: false, // 是否开启打字器效果 该属性不会和流式接受冲突
    isFog: false, // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
    avatar: '',
    avatarSize: '24px', // 头像占位大小
    avatarGap: '12px' //
  }
}
// 创建ai会话的基础数据
const creatAiMsg = (input: any, extraData: any) => {
  return {
    key: uuid(32), // 唯一标识
    role: 'ai', // user | ai 自行更据模型定义
    placement: 'start', // start | end 气泡位置
    content: input, // 消息内容 流式接受的时候，只需要改这个值即可
    loading: false, // 当前气泡的加载状态
    // shape:'corner', // 气泡的形状
    // variant, // 气泡的样式
    isMarkdown: true, // 是否渲染为 markdown
    typing: true, // 是否开启打字器效果 该属性不会和流式接受冲突
    isFog: true, // 是否开启打字雾化效果，该效果 v1.1.6 新增，且在 typing 为 true 时生效，该效果会覆盖 typing 的 suffix 属性
    avatar: robot,
    avatarSize: '24px', // 头像占位大小
    avatarGap: '12px', //,
    thinkingStatus: 'start',
    ...extraData
  }
}
// 创建普通文本对话数据
const creatInputData = (input: any) => {
  return {
    workflow_id: workflowId.value,
    input,
    session_id: sessionId.value,
    message_id: messageId.value,
    stream: true
  }
}
// 输入框数据发送回调
const updateSenderValue = (value: any) => {
  if (nodeId.value) {
    const parmas: any = {}
    parmas[nodeId.value] = {
      user_input: value
    }
    // 最终发送的数据
    const obj = creatInputData(parmas)
    // console.log('要发送啥啊',obj);
    if (value) {
      isComplete.value = false
      const userMsg = creatUserMsg(value)
      list.value.push(userMsg)
      firstKey.value = uuid(32)
      const aiMsg = creatAiMsg('', {
        node_execution_id: '',
        reasoning_content: '',
        thinkingStatus: 'thinking',
        firstKey: firstKey.value
      })
      list.value.push(aiMsg)
      chatListRef.value?.scrollToBottom()
      // startStream(obj,'/api/v2/workflow/invoke')
      startFetchStream(obj, '/api/v2/workflow/invoke')
    }
  }
}

// 建立sse链接
// const startStream = (obj,url)  =>{
//   let ctrl: AbortController;
//   ctrl = new AbortController();
//   fetchEventSource(url, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       // 'Authorization': 'Bearer YOUR_TOKEN',
//     },
//     body: JSON.stringify(obj),
//     openWhenHidden: true,
//     signal: ctrl.signal,
//     onopen(response) {
//       // 连接成功时触发
//       console.log('连接成功')
//       // isComplete.value = false

//       if (response.ok) return;
//       throw new Error('连接失败');
//     },
//     onmessage(event) {
//       // 接收服务器发送的每条事件
//       // console.log('收到数据:', event.data);
//       console.log('收到数据:', JSON.parse(event.data))
//       if (event.data) {
//         organizeMsg(JSON.parse(event.data))
//       }

//     },
//     onclose() {
//       // 连接关闭时触发
//       console.log('连接终止');
//       isComplete.value = true
//       const isHasAiChat = list.value.some(item => item.role === 'ai')
//       if (isHasAiChat) {
//         if (!list.value[list.value.length - 1].content) {
//           list.value[list.value.length - 1].content = '知识库暂时无法找到相关内容'
//         }
//         list.value[list.value.length - 1].thinkingStatus = 'end'
//         list.value[list.value.length - 1].loading = false
//       }
//     },
//     onerror(err) {
//       // 错误处理（默认会抛出异常并自动重试）
//       console.error('错误:', err);
//       // 此方法会报错，但可以解决ts语法打包报错问题
//       ctrl.signal[0].aborted = false;
//       try {
//       	// onerror后关闭请求，但打包是ts语法报错
//         // ctrl.signal.aborted = false;
//         if (ctrl) {
//           ctrl.abort();
//         }
//       } finally {
//         console.log("finally", ctrl);
//       }
//     }
//   })

// }

// 整理接收到sse数据
const organizeMsg = value => {
  // 初始化保存对应id，后续发起会话需要这些id
  if (value.data?.event === 'input' && value.session_id && value.data.status !== 'stream') {
    sessionId.value = value.session_id
    nodeId.value = value.data.node_id
    messageId.value = value.data.message_id
  }
  // 流式开始传输
  if (value.data.status === 'stream') {
    const findAi = list.value.find(
      item =>
        item.node_execution_id === value.data.node_execution_id &&
        item.output_key === value.data?.output_schema.output_key
    )
    const findAiIndex = list.value.findIndex(
      item =>
        item.node_execution_id === value.data.node_execution_id &&
        item.output_key === value.data?.output_schema.output_key
    )
    const findFirstAi = list.value.find(item => item.firstKey === firstKey.value)
    const findFirstAiIndex = list.value.findIndex(item => item.firstKey === firstKey.value)
    if (findFirstAi) {
      list.value[findFirstAiIndex].loading = false
      list.value[findFirstAiIndex].content += value.data?.output_schema?.message
      list.value[findFirstAiIndex].thinkingStatus = 'thinking'
      list.value[findFirstAiIndex].node_execution_id = value.data.node_execution_id
      list.value[findFirstAiIndex].output_key = value.data?.output_schema.output_key
      firstKey.value = ''
      // console.log('首条追加信息',list.value[findFirstAiIndex].content);
    } else {
      if (!findAi) {
        const aiMsg = creatAiMsg(value, {
          node_execution_id: value.data.node_execution_id,
          content: value.data?.output_schema?.message,
          reasoning_content: '',
          thinkingStatus: 'start',
          output_key: value.data?.output_schema.output_key
        })
        // console.log('要新建会话了',aiMsg.content);

        list.value.push(aiMsg)
      } else {
        list.value[findAiIndex].loading = false
        list.value[findAiIndex].content += value.data?.output_schema?.message
        // console.log('追加信息',list.value[findAiIndex].content);

        list.value[findAiIndex].thinkingStatus = 'thinking'
      }
    }

    isComplete.value = false
    // chatListRef?.value?.scrollToBottom()
    // creatAiMsg
  } else if (value.data.status === 'end' && value.data.event === 'stream_msg') {
    console.log('结束的流', value)
    const findAi = list.value.find(
      item =>
        item.node_execution_id === value.data.node_execution_id &&
        item.output_key === value.data?.output_schema.output_key
    )
    const findAiIndex = list.value.findIndex(
      item =>
        item.node_execution_id === value.data.node_execution_id &&
        item.output_key === value.data?.output_schema.output_key
    )
    if (findAi) {
      list.value[findAiIndex].content = value.data?.output_schema?.message.replace(
        /\/tmp-dir/g,
        `${envUrl.value}/tmp-dir`
      )

      if (/\.png$/.test(list.value[findAiIndex].content)) {
        chatListRef.value?.scrollToBottom()
      }

      list.value[findAiIndex].thinkingStatus = 'end'
    }
    // if (isStreaming.value) {
    //   const aiMsg = creatAiMsg('',{node_execution_id:'',reasoning_content:'',thinkingStatus:'thinking',firstKey:firstKey.value})
    //   list.value.push(aiMsg)
    // }
  }
}

const abortController: any = ref(null)
// const reader:any = ref(null)
const startFetchStream = async (obj, url) => {
  try {
    // isStreaming.value = true
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    // 创建新的控制器
    abortController.value = new AbortController()

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(obj),
      signal: abortController.value.signal
    })
    if (res.body) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer: string = ''
      // 循环读取流式数据
      while (true) {
        // 读取一块数据（done 为 true 表示传输结束）
        const { done, value } = await reader.read()
        // 结束循环
        if (done) {
          isComplete.value = true
          // const isHasAiChat = list.value.some(item => item.role === 'ai')
          // if (isHasAiChat) {
          //   if (!list.value[list.value.length - 1].content) {
          //     list.value[list.value.length - 1].content = '知识库暂时无法找到相关内容'
          //   }
          //   list.value[list.value.length - 1].thinkingStatus = 'end'
          //   list.value[list.value.length - 1].loading = false
          // }
          // isStreaming.value = false
          break
        }
        if (abortController.value.signal.aborted) {
          // isStreaming.value = false
          // console.log('请求已终止，停止读取');
          // 释放读取器资源
          await reader.cancel()
          break
        }

        // 解码二进制数据为字符串并累加
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const parts = buffer.split('\n\n')

        buffer = parts.pop()! // 最后一部分可能是不完整的，保留到下次

        for (const part of parts) {
          const lines = part.split('\n')
          let data = ''

          for (const line of lines) {
            if (line.startsWith('data:')) {
              data += line.slice(5).trim() + '\n'
            }
          }

          if (data) {
            try {
              const parse = JSON.parse(data.trim())
              // console.log('接收数据',parse);
              organizeMsg(parse)
              // onMessage(parse)
            } catch (e) {
              // 非 JSON 直接当作文本流
              // onData({ text: data.trim() });
            }
          }
        }
      }
    }
  } catch (error) {
    // isStreaming.value = false
  } finally {
    // isStreaming.value = false
    // 重置控制器
    abortController.value = null
  }
}

onMounted(() => {
  console.log('import.meta.env.VITE_HOST', envUrl.value, import.meta.env)

  // startStream({
  //   workflow_id: "6d2c810e3a2b4bf89ca63f65874de724",
  //   stream: true
  // },'/api/v2/workflow/invoke')
  startFetchStream(
    {
      workflow_id: workflowId.value,
      stream: true
    },
    '/api/v2/workflow/invoke'
  )
})

onUnmounted(async () => {
  const res = await stopWorkflowAPI({
    workflow_id: workflowId.value,
    session_id: sessionId.value
    // stream: true
  })
})
</script>



<style scoped lang="less">
.chat {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  // width: 100%;
  height: 100%;
  padding: 24px;
  background-color: #00112b;
  // justify-content: space-between;
  &-list {
    flex: 1;
    margin-bottom: 24px;
    // :deep(.el-bubble .el-bubble-content-wrapper ) {
    //   .el-bubble-content {
    //     background-color:#006aff1a;
    //     border-radius: 0;
    //     max-width: 90%;
    //     // width: fit-content;
    //     color:#FFFFFF;
    //     border: 1px solid #006aff80;
    //   }
    //   .el-bubble-content-filled {
    //     background-color:#006aff1a;
    //     border: 1px solid #006aff80;
    //   }
    // }
    // :deep(.el-bubble-content-wrapper .el-bubble-content-loading .dot) {
    //   background-color: #ffffff;
    // }
  }
  &-list-new {
    // min-height: calc(100vh - 206px);
    margin-bottom: 24px;
  }
  &-welcome {
    flex: 1;
    margin-bottom: 24px;
  }
  &-add {
    display: flex;
    justify-content: center;

    &-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 122px;
      height: 36px;
      background: #003580;
      border: 1px solid #006affb8;
      border-radius: 19px;
      font-size: 14px;
      color: #ffffff;
      cursor: pointer;
      img {
        width: 16px;
        margin-right: 6px;
      }
    }
    &-btn-disabled {
      cursor: no-drop;
    }
  }
  &-sender {
    //  flex: 1;
    margin-top: 16px;
  }
}
</style>
