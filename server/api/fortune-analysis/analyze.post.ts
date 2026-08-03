// POST /api/fortune-analysis/analyze — 运势深度分析
import { getDeepseekConfig } from "@/lib/env.server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const config = getDeepseekConfig();
    const prompt = `你是"云枢易馆"的AI命理师"枢机"。请为以下用户分析今日运势：
称呼：${body.name || "用户"}，性别：${body.gender || ""}
四柱：${body.sizhu || ""}，日柱：${body.rizhu || ""}，格局：${body.zhengge || ""}
当前大运：${body.currentDayun || ""}，当前流年：${body.currentLiunian || ""}
喜用神：${body.xiyongshen || ""}，忌神：${body.jishen || ""}
今日分数：事业${body.careerScore} 财运${body.wealthScore} 情感${body.loveScore} 人际${body.fortuneScore} 健康${body.healthScore}
输出格式：【今日总评】【大运解读】【流年提示】【分维速读】事业：xxx 财运：xxx 情感：xxx 健康：xxx【开运建议】`;

    const res = await fetch(`${config.apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 2000 }),
    });
    if (!res.ok) throw new Error(`AI 服务异常`);
    const json = await res.json() as any;
    const text = json.choices?.[0]?.message?.content || "";
    const extract = (label: string) => { const m = text.match(new RegExp(`【${label}】\\s*\\n?([\\s\\S]*?)(?=【|$)`)); return m ? m[1].trim() : ""; };
    return { success: true, analysis: {
      dailyComment: extract("今日总评"), dayunAnalysis: extract("大运解读"), liunianHint: extract("流年提示"),
      careerHint: (text.match(/事业[：:]\s*(.+)/)?.[1] || ""),
      wealthHint: (text.match(/财运[：:]\s*(.+)/)?.[1] || ""),
      loveHint: (text.match(/情感[：:]\s*(.+)/)?.[1] || ""),
      healthHint: (text.match(/健康[：:]\s*(.+)/)?.[1] || ""),
      luckyAdvice: extract("开运建议"),
    }};
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
