// DeepSeek API 服务端客户端
// DeepSeek API 兼容 OpenAI chat/completions 格式

import { getDeepseekConfig } from "../env.server";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class DeepseekApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "DeepseekApiError";
  }
}

// 非流式聊天
export async function deepseekChat(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<string> {
  const { apiBase, apiKey } = getDeepseekConfig();

  if (!apiKey) {
    throw new DeepseekApiError("DeepSeek API Key 未配置，请在环境变量中设置 DEEPSEEK_API_KEY");
  }

  const res = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1500,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DeepseekApiError(`DeepSeek API error (${res.status}): ${text.slice(0, 300)}`, res.status);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

// 流式聊天 — 返回 ReadableStream
export async function deepseekChatStream(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<ReadableStream<Uint8Array>> {
  const { apiBase, apiKey } = getDeepseekConfig();

  if (!apiKey) {
    throw new DeepseekApiError("DeepSeek API Key 未配置");
  }

  const res = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1500,
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DeepseekApiError(`DeepSeek API error (${res.status}): ${text.slice(0, 300)}`, res.status);
  }

  if (!res.body) {
    throw new DeepseekApiError("响应体为空，无法流式读取");
  }

  return res.body;
}

// ==================== 系统提示词构建 ====================

export function buildFortuneSystemPrompt(baziContext: {
  sizhu?: string;
  rizhu?: string;
  zhengge?: string;
  xiyongshen?: string;
  jishen?: string;
  wuxing?: string;
  shensha?: string;
  sex?: string;
  birthDate?: string;
}): string {
  const parts = ["你是「云枢易馆」的 AI 命理师「枢机」，精通八字命理、五行生克与国学文化。"];

  if (baziContext.sex && baziContext.birthDate) {
    parts.push(`\n用户信息：${baziContext.sex} · ${baziContext.birthDate}生`);
  }

  if (baziContext.sizhu) {
    parts.push(`\n八字四柱：${baziContext.sizhu}`);
  }

  if (baziContext.rizhu) {
    parts.push(`日主：${baziContext.rizhu}`);
  }

  if (baziContext.zhengge) {
    parts.push(`格局：${baziContext.zhengge}`);
  }

  if (baziContext.xiyongshen) {
    parts.push(`喜用神：${baziContext.xiyongshen}`);
  }

  if (baziContext.jishen && baziContext.jishen !== "金") {
    parts.push(`忌神：${baziContext.jishen}`);
  }

  if (baziContext.wuxing) {
    parts.push(`五行：${baziContext.wuxing}`);
  }

  if (baziContext.shensha) {
    parts.push(`主要神煞：${baziContext.shensha}`);
  }

  parts.push(`
对话规则：
1. 用词文雅但通俗易懂，带一丝古风但不故作高深
2. 对命运的解读保留"可能性"，不用绝对化断言
3. 时常引用八字本身的五行、十神、神煞来佐证观点
4. 积极正向，关注用户的心理感受与情绪
5. 不声称能百分百预测未来，不鼓励迷信行为
6. 回复以自然中文对话语气为主
7. 适当引用国学经典中的句子增加可信度
8. 回答长度控制在 200-400 字，适合手机阅读
9. 遇到心理困扰类问题时，温柔鼓励并建议必要时寻求专业帮助`);

  return parts.join("\n");
}

// 生成推荐问题
export function buildQuickSuggestions(baziContext: {
  zhengge?: string;
  xiyongshen?: string;
  shensha?: string;
}): string[] {
  const base = ["事业抉择", "财运机会", "情绪调节"];
  const contextual: string[] = [];

  if (baziContext.shensha?.includes("桃花")) {
    contextual.push("感情困惑");
  }
  if (baziContext.xiyongshen?.includes("水")) {
    contextual.push("搬家择日", "出行方位");
  }
  if (baziContext.zhengge?.includes("官")) {
    contextual.push("职场晋升", "面试准备");
  }
  if (baziContext.zhengge?.includes("财")) {
    contextual.push("投资建议", "副业方向");
  }

  return [...base, ...contextual].slice(0, 6);
}
