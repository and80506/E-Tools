<template>
  <el-dialog v-model="visible" width="80%" destroy-on-close @opened="initChart">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-right: 20px;">
        <div style="display: flex; align-items: center; gap: 5px;">
          <span style="font-size: 18px; font-weight: bold; color: #303133;">
            <span style="color: #409EFF; margin-right: 4px;">{{ stockName }}</span>净利润与主业现金流净额趋势
          </span>
          <el-tooltip effect="dark" placement="right">
            <template #content>
              <div style="line-height: 1.6; color: #ffffff; max-width: 380px;">
                <strong style="color: #409EFF">口径说明：</strong><br/>
                本图表数据均采用 <strong>TTM（滚动十二个月）</strong> 口径进行平滑处理，以消除财报带来的季节性波动。<br/>
                <br/>
                <strong style="color: #409EFF">指标解读：</strong><br/>
                <strong>净利润(TTM)：</strong> 最近 12 个月归母净利润的总和。<br/>
                <strong>主业现金流净额(TTM)：</strong> 最近 12 个月经营活动产生的现金流量净额总和。<br/>
                <em>注：健康的利润结构，其经营现金流净额应当长期大于或等于净利润（即“含金量”高）。</em>
              </div>
            </template>
            <el-icon style="cursor: pointer; color: #909399; font-size: 16px;"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>
    </template>

    <div v-loading="loading" style="min-height: 400px; display: flex; flex-direction: column;">
      
      <!-- 错误信息显示 -->
      <div v-if="error" style="color: #F56C6C; text-align: center; padding: 20px;">
        <el-icon style="margin-right: 8px;"><Warning /></el-icon>
        {{ error }}
      </div>
      
      <!-- ECharts 容器 -->
      <div v-show="!error" ref="chartRef" style="flex: 1; min-height: 500px; width: 100%;"></div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { Warning, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  stockCode: {
    type: String,
    required: true
  },
  stockName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const chartRef = ref(null)
const loading = ref(false)
const error = ref('')
let chartInstance = null

const isDemo = import.meta.env && import.meta.env.VITE_APP_ENV === 'ghpages'

watch(visible, async (newVal) => {
  if (newVal) {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    await loadData()
  }
})

// 降级使用静态 JSON 还是请求动态后端 API
const getApiUrl = (code) => {
  if (isDemo) {
    return `${import.meta.env.BASE_URL}data/rc_${code}.json`
  }
  return `/api/stock/revenue_cashflow?code=${code}`
}

const loadData = async () => {
  if (!props.stockCode) return
  loading.value = true
  error.value = ''
  
  try {
    const url = getApiUrl(props.stockCode)
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`)
    }
    const result = await res.json()
    if (!result.success) {
      throw new Error(result.message || '获取营收/现金流数据失败')
    }
    
    const dataList = result.data
    if (!dataList || dataList.length === 0) {
      throw new Error('没有数据')
    }
    
    if (chartRef.value) {
      renderChart(dataList)
    } else {
      nextTick(() => {
        renderChart(dataList)
      })
    }
  } catch (err) {
    console.error('Failed to load revenue and cashflow data:', err)
    error.value = `数据获取失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

const renderChart = (dataList) => {
  if (!chartRef.value) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const xData = dataList.map(item => {
    // 例如 2021-12-31 可以简写为 2021年年报，或者直接取年份
    const d = new Date(item.date)
    return `${d.getFullYear()}年`
  })
  
  const netProfitData = dataList.map(item => item.net_profit)
  const operateCashflowData = dataList.map(item => item.operate_cashflow)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function (params) {
        let res = `${dataList[params[0].dataIndex].date}<br/>`
        params.forEach(p => {
          res += `${p.marker} ${p.seriesName}: ${p.value ? p.value.toFixed(2) : '-'} 亿元<br/>`
        })
        return res
      }
    },
    legend: {
      data: ['净利润', '现金流净额'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLabel: {
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '金额 (亿元)',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '净利润',
        type: 'line',
        smooth: true,
        data: netProfitData,
        itemStyle: {
          color: '#3ba1df'
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '现金流净额',
        type: 'line',
        smooth: true,
        data: operateCashflowData,
        itemStyle: {
          color: '#e40001'
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }

  chartInstance.setOption(option)
}

const initChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听窗口大小改变调整图表大小
onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
/* 可按需添加样式 */
</style>
