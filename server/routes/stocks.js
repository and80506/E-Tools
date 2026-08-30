const express = require('express');
const router = express.Router();
const dbService = require('../db');

// 获取自选股列表
router.get('/stocks', (req, res) => {
  try {
    const stocks = dbService.getAllStocks();
    res.json({ success: true, data: stocks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 添加单支股票
router.post('/stocks', (req, res) => {
  try {
    const { code, name, notes } = req.body;
    const newStock = dbService.addStock({ code, name, notes });
    res.status(201).json({ success: true, data: newStock, message: '添加成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 批量删除股票
router.post('/stocks/delete-batch', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要删除的股票ID列表' });
    }
    const count = dbService.deleteStocks(ids);
    res.json({ success: true, deletedCount: count, message: `成功删除 ${count} 项` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 删除单支股票
router.delete('/stocks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const count = dbService.deleteStocks([id]);
    if (count > 0) {
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(404).json({ success: false, message: '未找到该股票' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 修改单支股票
router.put('/stocks/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { code, name } = req.body;
    const result = dbService.updateStock(id, { code, name });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 批量导入
router.post('/stocks/import', (req, res) => {
  try {
    const { stocks, replace = false } = req.body;
    if (!Array.isArray(stocks)) {
      return res.status(400).json({ success: false, message: '数据格式错误，需为数组' });
    }
    const result = dbService.importStocks(stocks, replace);
    res.json({ 
      success: true, 
      data: result,
      message: `导入完成：成功新增 ${result.added} 支，跳过重复/无效 ${result.skipped} 支` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 恢复默认自选股
router.post('/stocks/reset', (req, res) => {
  try {
    const result = dbService.resetToDefault();
    const list = dbService.getAllStocks();
    res.json({ 
      success: true, 
      data: list,
      message: `已重置为默认自选股（共 ${result.added} 支）` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 更新复盘数据
router.put('/stocks/:id/review', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { review_date, review_content } = req.body;
    const count = dbService.updateReview(id, { review_date, review_content });
    if (count > 0) {
      res.json({ success: true, message: '复盘更新成功' });
    } else {
      res.status(404).json({ success: false, message: '未找到该股票' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 更新自选股关联标签
router.put('/stocks/:id/tags', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { tags } = req.body;
    const count = dbService.setStockTags(id, tags);
    res.json({ success: true, message: '关联标签成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== FCF 计算 ==================

// 辅助函数：根据代码获取 secid (1开头是沪市，0开头是深市)
function getSecId(code) {
  const upperCode = String(code).toUpperCase();
  if (upperCode.startsWith('SH')) {
    return '1.' + upperCode.substring(2);
  } else if (upperCode.startsWith('SZ') || upperCode.startsWith('BJ')) {
    return '0.' + upperCode.substring(2);
  }
  // 回退逻辑，根据数字判断
  let num = upperCode.replace(/[^0-9]/g, '');
  if (num.startsWith('6')) return '1.' + num;
  return '0.' + num;
}

// 获取股票 TTM 企业自由现金流 / 股权市值
router.get('/stocks/:code/fcf', async (req, res) => {
  try {
    const rawCode = req.params.code;
    const secid = getSecId(rawCode);
    const numCode = rawCode.replace(/[^0-9]/g, '');

    // 1. 获取总市值
    let marketCap = null;
    try {
      const mcUrl = `http://push2.eastmoney.com/api/qt/stock/get?ut=fa5fd1943c7b386f172d6893dbfba10b&fltt=2&invt=2&fields=f116&secid=${secid}`;
      const mcRes = await fetch(mcUrl);
      const mcJson = await mcRes.json();
      if (mcJson && mcJson.data && mcJson.data.f116) {
        marketCap = parseFloat(mcJson.data.f116);
      }
    } catch (e) {
      console.error('获取市值失败', e);
    }

    if (!marketCap) {
      return res.status(400).json({ success: false, message: '未能获取到该股票的总市值数据' });
    }

    // 2. 获取最近4个季度的财报日期 (现金流量表)
    const datesUrl = `http://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/xjllbDateAjaxNew?companyType=4&reportDateType=0&code=${secid.startsWith('1.') ? 'SH' : 'SZ'}${numCode}`;
    const datesRes = await fetch(datesUrl, {
      headers: {
        'Referer': `http://emweb.securities.eastmoney.com/pc_hsf10/pages/index.html?type=web&code=${secid.startsWith('1.') ? 'SH' : 'SZ'}${numCode}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const datesJson = await datesRes.json();
    if (!datesJson || !datesJson.data || datesJson.data.length < 4) {
      return res.status(400).json({ success: false, message: '未能获取到最近4个季度的现金流量表数据' });
    }

    // 取需要的报告期日期：最新、去年年报、去年同期
    const latestDateStr = datesJson.data[0].REPORT_DATE;
    const latestDateObj = new Date(latestDateStr);
    const latestYear = latestDateObj.getFullYear();
    const isQ4 = latestDateStr.includes('-12-31');
    
    // 去年年报
    const lastYearAnnualStr = `${latestYear - 1}-12-31 00:00:00`;
    // 去年同期
    const lastYearSamePeriodStr = `${latestYear - 1}-${latestDateStr.substring(5)}`;

    let requiredDates = [latestDateStr];
    if (!isQ4) {
      requiredDates.push(lastYearAnnualStr);
      requiredDates.push(lastYearSamePeriodStr);
    }
    
    // 取前 N 个报告期的日期参数格式化
    const datesParam = requiredDates.map(d => d.split(' ')[0]).join('%2C');

    // 3. 获取数据
    const dataUrl = `http://emweb.securities.eastmoney.com/PC_HSF10/NewFinanceAnalysis/xjllbAjaxNew?companyType=4&reportDateType=0&reportType=1&dates=${datesParam}&code=${secid.startsWith('1.') ? 'SH' : 'SZ'}${numCode}`;
    const dataRes = await fetch(dataUrl, {
      headers: {
        'Referer': `http://emweb.securities.eastmoney.com/pc_hsf10/pages/index.html?type=web&code=${secid.startsWith('1.') ? 'SH' : 'SZ'}${numCode}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const dataJson = await dataRes.json();
    if (!dataJson || !dataJson.data || dataJson.data.length === 0) {
      return res.status(400).json({ success: false, message: '未能获取到财务数据详情' });
    }

    const dataMap = {};
    dataJson.data.forEach(item => {
      dataMap[item.REPORT_DATE] = {
        operate: parseFloat(item.NETCASH_OPERATE || 0),
        capex: parseFloat(item.CONSTRUCT_LONG_ASSET || 0)
      };
    });

    let opSum = 0;
    let capexSum = 0;

    if (isQ4) {
      opSum = dataMap[latestDateStr]?.operate || 0;
      capexSum = dataMap[latestDateStr]?.capex || 0;
    } else {
      const current = dataMap[latestDateStr] || { operate: 0, capex: 0 };
      const lastAnnual = dataMap[lastYearAnnualStr] || { operate: 0, capex: 0 };
      const lastSame = dataMap[lastYearSamePeriodStr] || { operate: 0, capex: 0 };
      
      opSum = current.operate + lastAnnual.operate - lastSame.operate;
      capexSum = current.capex + lastAnnual.capex - lastSame.capex;
    }

    const fcf = opSum - capexSum;
    const fcfYield = (fcf / marketCap) * 100;

    res.json({
      success: true,
      data: {
        operatingCashFlow: opSum,
        capex: capexSum,
        fcf: fcf,
        marketCap: marketCap,
        fcfYield: fcfYield,
        quarters: 4
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '计算FCF时发生服务器错误: ' + err.message });
  }
});

// 获取某个股票的历史所有复盘记录
router.get('/stocks/:id/reviews', (req, res) => {
  try {
    const stockId = parseInt(req.params.id, 10);
    const reviews = dbService.getReviewsByStockId(stockId);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== 交易复盘 API ==================

// 获取所有交易记录
router.get('/trades', (req, res) => {
  try {
    const records = dbService.getTradeRecords();
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 新增交易记录
router.post('/trades', (req, res) => {
  try {
    const record = req.body;
    const newRecord = dbService.addTradeRecord(record);
    res.json({ success: true, data: newRecord });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 删除交易记录
router.delete('/trades/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const changes = dbService.deleteTradeRecord(id);
    if (changes > 0) {
      res.json({ success: true, message: '删除成功' });
    } else {
      res.status(404).json({ success: false, message: '未找到该交易记录' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 更新交易记录
router.put('/trades/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updatedRecord = dbService.updateTradeRecord(id, req.body);
    if (updatedRecord) {
      res.json({ success: true, data: updatedRecord });
    } else {
      res.status(404).json({ success: false, message: '未找到该交易记录' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
