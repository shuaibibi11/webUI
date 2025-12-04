## 修复计划

### 1. 重启服务

* **user-api**：重启在11031端口，确保登录功能正常

* **admin-api**：确保在11025端口正常运行

* **前端服务**：确保admin-web(13085)和user-web(13089)正常运行

### 2. 修复前端创建会话bug

* 问题：`conversations.value.unshift is not a function`

* 原因：`conversations.value`不是数组

* 解决方案：检查前端代码中conversations的定义和初始化，确保它是数组类型

* 文件：`user-web/src/views/Chat.vue`或相关组件

### 3. 迁移到MySQL数据库

* **检查MySQL可用性**：验证MySQL服务是否运行，端口3306是否可用

* **更新配置**：

  * 修改`admin-api/src/main/resources/application.yml`

  * 修改`user-api/src/main/resources/application.yml`

  * 将数据源从H2改为MySQL

  * 配置正确的MySQL连接信息

* **数据库迁移**：使用JPA自动创建表结构

* **数据导入**：从H2导出数据并导入到MySQL

### 4. 验证功能

* 测试登录功能

* 测试创建会话功能

* 测试对话功能

* 验证数据迁移成功

### 5. 配置调整

* 确保所有服务使用统一的MySQL数据库

* 更新CORS配置

* 优化代理配置

## 预期结果

* 所有服务正常运行

* 登录功能恢复正常

* 创建会话功能修复

* 成功迁移到MySQL数据库

* 数据完整保留

* 系统稳定运行

