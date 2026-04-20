#!/bin/bash

echo "================================"
echo "  Beyond Compare App Launcher"
echo "================================"
echo

# 添加 Rust 到 PATH
export PATH="$HOME/.cargo/bin:$PATH"

# 检查 Rust
if ! command -v cargo &> /dev/null; then
    echo "[ERROR] Rust/Cargo not found!"
    echo "Please install Rust from: https://rustup.rs"
    exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "[ERROR] pnpm not found!"
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi

# 进入脚本所在目录
cd "$(dirname "$0")"

echo "[INFO] Starting Tauri development server..."
echo

# 启动开发服务器
pnpm tauri dev