<template>
  <el-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="净资产收益率(ROE)分析"
    width="900px" destroy-on-close :close-on-click-modal="false" @open="handleOpen" class="custom-modal">
    <template #header>
      <div class="modal-header">
        <span class="stock-name">{{ stockName }}</span>
        <div style="display: flex; align-items: center; gap: 5px;">
          <span class="modal-title">净资产收益率趋势</span>
          <el-tooltip effect="dark" placement="right">
            <template #content>
              <div style="line-height: 1.6; color: #ffffff; max-width: 380px;">
                <strong style="color: #409EFF">口径说明：</strong><br/>
                本系统采用 <strong>ROE (TTM) 滚动年化口径</strong> 进行平滑处理，以消除财报季节性波动，使任意季度的盈利能力都能在同一基准线上对比。<br/>
                <br/>
                <strong style="color: #409EFF">与常规平台数据差异：</strong><br/>
                东方财富等网页默认展示“当期累计ROE”，一季报等非年报节点数值通常较低。本系统中：<br/>
                ROE (TTM) = 归母净利润(TTM) / 归属于母公司股东权益 * 100%<br/>
                <em>注：归母净利润(TTM) 即最近 12 个月（滚动4个季度）的累计净利润。</em>
              </div>
            </template>
            <el-icon style="cursor: pointer; color: #909399; font-size: 16px;"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>
    </template>
    
    <div v-loading="loading" class="chart-container">
      <div v-if="!loading && !hasData" class="no-data">
        <el-empty description="暂无ROE数据" />
      </div>
      <div v-show="hasData" ref="chartRef" class="echarts-dom"></div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean,
  stockCode: String,
  stockName: String
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const hasData = ref(false)
const chartRef = ref(null)
const chartInstance = shallowRef(null)

const loadData = async () => {
  if (!props.stockCode) return

  loading.value = true
  hasData.value = false

  try {
    let response;
    // Check if we are in static gh-pages environment
    if (import.meta.env.VITE_APP_ENV === 'ghpages') {
      const res = await fetch(`/data/roe_${props.stockCode}.json`)
      if (!res.ok) {
        throw new Error('Static data not found for ROE')
      }
      response = await res.json()
    } else {
      const res = await fetch(`/api/stock/roe?code=${props.stockCode}`)
      response = await res.json()
    }

    if (response.success && response.data && response.data.length > 0) {
      hasData.value = true
      await nextTick()
      renderChart(response.data)
    } else {
      hasData.value = false
    }
  } catch (error) {
    console.error('Error fetching ROE data:', error)
    hasData.value = false
    ElMessage.error('获取ROE数据失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const renderChart = (data) => {
  if (!chartRef.value) return

  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  chartInstance.value = echarts.init(chartRef.value)

  const dates = data.map(item => item.date)
  const roeData = data.map(item => item.company_roe)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: function (params) {
        let result = `${params[0].name}<br/>`;
        params.forEach(param => {
          result += `${param.marker} ${param.seriesName}: ${param.value}%<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ['公司ROE'],
      bottom: 0,
      icon: 'circle'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        formatter: (value) => {
          return value.substring(0, 7) // 显示 YYYY-MM
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '公司ROE',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 3,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        },
        data: roeData
      }
    ]
  }

  chartInstance.value.setOption(option)
}

const handleOpen = () => {
  loadData()
}
</script>

<style scoped>
.custom-modal :deep(.el-dialog__header) {
  margin-right: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
}

.stock-name {
  color: #409EFF;
  font-weight: 600;
  font-size: 20px;
}

.modal-title {
  color: #303133;
  font-weight: 500;
}

.chart-container {
  height: 500px;
  width: 100%;
  position: relative;
}

.echarts-dom {
  width: 100%;
  height: 100%;
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
