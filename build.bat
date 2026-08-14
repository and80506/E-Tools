@echo off
chcp 65001 >nul
echo =======================================
echo   开始构建 ANTIGRAVITY e-tools (Windows)
echo =======================================
echo.

echo [1/2]: 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败，请检查网络或 Node.js 环境。
    pause
    exit /b %errorlevel%
)

echo [2/2]: 编译前端静态资源...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端编译失败。
    pause
    exit /b %errorlevel%
)

echo.
echo =======================================
echo   构建完成！您可以双击 start.bat 启动服务
echo =======================================
pause
