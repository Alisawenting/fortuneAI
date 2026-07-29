# 云枢易馆 —— 从源码在镜像内构建的独立 Node 服务
#
# 为什么在镜像里构建、而不是拷贝本机 dist / node_modules：
#   1) better-sqlite3 是原生模块，本机 node_modules 是 Windows 编译的，Linux 用不了，
#      必须在 Linux 里重新编译（下面的 python3/make/g++ + npm ci 完成）。
#   2) 构建用 node-server 预设产出 .output/server/index.mjs，是能自监听端口的 Node 服务。
#
# 运行：docker compose up -d --build （见 docker-compose.yml）

FROM node:22-bookworm-slim

WORKDIR /app

# 替换为阿里云 Debian 源（国内服务器加速 apt）
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 先装依赖，利用 Docker 层缓存（注意：此处不能设 NODE_ENV=production，
# 否则 npm ci 会跳过构建所需的 devDependencies：vite / nitro / drizzle-kit / typescript）
# 使用阿里云 npm 镜像加速（国内服务器必备）
RUN npm config set registry https://registry.npmmirror.com
COPY package.json package-lock.json ./
RUN npm ci

# 拷贝源码并构建（产出 .output/：服务端 .output/server/index.mjs、静态资源 .output/public）
COPY . .
RUN npm run build

# 运行时：nitro node-server 读取 PORT（默认 3000）；SQLite 数据库写到挂载卷 /app/data
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
