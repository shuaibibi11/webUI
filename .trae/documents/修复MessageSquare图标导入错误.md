# 修复MessageSquare图标导入错误

## 问题分析
1. 错误信息：`SyntaxError: The requested module '/node_modules/.vite/deps/@vicons_ionicons5.js?v=2324e39c' does not provide an export named 'MessageSquare'`
2. 错误类型：图标导入错误
3. 根本原因：@vicons/ionicons5库中没有MessageSquare图标

## 解决方案
将所有使用MessageSquare图标的地方替换为Chatbubble图标，这是@vicons/ionicons5库中存在的类似消息图标。

## 修复步骤
1. 更新App.vue中的导入语句，将MessageSquare替换为Chatbubble
2. 更新App.vue中所有使用MessageSquare图标的地方，替换为Chatbubble
3. 重启admin-web服务验证修复
4. 进行全面测试，确保所有功能正常显示

## 具体修改
- 文件：`/data/webUI-java/admin-web/src/App.vue`
- 修改内容：
  - 将`import { MessageSquare } from '@vicons/ionicons5'`替换为`import { Chatbubble } from '@vicons/ionicons5'`
  - 将所有`h(MessageSquare)`替换为`h(Chatbubble)`

## 预期结果
- admin-web服务能够成功启动
- 页面能够正常加载，不再出现图标导入错误
- 所有图标能够正常显示
- 反馈管理菜单图标显示正常