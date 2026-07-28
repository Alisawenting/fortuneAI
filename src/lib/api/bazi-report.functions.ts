// DeepSeek 八字分析报告 — 通俗易懂的命盘解读
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDeepseekConfig } from "@/lib/env.server";

function getConfig() { return getDeepseekConfig(); }

async function callDeepseek(messages: { role: string; content: string }[]) {
  const config = getConfig();
  const res = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.7, max_tokens: 3000, stream: false }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`DeepSeek ${res.status}: ${t.slice(0,200)}`); }
  const json = await res.json() as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content || "";
}

const reportInputSchema = z.object({
  name: z.string().default("用户"),
  gender: z.string(),
  sizhuFull: z.string(),       // "年柱：甲寅 月柱：乙卯 日柱：丙辰 时柱：丁巳"
  rizhu: z.string(),           // "丙辰日元"
  zhengge: z.string(),         // 格局
  nayin: z.string(),           // 纳音
  qiyun: z.string(),           // 起运
  shenshaSummary: z.string(),  // 神煞摘要
  dayunSummary: z.string(),    // 大运摘要（十年一运的列表）
  wuxingSummary: z.string(),   // 五行概况
  xiyongshen: z.string(),      // 喜用神
  jishen: z.string(),          // 忌神
  chenggu: z.string(),         // 称骨（如有）
});

export interface BaziReportResult {
  overview: string;        // 命盘总览（通俗版）
  rizhuPersonality: string; // 日主性格解读
  wuxingLife: string;      // 五行与生活
  dayunStory: string;      // 大运人生阶段
  shenshaFun: string;      // 神煞趣解
  lifeAdvice: string;      // 人生锦囊
}

export const generateBaziReport = createServerFn({ method: "POST" })
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

const SYSTEM_PROMPT = `你是"云枢易馆"的 AI 命理师"枢机"，你最大的特点是能把深奥的八字命理讲得像朋友聊天一样通俗易懂。

写作要求：
- 用【】标记段落标题，严格按格式输出
- 像在跟朋友解释一样，用生活化的比喻和日常语言
- 每个命理术语后面紧跟一句大白话解释
- 积极正向，即使是"忌神"也要说成"需要留意的方面"
- 每个段落 100-200 字，适合手机阅读
- 语气温暖、接地气，可以适当用「你」来拉近距离

输出格式（严格遵循）：

【命盘总览】
（用一两句大白话概括这个命盘给人的整体感觉，像在介绍一个人。然后简单说说四柱搭配的特点，用生活中的比喻——比如"像春天的树苗"、"像秋天的果实"这种感觉）

【日主解读】
（解读日柱天干的性格底色。用"你的性格底色是…"开头，然后说这个日主让人联想到什么样的人，在工作、感情中会有什么自然反应。避免术语堆砌，多打比方）

【五行与生活】
（用日常语言说五行配比对生活的影响。哪一行旺、哪一行弱？旺的方面代表你的天赋所在，弱的方面是需要后天培养的。给具体例子：比如木旺的人适合做什么，金弱的人要注意什么）

【大运人生】
（把大运说成人生不同阶段的"主题"。比如"20-30岁是打基础的阶段"、"30-40岁是发光的时候"。每个阶段给一个关键词和一句话建议。不要列干支，要讲感觉）

【神煞趣解】
（挑2-3个最重要的神煞，用有趣的比喻解释。比如天乙贵人就是"人生自带一个贵人buff"，文昌星就是"考试运加持"。让用户觉得神煞不是玄学而是有趣的性格标签）

【人生锦囊】
（3-4条具体可执行的人生建议，基于喜用神和五行。比如"多穿绿色"变成"在办公桌上放一小盆绿植，帮你稳住气场"。每条建议要具体、可执行、不玄乎）`;

function buildReportPrompt(d: z.infer<typeof reportInputSchema>): string {
  return `请为以下用户生成一份通俗易懂的八字分析报告：

📋 基本信息
- 称呼：${d.name}（${d.gender}）

🔮 八字命盘
- 四柱：${d.sizhuFull}
- 日柱：${d.rizhu}
- 格局：${d.zhengge}
- 纳音：${d.nayin}
- 起运时间：${d.qiyun}

⭐ 神煞
${d.shenshaSummary}

📅 大运走势
${d.dayunSummary}

🌿 五行
${d.wuxingSummary}
- 喜用神：${d.xiyongshen || "待分析"}
- 忌神：${d.jishen || "待分析"}

${d.chenggu ? `⚖️ 称骨：${d.chenggu}` : ""}

请用朋友聊天的方式，为这位用户解读他的命盘。记住：讲人话、打比方、给建议。`;
}

function parseReport(text: string): BaziReportResult {
  const extract = (label: string): string => {
    const regex = new RegExp(`【${label}】\\s*\\n?([\\s\\S]*?)(?=【|$)`, "i");
    const m = text.match(regex);
    return m ? m[1].trim() : "";
  };

  return {
    overview: extract("命盘总览"),
    rizhuPersonality: extract("日主解读"),
    wuxingLife: extract("五行与生活"),
    dayunStory: extract("大运人生"),
    shenshaFun: extract("神煞趣解"),
    lifeAdvice: extract("人生锦囊"),
  };
}
