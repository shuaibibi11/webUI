# 修复admin-web页面启动错误

## 问题分析
1. 错误信息：`net::ERR_ABORTED http://localhost:13082/src/App.vue`
2. 详细错误：`[vue/compiler-sfc] Unexpected token, expected "</>/<=/>=" (32:33)`
3. 错误位置：App.vue文件第82行，JSX语法 `icon: () => <NIcon><FileText /></NIcon>`
4. 根本原因：Vue的script setup默认不支持JSX语法，尽管已安装vueJsx插件

## 解决方案
将App.vue中所有的JSX语法替换为Vue 3的h函数语法，这是更符合Vue 3推荐的做法，不需要修改script标签的lang属性。

## 修复步骤
1. 在App.vue的script部分导入h函数
2. 将所有JSX语法替换为h函数调用
3. 重启admin-web服务验证修复

## 具体修改
- 文件：`/data/webUI-java/admin-web/src/App.vue`
- 修改内容：
  - 在import语句中添加 `h` 导入
  - 将所有 `icon: () => <NIcon><IconName /></NIcon>` 替换为 `icon: () => h(NIcon, null, { default: () => h(IconName) })`

## 预期结果
- admin-web服务能够成功启动
- 页面能够正常加载，不再出现ERR_ABORTED错误
- 所有图标能够正常显示