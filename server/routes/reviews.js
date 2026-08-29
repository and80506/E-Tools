const express = require('express');
const router = express.Router();
const dbService = require('../db');

// 获取所有有记录的日期
router.get('/dates', (req, res) => {
  try {
    const dates = dbService.getReviewDates();
    res.json({ success: true, data: dates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取某日全局复盘
router.get('/daily/:date', (req, res) => {
  try {
    const { date } = req.params;
    const content = dbService.getDailyReview(date);
    res.json({ success: true, data: { date, content } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 保存某日全局复盘
router.put('/daily/:date', (req, res) => {
  try {
    const { date } = req.params;
    const { content } = req.body;
    dbService.updateDailyReview(date, content);
    res.json({ success: true, message: '复盘笔记已保存' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取所有个股的复盘
router.get('/stock/all', (req, res) => {
  try {
    const records = dbService.getAllStockReviews();
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 获取某日所有有复盘的股票
router.get('/stock/:date', (req, res) => {
  try {
    const { date } = req.params;
    const records = dbService.getStockReviewsByDate(date);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 修改某条复盘的日期
router.put('/stock/date/:review_id', (req, res) => {
  try {
    const review_id = parseInt(req.params.review_id, 10);
    const { date } = req.body;
    dbService.updateStockReviewDate(review_id, date);
    res.json({ success: true, message: '复盘日期已修改' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 保存某个股票在某日的复盘
router.put('/stock/:stock_id/:date', (req, res) => {
  try {
    const stock_id = parseInt(req.params.stock_id, 10);
    const { date } = req.params;
    const { content } = req.body;
    dbService.updateStockReview(stock_id, date, content);
    res.json({ success: true, message: '个股复盘已保存' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
