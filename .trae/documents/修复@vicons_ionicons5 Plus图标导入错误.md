# 修复@vicons/ionicons5 Plus图标导入错误

## 问题分析
1. 错误信息：`SyntaxError: The requested module '/node_modules/.vite/deps/@vicons_ionicons5.js?v=1f40ca87' does not provide an export named 'Plus'`
2. 错误类型：图标导入错误
3. 根本原因：@vicons/ionicons5库中没有Plus图标，只有Add图标
4. 影响范围：Models.vue和Workflows.vue两个组件

## 解决方案
将所有使用Plus图标的地方替换为Add图标，这是@vicons/ionicons5库中存在的类似图标。

## 修复步骤
1. 修复Models.vue中的Plus图标导入和使用
2. 修复Workflows.vue中的Plus图标导入和使用
3. 重启admin-web服务验证修复
4. 执行完整的功能测试、兼容性测试和性能测试

## 具体修改

### 1. 修复Models.vue
- 将第86行的`import { Pencil, Trash, Plus, CheckmarkCircle, CloseCircle } from '@vicons/ionicons5'`改为`import { Pencil, Trash, Add, CheckmarkCircle, CloseCircle } from '@vicons/ionicons5'`
- 将第132行的`const plusIcon = () => h(NIcon, null, { default: () => h(Plus) })`改为`const plusIcon = () => h(NIcon, null, { default: () => h(Add) })`

### 2. 修复Workflows.vue
- 将第99行的`import { Pencil, Trash, Plus, CheckmarkCircle, CloseCircle } from '@vicons/ionicons5'`改为`import { Pencil, Trash, Add, CheckmarkCircle, CloseCircle } from '@vicons/ionicons5'`
- 将第149行的`const plusIcon = () => h(NIcon, null, { default: () => h(Plus) })`改为`const plusIcon = () => h(NIcon, null, { default: () => h(Add) })`

### 3. 重启服务
- 重启admin-web服务
- 验证服务是否正常运行

### 4. 测试验证
- 功能测试：测试所有功能模块
- 兼容性测试：测试不同浏览器和设备
- 性能测试：测试服务响应时间和页面加载速度

## 预期结果
- ✅ 服务成功启动
- ✅ 页面正常加载
- ✅ 不再出现Plus图标导入错误
- ✅ 所有功能模块正常使用
- ✅ 图标显示正常

## 风险评估
- 图标样式可能略有不同
- 可能影响用户体验

## 应对措施
- 选择与原图标功能相似的Add图标
- 确保图标在视觉上符合预期
- 进行全面测试验证

## 执行计划
1. 修改Models.vue文件
2. 修改Workflows.vue文件
3. 重启admin-web服务
4. 执行测试验证
5. 总结修复结果