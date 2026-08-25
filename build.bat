@echo off
:: Handle UNC paths for network execution
pushd "%~dp0"

title ANTIGRAVITY Value-Invest-Sys Build Script

echo =======================================
echo   Building ANTIGRAVITY Value-Invest-Sys 
echo =======================================
echo.

echo [1/2]: Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies. Please check network and Node.js.
    pause
    popd
    exit /b %errorlevel%
)

echo [2/2]: Building frontend...
call npm run build
if errorlevel 1 (
    echo [ERROR] Failed to build frontend.
    pause
    popd
    exit /b %errorlevel%
)

echo.
echo =======================================
echo   Build finished! You can run start.bat
echo =======================================
popd
pause
