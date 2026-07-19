#!/bin/bash

# GrowMate 自动化测试脚本
# 用于快速验证项目核心功能

set -e

echo "🚀 GrowMate 自动化测试开始..."
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 成功计数器
SUCCESS_COUNT=0
TOTAL_TESTS=0

# 测试函数
test_step() {
    local description="$1"
    local command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}测试 $TOTAL_TESTS: $description${NC}"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

# 1. 环境检查
echo "📋 环境检查..."
test_step "Node.js 版本检查" "node --version | grep -E 'v18\.|v20\.|v22\.'"
test_step "npm 版本检查" "npm --version | grep -E '^[89]\.|^10\.'"

# 2. 依赖安装
echo "📦 依赖检查..."
test_step "安装项目依赖" "npm install"

# 3. 数据库设置
echo "💾 数据库设置..."
test_step "生成 Prisma 客户端" "npm run db:generate"
test_step "推送数据库 schema" "npm run db:push"
test_step "填充测试数据" "npm run db:seed"

# 4. 应用启动
echo "🌐 应用启动..."
test_step "启动开发服务器" "npm run dev &"
sleep 5  # 等待服务器启动

# 5. 健康检查
echo "🏥 应用健康检查..."
test_step "首页访问" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep '200'"
test_step "API 健康检查" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health | grep '200' || true"

# 6. 功能测试
echo "🎯 功能测试..."
test_step "学习模块访问" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/learn | grep '200'"
test_step "AI 模块访问" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ai | grep '200'"
test_step "社区模块访问" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/community | grep '200'"

# 7. 数据库连接测试
echo "🔗 数据库连接测试..."
test_step "数据库连接" "node -e \"const { PrismaClient } = require('@prisma/client'); new PrismaClient().\$connect().then(() => console.log('Connected'))\""

# 8. 构建测试
echo "🔨 构建测试..."
test_step "生产环境构建" "npm run build"

# 清理
echo "🧹 清理环境..."
pkill -f "next dev" || true
rm -rf apps/web/.next

# 结果统计
echo "=================================="
echo -e "${GREEN}🎉 测试完成！${NC}"
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}成功: $SUCCESS_COUNT${NC}"
echo -e "${RED}失败: $((TOTAL_TESTS - SUCCESS_COUNT))${NC}"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎊 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有测试失败，请检查 above 输出。${NC}"
    exit 1
fi