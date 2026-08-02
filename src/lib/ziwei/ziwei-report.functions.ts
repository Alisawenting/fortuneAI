// DeepSeek 紫微斗数 AI 解读
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDeepseekConfig } from "@/lib/env.server";
import type { ZiweiChartData } from "@/lib/ziwei/types";

function getConfig() { return getDeepseekConfig(); }

async function callDeepseek(messages: { role: string; content: string }[]) {
  const config = getConfig();
  const res = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.7, max_tokens: 3000, stream: false }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`DeepSeek ${res.status}: ${t.slice(0, 200)}`); }
  const json = await res.json() as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content || "";
}

export interface ZiweiReportResult {
  overview: string;         // 命盘总览
  minggongAnalysis: string; // 命宫主星深度解读
  shenggongAnalysis: string; // 身宫解读
  sixiang: string;          // 四化飞星解读
  pattern: string;          // 格局分析
  lifeAdvice: string;       // 人生锦囊
}

const reportInputSchema = z.object({
  name: z.string().default("用户"),
  gender: z.string(),
  chartSummary: z.string(),
});

export const generateZiweiReport = createServerFn({ method: "POST" })
  .inputValidator(reportInputSchema)
  .handler(async ({ data }) => {
    try {
      const prompt = buildReportPrompt(data);
      const reply = await callDeepseek([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ]);
      return { success: true as const, report: parseReport(reply) };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });

const SYSTEM_PROMPT = `你是"云枢易馆"的 AI 命理师"枢机"，精通紫微斗数与八字命理。你能把复杂的紫微斗数命盘讲得像朋友聊天一样通俗易懂。

写作要求：
- 用【】标记段落标题，严格按格式输出
- 像在跟朋友解释一样，用生活化的比喻和日常语言
- 每个紫微术语后面紧跟一句大白话解释
- 积极正向，即使是煞星也要给出建设性提醒
- 每个段落 100-200 字，适合手机阅读
- 语气温暖、接地气，可以适当用「你」拉近距离

输出格式（严格遵循）：

【命盘总览】
（用一两句大白话概括这张命盘给人的整体感觉。说说命宫在哪、主星是什么、五行局是什么，给人什么第一印象。）

【命宫解读】
（深度解读命宫主星的性格底色。主星代表你的核心人格，说说这颗星让人联想到什么样的人，在工作、感情中的自然反应。如有辅星同宫，也一并解读。）

【身宫与后天】
（身宫代表后天发展、中年以后的人生方向。说说身宫主星暗示的后天机遇和需要培养的能力。）

【四化点睛】
（解读生年四化——化禄、化权、化科、化忌分别落在哪一宫，代表什么。用生活中的例子说明。）

【格局初探】
（挑1-2个最明显的命格特点，比如"紫微在午"、"日月反背"等，用通俗的话说明这意味着什么。）

【人生锦囊】
（3-4条具体可执行的人生建议，结合命盘特点。每条要具体、可执行、不玄乎。）`;

function buildReportPrompt(d: z.infer<typeof reportInputSchema>): string {
  return `请为以下用户生成一份通俗易懂的紫微斗数分析报告：

用户：${d.name}（${d.gender}）

📜 紫微斗数命盘：
${d.chartSummary}

请用朋友聊天的方式，为这位用户解读他的命盘。记住：讲人话、打比方、给建议。`;
}

function parseReport(text: string): ZiweiReportResult {
  const extract = (label: string): string => {
    const regex = new RegExp(`【${label}】\\s*\\n?([\\s\\S]*?)(?=【|$)`, "i");
    const m = text.match(regex);
    return m ? m[1].trim() : "";
  };

  return {
    overview: extract("命盘总览"),
    minggongAnalysis: extract("命宫解读"),
    shenggongAnalysis: extract("身宫与后天"),
    sixiang: extract("四化点睛"),
    pattern: extract("格局初探"),
    lifeAdvice: extract("人生锦囊"),
  };
}

/** 将 ZiweiChartData 转为一段可供 AI 阅读的文本摘要 */
export function chartToTextSummary(data: ZiweiChartData, name?: string): string {
  const lines: string[] = [];
  lines.push(`${name || "用户"} · ${data.gender}`);
  lines.push(`公历: ${data.solarDate} · 农历: ${data.lunarDate} · ${data.time}`);
  lines.push(`生肖: ${data.zodiac} · 星座: ${data.sign} · 五行局: ${data.fiveElementsClass}`);
  lines.push(`命主: ${data.soul} · 身主: ${data.body}`);
  lines.push("");

  for (const p of data.palaces) {
    const markers: string[] = [];
    if (p.isBodyPalace) markers.push("身宫");
    if (p.isOriginalPalace) markers.push("来因宫");
    const markerStr = markers.length > 0 ? ` [${markers.join(",")}]` : "";

    const allStars = [...p.majorStars, ...p.minorStars].filter(Boolean);
    const starStr = allStars.length > 0 ? allStars.join("、") : "（空宫）";
    const info = [
      `大限: ${p.decadalRange[0]}-${p.decadalRange[1]}岁`,
      p.changsheng12 ? `长生: ${p.changsheng12}` : "",
    ].filter(Boolean).join(" · ");

    lines.push(`${p.heavenlyStem}${p.earthlyBranch} · ${p.name}${markerStr}: ${starStr}  [${info}]`);
  }

  return lines.join("\n");
}
