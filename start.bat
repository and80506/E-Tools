@echo off
chcp 65001 >nul
title ANTIGRAVITY e-tools 局域网服务

echo =======================================
echo   启动 ANTIGRAVITY e-tools 局域网服务
echo =======================================
echo.

:: 检查 Node 环境
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js (https://nodejs.org/)
    pause
    exit /b
)

:: 检查依赖是否安装
if not exist "node_modules\" (
    echo [提示] 未找到 node_modules，正在首次自动安装依赖，请稍候...
    call npm install
)

:: 检查前端是否编译
if not exist "dist\" (
    echo [提示] 未找到 dist 文件夹，正在首次自动构建前端，请稍候...
    call npm run build
)

:: 启动服务端
echo.
echo 正在启动 Node 服务 (按 Ctrl+C 可以随时停止)...
node server/index.js

pause
