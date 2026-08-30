#!/bin/bash
echo "======================================="
echo "  开始构建 Value-Invest-Sys (Mac/Linux)"
echo "======================================="
echo ""

echo "[1/2]: 安装依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "[错误] 依赖安装失败，请检查网络或 Node.js 环境。"
    exit 1
fi

echo "[2/2]: 编译前端静态资源..."
npm run build
if [ $? -ne 0 ]; then
    echo "[错误] 前端编译失败。"
    exit 1
fi

echo ""
echo "======================================="
echo "  构建完成！您可以运行 ./start.sh 启动服务"
echo "======================================="
