# 修复naive-ui message组件导入错误

## 问题分析
1. 错误信息：`SyntaxError: The requested module '/node_modules/.vite/deps/naive-ui.js?v=1f40ca87' does not provide an export named 'message'`
2. 错误类型：组件导入错误
3. 根本原因：naive-ui的message组件不是通过命名导出提供的，而是需要单独导入

## 解决方案
将所有组件中的message导入方式从命名导入改为单独导入，使用useMessage()函数或直接导入message对象。

## 修复步骤
1. 修复Workflows.vue中的message导入和使用
2. 修复Models.vue中的message导入和使用
3. 修复Users.vue中的message导入和使用
4. 重启admin-web服务验证修复
5. 进行全面测试，确保所有功能正常显示

## 具体修改
- 文件：`/data/webUI-java/admin-web/src/views/Workflows.vue`
- 修改内容：
  - 将`import { NIcon, message, ... } from 'naive-ui'`改为`import { NIcon, ... } from 'naive-ui'; import { useMessage } from 'naive-ui'; const message = useMessage()`

- 文件：`/data/webUI-java/admin-web/src/views/Models.vue`
- 修改内容：
  - 将`import { NIcon, message, ... } from 'naive-ui'`改为`import { NIcon, ... } from 'naive-ui'; import { useMessage } from 'naive-ui'; const message = useMessage()`

- 文件：`/data/webUI-java/admin-web/src/views/Users.vue`
- 修改内容：
  - 将`import { NIcon, message, ... } from 'naive-ui'`改为`import { NIcon, ... } from 'naive-ui'; import { useMessage } from 'naive-ui'; const message = useMessage()`

## 预期结果
- admin-web服务能够成功启动
- 页面能够正常加载，不再出现message组件导入错误
- 所有消息提示功能能够正常使用
- 没有任何错误日志