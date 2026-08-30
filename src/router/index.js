import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import StockWatchlist from '../components/StockWatchlist.vue'
import CompoundCalculator from '../components/CompoundCalculator.vue'
import ValuationEstimator from '../components/ValuationEstimator.vue'
import ThreeStageDCF from '../components/ThreeStageDCF.vue'
import DailyReview from '../components/DailyReview.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/watchlist',
    name: 'Watchlist',
    component: StockWatchlist
  },
  {
    path: '/dailyReview',
    name: 'DailyReview',
    component: DailyReview
  },
  {
    path: '/calculator',
    name: 'Calculator',
    component: CompoundCalculator
  },
  {
    path: '/valuation',
    name: 'Valuation',
    component: ValuationEstimator
  },
  {
    path: '/dcf',
    name: 'ThreeStageDCF',
    component: ThreeStageDCF
  },
  {
    path: '/market',
    name: 'MarketTrend',
    component: () => import('../components/MarketTrend.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
