const express = require('express');
const router = express.Router();
const dbService = require('../db');

// 获取所有标签
router.get('/', (req, res) => {
  try {
    const tags = dbService.getAllTags();
    res.json({ success: true, data: tags });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 新增标签
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;
    const tag = dbService.addTag({ name, color });
    res.status(201).json({ success: true, data: tag, message: '标签添加成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 修改标签
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, color } = req.body;
    const count = dbService.updateTag(id, { name, color });
    if (count > 0) {
      res.json({ success: true, message: '标签修改成功' });
    } else {
      res.status(404).json({ success: false, message: '未找到该标签' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 删除标签
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const count = dbService.deleteTag(id);
    if (count > 0) {
      res.json({ success: true, message: '标签删除成功' });
    } else {
      res.status(404).json({ success: false, message: '未找到该标签' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
