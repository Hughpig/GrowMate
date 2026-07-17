# GrowMate 部署指南

本文档提供了 GrowMate 项目的完整部署方案，涵盖从开发环境到生产环境的全流程。

## 🚀 快速部署

### 一键启动（开发环境）
```bash
# 克隆项目
git clone https://github.com/JenniferJJiang/GrowMate.git
cd GrowMate

# 安装依赖并启动
npm install && npm run dev
```

访问 http://localhost:3000 开始使用。

---

## 📋 部署环境

### 开发环境
```bash
# 开发模式启动
npm run dev

# 数据库管理
npm run db:studio  # 打开 Prisma Studio
```

### 测试环境
```bash
# 构建测试版本
npm run build

# 启动测试服务器
npm run start
```

### 生产环境
详见下面的完整部署方案。

---

## 🐳 Docker 部署

### 方案一：Docker Compose（推荐）

#### 1. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./data/dev.db
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 开发环境服务
  app-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:./dev.db
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev
    profiles:
      - dev
```

#### 2. 创建 Dockerfile

```dockerfile
# 多阶段构建
FROM node:18-alpine AS deps
WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/web/prisma ./apps/web/prisma/

# 安装依赖
RUN npm ci --only=production

# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app

# 复制依赖
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# 安装所有依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境
FROM node:18-alpine AS runner
WORKDIR /app

# 创建用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/prisma ./prisma

# 设置权限
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["node", "server.js"]
```

#### 3. 启动服务

```bash
# 生产环境
docker-compose up -d

# 开发环境
docker-compose --profile dev up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 方案二：单独 Docker 容器

#### 1. 构建镜像

```bash
# 构建生产镜像
docker build -t growmate:latest .

# 构建开发镜像
docker build -f Dockerfile.dev -t growmate:dev .
```

#### 2. 运行容器

```bash
# 生产环境
docker run -d \
  --name growmate \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=file:./data/dev.db \
  -v $(pwd)/data:/app/data \
  growmate:latest

# 开发环境
docker run -it \
  --name growmate-dev \
  -p 3000:3000 \
  -e NODE_ENV=development \
  -v $(pwd):/app \
  growmate:dev
```

---

## ☸️ Kubernetes 部署

### 1. 创建 Kubernetes 配置

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: growmate
  labels:
    app: growmate
spec:
  replicas: 3
  selector:
    matchLabels:
      app: growmate
  template:
    metadata:
      labels:
        app: growmate
    spec:
      containers:
      - name: growmate
        image: growmate:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: growmate-secret
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: growmate-secret
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: growmate-service
spec:
  selector:
    app: growmate
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: growmate-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: growmate.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: growmate-service
            port:
              number: 80
```

### 2. 部署到 Kubernetes

```bash
# 应用配置
kubectl apply -f k8s-deployment.yaml

# 查看状态
kubectl get pods -l app=growmate

# 查看服务
kubectl get service growmate-service

# 查看 ingress
kubectl get ingress growmate-ingress
```

---

## 🔧 环境配置

### 必需环境变量

```bash
# 数据库配置
DATABASE_URL=file:./data/dev.db  # SQLite 开发环境
# 生产环境使用 PostgreSQL:
# DATABASE_URL=postgresql://username:password@localhost:5432/growmate

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# 应用配置
NODE_ENV=production
PORT=3000
```

### 生产环境建议配置

```bash
# 安全配置
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/growmate
DATABASE_SSL=true

# JWT 配置
JWT_SECRET=your-very-secure-secret-key
JWT_EXPIRES_IN=7d

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 文件上传
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# 监控配置
SENTRY_DSN=your-sentry-dsn
```

---

## 📊 数据持久化

### 1. 数据卷管理

```bash
# 创建数据卷
docker volume create growmate-data
docker volume create growmate-uploads

# 使用数据卷运行
docker run -d \
  --name growmate \
  -v growmate-data:/app/data \
  -v growmate-uploads:/app/uploads \
  growmate:latest
```

### 2. 数据备份

```bash
# 备份数据库
docker exec growmate sh -c 'sqlite3 /app/data/dev.db ".backup backup.sql"'

# 复制备份文件
docker cp growmate:/app/backup.sql ./backup/

# 备份上传目录
docker cp growmate:/app/uploads ./backup/
```

### 3. 数据恢复

```bash
# 恢复数据库
docker cp ./backup/backup.sql growmate:/app/
docker exec growmate sh -c 'sqlite3 /app/data/dev.db < backup.sql'

# 恢复上传文件
docker cp ./backup/uploads growmate:/app/
```

---

## 🔍 监控和日志

### 1. 日志管理

```bash
# 查看实时日志
docker-compose logs -f app

# 查看特定服务日志
docker logs growmate

# 导出日志
docker logs growmate > app.log

# 日志轮转配置
# 在 docker-compose.yml 中添加：
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 2. 健康检查

```bash
# 检查容器健康状态
docker ps --filter "name=growmate"

# 查看健康检查详情
docker inspect growmate | grep Health
```

### 3. 性能监控

```bash
# 查看容器资源使用
docker stats growmate

# 查看详细指标
docker exec growmate cat /proc/meminfo
docker exec growmate cat /proc/cpuinfo
```

---

## 🔒 安全配置

### 1. 容器安全

```bash
# 使用非 root 用户运行
# Dockerfile 中已添加：USER nextjs

# 限制容器资源
docker run -m 512m --cpus=1.0 growmate:latest

# 只读文件系统
docker run -read-only --tmpfs /tmp growmate:latest
```

### 2. 网络安全

```bash
# 限制网络访问
docker run --network-alias=growmate --network=app-network growmate:latest

# 使用 HTTPS 代理
docker run -e HTTPS_PROXY=http://proxy.example.com:8080 growmate:latest
```

### 3. 密钥管理

```bash
# 使用 Docker Secrets
echo "your-secret-key" | docker secret create jwt-secret -

# 在 docker-compose.yml 中使用
secrets:
  - jwt-secret
environment:
  - JWT_SECRET_FILE=/run/secrets/jwt-secret
```

---

## 🚀 部署脚本

### 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh - 自动化部署脚本

set -e

echo "🚀 开始部署 GrowMate..."

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 2. 安装依赖
echo "📦 安装依赖..."
npm install

# 3. 构建应用
echo "🔨 构建应用..."
npm run build

# 4. 停止旧服务
echo "🛑 停止旧服务..."
docker-compose down

# 5. 启动新服务
echo "🚀 启动新服务..."
docker-compose up -d

# 6. 健康检查
echo "🏥 健康检查..."
sleep 10
if curl -f http://localhost:3000/ > /dev/null; then
    echo "✅ 部署成功！"
else
    echo "❌ 部署失败，请检查日志。"
    docker-compose logs
    exit 1
fi

echo "🎉 部署完成！"
```

### 回滚脚本

```bash
#!/bin/bash
# rollback.sh - 回滚脚本

echo "🔄 开始回滚..."

# 停止当前服务
docker-compose down

# 回滚到上一个版本
git checkout HEAD~1

# 重新部署
docker-compose up -d

echo "✅ 回滚完成！"
```

---

## 🐛 故障排除

### 常见问题

**Q: 端口冲突**
```bash
# 检查端口占用
lsof -i :3000

# 使用不同端口
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

**Q: 权限问题**
```bash
# 修复文件权限
docker exec growmate chown -R nextjs:nodejs /app
```

**Q: 内存不足**
```bash
# 限制内存使用
docker run -m 512m growmate:latest

# 清理 Docker 资源
docker system prune
```

### 调试技巧

```bash
# 进入容器调试
docker exec -it growmate sh

# 查看容器资源使用
docker stats growmate

# 查看详细日志
docker-compose logs -f app --tail=100
```

---

## 📈 性能优化

### 1. 应用优化

```bash
# 启用压缩
# 在 next.config.js 中添加：
const nextConfig = {
  compress: true,
  poweredByHeader: false
}
```

### 2. 数据库优化

```bash
# 添加索引
# 在 prisma/schema.prisma 中添加：
model User {
  @@index([email])
}

# 定期优化数据库
docker exec growmate sqlite3 /app/data/dev.db "VACUUM;"
```

### 3. 缓存配置

```bash
# 启用 Redis 缓存
# docker-compose.yml 中添加：
redis:
  image: redis:alpine
  ports:
    - "6379:6379"

# 环境变量
REDIS_URL=redis://localhost:6379
```

---

## 📞 支持和维护

### 联系方式
- **GitHub Issues**：[提交问题](https://github.com/JenniferJJiang/GrowMate/issues)
- **文档**：[项目文档](./docs/)

### 维护计划
- **每日**：检查应用状态和日志
- **每周**：性能监控和安全更新
- **每月**：数据库备份和依赖更新

---

*最后更新：2026年7月18日*  
*版本：v1.0.0*