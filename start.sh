#!/bin/bash
echo "======================================="
echo "  启动 Value-Invest-Sys (Mac/Linux)"
echo "======================================="
echo ""

# 检查 Node.js 环境
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

# 检查并配置 Python 依赖
if command -v python3 &> /dev/null; then
    echo "[提示] 检测到 Python，正在检查并安装 Python 依赖包..."
    pip3 install -r requirements.txt
elif command -v python &> /dev/null; then
    echo "[提示] 检测到 Python，正在检查并安装 Python 依赖包..."
    pip install -r requirements.txt
else
    echo "[警告] 未检测到 Python，部分大盘数据脚本将无法运行，如需使用请安装 Python。"
    echo ""
fi

# 检查 Node 依赖
if [ ! -d "node_modules" ]; then
    echo "[提示] 未找到 node_modules，正在首次自动安装依赖，请稍候..."
    npm install
fi

# 检查前端构建产物
if [ ! -d "dist" ]; then
    echo "[提示] 未找到 dist 文件夹，正在首次自动构建前端，请稍候..."
    npm run build
fi

echo ""
echo "正在启动 Node 服务 (按 Ctrl+C 可以随时停止)..."
node server/index.js
