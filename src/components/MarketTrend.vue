<template>
  <div class="market-trend-container">
    <div class="filter-bar">
      <el-radio-group v-model="currentIndex" @change="fetchData">
        <el-radio-button label="000300">沪深300</el-radio-button>
        <el-radio-button label="000905">中证500</el-radio-button>
        <el-radio-button label="000852">中证1000</el-radio-button>
        <el-radio-button v-if="customIndexCode && !['000300', '000905', '000852'].includes(customIndexCode)"
          :label="customIndexCode">{{ customIndexName }}</el-radio-button>
      </el-radio-group>
    </div>

    <el-card shadow="never" style="margin-bottom: 20px;">
      <template #header>
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>{{ currentIndexName }} 市值与业绩增长趋势 (真实数据)</span>
            <el-tooltip effect="dark" placement="right">
              <template #content>
                <div style="max-width: 320px; line-height: 1.6; font-size: 13px;">
                  本页面所有财务数据均源自理杏仁（Lixinger）开放平台。<br><br>
                  由于官方接口未直接提供指数的绝对总营收，系统通过拉取真实的“市销率 (PS)”和“总市值 (MC)”，利用基本财务公式（总营收 = 总市值 / 市销率）精准反演出 100%
                  真实的指数总营收绝对值，确保全过程零估算、零模拟数据。
                </div>
              </template>
              <el-icon color="#909399" style="cursor: pointer; font-size: 16px;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
        </div>
      </template>
      <div v-loading="loading" class="chart-wrapper">
        <div ref="chart1Ref" style="width: 100%; height: 400px;"></div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ currentIndexName }} 市盈率趋势</span>
        </div>
      </template>
      <div v-loading="loading" class="chart-wrapper">
        <div ref="chart2Ref" style="width: 100%; height: 400px;"></div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

export default {
  name: 'MarketTrend',
  components: {
    InfoFilled
  },
  setup() {
    const route = useRoute()
    const loading = ref(true)
    const currentIndex = ref('000300')
    const customIndexCode = ref(null)
    const customIndexName = ref('')

    const currentIndexName = computed(() => {
      if (currentIndex.value === customIndexCode.value && customIndexCode.value) {
        return customIndexName.value
      }
      const map = {
        '000300': '沪深300',
        '000905': '中证500',
        '000852': '中证1000'
      }
      return map[currentIndex.value] || '大盘'
    })

    const chart1Ref = ref(null)
    const chart2Ref = ref(null)

    let chart1 = null
    let chart2 = null

    const initChart1 = (data) => {
      if (!chart1Ref.value) return
      chart1 = echarts.init(chart1Ref.value)

      const dates = data.map(item => {
        const d = item.trade_date
        return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
      })
      // Lixinger 'mc' and 'revenue' are absolute values in Yuan. Divide by 100,000,000 to get Yi (亿)
      const marketCaps = data.map(item => (item.total_mv || 0) / 100000000)
      const revenues = data.map(item => (item.revenue || 0) / 100000000)

      const option = {
        title: {
          text: `${currentIndexName.value} 市值与业绩增长趋势`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        legend: {
          data: ['总营收', '总市值'],
          bottom: 0
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisTick: { alignWithLabel: true }
        },
        yAxis: [
          {
            type: 'value',
            name: '总营收(亿)',
            position: 'left',
            axisLine: { show: true },
            splitLine: { show: true, lineStyle: { type: 'dashed' } }
          },
          {
            type: 'value',
            name: '总市值(亿)',
            position: 'right',
            alignTicks: true,
            axisLine: { show: true },
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '总营收',
            type: 'bar',
            data: revenues,
            yAxisIndex: 0,
            itemStyle: { color: '#5b9bd5' }
          },
          {
            name: '总市值',
            type: 'line',
            data: marketCaps,
            yAxisIndex: 1,
            itemStyle: { color: '#ed7d31' },
            symbol: 'circle',
            symbolSize: 4
          }
        ]
      }
      chart1.setOption(option)
    }


    const initChart2 = (data) => {
      if (!chart2Ref.value) return
      chart2 = echarts.init(chart2Ref.value)

      const dates = data.map(item => {
        const d = item.trade_date
        return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
      })
      const peData = data.map(item => parseFloat(item.pe_ttm) || parseFloat(item.pe) || 0)

      // Calculate mean, high (e.g. mean + 1 std), low (e.g. mean - 1 std)
      const validPe = peData.filter(v => v > 0)
      let sum = 0;
      validPe.forEach(v => sum += v);
      const mean = sum / validPe.length;

      let varianceSum = 0;
      validPe.forEach(v => varianceSum += Math.pow(v - mean, 2));
      const stdDev = Math.sqrt(varianceSum / validPe.length);

      const highLine = (mean + stdDev).toFixed(2);
      const meanLine = mean.toFixed(2);
      const lowLine = (mean - stdDev).toFixed(2);

      const option = {
        title: {
          text: `${currentIndexName.value} 市盈率趋势`,
          subtext: '近八年数据',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['市盈率', '均值', '低估线', '高估线'],
          bottom: 0
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: dates
        },
        yAxis: {
          type: 'value',
          min: 'dataMin'
        },
        series: [
          {
            name: '市盈率',
            type: 'line',
            data: peData,
            itemStyle: { color: '#5b9bd5' },
            symbol: 'none',
            markLine: {
              symbol: 'none',
              data: [
                {
                  yAxis: meanLine,
                  name: '均值',
                  lineStyle: { color: '#f1c40f', type: 'dashed' },
                  label: { formatter: '{c}', position: 'end' }
                },
                {
                  yAxis: highLine,
                  name: '高估线',
                  lineStyle: { color: '#c0392b', type: 'dashed' },
                  label: { formatter: '{c}', position: 'end' }
                },
                {
                  yAxis: lowLine,
                  name: '低估线',
                  lineStyle: { color: '#27ae60', type: 'dashed' },
                  label: { formatter: '{c}', position: 'end' }
                }
              ]
            }
          },
          {
            name: '均值',
            type: 'line',
            data: [],
            itemStyle: { color: '#f1c40f' }
          },
          {
            name: '低估线',
            type: 'line',
            data: [],
            itemStyle: { color: '#27ae60' }
          },
          {
            name: '高估线',
            type: 'line',
            data: [],
            itemStyle: { color: '#c0392b' }
          }
        ]
      }
      chart2.setOption(option)
    }

    const fetchData = async () => {
      loading.value = true
      try {
        const fetchUrl = import.meta.env.VITE_APP_ENV === 'ghpages'
          ? `${import.meta.env.BASE_URL}data/market_${currentIndex.value}.json`
          : `/api/market/index?code=${currentIndex.value}`

        const response = await fetch(fetchUrl)
        const result = await response.json()

        if (result.success) {
          nextTick(() => {
            initChart1(result.data)
            initChart2(result.data)
          })
        } else {
          ElMessage.error(result.message || '获取大盘数据失败，请检查 .env 是否配置了 LIXINGER_TOKEN')
        }
      } catch (err) {
        ElMessage.error('网络请求失败: ' + err.message)
      } finally {
        loading.value = false
      }
    }

    const handleResize = () => {
      if (chart1) chart1.resize()
      if (chart2) chart2.resize()
    }

    // Initialize query params
    onMounted(() => {
      if (route.query.indexCode) {
        customIndexCode.value = route.query.indexCode
        customIndexName.value = route.query.indexName || route.query.indexCode
        currentIndex.value = route.query.indexCode
      }

      fetchData()
      window.addEventListener('resize', handleResize)
    })

    // Watch query to update if navigating within the same component
    watch(() => route.query.indexCode, (newCode) => {
      if (newCode) {
        customIndexCode.value = newCode
        customIndexName.value = route.query.indexName || newCode
        currentIndex.value = newCode
        fetchData()
      }
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      if (chart1) chart1.dispose()
      if (chart2) chart2.dispose()
    })

    return {
      loading,
      currentIndex,
      currentIndexName,
      customIndexCode,
      customIndexName,
      fetchData,
      chart1Ref,
      chart2Ref
    }
  }
}
</script>

<style scoped>
.market-trend-container {
  padding: 0;
}

.filter-bar {
  margin-bottom: 20px;
  text-align: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  position: relative;
}
</style>
