const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const fs = require('fs');

const stocksRouter = require('./routes/stocks');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API 路由
app.use('/api/tags', require('./routes/tags'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api', stocksRouter);

// 系统状态健康检查
app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    serverTime: new Date().toISOString(),
    version: '1.0.0',
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version
  });
});

// 静态文件托管（前端打包产物）
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // 单页应用 SPA 路由兜底
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <title>ANTIGRAVITY Value-Invest-Sys 服务已启动</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); max-width: 500px; border: 1px solid #334155; }
          h1 { color: #38bdf8; margin-top: 0; font-size: 1.5rem; }
          code { background: #0f172a; padding: 2px 6px; border-radius: 4px; color: #f43f5e; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🚀 后端 API 服务运行中</h1>
          <p>当前前端静态资源尚未构建，请在项目根目录下运行 <code>npm run build</code> 进行打包，打包后本服务将自动托管完整前端应用。</p>
          <p>API 接口当前处于可用状态：<code>/api/stocks</code></p>
        </div>
      </body>
      </html>
    `);
  });
}

// 自动获取局域网 IPv4 地址
function getNetworkIpv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: name,
          address: iface.address
        });
      }
    }
  }
  return addresses;
}

// 启动服务器
app.listen(PORT, HOST, () => {
  const localIps = getNetworkIpv4Addresses();
  console.log('\n=============================================================');
  console.log('   ANTIGRAVITY 金融投资工具箱 (Value-Invest-Sys) 局域网服务已启动');
  console.log('=============================================================');
  console.log(` > 本机访问地址:    http://localhost:${PORT}`);
  console.log(` > 局域网 IP 访问:`);
  if (localIps.length > 0) {
    localIps.forEach(ip => {
      console.log(`   - http://${ip.address}:${PORT}  (${ip.interface})`);
    });
  } else {
    console.log(`   - http://127.0.0.1:${PORT}`);
  }
  console.log('=============================================================\n');
});
