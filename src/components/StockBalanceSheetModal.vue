<template>
  <el-dialog v-model="visible" width="80%" destroy-on-close @opened="initChart">
    <template #header>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-right: 20px;">
        <span style="font-size: 18px; font-weight: bold; color: #303133;">
          {{ title }}
        </span>
        <div v-if="!error && allData.length > 0" style="display: flex; gap: 10px; font-size: 14px;">
          <el-button link type="primary" :disabled="currentIndex === 0" @click="changePeriod(0)">当期数据</el-button>
          <el-button link type="primary" :disabled="currentIndex >= allData.length - 1" @click="changePeriod(currentIndex + 1)">上一期</el-button>
          <el-button link type="primary" :disabled="currentIndex === 0" @click="changePeriod(currentIndex - 1)">下一期</el-button>
        </div>
      </div>
    </template>

    <div v-loading="loading" style="min-height: 400px; display: flex; flex-direction: column;">
      
      <!-- 错误信息显示 -->
      <div v-if="error" class="error-msg">
        <el-alert :title="error" type="error" show-icon :closable="false" />
      </div>

      <!-- 图表容器 -->
      <div v-show="!error" ref="chartRef" style="width: 100%; height: 600px;"></div>

    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

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

const title = computed(() => {
  if (!reportDate.value) return `${props.stockName}资产负债表`
  
  let reportType = ''
  if (reportTypeStr.value) {
    reportType = ` (${reportTypeStr.value})`
  }
  
  return `${props.stockName}资产负债表 - ${reportDate.value}${reportType}`
})

const chartRef = ref(null)
const loading = ref(false)
const error = ref('')
const reportDate = ref('')
const reportTypeStr = ref('')
const allData = ref([])
const currentIndex = ref(0)
let chartInstance = null

const isDemo = import.meta.env && import.meta.env.VITE_APP_ENV === 'ghpages'

watch(visible, async (newVal) => {
  if (newVal) {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    reportDate.value = ''
    reportTypeStr.value = ''
    allData.value = []
    currentIndex.value = 0
    await loadData()
  }
})

const getApiUrl = (code) => {
  if (isDemo) {
    return `${import.meta.env.BASE_URL}data/bs_${code}.json`
  } else {
    return `/api/stock/balance_sheet?code=${code}`
  }
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
      throw new Error(result.message || '获取资产负债表数据失败')
    }
    
    const dataList = Array.isArray(result.data) ? result.data : [result.data]
    if (dataList.length === 0) {
      throw new Error('没有数据')
    }
    
    allData.value = dataList
    currentIndex.value = 0
    updateView()
    
  } catch (err) {
    console.error('Failed to load balance sheet data:', err)
    error.value = `数据获取失败: ${err.message}`
  } finally {
    loading.value = false
  }
}

const changePeriod = (index) => {
  if (index >= 0 && index < allData.value.length) {
    currentIndex.value = index
    updateView()
  }
}

const updateView = () => {
  if (allData.value.length === 0) return
  
  const currentData = allData.value[currentIndex.value]
  reportDate.value = currentData.date
  reportTypeStr.value = currentData.report_type || ''
  
  if (chartRef.value) {
    renderChart(currentData)
  } else {
    nextTick(() => {
      renderChart(currentData)
    })
  }
}

const renderChart = (data) => {
  if (!chartRef.value) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 严格按照原图示例排列各个项目
  // 左侧（资产类 - 蓝色）
  const assetItems = [
    { name: '现金', value: data.cash },
    { name: '应收款', value: data.receivables },
    { name: '预付款', value: data.prepayments },
    { name: '存货', value: data.inventory },
    { name: '其它\n流动', value: data.other_current_assets },
    { name: '长期\n投资', value: data.long_term_investments },
    { name: '固定\n资产', value: data.fixed_assets },
    { name: '无形\n&\n商誉', value: data.intangible_and_goodwill },
    { name: '其它\n固定', value: data.other_fixed_assets }
  ]
  
  // 右侧（负债及权益类 - 红色）
  const liabItems = [
    { name: '短期\n借款', value: data.short_term_borrowings },
    { name: '应付款', value: data.payables },
    { name: '预收款', value: data.advance_receipts },
    { name: '薪酬\n&\n税', value: data.compensation_and_tax },
    { name: '其它\n流动', value: data.other_current_liabilities },
    { name: '长期\n借款', value: data.long_term_borrowings },
    { name: '其它\n非流动', value: data.other_non_current_liabilities }
  ]

  const allItems = [...assetItems, ...liabItems]
  
  const xAxisData = allItems.map(item => item.name)
  const seriesData = allItems.map((item, index) => {
    // 资产使用蓝色，负债使用红色
    const color = index < assetItems.length ? '#3ba1df' : '#e40001'
    return {
      value: item.value.toFixed(2),
      itemStyle: { color: color }
    }
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function (params) {
        const item = params[0]
        return `${item.name.replace(/\n/g, '')} : ${item.value} 亿元`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        interval: 0,
        // 处理换行显示
        formatter: function (value) {
          return value;
        },
        color: '#666'
      },
      axisTick: {
        alignWithLabel: true
      },
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '单位: 亿元',
      nameTextStyle: {
        color: '#999',
        padding: [0, 0, 0, -30]
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      },
      axisLabel: {
        color: '#999',
        formatter: '{value}'
      }
    },
    series: [
      {
        type: 'bar',
        barWidth: '40%',
        data: seriesData,
        label: {
          show: true,
          position: 'top',
          color: '#333',
          formatter: '{c}'
        }
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

// 监听窗口大小变化
window.addEventListener('resize', () => {
  if (chartInstance) {
    chartInstance.resize()
  }
})
</script>

<style scoped>
.error-msg {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
}
</style>
