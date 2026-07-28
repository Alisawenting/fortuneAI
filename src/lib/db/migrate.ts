import * as fs from "node:fs";
import * as path from "node:path";
import { getDb } from "./connection";
import { users, communityPosts } from "./schema";
import { sql, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { isDev } from "../env.server";

// 创建数据目录
export function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 启动时自动建表
export async function runMigrations() {
  const db = getDb();

  // 使用 Drizzle 的内置建表能力
  // 创建表（如果不存在则创建）
  db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar TEXT,
      is_member INTEGER DEFAULT 0,
      member_expires_at INTEGER,
      member_tier TEXT DEFAULT 'free',
      daily_chat_count INTEGER DEFAULT 0,
      chat_count_date TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS bazi_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      gender TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT NOT NULL,
      birth_place TEXT,
      calendar TEXT DEFAULT '公历',
      avatar TEXT,
      is_active INTEGER DEFAULT 0,
      paipan_data TEXT,
      cesuan_data TEXT,
      yunshi_data TEXT,
      yunshi_date TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS chat_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      profile_id TEXT REFERENCES bazi_profiles(id) ON DELETE SET NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  // 兼容旧库：为 community_posts 补 images 列（幂等，已存在则忽略）
  try { db.run(sql`ALTER TABLE community_posts ADD COLUMN images TEXT`); } catch { /* 列已存在 */ }

  db.run(sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS likes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, post_id)
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_type TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      completed_at INTEGER
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prompt_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, prompt_id)
    )
  `);

  // 插入种子数据（仅当社区帖子为空时；保证广场初始有内容）
  await seedIfEmpty(db);

  console.log("[yunshu] Database migrations completed");
}

async function seedIfEmpty(db: ReturnType<typeof getDb>) {
  try {
    // 仅当社区帖子为空时插入（与用户是否已注册无关，保证广场有内容）
    const existingPosts = db.select().from(communityPosts).all();
    if (existingPosts.length > 0) return;

    const now = Date.now();

    // 确保存在系统作者用户（种子帖子的作者），不存在则创建
    let sysUserId: string;
    const sysUser = db.select().from(users).where(eq(users.username, "yunshu_system")).get();
    if (sysUser) {
      sysUserId = sysUser.id;
    } else {
      sysUserId = uuid();
      db.insert(users).values({
        id: sysUserId,
        username: "yunshu_system",
        passwordHash: "",
        displayName: "云枢小助手",
        avatar: "☁️",
        isMember: true,
        memberTier: "yearly",
        dailyChatCount: 0,
        createdAt: now,
      }).run();
    }

    // 开发环境：额外创建 demo 登录账号（用户名 demo / 密码 test123）
    if (isDev()) {
      const demoExists = db.select().from(users).where(eq(users.username, "demo")).get();
      if (!demoExists) {
        const crypto = await import("node:crypto");
        db.insert(users).values({
          id: uuid(),
          username: "demo",
          passwordHash: crypto.createHash("sha256").update("test123").digest("hex"),
          displayName: "云客",
          avatar: "🌿",
          isMember: false,
          dailyChatCount: 0,
          createdAt: now,
        }).run();
      }
    }

    // 插入示例社区帖子
    const seedPosts = [
      {
        userId: sysUserId,
        category: "运势心得",
        title: "立夏后的第十天，我决定开始练字了",
        content: "今年 AI 解读说我宜「与水相关之事」，没想到坚持研墨临帖一周后，整个人都松了下来。毛笔蘸墨的那一刻，心就静了。推荐给所有五行喜水的朋友。",
        likesCount: 128,
        commentsCount: 24,
      },
      {
        userId: sysUserId,
        category: "命理科普",
        title: "「正印」到底意味着什么？三分钟说清楚",
        content: "很多人一看见正印就以为是考公考编必中，其实它讲的是「被庇护」的能量。印星代表生我者，是贵人、是文书、是母亲般的托举。正印格的人最大的优势不是聪明，而是能被看到。",
        likesCount: 342,
        commentsCount: 56,
      },
      {
        userId: sysUserId,
        category: "生活感悟",
        title: "我把云枢的 AI 短评抄到了晨间日记里",
        content: "不算预言，更像是一面镜子。把它读完再开始一天，心是定的。建议大家都试试，每天早上看一眼今日运势，然后写三行字。一个月后回头看，全是宝藏。",
        likesCount: 87,
        commentsCount: 12,
      },
      {
        userId: sysUserId,
        category: "命理科普",
        title: "五行缺金的人适合做什么工作？",
        content: "金主决断、义气、刚健。缺金并非不好，只是说明你的天赋不在「杀伐果断」这个赛道上。但如果你想知道如何补金：金融、法律、机械、珠宝鉴定都是不错的选择。更重要的是，身边有属金的朋友——他们会给你力量。",
        likesCount: 215,
        commentsCount: 38,
      },
      {
        userId: sysUserId,
        category: "国学知识",
        title: "二十四节气 · 芒种｜有芒之谷可稼种矣",
        content: "芒种二字，「芒」指麦类等有芒植物的收获，「种」指谷黍类作物的播种。这是一个同时关乎收获与播种的节气。命理上，芒种后火气渐旺，宜早起、宜午休、忌熬夜。",
        likesCount: 176,
        commentsCount: 19,
      },
    ];

    let idx = 0;
    for (const post of seedPosts) {
      db.insert(communityPosts).values({
        id: uuid(),
        ...post,
        createdAt: now - idx * 3600000, // 依次早 1 小时，保证排序稳定
      }).run();
      idx++;
    }

    console.log("[yunshu] Seed community posts inserted");
  } catch (err) {
    console.warn("[yunshu] Seed data skipped:", (err as Error).message);
  }
}
