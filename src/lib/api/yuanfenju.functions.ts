// yuanfenju API — 所有逻辑内联在 handler 中，无 .server.ts 导入
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getYuanfenjuConfig } from "@/lib/env.server";

export const baziInputSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(["男", "女"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  calendar: z.enum(["公历", "农历"]).default("公历"),
});

function getApiConfig() {
  return getYuanfenjuConfig();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callYuanfenju(endpoint: string, p: Record<string, string | number>): Promise<any> {
  const config = getApiConfig();
  const body = new URLSearchParams();
  body.set("api_key", config.apiKey);
  for (const [k, v] of Object.entries(p)) body.set(k, String(v));

  const res = await fetch(`${config.apiBase}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = await res.json() as any;
  if (json.errcode !== 0) throw new Error(`API ${json.errcode}: ${json.errmsg}`);
  return json.data;
}

function toParams(d: z.infer<typeof baziInputSchema>) {
  const [y, m, day] = d.birthDate.split("-").map(Number);
  const [h, min] = d.birthTime.split(":").map(Number);
  return { name: d.name || "用户", sex: d.gender === "男" ? 0 : 1, type: d.calendar === "农历" ? 0 : 1, year: y, month: m, day, hours: h, minute: min };
}

export const calculateBazi = createServerFn({ method: "POST" })
  .inputValidator(baziInputSchema)
  .handler(async ({ data }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true as const, data: await callYuanfenju("Bazi/paipan", toParams(data)) } as any;
    } catch (e) {
      return { success: false as const, error: (e as Error).message } as any;
    }
  });

export const analyzeBazi = createServerFn({ method: "POST" })
  .inputValidator(baziInputSchema)
  .handler(async ({ data }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true as const, data: await callYuanfenju("Bazi/cesuan", toParams(data)) } as any;
    } catch (e) {
      return { success: false as const, error: (e as Error).message } as any;
    }
  });

export const getDailyFortune = createServerFn({ method: "POST" })
  .inputValidator(baziInputSchema)
  .handler(async ({ data }) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true as const, data: await callYuanfenju("Bazi/yunshi", toParams(data)) } as any;
    } catch (e) {
      return { success: false as const, error: (e as Error).message } as any;
    }
  });
