@echo off
chcp 65001 >nul
echo ================================
echo   Beyond Compare App Launcher
echo ================================
echo.

:: 设置 Rust 路径
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

:: 检查 Rust 是否安装
where cargo >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Rust/Cargo not found!
    echo Please install Rust from: https://rustup.rs
    pause
    exit /b 1
)

:: 检查 pnpm 是否安装
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] pnpm not found!
    echo Please install pnpm: npm install -g pnpm
    pause
    exit /b 1
)

:: 进入项目目录
cd /d "%~dp0"

echo [INFO] Starting Tauri development server...
echo.

:: 启动开发服务器
pnpm tauri dev

pause