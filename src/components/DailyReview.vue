<template>
  <div class="daily-review-container">
    <el-card shadow="never" class="header-card" style="margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 15px;">
        <span style="font-weight: bold;">选择复盘日期:</span>
        <el-date-picker
          v-model="currentDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="loadDateData"
          style="width: 150px;"
          :cell-class-name="dateCellClass"
        />
        <el-button-group>
          <el-button :disabled="!hasPrev" title="跳转到上一个有复盘的日期" @click="goPrev"><el-icon><ArrowLeft /></el-icon></el-button>
          <el-button type="primary" plain @click="setToToday">今天</el-button>
          <el-button :disabled="!hasNext" title="跳转到下一个有复盘的日期" @click="goNext"><el-icon><ArrowRight /></el-icon></el-button>
        </el-button-group>
      </div>
    </el-card>

    <el-row :gutter="20" style="flex: 1; align-items: stretch; margin: 0; min-height: 500px;">
      <!-- 左侧：全局复盘 -->
      <el-col :span="14" style="display: flex; flex-direction: column;">
        <el-card shadow="never" style="flex: 1; display: flex; flex-direction: column;" :body-style="{ display: 'flex', flexDirection: 'column', flex: 1, padding: '20px' }">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: bold; color: #409EFF;">📅 全局复盘笔记</span>
              <div style="display: flex; gap: 10px;">
                <el-button type="default" plain @click="showFullscreenReview = true" title="放大并在全屏中沉浸编辑">
                  <el-icon style="margin-right: 5px;"><FullScreen /></el-icon> 放大编辑
                </el-button>
                <el-button type="primary" @click="saveDailyReview" :loading="savingDaily">
                  保存全局复盘
                </el-button>
              </div>
            </div>
          </template>
          <MdEditor
            v-model="dailyContent"
            placeholder="在此记录大盘走势、行业轮动、整体投资策略及心态感悟..."
            style="flex: 1; height: 100%;"
            :preview="false"
            @onSave="saveDailyReview"
          />
        </el-card>
      </el-col>

      <!-- 右侧：个股专属复盘 -->
      <el-col :span="10" style="display: flex; flex-direction: column;">
        <el-card shadow="never" style="flex: 1; overflow-y: auto;" :body-style="{ padding: '20px' }">
          <template #header>
            <span style="font-size: 18px; font-weight: bold; color: #67C23A;">🎯 个股专属复盘</span>
          </template>
          
          <el-card shadow="hover" style="margin-bottom: 20px; background-color: var(--el-fill-color-light);">
            <el-form label-position="top">
              <el-form-item label="选择或切换股票：">
                <el-select v-model="selectedStockId" placeholder="-- 请选择自选股 --" style="width: 100%;" filterable>
                  <el-option v-for="s in allStocks" :key="s.id" :label="`${s.code} - ${s.name}`" :value="s.id" />
                </el-select>
              </el-form-item>
              
              <el-collapse-transition>
                <div v-if="selectedStockId">
                  <el-input
                    v-model="stockReviewContent"
                    type="textarea"
                    :rows="6"
                    placeholder="记录关于这只个股的基本面、技术面或交易计划..."
                    style="margin-bottom: 15px;"
                    @keydown.meta.s.prevent="saveStockReview"
                    @keydown.ctrl.s.prevent="saveStockReview"
                  />
                  <div style="text-align: right;">
                    <el-button type="success" @click="saveStockReview" :loading="savingStock">
                      保存个股复盘
                    </el-button>
                  </div>
                </div>
              </el-collapse-transition>
            </el-form>
          </el-card>

          <el-divider content-position="left">📌 本日已有复盘的个股 ({{ stockReviews?.length || 0 }})</el-divider>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <el-empty v-if="stockReviews?.length === 0" description="本日暂无个股复盘" :image-size="80" />
            
            <el-card 
              v-else
              v-for="r in stockReviews" 
              :key="r.review_id" 
              shadow="hover"
              style="cursor: pointer; transition: all 0.2s;"
              @click="editStockReview(r)"
            >
              <div style="margin-bottom: 8px; font-weight: bold;">
                <span style="color: #409EFF; margin-right: 8px;">{{ r.code }}</span>
                <span>{{ r.name }}</span>
              </div>
              <div style="font-size: 14px; color: #606266; line-height: 1.5;">
                {{ truncateText(r.content, 80) }}
              </div>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 沉浸式全屏编辑模态框 -->
    <el-dialog
      v-model="showFullscreenReview"
      fullscreen
      title="沉浸式编辑 - 全局复盘笔记"
      :show-close="false"
      class="fullscreen-editor"
    >
      <div style="display: flex; flex-direction: column; height: 100%;">
        <div style="height: calc(100vh - 150px); display: flex; flex-direction: column; margin-bottom: 20px;">
          <MdEditor
            v-model="dailyContent"
            placeholder="在此记录大盘走势、行业轮动、整体投资策略及心态感悟..."
            style="flex: 1; height: 100%;"
            :preview="false"
            @onSave="saveDailyReview"
          />
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 15px;">
          <el-button size="large" @click="showFullscreenReview = false">退出沉浸模式</el-button>
          <el-button size="large" type="primary" @click="saveDailyReview" :loading="savingDaily">
            保存并返回
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { FullScreen, ArrowLeft, ArrowRight, View, Edit } from '@element-plus/icons-vue'
import { stocksApi, reviewsApi } from '../api/stocks'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

export default {
  name: 'DailyReview',
  components: {
    MdEditor
  },
  setup() {
    const getTodayStr = () => {
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    const currentDate = ref(getTodayStr())
    const dailyContent = ref('')
    const savingDaily = ref(false)
    const showFullscreenReview = ref(false)

    const allStocks = ref([])
    const selectedStockId = ref('')
    const stockReviewContent = ref('')
    const savingStock = ref(false)
    const stockReviews = ref([])
    const reviewedDates = ref([])

    const loadReviewedDates = async () => {
      try {
        reviewedDates.value = await reviewsApi.getAllReviewDates()
      } catch(e) {
        console.error('Failed to load reviewed dates', e)
      }
    }

    const hasPrev = computed(() => {
      return reviewedDates.value.some(d => d < currentDate.value)
    })

    const hasNext = computed(() => {
      return reviewedDates.value.some(d => d > currentDate.value)
    })

    const goPrev = () => {
      const smaller = reviewedDates.value.filter(d => d < currentDate.value)
      if (smaller.length > 0) {
        currentDate.value = smaller[smaller.length - 1]
        loadDateData()
      }
    }

    const goNext = () => {
      const larger = reviewedDates.value.filter(d => d > currentDate.value)
      if (larger.length > 0) {
        currentDate.value = larger[0]
        loadDateData()
      }
    }

    const dateCellClass = (dateObj) => {
      const y = dateObj.getFullYear()
      const m = String(dateObj.getMonth() + 1).padStart(2, '0')
      const d = String(dateObj.getDate()).padStart(2, '0')
      const ds = `${y}-${m}-${d}`
      if (reviewedDates.value.includes(ds)) {
        return 'has-review-date-cell'
      }
      return ''
    }

    const setToToday = () => {
      currentDate.value = getTodayStr()
      loadDateData()
    }

    const loadAllStocks = async () => {
      try {
        const res = await stocksApi.getStocks()
        allStocks.value = Array.isArray(res) ? res : (res.data || [])
      } catch (e) {
        console.error('Failed to load stocks:', e)
      }
    }

    const loadDateData = async () => {
      if (!currentDate.value) return
      try {
        // 加载全局复盘
        const dailyRes = await reviewsApi.getDailyReview(currentDate.value)
        dailyContent.value = dailyRes ? dailyRes.content : ''

        // 加载当日个股复盘列表
        stockReviews.value = await reviewsApi.getStockReviewsByDate(currentDate.value)

        // 如果当前选中的股票已经在这个列表中，同步内容；否则清空内容
        if (selectedStockId.value) {
          const existing = stockReviews.value.find(r => String(r.stock_id) === String(selectedStockId.value))
          stockReviewContent.value = existing ? existing.content : ''
        }
      } catch (e) {
        console.error('Failed to load date data:', e)
      }
    }

    const saveDailyReview = async () => {
      if (!currentDate.value) return
      savingDaily.value = true
      try {
        await reviewsApi.saveDailyReview(currentDate.value, dailyContent.value)
        if (showFullscreenReview.value) {
          showFullscreenReview.value = false
        }
        await loadReviewedDates()
      } catch (e) {
        alert('保存失败: ' + e.message)
      } finally {
        savingDaily.value = false
      }
    }

    const saveStockReview = async () => {
      if (!currentDate.value || !selectedStockId.value) return
      savingStock.value = true
      try {
        await reviewsApi.saveStockReview(selectedStockId.value, currentDate.value, stockReviewContent.value)
        await loadDateData() // 刷新列表
        await loadReviewedDates()
      } catch (e) {
        alert('保存失败: ' + e.message)
      } finally {
        savingStock.value = false
      }
    }

    const editStockReview = (record) => {
      selectedStockId.value = record.stock_id
      stockReviewContent.value = record.content
      // 滚动回顶部或高亮一下
    }

    const truncateText = (text, len = 20) => {
      if (!text) return ''
      return text.length > len ? text.slice(0, len) + '...' : text
    }

    // 当切换选中的股票时，自动带出内容
    watch(selectedStockId, (newId) => {
      if (!newId) {
        stockReviewContent.value = ''
        return
      }
      const existing = stockReviews.value.find(r => String(r.stock_id) === String(newId))
      stockReviewContent.value = existing ? existing.content : ''
    })

    onMounted(async () => {
      await loadAllStocks()
      await loadDateData()
      await loadReviewedDates()
    })

    return {
      currentDate,
      setToToday,
      hasPrev,
      hasNext,
      goPrev,
      goNext,
      dateCellClass,
      dailyContent,
      saveDailyReview,
      savingDaily,
      showFullscreenReview,
      FullScreen,
      View,
      Edit,
      
      allStocks,
      selectedStockId,
      stockReviewContent,
      saveStockReview,
      savingStock,
      stockReviews,
      editStockReview,
      
      loadDateData,
      truncateText,
      ArrowLeft,
      ArrowRight
    }
  }
}
</script>

<style>
.has-review-date-cell .el-date-table-cell__text {
  font-weight: bold;
  color: #409EFF;
  background-color: var(--el-color-primary-light-9);
  border-radius: 50%;
}
</style>

<style scoped>
.daily-review-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.header-glass-card {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.date-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1rem;
  font-weight: 500;
}

.date-input {
  font-family: inherit;
  font-size: 1.1rem;
  padding: 8px 12px;
  width: 180px;
}

.split-layout {
  display: flex;
  gap: 20px;
  align-items: stretch;
  flex: 1;
  min-height: 500px;
}

.left-panel, .right-panel {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.left-panel {
  flex: 3;
}

.right-panel {
  flex: 2;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: var(--primary-color);
}

.global-textarea {
  flex: 1;
  resize: none;
  font-size: 1.05rem;
  line-height: 1.6;
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-color);
}

.stock-editor {
  background: rgba(255, 255, 255, 0.3);
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.stock-textarea {
  margin-top: 12px;
  height: 120px;
  resize: vertical;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.history-list-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.history-list-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.stock-reviews-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stock-review-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stock-review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background: #ffffff;
}

.card-title {
  margin-bottom: 6px;
  font-weight: 600;
}

.stock-code {
  color: var(--primary-color);
  margin-right: 8px;
}

.card-content {
  font-size: 0.95rem;
  color: var(--text-color);
  opacity: 0.8;
  line-height: 1.4;
}

/* 适配暗黑模式 */
@media (prefers-color-scheme: dark) {
  .global-textarea, .stock-editor, .stock-review-card {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
  .stock-review-card:hover {
    background: rgba(30, 41, 59, 0.8);
  }
}
</style>
