// 八字排盘/测算/运势 — 本地计算引擎 (lunar-typescript + 自建算法)
// 已完全替代缘份居 API，不再依赖外部排盘服务
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computePaipan, computeCesuan, computeYunshi } from "@/lib/bazi/calculator";
import type { BaziInput } from "@/lib/bazi/calculator";

export const baziInputSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(["男", "女"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  calendar: z.enum(["公历", "农历"]).default("公历"),
});

/** 将前端输入转为引擎需要的参数格式 */
function toBaziInput(d: z.infer<typeof baziInputSchema>): BaziInput {
  const [y, m, day] = d.birthDate.split("-").map(Number);
  const [h, min] = d.birthTime.split(":").map(Number);
  return {
    name: d.name || "用户",
    sex: d.gender === "男" ? 1 : 0,
    type: d.calendar === "农历" ? 0 : 1,
    year: y,
    month: m,
    day,
    hours: h,
    minute: min,
  };
}

/** 八字排盘 — 本地计算 */
export const calculateBazi = createServerFn({ method: "POST" })
  .inputValidator(baziInputSchema)
  .handler(async ({ data }) => {
    try {
      const input = toBaziInput(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true as const, data: computePaipan(input) as any };
    } catch (e) {
      return { success: false as const, error: (e as Error).message } as any;
    }
  });

/** 八字测算 — 本地计算 */
export const analyzeBazi = createServerFn({ method: "POST" })
  .inputValidator(baziInputSchema)
  .handler(async ({ data }) => {
    try {
      const input = toBaziInput(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true as const, data: computeCesuan(input) as any };
    } catch (e) {
      return { success: false as const, error: (e as Error).message } as any;
    }
  });

/** 每日运势 — 本地计算 */
export const getDailyFortune = createServerFn({ method: "POST" })
  .inputValidator(baziInputSchema)
  .handler(async ({ data }) => {
    try {
      const input = toBaziInput(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true as const, data: computeYunshi(input) as any };
    } catch (e) {
      return { success: false as const, error: (e as Error).message } as any;
    }
  });
