# 修复admin-web页面依赖缺失问题

## 问题分析
1. 错误信息：`Failed to resolve import "@vicons/ionicons5" from "src/views/Feedbacks.vue". Does the file exist?`
2. 错误类型：依赖解析错误
3. 影响范围：所有使用@vicons/ionicons5图标的页面（包括Logs.vue、Feedbacks.vue、Users.vue等）
4. 根本原因：admin-web项目的package.json中没有安装@vicons/ionicons5依赖

## 解决方案
安装缺失的@vicons/ionicons5依赖包，然后重启admin-web服务验证修复。

## 修复步骤
1. 在admin-web目录下安装@vicons/ionicons5依赖
2. 重启admin-web服务
3. 验证页面是否能够正常加载

## 具体修改
- 命令：`npm install @vicons/ionicons5`
- 位置：/data/webUI-java/admin-web目录

## 预期结果
- admin-web服务能够成功启动
- 页面能够正常加载，不再出现依赖解析错误
- 所有图标能够正常显示