@echo off
:: 解决局域网 UNC 路径（如 \\192.168.x.x\）中双击运行找不到当前目录的问题
pushd "%~dp0"

:: 避免部分机器中文乱码直接崩溃，换为基础英文输出
title ANTIGRAVITY Value-Invest-Sys Local Service

echo =======================================
echo   Starting ANTIGRAVITY Value-Invest-Sys
echo =======================================
echo.

:: 检查 Node 环境
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not found!
    echo Please install Node.js from: https://nodejs.org/
    pause
    popd
    exit /b
)

:: 检查依赖是否安装
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install
)

:: 检查前端是否编译
if not exist "dist\" (
    echo [INFO] First time setup: Building frontend...
    call npm run build
)

:: 启动服务端
echo.
echo Starting Node server (Press Ctrl+C to stop)...
node server/index.js

popd
pause
