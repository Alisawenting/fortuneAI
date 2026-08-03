// POST /api/fortune-analysis/dayun-detail — 单个大运解读
import { getDeepseekConfig } from "@/lib/env.server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const config = getDeepseekConfig();
    const prompt = `你是"云枢易馆"的AI命理师"枢机"。请解读这段十年大运：
用户：${body.name || ""}（${body.gender || ""}），四柱：${body.sizhu || ""}，日柱：${body.rizhu || ""}
格局：${body.zhengge || ""}，喜用神：${body.xiyongshen || ""}
本阶段：${body.ageRange || ""}岁，干支：${body.dayunGz || ""}，十神：${body.dayunGod || ""}
请用150-200字通俗解读这段大运的主题、特点和注意事项。`;

    const res = await fetch(`${config.apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 400 }),
    });
    if (!res.ok) throw new Error(`AI 服务异常`);
    const json = await res.json() as any;
    return { success: true, analysis: json.choices?.[0]?.message?.content || "" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
