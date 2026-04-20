@echo off
chcp 65001 >nul
echo ================================
echo   Beyond Compare App Builder
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

:: 进入项目目录
cd /d "%~dp0"

echo [INFO] Building production release...
echo.

:: 构建生产版本
pnpm tauri build

echo.
echo [INFO] Build complete!
echo Output: src-tauri\target\release\bundle\
echo.

pause