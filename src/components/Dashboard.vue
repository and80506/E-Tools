<template>
  <div class="dashboard-home">
    <div class="welcome-banner glass-card">
      <div class="banner-text">
        <h1>欢迎回来，主理人</h1>
        <p>合理配置您的投资组合，控制风险，让时间为您赚取复利回报。</p>
      </div>
    </div>
    <!-- 工具选择卡片网格 -->
    <div class="tools-grid">
      <div class="glass-card tool-preview-card" @click="goTo('/watchlist')">
        <h3>股票自选列表</h3>
        <p>支持自选股的增删改查。提供模拟实时盘中价格波动。</p>
      </div>
      <div class="glass-card tool-preview-card" @click="goTo('/calculator')">
        <h3>复利计算器</h3>
        <p>算出资产的未来复利成长轨迹，并生成年度对账单。</p>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter()
    
    const goTo = (path) => {
      router.push(path)
    }
    
    return {
      goTo
    }
  }
}
</script>
