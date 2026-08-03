// POST /api/chat/send — AI 对话
import { getDeepseekConfig } from "@/lib/env.server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const config = getDeepseekConfig();
    const res = await fetch(`${config.apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: `你是"云枢易馆"的AI命理师"枢机"。用通俗易懂的语言解读八字命理，200-400字。` },
          ...((body.history || []).slice(-10).map((m: any) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content }))),
          { role: "user", content: body.message },
        ],
        temperature: 0.7, max_tokens: 1500,
      }),
    });
    if (!res.ok) throw new Error(`AI 服务异常 (${res.status})`);
    const json = await res.json() as any;
    return { success: true, reply: json.choices?.[0]?.message?.content || "" };
  } catch (e: any) {
    return { success: false, error: e.message, reply: "抱歉，AI 服务暂不可用。" };
  }
});
