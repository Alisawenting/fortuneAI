// POST /api/auth/login — 登录
import * as jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env.server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  // 简化版：用户名即账号，免密登录
  const username = body.username || "用户";
  const token = jwt.sign({ username, id: Date.now() }, getJwtSecret(), { expiresIn: "30d" });
  return { success: true, token, user: { username, displayName: username, avatar: "", isMember: false } };
});
