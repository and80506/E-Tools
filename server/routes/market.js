const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

let cache = {}; // cache[code] = { data, timestamp }

router.get('/index', (req, res) => {
  try {
    const code = req.query.code || '000300';
    // Simple cache for 24 hours
    const now = Date.now();
    if (cache[code] && (now - cache[code].timestamp < 24 * 60 * 60 * 1000)) {
      return res.json({ success: true, data: cache[code].data });
    }

    const scriptPath = path.join(__dirname, '../../scripts/market_data/fetch_index_lixinger.py');
    const fs = require('fs');
    const os = require('os');
    
    // Cross-platform Python command resolution:
    // 1. Use PYTHON_CMD from .env if specified by the user
    // 2. Fallback to 'python' on Windows, 'python3' on macOS/Linux
    let pythonCmd = process.env.PYTHON_CMD || (os.platform() === 'win32' ? 'python' : 'python3');
    
    // Pass existing environment variables including LIXINGER_TOKEN
    const env = Object.assign({}, process.env);
    
    // Execute python script with code argument
    exec(`"${pythonCmd}" "${scriptPath}" ${code}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing python script:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch data from Lixinger' });
      }
      
      try {
        // Safe JSON parsing: find the first '{' in case of lingering stdout warnings
        const jsonStartIndex = stdout.indexOf('{');
        const cleanStdout = jsonStartIndex !== -1 ? stdout.substring(jsonStartIndex) : stdout;
        
        const result = JSON.parse(cleanStdout);
        if (result.success) {
          cache[code] = {
            data: result.data,
            timestamp: now
          };
          res.json({ success: true, data: result.data });
        } else {
          res.status(500).json({ success: false, message: result.message });
        }
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        res.status(500).json({ success: false, message: 'Invalid JSON from Python script' });
      }
    });

  } catch (error) {
    console.error('Error fetching AkShare data:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
