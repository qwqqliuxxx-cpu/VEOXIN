# Veo Studio Pro - 部署指南

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+
- Docker (可选，用于容器化部署)
- Fly.io CLI (用于 Fly.io 部署)
- Google Gemini API Key

### 2. 获取 API Key
访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取您的 Gemini API Key。

## 🚀 部署到 Fly.io

### 步骤 1: 安装 Fly.io CLI

```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

### 步骤 2: 登录 Fly.io

```bash
fly auth login
```

### 步骤 3: 创建应用

```bash
fly launch
```

在交互式提示中：
- 选择应用名称（或使用默认）
- 选择区域：**Tokyo (nrt)** - 对中国用户最友好
- 不要立即部署（选择 No）

### 步骤 4: 设置环境变量

```bash
fly secrets set GEMINI_API_KEY=your_actual_api_key_here
```

⚠️ **重要**: 将 `your_actual_api_key_here` 替换为您的真实 API Key

### 步骤 5: 部署应用

```bash
fly deploy
```

### 步骤 6: 查看应用

```bash
fly open
```

## 🐳 本地 Docker 测试

### 构建镜像

```bash
docker build -t veo-studio-pro .
```

### 运行容器

```bash
docker run -p 3000:3000 -e GEMINI_API_KEY=your_api_key veo-studio-pro
```

访问 `http://localhost:3000` 测试应用。

## 💻 本地开发测试

### 1. 安装依赖

```bash
npm install
```

### 2. 构建前端

```bash
npm run build
```

### 3. 启动服务器

```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your_api_key"; npm start

# macOS/Linux
GEMINI_API_KEY=your_api_key npm start
```

### 4. 访问应用

打开浏览器访问 `http://localhost:3000`

## 📊 监控和日志

### 查看实时日志

```bash
fly logs
```

### 查看应用状态

```bash
fly status
```

### 查看资源使用情况

```bash
fly vm status
```

## 🔧 常见问题

### Q: 部署后显示 "API Key 未配置"
**A**: 确保已正确设置环境变量：
```bash
fly secrets set GEMINI_API_KEY=your_key
fly deploy  # 重新部署以应用更改
```

### Q: 视频生成失败
**A**: 检查以下几点：
1. API Key 是否有效
2. Google Cloud 项目是否启用了 Gemini API
3. 查看服务器日志：`fly logs`

### Q: 如何更新应用
**A**: 修改代码后，运行：
```bash
fly deploy
```

### Q: 如何扩展资源
**A**: 编辑 `fly.toml` 文件中的 `[[vm]]` 部分，然后重新部署。

## 🌐 GitHub Actions 自动部署（可选）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

在 GitHub 仓库设置中添加 `FLY_API_TOKEN` secret：
```bash
fly tokens create deploy
```

## 📝 架构说明

此应用使用 **Backend for Frontend (BFF)** 模式：

- **前端**: Vite + React + TypeScript
- **后端**: Express.js 代理服务器
- **API 流程**: 
  1. 前端 → `/api/generate-video` → 后端代理
  2. 后端 → Google Gemini API (使用服务器端 API Key)
  3. 后端 ← 视频生成操作 ID
  4. 前端轮询 → `/api/poll-operation` → 检查状态
  5. 完成后 → `/api/download-video` → 获取视频

**安全优势**: API Key 仅存储在服务器端，永不暴露给前端用户。

## 🎯 下一步

- [ ] 配置自定义域名：`fly certs add yourdomain.com`
- [ ] 设置监控和告警
- [ ] 配置 CDN 加速静态资源
- [ ] 实施速率限制防止滥用
