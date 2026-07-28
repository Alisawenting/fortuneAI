// 智谱 CogView 文生图 — 八字命理国风风景画
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { getZhipuConfig } from "@/lib/env.server";

function getConfig() { return getZhipuConfig(); }

// 生成智谱 JWT token（自定义 header 需要 sign_type: "SIGN"）
function generateToken(): string {
  const config = getConfig();
  const [id, secret] = config.apiKey.split(".");
  const now = Math.floor(Date.now() / 1000);
  const payload = { api_key: id, exp: now + 3600, timestamp: now };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt as any).sign(payload, secret, {
    algorithm: "HS256",
    header: { alg: "HS256", sign_type: "SIGN" },
  });
}

interface CogViewResponse {
  created: number;
  data: { url: string }[];
}

async function callCogView(prompt: string): Promise<string> {
  const config = getConfig();
  const token = generateToken();
  const res = await fetch(`${config.apiBase}/images/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "glm-image",
      prompt,
      size: "1024x1344",  // 竖幅，适合手机（glm-image 要求长宽为32的整数倍）
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`智谱 API ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = await res.json() as CogViewResponse;
  if (!json.data?.[0]?.url) throw new Error("智谱 API 返回无图片");
  return json.data[0].url;
}

// 输入 schema
const landscapeInputSchema = z.object({
  dominantElement: z.string(),      // 主导五行：木/火/土/金/水
  secondaryElement: z.string(),     // 辅助五行
  scores: z.object({
    wood: z.number(), fire: z.number(), earth: z.number(),
    metal: z.number(), water: z.number(),
  }),
  sizhuStr: z.string(),            // 四柱字符串
  rizhu: z.string(),               // 日柱
  zhengge: z.string(),             // 格局
});

export const generateLandscape = createServerFn({ method: "POST" })
  .inputValidator(landscapeInputSchema)
  .handler(async ({ data }) => {
    try {
      const prompt = buildLandscapePrompt(data);
      const imageUrl = await callCogView(prompt);
      return { success: true as const, imageUrl };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });

// 图片代理 — 绕过 CORS，用于 canvas 导出
export const proxyImage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string() }))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        headers: { "User-Agent": "yunshu-ai/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const base64 = buffer.toString("base64");
      const ct = res.headers.get("content-type") || "image/png";
      return { success: true as const, dataUrl: `data:${ct};base64,${base64}` };
    } catch (e) {
      return { success: false as const, error: (e as Error).message };
    }
  });

// 构建国风山水画提示词
function buildLandscapePrompt(d: z.infer<typeof landscapeInputSchema>): string {
  const dominant = d.dominantElement;
  const secondary = d.secondaryElement;

  // 五行 → 意象映射
  const elementImagery: Record<string, string> = {
    "木": "郁郁葱葱的松林和翠竹，春意盎然，生机勃勃",
    "火": "一轮温暖的红日高悬，晚霞染红天际，远处有枫叶点缀",
    "土": "巍峨雄浑的青山叠嶂，层层梯田，大地厚重沉稳",
    "金": "嶙峋的白石峭壁，山间有矿脉流光，云雾缭绕其间",
    "水": "宽阔的江河蜿蜒流淌，瀑布飞泻，水面如镜倒映天色",
  };

  // 分数高低决定意象浓淡
  const intensityText = (element: string, score: number): string => {
    if (score >= 35) return `${element}元素极为突出，画面中${elementImagery[element] || ""}占据主导视觉`;
    if (score >= 25) return `${element}元素较为明显，${elementImagery[element] || ""}`;
    if (score >= 15) return `${element}元素适度呈现，隐约可见`;
    return `${element}元素若有若无，淡雅点缀`;
  };

  const woodDesc = intensityText("木", d.scores.wood);
  const fireDesc = intensityText("火", d.scores.fire);
  const earthDesc = intensityText("土", d.scores.earth);
  const metalDesc = intensityText("金", d.scores.metal);
  const waterDesc = intensityText("水", d.scores.water);

  return `一幅精美的中国传统水墨山水画（国画风格），竖幅构图，留白适度，有题诗空间。

整体氛围：以「${dominant}」为主基调，「${secondary}」为辅助韵脚。${d.rizhu}之命，格局「${d.zhengge}」。

五行入画：
- ${woodDesc}
- ${fireDesc}
- ${earthDesc}
- ${metalDesc}
- ${waterDesc}

画面要素：前景、中景、远景层次分明。山间有云雾缥缈，画面留白处可题诗落款。整体色调和谐，笔触细腻，有宋代山水画的意境和文人气息。不要出现任何文字、字母或现代元素。`;
}
