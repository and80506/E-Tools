<template>
  <div class="calculator-container">
    <div class="calc-grid">
      <!-- 参数配置 -->
      <div class="glass-card calc-form">
        <h3 class="card-title">计算参数配置</h3>
        
        <div class="form-group">
          <label>初始本金 (元)</label>
          <div class="input-wrapper">
            <span class="prefix">¥</span>
            <input v-model.number="principal" type="number" class="input-field pad-left" />
          </div>
        </div>

        <div class="form-group">
          <label>每月定投金额 (元)</label>
          <div class="input-wrapper">
            <span class="prefix">¥</span>
            <input v-model.number="monthlyContribution" type="number" class="input-field pad-left" />
          </div>
        </div>

        <div class="form-group">
          <label>预期年化收益率 (%)</label>
          <div class="input-wrapper">
            <span class="prefix">%</span>
            <input v-model.number="annualRate" type="number" step="0.1" class="input-field pad-left" />
          </div>
        </div>

        <div class="form-group">
          <label>投资年限 (年)</label>
          <div class="input-wrapper">
            <span class="prefix">Yr</span>
            <input v-model.number="years" type="number" class="input-field pad-left" />
          </div>
        </div>
      </div>

      <!-- 计算结果看板 -->
      <div class="glass-card calc-result">
        <h3 class="card-title">模拟成长概览</h3>
        
        <div class="result-kpis">
          <div class="result-kpi">
            <span class="kpi-lbl">最终资产总值</span>
            <span class="kpi-val highlight">¥ {{ formatMoney(finalBalance) }}</span>
          </div>
          <div class="result-kpi-sub">
            <div>
              <span class="sub-lbl">累计投入本金：</span>
              <span class="sub-val">¥ {{ formatMoney(totalInvested) }}</span>
            </div>
            <div>
              <span class="sub-lbl">累计赚取收益：</span>
              <span class="sub-val profit">¥ {{ formatMoney(totalInterest) }}</span>
            </div>
          </div>
        </div>

        <!-- 简易的柱状图占比图 -->
        <div class="ratio-bar-wrapper">
          <span class="ratio-title">资产构成占比</span>
          <div class="ratio-bar">
            <div class="bar-invested" :style="{ width: investedRatio + '%' }"></div>
            <div class="bar-interest" :style="{ width: interestRatio + '%' }"></div>
          </div>
          <div class="ratio-legend">
            <div class="legend-item"><span class="dot invested"></span> 本金 ({{ investedRatio.toFixed(1) }}%)</div>
            <div class="legend-item"><span class="dot interest"></span> 收益 ({{ interestRatio.toFixed(1) }}%)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 年份明细表格 -->
    <div class="glass-card details-table-card">
      <h3 class="card-title">年度资产增长明细</h3>
      <div class="table-wrapper">
        <table class="details-table">
          <thead>
            <tr>
              <th>年份</th>
              <th>期初余额</th>
              <th>年度定投额</th>
              <th>年度收益额</th>
              <th>期末总额</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in tableData" :key="row.year">
              <td>第 {{ row.year }} 年</td>
              <td>¥ {{ formatMoney(row.startBalance) }}</td>
              <td>¥ {{ formatMoney(row.contributions) }}</td>
              <td>¥ {{ formatMoney(row.interest) }}</td>
              <td class="final-td">¥ {{ formatMoney(row.endBalance) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'CompoundCalculator',
  setup() {
    const principal = ref(50000)
    const monthlyContribution = ref(2000)
    const annualRate = ref(10)
    const years = ref(15)

    const formatMoney = (val) => {
      return Number(val).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    // 计算复利过程
    const calculation = computed(() => {
      const p = principal.value || 0
      const mc = monthlyContribution.value || 0
      const r = (annualRate.value || 0) / 100
      const yr = years.value || 0

      let currentBalance = p
      let totalInvestedAcc = p
      const yearlyDetails = []

      // 月复利计算 (按年汇总)
      const monthlyRate = r / 12

      for (let y = 1; y <= yr; y++) {
        const startBalance = currentBalance
        let yearContributions = 0
        let yearInterest = 0

        // 模拟一年的12个月
        for (let m = 0; m < 12; m++) {
          // 期初余额计息
          const interestThisMonth = currentBalance * monthlyRate
          yearInterest += interestThisMonth
          currentBalance += interestThisMonth

          // 月末定投
          currentBalance += mc
          yearContributions += mc
          totalInvestedAcc += mc
        }

        yearlyDetails.push({
          year: y,
          startBalance,
          contributions: yearContributions,
          interest: yearInterest,
          endBalance: currentBalance
        })
      }

      return {
        finalBalance: currentBalance,
        totalInvested: totalInvestedAcc,
        totalInterest: Math.max(0, currentBalance - totalInvestedAcc),
        tableData: yearlyDetails
      }
    })

    const finalBalance = computed(() => calculation.value.finalBalance)
    const totalInvested = computed(() => calculation.value.totalInvested)
    const totalInterest = computed(() => calculation.value.totalInterest)
    const tableData = computed(() => calculation.value.tableData)

    const investedRatio = computed(() => {
      if (finalBalance.value === 0) return 100
      return (totalInvested.value / finalBalance.value) * 100
    })

    const interestRatio = computed(() => {
      if (finalBalance.value === 0) return 0
      return (totalInterest.value / finalBalance.value) * 100
    })

    return {
      principal,
      monthlyContribution,
      annualRate,
      years,
      formatMoney,
      finalBalance,
      totalInvested,
      totalInterest,
      tableData,
      investedRatio,
      interestRatio
    }
  }
}
</script>

<style scoped>
.calculator-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.calc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .calc-grid {
    grid-template-columns: 1fr;
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.calc-form, .calc-result {
  padding: 24px;
}

.form-group {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  color: var(--text-secondary);
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.prefix {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 600;
}

.pad-left {
  padding-left: 36px;
}

/* 结果展示 */
.result-kpis {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.result-kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kpi-lbl {
  font-size: 13px;
  color: var(--text-secondary);
}

.kpi-val {
  font-size: 32px;
  font-weight: 800;
}

.kpi-val.highlight {
  background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.result-kpi-sub {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  background: rgba(24, 34, 53, 0.4);
  border-radius: 8px;
  border-left: 3px solid var(--accent-blue);
  font-size: 14px;
}

.result-kpi-sub div {
  display: flex;
  justify-content: space-between;
}

.sub-lbl {
  color: var(--text-secondary);
}

.sub-val {
  font-weight: 600;
  color: var(--text-primary);
}

.sub-val.profit {
  color: var(--stock-up);
}

/* 占比图 */
.ratio-bar-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ratio-title {
  font-size: 12px;
  color: var(--text-secondary);
}

.ratio-bar {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: var(--bg-tertiary);
}

.bar-invested {
  background: linear-gradient(90deg, var(--accent-blue), #3b82f6);
  transition: width 0.3s ease;
}

.bar-interest {
  background: linear-gradient(90deg, var(--stock-up), #f87171);
  transition: width 0.3s ease;
}

.ratio-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.invested {
  background: var(--accent-blue);
}

.dot.interest {
  background: var(--stock-up);
}

/* 明细表格 */
.details-table-card {
  padding: 24px;
}

.table-wrapper {
  overflow-x: auto;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.details-table th, 
.details-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-glass);
}

.details-table th {
  background: rgba(24, 34, 53, 0.4);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 12px;
}

.details-table tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.final-td {
  font-weight: 600;
  color: var(--accent-cyan);
}
</style>
