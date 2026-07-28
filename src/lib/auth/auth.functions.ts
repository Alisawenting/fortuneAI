// 用户认证 Server Functions

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { v4 as uuid } from "uuid";

// getUserIdFromToken 是内部辅助函数，仅在 handler 内使用
export async function getUserIdFromToken(token?: string | null): Promise<string | null> {
  if (!token) return null;
  const { getJwtSecret } = await import("../env.server");
  const jwt = await import("jsonwebtoken");
  try {
    const payload = jwt.default.verify(token, getJwtSecret()) as { userId: string };
    return payload.userId || null;
  } catch { return null; }
}

export const register = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    username: z.string().min(2, "用户名至少2个字符").max(30),
    password: z.string().min(6, "密码至少6个字符").max(100),
    displayName: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { getDb } = await import("../db/connection");
    const { users } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");
    const { getJwtSecret } = await import("../env.server");
    const crypto = await import("node:crypto");
    const jwt = await import("jsonwebtoken");

    const db = getDb();
    const existing = db.select({ id: users.id }).from(users).where(eq(users.username, data.username)).get();
    if (existing) return { success: false as const, error: "用户名已存在" };

    const id = uuid();
    const pwHash = crypto.default.createHash("sha256").update(data.password + "yunshu-salt").digest("hex");
    db.insert(users).values({ id, username: data.username, passwordHash: pwHash, displayName: data.displayName || data.username, createdAt: Date.now() }).run();

    const token = jwt.default.sign({ userId: id }, getJwtSecret(), { expiresIn: "30d" });
    return { success: true as const, token, user: { id, username: data.username, displayName: data.displayName || data.username } };
  });

export const login = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string(), password: z.string() }))
  .handler(async ({ data }) => {
    const { getDb } = await import("../db/connection");
    const { users } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");
    const { getJwtSecret } = await import("../env.server");
    const crypto = await import("node:crypto");
    const jwt = await import("jsonwebtoken");

    const db = getDb();
    const user = db.select().from(users).where(eq(users.username, data.username)).get();
    if (!user) return { success: false as const, error: "用户名或密码错误" };

    const pwHash = crypto.default.createHash("sha256").update(data.password + "yunshu-salt").digest("hex");
    if (pwHash !== user.passwordHash) return { success: false as const, error: "用户名或密码错误" };

    const token = jwt.default.sign({ userId: user.id }, getJwtSecret(), { expiresIn: "30d" });
    return { success: true as const, token, user: { id: user.id, username: user.username, displayName: user.displayName, isMember: user.isMember } };
  });

export const getCurrentUser = createServerFn({ method: "GET" })
  .inputValidator(z.object({ token: z.string().optional() }))
  .handler(async ({ data }) => {
    if (!data.token) return null;
    const userId = await getUserIdFromToken(data.token);
    if (!userId) return null;
    const { getDb } = await import("../db/connection");
    const { users } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    const db = getDb();
    const user = db.select({
      id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar,
      isMember: users.isMember, memberExpiresAt: users.memberExpiresAt, memberTier: users.memberTier,
      dailyChatCount: users.dailyChatCount, chatCountDate: users.chatCountDate, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, userId)).get();
    return user || null;
  });
