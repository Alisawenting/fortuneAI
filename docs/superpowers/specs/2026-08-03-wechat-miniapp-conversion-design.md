# Design Spec: 云枢易馆 React → 微信小程序转换

**Date:** 2026-08-03
**Status:** Approved
**Scope:** 全部 12 个页面的前端页面转换为微信小程序原生代码

---

## 1. 目标

将 fortuneAI-code2 (TanStack Start / React 19) 项目的前端 UI 完整转换为微信小程序原生代码，实现一模一样的视觉效果和用户交互。

## 2. 转换策略：纯原生微信小程序

不采用 Taro/uni-app 跨端框架，直接使用 WXML + WXSS + JS 原生开发。

**理由：**
- Tailwind CSS + shadcn/ui 在跨端框架中编译后样式偏差大
- 原生方案像素级可控，还原度最高
- 性能最优，无编译层开销

## 3. 架构映射

| 原项目 | 微信小程序 |
|--------|-----------|
| React 组件 (.tsx) | WXML 模板 + Page/Component |
| Tailwind CSS 4 | WXSS (CSS 变量 + 通用类 + 内联 style) |
| TanStack Router | app.json pages 路由 |
| TanStack React Query | wx.request 封装 + Page setData |
| React useState/useEffect | Page data + 生命周期 (onLoad/onShow) |
| localStorage | wx.setStorageSync / getStorageSync |
| lucide-react | 内联 SVG 组件 |
| shadcn/ui (Radix UI) | 自定义 Component |
| Markdown 渲染 | rich-text + 自定义解析 |
| Recharts 图表 | Canvas 2D API 绑制 |

## 4. 项目结构

```
miniapp/
├── app.json              # 全局配置 + 页面注册 + tabBar
├── app.js                # App() 入口
├── app.wxss              # 全局样式 CSS 变量
├── pages/
│   ├── index/            # 首页仪表盘 (运势、AI分析、打卡、大运流年)
│   ├── divine/           # 八字排盘录入 (公历/农历表单)
│   ├── chart/            # 命盘结果 (四柱、五行、大运、流年、神煞)
│   ├── reading/          # AI 个性化解读
│   ├── chat/             # AI 命理师流式对话
│   ├── community/        # 社区广场 (帖子列表/发帖/图片上传)
│   ├── shop/             # 开运商城 (手串推荐)
│   ├── profile/          # 个人中心 (社交数据/设置)
│   ├── bookmarks/        # 收藏列表
│   ├── member/           # 会员管理
│   ├── user/             # 用户主页
│   └── ziwei-chart/      # 紫微斗数命盘
├── components/
│   ├── bazi-report/      # 八字报告
│   ├── element-landscape/# 五行风景图
│   ├── brand-mark/       # 品牌标识
│   ├── auth-modal/       # 认证弹窗
│   └── ui/               # button/card/dialog/input/select 等基础组件
├── utils/
│   ├── api.js            # wx.request 封装 (对应原 lib/api/*)
│   ├── storage.js        # Storage 工具
│   ├── bazi-calc.js      # 八字计算 (移植自 lib/bazi)
│   └── markdown.js       # Markdown → rich-text nodes
└── styles/
    └── tokens.wxss       # 颜色/字号/间距 tokens
```

## 5. 底部 TabBar

| 标签 | 页面路径 | 说明 |
|------|---------|------|
| 运势 | pages/index/index | 首页仪表盘 |
| 测算 | pages/divine/divine | 八字排盘 |
| 问答 | pages/chat/chat | AI 对话 |
| 广场 | pages/community/community | 社区 |
| 我的 | pages/profile/profile | 个人中心 |

## 6. 关键转换规则

### 6.1 样式 (Tailwind → WXSS)
- CSS 变量：`--primary`、`--jade`、`--cinnabar`、`--gold`、`--muted`、`--card`、`--border` → page 级定义
- 圆角：`rounded-3xl` → `border-radius: 24rpx`
- 阴影：`shadow-soft` → `box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06)`
- 间距：`px-5` → `padding: 0 40rpx`（1rem = 8rpx 换算）
- rpx 适配：1px ≈ 2rpx，设计稿 375px 基准

### 6.2 路由导航
- `<Link to="/xxx">` → `<navigator url="/pages/xxx/xxx">`
- 编程式 `navigate()` → `wx.navigateTo({ url })`
- 路由参数/状态 → URL query string + globalData

### 6.3 数据与状态
- `useState` → Page `data: {}` + `this.setData({})`
- `useEffect(() => {...}, [dep])` → `onLoad()` / `onShow()` + observers
- `useMemo` → computed in `setData` or wxml `wxs` module

### 6.4 API 调用
- 原 `fetch`/SSR 调用 → `wx.request({ url, method, data, success })`
- 后端地址通过 `app.globalData.apiBase` 配置
- SSE 流式（AI 对话）→ `wx.request` + `enableChunked: true`（基础库 2.20.1+）

### 6.5 存储
- `localStorage.getItem/setItem` → `wx.getStorageSync/setStorageSync`
- 存储 key 保持 `yunshu:*` 命名空间

## 7. 页面实现要点

### 首页 (index) — 最复杂页面
- 运势五维评分卡片 (事业/财运/情感/人际/情绪)
- AI 深度分析区域 (Markdown 渲染)
- 今日宜忌 (黄历)
- 打卡签到 (连续天数)
- 大运/流年列表 (横向滚动)
- 角色切换弹窗
- 幸运色/幸运数字/方位

### 测算页 (divine)
- 公历/农历切换
- 年/月/日 picker-view 三级联动
- 性别/姓名/出生时间/地点表单
- 保存为角色选项 + 头像选择
- 生成八字/紫微命盘按钮

### 命盘页 (chart)
- 四柱天干地支网格 (五行颜色标注)
- 基础/专业模式切换
- 五行强弱进度条
- 大运横向滚动卡片 (点击弹窗 AI 解读)
- 流年时间线
- 神煞标签网格
- 命格标签

### 对话页 (chat)
- 消息气泡列表 (markdown/流式)
- 快捷问题建议
- 底部输入栏 + 语音按钮
- 角色切换条
- 自动滚动到底部

### 社区页 (community)
- 分类标签切换
- 瀑布流帖子列表 (图片网格)
- 发帖弹窗 (标题/内容/分类/图片上传)
- 点赞交互
- 图片预览灯箱

### 其他页面
- 商城：商品卡片 + 忌佩提示
- 个人中心：用户信息 + 社交数据 + 设置列表
- 收藏：书签列表
- 会员：会员套餐展示
- 用户主页：他人信息
- 紫微斗数：命盘图表

## 8. 不转换的部分

以下依赖后端/服务端的内容保持 API 调用方式不变：
- 八字排盘计算 (lunar-typescript + 自建算法) — 继续调后端 API
- DeepSeek AI 调用 — 继续调后端 API
- 数据库操作 (Drizzle ORM) — 后端不变
- 认证 JWT — 小程序端存储 token，请求时携带

## 9. 验收标准

- [ ] 全部 12 个页面 UI 与原始 React 版本视觉一致
- [ ] 底部 5 个 tab 导航正常工作
- [ ] 页面间路由跳转正常
- [ ] API 数据获取和展示正常
- [ ] 本地存储（角色、打卡、收藏、缓存）正常
- [ ] 表单交互（日期选择、输入、切换）正常
- [ ] 弹窗/对话框交互正常
- [ ] 在微信开发者工具中编译通过，无报错
