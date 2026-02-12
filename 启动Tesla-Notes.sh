#!/bin/bash
# Tesla Notes 开发环境启动器
# ======================================

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "正在启动 Tesla Notes 开发环境..."
echo "工作目录: $SCRIPT_DIR"
echo ""

cd "$SCRIPT_DIR"

# 检查 pnpm 是否可用
if ! command -v pnpm &> /dev/null; then
    echo "错误: 未找到 pnpm，请先安装 Node.js 和 pnpm"
    read -p "按回车键退出..."
    exit 1
fi

# 启动开发服务器
exec pnpm tauri dev
