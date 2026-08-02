// DeepSeek 运势分析 — 基于八字排盘结果进行 AI 推理
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDeepseekConfig } from "@/lib/env.server";

function getConfig() { return getDeepseekConfig(); }

async function callDeepseek(messages: { role: string; content: string }[]) {
  const config = getConfig();
  const res = await fetch(`${config.apiBase}/chat/completions`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.7, max_tokens: 2000, stream: false }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(`DeepSeek ${res.status}: ${t.slice(0,200)}`); }
  const json = await res.json() as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content || "";
}

// 运势分析输入
export const fortuneAnalysisInput = z.object({
  // 基本信息
  name: z.string().default("用户"),
  gender: z.string(),
  birthDate: z.string(),
  // 八字四柱
  sizhu: z.string(),           // "乙亥 甲申 乙亥 庚辰"
  rizhu: z.string(),           // "乙亥日元"
  zhengge: z.string(),         // 格局 如"正印格"
  // 大运流年
  currentDayun: z.string(),    // 当前大运干支
  currentDayunGod: z.string(), // 当前大运十神
  currentLiunian: z.string(),  // 当前流年干支
  qiyun: z.string(),           // 起运时间
  // 五行喜用
  xiyongshen: z.string(),      // 喜用神
  jishen: z.string(),          // 忌神
  wuxing: z.string(),          // 五行简述
  // 神煞
  shensha: z.string(),         // 主要神煞
  // 今日运势分数
  careerScore: z.number(),
  wealthScore: z.number(),
  loveScore: z.number(),
  healthScore: z.number(),
  fortuneScore: z.number(),
  // 今日宜忌
  luckyYi: z.string(),
  luckyJi: z.string(),
  luckyColor: z.string(),
  luckyNumber: z.string(),
  luckyDirection: z.string(),
  jixiong: z.string(),
});

export type FortuneAnalysisInput = z.infer<typeof fortuneAnalysisInput>;

export interface FortuneAnalysisResult {
  dailyComment: string;     // 今日总评（200-300字，通俗易懂）
  dayunAnalysis: string;    // 大运解读（150-200字）
  liunianHint: string;      // 流年提示（100-150字）
  careerHint: string;       // 事业一句话
  wealthHint: string;       // 财运一句话
  loveHint: string;         // 情感一句话
  healthHint: string;       // 健康一句话
  luckyAdvice: string;      // 开运建议
}

export const analyzeFortune = createServerFn({ method: "POST" })
  .inputValidator(fortuneAnalysisInput)
  .handler(async ({ data }) => {
    try {
      const prompt = buildFortunePrompt(data);
      const reply = await callDeepseek([
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ]);

      // 解析 DeepSeek 返回的结构化内容
      return { success: true as const, analysis: parseAnalysisReply(reply) };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });

const systemPrompt = `你是"云枢易馆"的资深 AI 命理师"枢机"。你擅长用通俗易懂、温暖如师长般的语言解读八字命理。

输出规范：
- 用【】标记各段落标题
- 语言通俗，避免堆砌术语，每个命理概念都要用生活化的比喻解释
- 积极正向，即使是忌神或低分项，也要给出建设性的化解建议
- 适合手机屏幕阅读，段落短小精悍
- 严格按以下格式输出：

【今日总评】
（200-300字，结合八字四柱、日柱特征、今日运势分数，用生活化语言总评今日整体运势。要点：先点明日柱给用户的性格底色，再结合今日分数说今天适合做什么、注意什么，语气温暖）

【大运解读】
（150-200字，解读当前大运对用户的影响。要点：解释大运干支的含义，这个大运十年间的人生主题，给2-3条具体建议）

【流年提示】
（100-150字，结合当前流年干支和大运关系，给出今年的关键提示）

【分维速读】
事业：xxx
财运：xxx
情感：xxx
健康：xxx

【开运建议】
（50-100字，结合喜用神和今日宜忌，给出1-2个简单可执行的开运小动作）`;

function buildFortunePrompt(d: FortuneAnalysisInput): string {
  // 五维分数转通俗描述
  const scoreLabel = (s: number) => s >= 80 ? "很旺" : s >= 60 ? "平稳" : s >= 40 ? "稍低" : "需注意";

  return `请为以下用户进行今日运势 AI 分析：

📋 基本信息
- 称呼：${d.name}
- 性别：${d.gender} · 出生：${d.birthDate}

🔮 八字命盘
- 四柱：${d.sizhu}
- 日柱：${d.rizhu}
- 格局：${d.zhengge}
- 喜用神：${d.xiyongshen || "未分析"}
- 忌神：${d.jishen || "未分析"}
- 五行：${d.wuxing || "未分析"}
- 神煞：${d.shensha || "无"}
- 起运：${d.qiyun || "未分析"}

📅 大运流年
- 当前大运：${d.currentDayun}（${d.currentDayunGod || ""}）
- 当前流年：${d.currentLiunian}

📊 今日运势指数（0-100）
- 事业：${d.careerScore}分（${scoreLabel(d.careerScore)}）
- 财运：${d.wealthScore}分（${scoreLabel(d.wealthScore)}）
- 情感：${d.loveScore}分（${scoreLabel(d.loveScore)}）
- 人际：${d.fortuneScore}分（${scoreLabel(d.fortuneScore)}）
- 健康：${d.healthScore}分（${scoreLabel(d.healthScore)}）
- 吉凶：${d.jixiong || "平"}

📝 今日宜忌
- 宜：${d.luckyYi}
- 忌：${d.luckyJi}
- 幸运色：${d.luckyColor}
- 幸运数字：${d.luckyNumber}
- 吉利方位：${d.luckyDirection}`;
}

function parseAnalysisReply(text: string): FortuneAnalysisResult {
  const extract = (label: string): string => {
    const regex = new RegExp(`【${label}】\\s*\\n?([\\s\\S]*?)(?=【|$)`, "i");
    const m = text.match(regex);
    return m ? m[1].trim() : "";
  };

  const dailyComment = extract("今日总评");
  const dayunAnalysis = extract("大运解读");
  const liunianHint = extract("流年提示");
  const speedRead = extract("分维速读");
  const luckyAdvice = extract("开运建议");

  // 解析分维速读
  const careerHint = speedRead.match(/事业[：:]\s*(.+)/)?.[1] || "";
  const wealthHint = speedRead.match(/财运[：:]\s*(.+)/)?.[1] || "";
  const loveHint = speedRead.match(/情感[：:]\s*(.+)/)?.[1] || "";
  const healthHint = speedRead.match(/健康[：:]\s*(.+)/)?.[1] || "";

  return { dailyComment, dayunAnalysis, liunianHint, careerHint, wealthHint, loveHint, healthHint, luckyAdvice };
}

// ── 单个大运详细解读 ──

export const analyzeDayunDetail = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().default("用户"),
    gender: z.string(),
    dayunGz: z.string(),          // 大运干支
    dayunGod: z.string(),         // 大运十神
    ageRange: z.string(),         // 年龄范围
    rizhu: z.string(),            // 日柱
    zhengge: z.string(),          // 格局
    xiyongshen: z.string(),       // 喜用神
    sizhu: z.string(),            // 四柱
  }))
  .handler(async ({ data }) => {
    try {
      const prompt = `你是"云枢易馆"的AI命理师"枢机"。请为以下用户解读其人生的一个十年大运阶段。

📋 基本信息
- 称呼：${data.name}（${data.gender}）
- 四柱：${data.sizhu}
- 日柱：${data.rizhu}
- 格局：${data.zhengge}
- 喜用神：${data.xiyongshen}

📅 本阶段大运
- 年龄：${data.ageRange}
- 干支：${data.dayunGz}
- 十神：${data.dayunGod}

请用通俗易懂的语言（150-200字），像朋友聊天一样解读这段大运。要点：
1. 这个十年的人生主题是什么
2. 事业/财运/情感方面的特点
3. 需要注意什么、如何把握
4. 语气温暖积极，避免吓人的说法`;

      const config = getConfig();
      const res = await fetch(`${config.apiBase}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 400 }),
      });
      if (!res.ok) throw new Error(`DeepSeek ${res.status}`);
      const json = await res.json() as { choices?: { message?: { content?: string } }[] };
      const reply = json.choices?.[0]?.message?.content || "";
      return { success: true as const, analysis: reply };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });
