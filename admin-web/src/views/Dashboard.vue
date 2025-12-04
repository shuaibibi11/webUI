<template>
  <div class="dashboard-container">
    <n-card title="系统概览" class="stats-card">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">100</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">500</div>
          <div class="stat-label">总对话数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">2000</div>
          <div class="stat-label">总消息数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">5</div>
          <div class="stat-label">待处理反馈</div>
        </div>
      </div>
    </n-card>
    
    <div class="charts-section">
      <n-card title="用户增长趋势" class="chart-card">
        <!-- 这里可以添加图表组件 -->
        <div class="chart-placeholder">用户增长趋势图表</div>
      </n-card>
      <n-card title="对话活跃度" class="chart-card">
        <!-- 这里可以添加图表组件 -->
        <div class="chart-placeholder">对话活跃度图表</div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
// 控制台页面逻辑
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-card {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 24px;
  background-color: #F5F7FA;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #1677FF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 24px;
}

.chart-card {
  height: 300px;
}

.chart-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #F5F7FA;
  border-radius: 8px;
  color: #909399;
  font-size: 16px;
}
</style>