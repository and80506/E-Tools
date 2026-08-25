#!/usr/bin/env node
const db = require('../server/db');

// 这是一份用于演示的全局复盘笔记种子数据模板
const data = {
  "2024-01-01": "今日大盘震荡，重点关注高股息板块。",
  "2024-01-02": "医药板块异动，可以适度建仓观察。"
};

async function seed() {
  for (const [date, content] of Object.entries(data)) {
    if (typeof db.updateDailyReview === 'function') {
      db.updateDailyReview(date, content);
    }
  }
  console.log('Seed daily reviews complete (Example Data)!');
}

seed();
