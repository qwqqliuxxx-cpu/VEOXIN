# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# Stage 2: Runner
FROM node:18-alpine

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production

# 复制 package 文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --omit=dev

# 从 builder 复制构建产物和服务器文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js

# 暴露端口
EXPOSE 3000

# 启动服务器
CMD ["node", "server.js"]
