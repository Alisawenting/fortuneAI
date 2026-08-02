// AI 对话 — 简洁版，直接调用 DeepSeek
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDeepseekConfig } from "@/lib/env.server";

function getConfig() { return getDeepseekConfig(); }

async function callDeepseek(messages: { role: string; content: string }[]) {
  const config = getConfig();
  const res = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.7, max_tokens: 1500, stream: false }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`DeepSeek ${res.status}: ${t.slice(0,200)}`); }
  const json = await res.json() as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content || "";
}

function buildPrompt(ctx: Record<string, string>): string {
  const parts = [
    `你是"云枢易馆"的AI命理师"枢机"，精通八字命理与国学文化。`,
    `用户称呼：${ctx.name || ""}`,
    `用户信息：${ctx.sex || ""} · 出生 ${ctx.birthDate || ""} ${ctx.birthTime || ""}`,
    `八字四柱：${ctx.sizhu || "未提供"}`,
    `日柱：${ctx.rizhu || "未提供"}`,
    `格局：${ctx.zhengge || "未提供"}`,
    `喜用神：${ctx.xiyongshen || "未提供"}`,
    `五行：${ctx.wuxing || "未提供"}`,
    `起运：${ctx.qiyun || "未提供"}`,
    `大运：${ctx.currentDayun || "未提供"}`,
    ``,
    `对话规则：`,
    `- 文雅通俗，保留命理的多种可能性`,
    `- 引用用户的八字数据佐证观点（如四柱、格局、喜用神）`,
    `- 结合当前大运和流年给出有针对性的建议`,
    `- 积极正向，提供可操作的建议`,
    `- 200-400字，分段清晰，适合手机阅读`,
    `- 称呼用户为「你」，语气温暖如师长`,
  ];
  return parts.join("\n");
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    message: z.string().min(1),
    history: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
    baziContext: z.object({
      name: z.string().default(""), sex: z.string().default(""),
      birthDate: z.string().default(""), birthTime: z.string().default(""),
      sizhu: z.string().default(""), rizhu: z.string().default(""),
      zhengge: z.string().default(""), qiyun: z.string().default(""),
      currentDayun: z.string().default(""),
      xiyongshen: z.string().default(""), wuxing: z.string().default(""),
    }).default({}),
  }))
  .handler(async ({ data }) => {
    try {
      const system = { role: "system", content: buildPrompt(data.baziContext) };
      const reply = await callDeepseek([system, ...data.history.slice(-10), { role: "user", content: data.message }]);
      return { success: true as const, reply };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });
