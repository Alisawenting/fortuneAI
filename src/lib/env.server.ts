// 服务端环境变量管理 — 无副作用导入（安全用于 tree-shaking）
// 不要在模块顶层调用 dotenv/config！改为惰性初始化

import * as fs from "node:fs";
import * as path from "node:path";

let _loaded = false;

function ensureEnvLoaded() {
  if (_loaded) return;
  _loaded = true;

  // 尝试在项目根目录找 .env 文件
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  for (const envPath of candidates) {
    try {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
      console.log("[yunshu] .env loaded from:", envPath);
      return;
    } catch {
      // 该路径不存在，尝试下一个
    }
  }
}

export function getEnv(key: string, fallback?: string): string {
  ensureEnvLoaded();
  const val = process.env[key];
  if (val !== undefined && val !== "") return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${key}`);
}

/** 缘份居 API 配置（可选 — 本地引擎已替代，仅作 fallback） */
export function getYuanfenjuConfig() {
  return {
    apiKey: getEnv("YUANFENJU_API_KEY", ""),
    apiBase: getEnv("YUANFENJU_API_BASE", "https://api.yuanfenju.com/index.php/v1/"),
  };
}

export function getDeepseekConfig() {
  return {
    apiKey: getEnv("DEEPSEEK_API_KEY", ""),
    apiBase: getEnv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1"),
  };
}

export function getJwtSecret(): string {
  return getEnv("JWT_SECRET", "yunshu-dev-secret-change-in-production");
}

export function getDatabasePath(): string {
  return getEnv("DATABASE_PATH", "./data/yunshu.db");
}

export function getNodeEnv(): string {
  return getEnv("NODE_ENV", "development");
}

export function getZhipuConfig() {
  return {
    apiKey: getEnv("ZHIPU_API_KEY", ""),
    apiBase: getEnv("ZHIPU_API_BASE", "https://open.bigmodel.cn/api/paas/v4"),
  };
}

export function isDev(): boolean {
  return getNodeEnv() === "development";
}
