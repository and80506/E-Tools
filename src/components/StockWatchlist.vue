<template>
  <div class="watchlist-container">
    <!-- 功能控制栏 -->
    <el-card shadow="never" class="action-bar-card" style="margin-bottom: 20px;">
      <el-row :gutter="20" align="middle" justify="space-between">
        <el-col :span="10">
          <el-input v-model="searchQuery" placeholder="搜索股票代码或名称..." clearable
            style="width: 200px; margin-right: 15px;">
          </el-input>

          <el-select v-model="selectedTagFilter" placeholder="筛选标签" clearable style="width: 150px;">
            <el-option label="全部标签" value="" />
            <el-option v-for="t in allTags" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-col>

        <el-col :span="14" style="text-align: right;">
          <el-button type="info" plain @click="openTagManager">
            标签管理
          </el-button>
          <el-button type="success" plain @click="openTradeReview">
            交易复盘
          </el-button>
          <el-button v-if="selectedIds?.length > 0" type="danger" @click="showDeleteModal = true">
            批量删除 (已选 {{ selectedIds?.length || 0 }} 只)
          </el-button>
          <el-button type="default" @click="toggleBulkPanel">
            批量导入 / 导出
          </el-button>
          <el-button type="danger" plain @click="resetToDefault">恢复默认</el-button>
          <el-button type="primary" @click="showAddModal = true">
            新增自选股
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 批量导入/导出操作面板 -->
    <el-collapse-transition>
      <el-card v-if="showBulkPanel" shadow="never" style="margin-bottom: 20px;" class="bulk-panel-card">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold;">批量导入 / 导出自选股 (自动排重)</span>
            <el-button type="text" @click="showBulkPanel = false">关闭</el-button>
          </div>
        </template>
        <el-row :gutter="40">
          <el-col :span="12">
            <h4>方式一：纯文本快捷操作</h4>
            <p style="font-size: 13px; color: #909399; margin-bottom: 15px;">格式：每一行代表一只股票，支持空格、制表符或逗号分隔。如：<code>600519
        贵州茅台</code></p>
            <el-input v-model="bulkText" type="textarea" :rows="4" placeholder="粘贴股票列表到此处，或点击下方“生成当前列表文本”进行导出" />
            <div style="margin-top: 15px; text-align: right;">
              <el-button type="primary" size="small" @click="importText">确认文本导入</el-button>
              <el-button type="default" size="small" @click="exportText">生成当前列表文本</el-button>
            </div>
          </el-col>

          <el-col :span="12">
            <h4>方式二：Excel (CSV) 文件操作</h4>
            <p style="font-size: 13px; color: #909399; margin-bottom: 15px;">通过标准的 CSV（逗号分隔值）文件实现与 Excel 互通。文件编码建议为
              UTF-8。</p>

            <div style="margin-bottom: 15px;">
              <el-upload action="#" :auto-upload="false" :show-file-list="false" accept=".csv"
                :on-change="handleFileChange">
                <el-button type="default">选择并导入 CSV 文件</el-button>
              </el-upload>
              <span v-if="csvFileName" style="margin-left: 10px; font-size: 13px; color: #67c23a;">已选: {{ csvFileName
              }}</span>
            </div>

            <div>
              <el-button type="primary" @click="exportCSV">导出为 Excel (CSV)</el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </el-collapse-transition>

    <!-- 股票列表表格 -->
    <el-card shadow="never" class="table-card" :body-style="{ padding: '0px' }">
      <el-table v-loading="loading" :data="filteredStocks" style="width: 100%"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="code" label="股票代码" width="120">
          <template #default="scope">
            <el-link :href="`https://quote.eastmoney.com/${scope.row.code}.html`" target="_blank" type="primary"
              style="font-weight: 600;">
              {{ scope.row.code }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="股票名称" width="150" />

        <el-table-column label="标签">
          <template #default="scope">
            <div style="display: flex; gap: 5px; flex-wrap: wrap; align-items: center;"
              @click="openStockTagsModal(scope.row)">
              <el-tag v-for="t in scope.row.tags" :key="t.id" :color="t.color + '20'"
                :style="{ color: t.color, borderColor: t.color }" size="small">
                {{ t.name }}
              </el-tag>
              <el-button v-if="(!scope.row.tags || scope.row.tags.length === 0)" size="small" type="primary" link>+
                标签</el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="添加日期" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="360" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="openStockReviewHistory(scope.row)">笔记</el-button>
            <el-button size="small" type="info" plain @click="openSingleStockTradeReview(scope.row)">复盘</el-button>
            <el-button size="small" type="warning" plain @click="openAddTradeModal(scope.row)">买卖</el-button>
            <el-button size="small" type="success" plain @click="calculateFCF(scope.row)"
              :loading="scope.row.fcfLoading">FCF</el-button>
            <el-button size="small" type="danger" plain @click="deleteStock(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>

        <template #empty>
          <el-empty description="暂无匹配的自选股票，点击右上角“新增自选股”开始。" />
        </template>
      </el-table>
    </el-card>

    <!-- 新增自选股 单独添加模态框 -->
    <el-dialog v-model="showAddModal" title="新增自选股" width="400px">
      <el-form label-width="80px">
        <el-form-item label="股票代码">
          <el-input v-model="newStock.code" placeholder="例如: 600519" @keyup.enter="addStock"></el-input>
        </el-form-item>
        <el-form-item label="股票名称">
          <el-input v-model="newStock.name" placeholder="例如: 贵州茅台" @keyup.enter="addStock"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeAddModal">取消</el-button>
          <el-button type="primary" @click="addStock">确认添加</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量删除确认模态框 -->
    <el-dialog v-model="showDeleteModal" title="确认批量删除" width="400px" center>
      <span>您确定要从自选列表中删除选中的 {{ selectedIds?.length || 0 }} 只股票吗？此操作不可撤销。</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteModal = false">取消</el-button>
          <el-button type="danger" @click="deleteSelected">确认删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 标签全局管理模态框 -->
    <el-dialog v-model="showTagManagerModal" title="🏷️ 标签管理" width="500px">
      <div v-if="allTags?.length === 0" style="text-align: center; color: #909399; margin-bottom: 20px;">暂无标签，请在下方新增
      </div>
      <div v-else
        style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
        <div v-for="tag in allTags" :key="tag.id"
          style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <input type="color" v-model="tag.color" @change="updateTag(tag)"
              style="border: none; padding: 0; width: 30px; height: 30px; cursor: pointer;" />
            <el-input v-model="tag.name" @blur="updateTag(tag)" @keyup.enter="updateTag(tag)" size="small"
              style="width: 150px;"></el-input>
          </div>
          <el-button size="small" type="danger" @click="deleteTag(tag.id)">删除</el-button>
        </div>
      </div>

      <div
        style="display: flex; gap: 10px; align-items: center; border-top: 1px solid var(--el-border-color-lighter); padding-top: 15px;">
        <input type="color" v-model="newTagForm.color"
          style="border: none; padding: 0; width: 30px; height: 30px; cursor: pointer;" />
        <el-input v-model="newTagForm.name" placeholder="新标签名称..." @keyup.enter="createTag" size="small"
          style="flex: 1;"></el-input>
        <el-button type="primary" size="small" @click="createTag">添加</el-button>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTagManagerModal = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设标签 (股票关联) 模态框 -->
    <el-dialog v-model="showStockTagsModal" :title="`设置标签 (${currentTagsStock?.name})`" width="400px">
      <div v-if="allTags?.length === 0" style="text-align: center; color: #909399;">
        尚未创建任何标签。<br>请先到 [标签管理] 中添加标签。
      </div>
      <div v-else>
        <el-checkbox-group v-model="selectedStockTagIds">
          <el-row :gutter="10">
            <el-col :span="12" v-for="tag in allTags" :key="tag.id" style="margin-bottom: 10px;">
              <el-checkbox :label="tag.id" :value="tag.id">
                <span :style="{ color: tag.color, fontWeight: 'bold' }">{{ tag.name }}</span>
              </el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeStockTagsModal">取消</el-button>
          <el-button type="primary" @click="saveStockTags">确认关联</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- FCF 计算结果模态框 -->
    <el-dialog v-model="showFcfModal"
      :title="`TTM 企业自由现金流 / 股权市值计算 - ${currentFcfStock?.name} (${currentFcfStock?.code})`" width="450px">
      <div v-if="fcfResult" style="line-height: 1.8; font-size: 14px;">
        <p><strong>TTM 经营现金流净额:</strong> <span style="float: right;">{{ (fcfResult.operatingCashFlow /
          100000000).toFixed(2) }} 亿元</span></p>
        <p><strong>TTM 资本支出 (CAPEX):</strong> <span style="float: right;">{{ (fcfResult.capex / 100000000).toFixed(2) }}
            亿元</span>
        </p>
        <el-divider style="margin: 10px 0;" />
        <p><strong>TTM 自由现金流 (FCFF):</strong> <span style="float: right; color: #67c23a; font-weight: bold;">{{
          (fcfResult.fcf /
            100000000).toFixed(2) }} 亿元</span></p>
        <p><strong>当前总市值:</strong> <span style="float: right;">{{ (fcfResult.marketCap / 100000000).toFixed(2) }}
            亿元</span>
        </p>
        <el-divider style="margin: 10px 0;" />
        <p style="font-size: 16px;">
          <strong>TTM 企业自由现金流 / 股权市值:</strong>
          <span style="float: right; color: #e60012; font-weight: bold; font-size: 18px;">{{
            fcfResult.fcfYield.toFixed(2)
          }}%</span>
        </p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="showFcfModal = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 交易记录录入模态框 -->
    <el-dialog v-model="showAddTradeModal" :title="`记录交易 - ${currentTradeStock?.name}`" width="450px">
      <el-form label-width="80px" size="small">
        <el-form-item label="交易日期">
          <el-date-picker v-model="newTradeForm.trade_date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%;"></el-date-picker>
        </el-form-item>
        <el-form-item label="操作方向">
          <el-radio-group v-model="newTradeForm.type">
            <el-radio label="buy">买入</el-radio>
            <el-radio label="sell">卖出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数量">
          <div style="display: flex; gap: 10px;">
            <el-input-number v-model="newTradeForm.quantity" :min="1" style="flex: 1;"></el-input-number>
            <el-select v-model="newTradeForm.unit" style="width: 100px;">
              <el-option label="股" value="股"></el-option>
              <el-option label="手" value="手"></el-option>
              <el-option label="份额" value="份额"></el-option>
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="原因逻辑">
          <el-input type="textarea" v-model="newTradeForm.reason" rows="2" placeholder="买入/卖出原因"></el-input>
        </el-form-item>
        <el-form-item label="收益率">
          <el-input v-model="newTradeForm.return_rate" placeholder="例如: 8.32% 或 清仓收益率39.92%"></el-input>
        </el-form-item>
        <el-form-item label="额外备注">
          <el-input v-model="newTradeForm.notes" placeholder="例如: 1/4仓位, 清仓, 未成交等"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddTradeModal = false">取消</el-button>
          <el-button type="primary" @click="submitTrade">保存记录</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 交易复盘记录抽屉 -->
    <el-drawer v-model="showTradeReviewDrawer" :title="filterStockForTrades ? `${filterStockForTrades.name} - 交易复盘` : '全局交易复盘历史'" size="60%">
      <el-table :data="filteredTradeRecords" style="width: 100%" max-height="800">
        <el-table-column prop="trade_date" label="日期" width="100"></el-table-column>
        <el-table-column prop="name" label="名称" width="100"></el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'buy' ? 'danger' : 'success'" size="small">
              {{ scope.row.type === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template #default="scope">
            {{ scope.row.quantity }} {{ scope.row.unit }}
            <span v-if="scope.row.notes" style="color:#909399; font-size:12px;"><br>({{ scope.row.notes }})</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因/逻辑"></el-table-column>
        <el-table-column prop="return_rate" label="收益率" width="120"></el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="scope">
            <el-button size="small" type="danger" link @click="deleteTradeRecord(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>

    <!-- 个股复盘历史抽屉 -->
    <el-drawer v-model="showStockReviewDrawer" :title="(currentReviewStock?.name || '') + ' - 历史复盘'" size="50%">
      <div style="margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start;">
        <el-date-picker
          v-model="newReviewForm.date"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择日期"
          style="width: 160px;"
          :clearable="false"
        />
        <el-input 
          v-model="newReviewForm.content" 
          type="textarea"
          :rows="2"
          placeholder="输入新的笔记内容..." 
          style="flex: 1;"
        />
        <el-button type="primary" @click="submitNewReview" :loading="submittingReview">添加笔记</el-button>
      </div>

      <el-table :data="stockReviewHistory" style="width: 100%" max-height="800">
        <el-table-column label="日期" width="160">
          <template #default="scope">
            <el-date-picker 
              v-model="scope.row.review_date" 
              type="date" 
              size="small" 
              value-format="YYYY-MM-DD" 
              style="width: 130px"
              @change="updateReviewDate(scope.row)"
              :clearable="false"
            />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="复盘内容">
          <template #default="scope">
            <div v-if="editingReviewId === scope.row.review_id">
              <el-input 
                type="textarea" 
                :rows="3" 
                v-model="scope.row.editContent" 
              />
              <div style="margin-top: 8px; text-align: right;">
                <el-button size="small" type="primary" @click="saveEditReview(scope.row)" :loading="savingEditReview">保存</el-button>
                <el-button size="small" @click="cancelEditReview(scope.row)">取消</el-button>
              </div>
            </div>
            <div v-else style="white-space: pre-wrap; line-height: 1.6; padding: 5px 0;">
              {{ scope.row.content }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" fixed="right">
          <template #default="scope">
            <el-button v-if="editingReviewId !== scope.row.review_id" size="small" type="primary" link icon="Edit" @click="startEditReview(scope.row)"></el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无复盘记录" />
        </template>
      </el-table>
    </el-drawer>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { tagsApi, stocksApi, reviewsApi } from '../api/stocks'

export default {
  name: 'StockWatchlist',
  setup() {
    const stocks = ref([])
    const searchQuery = ref('')
    const selectedIds = ref([])
    const showAddModal = ref(false)
    const showDeleteModal = ref(false)
    const showBulkPanel = ref(false)
    const bulkText = ref('')
    const csvFileName = ref('')
    const loading = ref(false)

    // 标签系统相关状态
    const allTags = ref([])
    const selectedTagFilter = ref('')
    const showTagManagerModal = ref(false)
    const newTagForm = ref({ name: '', color: '#3b82f6' })

    const showStockTagsModal = ref(false)
    const currentTagsStock = ref(null)
    const selectedStockTagIds = ref([])

    const showFcfModal = ref(false)
    const currentFcfStock = ref(null)
    const fcfResult = ref(null)

    const newStock = ref({
      code: '',
      name: ''
    })

    // 交易记录
    const showTradeReviewDrawer = ref(false)
    const tradeRecords = ref([])
    const filterStockForTrades = ref(null)
    const filteredTradeRecords = computed(() => {
      if (!filterStockForTrades.value) return tradeRecords.value
      return tradeRecords.value.filter(t => t.name === filterStockForTrades.value.name || t.code === filterStockForTrades.value.code)
    })
    const showAddTradeModal = ref(false)
    const currentTradeStock = ref(null)
    const newTradeForm = ref({
      trade_date: new Date().toISOString().split('T')[0],
      type: 'buy',
      quantity: 100,
      unit: '股',
      reason: '',
      return_rate: '',
      notes: ''
    })

    // 个股复盘历史
    const showStockReviewDrawer = ref(false)
    const currentReviewStock = ref(null)
    const stockReviewHistory = ref([])
    const submittingReview = ref(false)
    const newReviewForm = ref({
      date: new Date().toISOString().split('T')[0],
      content: ''
    })
    const editingReviewId = ref(null)
    const savingEditReview = ref(false)

    // 初始化数据
    const loadData = async () => {
      loading.value = true
      try {
        stocks.value = await stocksApi.getStocks()
      } catch (e) {
        console.error('Failed to load stocks:', e)
      } finally {
        loading.value = false
      }
    }

    const loadTags = async () => {
      try {
        allTags.value = await tagsApi.getTags()
      } catch (e) {
        console.error('Failed to load tags:', e)
      }
    }

    // 格式化工具
    const formatDate = (dateStr) => {
      if (!dateStr) return '-'
      try {
        const d = new Date(dateStr)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      } catch (e) {
        return dateStr
      }
    }

    // 过滤列表
    const filteredStocks = computed(() => {
      if (!stocks.value || !Array.isArray(stocks.value)) return []
      const q = (searchQuery.value || '').trim().toLowerCase()
      const tFilter = selectedTagFilter.value

      return stocks.value.filter(s => {
        const codeStr = String(s.code || '').toLowerCase()
        const nameStr = String(s.name || '').toLowerCase()
        const matchQuery = !q || codeStr.includes(q) || nameStr.includes(q)
        const matchTag = !tFilter || (s.tags && s.tags.some(t => String(t.id) === String(tFilter)))

        return matchQuery && matchTag
      })
    })

    // 全选逻辑 (Element Plus el-table 适用)
    const handleSelectionChange = (val) => {
      selectedIds.value = val.map(item => item.id)
    }

    const hasCode = (code) => {
      const formatted = code.trim().toLowerCase()
      return stocks.value.some(s => s.code.trim().toLowerCase() === formatted)
    }

    // 单个添加
    const addStock = async () => {
      const code = newStock.value.code.trim()
      const name = newStock.value.name.trim()

      if (!code || !name) {
        ElMessage.error('请输入股票代码和股票名称')
        return
      }
      if (hasCode(code)) {
        ElMessage.error(`股票代码 ${code} 已存在！`)
        return
      }

      try {
        await stocksApi.addStock({ code, name })
        closeAddModal()
        await loadData()
      } catch (e) {
        ElMessage.error(`添加失败: ${e.message}`)
      }
    }

    // 单个删除
    const deleteStock = async (id) => {
      try {
        await stocksApi.deleteStock(id)
        selectedIds.value = selectedIds.value.filter(item => item !== id)
        await loadData()
      } catch (e) {
        ElMessage.error(`删除失败: ${e.message}`)
      }
    }

    // 批量删除
    const deleteSelected = async () => {
      try {
        await stocksApi.deleteBatch(selectedIds.value)
        selectedIds.value = []
        showDeleteModal.value = false
        await loadData()
      } catch (e) {
        ElMessage.error(`删除失败: ${e.message}`)
      }
    }

    const closeAddModal = () => {
      showAddModal.value = false
      newStock.value = { code: '', name: '' }
    }

    const toggleBulkPanel = () => {
      showBulkPanel.value = !showBulkPanel.value
      bulkText.value = ''
    }

    // 文本批量导入
    const importText = async () => {
      if (!bulkText.value.trim()) {
        ElMessage.error('请输入股票数据')
        return
      }

      const lines = bulkText.value.split('\n')
      const codeRegex = /^[A-Za-z0-9.]+$/
      const newStocks = []

      lines.forEach(line => {
        const text = line.trim()
        if (!text) return
        const parts = text.split(/[\s,，\t]+/)
        if (parts.length >= 2) {
          let part1 = parts[0].trim()
          let part2 = parts[1].trim()
          let code = '', name = ''

          if (codeRegex.test(part2) && !codeRegex.test(part1)) {
            code = part2; name = part1
          } else {
            code = part1; name = part2
          }

          if (code && name && !hasCode(code)) {
            newStocks.push({ code, name })
          }
        }
      })

      if (newStocks.length === 0) {
        ElMessage.error('没有发现有效且未存在的股票数据。')
        return
      }

      try {
        const res = await stocksApi.importStocks(newStocks)
        ElMessage.error(res.message)
        bulkText.value = ''
        await loadData()
      } catch (e) {
        ElMessage.error(`导入失败: ${e.message}`)
      }
    }

    const exportText = () => {
      if (stocks.value.length === 0) {
        ElMessage.error('列表为空')
        return
      }
      bulkText.value = stocks.value.map(s => `${s.code} ${s.name}`).join('\n')
    }

    const handleFileChange = (uploadFile) => {
      const file = uploadFile.raw
      if (!file) return

      csvFileName.value = file.name
      const reader = new FileReader()
      const codeRegex = /^[A-Za-z0-9.]+$/
      const newStocks = []

      reader.onload = async (evt) => {
        const text = evt.target.result
        const lines = text.split(/\r?\n/)

        lines.forEach((line, index) => {
          const row = line.trim()
          if (!row) return
          const parts = row.split(',')
          if (parts.length >= 2) {
            let part1 = parts[0].replace(/["']/g, '').trim()
            let part2 = parts[1].replace(/["']/g, '').trim()
            if (index === 0 && (part1.includes('代码') || part1.toLowerCase().includes('code') || part2.includes('代码'))) return

            let code = '', name = ''
            if (codeRegex.test(part2) && !codeRegex.test(part1)) {
              code = part2; name = part1
            } else {
              code = part1; name = part2
            }

            if (code && name && !hasCode(code)) {
              newStocks.push({ code, name })
            }
          }
        })

        if (newStocks.length > 0) {
          try {
            const res = await stocksApi.importStocks(newStocks)
            ElMessage.error(res.message)
            await loadData()
          } catch (err) {
            ElMessage.error(`导入失败: ${err.message}`)
          }
        } else {
          ElMessage.error('没有发现有效且未存在的股票数据。')
        }

        csvFileName.value = ''
      }
      reader.readAsText(file, 'UTF-8')
    }

    const exportCSV = () => {
      if (stocks.value.length === 0) return
      const csvContent = '\uFEFF' + '股票代码,股票名称\n' + stocks.value.map(s => `"${s.code}","${s.name}"`).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `watchlist_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    const resetToDefault = async () => {
      if (await ElMessageBox.confirm('确认恢复默认自选股？这会覆盖现有列表。', '提示', { type: 'warning' }).catch(() => false)) {
        try {
          const res = await stocksApi.resetToDefault()
          ElMessage.error(res.message)
          await loadData()
        } catch (e) {
          ElMessage.error(`恢复失败: ${e.message}`)
        }
      }
    }

    // --- 标签管理逻辑 ---
    const openTagManager = () => {
      showTagManagerModal.value = true
      loadTags()
    }

    const createTag = async () => {
      if (!newTagForm.value.name.trim()) return
      try {
        await tagsApi.createTag(newTagForm.value.name, newTagForm.value.color)
        newTagForm.value = { name: '', color: '#3b82f6' }
        await loadTags()
        await loadData() // 刷新股票列表以同步
      } catch (e) {
        ElMessage.error(e.message)
      }
    }

    const updateTag = async (tag) => {
      if (!tag.name.trim()) return
      try {
        await tagsApi.updateTag(tag.id, tag.name, tag.color)
        await loadTags()
        await loadData() // 自动更新现有列表
      } catch (e) {
        ElMessage.error(e.message)
      }
    }

    const deleteTag = async (id) => {
      if (!(await ElMessageBox.confirm('确定要删除该标签吗？关联此标签的股票也会取消该标签。', '提示', { type: 'warning' }).catch(() => false))) return
      try {
        await tagsApi.deleteTag(id)
        if (selectedTagFilter.value === id) selectedTagFilter.value = ''
        await loadTags()
        await loadData()
      } catch (e) {
        ElMessage.error(e.message)
      }
    }

    // --- 股票关联标签逻辑 ---
    const openStockTagsModal = (stock) => {
      currentTagsStock.value = stock
      selectedStockTagIds.value = (stock.tags || []).map(t => t.id)
      showStockTagsModal.value = true
    }

    const closeStockTagsModal = () => {
      showStockTagsModal.value = false
      currentTagsStock.value = null
    }

    const saveStockTags = async () => {
      if (!currentTagsStock.value) return
      try {
        await stocksApi.setStockTags(currentTagsStock.value.id, selectedStockTagIds.value)
        closeStockTagsModal()
        await loadData()
      } catch (e) {
        ElMessage.error(e.message)
      }
    }

    // -------------- FCF 计算 ---------------- //
    const calculateFCF = async (stock) => {
      stock.fcfLoading = true
      try {
        const res = await stocksApi.getFCF(stock.code)
        if (res.success && res.data) {
          fcfResult.value = res.data
          currentFcfStock.value = stock
          showFcfModal.value = true
        } else {
          ElMessage.error(res.message || '获取FCF数据失败')
        }
      } catch (err) {
        ElMessage.error('获取FCF失败，请检查网络或后端服务: ' + err.message)
      } finally {
        stock.fcfLoading = false
      }
    }

    // -------------- 交易复盘 ---------------- //
    const loadTrades = async () => {
      try {
        const res = await stocksApi.getTrades()
        tradeRecords.value = res || []
      } catch (e) {
        console.error('Failed to load trades:', e)
      }
    }

    const openTradeReview = async () => {
      filterStockForTrades.value = null
      await loadTrades()
      showTradeReviewDrawer.value = true
    }

    const openSingleStockTradeReview = async (stock) => {
      filterStockForTrades.value = stock
      await loadTrades()
      showTradeReviewDrawer.value = true
    }

    const openAddTradeModal = (stock) => {
      currentTradeStock.value = stock
      newTradeForm.value = {
        trade_date: new Date().toISOString().split('T')[0],
        type: 'buy',
        quantity: 100,
        unit: '股',
        reason: '',
        return_rate: '',
        notes: ''
      }
      showAddTradeModal.value = true
    }

    const submitTrade = async () => {
      if (!newTradeForm.value.quantity) {
        ElMessage.error('请输入交易数量')
        return
      }
      try {
        await stocksApi.addTrade({
          code: currentTradeStock.value.code,
          name: currentTradeStock.value.name,
          ...newTradeForm.value
        })
        showAddTradeModal.value = false
        loadTrades() // Update background list if it's open
        ElMessage.success('交易记录已保存')
      } catch (e) {
        ElMessage.error('保存失败: ' + e.message)
      }
    }

    const deleteTradeRecord = async (id) => {
      if (!(await ElMessageBox.confirm('确认删除该条交易记录？', '提示', { type: 'warning' }).catch(() => false))) return
      try {
        await stocksApi.deleteTrade(id)
        await loadTrades()
        ElMessage.success('删除成功')
      } catch (err) {
        ElMessage.error('删除失败: ' + err.message)
      }
    }

    const openStockReviewHistory = async (stock) => {
      try {
        currentReviewStock.value = stock
        newReviewForm.value.date = new Date().toISOString().split('T')[0]
        newReviewForm.value.content = ''
        stockReviewHistory.value = await reviewsApi.getStockReviews(stock.id)
        showStockReviewDrawer.value = true
      } catch (err) {
        ElMessage.error('加载个股复盘历史失败: ' + err.message)
      }
    }

    const submitNewReview = async () => {
      if (!newReviewForm.value.content.trim()) {
        ElMessage.warning('笔记内容不能为空')
        return
      }
      submittingReview.value = true
      try {
        await reviewsApi.saveStockReview(currentReviewStock.value.id, newReviewForm.value.date, newReviewForm.value.content)
        ElMessage.success('笔记添加成功')
        newReviewForm.value.content = ''
        stockReviewHistory.value = await reviewsApi.getStockReviews(currentReviewStock.value.id)
      } catch (e) {
        ElMessage.error('添加失败: ' + e.message)
      } finally {
        submittingReview.value = false
      }
    }

    const updateReviewDate = async (row) => {
      try {
        await reviewsApi.updateStockReviewDate(row.review_id, row.review_date)
        ElMessage.success('日期已修改')
        stockReviewHistory.value = await reviewsApi.getStockReviews(currentReviewStock.value.id)
      } catch (err) {
        ElMessage.error(err.message)
        // 回滚重载
        stockReviewHistory.value = await reviewsApi.getStockReviews(currentReviewStock.value.id)
      }
    }

    const startEditReview = (row) => {
      row.editContent = row.content
      editingReviewId.value = row.review_id
    }

    const cancelEditReview = () => {
      editingReviewId.value = null
    }

    const saveEditReview = async (row) => {
      if (!row.editContent.trim()) {
        ElMessage.warning('笔记内容不能为空')
        return
      }
      savingEditReview.value = true
      try {
        await reviewsApi.saveStockReview(currentReviewStock.value.id, row.review_date, row.editContent)
        ElMessage.success('笔记已更新')
        row.content = row.editContent
        editingReviewId.value = null
      } catch (e) {
        ElMessage.error('更新失败: ' + e.message)
      } finally {
        savingEditReview.value = false
      }
    }

    onMounted(async () => {
      loadData()
      loadTags()
    })

    return {
      stocks,
      searchQuery,
      selectedIds,
      showAddModal,
      showBulkPanel,
      bulkText,
      csvFileName,
      newStock,
      loading,
      filteredStocks,
      addStock,
      handleSelectionChange,
      formatDate,
      exportText,
      importText,
      exportCSV,
      handleFileChange,
      toggleBulkPanel,
      showDeleteModal,
      resetToDefault,
      deleteStock,
      deleteSelected,
      closeAddModal,

      allTags,
      selectedTagFilter,
      showTagManagerModal,
      newTagForm,
      openTagManager,
      createTag,
      updateTag,
      deleteTag,

      showStockTagsModal,
      currentTagsStock,
      selectedStockTagIds,
      openStockTagsModal,
      closeStockTagsModal,
      saveStockTags,

      currentFcfStock,
      showFcfModal,
      fcfResult,
      calculateFCF,

      showTradeReviewDrawer,
      tradeRecords,
      filterStockForTrades,
      filteredTradeRecords,
      showAddTradeModal,
      currentTradeStock,
      newTradeForm,
      openTradeReview,
      openSingleStockTradeReview,
      openAddTradeModal,
      submitTrade,
      deleteTradeRecord,

      showStockReviewDrawer,
      currentReviewStock,
      stockReviewHistory,
      submittingReview,
      newReviewForm,
      editingReviewId,
      savingEditReview,
      openStockReviewHistory,
      submitNewReview,
      updateReviewDate,
      startEditReview,
      cancelEditReview,
      saveEditReview
    }
  }
}
</script>

<style scoped>
.watchlist-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 操作面板 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  gap: 16px;
}

.search-box {
  width: 320px;
}

.actions {
  display: flex;
  gap: 12px;
}

/* 批量操作控制面板 */
.bulk-panel {
  padding: 24px;
  background: rgba(18, 24, 36, 0.85);
  border-color: rgba(0, 242, 254, 0.2);
}

.bulk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 12px;
}

.bulk-header h4 {
  font-size: 15px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}

.bulk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

@media (max-width: 768px) {
  .bulk-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.bulk-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bulk-section h5 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.help-text {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.bulk-textarea {
  height: 120px;
  resize: none;
  font-family: monospace;
  font-size: 13px;
}

.csv-import-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.csv-upload-btn {
  display: inline-block;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 13px;
}

.file-name {
  font-size: 12px;
  color: var(--accent-cyan);
}

.csv-export-box {
  margin-top: 12px;
}

.bulk-actions {
  display: flex;
  gap: 12px;
}

.btn-primary.mini,
.btn-secondary.mini {
  padding: 8px 14px;
  font-size: 12px;
}

/* 表格排版 */
.table-container {
  overflow-x: auto;
}

.watchlist-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.watchlist-table th,
.watchlist-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-glass);
  vertical-align: middle;
}

.watchlist-table th {
  background: rgba(24, 34, 53, 0.4);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.watchlist-table tr {
  transition: background-color 0.2s ease;
}

.watchlist-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.watchlist-table tr.row-selected {
  background: rgba(0, 242, 254, 0.03);
}

.select-col {
  width: 50px;
  text-align: center;
}

.select-col input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-cyan);
  cursor: pointer;
}

.index-col {
  width: 80px;
  color: var(--text-muted);
}

.code-col {
  font-family: monospace;
  font-weight: 600;
  color: var(--accent-blue);
  font-size: 15px;
}

.name-col {
  font-weight: 500;
  color: var(--text-primary);
}

.actions-col {
  width: 100px;
}

.btn-danger.mini {
  padding: 6px 12px;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: 64px !important;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(5, 5, 8, 0.7);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  width: 400px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 动画 */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
</style>
