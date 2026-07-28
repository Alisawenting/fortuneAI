// 会员 & 模拟支付 Server Functions

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { v4 as uuid } from "uuid";

export const MEMBERSHIP_PLANS = {
  monthly: { name: "月卡", price: 28, days: 30, tier: "monthly" },
  quarterly: { name: "季卡", price: 68, days: 90, tier: "quarterly" },
  yearly: { name: "年卡", price: 198, days: 365, tier: "yearly" },
} as const;

export const SINGLE_PRODUCTS = [
  { name: "高阶专属命理报告", price: 39, type: "single_report", desc: "万字深度长报告，含三年大运" },
  { name: "1V1 AI 深度咨询 · 30 分钟", price: 59, type: "single_consult", desc: "围绕一个核心议题深度推演" },
];

export const simulatePayment = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    planType: z.enum(["monthly", "quarterly", "yearly", "single_report", "single_consult"]),
    token: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { getUserIdFromToken } = await import("../auth/auth.functions");
    const { getDb } = await import("../db/connection");
    const { users, orders } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    const userId = await getUserIdFromToken(data.token || null);
    if (!userId) return { success: false as const, error: "请先登录" };

    const db = getDb();
    let amount: number; let days: number | undefined;

    if (data.planType === "single_report" || data.planType === "single_consult") {
      const product = SINGLE_PRODUCTS.find((p) => p.type === data.planType);
      if (!product) return { success: false as const, error: "产品不存在" };
      amount = product.price;
    } else {
      const plan = MEMBERSHIP_PLANS[data.planType];
      amount = plan.price; days = plan.days;
    }

    const orderId = uuid(); const now = Date.now();
    db.insert(orders).values({ id: orderId, userId, productType: data.planType, amount, status: "completed", createdAt: now, completedAt: now }).run();

    if (days) {
      const plan = MEMBERSHIP_PLANS[data.planType as keyof typeof MEMBERSHIP_PLANS];
      const cur = db.select({ memberExpiresAt: users.memberExpiresAt }).from(users).where(eq(users.id, userId)).get();
      const base = cur?.memberExpiresAt && cur.memberExpiresAt > now ? cur.memberExpiresAt : now;
      const expiresAt = base + days * 86400000;
      db.update(users).set({ isMember: true, memberTier: plan.tier, memberExpiresAt: expiresAt }).where(eq(users.id, userId)).run();
      return { success: true as const, order: { id: orderId, amount }, membership: { tier: plan.tier, expiresAt } };
    }
    return { success: true as const, order: { id: orderId, amount } };
  });

export const checkMemberStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ token: z.string().optional() }))
  .handler(async ({ data }) => {
    const { getUserIdFromToken } = await import("../auth/auth.functions");
    const { getDb } = await import("../db/connection");
    const { users } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    const userId = await getUserIdFromToken(data.token || null);
    if (!userId) return { isMember: false, tier: "free" as const };

    const db = getDb();
    const user = db.select({ isMember: users.isMember, memberTier: users.memberTier, memberExpiresAt: users.memberExpiresAt }).from(users).where(eq(users.id, userId)).get();
    if (!user) return { isMember: false, tier: "free" as const };
    if (user.isMember && user.memberExpiresAt && Date.now() > user.memberExpiresAt) { db.update(users).set({ isMember: false }).where(eq(users.id, userId)).run(); return { isMember: false, tier: "free" as const }; }
    return { isMember: user.isMember, tier: user.memberTier as "free" | "monthly" | "quarterly" | "yearly", expiresAt: user.memberExpiresAt };
  });
