<template>
  <div class="chat-welcome-content">
    <div class="robot-box">
      <img src="@/assets/chat/robot.png" alt="">
    </div>
    <div class="welcome-title">我是百干万 AI 助手，很高兴见到你</div>
    <div class="welcome-title-small">现已在政务外网私有化部署DeepSeek-R1-671B、Qwen3大模型，欢迎试用。</div>
    <div class="welcome-title-yellow">注意：请勿发送敏感信息和个人隐私信息。</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';




</script>

<style scoped lang="less">
.chat-welcome-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .robot-box {
    width: 72px;
    height: 72px;
    margin-bottom: 40px;
    img {
      width: 100%;
    }
  }
  .welcome-title {
    margin-bottom: 24px;
    font-family: PingFangSC-Semibold;
    font-weight: 600;
    font-size: 24px;
    color: #FFFFFF;
    &-small {
      font-family: PingFangSC-Regular;
      font-weight: 400;
      font-size: 18px;
      margin-bottom: 16px;
      color: #FFFFFF;
    }
    &-yellow {
      font-family: PingFangSC-Regular;
      font-weight: 400;
      font-size: 18px;
     
      color: #FFD638;
    }
  }
}
</style>