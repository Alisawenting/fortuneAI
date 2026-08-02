// 紫微斗数 — Server Functions
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeZiwei } from "@/lib/ziwei/calculator";

export const ziweiInputSchema = z.object({
  name: z.string().optional(),
  gender: z.enum(["男", "女"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/),
  calendar: z.enum(["公历", "农历"]).default("公历"),
  isLeapMonth: z.boolean().default(false),
});

/** 紫微斗数排盘 */
export const calculateZiwei = createServerFn({ method: "POST" })
  .inputValidator(ziweiInputSchema)
  .handler(async ({ data }) => {
    try {
      const result = computeZiwei({
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate,
        birthTime: data.birthTime,
        calendar: data.calendar,
        isLeapMonth: data.isLeapMonth,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { success: true as const, data: result as any };
    } catch (e) {
      return { success: false as const, error: (e as Error).message } as any;
    }
  });
