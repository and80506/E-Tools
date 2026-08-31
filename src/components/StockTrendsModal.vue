<template>
  <el-dialog
    v-model="visible"
    :title="`${stockName} (${stockCode}) - ${trendType === 'mc_revenue' ? '市值与营收趋势' : '市盈率(PE)趋势'}`"
    width="900px"
    destroy-on-close
    @opened="initChart"
    @closed="disposeChart"
  >
    <div v-loading="loading" class="chart-container" ref="chartRef" style="width: 100%; height: 500px;">
      <el-empty v-if="!loading && !hasData" description="暂无历史数据" />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const stockCode = ref('')
const stockName = ref('')
const trendType = ref('pe') // 'pe' | 'mc_revenue'
const loading = ref(false)
const hasData = ref(true)
const chartRef = ref(null)
let chartInstance = null

const open = (code, name, type) => {
  stockCode.value = code
  stockName.value = name
  trendType.value = type
  visible.value = true
}

const disposeChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
}

const fetchData = async () => {
  loading.value = true
  hasData.value = true
  try {
    let data = []
    if (import.meta.env.VITE_APP_ENV === 'ghpages') {
      const res = await fetch(`${import.meta.env.BASE_URL}data/stock_${stockCode.value}.json`)
      if (!res.ok) throw new Error('静态数据未找到')
      const json = await res.json()
      data = json.data || []
    } else {
      const res = await fetch(`/api/stock/fundamentals?code=${stockCode.value}`)
      const json = await res.json()
      if (json.success) {
        data = json.data || []
      } else {
        throw new Error(json.message || '获取数据失败')
      }
    }
    
    if (data.length === 0) {
      hasData.value = false
    }
    return data
  } catch (error) {
    console.error('Fetch fundamentals error:', error)
    ElMessage.error(error.message || '数据获取失败')
    hasData.value = false
    return []
  } finally {
    loading.value = false
  }
}

const initChart = async () => {
  if (!chartRef.value) return
  const data = await fetchData()
  if (!hasData.value || data.length === 0) return

  await nextTick()
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const dates = data.map(item => item.trade_date)
  
  let option = {}

  if (trendType.value === 'pe') {
    const peData = data.map(item => item.pe_ttm > 1000 ? 1000 : (item.pe_ttm < -100 ? -100 : item.pe_ttm))
    
    // 计算均值和标准差
    const validPe = peData.filter(v => v > 0 && v < 1000)
    let sum = 0
    validPe.forEach(v => sum += v)
    const mean = validPe.length > 0 ? sum / validPe.length : 0
    
    let varianceSum = 0
    validPe.forEach(v => varianceSum += Math.pow(v - mean, 2))
    const stdDev = validPe.length > 0 ? Math.sqrt(varianceSum / validPe.length) : 0
    
    const highLine = (mean + stdDev).toFixed(2)
    const meanLine = mean.toFixed(2)
    const lowLine = (mean - stdDev).toFixed(2)

    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['PE(TTM)', '均值', '低估线', '高估线'], bottom: 0 },
      grid: { left: '3%', right: '6%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value', name: '市盈率 (TTM)' },
      series: [
        {
          name: 'PE(TTM)',
          type: 'line',
          data: peData,
          smooth: true,
          itemStyle: { color: '#e6a23c' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(230,162,60,0.5)' },
              { offset: 1, color: 'rgba(230,162,60,0.1)' }
            ])
          },
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
      ],
      dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', start: 0, end: 100, bottom: 30 }]
    }
  } else {
    // 市值与营收
    const mvData = data.map(item => (item.total_mv / 10000).toFixed(2)) // 亿
    const revData = data.map(item => (item.revenue / 10000).toFixed(2)) // 亿
    
    option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['总市值 (亿元)', '营收 (亿元)'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dates },
      yAxis: [
        { type: 'value', name: '总市值', position: 'left' },
        { type: 'value', name: '营收', position: 'right' }
      ],
      series: [
        {
          name: '总市值 (亿元)',
          type: 'line',
          yAxisIndex: 0,
          data: mvData,
          smooth: true,
          itemStyle: { color: '#f56c6c' }
        },
        {
          name: '营收 (亿元)',
          type: 'bar',
          yAxisIndex: 1,
          data: revData,
          itemStyle: { color: '#409eff', opacity: 0.6 }
        }
      ],
      dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', start: 0, end: 100 }]
    }
  }

  chartInstance.setOption(option)
}

defineExpose({
  open
})
</script>

<style scoped>
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
