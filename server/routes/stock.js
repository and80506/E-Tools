const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const os = require('os');

const cache = {};

router.get('/fundamentals', (req, res) => {
  const code = req.query.code;
  const years = parseInt(req.query.years) || 8;
  
  if (!code) {
    return res.status(400).json({ success: false, message: 'Stock code is required' });
  }

  const cacheKey = `${code}_${years}`;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < 1000 * 60 * 60) {
    return res.json({ success: true, data: cache[cacheKey].data });
  }

  const scriptPath = path.join(__dirname, '../../scripts/market_data/fetch_stock_akshare.py');
  
  let pythonCmd = process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3');
  
  const env = Object.assign({}, process.env);
  
  exec(`"${pythonCmd}" "${scriptPath}" ${code} ${years}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
    if (error) {
      try {
        const jsonStartIndex = stdout.indexOf('{');
        if (jsonStartIndex !== -1) {
          const result = JSON.parse(stdout.substring(jsonStartIndex));
          if (result.message) {
            console.error(`[Python 拦截] ${result.message}`);
            return res.status(500).json({ success: false, message: result.message });
          }
        }
      } catch (e) {}
      
    const realError = stderr || stdout || error.message;
    exec(`"${pythonCmd}" -c "import sys; print('Executable:', sys.executable, 'Path:', sys.path)"`, { env }, (err, sto, ste) => {
        console.error('\n[Python 运行崩溃]\n', realError);
        console.error('\n[环境调试信息]\n', sto || ste);
    });
    return res.status(500).json({ success: false, message: '个股数据拉取异常，请查看终端报错' });
    }
    
    try {
      const jsonStartIndex = stdout.indexOf('{');
      const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
      
      const result = JSON.parse(cleanStdout);
      if (result.success) {
        cache[cacheKey] = {
          data: result.data,
          timestamp: now
        };
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, message: result.message });
      }
    } catch (e) {
      console.error('JSON Parse Error for Stock Fundamentals:', e, stdout);
      res.status(500).json({ success: false, message: 'Invalid data format from python script' });
    }
  });
});

const bsCache = {};
const roeCache = {};

router.get('/balance_sheet', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Stock code is required' });
  }

  const now = Date.now();
  if (bsCache[code] && now - bsCache[code].timestamp < 1000 * 60 * 60) {
    return res.json({ success: true, data: bsCache[code].data });
  }

  const scriptPath = path.join(__dirname, '../../scripts/market_data/fetch_stock_balance_sheet.py');
  
  let pythonCmd = process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3');
  const env = Object.assign({}, process.env);
  
  exec(`"${pythonCmd}" "${scriptPath}" ${code}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
    if (error) {
      try {
        const jsonStartIndex = stdout.indexOf('{');
        if (jsonStartIndex !== -1) {
          const result = JSON.parse(stdout.substring(jsonStartIndex));
          if (result.message) {
            console.error(`[Python 拦截] ${result.message}`);
            return res.status(500).json({ success: false, message: result.message });
          }
        }
      } catch (e) {}
      
      const realError = stderr || stdout || error.message;
      console.error('\n[Python 运行崩溃]\n', realError);
      return res.status(500).json({ success: false, message: '资产负债表数据拉取异常，请查看终端报错' });
    }
    
    try {
      const jsonStartIndex = stdout.indexOf('{');
      const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
      
      const result = JSON.parse(cleanStdout);
      if (result.success) {
        bsCache[code] = {
          data: result.data,
          timestamp: now
        };
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, message: result.message });
      }
    } catch (e) {
      console.error('JSON Parse Error for Stock Balance Sheet:', e, stdout);
      res.status(500).json({ success: false, message: 'Invalid data format from python script' });
    }
  });
});



const rcCache = {};

router.get('/revenue_cashflow', (req, res) => {
  const code = req.query.code;
  const years = parseInt(req.query.years) || 8;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Stock code is required' });
  }

  const cacheKey = `${code}_${years}`;
  const now = Date.now();
  if (rcCache[cacheKey] && now - rcCache[cacheKey].timestamp < 1000 * 60 * 60) {
    return res.json({ success: true, data: rcCache[cacheKey].data });
  }

  const scriptPath = path.join(__dirname, '../../scripts/market_data/fetch_stock_revenue_cashflow.py');
  
  let pythonCmd = process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3');
  const env = Object.assign({}, process.env);
  
  exec(`"${pythonCmd}" "${scriptPath}" ${code} ${years}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
    if (error) {
      try {
        const jsonStartIndex = stdout.indexOf('{');
        if (jsonStartIndex !== -1) {
          const result = JSON.parse(stdout.substring(jsonStartIndex));
          if (result.message) {
            console.error(`[Python 拦截] ${result.message}`);
            return res.status(500).json({ success: false, message: result.message });
          }
        }
      } catch (e) {}
      
      const realError = stderr || stdout || error.message;
      console.error('\n[Python 运行崩溃]\n', realError);
      return res.status(500).json({ success: false, message: '营收现金流数据拉取异常，请查看终端报错' });
    }
    
    try {
      const jsonStartIndex = stdout.indexOf('{');
      const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
      
      const result = JSON.parse(cleanStdout);
      if (result.success) {
        rcCache[cacheKey] = {
          data: result.data,
          timestamp: now
        };
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, message: result.message });
      }
    } catch (e) {
      console.error('JSON Parse Error for Stock Revenue Cashflow:', e, stdout);
      res.status(500).json({ success: false, message: 'Invalid data format from python script' });
    }
  });
});

router.get('/roe', (req, res) => {
  const code = req.query.code;
  const years = parseInt(req.query.years) || 8;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Stock code is required' });
  }

  const cacheKey = `${code}_${years}`;
  const now = Date.now();
  if (roeCache[cacheKey] && now - roeCache[cacheKey].timestamp < 1000 * 60 * 60) {
    return res.json({ success: true, data: roeCache[cacheKey].data });
  }

  const scriptPath = path.join(__dirname, '../../scripts/market_data/fetch_stock_roe.py');
  
  let pythonCmd = process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3');
  const env = Object.assign({}, process.env);
  
  exec(`"${pythonCmd}" "${scriptPath}" ${code} ${years}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
    if (error) {
      try {
        const jsonStartIndex = stdout.indexOf('{');
        if (jsonStartIndex !== -1) {
          const result = JSON.parse(stdout.substring(jsonStartIndex));
          if (result.message) {
            console.error(`[Python 拦截] ${result.message}`);
            return res.status(500).json({ success: false, message: result.message });
          }
        }
      } catch (e) {}
      
      const realError = stderr || stdout || error.message;
      console.error('\n[Python 运行崩溃]\n', realError);
      return res.status(500).json({ success: false, message: 'ROE数据拉取异常，请查看终端报错' });
    }
    
    try {
      const jsonStartIndex = stdout.indexOf('{');
      const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
      
      const result = JSON.parse(cleanStdout);
      if (result.success) {
        roeCache[cacheKey] = {
          data: result.data,
          timestamp: now
        };
        res.json({ success: true, data: result.data });
      } else {
        res.status(500).json({ success: false, message: result.message });
      }
    } catch (e) {
      console.error('JSON Parse Error for Stock ROE:', e, stdout);
      res.status(500).json({ success: false, message: 'Invalid data format from python script' });
    }
  });
});

const compareCache = {}; // Cache stores data by `code_years`

router.get('/compare_data', (req, res) => {
  const codesStr = req.query.codes;
  const years = parseInt(req.query.years) || 8;
  if (!codesStr) {
    return res.status(400).json({ success: false, message: 'Stock codes are required' });
  }

  const codes = codesStr.split(',');
  const now = Date.now();
  
  // 1. Check cache for each individual stock
  const cachedData = {};
  const missingCodes = [];
  
  for (const code of codes) {
    const key = `${code}_${years}`;
    if (compareCache[key] && now - compareCache[key].timestamp < 1000 * 60 * 60) {
      cachedData[code] = compareCache[key].data;
    } else {
      missingCodes.push(code);
    }
  }

  // 2. If everything is cached, return immediately
  if (missingCodes.length === 0) {
    return res.json({ success: true, data: cachedData });
  }

  // 3. Otherwise, fetch ONLY the missing codes
  const missingCodesStr = missingCodes.join(',');
  const scriptPath = path.join(__dirname, '../../scripts/market_data/fetch_compare_data.py');
  let pythonCmd = process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3');
  const env = Object.assign({}, process.env);
  
  exec(`"${pythonCmd}" "${scriptPath}" ${missingCodesStr} ${years}`, { maxBuffer: 1024 * 1024 * 50, env }, (error, stdout, stderr) => {
    if (error) {
      // ... handle error similarly ...
      console.error('\n[Python 运行崩溃]\n', stderr || error.message);
      return res.status(500).json({ success: false, message: '聚合数据拉取异常，请查看终端报错' });
    }
    
    try {
      const jsonStartIndex = stdout.indexOf('{');
      const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
      
      const result = JSON.parse(cleanStdout);
      if (result.success) {
        // Save fetched data to individual stock cache
        const fetchedData = result.data;
        for (const code of Object.keys(fetchedData)) {
          const key = `${code}_${years}`;
          compareCache[key] = {
            data: fetchedData[code],
            timestamp: now
          };
          // merge into final response
          cachedData[code] = fetchedData[code];
        }
        
        res.json({ success: true, data: cachedData });
      } else {
        res.status(500).json({ success: false, message: result.message });
      }
    } catch (e) {
      console.error('JSON Parse Error for Compare Data:', e, stdout);
      res.status(500).json({ success: false, message: 'Invalid data format from python script' });
    }
  });
});

module.exports = router;
