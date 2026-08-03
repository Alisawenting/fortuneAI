# 云枢易馆 · Yunshu AI

<p align="center">
  <img src="https://img.shields.io/badge/stack-TanStack%20Start-22C55E?logo=react" alt="Stack">
  <img src="https://img.shields.io/badge/AI-DeepSeek-536DFE" alt="DeepSeek">
  <img src="https://img.shields.io/badge/Bazi-lunar--typescript-8B5CF6" alt="Bazi Engine">
  <img src="https://img.shields.io/badge/database-SQLite%20%2B%20Drizzle-003B57?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/deploy-Docker-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

<p align="center"><strong>古法藏枢机 · AI 解流年</strong></p>

<img width="1751" height="623" alt="云枢易馆" src="https://github.com/user-attachments/assets/292b9db4-8b16-4946-a5d8-16542b905914" />

云枢易馆 (https://yunshuyiguan.cn/) 是一款融合传统八字命理与大语言模型的 AI 命理应用。输入生辰即可**本地自动排盘**、推大运、断流年——所有结果由 DeepSeek 大模型用通俗的人话解读，而非机械罗列干支术语。

> ⚡ **v2.0 更新**：八字排盘引擎已完全本地化（`lunar-typescript` + 自建算法），不再依赖任何外部命理 API。零调用限制，隐私数据不出服务器。

---

## ✨ 功能

| 模块 | 说明 |
|------|------|
| 🏠 **首页仪表盘** | 每日运势五维评分（事业/财运/情感/人际/情绪）、宜忌、幸运色/数字/方位、AI 深度分析 |
| 🤖 **AI 八字解读** | 输入生辰 → 本地排盘引擎 → DeepSeek 生成通俗命盘报告（命盘总览/日主解读/五行与生活/大运人生/神煞趣解/人生锦囊） |
| 💬 **AI 命理师对话** | 流式聊天，AI 自动引用用户命盘信息（日主、喜用神、神煞等）作为上下文 |
| 📖 **流年与大运** | 一生大运排布可视化 + 当前流年 AI 提示 + 流年收藏 |
| 👥 **多角色支持** | 最多 5 个命盘档案，一键切换（适合帮家人/朋友查询） |
| 📱 **社区** | 帖子发布、分类（运势心得/命理科普/国学知识/生活感悟）、评论、点赞 |
| 💎 **会员系统** | 免费/月度/季度/年度会员，含模拟购买流程 |
| 🌙 **打卡签到** | 连续签到计数，本地持久化 |
| 📊 **命理图** | 八字命理卡片（四柱五行可视化）、可保存/分享 |

---

## 🏗️ 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | TanStack Start (React 19 + SSR) |
| 构建工具 | Vite 7 + Nitro |
| 语言 | TypeScript 5.8 |
| 样式 | Tailwind CSS 4 + Radix UI (shadcn/ui) |
| 数据库 | SQLite (better-sqlite3) + Drizzle ORM |
| AI 大模型 | DeepSeek (chat/completions，支持 SSE 流式) |
| 八字引擎 | **lunar-typescript** + 自建算法（称骨/纳音/十神/神煞/五行评分/格局判断/喜用神） |
| 图片生成 | 智谱 CogView (Zhipu) |
| 认证 | JWT (jsonwebtoken) |
| 部署 | Docker + docker-compose |
| 运行环境 | Node.js 22 |

---

## 🚀 本地开发

### 前置条件

- **Node.js** ≥ 22
- **npm** ≥ 10

### 1. 克隆项目

```bash
git clone https://github.com/Alisawenting/fortuneAI.git
cd fortuneAI
```

### 2. 环境变量

在项目根目录创建 `.env` 文件：

```bash
# DeepSeek API（必填 — 用于 AI 对话和命盘解读）
# 在 https://platform.deepseek.com 注册后获取
DEEPSEEK_API_KEY=sk-your-key-here

# JWT 密钥（生产环境请更换为随机字符串）
JWT_SECRET=your-random-secret

# 数据库路径
DATABASE_PATH=./data/yunshu.db

# 智谱图片生成（可选）
ZHIPU_API_KEY=your-key

# 环境
NODE_ENV=development
```

### 3. 安装依赖

```bash
npm install
```

### 4. 初始化数据库（首次）

```bash
npx drizzle-kit push
```

### 5. 启动开发服务器

```bash
npm run dev
```

浏览器打开 **http://localhost:3000**。

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（HMR 热更新） |
| `npm run build` | 生产构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 格式化 |

---

## 🐳 Docker 部署

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

容器内部监听 `3000` 端口，宿主机映射到 `80`。SQLite 数据库持久化到宿主机 `./data` 目录。

---

## 📁 项目结构

```text
.
├── src/
│   ├── routes/                  # 页面路由（TanStack Router 文件路由）
│   │   ├── index.tsx            # 首页仪表盘
│   │   ├── divine.tsx           # 八字排盘录入
│   │   ├── chart.tsx            # 命盘结果展示
│   │   ├── reading.tsx          # AI 个性化解读
│   │   ├── chat.tsx             # AI 命理师对话
│   │   ├── community.tsx        # 社区
│   │   ├── shop.tsx             # 会员商城
│   │   ├── profile.tsx          # 个人中心
│   │   ├── bookmarks.tsx        # 收藏
│   │   ├── member.tsx           # 会员管理
│   │   └── user.$name.tsx       # 用户主页
│   ├── components/              # React 组件
│   │   ├── ui/                  # shadcn/ui 组件库
│   │   ├── BaziReport.tsx       # AI 八字分析报告
│   │   ├── ElementLandscape.tsx # 五行命理风景图
│   │   ├── MobileShell.tsx      # 移动端外壳
│   │   └── BrandMark.tsx        # 品牌标识
│   ├── lib/
│   │   ├── bazi/                # 🆕 本地八字计算引擎
│   │   │   ├── calculator.ts    #   核心计算（排盘/测算/运势）
│   │   │   └── lookup.ts        #   查表数据（称骨/纳音/十神/神煞/五行）
│   │   ├── api/                 # 服务端 API 函数
│   │   │   ├── yuanfenju.functions.ts       # 八字排盘/测算/运势
│   │   │   ├── bazi-report.functions.ts     # 八字报告生成
│   │   │   ├── fortune-analysis.functions.ts # 运势深度分析
│   │   │   ├── chat.functions.ts            # AI 对话
│   │   │   ├── community.functions.ts       # 社区逻辑
│   │   │   └── membership.functions.ts      # 会员逻辑
│   │   ├── auth/               # 认证
│   │   └── db/                 # 数据库（连接、Schema、迁移）
│   └── hooks/                  # React Hooks
├── data/                       # SQLite 数据库文件
├── Dockerfile
├── docker-compose.yml
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🔮 八字引擎

### 架构

```
用户输入 (公历/农历 + 出生时辰)
  │
  ▼
lunar-typescript (天文历法 + 干支计算)
  ├── 四柱 (年/月/日/时 天干地支)
  ├── 藏干、纳音、空亡
  ├── 十神 (比肩/劫财/食神/伤官/正财/偏财/正印/偏印/正官/七杀)
  └── 大运/流年/起运时间
  │
  ▼
自建算法
  ├── 神煞 (天乙贵人/文昌/禄神/羊刃/驿马/桃花/华盖/将星/天德/月德/太极/福星等)
  ├── 称骨 (袁天罡称骨歌 — 年/月/日/时查表)
  ├── 五行评分 (天干×15 + 地支×10 + 藏干×5 加权)
  ├── 格局判断 (正印格/偏印格/正官格/七杀格/正财格/偏财格/食神格/伤官格/建禄格/阳刃格)
  ├── 喜用神分析 (身强身弱 → 喜克泄耗 / 喜生扶)
  └── 运势评分 (日柱 vs 今日干支五行关系 + 黄历宜忌)
```

### 完全本地化

八字排盘、测算、运势三项核心功能全部在服务器本地完成，不依赖任何外部 API：
- 无调用次数限制
- 用户八字数据不出服务器
- 零网络延迟

---

## 🧠 AI 依赖

| 服务 | 用途 |
|------|------|
| DeepSeek | AI 命盘解读报告、命理师对话、运势深度分析 |
| 智谱 (Zhipu) | AI 图片生成（可选） |

---

## 📄 License

MIT

---

<p align="center">Made with ❤️ by Alisa</p>
