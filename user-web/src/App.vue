<template>
  <n-message-provider>
    <n-dialog-provider>
      <div>
        <router-view />
        <Feedback />
      </div>
    </n-dialog-provider>
  </n-message-provider>
</template>

<script setup lang="ts">
// App.vue is the root component of the application
import { NMessageProvider, NDialogProvider } from 'naive-ui'
import Feedback from './components/Feedback.vue'
import { onMounted } from 'vue'

onMounted(() => {
  console.log('App.vue已挂载')
})
</script>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #F5F7FA;
  color: #333;
}
</style>