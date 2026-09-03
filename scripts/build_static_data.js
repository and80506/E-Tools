require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const indices = ['000300', '000905', '000852'];
const pythonScriptPath = path.join(__dirname, 'market_data/fetch_index_lixinger.py');
const publicDataDir = path.join(__dirname, '../public/data');

// Ensure output directory exists
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

let pythonCmd = process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3');
const env = Object.assign({}, process.env);

function fetchStockData(scriptName, code) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'market_data', scriptName);
    exec(`"${pythonCmd}" "${scriptPath}" ${code}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
      if (error) return reject(error);
      try {
        const jsonStartIndex = stdout.indexOf('{');
        const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
        resolve(JSON.parse(cleanStdout));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function fetchIndex(code) {
  return new Promise((resolve, reject) => {
    console.log(`[build_static_data] Fetching data for ${code}...`);
    exec(`"${pythonCmd}" "${pythonScriptPath}" ${code}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[build_static_data] Error fetching ${code}:`, error);
        return reject(error);
      }
      try {
        const jsonStartIndex = stdout.indexOf('{');
        const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
        const result = JSON.parse(cleanStdout);
        
        if (result.success) {
          const outputPath = path.join(publicDataDir, `market_${code}.json`);
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
          console.log(`[build_static_data] Saved ${outputPath}`);
          resolve();
        } else {
          console.error(`[build_static_data] Lixinger API error for ${code}:`, result.message);
          reject(new Error(result.message));
        }
      } catch (e) {
        console.error(`[build_static_data] Failed to parse output for ${code}:`, e);
        reject(e);
      }
    });
  });
}

async function buildAll() {
  if (!process.env.LIXINGER_TOKEN) {
    console.warn('[build_static_data] WARNING: LIXINGER_TOKEN is not set. Data fetch might fail.');
  }
  
  // 1. Fetch indices
  for (const code of indices) {
    try {
      await fetchIndex(code);
    } catch (e) {
      console.error(`[build_static_data] Aborting build due to error fetching index ${code}.`);
      process.exit(1);
    }
  }

  // 2. Fetch all stocks from DB
  console.log('[build_static_data] Fetching stocks from database...');
  try {
    process.env.FORCE_JSON_DB = 'true'; // Prevent better-sqlite3 segfault in CI by forcing JSON fallback
    const db = require('../server/db');
    const stocks = db.getAllStocks();
    const stockPythonScriptPath = path.join(__dirname, 'market_data/fetch_stock_akshare.py');
    const bsPythonScriptPath = path.join(__dirname, 'market_data/fetch_stock_balance_sheet.py');
    
    for (const stock of stocks) {
      const code = stock.code;
      // Skip non-A-share codes temporarily if they are not supported by akshare (e.g. AAPL, MSFT, etc)
      if (!/^\d{6}$/.test(code)) {
        console.log(`[build_static_data] Skipping non-A-share code: ${code}`);
        continue;
      }
      
      console.log(`[build_static_data] Fetching stock data for ${code}...`);
      await new Promise((resolve, reject) => {
        exec(`"${pythonCmd}" "${stockPythonScriptPath}" ${code}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
          if (error) {
            console.error(`[build_static_data] Error fetching stock ${code}. Skipping...`);
            return resolve(); // Resolve to avoid breaking the entire build for one stock
          }
          try {
            const jsonStartIndex = stdout.indexOf('{');
            const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
            const result = JSON.parse(cleanStdout);
            if (result.success) {
              const outputPath = path.join(publicDataDir, `stock_${code}.json`);
              fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
              console.log(`[build_static_data] Saved ${outputPath}`);
            }
          } catch (e) {
             console.error(`[build_static_data] Parse error for ${code}. Skipping...`);
          }
          resolve();
        });
      });

      console.log(`[build_static_data] Fetching stock balance sheet data for ${code}...`);
      await new Promise((resolve, reject) => {
        exec(`"${pythonCmd}" "${bsPythonScriptPath}" ${code}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
          if (error) {
            console.error(`[build_static_data] Error fetching balance sheet for ${code}. Skipping...`);
            return resolve();
          }
          try {
            const jsonStartIndex = stdout.indexOf('{');
            const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
            const result = JSON.parse(cleanStdout);
            if (result.success) {
              const outputPath = path.join(publicDataDir, `bs_${code}.json`);
              fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
              console.log(`[build_static_data] Saved ${outputPath}`);
            }
          } catch (e) {
             console.error(`[build_static_data] Parse error for balance sheet ${code}. Skipping...`);
          }
          resolve();
        });
      });

      console.log(`[build_static_data] Fetching stock revenue and cashflow data for ${code}...`);
      const rcPythonScriptPath = path.join(__dirname, 'market_data/fetch_stock_revenue_cashflow.py');
      await new Promise((resolve, reject) => {
        exec(`"${pythonCmd}" "${rcPythonScriptPath}" ${code}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
          if (error) {
            console.error(`[build_static_data] Error fetching revenue/cashflow for ${code}. Skipping...`);
            return resolve();
          }
          try {
            const jsonStartIndex = stdout.indexOf('{');
            const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
            const result = JSON.parse(cleanStdout);
            if (result.success) {
              const outputPath = path.join(publicDataDir, `rc_${code}.json`);
              fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
              console.log(`[build_static_data] Saved ${outputPath}`);
            }
          } catch (e) {
             console.error(`[build_static_data] Parse error for revenue/cashflow ${code}. Skipping...`);
          }
          resolve();
        });
      });
    }
  } catch (e) {
    console.error(`[build_static_data] Error fetching stock data:`, e);
  }
  console.log('[build_static_data] All static data built successfully.');
}

buildAll();
