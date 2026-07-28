# 云枢易馆 · Yunshu AI

<p align="center">
  <img src="https://img.shields.io/badge/stack-TanStack%20Start-22C55E?logo=react" alt="Stack">
  <img src="https://img.shields.io/badge/AI-DeepSeek-536DFE" alt="DeepSeek">
  <img src="https://img.shields.io/badge/database-SQLite%20%2B%20Drizzle-003B57?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/deploy-Docker-2496ED?logo=docker" alt="Docker">
</p>

**古法藏枢机 · AI 解流年**

云枢易馆是一款融合传统八字命理与现代大语言模型（LLM）的 AI 命理应用。输入生辰即可自动排盘、推大运、断流年——所有结果由 DeepSeek 大模型用通俗的人话讲给你听，而非机械罗列干支术语。支持多角色切换、AI 命理师实时对话、社区分享、会员体系与 Docker 一键私有部署。

---

## 功能概览

| 模块 | 说明 |
|------|------|
| 🏠 首页仪表盘 | 今日运势五维评分（事业/财运/情感/人际/情绪）、宜忌、幸运色/数字/方位、每日打卡 |
| 🤖 AI 八字解读 | 输入生辰 → 自动排盘（调用缘分居八字 API）→ DeepSeek 大模型生成通俗命盘报告 |
| 💬 AI 命理师对话 | 流式聊天，AI 自动引用命盘信息（日主、喜用神、神煞等）作为上下文，回复带古风而不油腻 |
| 📖 流年与大运 | 一生大运排布可视化 + 当前流年 AI 提示 + 流年收藏 |
| 📱 社区 | 帖子发布、分类（运势心得/命理科普/国学知识/生活感悟）、评论、点赞 |
| 👥 多角色支持 | 最多 5 个命盘档案，一键切换（适合帮家人/朋友查询） |
| 💎 会员系统 | 免费/月度/季度/年度会员，含模拟购买流程 |
| 📊 命理指数 | 运势雷达图 + 方位/时辰指引 |
| 🌙 打卡签到 | 连续签到计数，本地持久化 |

---

## 技术栈

```text
前端框架   TanStack Start (React 19 + Server-Side Rendering)
构建工具   Vite 7 + Nitro
语言       TypeScript 5.8
样式       Tailwind CSS 4 + Radix UI (shadcn/ui)
数据库     SQLite (better-sqlite3) + Drizzle ORM
AI 大模型  DeepSeek (chat/completions, 支持 SSE 流式)
命理 API   缘分居 (yuanfenju.com) — 八字排盘/测算/每日运势
图片生成  智谱 CogView (Zhipu)
认证      JWT (jsonwebtoken)
部署      Docker + docker-compose
运行环境  Node.js 22 (bookworm-slim)
```

---

## 本地开发

### 前置条件

- **Node.js** ≥ 22
- **npm** ≥ 10
- 建议安装 **bun**（可选，项目中有 `bun.lock`）

### 1. 环境变量

在项目根目录创建 `.env` 文件：

```bash
# DeepSeek API（必填）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 缘分居八字 API（可选，有默认值）
YUANFENJU_API_KEY=your-key

# 智谱图片生成（可选）
ZHIPU_API_KEY=your-key

# JWT 密钥（生产环境请替换）
JWT_SECRET=your-random-secret

# 数据库路径
DATABASE_PATH=./data/yunshu.db

# 环境
NODE_ENV=development
```

### 2. 安装依赖

```bash
npm install
```

### 3. 生成数据库表（首次）

```bash
npx drizzle-kit push
```

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器打开 `http://localhost:3000`。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（HMR 热更新） |
| `npm run build` | 生产构建（`vite build`） |
| `npm run build:dev` | 开发模式构建 |
| `npm run preview` | 预览生产构建产物 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 格式化 |

---

## Docker 部署

```bash
# 构建并后台启动
docker compose up -d --build

# 查看日志
docker compose logs -f

# 停止
docker compose down

# 修改代码后重新部署
docker compose up -d --build
```

容器内部监听 `3000` 端口，宿主机映射到 `80`（可在 `docker-compose.yml` 中修改）。SQLite 数据库持久化到宿主机 `./data` 目录。

### 目录结构

```text
.
├── data/                 # SQLite 数据（Docker volume 挂载）
├── Dockerfile            # 容器构建文件
├── docker-compose.yml    # 生产部署编排
├── .env                  # 环境变量（API Key 等）
├── src/
│   ├── components/       # React 组件
│   │   ├── ui/           # shadcn/ui 组件库
│   │   ├── BaziReport.tsx
│   │   ├── BrandMark.tsx
│   │   ├── MobileShell.tsx
│   │   └── ...
│   ├── routes/           # 文件路由（TanStack Router）
│   │   ├── index.tsx     # 首页（仪表盘）
│   │   ├── chat.tsx      # AI 命理师对话
│   │   ├── reading.tsx   # 命盘解读详情
│   │   ├── divine.tsx    # 排盘/测算
│   │   ├── community.tsx # 社区
│   │   ├── shop.tsx      # 会员商城
│   │   ├── profile.tsx   # 个人中心
│   │   ├── bookmarks.tsx # 收藏
│   │   └── member.tsx    # 会员管理
│   ├── lib/
│   │   ├── api/          # 服务端 API 函数
│   │   │   ├── deepseek.client.server.ts    # DeepSeek 客户端
│   │   │   ├── yuanfenju.client.server.ts   # 缘分居八字 API
│   │   │   ├── yuanfenju.types.ts           # 八字类型定义
│   │   │   ├── bazi-report.functions.ts     # 八字报告生成
│   │   │   ├── fortune-analysis.functions.ts # 运势深度分析
│   │   │   ├── chat.functions.ts            # AI 对话
│   │   │   ├── community.functions.ts       # 社区逻辑
│   │   │   └── membership.functions.ts      # 会员逻辑
│   │   ├── auth/         # 认证
│   │   ├── db/           # 数据库（连接、Schema、迁移）
│   │   └── ...
│   ├── hooks/            # React Hooks
│   ├── server.ts         # 服务端入口
│   └── start.ts          # Nitro 启动器
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
└── bun.lock
```

---

## 项目架构

```
用户浏览器
    │
    ▼
TanStack Start (SSR)
    │
    ├─→ createServerFn handlers ──→ 缘分居八字 API（排盘/测算/运势）
    │                           ──→ DeepSeek API（AI 解读/对话）
    │                           ──→ 智谱 API（图片生成）
    │                           ──→ SQLite 数据库
    │
    └─→ React 客户端（hydration）
```

所有外部 API 调用都在服务端完成（`.server.ts` / `createServerFn`），API Key 不会泄露到浏览器。

---

## API 依赖

| 服务 | 用途 | 注册地址 |
|------|------|----------|
| DeepSeek | AI 对话、命盘解读、流式回复 | platform.deepseek.com |
| 缘分居 (yuanfenju.com) | 八字排盘、测算、每日运势 | yuanfenju.com |
| 智谱 (Zhipu) | AI 图片生成 | open.bigmodel.cn |

---

## License

MIT

---

<p align="center">
  Made with ❤️ by Alisa
</p>
