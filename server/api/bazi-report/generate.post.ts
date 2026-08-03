// POST /api/bazi-report/generate — AI 八字报告
import { getDeepseekConfig } from "@/lib/env.server";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const config = getDeepseekConfig();
    const prompt = `你是"云枢易馆"的AI命理师"枢机"，请为以下用户生成八字分析报告：
称呼：${body.name || "用户"}（${body.gender || ""}）
四柱：${body.sizhuFull || ""}，日柱：${body.rizhu || ""}
格局：${body.zhengge || ""}，喜用神：${body.xiyongshen || ""}
请按以下格式输出：
【命盘总览】两句话概括命盘整体感觉。
【日主解读】解读日柱的性格底色。
【五行与生活】五行配比对生活的影响。
【大运人生】各阶段人生主题。
【神煞趣解】挑2-3个神煞用比喻解释。
【人生锦囊】3-4条具体建议。`;

    const res = await fetch(`${config.apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 3000 }),
    });
    if (!res.ok) throw new Error(`AI 服务异常`);
    const json = await res.json() as any;
    const text = json.choices?.[0]?.message?.content || "";
    const extract = (label: string) => { const m = text.match(new RegExp(`【${label}】\\s*\\n?([\\s\\S]*?)(?=【|$)`)); return m ? m[1].trim() : ""; };
    return { success: true, report: { overview: extract("命盘总览"), rizhuPersonality: extract("日主解读"), wuxingLife: extract("五行与生活"), dayunStory: extract("大运人生"), shenshaFun: extract("神煞趣解"), lifeAdvice: extract("人生锦囊") } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
