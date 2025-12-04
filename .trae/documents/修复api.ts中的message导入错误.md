# 修复api.ts中的message导入错误

## 问题分析
1. 错误信息：`SyntaxError: The requested module '/node_modules/.vite/deps/naive-ui.js?v=1f40ca87' does not provide an export named 'message'`
2. 错误类型：模块导入错误
3. 根本原因：在`/data/webUI-java/admin-web/src/utils/api.ts`文件中使用了`import { message } from 'naive-ui'`
4. 影响范围：整个管理后台系统，因为所有API请求都会经过这个文件

## 解决方案
修改api.ts文件，移除对naive-ui message组件的依赖，将错误处理改为由调用者处理。

## 修复步骤
1. 移除api.ts中的`import { message } from 'naive-ui'`
2. 修改`handleError`函数，不再使用message组件显示错误
3. 将错误信息直接抛出，由调用者处理
4. 重启admin-web服务验证修复
5. 测试所有功能模块

## 具体修改

### 1. 移除message导入
- 删除第1行：`import { message } from 'naive-ui'`

### 2. 修改handleError函数
- 将第86行的`message.error(errorMessage)`移除
- 直接抛出错误，由调用者处理

### 3. 重启服务
- 重启admin-web服务
- 测试服务是否正常运行

## 预期结果
- admin-web服务能够成功启动
- 页面能够正常加载
- 不再出现message导入错误
- 所有功能模块能够正常使用
- 错误信息由调用者处理，不会影响系统运行

## 风险评估
- 调用者需要自己处理错误
- 可能会导致错误信息显示方式不一致

## 应对措施
- 确保所有调用API的组件都有错误处理机制
- 可以在组件中使用useMessage()函数处理错误

## 执行计划
1. 修改api.ts文件
2. 重启服务
3. 测试功能
4. 验证修复结果