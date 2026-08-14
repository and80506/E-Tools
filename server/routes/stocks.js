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

module.exports = router;
