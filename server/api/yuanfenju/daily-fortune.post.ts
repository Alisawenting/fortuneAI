// POST /api/yuanfenju/daily-fortune — 每日运势
import { computeYunshi } from "@/lib/bazi/calculator";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const data = computeYunshi({
      name: body.name || "用户",
      sex: body.gender === "男" ? 1 : 0,
      type: body.calendar === "农历" ? 0 : 1,
      year: body.year, month: body.month, day: body.day,
      hours: body.hours, minute: body.minute,
    });
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
