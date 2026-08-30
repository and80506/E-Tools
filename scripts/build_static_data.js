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
  
  for (const code of indices) {
    try {
      await fetchIndex(code);
    } catch (e) {
      console.error(`[build_static_data] Aborting build due to error.`);
      process.exit(1);
    }
  }
  console.log('[build_static_data] All static data built successfully.');
}

buildAll();
