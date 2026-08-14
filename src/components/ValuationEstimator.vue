<template>
  <div class="valuation-container">
    <!-- 顶部导言及核心公式 -->
    <div class="glass-card intro-card">
      <div class="intro-header">
        <h2 class="section-title">戈登股利增长模型反推工具 (改良实操版)</h2>
        <span class="badge">定性参照工具</span>
      </div>
      <p class="intro-desc">
        <strong>核心定位：</strong>只做定性参照分析，帮您把股价“翻译”成市场当前的假设预期，不做直接的买卖交易计算器。
        本改良版修正了原版将理想模型直接等同于现实结论的思维漏洞，加入了硬性的真钱规则与估值三重校验，补全了现实约束。
      </p>

      <div class="formula-box">
        <div class="formula-item">
          <span class="formula-label">原始戈登公式</span>
          <div class="formula-val">P / FCF = 1 / (r - g)</div>
        </div>
        <div class="formula-item">
          <span class="formula-label">反推等价隐含永续增长率 (g)</span>
          <div class="formula-val">g_implied = r - (1 / (P / NFCF))</div>
        </div>
      </div>

      <!-- 动态交互映射卡 -->
      <div class="interactive-map">
        <div class="slider-group">
          <div class="slider-lbl-row">
            <label>主观设定要求回报率 <strong>r</strong>: <strong>{{ (targetReturnRate * 100).toFixed(1) }}%</strong></label>
            <span class="help-hint">※ 根据无风险利率与企业风险主观分档</span>
          </div>
          <input 
            type="range" 
            min="0.06" 
            max="0.18" 
            step="0.005" 
            v-model.number="targetReturnRate" 
            class="slider-input" 
          />
        </div>
        <div class="grid-multipliers">
          <div 
            v-for="item in growthMapping" 
            :key="item.growth" 
            class="multiplier-card"
            :class="{ active: item.growth === 0.05 }"
          >
            <span class="m-growth">等价永续 g: {{ (item.growth * 100).toFixed(0) }}%</span>
            <span class="m-val">{{ item.multiplier > 0 && item.multiplier < 100 ? item.multiplier.toFixed(1) + ' 倍' : '超出模型边界' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入规则指南 (第一步：修正输入项) -->
    <div class="glass-card rules-guide-card">
      <h3 class="card-title">⚠️ 第一步：修正输入项的 3 个硬性规则</h3>
      <div class="rules-grid">
        <div class="rule-box">
          <span class="rule-badge">规则 1</span>
          <h5>分母优先用可持续自由现金流 (NFCF)</h5>
          <p>正常化 = 剔除一次性损益、政府补贴、周期景气高低点、非维持性资本支出。代表企业<strong>维持现状不需要疯狂扩产下</strong>留给股东的真钱。</p>
          <ul class="rule-bullets">
            <li>轻资产/资本开支极低（如茅台）：可用扣非净利润替代。</li>
            <li>重资产/制造业/扩张期：严禁直接用净利润，必须用 FCF。</li>
            <li>周期股：需取 3-5 年周期中枢平均 FCF。</li>
          </ul>
        </div>
        <div class="rule-box">
          <span class="rule-badge">规则 2</span>
          <h5>要求回报率 r 分档赋值，严禁固定 10%</h5>
          <p>r 代表您承担该风险想要的最低年化回报，风险越高 r 越大。同时需根据无风险利率水平上下锚定。</p>
          <div class="r-table-wrapper">
            <table class="r-suggest-table">
              <thead>
                <tr>
                  <th>企业类型</th>
                  <th>建议 r 档位</th>
                  <th>特征</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>永续核心龙头</td>
                  <td class="high-g">8% - 9%</td>
                  <td>竞争格局超稳定，倒闭风险极低</td>
                </tr>
                <tr>
                  <td>普通优质成长企业</td>
                  <td>10% - 11%</td>
                  <td>模式稳固，但行业有正常竞争</td>
                </tr>
                <tr>
                  <td>高波动/容易被颠覆</td>
                  <td class="mid-g">12% - 14%</td>
                  <td>潮玩、迭代快的科技股，被替代风险大</td>
                </tr>
                <tr>
                  <td>强周期/政策扰动</td>
                  <td class="low-g">15% +</td>
                  <td>尾部毁灭风险、生存风险高</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="rule-box">
          <span class="rule-badge">规则 3</span>
          <h5>模型等价永续 g ≠ 现实阶段性增长</h5>
          <p>很多企业价值大头来自前 5-10 年高速增长，随后落入平庸。模型将前段的高成长<strong>“折算压缩”</strong>成了一个假的永续增长率数值。</p>
          <div class="example-quote">
            <p><strong>口诀：</strong>算出来等价 g = 7%，不代表市场赌它永远按 7% 增长；它在现实中很可能是：未来 8 年年复合增长 12%，随后归于 2% 的永续老龄增长。</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 交互式估值计算器 -->
    <div class="calc-grid">
      <!-- 输入端 -->
      <div class="glass-card calc-card">
        <h3 class="card-title">戈登公式反推计算器</h3>
        
        <div class="form-group">
          <label>公司名称</label>
          <input v-model="calcForm.name" type="text" placeholder="例如：贵州茅台" class="input-field" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>当前总市值 (A)</label>
            <div class="input-wrapper">
              <input v-model.number="calcForm.marketCap" type="number" placeholder="请输入" class="input-field" />
              <span class="suffix">亿</span>
            </div>
          </div>
          <div class="form-group">
            <label>正常化可持续现金流 NFCF (B)</label>
            <div class="input-wrapper">
              <input v-model.number="calcForm.cashFlow" type="number" placeholder="已剔除一次性及非维持支出" class="input-field" />
              <span class="suffix">亿</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>选定要求回报率 r (%)</label>
          <select v-model.number="calcForm.returnRate" class="input-field">
            <option :value="8">8% (超级消费龙头，格局极稳)</option>
            <option :value="9">9% (核心龙头，波动极低)</option>
            <option :value="10">10% (普通优质企业，正常风险)</option>
            <option :value="11">11% (成长企业，轻度竞争风险)</option>
            <option :value="12">12% (高波动赛道，如潮玩/一般科技)</option>
            <option :value="14">14% (快速更迭/颠覆风险较高行业)</option>
            <option :value="15">15% (强周期/强监管高风险行业)</option>
          </select>
        </div>

        <button class="btn-primary" @click="calculateValuation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
          反推隐含永续增长率 (g)
        </button>
      </div>

      <!-- 输出报告 (包含三重校验) -->
      <div class="glass-card result-card">
        <h3 class="card-title">市场预期翻译报告</h3>
        <div v-if="!calculatedResult" class="empty-result">
          输入左侧修正后的真钱数据，智能推算并进行“估值三重校验”。
        </div>
        <div v-else class="result-details">
          <div class="result-header">
            <h4>{{ calculatedResult.name }}</h4>
            <span class="badge" :class="safetyClass">{{ safetyLabel }}</span>
          </div>

          <div class="metrics-row">
            <div class="metric">
              <span class="m-lbl">估值倍数 (MarketCap / NFCF)</span>
              <span class="m-v">{{ calculatedResult.multiplier.toFixed(1) }} <span class="sub">倍</span></span>
            </div>
            <div class="metric">
              <span class="m-lbl">模型等价隐含永续增长率 (g_implied)</span>
              <span class="m-v highlight" :class="{ 'red': calculatedResult.impliedGrowth >= calculatedResult.returnRate }">
                {{ calculatedResult.impliedGrowth === -1 ? '不适用' : (calculatedResult.impliedGrowth * 100).toFixed(2) + '%' }}
              </span>
            </div>
          </div>

          <!-- 三重校验卡片 -->
          <div class="validation-container-sub">
            <h5 class="val-title">🔍 估值实操三重校验</h5>
            
            <div class="val-check-item" :class="checkABoundary ? 'pass' : 'fail'">
              <span class="check-indicator"></span>
              <div>
                <strong>校验 A：数学边界校验 (g_implied &lt; r)</strong>
                <p v-if="checkABoundary">通过。当前隐含 g ({{ (calculatedResult.impliedGrowth * 100).toFixed(2) }}%) 小于设定回报率 r ({{ (calculatedResult.returnRate * 100).toFixed(1) }}%)，模型公式在数学上合理有效。</p>
                <p v-else>未通过！等价 g 已接近或超越设定回报率 r。这说明市场定价严重透支，或者主要在博弈远期大故事，单阶段戈登增长模型已失去解释力，切勿当真。</p>
              </div>
            </div>

            <div class="val-check-item warning">
              <span class="check-indicator"></span>
              <div>
                <strong>校验 B：分两段思考现实增长</strong>
                <p>模型隐含 g_implied ({{ calculatedResult.impliedGrowth === -1 ? '--' : (calculatedResult.impliedGrowth * 100).toFixed(2) + '%' }}) 包含中短期高增速的价值折算。请思考：未来 5-10 年公司实际增速能否大幅跑赢该数值？10年后进入成熟期是否能守住 2%~3% 的GDP天花板底线？</p>
              </div>
            </div>

            <div class="val-check-item danger">
              <span class="check-indicator"></span>
              <div>
                <strong>校验 C：尾部消亡风险手动校验</strong>
                <p>戈登模型默认企业长生不老。请手动评估：该公司是否存在行业技术被彻底颠覆、品牌急剧老化、监管铁拳或核心需求瞬间消失的风险？若发生尾部出局，再低的反推增长率也毫无安全边际。</p>
              </div>
            </div>
          </div>

          <div class="analysis-box">
            <p><strong>改良版定性分析结论：</strong></p>
            <p class="analysis-text">{{ analysisText }}</p>
          </div>

          <button class="btn-secondary mini" @click="saveToComparison">
            保存至横向对比表
          </button>
        </div>
      </div>
    </div>

    <!-- 不建议使用该模型的黑名单提示 -->
    <div class="glass-card blacklist-card">
      <h4>🚫 哪些场景不建议使用这套反推工具？</h4>
      <div class="blacklist-grid">
        <div class="bl-item">
          <h5>未产生可持续现金流</h5>
          <p>早期成长股、处于烧钱扩张期的企业。现金流为负时戈登模型直接失效，此时购买是在为未来蓝图或特定叙事下注。</p>
        </div>
        <div class="bl-item">
          <h5>利润来自非经常性损益</h5>
          <p>公司利润是由卖地、一次性资产公允价值变动（如持有股票浮盈）带来，而非主营业务可持续现金流入。</p>
        </div>
        <div class="bl-item">
          <h5>发生重大业务转型</h5>
          <p>历史现金流和当前资本开支方向已经彻底失去连续性与指导价值，模型输入的 B 值无参考意义。</p>
        </div>
        <div class="bl-item">
          <h5>强周期极度景气/萧条期</h5>
          <p>在没有做 3-5 年正常化中枢处理的情况下，单年利润严重失真，直接输入将得出极其荒谬的极端结论。</p>
        </div>
      </div>
      <div class="blacklist-tip">
        ※ 遇到上述四大场景，请直接放弃单阶段反推，转而使用两阶段贴现模型（DCF）做详细的增长情景预估。
      </div>
    </div>

    <!-- 横向个股对比表 -->
    <div v-if="comparisonList.length > 0" class="glass-card comparison-section animate-slide-down">
      <div class="comparison-header">
        <h3 class="card-title">估值横向对比池</h3>
        <button class="btn-danger mini" @click="clearComparison">清空对比池</button>
      </div>
      <div class="table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>公司名称</th>
              <th>市值 (亿)</th>
              <th>正常化 NFCF (亿)</th>
              <th>当前倍数</th>
              <th>要求回报率 r</th>
              <th>隐含永续 g_implied</th>
              <th>数学校验 (g &lt; r)</th>
              <th>估值定性偏向</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in comparisonList" :key="item.id">
              <td class="name-td">{{ item.name }}</td>
              <td>{{ item.marketCap }} 亿</td>
              <td>{{ item.cashFlow }} 亿</td>
              <td>{{ item.multiplier.toFixed(1) }} 倍</td>
              <td>{{ (item.returnRate * 100).toFixed(1) }}%</td>
              <td class="growth-td">{{ item.impliedGrowth === -1 ? '不适用' : (item.impliedGrowth * 100).toFixed(2) + '%' }}</td>
              <td>
                <span class="badge" :class="item.impliedGrowth < item.returnRate ? 'up' : 'danger'">
                  {{ item.impliedGrowth < item.returnRate ? '通过' : '不通过' }}
                </span>
              </td>
              <td>
                <span class="badge" :class="getSafetyClass(item.impliedGrowth, item.returnRate)">
                  {{ getSafetyLabel(item.impliedGrowth, item.returnRate) }}
                </span>
              </td>
              <td>
                <button class="btn-danger mini" @click="removeFromComparison(item.id)">移除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 案例对比：原版 vs 改良实操版 -->
    <div class="glass-card cases-section">
      <h3 class="card-title text-center">实战案例研读：原视频逻辑 vs 改良版实操</h3>
      
      <div class="case-tabs">
        <button 
          v-for="c in cases" 
          :key="c.name" 
          class="tab-btn" 
          :class="{ active: activeCase.name === c.name }"
          @click="activeCase = c"
        >
          {{ c.name }}
        </button>
      </div>

      <div class="case-content animate-slide-down">
        <div class="case-comparison-grid">
          <!-- 原版逻辑 -->
          <div class="case-original">
            <h4 class="orig-title">❌ 原版视频估值法 (简单化)</h4>
            <ul class="compare-list">
              <li><strong>输入钱数：</strong>直接用公开净利润数据（如茅台 823 亿）。</li>
              <li><strong>要求回报率：</strong>死板固定 r = 10%。</li>
              <li><strong>计算出的增长率：</strong>{{ activeCase.origG }}</li>
              <li><strong>原版局限：</strong>{{ activeCase.origDefect }}</li>
            </ul>
          </div>
          <!-- 改良实操版 -->
          <div class="case-improved glass-card">
            <h4 class="impr-title">✅ 改良实操版估值法 (定性翻译)</h4>
            <ul class="compare-list">
              <li><strong>输入钱数：</strong>使用正常化可持续现金流（NFCF，如茅台微调为约 {{ activeCase.imprFlow }} 亿）。</li>
              <li><strong>要求回报率：</strong>根据资产风险程度，分档设定 r = {{ activeCase.imprR }}%。</li>
              <li><strong>反推隐含永续增长率：</strong><strong class="highlight-val">{{ activeCase.imprG }}</strong></li>
              <li><strong>三重校验解析：</strong>
                <p class="check-text"><strong>数学：</strong>{{ activeCase.checkA }}</p>
                <p class="check-text"><strong>分段：</strong>{{ activeCase.checkB }}</p>
                <p class="check-text"><strong>尾部风险：</strong>{{ activeCase.checkC }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'ValuationEstimator',
  setup() {
    const targetReturnRate = ref(0.1)

    // 计算永续增长率与对应倍数列表
    const growthMapping = computed(() => {
      const growths = [0.0, 0.03, 0.05, 0.07, 0.09]
      const returnRate = targetReturnRate.value
      return growths.map(g => {
        let mult = -1
        if (returnRate > g) {
          mult = 1 / (returnRate - g)
        }
        return { growth: g, multiplier: mult }
      })
    })

    // 估值计算器表单
    const calcForm = ref({
      name: '',
      marketCap: null,
      cashFlow: null,
      returnRate: 10
    })

    const calculatedResult = ref(null)
    const comparisonList = ref([])

    const calculateValuation = () => {
      const { name, marketCap, cashFlow, returnRate } = calcForm.value
      if (!name || !marketCap || !cashFlow) {
        alert('请完整填写公司名称、市值和正常化可持续现金流')
        return
      }

      const r = returnRate / 100

      if (cashFlow <= 0) {
        calculatedResult.value = {
          name,
          marketCap,
          cashFlow,
          returnRate: r,
          multiplier: -1,
          impliedGrowth: -1,
          isNegative: true
        }
        return
      }

      const mult = marketCap / cashFlow
      const impliedG = r - (1 / mult)

      calculatedResult.value = {
        name,
        marketCap,
        cashFlow,
        returnRate: r,
        multiplier: mult,
        impliedGrowth: impliedG,
        isNegative: false
      }
    }

    const saveToComparison = () => {
      if (calculatedResult.value) {
        if (comparisonList.value.some(item => item.name === calculatedResult.value.name)) {
          alert('对比池中已存在该公司')
          return
        }
        comparisonList.value.push({
          id: Date.now(),
          ...calculatedResult.value
        })
      }
    }

    const removeFromComparison = (id) => {
      comparisonList.value = comparisonList.value.filter(item => item.id !== id)
    }

    const clearComparison = () => {
      comparisonList.value = []
    }

    // 自动判定安全等级 (包含 r 依赖)
    const getSafetyLabel = (growth, r = 0.1) => {
      if (growth === -1) return '公式失效(未来预期定价)'
      if (growth >= r) return '估值溢出(模型失效)'
      
      const margin = r - growth
      // 如果要求回报率与隐含增长差距很大，说明要求的增长非常低，安全边际极高
      if (growth < 0.03) return '高安全边际'
      if (growth <= 0.055) return '合理估值区间'
      if (growth <= 0.075) return '估值偏高，需警惕'
      return '高估值(高成长陷阱)'
    }

    const getSafetyClass = (growth, r = 0.1) => {
      if (growth === -1) return 'down'
      if (growth >= r) return 'danger'
      if (growth < 0.03) return 'up'
      if (growth <= 0.055) return 'neutral'
      if (growth <= 0.075) return 'warn'
      return 'danger'
    }

    const safetyLabel = computed(() => {
      if (!calculatedResult.value) return ''
      return getSafetyLabel(calculatedResult.value.impliedGrowth, calculatedResult.value.returnRate)
    })

    const safetyClass = computed(() => {
      if (!calculatedResult.value) return ''
      return getSafetyClass(calculatedResult.value.impliedGrowth, calculatedResult.value.returnRate)
    })

    // 数学边界校验 A
    const checkABoundary = computed(() => {
      if (!calculatedResult.value) return false
      if (calculatedResult.value.isNegative) return false
      return calculatedResult.value.impliedGrowth < calculatedResult.value.returnRate
    })

    const analysisText = computed(() => {
      if (!calculatedResult.value) return ''
      if (calculatedResult.value.isNegative) {
        return `当前公司的可持续自由现金流为负，这意味着戈登公式（反推版）无法在此适用。当前股价并不反映当下盈利，而是基于公司未来扭亏为盈或行业蓝图带来的中远期高维预期。请放弃反推，转用详细两阶段 DCF 进行估值定价。`
      }

      const growthPct = (calculatedResult.value.impliedGrowth * 100).toFixed(2)
      const name = calculatedResult.value.name
      const mult = calculatedResult.value.multiplier.toFixed(1)
      const r = calculatedResult.value.returnRate

      if (calculatedResult.value.impliedGrowth >= r) {
        return `未通过数学边界校验！计算出的隐含增长率为 ${growthPct}%，已接近或超过了设定的要求回报率 r (${(r * 100).toFixed(1)}%)。这表明该股估值处于极度高估状态，单阶段模型在此刻崩溃。市场可能处于极度狂热阶段，或者在强烈预期未来几年的超常增长故事。`
      }

      let qualitativeText = ''
      if (calculatedResult.value.impliedGrowth < 0.03) {
        qualitativeText = `在主观要求回报率 ${(r * 100).toFixed(1)}% 的假设下，该股反推等价永续 g 为 ${growthPct}%，估值仅为 ${mult} 倍。这表明市场对它的增长预期定调极低。若该企业未来长周期内的自由现金流能大概率维持现状（即真实增长率 ≥0% 且能永续生存），则此股价具备了丰厚的安全垫，下行空间有限。`
      } else if (calculatedResult.value.impliedGrowth <= 0.055) {
        qualitativeText = `在 ${(r * 100).toFixed(1)}% 要求回报率假设下，该股等价永续 g 为 ${growthPct}%。这一数字和长期的GDP名义增速类似，对于核心壁垒深厚的龙头股，该等价永续率说明市场给出了较为公允、合理的稳健估值。`
      } else if (calculatedResult.value.impliedGrowth <= 0.075) {
        qualitativeText = `当前等价永续增长率反推结果为 ${growthPct}%。它高于整体实体经济长期永续增速，这代表估值中相当大的一部分价值来源于未来 5-10 年中短期内的高增速业绩兑现。需要重点评估该企业未来 10 年高成长能否切实如期兑现。`
      } else {
        qualitativeText = `等价永续增长率高达 ${growthPct}%，当前估值倍数为 ${mult} 倍。一般情况下没有哪家大型企业能在无限永续周期中跑赢 GDP 增速如此之多。这通常指示了高度透支的市场乐观预期与估值泡沫，需要防范增速换挡带来的剧烈杀估值风险。`
      }

      return `${qualitativeText} (※ 请务必手动追加核对校验 B 中短期增长和校验 C 被替代/倒闭的尾部灭绝风险。)`
    })

    // 改良版与原版案例对照库
    const cases = [
      {
        name: '贵州茅台',
        origG: '10% - 1 / 20.5 ≈ 5.10%',
        origDefect: '使用当年归母净利润，混淆现金流；统一固定 10% 的高回报率，忽视了茅台商业格局极稳、可以给到更低 r 档位的情况；断定市场预期永远 5.1% 增长，忽视了中短期高增长的压缩折算。',
        imprFlow: '800',
        imprR: '9',
        imprG: '9% - 1 / 21.1 ≈ 4.26%',
        checkA: '4.26% < 9%（通过数学校验）',
        checkB: '4.26% 并不是市场赌茅台永远保持这个速度增长，而是未来中短期高个位数增长与成熟期 2%-3% 永续增长的等价折算结果。',
        checkC: '基本面稳健。需警惕代际变迁与人口结构对长期空间的潜在压制。结论：估值处于合理区间，反映了合理的中期复利能力。'
      },
      {
        name: '苹果公司',
        origG: '10% - 1 / 34 ≈ 7.10%',
        origDefect: '无脑取值 10%；直接对标 GDP 宣称其高估，却未解构苹果近 10 年利用生态壁垒实现强劲自由现金流变现的客观现实。',
        imprFlow: '1292',
        imprR: '9',
        imprG: '9% - 1 / 34 ≈ 6.06%',
        checkA: '6.06% < 9%（通过数学校验）',
        checkB: '在 9% 要求回报下等价 g 为 6.06%，明显高于 3% 的成熟期 GDP 天花板。这说明股价中有超过一半的价值是建立在未来 5-10 年内苹果服务生态高个位数增长的兑现之上。',
        checkC: '需注意硬件设备更迭（如AI手机）成败以及地缘政策壁垒带来的尾部硬件收入腰斩风险。'
      },
      {
        name: '特斯拉',
        origG: '分母为负，直接报错',
        origDefect: '原视频仅说明“公式失效，在为故事定价”，未指出对于重资产制造业，单年现金流为负时应该如何做估值框架上的降级与切换决策。',
        imprFlow: '-11 (FCF为负)',
        imprR: '12',
        imprG: '不适用 (FCF为负)',
        checkA: '不通过。分母为负表明企业处于高资本开支扩张期或尚未实现稳定自由现金流。',
        checkB: '当前无法用戈登模型反推。特斯拉的股价主要受未来的 Robotaxi 愿景和机器人等远期故事溢价定价，并非当下现金流所能解释。',
        checkC: '高资本开支和技术快速迭代的赛道竞争极度剧烈，尾部风险很大。建议直接弃用戈登模型，使用两阶段 DCF 进行概率情景贴现。'
      },
      {
        name: '泡泡玛特',
        origG: '10% - 1 / 17.5 ≈ 4.28%',
        origDefect: '固定 10% 估值，完全漏掉了段永平“看不懂”到“看懂”的定性转换思考——即商业模式判断、企业家优劣评估是输入公式前的前提，而不是倒过来。',
        imprFlow: '18',
        imprR: '12',
        imprG: '12% - 1 / 17.5 ≈ 6.28% (若以段氏 10% 回报算为 2.3% 或 4.28%)',
        checkA: '数学校验通过。',
        checkB: '暴跌之后由于市值压缩，使得隐含永续率被拉得极低。如果公司实际未来利润不低于现状（即增长率 ≥0%），这个极低的等价隐含增长就提供了巨大的安全垫。',
        checkC: '潮玩行业被替代和老化风险大（高波动赛道建议 r 设定在 12%-14%）。段氏正是确认了创始人能力且估值杀到即便零增长也提供不错回报后，方才定性决策大举买入。'
      }
    ]

    const activeCase = ref(cases[0])

    return {
      targetReturnRate,
      growthMapping,
      calcForm,
      calculatedResult,
      comparisonList,
      calculateValuation,
      saveToComparison,
      removeFromComparison,
      clearComparison,
      getSafetyLabel,
      getSafetyClass,
      safetyLabel,
      safetyClass,
      checkABoundary,
      analysisText,
      cases,
      activeCase
    }
  }
}
</script>

<style scoped>
.valuation-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.intro-card {
  padding: 32px;
}

.intro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(90deg, #fff, var(--text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  border: 1px solid var(--border-glass);
}

.badge.up {
  background: rgba(16, 185, 129, 0.15);
  color: var(--stock-down);
  border-color: rgba(16, 185, 129, 0.3);
}

.badge.neutral {
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-blue);
  border-color: rgba(59, 130, 246, 0.3);
}

.badge.warn {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.badge.danger {
  background: rgba(239, 68, 68, 0.15);
  color: var(--stock-up);
  border-color: rgba(239, 68, 68, 0.3);
}

.badge.down {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.intro-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 24px;
}

.formula-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .formula-box {
    grid-template-columns: 1fr;
  }
}

.formula-item {
  padding: 16px;
  background: rgba(24, 34, 53, 0.4);
  border-radius: 12px;
  border: 1px solid var(--border-glass);
}

.formula-label {
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 6px;
}

.formula-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent-cyan);
  font-family: monospace;
}

.interactive-map {
  background: rgba(24, 34, 53, 0.2);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--border-glass);
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.slider-lbl-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-lbl-row label {
  font-size: 13px;
  color: var(--text-secondary);
}

.help-hint {
  font-size: 11px;
  color: var(--text-muted);
}

.slider-input {
  width: 100%;
  accent-color: var(--accent-cyan);
  height: 6px;
  border-radius: 3px;
  outline: none;
  background: var(--bg-tertiary);
}

.grid-multipliers {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .grid-multipliers {
    grid-template-columns: repeat(2, 1fr);
  }
}

.multiplier-card {
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
  transition: var(--transition-smooth);
}

.multiplier-card.active {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.15);
}

.m-growth {
  font-size: 11px;
  color: var(--text-secondary);
}

.m-val {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

/* 修正规则指南卡片 */
.rules-guide-card {
  padding: 28px;
  border-color: rgba(245, 158, 11, 0.2);
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 16px;
}

@media (max-width: 900px) {
  .rules-grid {
    grid-template-columns: 1fr;
  }
}

.rule-box {
  position: relative;
  background: rgba(24, 34, 53, 0.3);
  border: 1px solid var(--border-glass);
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-badge {
  position: absolute;
  top: -12px;
  left: 16px;
  background: var(--bg-tertiary);
  color: var(--accent-cyan);
  border: 1px solid var(--accent-cyan);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.rule-box h5 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 4px;
}

.rule-box p {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.rule-bullets {
  padding-left: 16px;
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.r-table-wrapper {
  margin-top: 4px;
}

.r-suggest-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.r-suggest-table th, .r-suggest-table td {
  padding: 4px 6px;
  border-bottom: 1px solid var(--border-glass);
  text-align: left;
}

.r-suggest-table th {
  color: var(--text-muted);
}

.example-quote {
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid var(--accent-blue);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

/* 计算器区域 */
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

.calc-card, .result-card {
  padding: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.suffix {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: var(--text-muted);
}

.calc-card button {
  margin-top: 10px;
  width: 100%;
  justify-content: center;
}

.empty-result {
  display: flex;
  height: 200px;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  border: 1px dashed var(--border-glass);
  border-radius: 12px;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-header h4 {
  font-size: 18px;
  font-weight: 700;
}

.metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.metric {
  padding: 16px;
  background: rgba(24, 34, 53, 0.4);
  border-radius: 10px;
  border-left: 3px solid var(--accent-blue);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.m-lbl {
  font-size: 11px;
  color: var(--text-secondary);
}

.m-v {
  font-size: 24px;
  font-weight: 700;
}

.m-v.highlight {
  color: var(--accent-cyan);
}

.m-v.highlight.red {
  color: var(--stock-up) !important;
}

.m-v .sub {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-muted);
}

/* 三重校验样式 */
.validation-container-sub {
  padding: 16px;
  background: rgba(24, 34, 53, 0.3);
  border-radius: 12px;
  border: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.val-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-cyan);
}

.val-check-item {
  display: flex;
  gap: 12px;
  font-size: 12px;
  line-height: 1.5;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.01);
}

.check-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.val-check-item.pass .check-indicator {
  background: var(--stock-down);
  box-shadow: 0 0 6px var(--stock-down);
}

.val-check-item.fail .check-indicator {
  background: var(--stock-up);
  box-shadow: 0 0 6px var(--stock-up);
}

.val-check-item.warning .check-indicator {
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

.val-check-item.danger .check-indicator {
  background: #ec4899;
  box-shadow: 0 0 6px #ec4899;
}

.val-check-item strong {
  display: block;
  margin-bottom: 2px;
}

.val-check-item p {
  color: var(--text-secondary);
}

.analysis-box {
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.analysis-text {
  color: var(--text-secondary);
  margin-top: 6px;
}

/* 黑名单提示 */
.blacklist-card {
  padding: 24px;
  border-color: rgba(239, 68, 68, 0.15);
}

.blacklist-card h4 {
  font-size: 15px;
  color: #f87171;
  font-weight: 700;
  margin-bottom: 16px;
}

.blacklist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .blacklist-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 600px) {
  .blacklist-grid {
    grid-template-columns: 1fr;
  }
}

.bl-item {
  background: rgba(24, 34, 53, 0.3);
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bl-item h5 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.bl-item p {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}

.blacklist-tip {
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

/* 对比表 */
.comparison-section {
  padding: 24px;
}

.comparison-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-wrapper {
  overflow-x: auto;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
}

.comparison-table th, 
.comparison-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-glass);
}

.comparison-table th {
  background: rgba(24, 34, 53, 0.4);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 12px;
}

.name-td {
  font-weight: 600;
}

.growth-td {
  font-weight: 700;
  color: var(--accent-cyan);
  font-family: monospace;
}

/* 案例区域 */
.cases-section {
  padding: 32px;
}

.text-center {
  text-align: center;
}

.case-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 28px;
}

.tab-btn {
  background: rgba(24, 34, 53, 0.5);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  padding: 10px 24px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.tab-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tab-btn.active {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  color: #050508;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
}

.case-comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .case-comparison-grid {
    grid-template-columns: 1fr;
  }
}

.case-original, .case-improved {
  padding: 24px;
}

.case-improved {
  background: rgba(24, 34, 53, 0.3);
  border-color: rgba(0, 242, 254, 0.15);
}

.orig-title {
  font-size: 15px;
  font-weight: 700;
  color: #f87171;
  margin-bottom: 16px;
}

.impr-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent-cyan);
  margin-bottom: 16px;
}

.compare-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  list-style: none;
}

.compare-list li {
  line-height: 1.6;
  color: var(--text-secondary);
}

.compare-list strong {
  color: var(--text-primary);
}

.highlight-val {
  color: var(--accent-cyan);
  font-size: 16px;
  font-family: monospace;
}

.check-text {
  font-size: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.01);
  border-radius: 6px;
  margin-top: 4px;
}

/* 动效 */
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-slide-down {
  animation: slideDown 0.3s ease-out forwards;
}
</style>
