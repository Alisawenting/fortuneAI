// 最早期加载 .env 环境变量
import "dotenv/config";
import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { runMigrations } from "./lib/db/migrate";

try { runMigrations(); } catch (err) { console.error("[yunshu] DB migration failed:", err); }

// ── API 路由处理器 ──
async function handleAPI(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const json = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  // 解析 birthDate/birthTime 为 year/month/day/hours/minute
  const parseInput = (b: any) => {
    const [y, m, d] = (b.birthDate || "").split("-").map(Number);
    const [h, min] = (b.birthTime || "").split(":").map(Number);
    return { name: b.name || "用户", sex: b.gender === "男" ? 1 : 0, type: b.calendar === "农历" ? 0 : 1, year: y || 1995, month: m || 1, day: d || 1, hours: h || 0, minute: min || 0 };
  };

  try {
    let body: any = {};
    if (request.method === "POST") {
      try { body = await request.json(); } catch {}
    }

    // === 八字排盘 ===
    if (path === "/api/yuanfenju/calculate" && request.method === "POST") {
      const { computePaipan } = await import("./lib/bazi/calculator");
      const data = computePaipan(parseInput(body));
      return json({ success: true, data });
    }
    if (path === "/api/yuanfenju/cesuan" && request.method === "POST") {
      const { computeCesuan } = await import("./lib/bazi/calculator");
      const data = computeCesuan(parseInput(body));
      return json({ success: true, data });
    }
    if (path === "/api/yuanfenju/daily-fortune" && request.method === "POST") {
      const { computeYunshi } = await import("./lib/bazi/calculator");
      const data = computeYunshi(parseInput(body));
      return json({ success: true, data });
    }

    // === 紫微斗数 ===
    if (path === "/api/ziwei/calculate" && request.method === "POST") {
      const { computeZiwei } = await import("./lib/ziwei/calculator");
      const data = computeZiwei({ name: body.name, gender: body.gender || "男", birthDate: body.birthDate || "1995-08-12", birthTime: body.birthTime || "07:20", calendar: body.calendar || "公历" });
      return json({ success: true, data });
    }

    // === AI 对话 ===
    if (path === "/api/chat/send" && request.method === "POST") {
      const { getDeepseekConfig } = await import("./lib/env.server");
      const config = getDeepseekConfig();
      const history = (body.history || []).slice(-10);
      const messages: any[] = [
        { role: "system", content: "你是\"云枢易馆\"的AI命理师\"枢机\"。用通俗易懂的语言解读八字命理，200-400字。称呼用户为「你」，语气温暖如师长。" },
        ...history.map((m: any) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
        { role: "user", content: body.message || "你好" },
      ];
      const res = await fetch(`${config.apiBase}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.7, max_tokens: 1500 }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = await res.json() as any;
      return json({ success: true, reply: j.choices?.[0]?.message?.content || "" });
    }

    // === AI 命盘报告 ===
    if (path === "/api/bazi-report/generate" && request.method === "POST") {
      const { getDeepseekConfig } = await import("./lib/env.server");
      const config = getDeepseekConfig();
      const prompt = `你是"云枢易馆"的AI命理师"枢机"，请为以下用户生成八字分析报告：
称呼：${body.name || "用户"}，四柱：${body.sizhuFull || ""}，日柱：${body.rizhu || ""}
格局：${body.zhengge || ""}，喜用神：${body.xiyongshen || ""}
输出格式：【命盘总览】【日主解读】【五行与生活】【大运人生】【神煞趣解】【人生锦囊】每个100-200字。`;
      const res = await fetch(`${config.apiBase}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 3000 }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = await res.json() as any;
      const text = j.choices?.[0]?.message?.content || "";
      const ext = (label: string) => { const m = text.match(new RegExp(`【${label}】\\s*\\n?([\\s\\S]*?)(?=【|$)`)); return m ? m[1].trim() : ""; };
      return json({ success: true, report: { overview: ext("命盘总览"), rizhuPersonality: ext("日主解读"), wuxingLife: ext("五行与生活"), dayunStory: ext("大运人生"), shenshaFun: ext("神煞趣解"), lifeAdvice: ext("人生锦囊") } });
    }

    // === 运势分析 ===
    if (path === "/api/fortune-analysis/analyze" && request.method === "POST") {
      const { getDeepseekConfig } = await import("./lib/env.server");
      const config = getDeepseekConfig();
      const prompt = `你是"云枢易馆"的AI命理师"枢机"。请分析运势：用户${body.name||""}，四柱${body.sizhu||""}，日柱${body.rizhu||""}，格局${body.zhengge||""}，喜用神${body.xiyongshen||""}，大运${body.currentDayun||""}，流年${body.currentLiunian||""}。输出：【今日总评】【大运解读】【流年提示】【分维速读】事业：xxx 财运：xxx 情感：xxx 健康：xxx【开运建议】`;
      const res = await fetch(`${config.apiBase}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 2000 }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = await res.json() as any;
      const text = j.choices?.[0]?.message?.content || "";
      const ext = (label: string) => { const m = text.match(new RegExp(`【${label}】\\s*\\n?([\\s\\S]*?)(?=【|$)`)); return m ? m[1].trim() : ""; };
      return json({ success: true, analysis: { dailyComment: ext("今日总评"), dayunAnalysis: ext("大运解读"), liunianHint: ext("流年提示"), careerHint: (text.match(/事业[：:]\s*(.+)/)?.[1]||""), wealthHint: (text.match(/财运[：:]\s*(.+)/)?.[1]||""), loveHint: (text.match(/情感[：:]\s*(.+)/)?.[1]||""), healthHint: (text.match(/健康[：:]\s*(.+)/)?.[1]||""), luckyAdvice: ext("开运建议") } });
    }

    // === 大运详情 ===
    if (path === "/api/fortune-analysis/dayun-detail" && request.method === "POST") {
      const { getDeepseekConfig } = await import("./lib/env.server");
      const config = getDeepseekConfig();
      const prompt = `你是"云枢易馆"的AI命理师"枢机"。解读十年大运：用户${body.name||""}，${body.gender||""}，四柱${body.sizhu||""}，日柱${body.rizhu||""}，格局${body.zhengge||""}，大运${body.ageRange||""}岁 ${body.dayunGz||""} ${body.dayunGod||""}。150-200字`;
      const res = await fetch(`${config.apiBase}/chat/completions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.7, max_tokens: 400 }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = await res.json() as any;
      return json({ success: true, analysis: j.choices?.[0]?.message?.content || "" });
    }

    // === 认证 ===
    if (path === "/api/auth/login" && request.method === "POST") {
      const jwt = await import("jsonwebtoken");
      const { getJwtSecret } = await import("./lib/env.server");
      const username = body.username || "用户";
      const token = jwt.default.sign({ username, id: Date.now() }, getJwtSecret(), { expiresIn: "30d" });
      return json({ success: true, token, user: { username, displayName: username, avatar: "", isMember: false } });
    }
    if (path === "/api/auth/register" && request.method === "POST") {
      const jwt = await import("jsonwebtoken");
      const { getJwtSecret } = await import("./lib/env.server");
      const username = body.username || "用户";
      const token = jwt.default.sign({ username, id: Date.now() }, getJwtSecret(), { expiresIn: "30d" });
      return json({ success: true, token, user: { username, displayName: username, avatar: "", isMember: false } });
    }

    // === 社区 ===
    if (path === "/api/community/posts") return json({ success: true, posts: [] });
    if (path === "/api/community/create-post") return json({ success: true, postId: "p" + Date.now() });
    if (path === "/api/community/toggle-like") return json({ success: true });

    // === 会员 ===
    if (path === "/api/membership/info") return json({ success: true, isMember: false, memberTier: "free" });

    // API 未匹配
    return json({ success: false, error: "Not found" }, 404);
  } catch (e: any) {
    console.error("[yunshu] API error:", path, e.message);
    return json({ success: false, error: e.message }, 500);
  }
}

// ── 主入口 ──
type ServerEntry = { fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response; };
let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then((m) => (m.default ?? m) as ServerEntry);
  }
  return serverEntryPromise;
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleAPI(request);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), { status: 500, headers: { "content-type": "text/html; charset=utf-8" } });
    }
  },
};
