// POST /api/ziwei/calculate — 紫微斗数排盘
import { computeZiwei } from "@/lib/ziwei/calculator";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const data = computeZiwei({
      name: body.name, gender: body.gender || "男",
      birthDate: body.birthDate, birthTime: body.birthTime,
      calendar: body.calendar || "公历",
    });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
