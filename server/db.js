const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'etools.db');

const initialStocks = [
  { code: '600519', name: '贵州茅台' },
  { code: '000858', name: '五粮液' },
  { code: '000333', name: '美的集团' },
  { code: '600887', name: '伊利股份' },
  { code: '601318', name: '中国平安' },
  { code: '00700', name: '腾讯控股' },
  { code: '09988', name: '阿里巴巴-SW' },
  { code: 'AAPL', name: '苹果公司' },
  { code: 'MSFT', name: '微软' },
  { code: 'NVDA', name: '英伟达' },
  { code: 'GOOGL', name: '谷歌' },
  { code: 'TSLA', name: '特斯拉' }
];

let db = null;
let useJsonFallback = false;
const JSON_DB_PATH = path.join(DATA_DIR, 'stocks.json');
const JSON_TAGS_PATH = path.join(DATA_DIR, 'tags.json');
const JSON_STOCK_TAGS_PATH = path.join(DATA_DIR, 'stock_tags.json');
const JSON_DAILY_REVIEWS_PATH = path.join(DATA_DIR, 'daily_reviews.json');
const JSON_STOCK_REVIEWS_PATH = path.join(DATA_DIR, 'stock_reviews.json');
const JSON_TRADE_RECORDS_PATH = path.join(DATA_DIR, 'trade_records.json');

try {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // 初始化表结构
  db.exec(`
    CREATE TABLE IF NOT EXISTS stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      notes TEXT DEFAULT '',
      order_num INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      review_date TEXT DEFAULT '',
      review_content TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3b82f6'
    );
    CREATE TABLE IF NOT EXISTS stock_tags (
      stock_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (stock_id, tag_id),
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS daily_reviews (
      date TEXT PRIMARY KEY,
      content TEXT
    );
    CREATE TABLE IF NOT EXISTS stock_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_id INTEGER NOT NULL,
      review_date TEXT NOT NULL,
      content TEXT,
      FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
      UNIQUE(stock_id, review_date)
    );
    CREATE TABLE IF NOT EXISTS trade_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      trade_date TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      price REAL,
      reason TEXT,
      return_rate TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  db.pragma('foreign_keys = ON');

  // 自动表结构升级检查（如果是由旧版本表启动的）
  const tableInfo = db.prepare("PRAGMA table_info(stocks)").all();
  const hasReviewDate = tableInfo.some(col => col.name === 'review_date');
  if (!hasReviewDate) {
    db.exec(`
      ALTER TABLE stocks ADD COLUMN review_date TEXT DEFAULT '';
      ALTER TABLE stocks ADD COLUMN review_content TEXT DEFAULT '';
    `);
  }

  // 检查是否为空，如果为空则插入初始数据
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM stocks');
  const { count } = countStmt.get();
  if (count === 0) {
    const insertStmt = db.prepare('INSERT OR IGNORE INTO stocks (code, name, order_num) VALUES (?, ?, ?)');
    const insertMany = db.transaction((stocks) => {
      stocks.forEach((s, idx) => insertStmt.run(s.code, s.name, idx + 1));
    });
    insertMany(initialStocks);
  }
} catch (err) {
  console.warn('[DB] SQLite 初始化失败，自动降级为本地 JSON 存储方案:', err.message);
  useJsonFallback = true;
  if (!fs.existsSync(JSON_DB_PATH)) {
    const defaultData = initialStocks.map((s, idx) => ({
      id: idx + 1,
      code: s.code,
      name: s.name,
      notes: '',
      order_num: idx + 1,
      created_at: new Date().toISOString(),
      review_date: '',
      review_content: ''
    }));
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

// JSON Fallback 辅助函数
function readJsonStocks() {
  try {
    const content = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

function writeJsonStocks(data) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function readJsonTags() {
  try { return JSON.parse(fs.readFileSync(JSON_TAGS_PATH, 'utf-8') || '[]'); } catch { return []; }
}
function writeJsonTags(data) {
  fs.writeFileSync(JSON_TAGS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
function readJsonStockTags() {
  try { return JSON.parse(fs.readFileSync(JSON_STOCK_TAGS_PATH, 'utf-8') || '[]'); } catch { return []; }
}
function writeJsonStockTags(data) {
  fs.writeFileSync(JSON_STOCK_TAGS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
function readJsonDailyReviews() {
  try { return JSON.parse(fs.readFileSync(JSON_DAILY_REVIEWS_PATH, 'utf-8') || '{}'); } catch { return {}; }
}
function writeJsonDailyReviews(data) {
  fs.writeFileSync(JSON_DAILY_REVIEWS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
function readJsonStockReviews() {
  try { return JSON.parse(fs.readFileSync(JSON_STOCK_REVIEWS_PATH, 'utf-8') || '[]'); } catch { return []; }
}
function writeJsonStockReviews(data) {
  fs.writeFileSync(JSON_STOCK_REVIEWS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}
function readJsonTradeRecords() {
  try { return JSON.parse(fs.readFileSync(JSON_TRADE_RECORDS_PATH, 'utf-8') || '[]'); } catch { return []; }
}
function writeJsonTradeRecords(data) {
  fs.writeFileSync(JSON_TRADE_RECORDS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

const dbService = {
  // 获取全部股票列表（带标签）
  getAllStocks() {
    if (!useJsonFallback) {
      const stocks = db.prepare('SELECT * FROM stocks ORDER BY order_num ASC, id ASC').all();
      const relations = db.prepare(`
        SELECT st.stock_id, t.id, t.name, t.color 
        FROM stock_tags st 
        JOIN tags t ON st.tag_id = t.id
      `).all();
      const tagsMap = {};
      relations.forEach(r => {
        if (!tagsMap[r.stock_id]) tagsMap[r.stock_id] = [];
        tagsMap[r.stock_id].push({ id: r.id, name: r.name, color: r.color });
      });
      stocks.forEach(s => {
        s.tags = tagsMap[s.id] || [];
      });
      return stocks;
    } else {
      const stocks = readJsonStocks().sort((a, b) => (a.order_num || 0) - (b.order_num || 0) || a.id - b.id);
      const tags = readJsonTags();
      const stockTags = readJsonStockTags();
      const tagsMap = {};
      tags.forEach(t => tagsMap[t.id] = t);
      const relationsMap = {};
      stockTags.forEach(st => {
        if (!relationsMap[st.stock_id]) relationsMap[st.stock_id] = [];
        if (tagsMap[st.tag_id]) {
          relationsMap[st.stock_id].push(tagsMap[st.tag_id]);
        }
      });
      stocks.forEach(s => {
        s.tags = relationsMap[s.id] || [];
      });
      return stocks;
    }
  },

  // 添加单支股票
  addStock({ code, name, notes = '' }) {
    if (!code || !name) {
      throw new Error('股票代码与名称不能为空');
    }
    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    if (!useJsonFallback) {
      const existing = db.prepare('SELECT id FROM stocks WHERE code = ?').get(cleanCode);
      if (existing) {
        throw new Error(`股票代码 [${cleanCode}] 已存在`);
      }
      const maxOrder = db.prepare('SELECT MAX(order_num) as maxOrder FROM stocks').get().maxOrder || 0;
      const result = db.prepare(
        'INSERT INTO stocks (code, name, notes, order_num) VALUES (?, ?, ?, ?)'
      ).run(cleanCode, cleanName, notes, maxOrder + 1);

      return db.prepare('SELECT * FROM stocks WHERE id = ?').get(result.lastInsertRowid);
    } else {
      const list = readJsonStocks();
      if (list.some(s => s.code.toUpperCase() === cleanCode)) {
        throw new Error(`股票代码 [${cleanCode}] 已存在`);
      }
      const newId = list.reduce((max, s) => Math.max(max, s.id || 0), 0) + 1;
      const newOrder = list.reduce((max, s) => Math.max(max, s.order_num || 0), 0) + 1;
      const newStock = {
        id: newId,
        code: cleanCode,
        name: cleanName,
        notes,
        order_num: newOrder,
        created_at: new Date().toISOString(),
        review_date: '',
        review_content: ''
      };
      list.push(newStock);
      writeJsonStocks(list);
      return newStock;
    }
  },

  // 批量删除
  deleteStocks(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return 0;
    if (!useJsonFallback) {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = db.prepare(`DELETE FROM stocks WHERE id IN (${placeholders})`);
      const res = stmt.run(...ids);
      return res.changes;
    } else {
      const list = readJsonStocks();
      const nextList = list.filter(s => !ids.includes(s.id));
      const deletedCount = list.length - nextList.length;
      writeJsonStocks(nextList);
      return deletedCount;
    }
  },

  // 批量导入（支持覆盖或追加）
  importStocks(stocksList, replace = false) {
    if (!Array.isArray(stocksList)) return { added: 0, skipped: 0 };
    
    let added = 0;
    let skipped = 0;

    if (!useJsonFallback) {
      const runTransaction = db.transaction(() => {
        if (replace) {
          db.prepare('DELETE FROM stocks').run();
        }
        const insertStmt = db.prepare('INSERT OR IGNORE INTO stocks (code, name, notes, order_num) VALUES (?, ?, ?, ?)');
        const maxOrderResult = db.prepare('SELECT MAX(order_num) as maxOrder FROM stocks').get();
        let currentOrder = (replace ? 0 : (maxOrderResult.maxOrder || 0));

        stocksList.forEach((s) => {
          if (!s.code || !s.name) {
            skipped++;
            return;
          }
          const code = String(s.code).trim().toUpperCase();
          const name = String(s.name).trim();
          const notes = s.notes || '';
          currentOrder++;
          const res = insertStmt.run(code, name, notes, currentOrder);
          if (res.changes > 0) {
            added++;
          } else {
            skipped++;
          }
        });
      });
      runTransaction();
    } else {
      let list = replace ? [] : readJsonStocks();
      const existingCodes = new Set(list.map(s => s.code.toUpperCase()));
      let currentId = list.reduce((max, s) => Math.max(max, s.id || 0), 0);
      let currentOrder = list.reduce((max, s) => Math.max(max, s.order_num || 0), 0);

      stocksList.forEach(s => {
        if (!s.code || !s.name) {
          skipped++;
          return;
        }
        const code = String(s.code).trim().toUpperCase();
        const name = String(s.name).trim();
        if (existingCodes.has(code)) {
          skipped++;
          return;
        }
        existingCodes.add(code);
        currentId++;
        currentOrder++;
        list.push({
          id: currentId,
          code,
          name,
          notes: s.notes || '',
          order_num: currentOrder,
          created_at: new Date().toISOString(),
          review_date: '',
          review_content: ''
        });
        added++;
      });
      writeJsonStocks(list);
    }

    return { added, skipped };
  },

  // 重置为默认自选股
  resetToDefault() {
    return this.importStocks(initialStocks, true);
  },

  // 更新复盘数据
  updateReview(id, { review_date, review_content }) {
    if (!useJsonFallback) {
      const stmt = db.prepare('UPDATE stocks SET review_date = ?, review_content = ? WHERE id = ?');
      const res = stmt.run(review_date || '', review_content || '', id);
      return res.changes;
    } else {
      const list = readJsonStocks();
      const idx = list.findIndex(s => s.id === id);
      if (idx !== -1) {
        list[idx].review_date = review_date || '';
        list[idx].review_content = review_content || '';
        writeJsonStocks(list);
        return 1;
      }
      return 0;
    }
  },

  // ---------------- 标签管理 API ---------------- //
  getAllTags() {
    if (!useJsonFallback) {
      return db.prepare('SELECT * FROM tags ORDER BY id ASC').all();
    } else {
      return readJsonTags();
    }
  },
  
  addTag({ name, color = '#3b82f6' }) {
    if (!name) throw new Error('标签名不能为空');
    const cleanName = name.trim();
    if (!useJsonFallback) {
      const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(cleanName);
      if (existing) throw new Error('该标签已存在');
      const res = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(cleanName, color);
      return { id: res.lastInsertRowid, name: cleanName, color };
    } else {
      const tags = readJsonTags();
      if (tags.some(t => t.name === cleanName)) throw new Error('该标签已存在');
      const newId = tags.reduce((max, t) => Math.max(max, t.id || 0), 0) + 1;
      const newTag = { id: newId, name: cleanName, color };
      tags.push(newTag);
      writeJsonTags(tags);
      return newTag;
    }
  },

  updateTag(id, { name, color }) {
    const cleanName = name ? name.trim() : null;
    if (!useJsonFallback) {
      const res = db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(cleanName, color, id);
      return res.changes;
    } else {
      const tags = readJsonTags();
      const idx = tags.findIndex(t => t.id === id);
      if (idx !== -1) {
        tags[idx].name = cleanName || tags[idx].name;
        tags[idx].color = color || tags[idx].color;
        writeJsonTags(tags);
        return 1;
      }
      return 0;
    }
  },

  deleteTag(id) {
    if (!useJsonFallback) {
      return db.prepare('DELETE FROM tags WHERE id = ?').run(id).changes;
    } else {
      const tags = readJsonTags();
      const newTags = tags.filter(t => t.id !== id);
      writeJsonTags(newTags);
      const st = readJsonStockTags();
      writeJsonStockTags(st.filter(r => r.tag_id !== id));
      return tags.length - newTags.length;
    }
  },

  // 设置自选股的关联标签 (覆盖式)
  setStockTags(stockId, tagIds) {
    if (!Array.isArray(tagIds)) tagIds = [];
    if (!useJsonFallback) {
      const runTransaction = db.transaction(() => {
        db.prepare('DELETE FROM stock_tags WHERE stock_id = ?').run(stockId);
        const insertStmt = db.prepare('INSERT INTO stock_tags (stock_id, tag_id) VALUES (?, ?)');
        tagIds.forEach(tId => insertStmt.run(stockId, tId));
      });
      runTransaction();
      return tagIds.length;
    } else {
      let st = readJsonStockTags();
      st = st.filter(r => r.stock_id !== stockId);
      tagIds.forEach(tId => {
        st.push({ stock_id: stockId, tag_id: tId });
      });
      writeJsonStockTags(st);
      return tagIds.length;
    }
  },

  // ---------------- 基于日期的复盘管理 API ---------------- //
  getDailyReview(date) {
    if (!useJsonFallback) {
      const row = db.prepare('SELECT content FROM daily_reviews WHERE date = ?').get(date);
      return row ? row.content : '';
    } else {
      const daily = readJsonDailyReviews();
      return daily[date] || '';
    }
  },

  getReviewDates() {
    if (!useJsonFallback) {
      const q1 = db.prepare('SELECT DISTINCT date FROM daily_reviews').all();
      const q2 = db.prepare('SELECT DISTINCT review_date FROM stock_reviews').all();
      const dates = new Set([...q1.map(r => r.date), ...q2.map(r => r.review_date)]);
      return Array.from(dates).sort();
    } else {
      const daily = readJsonDailyReviews();
      const stocks = readJsonStockReviews();
      const dates = new Set([...Object.keys(daily), ...stocks.map(r => r.review_date)]);
      return Array.from(dates).sort();
    }
  },

  updateDailyReview(date, content) {
    if (!useJsonFallback) {
      return db.prepare('INSERT INTO daily_reviews (date, content) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET content = excluded.content').run(date, content).changes;
    } else {
      const daily = readJsonDailyReviews();
      daily[date] = content;
      writeJsonDailyReviews(daily);
      return 1;
    }
  },

  getAllStockReviews() {
    if (!useJsonFallback) {
      return db.prepare(`
        SELECT sr.id as review_id, sr.stock_id, sr.review_date, sr.content, s.name, s.code
        FROM stock_reviews sr
        JOIN stocks s ON sr.stock_id = s.id
        ORDER BY sr.review_date DESC
      `).all();
    } else {
      const stockReviews = readJsonStockReviews();
      const stocks = readJsonStocks();
      const stocksMap = {};
      stocks.forEach(s => stocksMap[s.id] = s);
      
      const mapped = stockReviews.map(r => ({
        review_id: r.id,
        stock_id: r.stock_id,
        review_date: r.review_date,
        content: r.content,
        name: stocksMap[r.stock_id] ? stocksMap[r.stock_id].name : '',
        code: stocksMap[r.stock_id] ? stocksMap[r.stock_id].code : ''
      }));
      return mapped.sort((a, b) => b.review_date.localeCompare(a.review_date));
    }
  },

  getStockReviewsByDate(date) {
    if (!useJsonFallback) {
      return db.prepare(`
        SELECT sr.id as review_id, sr.stock_id, sr.review_date, sr.content, s.name, s.code
        FROM stock_reviews sr
        JOIN stocks s ON sr.stock_id = s.id
        WHERE sr.review_date = ?
      `).all(date);
    } else {
      const stockReviews = readJsonStockReviews();
      const stocks = readJsonStocks();
      const stocksMap = {};
      stocks.forEach(s => stocksMap[s.id] = s);
      
      const filtered = stockReviews.filter(r => r.review_date === date);
      return filtered.map(r => ({
        review_id: r.id,
        stock_id: r.stock_id,
        review_date: r.review_date,
        content: r.content,
        name: stocksMap[r.stock_id] ? stocksMap[r.stock_id].name : '',
        code: stocksMap[r.stock_id] ? stocksMap[r.stock_id].code : ''
      }));
    }
  },

  updateStockReview(stock_id, date, content) {
    if (!useJsonFallback) {
      return db.prepare('INSERT INTO stock_reviews (stock_id, review_date, content) VALUES (?, ?, ?) ON CONFLICT(stock_id, review_date) DO UPDATE SET content = excluded.content').run(stock_id, date, content).changes;
    } else {
      const reviews = readJsonStockReviews();
      const idx = reviews.findIndex(r => r.stock_id === stock_id && r.review_date === date);
      if (idx !== -1) {
        reviews[idx].content = content;
      } else {
        const newId = reviews.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
        reviews.push({
          id: newId,
          stock_id,
          review_date: date,
          content
        });
      }
      writeJsonStockReviews(reviews);
      return 1;
    }
  },

  updateStockReviewDate(review_id, new_date) {
    if (!useJsonFallback) {
      try {
        return db.prepare('UPDATE stock_reviews SET review_date = ? WHERE id = ?').run(new_date, review_id).changes;
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          throw new Error('该日期已存在复盘记录，不可重复');
        }
        throw err;
      }
    } else {
      const reviews = readJsonStockReviews();
      const idx = reviews.findIndex(r => r.id === review_id);
      if (idx !== -1) {
        const stock_id = reviews[idx].stock_id;
        const exists = reviews.some(r => r.stock_id === stock_id && r.review_date === new_date && r.id !== review_id);
        if (exists) {
          throw new Error('该日期已存在复盘记录，不可重复');
        }
        reviews[idx].review_date = new_date;
        writeJsonStockReviews(reviews);
        return 1;
      }
      return 0;
    }
  },

  getReviewsByStockId(stock_id) {
    if (!useJsonFallback) {
      return db.prepare(`
        SELECT id as review_id, review_date, content 
        FROM stock_reviews 
        WHERE stock_id = ? 
        ORDER BY review_date DESC
      `).all(stock_id);
    } else {
      const reviews = readJsonStockReviews();
      return reviews
        .filter(r => r.stock_id === stock_id)
        .map(r => ({
          review_id: r.id,
          review_date: r.review_date,
          content: r.content
        }))
        .sort((a, b) => b.review_date.localeCompare(a.review_date));
    }
  },

  // ---------------- 交易复盘 API ---------------- //
  getTradeRecords() {
    if (!useJsonFallback) {
      return db.prepare('SELECT * FROM trade_records ORDER BY trade_date DESC, id DESC').all();
    } else {
      const records = readJsonTradeRecords();
      return records.sort((a, b) => {
        if (a.trade_date !== b.trade_date) {
          return a.trade_date > b.trade_date ? -1 : 1;
        }
        return b.id - a.id;
      });
    }
  },

  addTradeRecord(trade) {
    const { code, name, trade_date, type, quantity, unit, price = null, reason = '', return_rate = '', notes = '' } = trade;
    if (!code || !trade_date || !type || quantity === undefined) {
      throw new Error('交易记录核心字段缺失');
    }
    if (!useJsonFallback) {
      const stmt = db.prepare(`
        INSERT INTO trade_records (code, name, trade_date, type, quantity, unit, price, reason, return_rate, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const res = stmt.run(code, name, trade_date, type, quantity, unit, price, reason, return_rate, notes);
      return db.prepare('SELECT * FROM trade_records WHERE id = ?').get(res.lastInsertRowid);
    } else {
      const records = readJsonTradeRecords();
      const newId = records.reduce((max, r) => Math.max(max, r.id || 0), 0) + 1;
      const newRecord = {
        id: newId, code, name, trade_date, type, quantity, unit, price, reason, return_rate, notes,
        created_at: new Date().toISOString()
      };
      records.push(newRecord);
      writeJsonTradeRecords(records);
      return newRecord;
    }
  },

  deleteTradeRecord(id) {
    if (!useJsonFallback) {
      return db.prepare('DELETE FROM trade_records WHERE id = ?').run(id).changes;
    } else {
      const records = readJsonTradeRecords();
      const nextRecords = records.filter(r => r.id !== id);
      const deletedCount = records.length - nextRecords.length;
      writeJsonTradeRecords(nextRecords);
      return deletedCount;
    }
  },

  updateTradeRecord(id, trade) {
    const { trade_date, type, quantity, unit, price = null, reason = '', return_rate = '', notes = '' } = trade;
    if (!useJsonFallback) {
      const stmt = db.prepare(`
        UPDATE trade_records
        SET trade_date = ?, type = ?, quantity = ?, unit = ?, price = ?, reason = ?, return_rate = ?, notes = ?
        WHERE id = ?
      `);
      stmt.run(trade_date, type, quantity, unit, price, reason, return_rate, notes, id);
      return db.prepare('SELECT * FROM trade_records WHERE id = ?').get(id);
    } else {
      const records = readJsonTradeRecords();
      const index = records.findIndex(r => r.id === parseInt(id));
      if (index === -1) return null;
      records[index] = { ...records[index], trade_date, type, quantity, unit, price, reason, return_rate, notes };
      writeJsonTradeRecords(records);
      return records[index];
    }
  }
};

module.exports = dbService;
