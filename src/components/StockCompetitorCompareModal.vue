<template>
  <el-dialog :model-value="visible" @update:model-value="$emit('update:visible', $event)" title="竞对多维数据比较"
    width="1200px" top="5vh" destroy-on-close @opened="onOpened" class="competitor-compare-modal">
    <div v-loading="loading" element-loading-text="正在聚合多维数据，由于并发拉取较多接口，请耐心等待..." style="min-height: 400px;">
      <div v-if="!loading" class="charts-grid">
        <div class="chart-container" style="position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <el-icon style="cursor: pointer; color: #909399; font-size: 18px;" @click="openZoom(0)">
              <ZoomIn />
            </el-icon>
          </div>
          <div style="position: absolute; top: 30px; left: 50%; transform: translateX(75px); z-index: 10;">
            <el-tooltip effect="dark" placement="right">
              <template #content>
                <div style="line-height: 1.6; color: #ffffff; max-width: 350px;">
                  <strong style="color: #409EFF">口径说明：</strong><br />
                  每日收盘时的总市值（亿元）。<br />
                  <br />
                  <strong style="color: #409EFF">指标解读：</strong><br />
                  总市值 = 股价 × 总股本。<br />
                  反映了市场对公司的整体估值和体量大小。
                </div>
              </template>
              <el-icon style="cursor: pointer; color: #909399; font-size: 16px;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div ref="mvChartRef" class="chart-box"></div>
        </div>
        <div class="chart-container" style="position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <el-icon style="cursor: pointer; color: #909399; font-size: 18px;" @click="openZoom(1)">
              <ZoomIn />
            </el-icon>
          </div>
          <div style="position: absolute; top: 30px; left: 50%; transform: translateX(75px); z-index: 10;">
            <el-tooltip effect="dark" placement="right">
              <template #content>
                <div style="line-height: 1.6; color: #ffffff; max-width: 350px;">
                  <strong style="color: #409EFF">口径说明：</strong><br />
                  本图表数据采用 <strong>TTM（滚动十二个月）</strong> 口径进行平滑处理，消除财报季节性波动。<br />
                  <br />
                  <strong style="color: #409EFF">指标解读：</strong><br />
                  最近 12 个月公司营业总收入的总和。<br />
                  反映公司业务总规模的扩张趋势。
                </div>
              </template>
              <el-icon style="cursor: pointer; color: #909399; font-size: 16px;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div ref="revenueChartRef" class="chart-box"></div>
        </div>
        <div class="chart-container" style="position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <el-icon style="cursor: pointer; color: #909399; font-size: 18px;" @click="openZoom(2)">
              <ZoomIn />
            </el-icon>
          </div>
          <div style="position: absolute; top: 30px; left: 50%; transform: translateX(75px); z-index: 10;">
            <el-tooltip effect="dark" placement="right">
              <template #content>
                <div style="line-height: 1.6; color: #ffffff; max-width: 350px;">
                  <strong style="color: #409EFF">口径说明：</strong><br />
                  本图表数据采用 <strong>归母净利润 (TTM)</strong> 口径进行平滑处理，消除财报季节性波动。<br />
                  <br />
                  <strong style="color: #409EFF">指标解读：</strong><br />
                  最近 12 个月归属于母公司股东的净利润总和。<br />
                  反映公司实际属于普通股股东的盈利能力和利润质量。
                </div>
              </template>
              <el-icon style="cursor: pointer; color: #909399; font-size: 16px;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div ref="profitChartRef" class="chart-box"></div>
        </div>
        <div class="chart-container" style="position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <el-icon style="cursor: pointer; color: #909399; font-size: 18px;" @click="openZoom(3)">
              <ZoomIn />
            </el-icon>
          </div>
          <div style="position: absolute; top: 30px; left: 50%; transform: translateX(95px); z-index: 10;">
            <el-tooltip effect="dark" placement="right">
              <template #content>
                <div style="line-height: 1.6; color: #ffffff; max-width: 350px;">
                  <strong style="color: #409EFF">口径说明：</strong><br />
                  每日滚动市盈率 (PE-TTM)。<br />
                  <br />
                  <strong style="color: #409EFF">指标解读：</strong><br />
                  PE-TTM = 总市值 / 归母净利润(TTM)。<br />
                  反映了投资回本的理论年数，是衡量估值高低的核心指标。
                </div>
              </template>
              <el-icon style="cursor: pointer; color: #909399; font-size: 16px;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div ref="peChartRef" class="chart-box"></div>
        </div>
        <div class="chart-container" style="position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <el-icon style="cursor: pointer; color: #909399; font-size: 18px;" @click="openZoom(4)">
              <ZoomIn />
            </el-icon>
          </div>
          <div style="position: absolute; top: 30px; left: 50%; transform: translateX(50px); z-index: 10;">
            <el-tooltip effect="dark" placement="right">
              <template #content>
                <div style="line-height: 1.6; color: #ffffff; max-width: 380px;">
                  <strong style="color: #409EFF">口径说明：</strong><br />
                  本系统采用 <strong>ROE (TTM) 滚动年化口径</strong> 进行平滑处理，以消除财报季节性波动，使任意季度的盈利能力都能在同一基准线上对比。<br />
                  <br />
                  <strong style="color: #409EFF">与常规平台数据差异：</strong><br />
                  东方财富等网页默认展示“当期累计ROE”，一季报等非年报节点数值通常较低。本系统中：<br />
                  ROE (TTM) = 归母净利润(TTM) / 归属于母公司股东权益 * 100%<br />
                  <em>注：归母净利润(TTM) 即最近 12 个月（滚动4个季度）的累计净利润。</em>
                </div>
              </template>
              <el-icon style="cursor: pointer; color: #909399; font-size: 16px;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div ref="roeChartRef" class="chart-box"></div>
        </div>
        <div class="chart-container" style="position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; z-index: 10;">
            <el-icon style="cursor: pointer; color: #909399; font-size: 18px;" @click="openZoom(5)">
              <ZoomIn />
            </el-icon>
          </div>
          <div style="position: absolute; top: 30px; left: 50%; transform: translateX(95px); z-index: 10;">
            <el-tooltip effect="dark" placement="left">
              <template #content>
                <div style="line-height: 1.6; color: #ffffff; max-width: 350px;">
                  <strong style="color: #409EFF">口径说明：</strong><br />
                  最新财报披露的归属于母公司所有者权益。<br />
                  <br />
                  <strong style="color: #409EFF">指标解读：</strong><br />
                  净资产是公司的“家底”，体现了公司历年未分配利润和股东投入的累积。<br />
                  它是计算 PB (市净率) 和 ROE (净资产收益率) 的核心基石。
                </div>
              </template>
              <el-icon style="cursor: pointer; color: #909399; font-size: 16px;">
                <InfoFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div ref="netAssetChartRef" class="chart-box"></div>
        </div>
      </div>
    </div>
  </el-dialog>

  <!-- Zoom Dialog -->
  <el-dialog v-model="zoomVisible" width="1000px" destroy-on-close @opened="onZoomOpened" :show-close="true" append-to-body>
    <template #header>
      <div class="zoom-header" style="display: flex; align-items: center; justify-content: space-between; padding-right: 30px;">
        <span class="el-dialog__title">{{ zoomTitle }}</span>
        <div class="zoom-actions">
          <el-button link :icon="ArrowLeft" @click="prevZoom" :disabled="currentZoomIndex === 0">上一个</el-button>
          <el-button link :icon="ArrowRight" @click="nextZoom" :disabled="currentZoomIndex === 5" style="margin-left: 20px;">下一个</el-button>
        </div>
      </div>
    </template>
    <div ref="zoomChartRef" style="width: 100%; height: 600px;"></div>
  </el-dialog>
</template>

<script>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { InfoFilled, ZoomIn, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

export default {
  name: 'StockCompetitorCompareModal',
  components: {
    InfoFilled,
    ZoomIn
  },
  props: {
    visible: Boolean,
    baseStock: Object,
    competitors: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:visible'],
  setup(props) {
    const loading = ref(false)
    const mvChartRef = ref(null)
    const revenueChartRef = ref(null)
    const profitChartRef = ref(null)
    const peChartRef = ref(null)
    const roeChartRef = ref(null)
    const netAssetChartRef = ref(null)

    const chartData = ref([])
    const zoomVisible = ref(false)
    const currentZoomIndex = ref(0)
    const zoomChartRef = ref(null)
    let zoomChartInstance = null

    let charts = []

    const onOpened = async () => {
      loading.value = true
      // cleanup previous charts
      charts.forEach(c => c.dispose())
      charts = []

      try {
        const results = await fetchAllData()
        chartData.value = results
        loading.value = false
        await nextTick()
        renderAllCharts(results)
      } catch (err) {
        ElMessage.error(err.message || '获取数据失败')
        loading.value = false
      }
    }

    const fetchAllData = async () => {
      const allStocks = [props.baseStock, ...props.competitors]
      const fetchStockData = async (stock) => {
        const [fundRes, rcRes, roeRes] = await Promise.all([
          fetch(`/api/stock/fundamentals?code=${stock.code}`).then(r => r.json()),
          fetch(`/api/stock/revenue_cashflow?code=${stock.code}`).then(r => r.json()),
          fetch(`/api/stock/roe?code=${stock.code}`).then(r => r.json())
        ])

        if (fundRes.message && !fundRes.success) throw new Error(fundRes.message)

        return {
          name: stock.name,
          fundamentals: fundRes.success ? fundRes.data : [],
          revenueCashflow: rcRes.success ? rcRes.data : [],
          roe: roeRes.success ? roeRes.data : []
        }
      }

      return await Promise.all(allStocks.map(s => fetchStockData(s)))
    }

    const renderAllCharts = (results) => {

      renderDailyChart(mvChartRef.value, '市值趋势对比图 (亿元)', results, 'fundamentals', 'total_mv', { transform: v => v / 10000, decimals: 0 })
      renderDailyChart(peChartRef.value, '市盈率对比图 (PE-TTM)', results, 'fundamentals', 'pe_ttm', { decimals: 2 })

      const dateFormatOptions = { xAxis: { type: 'time', axisLabel: { color: '#909399', formatter: '{yyyy}-{MM}-{dd}', rotate: 45, hideOverlap: true } } }

      renderQuarterlyChart(revenueChartRef.value, '总营收对比图 (亿元)', results, 'revenueCashflow', 'revenue', { ...dateFormatOptions, decimals: 0 })
      renderQuarterlyChart(profitChartRef.value, '净利润对比图 (亿元)', results, 'roe', 'profit_ttm', { ...dateFormatOptions, decimals: 0 })
      renderQuarterlyChart(roeChartRef.value, 'ROE对比图', results, 'roe', 'company_roe', {
        ...dateFormatOptions,
        transform: v => v / 100,
        decimals: 2,
        yAxis: { type: 'value', scale: true, interval: 0.1, splitLine: { lineStyle: { color: '#ebeef5' } }, axisLabel: { color: '#909399' } }
      })
      renderQuarterlyChart(netAssetChartRef.value, '归母净资产对比图 (亿元)', results, 'roe', 'net_asset', { ...dateFormatOptions, decimals: 0 })
    }

    const renderDailyChart = (el, title, results, sourceKey, valueKey, extraOptions = {}) => {
      if (!el) return null
      const chart = echarts.init(el)
      charts.push(chart)

      const series = results.map(stockData => {
        const data = stockData[sourceKey]
          .filter(d => d[valueKey] !== null && d[valueKey] !== undefined && !isNaN(d[valueKey]))
          .map(d => {
            const ds = String(d.trade_date)
            const dateStr = ds.length === 8 ? `${ds.substring(0, 4)}-${ds.substring(4, 6)}-${ds.substring(6, 8)}` : ds
            const val = extraOptions.transform ? extraOptions.transform(d[valueKey]) : d[valueKey]
            return [dateStr, val]
          })
        return {
          name: stockData.name,
          type: 'line',
          showSymbol: false,
          data: data
        }
      })

      const option = {
        title: { text: title, left: 'center', textStyle: { fontSize: 15, color: '#303133' } },
        tooltip: {
          trigger: 'axis',
          valueFormatter: (value) => {
            if (value == null) return '-'
            const d = extraOptions.decimals !== undefined ? extraOptions.decimals : 2
            return Number(value).toFixed(d)
          }
        },
        legend: { bottom: 0, icon: 'circle', textStyle: { color: '#606266' } },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: extraOptions.xAxis || { type: 'time', axisLabel: { color: '#909399', formatter: '{yyyy}-{MM}-{dd}', rotate: 45, hideOverlap: true } },
        yAxis: extraOptions.yAxis || { type: 'value', scale: true, splitLine: { lineStyle: { color: '#ebeef5' } }, axisLabel: { color: '#909399' } },
        series: series
      }
      chart.setOption(option)
    }

    const renderQuarterlyChart = (el, title, results, sourceKey, valueKey, extraOptions = {}) => {
      if (!el) return null
      const chart = echarts.init(el)
      charts.push(chart)

      const series = results.map(stockData => {
        const data = stockData[sourceKey]
          .filter(d => d[valueKey] !== null && d[valueKey] !== undefined && !isNaN(d[valueKey]))
          .map(d => {
            const val = extraOptions.transform ? extraOptions.transform(d[valueKey]) : d[valueKey]
            return [d.date, val]
          })
        return {
          name: stockData.name,
          type: 'line',
          symbol: 'circle',
          symbolSize: 6,
          data: data
        }
      })

      const option = {
        title: { text: title, left: 'center', textStyle: { fontSize: 15, color: '#303133' } },
        tooltip: {
          trigger: 'axis',
          valueFormatter: (value) => {
            if (value == null) return '-'
            const d = extraOptions.decimals !== undefined ? extraOptions.decimals : 2
            return Number(value).toFixed(d)
          }
        },
        legend: { bottom: 0, icon: 'circle', textStyle: { color: '#606266' } },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: extraOptions.xAxis || { type: 'time', axisLabel: { color: '#909399', formatter: '{yyyy}-{MM}-{dd}', rotate: 45, hideOverlap: true } },
        yAxis: extraOptions.yAxis || { type: 'value', scale: true, splitLine: { lineStyle: { color: '#ebeef5' } }, axisLabel: { color: '#909399' } },
        series: series
      }
      chart.setOption(option)
      return chart
    }

    const zoomTitle = computed(() => {
      const titles = [
        '市值趋势对比图 (亿元)',
        '总营收对比图 (亿元)',
        '净利润对比图 (亿元)',
        '市盈率对比图 (PE-TTM)',
        'ROE对比图',
        '归母净资产对比图 (亿元)'
      ]
      return titles[currentZoomIndex.value] || '图表放大'
    })

    const openZoom = (index) => {
      currentZoomIndex.value = index
      zoomVisible.value = true
    }

    const onZoomOpened = () => {
      renderZoomChart()
    }

    const renderZoomChart = () => {
      if (zoomChartInstance) {
        zoomChartInstance.dispose()
        zoomChartInstance = null
      }
      if (!zoomChartRef.value) return

      const results = chartData.value
      const dateFormatOptions = { xAxis: { type: 'time', axisLabel: { color: '#909399', formatter: '{yyyy}-{MM}-{dd}', rotate: 45, hideOverlap: true } } }

      switch (currentZoomIndex.value) {
        case 0:
          zoomChartInstance = renderDailyChart(zoomChartRef.value, '', results, 'fundamentals', 'total_mv', { transform: v => v / 10000, decimals: 0 })
          break;
        case 1:
          zoomChartInstance = renderQuarterlyChart(zoomChartRef.value, '', results, 'revenueCashflow', 'revenue', { ...dateFormatOptions, decimals: 0 })
          break;
        case 2:
          zoomChartInstance = renderQuarterlyChart(zoomChartRef.value, '', results, 'roe', 'profit_ttm', { ...dateFormatOptions, decimals: 0 })
          break;
        case 3:
          zoomChartInstance = renderDailyChart(zoomChartRef.value, '', results, 'fundamentals', 'pe_ttm', { decimals: 2 })
          break;
        case 4:
          zoomChartInstance = renderQuarterlyChart(zoomChartRef.value, '', results, 'roe', 'company_roe', {
            ...dateFormatOptions,
            transform: v => v / 100,
            decimals: 2,
            yAxis: { type: 'value', scale: true, interval: 0.1, splitLine: { lineStyle: { color: '#ebeef5' } }, axisLabel: { color: '#909399' } }
          })
          break;
        case 5:
          zoomChartInstance = renderQuarterlyChart(zoomChartRef.value, '', results, 'roe', 'net_asset', { ...dateFormatOptions, decimals: 0 })
          break;
      }
    }

    const prevZoom = () => {
      if (currentZoomIndex.value > 0) {
        currentZoomIndex.value--
        renderZoomChart()
      }
    }

    const nextZoom = () => {
      if (currentZoomIndex.value < 5) {
        currentZoomIndex.value++
        renderZoomChart()
      }
    }

    onUnmounted(() => {
      charts.forEach(c => c.dispose())
      if (zoomChartInstance) zoomChartInstance.dispose()
    })

    return {
      loading,
      mvChartRef,
      revenueChartRef,
      profitChartRef,
      peChartRef,
      roeChartRef,
      netAssetChartRef,
      onOpened,
      
      chartData,
      zoomVisible,
      currentZoomIndex,
      zoomChartRef,
      zoomTitle,
      openZoom,
      onZoomOpened,
      prevZoom,
      nextZoom,
      ArrowLeft,
      ArrowRight
    }
  }
}
</script>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.chart-container {
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.chart-box {
  width: 100%;
  height: 300px;
}
</style>
