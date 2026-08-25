#!/usr/bin/env node
const db = require('../server/db');

// 这是一份用于演示的交易记录种子数据模板
const testData = [
  { trade_date: '2024-01-10', name: '贵州茅台', code: '600519', type: 'buy', quantity: 100, unit: '股', reason: '长期看好，底仓建立', return_rate: '', notes: '' },
  { trade_date: '2024-02-15', name: '腾讯控股', code: '00700', type: 'buy', quantity: 500, unit: '股', reason: '估值进入合理区间', return_rate: '', notes: '港股' },
  { trade_date: '2024-05-20', name: '贵州茅台', code: '600519', type: 'sell', quantity: 50, unit: '股', reason: '阶段性止盈', return_rate: '25.5%', notes: '减半仓' }
];

testData.forEach(trade => {
  try {
    db.addTradeRecord(trade);
    console.log('Inserted:', trade.name, trade.trade_date);
  } catch(e) {
    console.error('Error inserting:', trade.name, e.message);
  }
});
console.log('Done seeding trades (Example Data).');
