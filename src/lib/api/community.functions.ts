// 社区帖子 / 评论 / 点赞 Server Functions

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { v4 as uuid } from "uuid";

export const getPosts = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    category: z.string().optional(), page: z.number().min(1).default(1), pageSize: z.number().min(1).max(50).default(20),
  }))
  .handler(async ({ data }) => {
    const { getDb } = await import("../db/connection");
    const { communityPosts, users } = await import("../db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const db = getDb();
    const offset = (data.page - 1) * data.pageSize;
    const where = data.category ? eq(communityPosts.category, data.category) : undefined;

    const rows = db.select({
      id: communityPosts.id, category: communityPosts.category, title: communityPosts.title,
      content: communityPosts.content, images: communityPosts.images,
      likesCount: communityPosts.likesCount, commentsCount: communityPosts.commentsCount,
      createdAt: communityPosts.createdAt, userId: communityPosts.userId,
      username: users.username, displayName: users.displayName, avatar: users.avatar,
    }).from(communityPosts).leftJoin(users, eq(communityPosts.userId, users.id))
      .where(where).orderBy(desc(communityPosts.createdAt)).limit(data.pageSize).offset(offset).all();

    const posts = rows.map((p) => ({
      ...p,
      images: p.images ? (JSON.parse(p.images) as string[]) : [],
    }));

    return { success: true, posts };
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    category: z.enum(["运势心得", "命理科普", "国学知识", "生活感悟"]),
    title: z.string().min(1, "标题不能为空").max(100),
    content: z.string().min(1, "内容不能为空").max(5000),
    images: z.array(z.string()).max(4).optional(),
    token: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { getUserIdFromToken } = await import("../auth/auth.functions");
    const { getDb } = await import("../db/connection");
    const { communityPosts } = await import("../db/schema");

    const userId = await getUserIdFromToken(data.token || null);
    if (!userId) return { success: false as const, error: "请先登录" };

    const id = uuid();
    getDb().insert(communityPosts).values({ id, userId, category: data.category, title: data.title, content: data.content, images: data.images && data.images.length ? JSON.stringify(data.images) : null, createdAt: Date.now() }).run();
    return { success: true as const, postId: id };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string(), token: z.string().optional() }))
  .handler(async ({ data }) => {
    const { getUserIdFromToken } = await import("../auth/auth.functions");
    const { getDb } = await import("../db/connection");
    const { likes, communityPosts } = await import("../db/schema");
    const { eq, and, sql } = await import("drizzle-orm");

    const userId = await getUserIdFromToken(data.token || null);
    if (!userId) return { success: false as const, error: "请先登录" };

    const db = getDb();
    const existing = db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, data.postId))).get();

    if (existing) {
      db.delete(likes).where(eq(likes.id, existing.id)).run();
      db.update(communityPosts).set({ likesCount: sql`${communityPosts.likesCount} - 1` }).where(eq(communityPosts.id, data.postId)).run();
      return { success: true as const, liked: false };
    } else {
      db.insert(likes).values({ id: uuid(), userId, postId: data.postId, createdAt: Date.now() }).run();
      db.update(communityPosts).set({ likesCount: sql`${communityPosts.likesCount} + 1` }).where(eq(communityPosts.id, data.postId)).run();
      return { success: true as const, liked: true };
    }
  });

export const getComments = createServerFn({ method: "GET" })
  .inputValidator(z.object({ postId: z.string() }))
  .handler(async ({ data }) => {
    const { getDb } = await import("../db/connection");
    const { comments, users } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    const result = getDb().select({
      id: comments.id, content: comments.content, createdAt: comments.createdAt,
      userId: comments.userId, username: users.username, displayName: users.displayName, avatar: users.avatar,
    }).from(comments).leftJoin(users, eq(comments.userId, users.id)).where(eq(comments.postId, data.postId)).orderBy(comments.createdAt).all();

    return { success: true, comments: result };
  });

export const addComment = createServerFn({ method: "POST" })
  .inputValidator(z.object({ postId: z.string(), content: z.string().min(1).max(1000), token: z.string().optional() }))
  .handler(async ({ data }) => {
    const { getUserIdFromToken } = await import("../auth/auth.functions");
    const { getDb } = await import("../db/connection");
    const { comments, communityPosts } = await import("../db/schema");
    const { eq, sql } = await import("drizzle-orm");

    const userId = await getUserIdFromToken(data.token || null);
    if (!userId) return { success: false as const, error: "请先登录" };

    const db = getDb();
    const id = uuid();
    db.insert(comments).values({ id, postId: data.postId, userId, content: data.content, createdAt: Date.now() }).run();
    db.update(communityPosts).set({ commentsCount: sql`${communityPosts.commentsCount} + 1` }).where(eq(communityPosts.id, data.postId)).run();
    return { success: true as const, commentId: id };
  });
