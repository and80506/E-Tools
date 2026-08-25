<template>
  <el-config-provider :locale="locale">
    <el-container class="app-layout">
      <el-aside width="240px" class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">
            <span class="logo-icon">📊</span>
            <span class="logo-text">Value-Invest-Sys</span>
          </h1>
        </div>

        <el-menu :default-active="$route.path" class="el-menu-vertical" background-color="transparent"
          text-color="#cba6f7" active-text-color="#fff" router>
          <el-menu-item index="/dashboard">
            <el-icon>
              <DataBoard />
            </el-icon>
            <span>控制台首页</span>
          </el-menu-item>
          <el-menu-item index="/watchlist">
            <el-icon>
              <List />
            </el-icon>
            <span>自选列表</span>
          </el-menu-item>
          <el-menu-item index="/dailyReview">
            <el-icon>
              <Notebook />
            </el-icon>
            <span>复盘笔记</span>
          </el-menu-item>
          <el-menu-item index="/calculator">
            <el-icon>
              <DataBoard />
            </el-icon>
            <span>复利计算器</span>
          </el-menu-item>
          <el-menu-item index="/valuation">
            <el-icon>
              <TrendCharts />
            </el-icon>
            <span>公司估值</span>
          </el-menu-item>
          <el-menu-item index="/dcf">
            <el-icon>
              <TrendCharts />
            </el-icon>
            <span>三阶段 DCF</span>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-footer">
          <div class="user-profile">
            <el-avatar size="small">主</el-avatar>
            <div class="user-meta" style="margin-left: 10px;">
              <span class="user-name" style="font-weight: 600;">主理人</span>
              <span class="user-status" style="font-size: 12px; opacity: 0.7;">高级投资人</span>
            </div>
          </div>
        </div>
      </el-aside>

      <el-container>
        <el-header class="top-header" height="60px">
          <div class="header-content">
            <h2 class="page-title">
              {{ viewTitle }}
              <el-tag v-if="isDemo" type="warning" effect="dark" size="small" style="margin-left: 10px; vertical-align: middle;">演示模式</el-tag>
            </h2>
            <div v-if="!isDemo" class="server-status"
              :class="{ 'status-ok': serverStatus === 'online', 'status-error': serverStatus !== 'online' }">
              <span class="status-dot"></span>
              {{ serverStatus === 'online' ? '局域网数据服务 (SQLite) 在线' : '局域网服务连接异常' }}
            </div>
            <div v-else class="server-status status-ok" style="color: #e6a23c;">
              <span class="status-dot" style="background-color: #e6a23c; box-shadow: 0 0 8px #e6a23c;"></span>
              当前为体验演示环境，操作仅产生模拟数据，刷新页面后将重置
            </div>
          </div>
        </el-header>

        <el-main class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { DataBoard, List, Notebook, TrendCharts } from '@element-plus/icons-vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { stocksApi } from './api/stocks'

export default {
  name: 'App',
  components: {
    DataBoard, List, Notebook, TrendCharts,
    ElConfigProvider
  },
  setup() {
    const route = useRoute()
    const serverStatus = ref('connecting')
    const currentTime = ref('')
    const isDemo = import.meta.env && import.meta.env.VITE_DEMO_MODE === 'true';

    const viewTitle = computed(() => {
      const path = route.path
      if (path === '/dashboard' || path === '/') return '控制台首页 / Dashboard'
      if (path === '/watchlist') return '自选管理 / Watchlist'
      if (path === '/calculator') return '复利财富成长模拟 / Calculator'
      if (path === '/valuation') return '公司估值反推 (段永平法) / Valuation'
      if (path === '/dcf') return '三阶段 DCF 模型估值 / DCF Valuation'
      if (path === '/dailyReview') return '复盘笔记 / Daily Review'
      return '投资工具箱'
    })

    const updateTime = () => {
      const now = new Date()
      currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
    }

    let timeInterval = null

    const checkStatus = async () => {
      try {
        const res = await stocksApi.checkStatus()
        serverStatus.value = res.success ? 'online' : 'error'
      } catch (e) {
        serverStatus.value = 'error'
      }
    }

    onMounted(() => {
      updateTime()
      timeInterval = setInterval(updateTime, 1000)
      checkStatus()
      setInterval(checkStatus, 10000)
    })

    onUnmounted(() => {
      if (timeInterval) clearInterval(timeInterval)
    })

    return {
      locale: zhCn,
      viewTitle,
      currentTime,
      serverStatus,
      isDemo
    }
  }
}
</script>

<style>
/* 整个应用的基本布局 */
.app-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none !important;
    /* 简易移动端隐藏，实际中可增加移动端侧栏 */
  }
}

/* 侧边栏 */
.sidebar {
  height: 100vh;
  position: sticky;
  top: 0;
  border-radius: 0 20px 20px 0;
  border-left: none;
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 40px;
}

.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.brand-info h2 {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  background: linear-gradient(90deg, #fff, var(--text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-info span {
  font-size: 11px;
  color: var(--text-muted);
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-grow: 1;
}

.nav-item {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  padding: 14px 18px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  transition: var(--transition-smooth);
}

.nav-item svg {
  transition: var(--transition-smooth);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(0, 242, 254, 0.06);
  border-color: rgba(0, 242, 254, 0.15);
  color: var(--accent-cyan);
}

.nav-item.active svg {
  color: var(--accent-cyan);
  filter: drop-shadow(0 0 4px var(--accent-cyan));
}

.sidebar-footer {
  margin-top: auto;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-glass);
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--accent-cyan);
  font-size: 14px;
  border: 1px solid var(--border-glass);
}

.user-meta {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.user-status {
  font-size: 11px;
  color: var(--text-muted);
}

/* 主展示区 */
.main-content {
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 24px;
  min-height: 100vh;
  overflow-y: auto;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.view-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.market-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--stock-down);
  /* 绿色代表连线良好 */
  box-shadow: 0 0 8px var(--stock-down);
  animation: pulse-cyan 2s infinite;
}

.time-stamp {
  font-family: monospace;
  font-weight: 600;
}

.content-body {
  flex-grow: 1;
}

/* Dashboard 欢迎页 */
.dashboard-home {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-banner {
  padding: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(18, 24, 36, 0.9), rgba(10, 14, 23, 0.9)), url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="%23ffffff" stroke-width="0.5" fill="none" opacity="0.05"/></svg>');
}

.banner-text h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.banner-text p {
  color: var(--text-secondary);
  font-size: 14px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.tool-preview-card {
  padding: 28px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.tool-preview-card.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.tool-preview-card.disabled:hover {
  border-color: var(--border-glass);
  box-shadow: none;
}

.tool-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.tool-icon.watchlist {
  background: rgba(0, 242, 254, 0.1);
  border: 1px solid rgba(0, 242, 254, 0.2);
  color: var(--accent-cyan);
}

.tool-icon.calculator {
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.2);
  color: var(--accent-blue);
}

.tool-icon.valuation {
  background: rgba(127, 0, 255, 0.1);
  border: 1px solid rgba(127, 0, 255, 0.2);
  color: #a855f7;
}

.tool-icon.placeholder {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
}

.tool-preview-card h3 {
  font-size: 18px;
  font-weight: 600;
}

.tool-preview-card p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  flex-grow: 1;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
