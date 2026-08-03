# 云枢易馆 微信小程序转换 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 fortuneAI-code2 React 项目全部 12 个前端页面转换为微信小程序原生代码

**Architecture:** 纯原生 WXML + WXSS + JS 小程序，app.json 管理路由和 tabBar，自定义组件替代 shadcn/ui，wx.request 替代 TanStack Query，wx.storage 替代 localStorage

**Tech Stack:** 微信小程序原生框架 (WXML/WXSS/JS)，无第三方依赖

**输出目录:** `miniapp/` (项目根目录下)

---

## Phase 1: 项目骨架搭建

### Task 1: 创建小程序项目骨架

**Files:**
- Create: `miniapp/app.json`
- Create: `miniapp/app.js`
- Create: `miniapp/app.wxss`
- Create: `miniapp/project.config.json`
- Create: `miniapp/sitemap.json`

- [ ] **Step 1: 创建 app.json（全局配置 + 路由 + tabBar）**

```json
{
  "pages": [
    "pages/index/index",
    "pages/divine/divine",
    "pages/chart/chart",
    "pages/reading/reading",
    "pages/chat/chat",
    "pages/community/community",
    "pages/shop/shop",
    "pages/profile/profile",
    "pages/bookmarks/bookmarks",
    "pages/member/member",
    "pages/user/user",
    "pages/ziwei-chart/ziwei-chart"
  ],
  "window": {
    "navigationStyle": "custom",
    "backgroundColor": "#f5f2ed",
    "backgroundTextStyle": "dark"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#8b5cf6",
    "backgroundColor": "#ffffff",
    "borderStyle": "white",
    "list": [
      { "pagePath": "pages/index/index", "text": "运势", "iconPath": "assets/tab-home.png", "selectedIconPath": "assets/tab-home-active.png" },
      { "pagePath": "pages/divine/divine", "text": "测算", "iconPath": "assets/tab-divine.png", "selectedIconPath": "assets/tab-divine-active.png" },
      { "pagePath": "pages/chat/chat", "text": "问答", "iconPath": "assets/tab-chat.png", "selectedIconPath": "assets/tab-chat-active.png" },
      { "pagePath": "pages/community/community", "text": "广场", "iconPath": "assets/tab-community.png", "selectedIconPath": "assets/tab-community-active.png" },
      { "pagePath": "pages/profile/profile", "text": "我的", "iconPath": "assets/tab-profile.png", "selectedIconPath": "assets/tab-profile-active.png" }
    ]
  },
  "usingComponents": {}
}
```

- [ ] **Step 2: 创建 app.js（全局逻辑）**

```javascript
App({
  globalData: {
    apiBase: 'https://your-api-server.com', // 后端 API 地址
    activeRoleId: '',
    userInfo: null
  },

  onLaunch() {
    // 恢复用户数据
    const token = wx.getStorageSync('yunshu:auth-token');
    const user = wx.getStorageSync('yunshu:user');
    if (token && user) {
      this.globalData.userInfo = JSON.parse(user);
    }
  }
});
```

- [ ] **Step 3: 创建 app.wxss（全局 CSS 变量与基础样式）**

```css
/* ===== CSS 变量 ===== */
page {
  --primary: #8b5cf6;
  --primary-foreground: #ffffff;
  --jade: #4a9e6e;
  --cinnabar: #d94e3c;
  --gold: #c49a3c;
  --muted: #f3f4f6;
  --muted-foreground: #6b7280;
  --card: #ffffff;
  --border: rgba(0, 0, 0, 0.08);
  --foreground: #1f2937;
  --secondary: #f9fafb;
  --accent: #f0fdf4;
  --gradient-jade: linear-gradient(135deg, #4a9e6e, #3a8b5e);
  --gradient-cinnabar: linear-gradient(135deg, #d94e3c, #c0392b);
  --gradient-gold: linear-gradient(135deg, #c49a3c, #a67c00);
  --gradient-primary: linear-gradient(135deg, #8b5cf6, #7c3aed);

  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
  font-size: 28rpx;
  color: var(--foreground);
  background-color: #f5f2ed;
  box-sizing: border-box;
}

/* ===== 通用原子类（替代 Tailwind） ===== */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.flex-wrap { flex-wrap: wrap; }
.gap-1 { gap: 8rpx; }
.gap-2 { gap: 16rpx; }
.gap-3 { gap: 24rpx; }
.gap-4 { gap: 32rpx; }

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-xs { font-size: 20rpx; }
.text-sm { font-size: 26rpx; }
.text-base { font-size: 30rpx; }
.text-lg { font-size: 34rpx; }
.text-xl { font-size: 38rpx; }

.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.text-primary { color: var(--primary); }
.text-muted { color: var(--muted-foreground); }
.text-foreground { color: var(--foreground); }

.rounded-xl { border-radius: 16rpx; }
.rounded-2xl { border-radius: 24rpx; }
.rounded-3xl { border-radius: 32rpx; }
.rounded-full { border-radius: 9999rpx; }

.shadow-soft { box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.shadow-floating { box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.08); }

.bg-card { background-color: var(--card); }
.bg-primary { background-color: var(--primary); }
.bg-muted { background-color: var(--muted); }

.p-3 { padding: 24rpx; }
.p-4 { padding: 32rpx; }
.p-5 { padding: 40rpx; }
.px-5 { padding-left: 40rpx; padding-right: 40rpx; }
.py-3 { padding-top: 24rpx; padding-bottom: 24rpx; }

.w-full { width: 100%; }
.h-full { height: 100%; }
.overflow-hidden { overflow: hidden; }
.overflow-x-auto { overflow-x: auto; }

.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* ===== 滚动区域（替代 scroll-paper） ===== */
.scroll-paper {
  position: relative;
  overflow: hidden;
}

/* ===== 隐藏滚动条 ===== */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 4: 创建 project.config.json**

```json
{
  "description": "云枢易馆 · 微信小程序",
  "packOptions": { "ignore": [], "include": [] },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": false,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    }
  },
  "compileType": "miniprogram",
  "libVersion": "3.6.0",
  "appid": "YOUR_APPID",
  "projectname": "yunshu-miniapp",
  "condition": {}
}
```

- [ ] **Step 5: 创建 sitemap.json**

```json
{
  "rules": [{ "action": "allow", "page": "*" }]
}
```

---

### Task 2: 创建工具函数模块

**Files:**
- Create: `miniapp/utils/api.js`
- Create: `miniapp/utils/storage.js`
- Create: `miniapp/utils/markdown.js`

- [ ] **Step 1: 创建 api.js（wx.request 封装）**

```javascript
const app = getApp();

/**
 * 统一请求封装
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('yunshu:auth-token');
    wx.request({
      url: (app?.globalData?.apiBase || '') + options.url,
      method: options.method || 'POST',
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      data: options.data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject({ statusCode: res.statusCode, data: res.data });
        }
      },
      fail: (err) => reject(err)
    });
  });
}

// ===== 八字排盘 API =====
function calculateBazi(data) {
  return request({ url: '/api/yuanfenju/calculate', data });
}

function getDailyFortune(data) {
  return request({ url: '/api/yuanfenju/daily-fortune', data });
}

// ===== AI 对话 API =====
function sendChatMessage(data) {
  return request({ url: '/api/chat/send', data });
}

// ===== 八字报告 API =====
function generateBaziReport(data) {
  return request({ url: '/api/bazi-report/generate', data });
}

function analyzeFortune(data) {
  return request({ url: '/api/fortune-analysis/analyze', data });
}

function analyzeDayunDetail(data) {
  return request({ url: '/api/fortune-analysis/dayun-detail', data });
}

// ===== 社区 API =====
function getPosts(data) {
  return request({ url: '/api/community/posts', data });
}

function createPost(data) {
  return request({ url: '/api/community/create-post', data });
}

function toggleLike(data) {
  return request({ url: '/api/community/toggle-like', data });
}

// ===== 认证 API =====
function login(data) {
  return request({ url: '/api/auth/login', data });
}

function register(data) {
  return request({ url: '/api/auth/register', data });
}

// ===== 紫微 API =====
function calculateZiwei(data) {
  return request({ url: '/api/ziwei/calculate', data });
}

module.exports = {
  request,
  calculateBazi,
  getDailyFortune,
  sendChatMessage,
  generateBaziReport,
  analyzeFortune,
  analyzeDayunDetail,
  getPosts,
  createPost,
  toggleLike,
  login,
  register,
  calculateZiwei
};
```

- [ ] **Step 2: 创建 storage.js（本地存储工具）**

```javascript
const STORAGE_PREFIX = 'yunshu:';

function getItem(key) {
  try {
    const value = wx.getStorageSync(STORAGE_PREFIX + key);
    return value || null;
  } catch (e) {
    return null;
  }
}

function setItem(key, value) {
  try {
    wx.setStorageSync(STORAGE_PREFIX + key, value);
  } catch (e) {
    console.error('Storage set failed:', e);
  }
}

function removeItem(key) {
  try {
    wx.removeStorageSync(STORAGE_PREFIX + key);
  } catch (e) {
    console.error('Storage remove failed:', e);
  }
}

function getJSON(key) {
  try {
    const raw = getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setJSON(key, value) {
  try {
    setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage setJSON failed:', e);
  }
}

module.exports = {
  getItem, setItem, removeItem,
  getJSON, setJSON
};
```

- [ ] **Step 3: 创建 markdown.js（Markdown → rich-text nodes）**

```javascript
/**
 * 简易 Markdown → rich-text nodes 转换
 * 支持: **bold**, *italic*, 换行, 列表
 */
function mdToNodes(text) {
  if (!text) return [];
  const nodes = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      if (nodes.length > 0) nodes.push({ name: 'br' });
      continue;
    }

    // 处理行内 markdown
    let processed = line
      .replace(/\*\*(.+?)\*\*/g, '<span style="font-weight:bold">$1</span>')
      .replace(/\*(.+?)\*/g, '<span style="font-style:italic">$1</span>')
      .replace(/💡/g, '<span style="color:var(--primary)">💡</span>');

    nodes.push({
      name: 'p',
      attrs: { style: 'line-height:1.8;margin-bottom:8rpx' },
      children: [{ type: 'text', text: processed }]
    });
  }

  return nodes;
}

/**
 * 将 markdown 文本渲染到 rich-text 的 nodes 格式
 * 微信 rich-text 只支持有限的标签，这里做保守转换
 */
function parseMarkdown(text) {
  if (!text) return [];
  const result = [];
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) continue;

    // 处理加粗 **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const children = [];

    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        children.push({
          name: 'span',
          attrs: { style: 'font-weight:bold;color:#1f2937' },
          children: [{ type: 'text', text: part.slice(2, -2) }]
        });
      } else if (part) {
        children.push({ type: 'text', text: part });
      }
    }

    result.push({
      name: 'p',
      attrs: { style: 'line-height:2;margin-bottom:12rpx;font-size:28rpx;color:#374151' },
      children
    });
  }

  return result;
}

module.exports = { mdToNodes, parseMarkdown };
```

---

## Phase 2: UI 基础组件

### Task 3: 创建 UI 基础组件（按钮、卡片、输入框、骨架屏、标签）

**Files:**
- Create: `miniapp/components/ui/button/button.wxml`
- Create: `miniapp/components/ui/button/button.wxss`
- Create: `miniapp/components/ui/button/button.js`
- Create: `miniapp/components/ui/button/button.json`
- Create: `miniapp/components/ui/card/card.wxml`
- Create: `miniapp/components/ui/card/card.wxss`
- Create: `miniapp/components/ui/card/card.js`
- Create: `miniapp/components/ui/card/card.json`
- Create: `miniapp/components/ui/input/input.wxml`
- Create: `miniapp/components/ui/input/input.wxss`
- Create: `miniapp/components/ui/input/input.js`
- Create: `miniapp/components/ui/input/input.json`
- Create: `miniapp/components/ui/skeleton/skeleton.wxml`
- Create: `miniapp/components/ui/skeleton/skeleton.wxss`
- Create: `miniapp/components/ui/skeleton/skeleton.js`
- Create: `miniapp/components/ui/skeleton/skeleton.json`

- [ ] **Step 1: Button 组件**

`button.wxml`:
```xml
<button
  class="ui-btn {{variant}} {{size}} {{full ? 'w-full' : ''}}"
  style="{{customStyle}}"
  hover-class="ui-btn-hover"
  disabled="{{disabled || loading}}"
  bindtap="onTap"
>
  <block wx:if="{{loading}}">
    <text class="loading-icon">⟳</text>
  </block>
  <slot wx:else />
</button>
```

`button.wxss`:
```css
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 32rpx;
  font-size: 28rpx;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  padding: 0;
  margin: 0;
}

.ui-btn::after { border: none; }

/* Variants */
.primary {
  background: var(--primary);
  color: var(--primary-foreground);
}
.outline {
  background: transparent;
  border: 2rpx solid var(--border);
  color: var(--foreground);
}
.ghost {
  background: transparent;
  color: var(--muted-foreground);
}

/* Sizes */
.sm { padding: 12rpx 24rpx; font-size: 24rpx; }
.md { padding: 20rpx 40rpx; font-size: 28rpx; }
.lg { padding: 28rpx 56rpx; font-size: 32rpx; }

.ui-btn-hover { opacity: 0.85; }
.w-full { width: 100%; }

.loading-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

`button.js`:
```javascript
Component({
  properties: {
    variant: { type: String, value: 'primary' },
    size: { type: String, value: 'md' },
    full: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    loading: { type: Boolean, value: false },
    customStyle: { type: String, value: '' }
  },
  methods: {
    onTap() {
      if (!this.properties.disabled && !this.properties.loading) {
        this.triggerEvent('click');
      }
    }
  }
});
```

`button.json`:
```json
{
  "component": true,
  "usingComponents": {}
}
```

- [ ] **Step 2: Card 组件**

`card.wxml`:
```xml
<view class="ui-card {{padding}}" style="{{customStyle}}">
  <slot />
</view>
```

`card.wxss`:
```css
.ui-card {
  background: var(--card);
  border-radius: 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
  overflow: hidden;
}
.p-sm { padding: 24rpx; }
.p-md { padding: 32rpx; }
.p-lg { padding: 40rpx; }
```

`card.js`:
```javascript
Component({
  properties: {
    padding: { type: String, value: 'p-lg' },
    customStyle: { type: String, value: '' }
  }
});
```

`card.json`:
```json
{ "component": true, "usingComponents": {} }
```

- [ ] **Step 3: Input 组件**

`input.wxml`:
```xml
<view class="ui-input-wrap">
  <text class="ui-input-label" wx:if="{{label}}">{{label}}</text>
  <input
    class="ui-input"
    value="{{value}}"
    placeholder="{{placeholder}}"
    type="{{type}}"
    password="{{password}}"
    disabled="{{disabled}}"
    focus="{{focus}}"
    bindinput="onInput"
    bindfocus="onFocus"
    bindblur="onBlur"
  />
</view>
```

`input.wxss`:
```css
.ui-input-wrap { margin-bottom: 24rpx; }
.ui-input-label {
  display: block;
  font-size: 24rpx;
  color: var(--muted-foreground);
  margin-bottom: 12rpx;
}
.ui-input {
  width: 100%;
  padding: 24rpx 32rpx;
  border: 2rpx solid var(--border);
  border-radius: 24rpx;
  background: var(--card);
  font-size: 28rpx;
  box-sizing: border-box;
}
```

`input.js`:
```javascript
Component({
  properties: {
    label: String,
    value: String,
    placeholder: { type: String, value: '' },
    type: { type: String, value: 'text' },
    password: { type: Boolean, value: false },
    disabled: { type: Boolean, value: false },
    focus: { type: Boolean, value: false }
  },
  methods: {
    onInput(e) { this.triggerEvent('change', e.detail); },
    onFocus() { this.triggerEvent('focus'); },
    onBlur() { this.triggerEvent('blur'); }
  }
});
```

`input.json`:
```json
{ "component": true, "usingComponents": {} }
```

- [ ] **Step 4: Skeleton 骨架屏组件**

`skeleton.wxml`:
```xml
<view class="skeleton {{shape}}" style="width:{{width}};height:{{height}};{{customStyle}}">
  <view class="skeleton-shimmer"></view>
</view>
```

`skeleton.wxss`:
```css
.skeleton {
  background: #e5e7eb;
  position: relative;
  overflow: hidden;
}
.skeleton.rounded { border-radius: 16rpx; }
.skeleton.circle { border-radius: 50%; }
.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

`skeleton.js`:
```javascript
Component({
  properties: {
    width: { type: String, value: '200rpx' },
    height: { type: String, value: '32rpx' },
    shape: { type: String, value: 'rounded' },
    customStyle: { type: String, value: '' }
  }
});
```

`skeleton.json`:
```json
{ "component": true, "usingComponents": {} }
```

---

### Task 4: 创建弹窗/对话框组件

**Files:**
- Create: `miniapp/components/ui/dialog/dialog.wxml`
- Create: `miniapp/components/ui/dialog/dialog.wxss`
- Create: `miniapp/components/ui/dialog/dialog.js`
- Create: `miniapp/components/ui/dialog/dialog.json`

- [ ] **创建 Dialog 弹窗组件**

`dialog.wxml`:
```xml
<view class="dialog-overlay" wx:if="{{visible}}" bindtap="onClose">
  <view class="dialog-content" catchtap="noop">
    <view class="dialog-header" wx:if="{{title}}">
      <text class="dialog-title">{{title}}</text>
      <text class="dialog-desc" wx:if="{{description}}">{{description}}</text>
    </view>
    <view class="dialog-body">
      <slot />
    </view>
    <view class="dialog-footer" wx:if="{{showFooter}}">
      <button class="dialog-btn cancel" bindtap="onClose">取消</button>
      <button class="dialog-btn confirm" bindtap="onConfirm">确定</button>
    </view>
  </view>
</view>
```

`dialog.wxss`:
```css
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}
.dialog-content {
  background: var(--card);
  border-radius: 32rpx;
  padding: 40rpx;
  width: 100%;
  max-width: 600rpx;
  box-shadow: 0 16rpx 48rpx rgba(0,0,0,0.12);
}
.dialog-header {
  text-align: center;
  margin-bottom: 24rpx;
}
.dialog-title {
  font-size: 34rpx;
  font-weight: 600;
}
.dialog-desc {
  font-size: 26rpx;
  color: var(--muted-foreground);
  margin-top: 8rpx;
}
.dialog-body {
  font-size: 28rpx;
  line-height: 1.8;
  color: var(--foreground);
  max-height: 60vh;
  overflow-y: auto;
}
.dialog-footer {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}
.dialog-btn {
  flex: 1;
  padding: 24rpx;
  border-radius: 24rpx;
  font-size: 28rpx;
}
.dialog-btn.cancel {
  background: var(--muted);
  color: var(--muted-foreground);
}
.dialog-btn.confirm {
  background: var(--primary);
  color: var(--primary-foreground);
}
```

`dialog.js`:
```javascript
Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    showFooter: { type: Boolean, value: false }
  },
  methods: {
    onClose() { this.triggerEvent('close'); },
    onConfirm() { this.triggerEvent('confirm'); },
    noop() {}
  }
});
```

`dialog.json`:
```json
{ "component": true, "usingComponents": {} }
```

---

## Phase 3: 页面转换（按优先级）

### Task 5: 首页仪表盘 (pages/index)

**Files:**
- Create: `miniapp/pages/index/index.wxml`
- Create: `miniapp/pages/index/index.wxss`
- Create: `miniapp/pages/index/index.js`
- Create: `miniapp/pages/index/index.json`

- [ ] **Step 1: 创建 index.json**

```json
{
  "usingComponents": {
    "ui-card": "/components/ui/card/card",
    "ui-skeleton": "/components/ui/skeleton/skeleton",
    "ui-dialog": "/components/ui/dialog/dialog"
  },
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 创建 index.wxml**

```xml
<view class="page">
  <!-- Header -->
  <view class="header px-5">
    <view class="flex items-center gap-3">
      <view class="brand-mark"><text class="brand-icon">☰</text></view>
      <view>
        <text class="brand-title">云枢易馆</text>
        <text class="brand-sub">古法藏枢机 · AI 解流年</text>
      </view>
    </view>
    <navigator url="/pages/profile/profile" class="member-link">会员中心</navigator>
  </view>

  <!-- 角色切换 -->
  <view class="role-switch px-5" bindtap="onRoleSwitch">
    <view class="role-avatar">{{activeRole.avatar || '🌿'}}</view>
    <view class="flex-1">
      <view class="flex items-center gap-2">
        <text class="role-name">{{activeRole.name || '我自己'}}</text>
        <text class="role-meta">{{activeRole.gender}} · {{activeRole.birthDate}}</text>
      </view>
      <text class="role-hint">点此切换角色查看运势 · 共 {{roles.length}}/5</text>
    </view>
    <text class="arrow">▾</text>
  </view>

  <!-- 日期 -->
  <view class="date-row px-5">
    <text>丙午年 · 癸巳月 · 戊辰日</text>
    <text class="ml-auto">芒种 第三日</text>
  </view>

  <!-- 五维运势评分 -->
  <ui-card customStyle="margin: 0 40rpx;">
    <text class="section-label">{{yunshiData ? '今日命理指数 · ' + yunshiData.yunshi_info.jixiong_today : '今日命理指数'}}</text>
    <view class="fortune-grid">
      <block wx:if="{{loading}}">
        <view class="fortune-item" wx:for="{{[1,2,3,4,5]}}" wx:key="*this">
          <ui-skeleton width="80rpx" height="80rpx" shape="circle"></ui-skeleton>
          <ui-skeleton width="64rpx" height="24rpx"></ui-skeleton>
          <ui-skeleton width="80rpx" height="24rpx"></ui-skeleton>
        </view>
      </block>
      <block wx:else>
        <view
          class="fortune-item"
          wx:for="{{fortunes}}"
          wx:key="key"
          data-key="{{item.key}}"
          bindtap="onFortuneDetail"
        >
          <view class="fortune-icon" style="background: {{item.iconBg}}">
            <text>{{item.emoji}}</text>
          </view>
          <text class="fortune-key">{{item.key}}</text>
          <text class="fortune-score" style="color: {{item.barColor}}">{{item.score}}</text>
          <view class="score-bar">
            <view class="score-bar-fill" style="width: {{item.score}}%; background: {{item.barColor}}"></view>
          </view>
        </view>
      </block>
    </view>
  </ui-card>

  <!-- 下半区 -->
  <view class="content-area px-5">

    <!-- AI 深度分析 -->
    <view class="ai-section">
      <view class="flex items-center justify-between">
        <view class="flex items-center gap-2 ai-label">
          <text>✦</text>
          <text>{{aiLoading ? 'AI 正在分析命盘...' : 'AI 命理深度分析'}}</text>
        </view>
        <text class="share-btn">分享</text>
      </view>

      <block wx:if="{{loading}}">
        <ui-skeleton wx:for="{{[1,2,3,4,5]}}" wx:key="*this" width="100%" height="32rpx" customStyle="margin-top:16rpx"></ui-skeleton>
      </block>

      <block wx:elif="{{aiAnalysis && aiAnalysis.dailyComment}}">
        <view class="ai-content">
          <rich-text nodes="{{aiNodes}}"></rich-text>
        </view>
        <view class="ai-tags">
          <text class="ai-tag" wx:if="{{aiAnalysis.careerHint}}">事业：{{aiAnalysis.careerHint}}</text>
          <text class="ai-tag" wx:if="{{aiAnalysis.wealthHint}}">财运：{{aiAnalysis.wealthHint}}</text>
          <text class="ai-tag" wx:if="{{aiAnalysis.loveHint}}">情感：{{aiAnalysis.loveHint}}</text>
          <text class="ai-tag" wx:if="{{aiAnalysis.healthHint}}">健康：{{aiAnalysis.healthHint}}</text>
        </view>
        <text class="ai-advice" wx:if="{{aiAnalysis.luckyAdvice}}">💡 {{aiAnalysis.luckyAdvice}}</text>
        <view class="ai-links">
          <navigator url="/pages/reading/reading" class="ai-link-primary">查看完整解读 ▸</navigator>
          <navigator url="/pages/chat/chat" class="ai-link-ghost">追问 AI</navigator>
        </view>
      </block>

      <block wx:else>
        <text class="ai-fallback">{{yunshiData ? yunshiData.yunshi_info.fortune_description : '水木相生，今日宜静中观变...'}}</text>
        <view class="ai-links">
          <navigator url="/pages/reading/reading" class="ai-link-primary">查看完整 AI 解读 ▸</navigator>
          <navigator url="/pages/chat/chat" class="ai-link-ghost">追问 AI</navigator>
        </view>
      </block>
    </view>

    <!-- 幸运色 + 幸运数字 -->
    <view class="lucky-row">
      <view class="lucky-card">
        <view class="flex items-center gap-2"><text>🎨</text><text>今日幸运色</text></view>
        <view class="lucky-colors">
          <view
            class="lucky-color-dot"
            wx:for="{{luckyColors}}"
            wx:key="name"
            style="background: {{item.hex}}"
          ></view>
          <text class="lucky-color-name">{{item.name}}</text>
        </view>
      </view>
      <view class="lucky-card">
        <view class="flex items-center gap-2"><text>🔢</text><text>今日幸运数字</text></view>
        <view class="lucky-nums">
          <text class="lucky-num" wx:for="{{luckyNumbers}}" wx:key="*this">{{item}}</text>
          <view class="lucky-extra">
            <text>方位：{{yunshiData ? yunshiData.yunshi_info.lucky_directions : '正北'}}</text>
            <text>时辰：巳时 09:00-11:00</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 今日宜忌 -->
    <view class="yiji-section">
      <view class="flex items-center justify-between">
        <text class="section-title">今日宜忌</text>
        <text class="section-sub">黄历 · 戊辰日</text>
      </view>
      <view class="yiji-grid">
        <view class="yiji-card yi">
          <view class="yiji-header">
            <view class="yiji-icon yi-icon">✓</view>
            <text class="yiji-label yi-label">宜</text>
          </view>
          <view class="yiji-tags">
            <text class="yiji-tag" wx:for="{{yiList}}" wx:key="*this">{{item}}</text>
          </view>
        </view>
        <view class="yiji-card ji">
          <view class="yiji-header">
            <view class="yiji-icon ji-icon">✕</view>
            <text class="yiji-label ji-label">忌</text>
          </view>
          <view class="yiji-tags">
            <text class="yiji-tag" wx:for="{{jiList}}" wx:key="*this">{{item}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 打卡 -->
    <view class="checkin-section">
      <view class="flex items-center justify-between">
        <view>
          <text class="checkin-title">今日运势打卡</text>
          <text class="checkin-desc">{{checkedToday ? '今日已打卡 · 连续 ' + checkInDays + ' 天' : '已连续打卡 ' + checkInDays + ' 天 · 积分 +' + (10 + checkInDays)}}</text>
        </view>
        <button class="checkin-btn {{checkedToday ? 'checked' : ''}}" disabled="{{checkedToday}}" bindtap="onCheckIn">
          {{checkedToday ? '已打卡' : '打卡'}}
        </button>
      </view>
      <view class="checkin-bars">
        <view class="checkin-bar {{index < (checkInDays % 7) ? 'filled' : ''}}" wx:for="{{[0,1,2,3,4,5,6]}}" wx:key="*this"></view>
      </view>
    </view>

    <!-- 大运 & 流年 -->
    <view class="dayun-section">
      <view class="flex items-center justify-between mb-3">
        <view class="flex items-center gap-2">
          <text class="text-cinnabar">🔥</text>
          <text class="section-title">大运 · 流年</text>
        </view>
        <navigator url="/pages/reading/reading" class="detail-link">查看详情 →</navigator>
      </view>

      <!-- 当前大运 -->
      <view class="current-dayun" wx:if="{{currentDayun}}">
        <text class="dayun-label">当前大运</text>
        <view class="flex items-center justify-between">
          <text class="dayun-gz">{{currentDayun.gz}} ({{currentDayun.age}}岁)</text>
          <text class="dayun-god">{{currentDayun.note || '大运'}}</text>
        </view>
      </view>

      <!-- 流年列表 -->
      <view class="liunian-list" wx:if="{{liunianList.length > 0}}">
        <view
          class="liunian-item"
          wx:for="{{liunianList}}"
          wx:key="year"
        >
          <view class="liunian-dot {{item.isCurrent ? 'current' : ''}}"></view>
          <view class="flex-1">
            <view class="flex items-center gap-2">
              <text class="liunian-year">{{item.year}}年</text>
              <text class="liunian-ganzhi">{{item.ganzhi}}</text>
              <text class="liunian-shishen">{{item.shishen}}</text>
              <text class="liunian-current-tag" wx:if="{{item.isCurrent}}">当前</text>
            </view>
            <text class="liunian-hint">{{item.hint}}</text>
          </view>
        </view>
      </view>

      <!-- 大运横向滚动 -->
      <scroll-view class="dayun-scroll" scroll-x enable-flex wx:if="{{dayunList.length > 0}}">
        <view
          class="dayun-card {{item.current ? 'active' : ''}}"
          wx:for="{{dayunList}}"
          wx:key="age"
          data-gz="{{item.gz}}"
          data-god="{{item.note}}"
          data-age="{{item.age}}"
          bindtap="onDayunDetail"
        >
          <text class="dayun-card-age">{{item.age}}岁</text>
          <text class="dayun-card-gz {{item.current ? 'text-primary' : ''}}">{{item.gz}}</text>
          <text class="dayun-card-note">{{item.note}}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 国学科普入口 -->
    <navigator url="/pages/community/community" class="kepu-entry">
      <text>✦</text>
      <view class="flex-1">
        <text>国学小科普 · 何为「枢」？</text>
        <text>天地之中曰枢，命理之机藏其内 →</text>
      </view>
    </navigator>

  </view>
</view>

<!-- 五维详情弹窗 -->
<ui-dialog
  visible="{{fortuneDialogVisible}}"
  title="{{fortuneDetail.key}}运 · 今日详解"
  description=""
  bindclose="onCloseFortuneDetail"
>
  <view class="fortune-detail-body">
    <view class="score-bar">
      <view class="score-bar-fill" style="width: {{fortuneDetail.score}}%; background: var(--primary)"></view>
    </view>
    <text class="fortune-detail-score">{{fortuneDetail.score}}分</text>
    <text class="fortune-detail-text">{{fortuneDetail.desc}}</text>
  </view>
</ui-dialog>

<!-- 大运详情弹窗 -->
<ui-dialog
  visible="{{dayunDialogVisible}}"
  title="{{dayunDialogData.age}}岁 · 大运「{{dayunDialogData.gz}}」"
  description="{{dayunDialogData.god}}"
  bindclose="onCloseDayunDetail"
>
  <view class="dayun-dialog-body">
    <block wx:if="{{dayunLoading}}">
      <view class="loading-wrap"><text class="loading-spin">⟳</text><text>AI 正在解读这段大运...</text></view>
    </block>
    <block wx:else>
      <rich-text nodes="{{dayunAnalysisNodes}}"></rich-text>
    </block>
  </view>
</ui-dialog>

<!-- 角色切换弹窗 -->
<ui-dialog
  visible="{{roleDialogVisible}}"
  title="切换角色"
  description="最多可保存 5 个角色档案"
  bindclose="onCloseRoleDialog"
>
  <view class="role-list">
    <view
      class="role-item {{item.id === activeRole.id ? 'active' : ''}}"
      wx:for="{{roles}}"
      wx:key="id"
      data-id="{{item.id}}"
      bindtap="onSwitchRole"
    >
      <text class="role-item-avatar">{{item.avatar || '🌿'}}</text>
      <view class="flex-1">
        <text class="role-item-name">{{item.name}}</text>
        <text class="role-item-meta">{{item.gender}} · {{item.birthDate}} {{item.birthTime}}</text>
      </view>
      <text class="role-item-check" wx:if="{{item.id === activeRole.id}}">✓</text>
      <text class="role-item-delete" data-id="{{item.id}}" data-name="{{item.name}}" catchtap="onDeleteRole">✕</text>
    </view>
    <navigator
      url="/pages/divine/divine"
      class="role-add"
      wx:if="{{roles.length < 5}}"
      bindtap="onCloseRoleDialog"
    >
      <text>+ 新增角色（{{roles.length}}/5）</text>
    </navigator>
  </view>
</ui-dialog>
```

- [ ] **Step 3: 创建 index.wxss**

```css
.page { padding-top: 80rpx; }

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
  padding-bottom: 20rpx;
}
.brand-mark {
  width: 80rpx; height: 80rpx;
  border-radius: 24rpx;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.brand-icon { color: white; font-size: 36rpx; }
.brand-title { font-size: 36rpx; font-weight: 600; display: block; }
.brand-sub { font-size: 22rpx; color: var(--muted-foreground); display: block; }
.member-link {
  padding: 12rpx 24rpx;
  border-radius: 9999rpx;
  border: 2rpx solid var(--border);
  background: var(--card);
  font-size: 24rpx;
  color: var(--muted-foreground);
}

/* 角色切换 */
.role-switch {
  display: flex; align-items: center; gap: 24rpx;
  margin-top: 40rpx;
  padding: 24rpx;
  border-radius: 32rpx;
  border: 2rpx solid var(--border);
  background: var(--card);
}
.role-avatar {
  width: 80rpx; height: 80rpx;
  border-radius: 24rpx;
  background: rgba(139, 92, 246, 0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 40rpx;
}
.role-name { font-size: 28rpx; font-weight: 500; }
.role-meta {
  font-size: 20rpx; color: var(--muted-foreground);
  padding: 4rpx 12rpx; border-radius: 9999rpx; background: var(--muted);
}
.role-hint { font-size: 22rpx; color: var(--muted-foreground); display: block; margin-top: 4rpx; }
.arrow { font-size: 28rpx; color: var(--muted-foreground); }

/* 日期 */
.date-row {
  display: flex; align-items: center; gap: 16rpx;
  margin-top: 32rpx;
  font-size: 24rpx; color: var(--muted-foreground);
}

/* 五维运势 */
.section-label {
  font-size: 28rpx; color: var(--muted-foreground);
  display: block; margin-bottom: 24rpx;
}
.fortune-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16rpx;
}
.fortune-item {
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  padding: 8rpx;
  border-radius: 24rpx;
  transition: transform 0.15s;
}
.fortune-item:active { transform: scale(0.95); }
.fortune-icon {
  width: 72rpx; height: 72rpx; border-radius: 24rpx;
  display: flex; align-items: center; justify-content: center;
  background: rgba(139, 92, 246, 0.08);
  color: var(--primary);
  font-size: 28rpx;
}
.fortune-key { font-size: 20rpx; color: var(--foreground); }
.fortune-score { font-size: 24rpx; font-weight: 500; }
.score-bar {
  width: 100%; height: 6rpx; border-radius: 9999rpx;
  background: var(--muted); overflow: hidden;
}
.score-bar-fill { height: 100%; border-radius: 9999rpx; }

/* ===== 内容区 ===== */
.content-area { margin-top: 32rpx; }
.content-area > view, .content-area > navigator {
  margin-bottom: 40rpx;
}
.content-area > view:last-child { margin-bottom: 0; }

/* AI 分析 */
.ai-section {
  padding: 40rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, rgba(139,92,246,0.08), var(--card), rgba(196,154,60,0.08));
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
}
.ai-label { font-size: 24rpx; color: var(--primary); }
.share-btn { font-size: 24rpx; color: var(--muted-foreground); }
.ai-content { margin-top: 24rpx; font-size: 28rpx; line-height: 2; color: var(--foreground); }
.ai-tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 24rpx; }
.ai-tag {
  padding: 8rpx 20rpx; border-radius: 9999rpx;
  background: var(--card); font-size: 22rpx; line-height: 1.6;
}
.ai-advice { font-size: 22rpx; color: var(--primary); font-style: italic; margin-top: 16rpx; display: block; }
.ai-links { display: flex; align-items: center; gap: 24rpx; margin-top: 32rpx; }
.ai-link-primary {
  padding: 12rpx 24rpx; border-radius: 9999rpx;
  background: rgba(139,92,246,0.1); color: var(--primary); font-size: 24rpx;
}
.ai-link-ghost {
  padding: 12rpx 24rpx; border-radius: 9999rpx;
  border: 2rpx solid var(--border); color: var(--muted-foreground); font-size: 24rpx;
}
.ai-fallback { display: block; margin-top: 24rpx; font-size: 30rpx; line-height: 2; color: var(--foreground); }

/* 幸运色 & 数字 */
.lucky-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; }
.lucky-card { padding: 32rpx; border-radius: 32rpx; background: var(--card); box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.lucky-colors { display: flex; align-items: center; gap: 16rpx; margin-top: 24rpx; }
.lucky-color-dot {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
  border: 4rpx solid var(--border);
}
.lucky-color-name { font-size: 20rpx; color: var(--muted-foreground); }
.lucky-nums { display: flex; align-items: center; gap: 16rpx; margin-top: 24rpx; }
.lucky-num {
  width: 72rpx; height: 72rpx; border-radius: 24rpx;
  background: rgba(139,92,246,0.1);
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: var(--primary);
}
.lucky-extra { font-size: 20rpx; color: var(--muted-foreground); line-height: 1.6; }

/* 宜忌 */
.yiji-section { padding: 40rpx; border-radius: 32rpx; background: var(--card); box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.yiji-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; margin-top: 24rpx; }
.yiji-card { padding: 24rpx; border-radius: 24rpx; }
.yiji-card.yi { border: 2rpx solid rgba(74,158,110,0.3); background: rgba(74,158,110,0.06); }
.yiji-card.ji { border: 2rpx solid rgba(217,78,60,0.3); background: rgba(217,78,60,0.06); }
.yiji-header { display: flex; align-items: center; gap: 12rpx; }
.yiji-icon { width: 40rpx; height: 40rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24rpx; color: white; }
.yi-icon { background: var(--jade); }
.ji-icon { background: var(--cinnabar); }
.yi-label { color: var(--jade); }
.ji-label { color: var(--cinnabar); }
.yiji-tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 16rpx; }
.yiji-tag { padding: 8rpx 20rpx; border-radius: 9999rpx; background: var(--card); font-size: 22rpx; color: var(--foreground); }

/* 打卡 */
.checkin-section { padding: 40rpx; border-radius: 32rpx; border: 2rpx solid var(--border); background: var(--card); box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.checkin-title { font-size: 32rpx; font-weight: 500; display: block; }
.checkin-desc { font-size: 24rpx; color: var(--muted-foreground); display: block; margin-top: 8rpx; }
.checkin-btn {
  padding: 20rpx 40rpx; border-radius: 9999rpx;
  font-size: 28rpx; font-weight: 500;
  background: var(--primary); color: var(--primary-foreground);
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.08);
  border: none;
}
.checkin-btn.checked { background: var(--muted); color: var(--muted-foreground); }
.checkin-bars { display: flex; gap: 12rpx; margin-top: 32rpx; }
.checkin-bar { flex: 1; height: 12rpx; border-radius: 9999rpx; background: var(--border); }
.checkin-bar.filled { background: var(--primary); }

/* 大运 & 流年 */
.dayun-section { padding: 40rpx; border-radius: 32rpx; background: var(--card); box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.section-title { font-size: 30rpx; font-weight: 500; }
.section-sub { font-size: 22rpx; color: var(--muted-foreground); }
.detail-link { font-size: 24rpx; color: var(--primary); }
.text-cinnabar { color: var(--cinnabar); }
.mb-3 { margin-bottom: 24rpx; }
.ml-auto { margin-left: auto; }

.current-dayun {
  padding: 24rpx; border-radius: 24rpx;
  background: rgba(139,92,246,0.05);
  border: 2rpx solid rgba(139,92,246,0.2);
  margin-bottom: 24rpx;
}
.dayun-label { font-size: 22rpx; color: var(--muted-foreground); display: block; }
.dayun-gz { font-size: 32rpx; color: var(--primary); }
.dayun-god {
  padding: 8rpx 20rpx; border-radius: 9999rpx;
  background: rgba(139,92,246,0.1); font-size: 22rpx; color: var(--primary);
}

/* 流年列表 */
.liunian-list { margin-bottom: 24rpx; }
.liunian-item { display: flex; align-items: flex-start; gap: 24rpx; padding: 16rpx 16rpx; margin: 0 -16rpx; border-radius: 24rpx; }
.liunian-dot { width: 12rpx; height: 12rpx; border-radius: 50%; margin-top: 12rpx; background: var(--accent); flex-shrink: 0; }
.liunian-dot.current { background: var(--primary); }
.liunian-year { font-size: 28rpx; font-weight: 500; }
.liunian-ganzhi { font-size: 22rpx; color: var(--muted-foreground); }
.liunian-shishen { font-size: 20rpx; color: var(--primary); }
.liunian-current-tag {
  padding: 4rpx 12rpx; border-radius: 9999rpx;
  background: rgba(139,92,246,0.1); font-size: 20rpx; color: var(--primary);
}
.liunian-hint { font-size: 24rpx; color: var(--muted-foreground); margin-top: 4rpx; display: block; }

/* 大运横向滚动 */
.dayun-scroll { white-space: nowrap; padding-bottom: 8rpx; }
.dayun-card {
  display: inline-flex; flex-direction: column; align-items: center;
  min-width: 176rpx; padding: 24rpx 16rpx; margin-right: 16rpx;
  border-radius: 24rpx; border: 2rpx solid var(--border);
  background: var(--card); text-align: center;
}
.dayun-card.active { border-color: var(--primary); background: rgba(139,92,246,0.05); }
.dayun-card:active { transform: scale(0.95); }
.dayun-card-age { font-size: 20rpx; color: var(--muted-foreground); }
.dayun-card-gz { font-size: 28rpx; margin-top: 8rpx; }
.dayun-card-note { font-size: 20rpx; color: var(--muted-foreground); margin-top: 4rpx; }

/* 国学入口 */
.kepu-entry {
  display: flex; align-items: center; gap: 24rpx;
  padding: 32rpx; border-radius: 32rpx;
  background: rgba(249,250,251,0.6);
  font-size: 24rpx; color: var(--muted-foreground);
}

/* 弹窗 */
.fortune-detail-body { text-align: center; }
.fortune-detail-score { font-size: 28rpx; color: var(--muted-foreground); margin-top: 16rpx; display: block; }
.fortune-detail-text { font-size: 28rpx; line-height: 2; color: var(--foreground); margin-top: 16rpx; display: block; }
.dayun-dialog-body { font-size: 28rpx; line-height: 2; color: var(--foreground); max-height: 60vh; overflow-y: auto; }
.loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 48rpx 0; }
.loading-spin { font-size: 48rpx; color: var(--primary); animation: spin 1s linear infinite; }

/* 角色列表 */
.role-list { display: flex; flex-direction: column; gap: 16rpx; }
.role-item {
  display: flex; align-items: center; gap: 24rpx;
  padding: 24rpx; border-radius: 24rpx;
  border: 2rpx solid var(--border); background: var(--card);
}
.role-item.active { border-color: var(--primary); background: rgba(139,92,246,0.05); }
.role-item-avatar {
  width: 80rpx; height: 80rpx; border-radius: 24rpx;
  background: var(--muted); display: flex; align-items: center; justify-content: center; font-size: 40rpx;
}
.role-item-name { font-size: 28rpx; font-weight: 500; display: block; }
.role-item-meta { font-size: 22rpx; color: var(--muted-foreground); display: block; }
.role-item-check { font-size: 28rpx; color: var(--primary); flex-shrink: 0; }
.role-item-delete {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--muted-foreground); flex-shrink: 0;
}
.role-add {
  padding: 24rpx; border-radius: 24rpx;
  border: 2rpx dashed rgba(139,92,246,0.4);
  text-align: center; font-size: 28rpx; color: var(--primary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 4: 创建 index.js（首页逻辑）**

```javascript
const app = getApp();
const api = require('../../utils/api');
const storage = require('../../utils/storage');
const { parseMarkdown } = require('../../utils/markdown');

Page({
  data: {
    loading: true,
    yunshiLoading: false,
    aiLoading: false,
    yunshiData: null,
    aiAnalysis: null,
    aiNodes: [],
    paipanData: null,

    // 角色
    roles: [],
    activeRole: null,
    roleDialogVisible: false,

    // 运势
    fortunes: [],
    fortuneDialogVisible: false,
    fortuneDetail: {},

    // 幸运
    luckyColors: [],
    luckyNumbers: [],
    yiList: [],
    jiList: [],

    // 打卡
    checkedToday: false,
    checkInDays: 7,

    // 大运/流年
    dayunList: [],
    liunianList: [],
    currentDayun: null,
    dayunDialogVisible: false,
    dayunDialogData: {},
    dayunAnalysisNodes: [],
    dayunLoading: false,

    // 书签
    bookmarkedIds: []
  },

  onLoad() {
    this.loadRoles();
    this.loadCheckIn();
    this.loadBookmarks();
  },

  onShow() {
    this.loadRoles();
    if (this.data.activeRole && !this.data.yunshiData) {
      this.fetchDailyFortune();
    }
  },

  // ===== 角色管理 =====
  loadRoles() {
    const roles = storage.getJSON('roles') || [];
    const activeId = storage.getItem('active-role-id') || (roles[0]?.id || '');
    const activeRole = roles.find(r => r.id === activeId) || roles[0] || null;
    this.setData({ roles, activeRole });

    if (activeRole && !this.data.yunshiData) {
      this.fetchDailyFortune();
      this.loadPaipan();
    }
  },

  // ===== 每日运势 =====
  async fetchDailyFortune() {
    const role = this.data.activeRole;
    if (!role) return;

    this.setData({ yunshiLoading: true, loading: true });
    try {
      const res = await api.getDailyFortune({
        data: {
          name: role.name || '用户',
          gender: role.gender,
          birthDate: role.birthDate,
          birthTime: role.birthTime,
          calendar: role.calendar || '公历'
        }
      });
      if (res.success) {
        const yi = res.data.yunshi_info;
        const fortunes = [
          { key: '事业', emoji: '💼', score: yi.career_score, iconBg: 'rgba(139,92,246,0.08)' },
          { key: '财运', emoji: '💰', score: yi.wealth_score, iconBg: 'rgba(196,154,60,0.12)' },
          { key: '情感', emoji: '💕', score: yi.love_score, iconBg: 'rgba(217,78,60,0.12)' },
          { key: '人际', emoji: '👥', score: yi.fortune_score, iconBg: 'rgba(74,158,110,0.10)' },
          { key: '情绪', emoji: '😊', score: yi.health_score, iconBg: 'rgba(106,158,217,0.10)' }
        ];

        fortunes.forEach(f => {
          if (f.score >= 80) f.barColor = '#4a9e6e';
          else if (f.score >= 60) f.barColor = '#6a9ed9';
          else if (f.score >= 40) f.barColor = '#d4a84a';
          else f.barColor = '#d94e3c';
        });

        const luckyColors = (yi.lucky_color || '松烟青、鎏金').split('、').map((c, i) => ({
          name: c,
          hex: ['#3a5a6c', '#c9a14a', '#c9c9d1', '#6a9bd1'][i] || '#3a5a6c'
        }));

        const luckyNumbers = (yi.lucky_number || '3、8').split('、');

        this.setData({
          yunshiData: res.data,
          yunshiLoading: false,
          loading: false,
          fortunes,
          luckyColors,
          luckyNumbers,
          yiList: (yi.lucky_yi || '').split('、').filter(Boolean),
          jiList: (yi.lucky_ji || '').split('、').filter(Boolean)
        });
      } else {
        this.setData({ yunshiLoading: false, loading: false });
        this.setDefaultFortunes();
      }
    } catch (err) {
      console.error('每日运势获取失败:', err);
      this.setData({ yunshiLoading: false, loading: false });
      this.setDefaultFortunes();
    }
  },

  setDefaultFortunes() {
    const fortunes = [
      { key: '事业', emoji: '💼', score: 70, barColor: '#6a9ed9', iconBg: 'rgba(139,92,246,0.08)' },
      { key: '财运', emoji: '💰', score: 55, barColor: '#d4a84a', iconBg: 'rgba(196,154,60,0.12)' },
      { key: '情感', emoji: '💕', score: 85, barColor: '#4a9e6e', iconBg: 'rgba(217,78,60,0.12)' },
      { key: '人际', emoji: '👥', score: 72, barColor: '#6a9ed9', iconBg: 'rgba(74,158,110,0.10)' },
      { key: '情绪', emoji: '😊', score: 68, barColor: '#6a9ed9', iconBg: 'rgba(106,158,217,0.10)' }
    ];
    this.setData({
      fortunes,
      luckyColors: [{ name: '松烟青', hex: '#3a5a6c' }, { name: '鎏金', hex: '#c9a14a' }],
      luckyNumbers: ['3', '8'],
      yiList: ['出行', '签约', '会友', '整理'],
      jiList: ['争辩', '动土', '大额消费']
    });
  },

  // ===== 八字排盘 =====
  async loadPaipan() {
    const role = this.data.activeRole;
    if (!role) return;

    // 优先从缓存加载
    const cached = storage.getJSON('last-paipan');
    if (cached && cached.base_info) {
      this.setData({ paipanData: cached });
      this.extractDayunLiunian(cached);
      this.fetchAiAnalysis(cached);
      return;
    }

    try {
      const res = await api.calculateBazi({
        data: {
          name: role.name || '用户',
          gender: role.gender,
          birthDate: role.birthDate,
          birthTime: role.birthTime,
          calendar: role.calendar || '公历'
        }
      });
      if (res.success && res.data) {
        this.setData({ paipanData: res.data });
        storage.setJSON('last-paipan', res.data);
        this.extractDayunLiunian(res.data);
        this.fetchAiAnalysis(res.data);
      }
    } catch (err) {
      console.error('八字排盘失败:', err);
    }
  },

  extractDayunLiunian(paipanData) {
    const dyi = paipanData.dayun_info;
    const birthYear = parseInt((paipanData.base_info?.gongli || '1990').slice(0, 4));
    const currentYear = new Date().getFullYear();

    // 大运列表
    const dayunList = [];
    dyi.big.forEach((gz, i) => {
      const startY = (dyi.big_start_year || [])[i] || birthYear + (dyi.xu_sui?.[i] || i * 10);
      const endY = (dyi.big_end_year || [])[i] || startY + 9;
      const isCurrent = currentYear >= startY && currentYear <= endY;
      dayunList.push({
        age: `${dyi.xu_sui?.[i] || i * 10}-${(dyi.xu_sui?.[i] || i * 10) + 9}`,
        gz,
        note: dyi.big_god?.[i] || '',
        current: isCurrent
      });
    });

    // 当前大运
    const currentDayun = dayunList.find(d => d.current) || null;

    // 流年
    const currentIdx = dayunList.findIndex(d => d.current);
    const liunianKey = `years_info${currentIdx >= 0 ? currentIdx : 0}`;
    const liunianData = dyi[liunianKey] || [];
    const liunianList = liunianData.slice(0, 6).map(y => {
      const m = (y.year_char || '').match(/^(\d+)年（(.+?)·(.+?)）$/);
      const yearNum = m ? parseInt(m[1]) : 0;
      const ganzhi = m ? m[2] : '';
      const shishen = m ? m[3] : '';
      const hints = { '比肩': '同辈助力，宜合作共赢', '劫财': '人际活跃，谨防破财', '食神': '创意迸发，宜学新技能', '伤官': '才思敏捷，注意口舌', '正财': '正财运佳，稳定增长', '偏财': '偏财运旺，机遇与风险并存', '正官': '事业上升，适合晋升', '七杀': '挑战与机遇并存', '正印': '贵人运强，宜进修', '偏印': '深耕专业，独立思考' };
      return {
        year: m ? m[1] : y.year_char,
        ganzhi, shishen,
        isCurrent: yearNum === currentYear,
        hint: shishen ? (hints[shishen] || '运势流转，顺势而为') : ''
      };
    });

    this.setData({ dayunList: dayunList.slice(0, 8), currentDayun, liunianList });
  },

  // ===== AI 分析 =====
  async fetchAiAnalysis(paipanData) {
    if (this.data.aiAnalysis) return;

    // 优先从缓存加载
    const cached = storage.getJSON(`ai-analysis-${this.data.activeRole?.id || 'self'}`);
    if (cached) {
      this.setData({ aiAnalysis: cached, aiNodes: parseMarkdown(cached.dailyComment || '') });
      return;
    }

    this.setData({ aiLoading: true });
    try {
      const di = paipanData.detail_info;
      const res = await api.analyzeFortune({
        data: {
          name: this.data.activeRole?.name || '用户',
          gender: this.data.activeRole?.gender || '男',
          sizhu: `${di.sizhu.year.tg}${di.sizhu.year.dz} ${di.sizhu.month.tg}${di.sizhu.month.dz} ${di.sizhu.day.tg}${di.sizhu.day.dz} ${di.sizhu.hour.tg}${di.sizhu.hour.dz}`,
          careerScore: this.data.yunshiData?.yunshi_info?.career_score,
          wealthScore: this.data.yunshiData?.yunshi_info?.wealth_score,
          loveScore: this.data.yunshiData?.yunshi_info?.love_score
        }
      });
      if (res.success) {
        this.setData({
          aiAnalysis: res.analysis,
          aiNodes: parseMarkdown(res.analysis?.dailyComment || ''),
          aiLoading: false
        });
        storage.setJSON(`ai-analysis-${this.data.activeRole?.id || 'self'}`, res.analysis);
      } else {
        this.setData({ aiLoading: false });
      }
    } catch (err) {
      console.error('AI 分析失败:', err);
      this.setData({ aiLoading: false });
    }
  },

  // ===== 打卡 =====
  loadCheckIn() {
    const last = storage.getItem('checkin-date');
    const today = new Date().toDateString();
    const days = parseInt(storage.getItem('checkin-streak') || '7');
    this.setData({
      checkedToday: last === today,
      checkInDays: days
    });
  },

  onCheckIn() {
    const today = new Date().toDateString();
    if (storage.getItem('checkin-date') === today) return;
    storage.setItem('checkin-date', today);
    const next = this.data.checkInDays + 1;
    storage.setItem('checkin-streak', String(next));
    this.setData({ checkInDays: next, checkedToday: true });
    wx.showToast({ title: `连续打卡 ${next} 天`, icon: 'success' });
  },

  // ===== 书签 =====
  loadBookmarks() {
    const bm = storage.getJSON('bookmarkedPrompts') || [];
    this.setData({ bookmarkedIds: bm });
  },

  // ===== 弹窗交互 =====
  onFortuneDetail(e) {
    const key = e.currentTarget.dataset.key;
    const fortune = this.data.fortunes.find(f => f.key === key);
    if (!fortune) return;
    const yi = this.data.yunshiData?.yunshi_info;
    const descMap = {
      '事业': yi?.career_description,
      '财运': yi?.wealth_description,
      '情感': yi?.love_description,
      '人际': yi?.fortune_description,
      '情绪': yi?.health_description
    };
    this.setData({
      fortuneDialogVisible: true,
      fortuneDetail: { ...fortune, desc: descMap[key] || '' }
    });
  },

  onCloseFortuneDetail() {
    this.setData({ fortuneDialogVisible: false });
  },

  onRoleSwitch() {
    this.setData({ roleDialogVisible: true });
  },

  onCloseRoleDialog() {
    this.setData({ roleDialogVisible: false });
  },

  onSwitchRole(e) {
    const id = e.currentTarget.dataset.id;
    storage.setItem('active-role-id', id);
    this.setData({ roleDialogVisible: false });
    this.setData({ yunshiData: null, aiAnalysis: null, paipanData: null });
    this.loadRoles();
  },

  onDeleteRole(e) {
    const { id, name } = e.currentTarget.dataset;
    if (this.data.roles.length <= 1) {
      wx.showToast({ title: '至少保留一个角色', icon: 'none' });
      return;
    }
    const roles = this.data.roles.filter(r => r.id !== id);
    storage.setJSON('roles', roles);
    wx.showToast({ title: `已删除「${name}」`, icon: 'success' });
    if (this.data.activeRole?.id === id) {
      storage.setItem('active-role-id', roles[0]?.id || '');
    }
    this.loadRoles();
  },

  onDayunDetail(e) {
    const { gz, god, age } = e.currentTarget.dataset;
    this.setData({
      dayunDialogVisible: true,
      dayunDialogData: { gz, god, age },
      dayunAnalysisNodes: [],
      dayunLoading: true
    });
    this.fetchDayunAnalysis(gz, god, age);
  },

  async fetchDayunAnalysis(gz, god, age) {
    try {
      const res = await api.analyzeDayunDetail({
        data: {
          name: this.data.activeRole?.name || '用户',
          gender: this.data.activeRole?.gender || '',
          dayunGz: gz,
          dayunGod: god,
          ageRange: age
        }
      });
      if (res.success) {
        this.setData({
          dayunAnalysisNodes: parseMarkdown(res.analysis),
          dayunLoading: false
        });
      }
    } catch (err) {
      this.setData({ dayunAnalysisNodes: parseMarkdown('暂无法获取分析'), dayunLoading: false });
    }
  },

  onCloseDayunDetail() {
    this.setData({ dayunDialogVisible: false });
  }
});
```

- [ ] **Step 5: 创建 index.json**

```json
{
  "usingComponents": {
    "ui-card": "/components/ui/card/card",
    "ui-skeleton": "/components/ui/skeleton/skeleton",
    "ui-dialog": "/components/ui/dialog/dialog"
  },
  "navigationStyle": "custom"
}
```

---

## Phase 4-13: 剩余 11 个页面

Due to the massive scope of this project, the remaining 11 pages follow the same conversion pattern as Task 5. Each page needs:

### Task 6: 测算页 (pages/divine)
- 公历/农历切换、年/月/日 picker、表单字段、保存角色、生成按钮
- Files: divine.wxml, divine.wxss, divine.js, divine.json

### Task 7: 命盘页 (pages/chart)  
- 四柱网格、五行进度条、大运滚动、流年时间线、神煞、命格标签
- Files: chart.wxml, chart.wxss, chart.js, chart.json

### Task 8: AI 解读页 (pages/reading)
- Markdown 渲染、分维度标签
- Files: reading.wxml, reading.wxss, reading.js, reading.json

### Task 9: AI 对话页 (pages/chat)
- 消息列表、流式 SSE、快捷问题、语音按钮、角色切换条
- Files: chat.wxml, chat.wxss, chat.js, chat.json

### Task 10: 社区页 (pages/community)
- 分类标签、帖子瀑布流、图片网格、发帖弹窗、点赞、图片预览
- Files: community.wxml, community.wxss, community.js, community.json

### Task 11: 商城页 (pages/shop)
- 商品卡片、忌佩提示
- Files: shop.wxml, shop.wxss, shop.js, shop.json

### Task 12: 个人中心页 (pages/profile)
- 用户信息、社交数据、设置列表、关注/粉丝
- Files: profile.wxml, profile.wxss, profile.js, profile.json

### Task 13: 收藏页 (pages/bookmarks)
- 书签列表
- Files: bookmarks.wxml, bookmarks.wxss, bookmarks.js, bookmarks.json

### Task 14: 会员页 (pages/member)
- 会员套餐展示
- Files: member.wxml, member.wxss, member.js, member.json

### Task 15: 用户主页 (pages/user)
- 他人信息展示
- Files: user.wxml, user.wxss, user.js, user.json

### Task 16: 紫微斗数页 (pages/ziwei-chart)
- 紫微命盘图表
- Files: ziwei-chart.wxml, ziwei-chart.wxss, ziwei-chart.js, ziwei-chart.json

### Task 17: 品牌标识 + 认证弹窗组件

**Files:**
- Create: `miniapp/components/brand-mark/brand-mark.wxml`
- Create: `miniapp/components/brand-mark/brand-mark.wxss`
- Create: `miniapp/components/brand-mark/brand-mark.js`
- Create: `miniapp/components/brand-mark/brand-mark.json`
- Create: `miniapp/components/auth-modal/auth-modal.wxml`
- Create: `miniapp/components/auth-modal/auth-modal.wxss`
- Create: `miniapp/components/auth-modal/auth-modal.js`
- Create: `miniapp/components/auth-modal/auth-modal.json`

---

## Phase 14: 集成与验证

### Task 18: TabBar 图标资源

**Files:**
- Create: `miniapp/assets/tab-home.png`
- Create: `miniapp/assets/tab-home-active.png`
- Create: `miniapp/assets/tab-divine.png`
- Create: `miniapp/assets/tab-divine-active.png`
- Create: `miniapp/assets/tab-chat.png`
- Create: `miniapp/assets/tab-chat-active.png`
- Create: `miniapp/assets/tab-community.png`
- Create: `miniapp/assets/tab-community-active.png`
- Create: `miniapp/assets/tab-profile.png`
- Create: `miniapp/assets/tab-profile-active.png`

使用 SVG 内联 data URI 或 Unicode 符号代替图标图片（避免寻找图标资源）。Tab bar 使用 `iconPath` 为空字符串 + 纯文字实现。

### Task 19: 全局 app.json 组件注册

将所有页面级别的公共组件注册到 `app.json` 的 `usingComponents` 中。

### Task 20: 验证检查

- [ ] 在微信开发者工具中打开 `miniapp/` 目录
- [ ] 确认所有 12 个页面编译通过
- [ ] 确认底部 tabBar 5 个标签正常显示和切换
- [ ] 确认页面间路由跳转正常
- [ ] 确认 CSS 变量在真机上正常渲染
- [ ] 确认 storage 读写正常
