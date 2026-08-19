<template>
  <div class="valuation-container">
    <!-- Introduction Section -->
    <div class="glass-card intro-card">
      <div class="intro-header">
        <h2 class="section-title">估值推导过程：分段自由现金流贴现模型 (三阶段 DCF, 3-Stage Discounted Cash Flow)，理论上可以说是“估值公式的尽头，估值模型皇冠上的明珠”。</h2>
        <span class="badge">DCF Model</span>
      </div>
      <p class="intro-desc">
        完整的三阶段模型通常包含三个阶段：<strong>高速增长期 (Explosive Phase) → 过渡/衰退期 (Transition Phase) → 永续期/终局 (Terminal Phase)</strong>。
      </p>

      <div class="formula-box">
        <h4 style="margin-bottom: 12px; font-weight: 600;">三阶段 DCF 模型估值推导——</h4>
        <p>设定：第一年自由现金流（FCF） = 10 亿元；折现率/WACC = 8.0%；股票总股本 = 100 亿股（方便折算每股价值）。</p>
        
        <div style="margin-top: 16px; padding: 16px; background: rgba(0,0,0,0.2); border-radius: 8px;">
          <div style="display: flex; gap: 20px; font-family: monospace; font-size: 13px;">
            <div style="flex: 1; text-align: center;">
              <div>第一阶段（高速增长期）</div>
              <div style="font-weight: 700; font-size: 16px; margin: 4px 0;">第 1 ~ 5 年</div>
              <div style="color: #4facfe;">【稳定高增长 30.0%】</div>
            </div>
            <div style="display: flex; align-items: center; font-size: 18px; color: rgba(255,255,255,0.3);">---></div>
            <div style="flex: 1; text-align: center;">
              <div>第二阶段（过渡期）</div>
              <div style="font-weight: 700; font-size: 16px; margin: 4px 0;">第 6 ~ 10 年</div>
              <div style="color: #42d392;">【增长率按年递减】</div>
            </div>
            <div style="display: flex; align-items: center; font-size: 18px; color: rgba(255,255,255,0.3);">---></div>
            <div style="flex: 1; text-align: center;">
              <div>第三阶段（终局期）</div>
              <div style="font-weight: 700; font-size: 16px; margin: 4px 0;">第 11 年及以后</div>
              <div style="color: #fca048;">【永续增长 5.0%】</div>
            </div>
          </div>
        </div>
        
        <ul class="rule-bullets" style="margin-top: 20px;">
          <li>
            <strong>第一阶段：高速增长期（第 1 ~ 5 年）</strong>
            <p>增速 $g_1 = 30\%$ 保持不变。</p>
          </li>
          <li>
            <strong>第二阶段：过渡/衰退期（第 6 ~ 10 年）</strong>
            <p>增速从 30% 向永续增长率逐步线性回落，每年下降固定差值：25.0% → 20.0% → 15.0% → 10.0% → 5.0%。</p>
          </li>
          <li>
            <strong>第三阶段：永续增长期（第 11 年及以后）</strong>
            <p>维持低速 $g_n = 5.0\%$ 稳定增长，用戈登股利公式计算终值。</p>
          </li>
        </ul>
      </div>
    </div>

    <!-- Interactive Calculator -->
    <div class="glass-card calc-card">
      <h3 class="card-title">Three-Stage DCF Valuation Calculator</h3>
      
      <!-- Legend -->
      <div class="chart-legend">
        <span class="legend-item"><span class="dot phase1"></span>Phase 1</span>
        <span class="legend-item"><span class="dot phase2"></span>Phase 2</span>
        <span class="legend-item"><span class="dot terminal"></span>Terminal</span>
      </div>

      <!-- Stacked Bar Chart -->
      <div class="stacked-chart-container">
        <div class="stacked-bar">
          <div class="bar-segment phase1" :style="{ width: phase1Ratio + '%' }">
            <span class="bar-label" v-if="phase1Ratio > 5">PV1</span>
          </div>
          <div class="bar-segment phase2" :style="{ width: phase2Ratio + '%' }">
            <span class="bar-label" v-if="phase2Ratio > 5">PV2</span>
          </div>
          <div class="bar-segment terminal" :style="{ width: terminalRatio + '%' }">
            <span class="bar-label">Terminal {{ calculatedResult.terminalPV.toFixed(1) }} ({{ terminalRatio.toFixed(1) }}%)</span>
          </div>
        </div>
        <div class="chart-axis">
          <span>0</span>
          <span>500</span>
          <span>1000</span>
          <span>1500</span>
          <span>2000</span>
        </div>
        <div class="axis-label">Total PV (亿元)</div>
      </div>

      <!-- Data Table -->
      <div class="data-table-container">
        <table class="dcf-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Phase</th>
              <th>Growth</th>
              <th>Profit</th>
              <th>PV of CF</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in calculatedResult.yearlyData" :key="item.year" :class="'row-' + item.phaseClass">
              <td>{{ item.year }}</td>
              <td>{{ item.phaseName }}</td>
              <td>{{ (item.growth * 100).toFixed(1) }}%</td>
              <td>{{ item.profit.toFixed(2) }}</td>
              <td>{{ item.pv.toFixed(2) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="t-right">Total PV of CF</td>
              <td>{{ calculatedResult.totalPVofCF.toFixed(2) }}</td>
            </tr>
            <tr>
              <td colspan="4" class="t-right">Terminal PV</td>
              <td>{{ calculatedResult.terminalPV.toFixed(2) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Total Result -->
      <div class="total-result-box">
        <div class="res-item">
          <div class="res-lbl">Total PV of CF (1-10 Years)</div>
          <div class="res-val">{{ calculatedResult.totalPVofCF.toFixed(2) }}</div>
        </div>
        <div class="res-operator">+</div>
        <div class="res-item">
          <div class="res-lbl">Terminal PV</div>
          <div class="res-val">{{ calculatedResult.terminalPV.toFixed(2) }}</div>
        </div>
        <div class="res-operator">=</div>
        <div class="res-item highlight">
          <div class="res-lbl">Total Firm Value</div>
          <div class="res-val">{{ calculatedResult.totalValue.toFixed(2) }}</div>
        </div>
      </div>

      <!-- Sliders -->
      <div class="controls-grid">
        <div class="control-row">
          <div class="control-info">
            <label>Initial Profit/CF</label>
            <span>首年现金流基础</span>
          </div>
          <input type="range" min="1" max="100" step="1" v-model.number="initialCF" class="slider" />
          <input type="number" v-model.number="initialCF" class="val-input" />
        </div>

        <div class="control-row">
          <div class="control-info">
            <label>Stage 1 Growth (%)</label>
            <span>第一阶段高速增长率</span>
          </div>
          <input type="range" min="0" max="100" step="1" v-model.number="stage1Growth" class="slider" />
          <input type="number" v-model.number="stage1Growth" class="val-input" />
        </div>

        <div class="control-row">
          <div class="control-info">
            <label>Stage 1 Years</label>
            <span>高速增长期年数 (1~9)</span>
          </div>
          <input type="range" min="1" max="9" step="1" v-model.number="stage1Years" class="slider" />
          <input type="number" v-model.number="stage1Years" class="val-input" />
        </div>

        <div class="control-row">
          <div class="control-info">
            <label>Terminal Growth (%)</label>
            <span>永续阶段增长率 (低于WACC)</span>
          </div>
          <input type="range" min="0" max="10" step="0.5" v-model.number="terminalGrowth" class="slider" />
          <input type="number" v-model.number="terminalGrowth" class="val-input" />
        </div>

        <div class="control-row">
          <div class="control-info">
            <label>WACC (%)</label>
            <span>折现率/要求回报率</span>
          </div>
          <input type="range" min="5" max="20" step="0.5" v-model.number="wacc" class="slider" />
          <input type="number" v-model.number="wacc" class="val-input" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ThreeStageDCF',
  setup() {
    // Inputs
    const initialCF = ref(10)
    const stage1Growth = ref(30)
    const stage1Years = ref(5)
    const terminalGrowth = ref(5)
    const wacc = ref(8)

    const calculatedResult = computed(() => {
      const g1 = stage1Growth.value / 100
      const gn = terminalGrowth.value / 100
      const r = wacc.value / 100
      const y1 = stage1Years.value
      
      const totalExplicitYears = 10
      const transitionYears = totalExplicitYears - y1
      const yearlyDecrement = transitionYears > 0 ? (g1 - gn) / transitionYears : 0

      let currentProfit = initialCF.value
      let totalPVofCF = 0
      const yearlyData = []

      let stage1PV = 0
      let stage2PV = 0

      for (let year = 1; year <= totalExplicitYears; year++) {
        let currentGrowth = 0
        let phaseName = ''
        let phaseClass = ''

        if (year <= y1) {
          currentGrowth = g1
          phaseName = 'Stage 1'
          phaseClass = 'phase1'
        } else {
          // Linear interpolation for Stage 2
          const stepsInTransition = year - y1
          currentGrowth = g1 - yearlyDecrement * stepsInTransition
          phaseName = 'Stage 2'
          phaseClass = 'phase2'
        }

        currentProfit = currentProfit * (1 + currentGrowth)
        const pv = currentProfit / Math.pow(1 + r, year)
        
        totalPVofCF += pv
        if (year <= y1) {
          stage1PV += pv
        } else {
          stage2PV += pv
        }

        yearlyData.push({
          year,
          phaseName,
          phaseClass,
          growth: currentGrowth,
          profit: currentProfit,
          pv: pv
        })
      }

      // Terminal Value (Calculated at year 10, discounted 10 years)
      const year11Profit = currentProfit * (1 + gn)
      // Safety check: WACC must be > Terminal Growth
      let terminalValue = 0
      if (r > gn) {
        terminalValue = year11Profit / (r - gn)
      }
      const terminalPV = terminalValue / Math.pow(1 + r, totalExplicitYears)
      
      const totalValue = totalPVofCF + terminalPV

      return {
        yearlyData,
        totalPVofCF,
        terminalPV,
        totalValue,
        stage1PV,
        stage2PV
      }
    })

    const phase1Ratio = computed(() => {
      const total = calculatedResult.value.totalValue
      if (total === 0) return 0
      return (calculatedResult.value.stage1PV / total) * 100
    })

    const phase2Ratio = computed(() => {
      const total = calculatedResult.value.totalValue
      if (total === 0) return 0
      return (calculatedResult.value.stage2PV / total) * 100
    })

    const terminalRatio = computed(() => {
      const total = calculatedResult.value.totalValue
      if (total === 0) return 0
      return (calculatedResult.value.terminalPV / total) * 100
    })

    return {
      initialCF,
      stage1Growth,
      stage1Years,
      terminalGrowth,
      wacc,
      calculatedResult,
      phase1Ratio,
      phase2Ratio,
      terminalRatio
    }
  }
}
</script>

<style scoped>
.valuation-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: var(--text-primary);
}

.glass-card {
  background: rgba(20, 25, 35, 0.6);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  padding: 24px 32px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.intro-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.badge {
  background: rgba(0, 242, 254, 0.1);
  color: var(--accent-cyan);
  border: 1px solid rgba(0, 242, 254, 0.2);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.intro-desc {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.formula-box {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  padding: 20px;
}

.rule-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-bullets li {
  position: relative;
  padding-left: 20px;
}

.rule-bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-blue);
}

.rule-bullets p {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 4px;
  margin-bottom: 0;
}

/* Calculator Section */
.calc-card {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 16px;
  margin: 0;
}

/* Chart */
.chart-legend {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: var(--text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.dot.phase1 { background: #3b82f6; }
.dot.phase2 { background: #10b981; }
.dot.terminal { background: #f59e0b; }

.stacked-chart-container {
  margin-top: 10px;
}

.stacked-bar {
  display: flex;
  height: 48px;
  border-radius: 4px;
  overflow: hidden;
  background: rgba(255,255,255,0.05);
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  transition: width 0.3s ease;
  overflow: hidden;
  white-space: nowrap;
}

.bar-segment.phase1 { background: #3b82f6; }
.bar-segment.phase2 { background: #10b981; }
.bar-segment.terminal { background: #f59e0b; }

.chart-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 12px;
  font-family: monospace;
}

.axis-label {
  text-align: right;
  color: var(--text-muted);
  font-size: 11px;
  margin-top: 4px;
}

/* Table */
.data-table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-glass);
}

.dcf-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: right;
}

.dcf-table th, .dcf-table td {
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.dcf-table th {
  background: rgba(0,0,0,0.3);
  color: var(--text-secondary);
  font-weight: 500;
  text-align: right;
}

.dcf-table th:first-child, .dcf-table td:first-child {
  text-align: left;
}

.row-phase1 { background: rgba(59, 130, 246, 0.1); }
.row-phase2 { background: rgba(16, 185, 129, 0.1); }

.dcf-table tfoot td {
  font-weight: 600;
  background: rgba(0,0,0,0.2);
}

.t-right {
  text-align: right !important;
}

/* Total Result Summary */
.total-result-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: rgba(0,0,0,0.2);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid var(--border-glass);
}

.res-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.res-item.highlight {
  color: var(--accent-cyan);
}

.res-lbl {
  font-size: 12px;
  color: var(--text-secondary);
}

.res-item.highlight .res-lbl {
  color: var(--accent-cyan);
  opacity: 0.8;
}

.res-val {
  font-size: 24px;
  font-weight: 700;
  font-family: monospace;
}

.res-operator {
  font-size: 24px;
  color: var(--text-muted);
  font-weight: 300;
}

/* Controls */
.controls-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 20px;
  background: rgba(0,0,0,0.2);
  padding: 12px 20px;
  border-radius: 8px;
}

.control-info {
  width: 200px;
  display: flex;
  flex-direction: column;
}

.control-info label {
  font-size: 14px;
  font-weight: 500;
}

.control-info span {
  font-size: 11px;
  color: var(--text-muted);
}

.slider {
  flex-grow: 1;
  accent-color: var(--accent-cyan);
}

.val-input {
  width: 80px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-glass);
  color: #fff;
  padding: 6px 12px;
  border-radius: 6px;
  text-align: center;
  font-family: monospace;
  font-size: 14px;
}

.val-input:focus {
  outline: none;
  border-color: var(--accent-cyan);
}
</style>
