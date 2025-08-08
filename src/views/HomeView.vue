<template>
  <div class="content-card">
    <div class="welcome-container">
      <el-empty description="欢迎使用物理实验模拟器">
        <p class="welcome-text">请从左侧菜单中选择一个实验开始探索。</p>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
// No script needed for this simple view
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  /* 减去 .content-card 的内边距 */
  min-height: calc(100vh - var(--header-height) - 48px - 48px); 
}

.welcome-text {
  color: #909399;
  font-size: 16px;
}
</style>