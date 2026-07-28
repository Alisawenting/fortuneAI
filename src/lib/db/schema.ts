import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// ==================== 用户表 ====================
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // uuid
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(), // SHA256 hash
  displayName: text("display_name"),
  avatar: text("avatar"),
  isMember: integer("is_member", { mode: "boolean" }).default(false),
  memberExpiresAt: integer("member_expires_at"), // unix ms
  memberTier: text("member_tier").default("free"), // "free" | "monthly" | "quarterly" | "yearly"
  dailyChatCount: integer("daily_chat_count").default(0),
  chatCountDate: text("chat_count_date"), // YYYY-MM-DD, resets daily
  createdAt: integer("created_at").notNull(),
});

// ==================== 八字档案表 ====================
export const baziProfiles = sqliteTable("bazi_profiles", {
  id: text("id").primaryKey(), // uuid
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  gender: text("gender").notNull(), // "男" | "女"
  birthDate: text("birth_date").notNull(), // YYYY-MM-DD
  birthTime: text("birth_time").notNull(), // HH:mm
  birthPlace: text("birth_place"),
  calendar: text("calendar").default("公历"), // "公历" | "农历"
  avatar: text("avatar"),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  // 缓存的 API 返回数据 (JSON 字符串)
  paipanData: text("paipan_data"),
  cesuanData: text("cesuan_data"),
  yunshiData: text("yunshi_data"),
  yunshiDate: text("yunshi_date"), // 运势缓存日期 YYYY-MM-DD
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// ==================== 聊天历史表 ====================
export const chatHistory = sqliteTable("chat_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  profileId: text("profile_id").references(() => baziProfiles.id, { onDelete: "set null" }),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});

// ==================== 社区帖子表 ====================
export const communityPosts = sqliteTable("community_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // "运势心得" | "命理科普" | "国学知识" | "生活感悟"
  title: text("title").notNull(),
  content: text("content").notNull(),
  images: text("images"), // JSON 字符串数组（base64 图片），可空
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: integer("created_at").notNull(),
});

// ==================== 评论表 ====================
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});

// ==================== 点赞表 ====================
export const likes = sqliteTable(
  "likes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("like_user_post_idx").on(table.userId, table.postId)]
);

// ==================== 订单表（模拟支付） ====================
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productType: text("product_type").notNull(), // "monthly" | "quarterly" | "yearly" | "single_report" | "single_consult"
  amount: real("amount").notNull(), // 元
  status: text("status").notNull().default("pending"), // "pending" | "completed" | "cancelled"
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
});

// ==================== 收藏表 ====================
export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    promptId: text("prompt_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("bookmark_user_prompt_idx").on(table.userId, table.promptId)]
);
