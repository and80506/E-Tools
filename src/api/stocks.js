/**
 * 股票自选股与系统 API 客户端模块
 */

const API_BASE = '/api';

const isDemo = import.meta.env && import.meta.env.VITE_DEMO_MODE === 'true';

// 生成一点假数据用于在 GitHub Pages 演示
const demoData = {
  stocks: [
    { id: 1, code: '002081', name: '金螳螂', notes: '行业龙头，观察盈利拐点', order_num: 1, created_at: '2026-08-01', tags: [{id: 1, name: '观察仓', color: '#eab308'}, {id: 2, name: '高股息', color: '#10b981'}] },
    { id: 2, code: '600519', name: '贵州茅台', notes: '长期底仓', order_num: 2, created_at: '2026-08-02', tags: [{id: 3, name: '长线底仓', color: '#ef4444'}] },
    { id: 3, code: 'AAPL', name: '苹果', notes: '纳指核心', order_num: 3, created_at: '2026-08-03', tags: [] }
  ],
  tags: [
    { id: 1, name: '观察仓', color: '#eab308' },
    { id: 2, name: '高股息', color: '#10b981' },
    { id: 3, name: '长线底仓', color: '#ef4444' }
  ],
  reviewDates: ['2026-08-13', '2026-08-14'],
  dailyReviews: {
    '2026-08-13': '大盘回调，耐心等待。',
    '2026-08-14': '触底反弹，金螳螂有异动。'
  },
  stockReviews: [
    { id: 1, stock_id: 1, review_date: '2026-08-14', content: '今天放量上涨，准备试仓。' }
  ]
};

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function handleDemoMock(url, options) {
  await mockDelay(300); // 模拟网络延迟
  const method = options.method || 'GET';
  
  if (url === '/system/status') return { success: true };
  if (url === '/stocks' && method === 'GET') return { success: true, data: demoData.stocks };
  if (url === '/tags' && method === 'GET') return { success: true, data: demoData.tags };
  if (url === '/reviews/dates' && method === 'GET') return { success: true, data: demoData.reviewDates };
  
  if (url.startsWith('/reviews/daily/')) {
    const date = url.split('/').pop();
    return { success: true, data: { date, content: demoData.dailyReviews[date] || '' } };
  }
  if (url.startsWith('/reviews/stock/')) {
    const date = url.split('/').pop();
    return { success: true, data: demoData.stockReviews.filter(r => r.review_date === date) };
  }
  
  // 对于写操作，一律返回成功（Mock 环境中页面刷新数据重置）
  return { success: true, data: { id: Date.now() } };
}

/**
 * 统一请求封装
 */
async function request(url, options = {}) {
  if (isDemo) {
    return handleDemoMock(url, options);
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(`${API_BASE}${url}`, config);
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || `请求失败 (${res.status})`);
    }
    return result;
  } catch (error) {
    console.error(`[API Error] ${url}:`, error);
    throw error;
  }
}

export const stocksApi = {
  // 获取自选股列表
  async getStocks() {
    const res = await request('/stocks');
    return res.data || [];
  },

  // 添加单支股票
  async addStock(stockData) {
    const res = await request('/stocks', {
      method: 'POST',
      body: JSON.stringify(stockData)
    });
    return res.data;
  },

  // 删除单支股票
  async deleteStock(id) {
    return await request(`/stocks/${id}`, {
      method: 'DELETE'
    });
  },

  // 批量删除股票
  async deleteBatch(ids) {
    return await request('/stocks/delete-batch', {
      method: 'POST',
      body: JSON.stringify({ ids })
    });
  },

  // 批量导入股票
  async importStocks(stocks, replace = false) {
    return await request('/stocks/import', {
      method: 'POST',
      body: JSON.stringify({ stocks, replace })
    });
  },

  // 重置为默认自选股
  async resetToDefault() {
    const res = await request('/stocks/reset', {
      method: 'POST'
    });
    return res.data || [];
  },

  // 更新复盘数据
  async updateReview(id, reviewData) {
    return await request(`/stocks/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
  },

  // 更新自选股的标签关联
  async setStockTags(id, tagIds) {
    return await request(`/stocks/${id}/tags`, {
      method: 'PUT',
      body: JSON.stringify({ tags: tagIds })
    });
  },

  // 检查服务端连接状态
  async checkStatus() {
    return await request('/system/status');
  }
};

export const tagsApi = {
  // 获取所有标签
  async getTags() {
    const res = await request('/tags');
    return res.data || [];
  },

  // 创建标签
  async createTag(name, color) {
    const res = await request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name, color })
    });
    return res.data;
  },

  // 更新标签
  async updateTag(id, name, color) {
    return await request(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, color })
    });
  },

  // 删除标签
  async deleteTag(id) {
    return await request(`/tags/${id}`, {
      method: 'DELETE'
    });
  }
};

export const reviewsApi = {
  // 获取所有存在复盘记录的日期
  async getAllReviewDates() {
    const res = await request('/reviews/dates');
    return res.data || [];
  },

  // 获取某日全局复盘
  async getDailyReview(date) {
    const res = await request(`/reviews/daily/${date}`);
    return res.data;
  },

  // 保存某日全局复盘
  async saveDailyReview(date, content) {
    return await request(`/reviews/daily/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  },

  // 获取某日所有有复盘的股票
  async getStockReviewsByDate(date) {
    const res = await request(`/reviews/stock/${date}`);
    return res.data || [];
  },

  // 保存某个股票在某日的复盘
  async saveStockReview(stockId, date, content) {
    return await request(`/reviews/stock/${stockId}/${date}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }
};
